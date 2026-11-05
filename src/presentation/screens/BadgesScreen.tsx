import { router } from 'expo-router';
import { useAtomValue } from 'jotai';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { achievementProgress } from '@/domain/achievements/achievement';
import { contentAtom } from '@/state/core';
import { achievementsEarnedAtom, statsAtom } from '@/state/selectors';

import { PetPortrait } from '../art/PetPortrait';
import { AppText, ProgressBar, Screen, TopBar } from '../components/ui';
import { useT } from '../i18n/use-t';
import { colors, radii, shadow, spacing } from '../theme/tokens';

/** Badges with progress bars; each shows its reward (a pet egg or berries). */
export function BadgesScreen() {
  const { t, l } = useT();
  const content = useAtomValue(contentAtom);
  const earned = useAtomValue(achievementsEarnedAtom);
  const { metrics } = useAtomValue(statsAtom);

  return (
    <Screen>
      <TopBar title={t('badgesTitle')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.list}>
        {content.catalog.achievements.map((achievement) => {
          const done = earned.includes(achievement.id);
          const progress = achievementProgress(achievement, metrics);
          const species = achievement.reward.speciesId ? content.species(achievement.reward.speciesId) : undefined;
          return (
            <View key={achievement.id} style={[styles.card, shadow, done && styles.done]}>
              <Text style={[styles.emoji, !done && styles.dim]}>{achievement.emoji}</Text>
              <View style={styles.text}>
                <AppText variant="heading">{l(achievement.title)}</AppText>
                <AppText variant="small" color={colors.inkSoft}>
                  {l(achievement.description)}
                </AppText>
                <ProgressBar value={done ? 1 : progress} color={done ? colors.success : colors.yellow} height={12} />
              </View>
              {species ? (
                <PetPortrait blueprint={species.blueprint} size={58} silhouette={!done} />
              ) : (
                <AppText variant="small" color={colors.berry}>
                  🍓{achievement.reward.berries}
                </AppText>
              )}
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  done: { backgroundColor: colors.successSoft },
  emoji: { fontSize: 40 },
  dim: { opacity: 0.45 },
  text: { flex: 1, gap: 4 },
});
