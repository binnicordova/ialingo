import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import type { GameEvent } from '@/application/events';
import { consumeEventAtom, playSfxAtom, speakAtom } from '@/state/actions';
import { contentAtom, pendingEventsAtom } from '@/state/core';
import { petCollectionAtom } from '@/state/selectors';

import { EggPortrait, PetPortrait } from '../art/PetPortrait';
import { useT } from '../i18n/use-t';
import { colors, radii, spacing } from '../theme/tokens';
import { AppText, BigButton } from './ui';

/** Events that get a full-screen celebration; everything else is consumed silently. */
const CELEBRATED: ReadonlySet<GameEvent['type']> = new Set([
  'pet-leveled-up',
  'egg-earned',
  'achievement-unlocked',
  'world-unlocked',
  'berries-earned',
  'not-enough-berries',
]);

/**
 * Shows one celebration at a time from the pending-events queue: level-ups,
 * new eggs, badges and new worlds. A short English phrase is spoken each time.
 */
export function CelebrationOverlay() {
  const events = useAtomValue(pendingEventsAtom);
  const consume = useSetAtom(consumeEventAtom);
  const event = events[0];

  useEffect(() => {
    if (event && !CELEBRATED.has(event.type)) consume();
    if (event?.type === 'berries-earned' && event.reason === 'welcome') consume();
  }, [event, consume]);

  if (!event || !CELEBRATED.has(event.type)) return null;
  if (event.type === 'berries-earned' && event.reason === 'welcome') return null;
  return <CelebrationCard key={`${events.length}-${event.type}`} event={event} onDone={consume} />;
}

function CelebrationCard({ event, onDone }: { event: GameEvent; onDone: () => void }) {
  const { t, l } = useT();
  const content = useAtomValue(contentAtom);
  const pets = useAtomValue(petCollectionAtom);
  const speak = useSetAtom(speakAtom);
  const sfx = useSetAtom(playSfxAtom);

  let emoji = '🎉';
  let title = '';
  let subtitle = '';
  let english = '';
  let art: React.ReactNode = null;
  let primary = { label: t('yay'), action: onDone };
  let secondary: { label: string; action: () => void } | null = null;

  switch (event.type) {
    case 'pet-leveled-up': {
      const pet = pets.owned[event.speciesId];
      const species = content.species(event.speciesId);
      title = event.stageChanged
        ? t('grewUp', { name: pet?.nickname ?? '' })
        : t('levelUp', { name: pet?.nickname ?? '', level: event.level });
      subtitle = t(`stage_${event.stage}`);
      english = event.stageChanged ? 'Look! I grew up!' : 'Level up!';
      if (species) art = <PetPortrait blueprint={species.blueprint} stage={event.stage} size={150} mood="wow" />;
      break;
    }
    case 'egg-earned': {
      const species = content.species(event.speciesId);
      title = t('eggEarned');
      english = 'A new egg!';
      if (species) art = <EggPortrait blueprint={species.blueprint} size={150} wobble={-8} />;
      primary = {
        label: t('hatchNow'),
        action: () => {
          onDone();
          router.push({ pathname: '/hatch/[speciesId]', params: { speciesId: event.speciesId } });
        },
      };
      secondary = { label: t('later'), action: onDone };
      break;
    }
    case 'achievement-unlocked': {
      const achievement = content.catalog.achievements.find((a) => a.id === event.achievementId);
      emoji = achievement?.emoji ?? '🏅';
      title = t('badgeEarned');
      subtitle = achievement ? `${l(achievement.title)}: ${l(achievement.description)}` : '';
      english = 'New badge!';
      break;
    }
    case 'world-unlocked': {
      const world = content.world(event.worldId);
      emoji = world?.emoji ?? '🗺️';
      title = t('worldUnlocked', { world: world ? l(world.title) : '' });
      english = 'A new world!';
      break;
    }
    case 'berries-earned':
      emoji = '🍓';
      title = t('giftClaimed', { n: event.amount });
      english = 'Yummy berries!';
      break;
    case 'not-enough-berries':
      emoji = '🍓';
      title = t('notEnoughBerries');
      english = '';
      break;
    default:
      break;
  }

  useEffect(() => {
    sfx(event.type === 'not-enough-berries' ? 'pop' : event.type === 'pet-leveled-up' ? 'level-up' : 'coin');
    if (english) speak({ text: english, language: 'target' });
  }, [event.type, english, sfx, speak]);

  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop}>
      <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.card}>
        {art ?? <Text style={styles.emoji}>{emoji}</Text>}
        <AppText variant="title" center>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body" color={colors.inkSoft} center>
            {subtitle}
          </AppText>
        ) : null}
        <View style={styles.actions}>
          <BigButton label={primary.label} onPress={primary.action} tone="success" testID="celebration-primary" />
          {secondary ? <BigButton label={secondary.label} onPress={secondary.action} tone="neutral" compact /> : null}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emoji: { fontSize: 84 },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm },
});
