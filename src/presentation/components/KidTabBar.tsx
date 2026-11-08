import type { BottomTabBarProps } from 'expo-router/tabs';
import { useAtomValue, useSetAtom } from 'jotai';
import { Pressable, StyleSheet, View } from 'react-native';

import { tapFeedbackAtom } from '@/state/actions';
import { canClaimGiftAtom, eggsAtom, questsAtom } from '@/state/selectors';

import { EmojiArt } from '../art/EmojiArt';
import type { StringKey } from '../i18n/strings';
import { useT } from '../i18n/use-t';
import { colors, radii, shadow, spacing } from '../theme/tokens';
import { AppText } from './ui';

/** The five tabs: picture first, a one-word label under it (children who can't read follow the pictures). */
const TABS: Readonly<Record<string, { emoji: string; label: StringKey }>> = {
  home: { emoji: '🗺️', label: 'tabLearn' },
  play: { emoji: '🎮', label: 'tabPlay' },
  quests: { emoji: '🎯', label: 'tabQuests' },
  pets: { emoji: '🐾', label: 'tabPets' },
  me: { emoji: '🏅', label: 'tabMe' },
};

/** A dot on a tab that has something waiting (an egg to hatch, a chest or a gift to open). */
function useTabBadges(): Readonly<Record<string, boolean>> {
  const eggs = useAtomValue(eggsAtom);
  const { canClaim } = useAtomValue(questsAtom);
  const gift = useAtomValue(canClaimGiftAtom);
  return { pets: eggs.length > 0, quests: canClaim || gift };
}

/** Big, picture-first bottom tabs (Duolingo-style minimal home, sized for small fingers). */
export function KidTabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const { t } = useT();
  const feedback = useSetAtom(tapFeedbackAtom);
  const badges = useTabBadges();
  return (
    <View style={[styles.bar, shadow, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const selected = state.index === index;
        return (
          <Pressable
            key={route.key}
            testID={`tab-${route.name}`}
            accessibilityRole="tab"
            accessibilityLabel={t(tab.label)}
            aria-selected={selected}
            onPress={() => {
              if (selected) return;
              feedback();
              navigateToTab(route.key);
            }}
            style={({ pressed }) => [styles.tab, selected && styles.tabSelected, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
          >
            <View>
              <EmojiArt emoji={tab.emoji} size={30} style={selected ? undefined : styles.dim} />
              {badges[route.name] ? <View style={styles.badge} /> : null}
            </View>
            <AppText variant="tiny" color={selected ? colors.primaryDark : colors.inkSoft} numberOfLines={1} style={styles.label}>
              {t(tab.label)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.xs, borderRadius: radii.md, borderWidth: 2, borderColor: 'transparent' },
  tabSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  dim: { opacity: 0.75 },
  label: { fontFamily: 'Fredoka_600SemiBold' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
