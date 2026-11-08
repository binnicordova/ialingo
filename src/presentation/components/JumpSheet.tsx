import { router } from 'expo-router';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { JUMP_TUNING, jumpLessonId, skippedWorlds, type JourneyUnit } from '@/domain/curriculum/journey';
import { contentAtom } from '@/state/core';
import { progressAtom } from '@/state/selectors';

import { CharacterAvatar } from '../art/CharacterAvatar';
import { EmojiArt } from '../art/EmojiArt';
import { PetPortrait } from '../art/PetPortrait';
import { useCalm } from '../hooks/use-calm';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { colors, radii, spacing, tint } from '../theme/tokens';
import { SpeechBubble } from './game';
import { AppText, BigButton } from './ui';

/** Questions out of 5 to get right, shown to the child ("4 out of 5"). */
const PASS_OUT_OF_FIVE = Math.round(JUMP_TUNING.passAccuracy * 5);

/**
 * "Jump to {world}?": the full-screen offer behind a locked world's first
 * node. It names the worlds the challenge covers, shows the world's pet as the
 * goal, and reads itself aloud in the child's language. Nothing is lost by
 * saying "Not now" or by not passing.
 */
export function JumpSheet({ unit, onClose }: { unit: JourneyUnit; onClose: () => void }) {
  const { t, l } = useT();
  const insets = useSafeAreaInsets();
  const calm = useCalm();
  const content = useAtomValue(contentAtom);
  const progress = useAtomValue(progressAtom);
  const { native, stop } = useSpeak();
  const { world } = unit;
  const species = content.species(world.rewardSpeciesId);
  const guide = content.character(world.guideId);
  const skipped = skippedWorlds(world, content.orderedWorlds, progress);
  const title = t('jumpTitle', { world: l(world.title) });
  const body = t('jumpBody', { worlds: skipped.map((w) => l(w.title)).join(', '), right: PASS_OUT_OF_FIVE });

  useEffect(() => {
    native(`${title} ${body}`, guide);
    return () => stop();
  }, [native, stop, title, body, guide]);

  return (
    <Modal visible transparent={false} animationType={calm ? 'fade' : 'slide'} onRequestClose={onClose} statusBarTranslucent>
      <View
        style={[
          styles.screen,
          { backgroundColor: tint(world.color, 0.35), paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
        ]}
        accessibilityViewIsModal
      >
        <View style={styles.hero}>
          <Animated.View entering={calm ? undefined : ZoomIn.springify().damping(10)} style={styles.worldBadge}>
            <EmojiArt emoji="⏩" size={34} />
            <EmojiArt emoji={world.emoji} size={34} />
          </Animated.View>
          {species ? (
            <Animated.View entering={calm ? undefined : ZoomIn.delay(150).springify().damping(9)}>
              <PetPortrait blueprint={species.blueprint} stage="grown" size={190} mood="wow" />
            </Animated.View>
          ) : null}
          <AppText variant="title" center accessibilityRole="header">
            {title}
          </AppText>
        </View>
        <Animated.View entering={calm ? undefined : FadeInUp.delay(250)} style={styles.guideRow}>
          {guide ? <CharacterAvatar look={guide.look} size={72} talking /> : null}
          <SpeechBubble style={styles.bubble}>
            <AppText variant="body">{body}</AppText>
          </SpeechBubble>
        </Animated.View>
        <View style={styles.actions}>
          <BigButton
            label={t('jumpStart')}
            icon="⏩"
            tone="success"
            onPress={() => {
              onClose();
              router.push({ pathname: '/lesson/[lessonId]', params: { lessonId: jumpLessonId(world.id) } });
            }}
            testID="jump-start"
          />
          <BigButton label={t('notNow')} tone="neutral" compact onPress={onClose} testID="jump-not-now" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between' },
  hero: { alignItems: 'center', gap: spacing.md },
  worldBadge: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bubble: { flex: 1 },
  actions: { gap: spacing.sm },
});
