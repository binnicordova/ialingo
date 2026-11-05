import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { MiniGameKind } from '@/domain/play/mini-games';
import { tapFeedbackAtom } from '@/state/actions';
import { activePetAtom, berriesAtom, playParkAtom } from '@/state/selectors';

import { PetPortrait } from '../art/PetPortrait';
import { AppText, BerryPill, Card, ProgressBar, Screen, TopBar } from '../components/ui';
import type { StringKey } from '../i18n/strings';
import { useT } from '../i18n/use-t';
import { colors, radii, shade, shadow, spacing } from '../theme/tokens';

const GAMES: readonly { kind: MiniGameKind; emoji: string; title: StringKey; info: StringKey; color: string }[] = [
  { kind: 'bubble-pop', emoji: '🫧', title: 'bubblePop', info: 'bubblePopInfo', color: colors.sky },
  { kind: 'memory-match', emoji: '🃏', title: 'memoryMatch', info: 'memoryMatchInfo', color: colors.primary },
  { kind: 'i-spy', emoji: '🔍', title: 'iSpy', info: 'iSpyInfo', color: colors.success },
  { kind: 'odd-one-out', emoji: '🤔', title: 'oddOneOut', info: 'oddOneOutInfo', color: colors.orange },
];

/** Play Park: arcade games over learned words, with a daily berry cap. */
export function ParkScreen() {
  const { t } = useT();
  const park = useAtomValue(playParkAtom);
  const pet = useAtomValue(activePetAtom);
  const berries = useAtomValue(berriesAtom);
  const feedback = useSetAtom(tapFeedbackAtom);

  return (
    <Screen background="#E6F6FF">
      <TopBar title={`🎡 ${t('playPark')}`} onBack={() => router.back()} right={<BerryPill amount={berries} />} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.intro}>
          {pet ? <PetPortrait blueprint={pet.species.blueprint} stage={pet.stage} size={90} mood="happy" /> : null}
          <AppText variant="body" color={colors.inkSoft} style={styles.introText}>
            {park.open ? t('playParkInfo') : t('gameLocked', { n: park.minWords })}
          </AppText>
        </View>
        {GAMES.map((game, i) => {
          const open = game.kind === 'odd-one-out' ? park.oddOneOutOpen : park.open;
          const info = open ? t(game.info) : game.kind === 'odd-one-out' ? t('oddOneOutLocked') : t('gameLocked', { n: park.minWords });
          const tone = open ? game.color : colors.locked;
          return (
            <Animated.View key={game.kind} entering={FadeInDown.delay(i * 100).springify()}>
              <Pressable
                testID={`park-${game.kind}`}
                accessibilityRole="button"
                accessibilityLabel={`${t(game.title)}. ${info}`}
                disabled={!open}
                onPress={() => {
                  feedback();
                  router.push({ pathname: '/game/[kind]', params: { kind: game.kind } });
                }}
                style={({ pressed }) => [
                  styles.game,
                  shadow,
                  { backgroundColor: tone, borderBottomColor: shade(tone, 0.25), transform: [{ translateY: pressed ? 3 : 0 }] },
                ]}
              >
                <Text style={styles.gameEmoji}>{open ? game.emoji : '🔒'}</Text>
                <View style={styles.gameText}>
                  <AppText variant="title" color="#FFFFFF">
                    {t(game.title)}
                  </AppText>
                  <AppText variant="small" color="#FFFFFF">
                    {info}
                  </AppText>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
        <Card style={styles.cap}>
          <AppText variant="small" color={colors.inkSoft}>
            {park.berriesLeft > 0 ? t('gameBerriesLeft', { n: park.berriesLeft }) : t('gameBerriesCapped')}
          </AppText>
          <ProgressBar value={1 - park.berriesLeft / park.cap} color={colors.berry} height={12} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  intro: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  introText: { flex: 1 },
  game: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radii.xl,
    borderBottomWidth: 7,
    padding: spacing.lg,
    minHeight: 120,
  },
  gameEmoji: { fontSize: 56 },
  gameText: { flex: 1, gap: 4 },
  cap: { gap: spacing.sm },
});
