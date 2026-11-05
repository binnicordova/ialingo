import { useSetAtom } from 'jotai';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { tapFeedbackAtom } from '@/state/actions';

import { colors, radii, shade, shadow, spacing, TAP_TARGET } from '../theme/tokens';
import { AppText } from './ui';

export type TileState = 'idle' | 'selected' | 'correct' | 'wrong' | 'done' | 'disabled';

const TILE_COLORS: Record<TileState, { bg: string; border: string }> = {
  idle: { bg: colors.surface, border: colors.border },
  selected: { bg: colors.primarySoft, border: colors.primary },
  correct: { bg: colors.successSoft, border: colors.success },
  wrong: { bg: colors.dangerSoft, border: colors.danger },
  done: { bg: colors.successSoft, border: colors.successSoft },
  disabled: { bg: colors.surfaceAlt, border: colors.surfaceAlt },
};

/** Big tappable tile: an emoji picture, a word, or both. */
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
  const palette = TILE_COLORS[state];
  const emojiSize = size === 'lg' ? 64 : size === 'md' ? 48 : 30;
  const disabled = !onPress || state === 'done' || state === 'disabled';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label ?? emoji}
      accessibilityState={{ disabled, selected: state === 'selected' }}
      disabled={disabled}
      onPress={() => {
        feedback();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderBottomColor: state === 'idle' ? shade(colors.border, 0.12) : palette.border,
          borderBottomWidth: pressed ? 3 : 6,
          transform: [{ translateY: pressed ? 3 : 0 }],
          opacity: state === 'done' ? 0.55 : 1,
          minHeight: size === 'sm' ? TAP_TARGET : size === 'md' ? 96 : 130,
        },
        style,
      ]}
    >
      {emoji ? <Text style={{ fontSize: emojiSize }}>{emoji}</Text> : null}
      {label ? (
        <AppText variant={size === 'sm' ? 'body' : 'heading'} center numberOfLines={2}>
          {label}
        </AppText>
      ) : null}
    </Pressable>
  );
}

/** Round speaker button that replays audio. */
export function SpeakerButton({
  onPress,
  size = 84,
  label = 'Listen',
  tone = colors.sky,
  testID,
}: {
  onPress: () => void;
  size?: number;
  label?: string;
  tone?: string;
  testID?: string;
}) {
  const feedback = useSetAtom(tapFeedbackAtom);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        feedback();
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
      <Text style={{ fontSize: size * 0.45 }}>🔊</Text>
    </Pressable>
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
