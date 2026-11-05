import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { claimDailyGiftAtom, tapFeedbackAtom } from '@/state/actions';
import { contentAtom } from '@/state/core';
import {
  activePetAtom,
  berriesAtom,
  canClaimGiftAtom,
  eggsAtom,
  worldViewsAtom,
  type WorldView,
} from '@/state/selectors';

import { CharacterAvatar } from '../art/CharacterAvatar';
import { PetPortrait } from '../art/PetPortrait';
import { SpeechBubble } from '../components/game';
import { AppText, BerryPill, BigButton, Card, IconButton, ProgressBar, Screen } from '../components/ui';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { colors, radii, shade, shadow, spacing } from '../theme/tokens';

/** The Adventure Map: next lesson up front, every world below as a winding path. */
export function HomeScreen() {
  const { t, l } = useT();
  const worlds = useAtomValue(worldViewsAtom);
  const pet = useAtomValue(activePetAtom);
  const berries = useAtomValue(berriesAtom);
  const canClaim = useAtomValue(canClaimGiftAtom);
  const eggs = useAtomValue(eggsAtom);
  const content = useAtomValue(contentAtom);
  const claimGift = useSetAtom(claimDailyGiftAtom);
  const { english } = useSpeak();

  const current =
    worlds.find((w) => w.unlocked && !w.completed && w.nextLesson) ??
    [...worlds].reverse().find((w) => w.unlocked) ??
    worlds[0];
  const nextPlan = current?.nextLesson ?? null;
  const guide = current ? content.character(current.world.guideId) : undefined;
  const accessory = pet?.pet.accessoryId ? content.accessory(pet.pet.accessoryId) : undefined;

  const play = () => {
    if (nextPlan) router.push({ pathname: '/lesson/[lessonId]', params: { lessonId: nextPlan.id } });
    else if (current) router.push({ pathname: '/world/[worldId]', params: { worldId: current.world.id } });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={pet ? t('visitPet', { name: pet.pet.nickname }) : t('myPets')}
          onPress={() => {
            if (pet) {
              english(pet.species.catchphrase);
              router.push({ pathname: '/pet/[speciesId]', params: { speciesId: pet.species.id } });
            }
          }}
          style={styles.petButton}
          testID="home-pet"
        >
          {pet ? (
            <PetPortrait blueprint={pet.species.blueprint} stage={pet.stage} size={62} accessoryEmoji={accessory?.emoji} />
          ) : null}
          <View style={styles.petInfo}>
            <AppText variant="heading" numberOfLines={1}>
              {pet?.pet.nickname ?? t('appName')}
            </AppText>
            {pet ? (
              <View style={styles.levelRow}>
                <AppText variant="tiny" color={colors.inkSoft}>
                  {t('level', { n: pet.level })}
                </AppText>
                <ProgressBar value={pet.isMaxLevel ? 1 : pet.xpInLevel / pet.xpNeeded} height={10} color={colors.primary} style={styles.levelBar} />
              </View>
            ) : null}
          </View>
        </Pressable>
        <BerryPill amount={berries} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {current ? (
          <Animated.View entering={FadeInDown.springify()}>
            <Card style={[styles.hero, { backgroundColor: current.world.color }]}>
              <View style={styles.heroTop}>
                {guide ? <CharacterAvatar look={guide.look} size={92} /> : null}
                <SpeechBubble style={styles.heroBubble}>
                  <AppText variant="small" color={colors.inkSoft}>
                    {current.world.emoji} {l(current.world.title)}
                  </AppText>
                  <AppText variant="heading">
                    {nextPlan
                      ? nextPlan.kind === 'learn'
                        ? t('lessonLearn', { n: nextPlan.index })
                        : nextPlan.kind === 'review'
                          ? t('lessonReview')
                          : t('lessonBoss')
                      : t('worldDone')}
                  </AppText>
                </SpeechBubble>
              </View>
              <BigButton label={t('continueAdventure')} icon="▶️" tone="success" onPress={play} testID="home-play" />
            </Card>
          </Animated.View>
        ) : null}

        <View style={styles.quickRow}>
          <IconButton icon="🐾" label={t('myPets')} onPress={() => router.push('/pets')} badge={eggs.length || null} size={64} testID="nav-pets" />
          <IconButton icon="👫" label={t('guides')} onPress={() => router.push('/guides')} size={64} testID="nav-guides" />
          <IconButton icon="🏅" label={t('badges')} onPress={() => router.push('/badges')} size={64} testID="nav-badges" />
          <IconButton
            icon="🎁"
            label={t('dailyGift')}
            onPress={() => claimGift()}
            badge={canClaim ? '!' : null}
            background={canClaim ? colors.yellow : colors.surface}
            size={64}
            testID="nav-gift"
          />
          <IconButton icon="🔒" label={t('parents')} onPress={() => router.push('/parents')} size={64} testID="nav-parents" />
        </View>

        <AppText variant="title" style={styles.mapTitle}>
          {t('adventureMap')}
        </AppText>
        <View style={styles.map}>
          {worlds.map((view, index) => (
            <WorldNode key={view.world.id} view={view} index={index} />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function WorldNode({ view, index }: { view: WorldView; index: number }) {
  const { t, l } = useT();
  const feedback = useSetAtom(tapFeedbackAtom);
  const { world, unlocked, completed, stars } = view;
  const align = index % 2 === 0 ? 'flex-start' : 'flex-end';
  const color = unlocked ? world.color : colors.locked;
  return (
    <View style={[styles.nodeRow, { alignItems: align }]}>
      {index > 0 ? <View style={[styles.connector, index % 2 === 0 ? styles.connectorLeft : styles.connectorRight]} /> : null}
      <Pressable
        testID={`world-${world.id}`}
        accessibilityRole="button"
        accessibilityLabel={unlocked ? l(world.title) : `${l(world.title)}, ${t('locked')}`}
        accessibilityHint={unlocked ? undefined : t('worldLockedHint')}
        onPress={() => {
          feedback();
          if (unlocked) router.push({ pathname: '/world/[worldId]', params: { worldId: world.id } });
        }}
        style={({ pressed }) => [styles.node, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
      >
        <View
          style={[
            styles.island,
            shadow,
            { backgroundColor: color, borderBottomColor: shade(color, 0.25) },
          ]}
        >
          <Text style={[styles.islandEmoji, !unlocked && styles.lockedEmoji]}>{unlocked ? world.emoji : '🔒'}</Text>
          {completed ? <Text style={styles.crown}>👑</Text> : null}
        </View>
        <View style={styles.nodeLabel}>
          <AppText variant="small" color={colors.inkSoft}>
            {world.order}
          </AppText>
          <AppText variant="heading" numberOfLines={2} color={unlocked ? colors.ink : colors.muted}>
            {l(world.title)}
          </AppText>
          {unlocked ? (
            <AppText variant="tiny" color={colors.inkSoft}>
              ⭐ {stars.earned}/{stars.max}
            </AppText>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  petButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  petInfo: { flex: 1, gap: 2 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  levelBar: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { gap: spacing.md },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroBubble: { flex: 1 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  mapTitle: { marginTop: spacing.sm },
  map: { gap: spacing.sm },
  nodeRow: { width: '100%' },
  connector: {
    position: 'absolute',
    top: -26,
    width: 6,
    height: 40,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  connectorLeft: { left: '30%' },
  connectorRight: { right: '30%' },
  node: { width: '74%', flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  island: {
    width: 92,
    height: 92,
    borderRadius: radii.xl,
    borderBottomWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  islandEmoji: { fontSize: 46 },
  lockedEmoji: { fontSize: 32, opacity: 0.8 },
  crown: { position: 'absolute', top: -14, right: -8, fontSize: 28 },
  nodeLabel: { flex: 1 },
});
