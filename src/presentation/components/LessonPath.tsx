import { router } from 'expo-router';
import { useSetAtom } from 'jotai';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import type { PetBlueprint } from '@/domain/pets/species';
import type { GrowthStage } from '@/domain/pets/leveling';
import { tapFeedbackAtom } from '@/state/actions';
import type { JourneyStep } from '@/domain/curriculum/journey';

import { EmojiArt, EmojiRow } from '../art/EmojiArt';
import { PetPortrait } from '../art/PetPortrait';
import { useCalm } from '../hooks/use-calm';
import { lessonTitle, LESSON_KIND_ICON } from '../i18n/labels';
import { useT } from '../i18n/use-t';
import { colors, radii, shade, shadow, spacing, tint } from '../theme/tokens';
import { AppText, BigButton, StarRow } from './ui';

/** Path geometry (dp): node size, row height and the sideways wave. */
const NODE = 76;
const BOSS_NODE = 92;
const ROW = 136;
const WAVE = [0, 62, 92, 62, 0, -62, -92, -62] as const;
const TOP = BOSS_NODE / 2 + spacing.xl;
/** Tallest lesson card (title, words, button): it opens below a node, or above when it would not fit. */
const POPOVER_MAX = 236;
const MASCOT = 112;

export interface PathLesson {
  /** The plan and its status, from the domain journey. */
  readonly step: JourneyStep;
  /** Emoji of the words it teaches (learn lessons). */
  readonly wordsEmoji: string;
  /** A short subtitle (the story's title). */
  readonly subtitle?: string;
  /** Art next to the node (the boss's egg). */
  readonly reward?: ReactNode;
}

export interface PathPet {
  readonly blueprint: PetBlueprint;
  readonly stage: GrowthStage;
}

export interface LessonPathProps {
  readonly lessons: readonly PathLesson[];
  readonly color: string;
  /** The child's pet, waiting by the current lesson. */
  readonly pet: PathPet | null;
  /** The world's own pet, standing beside the path (a silhouette while the world is locked). */
  readonly mascot?: { readonly blueprint: PetBlueprint; readonly locked: boolean; readonly label: string } | null;
  /** Lessons drawn before this path on the same map, so the wave continues across worlds. */
  readonly waveOffset?: number;
  /** For a locked world: its first node becomes "Jump here?" and calls this. */
  readonly onJump?: () => void;
  /** Which lesson card is open (controlled by the map so only one is open at a time). */
  readonly openId: string | null;
  readonly onOpenChange: (lessonId: string | null) => void;
  /** Reports where the current node is, for auto-scroll. */
  readonly onCurrentY?: (y: number) => void;
}

const nodeSize = (lesson: PathLesson) => (lesson.step.plan.kind === 'boss' ? BOSS_NODE : NODE);
const waveAt = (index: number) => WAVE[((index % WAVE.length) + WAVE.length) % WAVE.length] as number;

/** Height of a path of `count` lessons; fixed, so a list of worlds can be virtualized. */
export function pathHeight(count: number): number {
  return count * ROW + spacing.xl * 2;
}

/** Vertical center of the node at `index`, from the top of its path. */
export function nodeCenterY(index: number): number {
  return TOP + index * ROW;
}

/**
 * A world's lessons as a winding path of chunky round nodes (Duolingo's
 * path, sized for small fingers): finished nodes show their stars, the
 * current one pulses with a "Start!" bubble and the child's pet beside it,
 * locked ones are grey, and a locked world starts with a "Jump here?" node.
 * A tap opens a card with the lesson's words and a Start button. Statuses
 * come from the domain journey; this component only draws them.
 */
