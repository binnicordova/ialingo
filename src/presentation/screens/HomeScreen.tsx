import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { Pressable, StyleSheet, View } from 'react-native';

import { claimDailyGiftAtom } from '@/state/actions';
import { activePetAccessoryAtom, activePetAtom, berriesAtom, canClaimGiftAtom } from '@/state/selectors';

import { PetPortrait } from '../art/PetPortrait';
import { JourneyMap } from '../components/JourneyMap';
import { AppText, BerryPill, IconButton, ProgressBar, Screen } from '../components/ui';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { colors, spacing } from '../theme/tokens';

/**
 * The home is the map (Duolingo-minimal): a one-line top bar (the child's pet
 * and its level, the daily gift when there is one, berries) above the journey.
 * Everything else lives in the tabs.
 */
export function HomeScreen() {
  const { t } = useT();
  const pet = useAtomValue(activePetAtom);
  const accessory = useAtomValue(activePetAccessoryAtom);
  const berries = useAtomValue(berriesAtom);
  const canClaimGift = useAtomValue(canClaimGiftAtom);
  const claimGift = useSetAtom(claimDailyGiftAtom);
  const { english } = useSpeak();

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={pet ? t('visitPet', { name: pet.pet.nickname }) : t('myPets')}
          onPress={() => {
            if (!pet) return;
            english(pet.species.catchphrase);
            router.push({ pathname: '/pet/[speciesId]', params: { speciesId: pet.species.id } });
          }}
          style={styles.pet}
          testID="home-pet"
        >
          {pet ? (
            <PetPortrait blueprint={pet.species.blueprint} stage={pet.stage} size={48} accessoryEmoji={accessory?.emoji} />
          ) : null}
          {pet ? (
            <View style={styles.petInfo}>
              <AppText variant="small" numberOfLines={1}>
                {t('level', { n: pet.level })}
              </AppText>
              <ProgressBar value={pet.isMaxLevel ? 1 : pet.xpInLevel / pet.xpNeeded} height={8} color={colors.primary} />
            </View>
          ) : null}
        </Pressable>
        {canClaimGift ? (
          <IconButton icon="🎁" label={t('dailyGift')} onPress={() => claimGift()} badge="!" background={colors.yellow} size={44} testID="home-gift" />
        ) : null}
        <BerryPill amount={berries} />
      </View>
      <JourneyMap />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  pet: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  petInfo: { width: 110, gap: 2 },
});
