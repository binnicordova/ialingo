import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  SlideInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Character } from '@/domain/characters/character';
import { LESSON_FEEL } from '@/domain/learning/lesson-session';

import { EmojiArt } from '../art/EmojiArt';
import { CharacterAvatar } from '../art/CharacterAvatar';
import { useCalm } from '../hooks/use-calm';
import { useT } from '../i18n/use-t';
import { colors, radii, shade, spacing, tint } from '../theme/tokens';
import { SpeakerButton } from './game';
import { AppText, BigButton } from './ui';

/* ------------------------------------------------------------ Progress */

/**
 * The lesson progress bar: it fills with a spring, shows "N in a row!" from
 * `inARowShownFrom` and turns gold from `inARowMoment` (Duolingo-style
 * momentum, with no penalty when it resets).
 */
export function LessonProgress({ value, inARow }: { value: number; inARow: number }) {
  const { t } = useT();
  const calm = useCalm();
  const fill = useSharedValue(value);
  const glow = useSharedValue(0);
  const gold = inARow >= LESSON_FEEL.inARowMoment;

  useEffect(() => {
    fill.value = calm ? withTiming(value, { duration: 200 }) : withSpring(value, { damping: 16, stiffness: 120 });
    if (!calm && value > 0) glow.value = withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 500 }));
  }, [value, calm, fill, glow]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, fill.value)) * 100}%` }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.6 }));
  const color = gold ? colors.yellow : colors.success;

  return (
    <View style={styles.progressWrap}>
      <View style={styles.badgeRow} pointerEvents="none">
        {inARow >= LESSON_FEEL.inARowShownFrom ? (
          <Animated.View key={inARow} entering={calm ? undefined : ZoomIn.springify().damping(9)} style={styles.badge}>
            <AppText variant="tiny" color={gold ? colors.yellowDark : colors.successDark} style={styles.badgeText}>
              ⭐ {t('inARow', { n: inARow })}
            </AppText>
          </Animated.View>
        ) : null}
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
        style={styles.track}
      >
        <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]}>
          <View style={styles.shine} />
          <Animated.View style={[StyleSheet.absoluteFill, styles.glow, glowStyle]} />
        </Animated.View>
      </View>
    </View>
  );
}

/* ---------------------------------------------------- Motion wrappers */

/** Hops its child each time `cue` changes (the header pet on a right answer). */
export function Hop({ cue, children }: { cue: number; children: ReactNode }) {
  const calm = useCalm();
  const y = useSharedValue(0);
  const tilt = useSharedValue(0);
  useEffect(() => {
    if (cue === 0 || calm) return;
    y.value = withSequence(withTiming(-16, { duration: 140, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 7 }));
    tilt.value = withSequence(withTiming(-0.2, { duration: 120 }), withTiming(0.2, { duration: 160 }), withSpring(0));
  }, [cue, calm, y, tilt]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { rotate: `${tilt.value}rad` }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Gives its child a soft wobble each time `cue` changes (a miss, never harsh). */
export function Wobble({ cue, children, style }: { cue: number; children: ReactNode; style?: object }) {
  const calm = useCalm();
  const x = useSharedValue(0);
  useEffect(() => {
    if (cue === 0 || calm) return;
    x.value = withSequence(
      withTiming(-7, { duration: 60 }),
      withTiming(7, { duration: 90 }),
      withTiming(-4, { duration: 90 }),
      withTiming(0, { duration: 80 }),
    );
  }, [cue, calm, x]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/* ------------------------------------------------------- Answer burst */

const PARTICLES = 22;
const BURST_MS = 1000;
const CONFETTI = ['#FFC93C', '#FF5A6A', '#59C3FF', '#3CC46B', '#B39DDB', '#FF8A3D'];
const STARS = ['⭐', '✨', '🌟'];

/**
 * Full-screen feedback burst: a soft color flash and, for a right answer, a
 * shower of stars and confetti from the middle of the screen. Pure views
 * animated on the UI thread; it never takes touches. Remount (`key`) to replay.
 */
export function AnswerBurst({ correct }: { correct: boolean }) {
  const calm = useCalm();
  const { width, height } = useWindowDimensions();
  const flash = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    flash.value = withSequence(withTiming(1, { duration: 110 }), withTiming(0, { duration: 420 }));
    if (correct && !calm) progress.value = withTiming(1, { duration: BURST_MS, easing: Easing.out(Easing.quad) });
  }, [correct, calm, flash, progress]);

  // Deterministic spread: the same layout every time, no randomness per frame.
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLES }, (_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2 + (i % 3) * 0.21;
        const speed = 0.36 + ((i * 37) % 11) / 30;
        return {
          dx: Math.cos(angle) * speed * width,
          dy: Math.sin(angle) * speed * width * 0.9 - width * 0.25,
          spin: ((i % 5) - 2) * 220,
          star: i % 4 === 0 ? STARS[i % STARS.length] : null,
          color: CONFETTI[i % CONFETTI.length] as string,
          size: 9 + (i % 3) * 4,
        };
      }),
    [width],
  );

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value * (correct ? 0.22 : 0.16) }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: correct ? colors.success : colors.orange }, flashStyle]}
      />
      {correct && !calm
        ? particles.map((p, i) => (
            <Particle key={i} {...p} progress={progress} origin={{ x: width / 2, y: height * 0.42 }} gravity={height * 0.55} />
          ))
        : null}
    </View>
  );
}

function Particle({
  dx,
  dy,
  spin,
  star,
  color,
  size,
  progress,
  origin,
  gravity,
}: {
  dx: number;
  dy: number;
  spin: number;
  star: string | null;
  color: string;
  size: number;
  progress: SharedValue<number>;
  origin: { x: number; y: number };
  gravity: number;
}) {
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p === 0 ? 0 : 1 - p * p * p,
      transform: [
        { translateX: origin.x + dx * p },
        { translateY: origin.y + dy * p + gravity * p * p },
        { rotate: `${spin * p}deg` },
        { scale: 0.4 + Math.min(1, p * 4) * 0.8 },
      ],
    };
  });
  return star ? (
    <Animated.View style={[styles.particle, style]}>
      <Text style={{ fontSize: size + 12 }}>{star}</Text>
    </Animated.View>
  ) : (
    <Animated.View
      style={[styles.particle, { width: size, height: size * 1.6, borderRadius: 3, backgroundColor: color }, style]}
    />
  );
}

/* ------------------------------------------------------ Feedback sheet */

export interface FeedbackSheetProps {
  readonly correct: boolean;
  readonly title: string;
  readonly line: string | null;
  /** The right answer, shown (and playable) after a miss. */
  readonly answer: { readonly emoji: string; readonly text: string } | null;
  readonly guide?: Character;
  readonly onHear?: () => void;
  readonly onHearSlow?: () => void;
  readonly onContinue: () => void;
}

/**
 * The answer sheet: it springs up from the bottom above the system bar, with
 * the guide, a big icon, the guide's line and, after a miss, the right answer
 * with its audio. "Continue" works once per sheet, however fast the taps come.
 */
export function FeedbackSheet({ correct, title, line, answer, guide, onHear, onHearSlow, onContinue }: FeedbackSheetProps) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const calm = useCalm();
  const pressed = useRef(false);
  const tone = correct ? colors.success : colors.orange;
  return (
    <Animated.View
      entering={calm ? undefined : SlideInDown.springify().damping(18).stiffness(160)}
      accessibilityLiveRegion="polite"
      style={[
        styles.sheet,
        {
          backgroundColor: correct ? colors.successSoft : '#FFF1E0',
          borderTopColor: tint(tone, 0.45),
          paddingBottom: insets.bottom + spacing.lg,
        },
      ]}
    >
      <View style={styles.sheetRow}>
        <View>
          {guide ? <CharacterAvatar look={guide.look} size={68} mood={correct ? 'cheer' : 'happy'} bob={false} /> : null}
          <Animated.View
            entering={calm ? undefined : ZoomIn.delay(140).springify().damping(8)}
            style={[styles.sheetIcon, { backgroundColor: tone, borderColor: shade(tone, 0.2) }, !guide && styles.sheetIconAlone]}
          >
            <Text style={styles.sheetIconText}>{correct ? '✔' : '💡'}</Text>
          </Animated.View>
        </View>
        <View style={styles.sheetText}>
          <AppText variant="title" color={correct ? colors.successDark : colors.orangeDark}>
            {title}
          </AppText>
          {line ? (
            <AppText variant="body" color={colors.inkSoft}>
              {line}
            </AppText>
          ) : null}
        </View>
      </View>
      {answer ? (
        <View style={styles.answer}>
          <EmojiArt emoji={answer.emoji} size={44} />
          <View style={styles.answerText}>
            <AppText variant="small" color={colors.inkSoft}>
              {t('answerIs')}
            </AppText>
            <AppText variant="heading" color={colors.ink} numberOfLines={2}>
              {answer.text}
            </AppText>
          </View>
          {onHear ? <SpeakerButton onPress={onHear} size={52} label={t('hearAnswer')} testID="feedback-hear" /> : null}
          {onHearSlow ? (
            <SpeakerButton onPress={onHearSlow} size={44} icon="🐢" tone={colors.successSoft} label={t('listenSlow')} />
          ) : null}
        </View>
      ) : null}
      <BigButton
        label={t('continue')}
        tone={correct ? 'success' : 'orange'}
        onPress={() => {
          if (pressed.current) return;
          pressed.current = true;
          onContinue();
        }}
        testID="lesson-continue"
      />
    </Animated.View>
  );
}

/* -------------------------------------------------------------- Tags */

/** "✨ New word" / "🔁 Second try" above the instruction. */
export function ExerciseTag({ kind }: { kind: 'new-word' | 'second-try' }) {
  const { t } = useT();
  const calm = useCalm();
  const newWord = kind === 'new-word';
  return (
    <Animated.View
      entering={calm ? undefined : ZoomIn.springify().damping(12)}
      style={[styles.tag, { backgroundColor: newWord ? colors.primarySoft : '#FFEBD6' }]}
    >
      <AppText variant="tiny" color={newWord ? colors.primaryDark : colors.orangeDark} style={styles.tagText}>
        {newWord ? `✨ ${t('tagNewWord')}` : `🔁 ${t('tagSecondTry')}`}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  progressWrap: { flex: 1, gap: 2 },
  badgeRow: { height: 18, alignItems: 'center', justifyContent: 'flex-end' },
  badge: { flexDirection: 'row', alignItems: 'center' },
  badgeText: { fontFamily: 'Fredoka_700Bold', letterSpacing: 0.5 },
  track: { height: 18, borderRadius: 9, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 9, overflow: 'hidden' },
  shine: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 3,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  glow: { backgroundColor: '#FFFFFF' },
  particle: { position: 'absolute', left: 0, top: 0 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 3,
    gap: spacing.md,
  },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sheetIcon: {
    position: 'absolute',
    right: -6,
    bottom: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetIconAlone: { position: 'relative', right: 0, bottom: 0, width: 56, height: 56, borderRadius: 28 },
  sheetIconText: { fontSize: 16, color: '#FFFFFF', fontWeight: '900' },
  sheetText: { flex: 1, gap: 2 },
  answer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm,
    paddingLeft: spacing.md,
  },
  answerText: { flex: 1 },
  tag: { alignSelf: 'center', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 3 },
  tagText: { fontFamily: 'Fredoka_700Bold', letterSpacing: 0.6, textTransform: 'uppercase' },
});