export function LessonPath({
  lessons,
  color,
  pet,
  mascot = null,
  waveOffset = 0,
  onJump,
  openId,
  onOpenChange,
  onCurrentY,
}: LessonPathProps) {
  const { t } = useT();
  const [width, setWidth] = useState(0);
  const height = pathHeight(lessons.length);
  const currentIndex = lessons.findIndex((l) => l.step.status === 'current');

  const centers = useMemo(
    () => lessons.map((_, i) => ({ x: width / 2 + waveAt(waveOffset + i), y: TOP + i * ROW })),
    [lessons, width, waveOffset],
  );

  useEffect(() => {
    const center = centers[currentIndex];
    if (center && width > 0) onCurrentY?.(center.y);
  }, [centers, currentIndex, width, onCurrentY]);

  const mascotIndex = useMemo(() => {
    let best = -1;
    for (let i = 1; i < lessons.length - 1; i += 1) {
      if (i === currentIndex || lessons[i]?.reward) continue;
      if (best === -1 || Math.abs(waveAt(waveOffset + i)) > Math.abs(waveAt(waveOffset + best))) best = i;
    }
    return best;
  }, [lessons, currentIndex, waveOffset]);

  const reached = lessons.findLastIndex((l) => l.step.status !== 'locked');
  const trail = (from: number, to: number) => {
    let d = '';
    for (let i = from; i <= to; i += 1) {
      const c = centers[i];
      if (!c) continue;
      if (i === from) d += `M ${c.x} ${c.y}`;
      else {
        const p = centers[i - 1] as { x: number; y: number };
        const mid = (p.y + c.y) / 2;
        d += ` C ${p.x} ${mid} ${c.x} ${mid} ${c.x} ${c.y}`;
      }
    }
    return d;
  };

  const openIndex = lessons.findIndex((l) => l.step.plan.id === openId);
  const openLesson = lessons[openIndex];
  const openCenter = centers[openIndex];
  // Android delivers touches only inside a view's bounds, so the card stays inside the path.
  const openPlacement = (() => {
    if (!openLesson || !openCenter) return null;
    const half = nodeSize(openLesson) / 2 + spacing.md;
    const fitsBelow = openCenter.y + half + POPOVER_MAX <= height;
    return fitsBelow || openCenter.y - half - POPOVER_MAX < 0
      ? ({ side: 'below', offset: openCenter.y + half } as const)
      : ({ side: 'above', offset: height - (openCenter.y - half) } as const);
  })();

  return (
    <View style={[styles.path, { height }]} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Path d={trail(0, lessons.length - 1)} stroke={colors.locked} strokeWidth={10} strokeLinecap="round" strokeDasharray="1 20" fill="none" />
          {reached > 0 ? (
            <Path d={trail(0, reached)} stroke={shade(color, 0.05)} strokeWidth={10} strokeLinecap="round" strokeDasharray="1 20" fill="none" />
          ) : null}
        </Svg>
      ) : null}
      {width > 0 && mascot && centers[mascotIndex] ? (
        <View
          pointerEvents="none"
          accessibilityLabel={mascot.label}
          style={[
            styles.mascot,
            {
              top: (centers[mascotIndex]?.y ?? 0) - MASCOT / 2,
              left: width / 2 - Math.sign(waveAt(waveOffset + mascotIndex)) * (width * 0.27) - MASCOT / 2,
            },
          ]}
        >
          <PetPortrait blueprint={mascot.blueprint} stage="grown" size={MASCOT} silhouette={mascot.locked} />
        </View>
      ) : null}
      {width > 0
        ? lessons.map((lesson, i) => {
            const center = centers[i] as { x: number; y: number };
            const size = nodeSize(lesson);
            const side = waveAt(waveOffset + i) > 0 ? -1 : 1;
            const jump = i === 0 && onJump !== undefined;
            return (
              <Animated.View
                key={lesson.step.plan.id}
                entering={FadeInDown.delay(Math.min(i, 8) * 40).springify().damping(14)}
                style={[styles.nodeSlot, { left: center.x - size / 2, top: center.y - size / 2, width: size }]}
              >
                {jump ? (
                  <JumpNode color={color} size={size} label={t('jumpHere')} onPress={onJump} />
                ) : (
                  <PathNode
                    lesson={lesson}
                    color={color}
                    size={size}
                    onPress={() => onOpenChange(openId === lesson.step.plan.id ? null : lesson.step.plan.id)}
                  />
                )}
                {lesson.step.status === 'current' && pet ? (
                  <View style={[styles.petSpot, side > 0 ? { left: size + spacing.lg } : { right: size + spacing.lg }]} pointerEvents="none">
                    <Bob>
                      <PetPortrait blueprint={pet.blueprint} stage={pet.stage} size={70} mood="wow" />
                    </Bob>
                  </View>
                ) : null}
                {lesson.reward && lesson.step.status !== 'current' ? (
                  <View style={[styles.petSpot, side > 0 ? { left: size + spacing.md } : { right: size + spacing.md }]} pointerEvents="none">
                    {lesson.reward}
                  </View>
                ) : null}
              </Animated.View>
            );
          })
        : null}
      {openLesson && openCenter && openPlacement ? (
        <LessonPopover
          lesson={openLesson}
          color={color}
          placement={openPlacement}
          arrowX={openCenter.x}
          onClose={() => onOpenChange(null)}
        />
      ) : null}
    </View>
  );
}

