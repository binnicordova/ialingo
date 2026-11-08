import { useSetAtom } from 'jotai';
import { useEffect, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { tapFeedbackAtom } from '@/state/actions';

import { EmojiArt } from '../art/EmojiArt';
import { useCalm } from '../hooks/use-calm';
import { colors, radii, shade, shadow, spacing, TAP_TARGET } from '../theme/tokens';
import { AppText } from './ui';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type TileState = 'idle' | 'selected' | 'correct' | 'wrong' | 'done' | 'disabled';

const TILE_COLORS: Record<TileState, { bg: string; border: string }> = {
  idle: { bg: colors.surface, border: colors.border },
  selected: { bg: colors.primarySoft, border: colors.primary },
  correct: { bg: colors.successSoft, border: colors.success },
  wrong: { bg: colors.dangerSoft, border: colors.danger },
  done: { bg: colors.successSoft, border: colors.successSoft },
  disabled: { bg: colors.surfaceAlt, border: colors.surfaceAlt },
};

/**
 * Big tappable tile: an emoji picture, a word, or both. It presses down like
 * a chunky button, pops when it becomes the right answer (or a matched pair)
 * and wiggles softly when it was a miss.
 */
export function Tile({
  emoji,
  label,
  state = 'idle',
  onPress,
  size = 'md',
  style,
  accessibilityLabel,
  testID,
}: {
  emoji?: string;
  label?: string;
  state?: TileState;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}) {
  const feedback = useSetAtom(tapFeedbackAtom);
  const calm = useCalm();
  const palette = TILE_COLORS[state];
  const emojiSize = size === 'lg' ? 64 : size === 'md' ? 48 : 30;
  const disabled = !onPress || state === 'done' || state === 'disabled';
  const press = useSharedValue(0);
  const scale = useSharedValue(1);
  const shake = useSharedValue(0);
  const previous = useRef(state);

  useEffect(() => {
    if (previous.current === state) return;
    previous.current = state;
    if (calm) return;
    if (state === 'correct' || state === 'done') {
      scale.value = withSequence(withTiming(1.12, { duration: 130, easing: Easing.out(Easing.quad) }), withSpring(1, { damping: 7 }));
    } else if (state === 'wrong') {
      shake.value = withSequence(
        withTiming(-8, { duration: 55 }),
        withTiming(8, { duration: 85 }),
        withTiming(-6, { duration: 85 }),
        withTiming(4, { duration: 75 }),
        withTiming(0, { duration: 60 }),
      );
    } else if (state === 'selected') {
      scale.value = withSequence(withTiming(0.94, { duration: 70 }), withSpring(1, { damping: 9 }));
    }
  }, [state, calm, scale, shake]);

  const animated = useAnimatedStyle(() => ({
    borderBottomWidth: 6 - press.value * 3,
    transform: [{ translateY: press.value * 3 }, { translateX: shake.value }, { scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label ?? emoji}
      aria-selected={state === 'selected'}
      disabled={disabled}
      onPressIn={() => {
        press.value = withTiming(1, { duration: 60 });
      }}
      onPressOut={() => {
        press.value = withTiming(0, { duration: 110 });
      }}
      onPress={() => {
        feedback();
        onPress?.();
      }}
      style={[
        styles.tile,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderBottomColor: state === 'idle' ? shade(colors.border, 0.12) : shade(palette.border, 0.08),
          opacity: state === 'done' ? 0.5 : 1,
          minHeight: size === 'sm' ? TAP_TARGET : size === 'md' ? 96 : 130,
        },
        style,
        animated,
      ]}
    >
      {emoji ? <EmojiArt emoji={emoji} size={Math.round(emojiSize * 1.2)} /> : null}
      {label ? (
        <AppText variant={size === 'sm' ? 'body' : 'heading'} center numberOfLines={2}>
          {label}
        </AppText>
      ) : null}
      {state === 'correct' ? (
        <Animated.View entering={calm ? undefined : ZoomIn.springify().damping(8)} style={styles.tileBadge}>
          <Text style={styles.tileBadgeText}>✔</Text>
        </Animated.View>
      ) : null}
    </AnimatedPressable>
  );
}

/** A white loudspeaker with two sound waves (reads well on any button color). */
function SpeakerGlyph({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3.5 9.2h3.6L12 5v14l-4.9-4.2H3.5a1 1 0 0 1-1-1V10.2a1 1 0 0 1 1-1z" fill="#FFFFFF" />
      <Path d="M15 9a4 4 0 0 1 0 6" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <Path d="M17.6 6.2a8 8 0 0 1 0 11.6" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/**
 * Round speaker button that replays audio; a ring ripples out on each tap.
 * Without an `icon` it shows the white speaker glyph; with one (🐢) the emoji art.
 */
export function SpeakerButton({
  onPress,
  size = 84,
  label = 'Listen',
  tone = colors.sky,
  icon,
  testID,
}: {
  onPress: () => void;
  size?: number;
  label?: string;
  tone?: string;
  icon?: string;
  testID?: string;
}) {
  const feedback = useSetAtom(tapFeedbackAtom);
  const calm = useCalm();
  const ripple = useSharedValue(0);
  const ring = useAnimatedStyle(() => ({
    opacity: ripple.value === 0 ? 0 : 0.5 * (1 - ripple.value),
    transform: [{ scale: 1 + ripple.value * 0.55 }],
  }));
  return (
    <View style={{ width: size, height: size + 6 }}>
      <Animated.View
        pointerEvents="none"
        style={[styles.ripple, { width: size, height: size, borderRadius: size / 2, borderColor: tone }, ring]}
      />
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => {
          feedback();
          if (!calm) {
            ripple.value = 0;
            ripple.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) });
          }
          onPress();
        }}
        style={({ pressed }) => [
          styles.speaker,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: tone,
            borderBottomColor: shade(tone, 0.25),
            borderBottomWidth: pressed ? 2 : 6,
            transform: [{ translateY: pressed ? 4 : 0 }],
          },
        ]}
      >
        {icon ? <EmojiArt emoji={icon} size={Math.round(size * 0.6)} /> : <SpeakerGlyph size={Math.round(size * 0.56)} />}
      </Pressable>
    </View>
  );
}

