import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import type { QuestKind } from '@/domain/quests/quests';
import { QUEST_TUNING } from '@/domain/quests/quests';
import { claimQuestChestAtom, tapFeedbackAtom } from '@/state/actions';
import { albumAtom, activePetAtom, playParkAtom, questsAtom, wordGymAtom } from '@/state/selectors';

import { QUEST_LABEL } from '../i18n/labels';
import { useT } from '../i18n/use-t';
import { colors, fonts, radii, shade, shadow, spacing } from '../theme/tokens';
import { AppText, BigButton, Card } from './ui';

/** Today's three quests and the chest. Each quest is a shortcut to where it is done. */
export function QuestCard({ onPlay }: { onPlay: () => void }) {
  const { t } = useT();
  const { quests, canClaim, claimed } = useAtomValue(questsAtom);
  const pet = useAtomValue(activePetAtom);
  const claim = useSetAtom(claimQuestChestAtom);
  const feedback = useSetAtom(tapFeedbackAtom);

  const go = (kind: QuestKind) => {
    feedback();
    switch (kind) {
      case 'feed':
        if (pet) router.push({ pathname: '/pet/[speciesId]', params: { speciesId: pet.species.id } });
        break;
      case 'game':
        router.push('/park');
        break;
      case 'practice':
        router.push('/gym');
        break;
      default:
        onPlay();
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(120).springify()}>
      <Card style={styles.questCard}>
        <View style={styles.questHeader}>
          <AppText variant="heading">🗺️ {t('dailyQuests')}</AppText>
          <Text style={styles.chestEmoji} accessibilityElementsHidden importantForAccessibility="no">
            {claimed ? '📭' : canClaim ? '🎁' : '🧰'}
          </Text>
        </View>
        {quests.map((quest) => (
          <Pressable
            key={quest.kind}
            testID={`quest-${quest.kind}`}
            accessibilityRole="button"
            accessibilityLabel={`${t(QUEST_LABEL[quest.kind])}, ${quest.progress}/${quest.target}`}
            accessibilityState={{ checked: quest.done }}
            onPress={() => go(quest.kind)}
            style={({ pressed }) => [styles.questRow, quest.done && styles.questDone, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.questEmoji}>{quest.done ? '✅' : quest.emoji}</Text>
            <AppText variant="body" style={styles.questText} color={quest.done ? colors.successDark : colors.ink}>
              {t(QUEST_LABEL[quest.kind])}
            </AppText>
            <AppText variant="small" color={quest.done ? colors.successDark : colors.inkSoft}>
              {quest.progress}/{quest.target}
            </AppText>
          </Pressable>
        ))}
        {claimed ? (
          <AppText variant="small" center color={colors.inkSoft}>
            {t('questsDone')}
          </AppText>
        ) : (
          <Animated.View entering={canClaim ? ZoomIn.springify() : undefined}>
            <BigButton
              label={`${t('openChest')} 🍓${QUEST_TUNING.chestBerries}`}
              icon="🎁"
              tone={canClaim ? 'orange' : 'neutral'}
              compact
              disabled={!canClaim}
              onPress={() => claim()}
              testID="quest-chest"
            />
          </Animated.View>
        )}
      </Card>
    </Animated.View>
  );
}

/** Big tiles for the practice and play areas: Word Gym, sticker album, Play Park. */
export function ActivityTiles() {
  const { t } = useT();
  const gym = useAtomValue(wordGymAtom);
  const park = useAtomValue(playParkAtom);
  const album = useAtomValue(albumAtom);
  return (
    <View style={styles.tiles}>
      <ActivityTile
        emoji="🏋️"
        title={t('wordGym')}
        subtitle={gym.open ? t('wordGymDue', { n: Math.max(gym.due, gym.focus) }) : t('wordGymLocked')}
        color={colors.orange}
        locked={!gym.open}
        onPress={() => router.push('/gym')}
        testID="nav-gym"
      />
      <ActivityTile
        emoji="📒"
        title={t('wordAlbum')}
        subtitle={t('albumProgress', { n: album.totals.collected, total: album.totals.total })}
        color={colors.primary}
        onPress={() => router.push('/album')}
        testID="nav-album"
      />
      <ActivityTile
        emoji="🎡"
        title={t('playPark')}
        subtitle={park.open ? t('playParkInfo') : t('gameLocked', { n: park.minWords })}
        color={colors.sky}
        locked={!park.open}
        onPress={() => router.push('/park')}
        testID="nav-park"
      />
    </View>
  );
}

function ActivityTile({
  emoji,
  title,
  subtitle,
  color,
  locked = false,
  onPress,
  testID,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  locked?: boolean;
  onPress: () => void;
  testID: string;
}) {
  const feedback = useSetAtom(tapFeedbackAtom);
  const tone = locked ? colors.locked : color;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={() => {
        feedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.tile,
        shadow,
        { backgroundColor: tone, borderBottomColor: shade(tone, 0.25), transform: [{ translateY: pressed ? 3 : 0 }] },
      ]}
    >
      <Text style={styles.tileEmoji}>{locked ? '🔒' : emoji}</Text>
      <AppText variant="body" color="#FFFFFF" center numberOfLines={2} style={styles.tileTitle}>
        {title}
      </AppText>
      <AppText variant="tiny" color="#FFFFFF" center numberOfLines={2}>
        {subtitle}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  questCard: { gap: spacing.sm },
  questHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chestEmoji: { fontSize: 30 },
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  questDone: { backgroundColor: colors.successSoft },
  questEmoji: { fontSize: 24 },
  questText: { flex: 1 },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    borderRadius: radii.lg,
    borderBottomWidth: 6,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    minHeight: 128,
  },
  tileEmoji: { fontSize: 36 },
  tileTitle: { fontFamily: fonts.bold, lineHeight: 21 },
});
