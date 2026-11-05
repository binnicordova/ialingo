import { useSetAtom } from 'jotai';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tapFeedbackAtom } from '@/state/actions';

import { colors, fonts, radii, shade, shadow, spacing, TAP_TARGET, typeScale } from '../theme/tokens';

/* ------------------------------------------------------------------ Text */

type TextVariant = 'hero' | 'title' | 'heading' | 'body' | 'small' | 'tiny';

const VARIANT_STYLE: Record<TextVariant, TextStyle> = {
  hero: { fontFamily: fonts.bold, fontSize: typeScale.hero, lineHeight: typeScale.hero * 1.15 },
  title: { fontFamily: fonts.bold, fontSize: typeScale.title, lineHeight: typeScale.title * 1.2 },
  heading: { fontFamily: fonts.semibold, fontSize: typeScale.heading, lineHeight: typeScale.heading * 1.25 },
  body: { fontFamily: fonts.medium, fontSize: typeScale.body, lineHeight: typeScale.body * 1.35 },
  small: { fontFamily: fonts.medium, fontSize: typeScale.small, lineHeight: typeScale.small * 1.35 },
  tiny: { fontFamily: fonts.medium, fontSize: typeScale.tiny, lineHeight: typeScale.tiny * 1.35 },
};

export interface AppTextProps extends TextProps {
  readonly variant?: TextVariant;
  readonly color?: string;
  readonly center?: boolean;
}

/** Text in the app's rounded font. */
export function AppText({ variant = 'body', color = colors.ink, center, style, ...rest }: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[VARIANT_STYLE[variant], { color }, center && styles.center, style]}
    />
  );
}

/* --------------------------------------------------------------- Buttons */

type ButtonTone = 'primary' | 'success' | 'orange' | 'danger' | 'sky' | 'neutral';

const TONES: Record<ButtonTone, { bg: string; fg: string }> = {
  primary: { bg: colors.primary, fg: '#FFFFFF' },
  success: { bg: colors.success, fg: '#FFFFFF' },
  orange: { bg: colors.orange, fg: '#FFFFFF' },
  danger: { bg: colors.danger, fg: '#FFFFFF' },
  sky: { bg: colors.sky, fg: '#FFFFFF' },
  neutral: { bg: colors.surface, fg: colors.ink },
};

export interface BigButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly tone?: ButtonTone;
  readonly icon?: string;
  readonly disabled?: boolean;
  readonly compact?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly accessibilityHint?: string;
  readonly silent?: boolean;
  readonly testID?: string;
}

/** Chunky "3D" button with a darker bottom edge that presses down. */
export function BigButton({
  label,
  onPress,
  tone = 'primary',
  icon,
  disabled,
  compact,
  style,
  accessibilityHint,
  silent,
  testID,
}: BigButtonProps) {
  const feedback = useSetAtom(tapFeedbackAtom);
  const palette = disabled ? { bg: colors.locked, fg: '#FFFFFF' } : TONES[tone];
  const edge = tone === 'neutral' && !disabled ? colors.border : shade(palette.bg, 0.22);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        if (!silent) feedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        {
          backgroundColor: palette.bg,
          borderBottomColor: edge,
          borderBottomWidth: pressed ? 2 : 6,
          transform: [{ translateY: pressed ? 4 : 0 }],
        },
        tone === 'neutral' && styles.neutralBorder,
        style,
      ]}
    >
      {icon ? <Text style={[styles.buttonIcon, compact && styles.buttonIconCompact]}>{icon}</Text> : null}
      <AppText variant={compact ? 'small' : 'heading'} color={palette.fg} center numberOfLines={2}>
        {label}
      </AppText>
    </Pressable>
  );
}

export interface IconButtonProps {
  readonly icon: string;
  readonly label: string;
  readonly onPress: () => void;
  readonly size?: number;
  readonly background?: string;
  readonly badge?: string | number | null;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

/** Round emoji button with an accessible label. */
export function IconButton({
  icon,
  label,
  onPress,
  size = TAP_TARGET,
  background = colors.surface,
  badge,
  style,
  testID,
}: IconButtonProps) {
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
        styles.iconButton,
        shadow,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.48 }}>{icon}</Text>
      {badge !== undefined && badge !== null ? (
        <View style={styles.badge}>
          <AppText variant="tiny" color="#FFFFFF">
            {badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

/* ---------------------------------------------------------- Containers */

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, shadow, style]}>{children}</View>;
}

export interface ScreenProps {
  readonly children: ReactNode;
  readonly background?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly padded?: boolean;
}

/** Full-screen container that respects the notch and the home indicator. */
export function Screen({ children, background = colors.background, style, padded = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: background,
          paddingTop: insets.top + (padded ? spacing.sm : 0),
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ------------------------------------------------------------ Indicators */

export function ProgressBar({
  value,
  color = colors.success,
  height = 18,
  track = colors.border,
  style,
}: {
  value: number;
  color?: string;
  height?: number;
  track?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: track }, style]}
    >
      <View
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color,
        }}
      >
        <View style={[styles.trackShine, { borderRadius: height / 2 }]} />
      </View>
    </View>
  );
}

export function StarRow({ stars, max = 3, size = 22 }: { stars: number; max?: number; size?: number }) {
  return (
    <View style={styles.row} accessibilityLabel={`${stars} / ${max} ★`}>
      {Array.from({ length: max }, (_, i) => (
        <Text key={i} style={{ fontSize: size, opacity: i < stars ? 1 : 0.25 }}>
          ⭐
        </Text>
      ))}
    </View>
  );
}

export function BerryPill({ amount, style }: { amount: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.pill, shadow, style]} accessibilityLabel={`${amount} berries`}>
      <Text style={styles.pillIcon}>🍓</Text>
      <AppText variant="heading" color={colors.berry}>
        {amount}
      </AppText>
    </View>
  );
}

export function Pill({ label, color = colors.primary, textColor = '#FFFFFF' }: { label: string; color?: string; textColor?: string }) {
  return (
    <View style={[styles.smallPill, { backgroundColor: color }]}>
      <AppText variant="tiny" color={textColor}>
        {label}
      </AppText>
    </View>
  );
}

/* ---------------------------------------------------------------- Header */

export function TopBar({
  title,
  onBack,
  right,
  color = colors.ink,
}: {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  color?: string;
}) {
  return (
    <View style={styles.topBar}>
      <View style={styles.topBarSide}>
        {onBack ? <IconButton icon="⬅️" label="Back" onPress={onBack} size={48} /> : null}
      </View>
      <AppText variant="heading" color={color} center numberOfLines={1} style={styles.topBarTitle}>
        {title ?? ''}
      </AppText>
      <View style={[styles.topBarSide, styles.topBarRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  button: {
    minHeight: TAP_TARGET + 6,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonCompact: { minHeight: 48, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.md },
  neutralBorder: { borderWidth: 2, borderColor: colors.border },
  buttonIcon: { fontSize: 26 },
  buttonIconCompact: { fontSize: 18 },
  iconButton: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg },
  screen: { flex: 1 },
  track: { width: '100%', overflow: 'hidden' },
  trackShine: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 3,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  pillIcon: { fontSize: 20 },
  smallPill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  topBarSide: { minWidth: 56, flexDirection: 'row', alignItems: 'center' },
  topBarRight: { justifyContent: 'flex-end' },
  topBarTitle: { flex: 1 },
});