/** The first node of a locked world: "Jump here?" in the world's color. */
function JumpNode({ color, size, label, onPress }: { color: string; size: number; label: string; onPress: () => void }) {
  const feedback = useSetAtom(tapFeedbackAtom);
  return (
    <View style={styles.nodeColumn}>
      <StartBubble color={color} label={label} size={size} />
      <Pressable
        testID="path-jump"
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => {
          feedback();
          onPress();
        }}
        style={({ pressed }) => [
          styles.node,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            borderBottomColor: shade(color, 0.28),
            borderBottomWidth: pressed ? 3 : 8,
            transform: [{ translateY: pressed ? 5 : 0 }],
          },
        ]}
      >
        <EmojiArt emoji="⏩" size={Math.round(size * 0.5)} />
      </Pressable>
    </View>
  );
}

function PathNode({
  lesson,
  color,
  size,
  onPress,
}: {
  lesson: PathLesson;
  color: string;
  size: number;
  onPress: () => void;
}) {
  const { t } = useT();
  const feedback = useSetAtom(tapFeedbackAtom);
  const { plan, stars, status } = lesson.step;
  const perfect = stars === 3;
  const tone =
    status === 'locked' ? colors.locked : plan.kind === 'boss' ? colors.orange : perfect ? colors.yellow : color;
  const icon = plan.kind === 'learn' ? (lesson.wordsEmoji.split(' ')[0] ?? '⭐') : LESSON_KIND_ICON[plan.kind];
  return (
    <View style={styles.nodeColumn}>
      {status === 'current' ? <StartBubble color={color} label={t('start')} size={size} /> : null}
      {status === 'current' ? <PulseRing color={color} size={size} /> : null}
      <Pressable
        testID={`lesson-${plan.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${lessonTitle(plan, t)}${status === 'locked' ? `, ${t('locked')}` : ''}`}
        aria-selected={status === 'current'}
        onPress={() => {
          feedback();
          onPress();
        }}
        style={({ pressed }) => [
          styles.node,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: tone,
            borderBottomColor: shade(tone, 0.28),
            borderBottomWidth: pressed ? 3 : 8,
            transform: [{ translateY: pressed ? 5 : 0 }],
          },
        ]}
      >
        <EmojiArt emoji={icon} size={Math.round(size * 0.5)} style={{ opacity: status === 'locked' ? 0.45 : 1 }} />
        {status === 'locked' ? (
          <View style={styles.lockBadge}>
            <EmojiArt emoji="🔒" size={18} />
          </View>
        ) : null}
      </Pressable>
      {status === 'done' || (status === 'open' && stars > 0) ? (
        <View style={styles.nodeStars}>
          <StarRow stars={stars} size={14} />
        </View>
      ) : null}
    </View>
  );
}

function LessonPopover({
  lesson,
  color,
  placement,
  arrowX,
  onClose,
}: {
  lesson: PathLesson;
  color: string;
  placement: { side: 'below' | 'above'; offset: number };
  arrowX: number;
  onClose: () => void;
}) {
  const { t } = useT();
  const calm = useCalm();
  const { plan, stars, status } = lesson.step;
  const locked = status === 'locked';
  // A white card framed in the world's color: ink text stays readable on every pastel world.
  const frame = locked ? colors.locked : color;
  const below = placement.side === 'below';
  return (
    <Animated.View
      entering={calm ? undefined : ZoomIn.springify().damping(14)}
      style={[
        styles.popover,
        shadow,
        below ? { top: placement.offset } : { bottom: placement.offset },
        { borderColor: frame, borderBottomColor: shade(frame, 0.25) },
      ]}
    >
      <View
        style={[
          styles.popArrow,
          below ? styles.popArrowTop : styles.popArrowBottom,
          { left: arrowX - spacing.lg - 10, borderColor: frame },
        ]}
      />
      <View style={styles.popHeader}>
        <View style={styles.popTitle}>
          <AppText variant="heading">{lessonTitle(plan, t)}</AppText>
          {lesson.subtitle ? (
            <AppText variant="small" color={colors.inkSoft} numberOfLines={1}>
              {lesson.subtitle}
            </AppText>
          ) : null}
        </View>
        {stars > 0 ? <StarRow stars={stars} size={18} /> : null}
      </View>
      {plan.kind === 'learn' && lesson.wordsEmoji ? (
        <View style={[styles.popWords, { backgroundColor: tint(frame, 0.6) }]}>
          <EmojiRow text={lesson.wordsEmoji} size={40} gap={spacing.sm} />
        </View>
      ) : null}
      {locked ? (
        <AppText variant="body" color={colors.inkSoft}>
          🔒 {t('lessonLockedHint')}
        </AppText>
      ) : (
        <BigButton
          label={stars > 0 ? t('playAgain') : t('start')}
          tone="success"
          onPress={() => {
            onClose();
            router.push({ pathname: '/lesson/[lessonId]', params: { lessonId: plan.id } });
          }}
          testID="lesson-start"
        />
      )}
    </Animated.View>
  );
}

