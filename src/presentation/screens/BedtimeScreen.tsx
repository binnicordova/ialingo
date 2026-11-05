import { router } from 'expo-router';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { contentAtom } from '@/state/core';
import { activePetAtom, screenTimeAtom } from '@/state/selectors';

import { AppText, BigButton, Screen } from '../components/ui';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { PetStage3D } from '../three/PetStage3D';
import { radii, spacing } from '../theme/tokens';

const NIGHT = '#2B2D5C';

/**
 * The daily limit is reached: the pet falls asleep. A calm, story-based stop
 * instead of an alarm. Only a grown-up (behind the gate) can add time.
 */
export function BedtimeScreen() {
  const { t } = useT();
  const pet = useAtomValue(activePetAtom);
  const content = useAtomValue(contentAtom);
  const { limitReached } = useAtomValue(screenTimeAtom);
  const { english } = useSpeak();

  useEffect(() => {
    const timer = setTimeout(() => english('Good night! See you tomorrow!'), 600);
    return () => clearTimeout(timer);
  }, [english]);

  useEffect(() => {
    if (!limitReached) router.replace('/home');
  }, [limitReached]);

  const accessory = pet?.pet.accessoryId ? content.accessory(pet.pet.accessoryId) : undefined;

  return (
    <Screen background={NIGHT}>
      {pet ? (
        <PetStage3D
          blueprint={pet.species.blueprint}
          stage={pet.stage}
          accessory={accessory ? { model: accessory.model, color: accessory.color } : null}
          sleeping
          background={NIGHT}
          ground="#5C6BC0"
          style={styles.stage}
          accessibilityLabel={pet.pet.nickname}
        />
      ) : null}
      <View style={styles.text}>
        <AppText variant="title" center color="#FFFFFF">
          🌙 {t('bedtimeTitle', { name: pet?.pet.nickname ?? '' })}
        </AppText>
        <AppText variant="body" center color="#D6D8FF">
          {t('bedtimeBody')}
        </AppText>
        <AppText variant="small" center color="#AEB2F0">
          {t('askGrownup')}
        </AppText>
        <BigButton label={t('parents')} icon="🔒" tone="neutral" compact onPress={() => router.push('/parents')} testID="bedtime-parents" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, marginHorizontal: spacing.lg, borderRadius: radii.xl },
  text: { padding: spacing.xl, gap: spacing.md },
});
