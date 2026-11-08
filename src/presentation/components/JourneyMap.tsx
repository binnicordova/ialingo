import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import type { JourneyUnit } from '@/domain/curriculum/journey';
import { levelInfo } from '@/domain/curriculum/levels';
import { tapFeedbackAtom } from '@/state/actions';
import { contentAtom } from '@/state/core';
import { activePetAtom, journeyAtom } from '@/state/selectors';

import { EmojiArt } from '../art/EmojiArt';
import { PetPortrait } from '../art/PetPortrait';
import { useCalm } from '../hooks/use-calm';
import { usePathLessons } from '../hooks/use-path-lessons';
import { useT } from '../i18n/use-t';
import { colors, radii, shade, shadow, spacing, tint } from '../theme/tokens';
import { JumpSheet } from './JumpSheet';
import { LessonPath, nodeCenterY, pathHeight, type PathPet } from './LessonPath';
import { AppText } from './ui';

/** Map geometry (dp). Every row has a fixed height, so the list is virtualized. */
const BANNER = 84;
const DIVIDER = 64;
const LEVEL_CARD = 72;
/** The list starts below the floating banner; every map position below is in scroll coordinates. */
const LIST_TOP = BANNER + spacing.md;

function headerHeight(unit: JourneyUnit, index: number): number {
  if (index === 0) return 0;
  return DIVIDER + (unit.startsLevel ? LEVEL_CARD : 0);
}

function unitHeight(unit: JourneyUnit, index: number): number {
  return headerHeight(unit, index) + pathHeight(unit.steps.length);
}

/**
 * The home map: every world and every lesson on one winding path (Duolingo's
 * single map). A banner at the top names the world on screen and opens its
 * guide; thin dividers separate worlds and a card starts each level; locked
 * worlds start with a "Jump here?" node; a floating button brings the
 * current lesson back into view.
 */