/** "Start!" bubble that bounces above the current node. */
function StartBubble({ color, label, size }: { color: string; label: string; size: number }) {
  const calm = useCalm();
  const y = useSharedValue(0);
  useEffect(() => {
    if (calm) return;
    y.value = withRepeat(
      withSequence(withTiming(-7, { duration: 520, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 520, easing: Easing.inOut(Easing.quad) })),
      -1,
    );
  }, [calm, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={[styles.startBubble, { bottom: size + 14 }, style]} pointerEvents="none">
      <View style={[styles.startInner, { borderColor: tint(color, 0.4) }]}>
        <AppText variant="small" color={shade(color, 0.25)} style={styles.startText}>
          {label}
        </AppText>
      </View>
      <View style={[styles.startTail, { borderColor: tint(color, 0.4) }]} />
    </Animated.View>
  );
}

/** A soft ring that keeps pulsing out of the current node. */
function PulseRing({ color, size }: { color: string; size: number }) {
  const calm = useCalm();
  const p = useSharedValue(0);
  useEffect(() => {
    if (calm) return;
    p.value = withRepeat(withDelay(250, withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) })), -1);
  }, [calm, p]);
  const style = useAnimatedStyle(() => ({
    opacity: calm ? 0.5 : 0.55 * (1 - p.value),
    transform: [{ scale: 1.08 + p.value * 0.35 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: tint(color, 0.2) }, style]}
    />
  );
}

/** Gentle idle bob for the pet waiting by the current node. */
function Bob({ children }: { children: ReactNode }) {
  const calm = useCalm();
  const y = useSharedValue(0);
  useEffect(() => {
    if (calm) return;
    y.value = withRepeat(
      withSequence(withTiming(-6, { duration: 800, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })),
      -1,
    );
  }, [calm, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  path: { alignSelf: 'stretch' },
  nodeSlot: { position: 'absolute', alignItems: 'center' },
  nodeColumn: { alignItems: 'center' },
  node: { alignItems: 'center', justifyContent: 'center' },
  lockBadge: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeStars: { marginTop: 2, backgroundColor: colors.surface, borderRadius: radii.pill, paddingHorizontal: 6 },
  ring: { position: 'absolute', top: 0, borderWidth: 6 },
  petSpot: { position: 'absolute', top: -8 },
  // Wider than the node so the label never wraps; the bubble itself still hugs its text.
  startBubble: { position: 'absolute', left: -80, right: -80, alignItems: 'center', zIndex: 2 },
  startInner: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  startText: { fontFamily: 'Fredoka_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  startTail: {
    width: 14,
    height: 14,
    marginTop: -9,
    backgroundColor: colors.surface,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    transform: [{ rotate: '45deg' }],
  },
  popover: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 40,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 3,
    borderBottomWidth: 7,
    padding: spacing.lg,
    gap: spacing.md,
  },
  popArrow: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: colors.surface,
    transform: [{ rotate: '45deg' }],
  },
  popArrowTop: { top: -12, borderLeftWidth: 3, borderTopWidth: 3 },
  popArrowBottom: { bottom: -12, borderRightWidth: 3, borderBottomWidth: 3 },
  mascot: { position: 'absolute', width: MASCOT, height: MASCOT, opacity: 0.95 },
  popHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  popTitle: { flex: 1 },
  popWords: { borderRadius: radii.md, paddingVertical: spacing.xs, alignItems: 'center' },
});
