import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { levelForXp, stageForLevel } from '@/domain/pets/leveling';
import { tapFeedbackAtom } from '@/state/actions';
import { contentAtom } from '@/state/core';
import { profilesAtom, switchProfileAtom } from '@/state/profiles';

import { EggPortrait, PetPortrait } from '../art/PetPortrait';
import { AppText, Screen } from '../components/ui';
import { useT } from '../i18n/use-t';
import { colors, radii, shadow, spacing } from '../theme/tokens';

/** "Who's playing?": each child taps their own pet. No names, no passwords. */
export function ProfilesScreen() {
  const { t } = useT();
  const profiles = useAtomValue(profilesAtom);
  const content = useAtomValue(contentAtom);
  const switchProfile = useSetAtom(switchProfileAtom);
  const feedback = useSetAtom(tapFeedbackAtom);
  const starter = content.species('bubbo');

  return (
    <Screen background={colors.primarySoft}>
      <AppText variant="hero" center color={colors.primary} style={styles.title}>
        {t('whoIsPlaying')}
      </AppText>
      <ScrollView contentContainerStyle={styles.grid}>
        {profiles.map((profile, i) => {
          const species = profile.petSpeciesId ? content.species(profile.petSpeciesId) : undefined;
          const level = levelForXp(profile.petXp);
          return (
            <Animated.View key={profile.id} entering={FadeInDown.delay(i * 90).springify()} style={styles.cell}>
              <Pressable
                testID={`profile-${profile.id}`}
                accessibilityRole="button"
                accessibilityLabel={profile.petNickname ?? t('newPlayer')}
                onPress={async () => {
                  feedback();
                  await switchProfile(profile.id);
                  router.replace(profile.onboarded ? '/home' : '/welcome');
                }}
                style={({ pressed }) => [styles.card, shadow, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
              >
                {species ? (
                  <PetPortrait blueprint={species.blueprint} stage={stageForLevel(level)} size={120} />
                ) : starter ? (
                  <EggPortrait blueprint={starter.blueprint} size={110} />
                ) : null}
                <AppText variant="heading" center numberOfLines={1}>
                  {profile.petNickname ?? t('newPlayer')}
                </AppText>
                {species ? (
                  <AppText variant="small" color={colors.inkSoft}>
                    {t('level', { n: level })}
                  </AppText>
                ) : null}
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <AppText variant="small" center color={colors.inkSoft}>
          🔒 {t('noAccountNeeded')}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.xl, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, padding: spacing.lg, justifyContent: 'center' },
  cell: { width: '46%' },
  card: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.lg, alignItems: 'center', gap: spacing.xs },
  footer: { padding: spacing.lg },
});