export function JourneyMap() {
  const journey = useAtomValue(journeyAtom);
  const pet = useAtomValue(activePetAtom);
  const calm = useCalm();
  const listRef = useRef<FlatList<JourneyUnit>>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [jumpTarget, setJumpTarget] = useState<JourneyUnit | null>(null);
  const [viewport, setViewport] = useState(0);
  /** Only what the scroll position changes on screen: the banner's world and the "back" button. */
  const [view, setView] = useState(() => ({
    // The map opens on the current world, so the banner starts there too.
    bannerIndex: Math.max(0, journey.units.findIndex((u) => u.world.id === journey.current?.worldId)),
    currentVisible: true,
    currentAbove: false,
  }));
  const scrolledToCurrent = useRef(false);

  const { units } = journey;
  const layout = useMemo(() => {
    const offsets: number[] = [];
    const waves: number[] = [];
    let offset = LIST_TOP;
    let steps = 0;
    units.forEach((unit, i) => {
      offsets.push(offset);
      waves.push(steps);
      offset += unitHeight(unit, i);
      steps += unit.steps.length;
    });
    return { offsets, waves, total: offset };
  }, [units]);

  const currentWorldId = journey.current?.worldId;
  const currentLessonId = journey.current?.lessonId;
  const currentIndex = units.findIndex((u) => u.world.id === currentWorldId);
  /** Where the current lesson is on the map: its node, and the top of its world. */
  const current = useMemo(() => {
    const index = units.findIndex((u) => u.world.id === currentWorldId);
    const unit = units[index];
    if (!unit) return null;
    const step = unit.steps.findIndex((s) => s.plan.id === currentLessonId);
    const unitTop = layout.offsets[index] ?? LIST_TOP;
    return { y: unitTop + headerHeight(unit, index) + nodeCenterY(Math.max(0, step)), unitTop };
  }, [units, currentWorldId, currentLessonId, layout]);

  /** What a scroll position shows: the banner's world and whether the current lesson is on screen. */
  const updateView = useCallback(
    (y: number) => {
      // The banner names the world under it: the last one whose top has reached the banner's lower edge.
      let bannerIndex = 0;
      layout.offsets.forEach((offset, i) => {
        if (offset <= y + BANNER) bannerIndex = i;
      });
      const currentVisible = current === null || (current.y - BANNER > y && current.y < y + viewport - 40);
      const currentAbove = current !== null && current.y < y;
      setView((prev) =>
        prev.bannerIndex === bannerIndex && prev.currentVisible === currentVisible && prev.currentAbove === currentAbove
          ? prev
          : { bannerIndex, currentVisible, currentAbove },
      );
    },
    [layout, current, viewport],
  );

  /** Brings the current lesson into view: about 40% down, and never before its world's divider. */
  const scrollToCurrent = useCallback(
    (animated: boolean) => {
      if (current === null || viewport === 0) return;
      const offset = Math.max(0, current.y - viewport * 0.4, current.unitTop - BANNER);
      listRef.current?.scrollToOffset({ offset, animated });
      updateView(offset);
    },
    [current, viewport, updateView],
  );

  // Open the map on the current lesson, once.
  useEffect(() => {
    if (scrolledToCurrent.current || viewport === 0 || current === null) return;
    scrolledToCurrent.current = true;
    const frame = requestAnimationFrame(() => scrollToCurrent(false));
    return () => cancelAnimationFrame(frame);
  }, [viewport, current, scrollToCurrent]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => updateView(e.nativeEvent.contentOffset.y);
  const bannerUnit = units[view.bannerIndex];

  const petLook = useMemo<PathPet | null>(
    () => (pet ? { blueprint: pet.species.blueprint, stage: pet.stage } : null),
    [pet],
  );
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<JourneyUnit>) => (
      <UnitSection
        unit={item}
        index={index}
        waveOffset={layout.waves[index] ?? 0}
        pet={item.world.id === currentWorldId ? petLook : null}
        openId={openId}
        onOpenChange={setOpenId}
        onJump={setJumpTarget}
      />
    ),
    [layout, currentWorldId, petLook, openId],
  );

  return (
    <View style={styles.root} onLayout={(e: LayoutChangeEvent) => setViewport(e.nativeEvent.layout.height)}>
      <FlatList
        ref={listRef}
        data={units}
        keyExtractor={(unit) => unit.world.id}
        renderItem={renderItem}
        extraData={`${openId}|${currentLessonId}`}
        getItemLayout={(_, index) => ({
          length: unitHeight(units[index] as JourneyUnit, index),
          offset: layout.offsets[index] ?? LIST_TOP,
          index,
        })}
        // Draw the current world first (no blank map while it jumps there), then fine-tune the offset.
        initialScrollIndex={Math.max(0, currentIndex)}
        initialNumToRender={3}
        windowSize={5}
        onScroll={onScroll}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
      {bannerUnit ? <UnitBanner unit={bannerUnit} /> : null}
      {!view.currentVisible && current !== null ? (
        <Animated.View entering={calm ? undefined : ZoomIn.springify()} style={styles.fabWrap}>
          <BackToCurrent up={view.currentAbove} onPress={() => scrollToCurrent(true)} />
        </Animated.View>
      ) : null}
      {jumpTarget ? <JumpSheet unit={jumpTarget} onClose={() => setJumpTarget(null)} /> : null}
    </View>
  );
}

const UnitSection = memo(function UnitSection({
  unit,
  index,
  waveOffset,
  pet,
  openId,
  onOpenChange,
  onJump,
}: {
  unit: JourneyUnit;
  index: number;
  waveOffset: number;
  pet: PathPet | null;
  openId: string | null;
  onOpenChange: (id: string | null) => void;
  onJump: (unit: JourneyUnit) => void;
}) {
  const { l } = useT();
  const { lessons, mascot } = usePathLessons(unit);
  const { world } = unit;
  const level = levelInfo(world.level);
  return (
    <View style={{ height: unitHeight(unit, index) }}>
      {index > 0 && unit.startsLevel ? (
        <View style={[styles.levelCard, { backgroundColor: level.color }]}>
          <AppText variant="heading" color="#FFFFFF">
            {level.emoji} {l(level.title)}
          </AppText>
          <AppText variant="small" color="#FFFFFF">
            {level.cefr}
          </AppText>
        </View>
      ) : null}
      {index > 0 ? (
        <View style={styles.divider} accessibilityRole="header">
          <View style={styles.dividerLine} />
          <EmojiArt emoji={world.emoji} size={24} />
          <AppText variant="body" color={unit.unlocked ? colors.inkSoft : colors.muted} numberOfLines={1}>
            {l(world.title)}
          </AppText>
          <View style={styles.dividerLine} />
        </View>
      ) : null}
      <LessonPath
        lessons={lessons}
        color={world.color}
        pet={pet}
        mascot={mascot}
        waveOffset={waveOffset}
        onJump={unit.canJump ? () => onJump(unit) : undefined}
        openId={openId}
        onOpenChange={onOpenChange}
      />
    </View>
  );
});