/** Speech bubble next to a character. */
export function SpeechBubble({
  children,
  style,
  tail = 'left',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tail?: 'left' | 'bottom';
}) {
  return (
    <Animated.View entering={ZoomIn.duration(220)} style={[styles.bubble, shadow, style]}>
      {children}
      <View style={[styles.bubbleTail, tail === 'bottom' ? styles.bubbleTailBottom : styles.bubbleTailLeft]} />
    </Animated.View>
  );
}

/** Numeric keypad for the parental gate (no system keyboard). */
export function NumberPad({ onDigit, onDelete, onEnter, enterLabel }: {
  onDigit: (d: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  enterLabel: string;
}) {
  const feedback = useSetAtom(tapFeedbackAtom);
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
  return (
    <View style={styles.pad}>
      {keys.map((key) => (
        <Pressable
          key={key}
          accessibilityRole="button"
          accessibilityLabel={key === '⌫' ? 'Delete' : key === '✓' ? enterLabel : key}
          onPress={() => {
            feedback();
            if (key === '⌫') onDelete();
            else if (key === '✓') onEnter();
            else onDigit(key);
          }}
          style={({ pressed }) => [
            styles.padKey,
            key === '✓' && { backgroundColor: colors.success },
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <AppText variant="title" color={key === '✓' ? '#FFFFFF' : colors.ink}>
            {key}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

export function SectionTitle({ children, color = colors.ink }: { children: ReactNode; color?: string }) {
  return (
    <AppText variant="heading" color={color} style={styles.sectionTitle}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderWidth: 3,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  speaker: { alignItems: 'center', justifyContent: 'center' },
  ripple: { position: 'absolute', left: 0, top: 0, borderWidth: 4 },
  tileBadge: {
    position: 'absolute',
    top: -9,
    right: -9,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  bubble: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bubbleTail: { position: 'absolute', width: 18, height: 18, backgroundColor: colors.surface, transform: [{ rotate: '45deg' }] },
  bubbleTailLeft: { left: -7, top: 22 },
  bubbleTailBottom: { bottom: -7, left: 36 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', maxWidth: 320, alignSelf: 'center' },
  padKey: {
    width: 92,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
});
