import { router } from 'expo-router';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { levelInfo } from '@/domain/curriculum/levels';
import { contentAtom } from '@/state/core';
import { activePetAtom, berriesAtom, journeyUnitFor } from '@/state/selectors';

import { CharacterAvatar } from '../art/CharacterAvatar';
import { EmojiArt } from '../art/EmojiArt';
import { SectionTitle, SpeechBubble } from '../components/game';
import { LessonPath } from '../components/LessonPath';
import { AppText, BerryPill, Pill, Screen, TopBar } from '../components/ui';
import { usePathLessons } from '../hooks/use-path-lessons';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { colors, radii, shadow, spacing, tint } from '../theme/tokens';

/** One world: the guide's welcome, the lesson path, and a word gallery to explore. */
export function WorldScreen({ worldId }: { worldId: string }) {
  const { t, l } = useT();
  const content = useAtomValue(contentAtom);
  const berries = useAtomValue(berriesAtom);
  const unitAtom = useMemo(() => journeyUnitFor(worldId), [worldId]);
  const unit = useAtomValue(unitAtom);
  const { lessons, mascot } = usePathLessons(unit);
  const pet = useAtomValue(activePetAtom);
  const [openId, setOpenId] = useState<string | null>(null);
  const { native, english } = useSpeak();
  const [talking, setTalking] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const pathTop = useRef(0);
  const scrolled = useRef(false);
  // Bring the next lesson into view once (below the guide, not at the very top).
  const onCurrentY = useCallback((y: number) => {
    if (scrolled.current) return;
    scrolled.current = true;
    const target = pathTop.current + y - 260;
    if (target > 0) setTimeout(() => scrollRef.current?.scrollTo({ y: target, animated: true }), 450);
  }, []);

  const world = content.world(worldId);
  const guide = world ? content.character(world.guideId) : undefined;

  useEffect(() => {
    if (!guide) return;
    const timer = setTimeout(() => {
      setTalking(true);
      native(l(guide.greeting), guide, () => setTalking(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [guide, native, l]);

  if (!world) return <Screen>{null}</Screen>;

  return (
    <Screen background={tint(world.color, 0.8)}>
      <TopBar title={`${world.emoji} ${l(world.title)}`} onBack={() => router.back()} right={<BerryPill amount={berries} />} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        {guide ? (
          <Pressable
            style={styles.guideRow}
            accessibilityRole="button"
            accessibilityLabel={guide.name}
            onPress={() => {
              setTalking(true);
              native(l(guide.greeting), guide, () => setTalking(false));
            }}
          >
            <CharacterAvatar look={guide.look} size={110} talking={talking} />
            <SpeechBubble style={styles.bubble}>
              <AppText variant="small" color={colors.inkSoft}>
                {guide.name}
              </AppText>
              <AppText variant="body">{l(guide.greeting)}</AppText>
            </SpeechBubble>
          </Pressable>
        ) : null}

        <View style={styles.levelRow}>
          <Pill
            label={`${levelInfo(world.level).emoji} ${l(levelInfo(world.level).title)} · ${levelInfo(world.level).cefr}`}
            color={levelInfo(world.level).color}
          />
        </View>

        <View onLayout={(e) => (pathTop.current = e.nativeEvent.layout.y)}>
          <LessonPath
            lessons={lessons}
            color={world.color}
            pet={pet ? { blueprint: pet.species.blueprint, stage: pet.stage } : null}
            mascot={mascot}
            openId={openId}
            onOpenChange={setOpenId}
            onCurrentY={onCurrentY}
          />
        </View>

        <SectionTitle>{t('wordsInWorld')}</SectionTitle>
        <View style={styles.words}>
          {world.words.map((word) => (
            <Pressable
              key={word.id}
              accessibilityRole="button"
              accessibilityLabel={word.en}
              onPress={() => english(word.en)}
              style={({ pressed }) => [styles.wordChip, shadow, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
            >
              <EmojiArt emoji={word.emoji} size={44} />
              <AppText variant="small" center numberOfLines={1}>
                {word.en}
              </AppText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bubble: { flex: 1 },
  levelRow: { flexDirection: 'row' },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  wordChip: {
    width: '30.5%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
});