/** The world on screen: its level and number, its title, its pet, and its guide (words and greeting). */
function UnitBanner({ unit }: { unit: JourneyUnit }) {
  const { t, l } = useT();
  const content = useAtomValue(contentAtom);
  const feedback = useSetAtom(tapFeedbackAtom);
  const calm = useCalm();
  const { world } = unit;
  const species = content.species(world.rewardSpeciesId);
  const level = levelInfo(world.level);
  const edge = shade(world.color, 0.22);
  return (
    <Animated.View
      key={world.id}
      entering={calm ? undefined : FadeIn.duration(160)}
      style={[styles.banner, shadow, { backgroundColor: world.color, borderBottomColor: edge }]}
    >
      <View style={styles.bannerText}>
        <AppText variant="tiny" color={shade(world.color, 0.62)} style={styles.bannerLabel} numberOfLines={1}>
          {t('unitLabel', { level: l(level.title), n: unit.position })}
        </AppText>
        <View style={styles.bannerTitle}>
          <EmojiArt emoji={world.emoji} size={26} />
          <AppText variant="heading" numberOfLines={2} style={styles.bannerName}>
            {l(world.title)}
          </AppText>
        </View>
      </View>
      {species ? <PetPortrait blueprint={species.blueprint} stage="grown" size={46} silhouette={!unit.unlocked} /> : null}
      <Pressable
        testID="banner-guide"
        accessibilityRole="button"
        accessibilityLabel={t('guidebook')}
        onPress={() => {
          feedback();
          router.push({ pathname: '/world/[worldId]', params: { worldId: world.id } });
        }}
        style={({ pressed }) => [styles.guideButton, { borderLeftColor: edge, opacity: pressed ? 0.7 : 1 }]}
      >
        <EmojiArt emoji="📖" size={30} />
      </Pressable>
    </Animated.View>
  );
}

function BackToCurrent({ up, onPress }: { up: boolean; onPress: () => void }) {
  const { t } = useT();
  const feedback = useSetAtom(tapFeedbackAtom);
  return (
    <Pressable
      testID="map-back-to-current"
      accessibilityRole="button"
      accessibilityLabel={t('backToLesson')}
      onPress={() => {
        feedback();
        onPress();
      }}
      style={({ pressed }) => [styles.fab, shadow, { transform: [{ translateY: pressed ? 3 : 0 }] }]}
    >
      <EmojiArt emoji={up ? '⬆️' : '⬇️'} size={30} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingTop: LIST_TOP, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  banner: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: BANNER - spacing.sm,
    borderRadius: radii.lg,
    borderBottomWidth: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  bannerText: { flex: 1, gap: 2 },
  bannerLabel: { fontFamily: 'Fredoka_700Bold', letterSpacing: 0.6, textTransform: 'uppercase' },
  bannerTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bannerName: { flex: 1, fontSize: 19, lineHeight: 22 },
  guideButton: {
    alignSelf: 'stretch',
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 2,
  },
  divider: { height: DIVIDER, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: 2, borderRadius: 1, backgroundColor: tint(colors.muted, 0.5) },
  levelCard: {
    height: LEVEL_CARD - spacing.md,
    marginTop: spacing.md,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  fabWrap: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
  fab: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.border,
    borderBottomWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
