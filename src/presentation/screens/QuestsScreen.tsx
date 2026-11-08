import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { ScrollView, StyleSheet } from 'react-native';

import { claimDailyGiftAtom } from '@/state/actions';
import { canClaimGiftAtom, journeyAtom } from '@/state/selectors';

import { QuestCard } from '../components/HomeActivities';
import { BigButton, Screen } from '../components/ui';
import { useT } from '../i18n/use-t';
import { spacing } from '../theme/tokens';

/** The Quests tab: today's three quests, the chest and the daily gift. */
export function QuestsScreen() {
  const { t } = useT();
  const journey = useAtomValue(journeyAtom);
  const canClaimGift = useAtomValue(canClaimGiftAtom);
  const claimGift = useSetAtom(claimDailyGiftAtom);
  const playNext = () => {
    if (journey.current) router.push({ pathname: '/lesson/[lessonId]', params: { lessonId: journey.current.lessonId } });
    else router.navigate('/home');
  };
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <QuestCard onPlay={playNext} />
        {canClaimGift ? (
          <BigButton label={t('dailyGift')} icon="🎁" tone="orange" onPress={() => claimGift()} testID="nav-gift" />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.lg },
});
