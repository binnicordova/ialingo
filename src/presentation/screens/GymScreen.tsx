import { router } from 'expo-router';
import { useAtomValue } from 'jotai';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PRACTICE_LESSON_ID } from '@/domain/curriculum/lesson-generator';
import { activePetAtom, berriesAtom, wordGymAtom } from '@/state/selectors';

import { PetPortrait } from '../art/PetPortrait';
import { AppText, BerryPill, BigButton, Card, Screen, TopBar } from '../components/ui';
import { useT } from '../i18n/use-t';
import { colors, spacing } from '../theme/tokens';

/** Word Gym: unlimited spaced-repetition practice of the words already met. */
export function GymScreen() {
  const { t } = useT();
  const gym = useAtomValue(wordGymAtom);
  const pet = useAtomValue(activePetAtom);
  const berries = useAtomValue(berriesAtom);
  return (
    <Screen background="#FFF3E0">
      <TopBar title={`🏋️ ${t('wordGym')}`} onBack={() => router.back()} right={<BerryPill amount={berries} />} />
      <ScrollView contentContainerStyle={styles.body}>
        <Animated.View entering={FadeInDown.springify()} style={styles.stretch}>
          <Card style={styles.card}>
            {pet ? <PetPortrait blueprint={pet.species.blueprint} stage={pet.stage} size={130} mood="wow" /> : <Text style={styles.emoji}>🏋️</Text>}
            <AppText variant="title" center>
              {gym.open ? t('wordGymDue', { n: Math.max(gym.due, gym.focus) }) : t('wordGymLocked')}
            </AppText>
            <AppText variant="body" center color={colors.inkSoft}>
              {t('wordGymInfo')}
            </AppText>
          </Card>
        </Animated.View>
        <View style={styles.dumbbells} accessibilityElementsHidden importantForAccessibility="no">
          {Array.from({ length: Math.min(10, gym.sessions) }, (_, i) => (
            <Text key={i} style={styles.medal}>
              🏅
            </Text>
          ))}
        </View>
        <BigButton
          label={t('wordGymStart')}
          icon="💪"
          tone="orange"
          disabled={!gym.open}
          onPress={() => router.push({ pathname: '/lesson/[lessonId]', params: { lessonId: PRACTICE_LESSON_ID } })}
          style={styles.stretch}
          testID="gym-start"
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.xl, gap: spacing.lg, alignItems: 'center' },
  stretch: { alignSelf: 'stretch' },
  card: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  emoji: { fontSize: 96 },
  dumbbells: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs },
  medal: { fontSize: 22 },
});
