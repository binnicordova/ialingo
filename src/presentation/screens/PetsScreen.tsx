import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { PetSpecies } from '@/domain/pets/species';
import { levelForXp, stageForLevel } from '@/domain/pets/leveling';
import { adoptPetAtom, tapFeedbackAtom } from '@/state/actions';
import { contentAtom } from '@/state/core';
import { berriesAtom, petCollectionAtom } from '@/state/selectors';

import { EggPortrait, PetPortrait } from '../art/PetPortrait';
import { AppText, BerryPill, BigButton, Pill, Screen, TopBar } from '../components/ui';
import { useT } from '../i18n/use-t';
import { colors, radii, shadow, spacing } from '../theme/tokens';

/** The pet collection: owned pets, eggs to hatch, and silhouettes that show how to unlock the rest. */
export function PetsScreen() {
  const { t } = useT();
  const content = useAtomValue(contentAtom);
  const collection = useAtomValue(petCollectionAtom);
  const berries = useAtomValue(berriesAtom);
  const species = content.catalog.species;
  const ownedCount = Object.keys(collection.owned).length;

  const ordered = [...species].sort((a, b) => rank(a) - rank(b));
  function rank(s: PetSpecies): number {
    if (collection.owned[s.id]) return 0;
    if (collection.eggs.includes(s.id)) return 1;
    return 2;
  }

  return (
    <Screen>
      <TopBar title={t('myPetsTitle')} right={<BerryPill amount={berries} />} />
      <AppText variant="body" center color={colors.inkSoft}>
        {t('petsCollected', { n: ownedCount, total: species.length })}
      </AppText>
      <ScrollView contentContainerStyle={styles.grid}>
        {ordered.map((s, i) => (
          <Animated.View key={s.id} entering={FadeInDown.delay(Math.min(i, 12) * 40)} style={styles.cell}>
            <PetCard species={s} />
          </Animated.View>
        ))}
      </ScrollView>
    </Screen>
  );
}

function PetCard({ species }: { species: PetSpecies }) {
  const { t, l } = useT();
  const content = useAtomValue(contentAtom);
  const collection = useAtomValue(petCollectionAtom);
  const adopt = useSetAtom(adoptPetAtom);
  const feedback = useSetAtom(tapFeedbackAtom);
  const owned = collection.owned[species.id];
  const hasEgg = collection.eggs.includes(species.id);
  const isActive = collection.activeSpeciesId === species.id;

  if (owned) {
    const level = levelForXp(owned.xp);
    const accessory = owned.accessoryId ? content.accessory(owned.accessoryId) : undefined;
    return (
      <Pressable
        testID={`pet-card-${species.id}`}
        accessibilityRole="button"
        accessibilityLabel={owned.nickname}
        onPress={() => {
          feedback();
          router.push({ pathname: '/pet/[speciesId]', params: { speciesId: species.id } });
        }}
        style={({ pressed }) => [styles.card, shadow, isActive && styles.activeCard, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
      >
        <PetPortrait blueprint={species.blueprint} stage={stageForLevel(level)} size={110} accessoryEmoji={accessory?.emoji} />
        <AppText variant="heading" numberOfLines={1}>
          {owned.nickname}
        </AppText>
        <AppText variant="tiny" color={colors.inkSoft}>
          {t('level', { n: level })}
        </AppText>
        {isActive ? <Pill label={`⭐ ${t('yourBuddy')}`} color={colors.yellow} textColor={colors.ink} /> : null}
      </Pressable>
    );
  }

  if (hasEgg) {
    return (
      <View style={[styles.card, shadow, styles.eggCard]}>
        <EggPortrait blueprint={species.blueprint} size={100} wobble={-6} />
        <AppText variant="heading">{t('newEgg')}</AppText>
        <BigButton
          label={t('hatch')}
          compact
          tone="orange"
          onPress={() => router.push({ pathname: '/hatch/[speciesId]', params: { speciesId: species.id } })}
          testID={`hatch-${species.id}`}
        />
      </View>
    );
  }

  let how = '';
  switch (species.unlock.type) {
    case 'world-boss': {
      const world = content.world(species.unlock.worldId);
      how = t('unlockBoss', { world: world ? l(world.title) : '' });
      break;
    }
    case 'achievement': {
      const id = species.unlock.achievementId;
      const badge = content.catalog.achievements.find((a) => a.id === id);
      how = t('unlockBadge', { badge: badge ? l(badge.title) : '' });
      break;
    }
    case 'starter':
      how = t('unlockShop', { n: species.shopPrice ?? 0 });
      break;
  }

  return (
    <View style={[styles.card, styles.lockedCard]}>
      <PetPortrait blueprint={species.blueprint} size={96} silhouette />
      <AppText variant="small" center color={colors.inkSoft}>
        {how}
      </AppText>
      {species.unlock.type === 'starter' && species.shopPrice ? (
        <BigButton label={`${t('adopt')} 🍓${species.shopPrice}`} compact tone="primary" onPress={() => adopt(species.id)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  cell: { width: '47.5%' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 210,
  },
  activeCard: { borderWidth: 3, borderColor: colors.yellow },
  eggCard: { backgroundColor: '#FFF4E0' },
  lockedCard: { backgroundColor: colors.surfaceAlt, justifyContent: 'center' },
});
