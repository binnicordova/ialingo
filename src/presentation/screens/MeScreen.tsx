import { router, type Href } from 'expo-router';
import { useSetAtom } from 'jotai';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { tapFeedbackAtom } from '@/state/actions';

import { EmojiArt } from '../art/EmojiArt';
import { AppText, Screen } from '../components/ui';
import type { StringKey } from '../i18n/strings';
import { useT } from '../i18n/use-t';
import { colors, radii, shadow, spacing } from '../theme/tokens';

const ROWS: readonly { emoji: string; label: StringKey; href: Href; testID: string }[] = [
  { emoji: '🏅', label: 'badges', href: '/badges', testID: 'nav-badges' },
  { emoji: '👫', label: 'guides', href: '/guides', testID: 'nav-guides' },
  { emoji: '🎓', label: 'certificates', href: '/certificates', testID: 'nav-certificates' },
  { emoji: '👥', label: 'profiles', href: '/profiles', testID: 'nav-profiles' },
  { emoji: '🔒', label: 'parents', href: '/parents', testID: 'nav-parents' },
];

/** The Me tab: badges, friends, certificates, players and the grown-ups' area (behind its gate). */
export function MeScreen() {
  const { t } = useT();
  const feedback = useSetAtom(tapFeedbackAtom);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <AppText variant="title" accessibilityRole="header">
          {t('meTitle')}
        </AppText>
        <View style={styles.list}>
          {ROWS.map((row) => (
            <Pressable
              key={row.testID}
              testID={row.testID}
              accessibilityRole="button"
              accessibilityLabel={t(row.label)}
              onPress={() => {
                feedback();
                router.push(row.href);
              }}
              style={({ pressed }) => [styles.row, shadow, { transform: [{ translateY: pressed ? 2 : 0 }] }]}
            >
              <EmojiArt emoji={row.emoji} size={40} />
              <AppText variant="heading" style={styles.rowLabel}>
                {t(row.label)}
              </AppText>
              <AppText variant="heading" color={colors.muted}>
                ›
              </AppText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.lg },
  list: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderBottomWidth: 5,
    padding: spacing.md,
    minHeight: 72,
  },
  rowLabel: { flex: 1 },
});
