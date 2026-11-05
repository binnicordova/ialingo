import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ECONOMY_TUNING } from '@/domain/economy/economy';
import {
  buyAccessoryAtom,
  equipAccessoryAtom,
  feedPetAtom,
  playWithPetAtom,
  setActivePetAtom,
  tapFeedbackAtom,
} from '@/state/actions';
import { contentAtom } from '@/state/core';
import { accessoriesOwnedAtom, berriesAtom, ownedPetsAtom, petCollectionAtom } from '@/state/selectors';

import { SectionTitle } from '../components/game';
import { AppText, BerryPill, BigButton, Card, Pill, ProgressBar, Screen, TopBar } from '../components/ui';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import type { PetAction } from '../three/pet-scene';
import { PetStage3D, type PetStageHandle } from '../three/PetStage3D';
import { colors, radii, shadow, spacing, tint } from '../theme/tokens';

const PLAY_ACTIONS: readonly PetAction[] = ['jump', 'spin', 'love'];

/** The 3D pet room: play, feed, dress up, and pick who joins the adventure. */
export function PetRoomScreen({ speciesId }: { speciesId: string }) {
  const { t, l } = useT();
  const content = useAtomValue(contentAtom);
  const pets = useAtomValue(ownedPetsAtom);
  const collection = useAtomValue(petCollectionAtom);
  const berries = useAtomValue(berriesAtom);
  const owned = useAtomValue(accessoriesOwnedAtom);
  const feed = useSetAtom(feedPetAtom);
  const pat = useSetAtom(playWithPetAtom);
  const setActive = useSetAtom(setActivePetAtom);
  const buy = useSetAtom(buyAccessoryAtom);
  const equip = useSetAtom(equipAccessoryAtom);
  const feedback = useSetAtom(tapFeedbackAtom);
  const { english } = useSpeak();
  const stageRef = useRef<PetStageHandle>(null);
  const playIndex = useRef(0);

  const view = pets.find((p) => p.species.id === speciesId);
  if (!view) return <Screen>{null}</Screen>;
  const { pet, species } = view;
  const accessory = pet.accessoryId ? content.accessory(pet.accessoryId) : undefined;
  const isActive = collection.activeSpeciesId === species.id;
  const background = tint(species.blueprint.primary, 0.78);

  const playRandom = () => {
    const action = PLAY_ACTIONS[playIndex.current % PLAY_ACTIONS.length] ?? 'jump';
    playIndex.current += 1;
    stageRef.current?.play(action);
    pat(species.id);
    english(species.catchphrase);
  };

  const onFeed = () => {
    const result = feed(species.id);
    if (result.events.some((e) => e.type === 'pet-fed')) {
      stageRef.current?.play('eat');
      setTimeout(() => english('Yummy! Thank you!'), 900);
    }
  };

  return (
    <Screen background={background}>
      <TopBar title={pet.nickname} onBack={() => router.back()} right={<BerryPill amount={berries} />} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <PetStage3D
          key={species.id}
          ref={stageRef}
          blueprint={species.blueprint}
          stage={view.stage}
          accessory={accessory ? { model: accessory.model, color: accessory.color } : null}
          background={background}
          style={styles.stage}
          onTap={playRandom}
          accessibilityLabel={pet.nickname}
        />

        <Card style={styles.info}>
          <View style={styles.infoRow}>
            <View style={styles.infoText}>
              <AppText variant="title">{pet.nickname}</AppText>
              <AppText variant="small" color={colors.inkSoft}>
                {species.name} · {l(species.title)}
              </AppText>
            </View>
            <Pill label={t(`stage_${view.stage}`)} color={colors.primary} />
          </View>
          <View style={styles.meter}>
            <AppText variant="small">✨ {t('level', { n: view.level })}</AppText>
            <ProgressBar value={view.isMaxLevel ? 1 : view.xpInLevel / view.xpNeeded} color={colors.primary} />
          </View>
          <View style={styles.meter}>
            <AppText variant="small">❤️ {t('happiness')}</AppText>
            <ProgressBar value={pet.happiness / 100} color={colors.berry} />
          </View>
        </Card>

        <View style={styles.actions}>
          <BigButton label={`${t('feed')} 🍓${ECONOMY_TUNING.feedCost}`} tone="orange" onPress={onFeed} style={styles.action} testID="pet-feed" />
          <BigButton label={t('pet')} icon="💖" tone="sky" onPress={playRandom} style={styles.action} testID="pet-play" />
        </View>
        {isActive ? (
          <Pill label={`⭐ ${t('yourBuddy')}`} color={colors.yellow} textColor={colors.ink} />
        ) : (
          <BigButton label={t('takeOnAdventure')} icon="🎒" tone="success" onPress={() => setActive(species.id)} testID="pet-activate" />
        )}

        <SectionTitle>{t('accessories')}</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accessories}>
          {content.catalog.accessories.map((item) => {
            const has = owned.includes(item.id);
            const wearing = pet.accessoryId === item.id;
            return (
              <Pressable
                key={item.id}
                testID={`accessory-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel={l(item.name)}
                onPress={() => {
                  feedback();
                  if (!has) {
                    // Buying puts it on right away: one tap, instant reward.
                    const bought = buy(item.id);
                    if (bought.events.some((e) => e.type === 'accessory-bought')) {
                      equip({ speciesId: species.id, accessoryId: item.id });
                      stageRef.current?.play('spin');
                    }
                  } else {
                    equip({ speciesId: species.id, accessoryId: wearing ? null : item.id });
                  }
                }}
                style={({ pressed }) => [
                  styles.accessory,
                  shadow,
                  wearing && styles.accessoryOn,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Text style={styles.accessoryEmoji}>{item.emoji}</Text>
                <AppText variant="small" center numberOfLines={1}>
                  {l(item.name)}
                </AppText>
                <AppText variant="tiny" color={has ? colors.successDark : colors.berry}>
                  {has ? (wearing ? t('remove') : t('wear')) : `🍓 ${item.price}`}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  stage: { height: 330, borderRadius: radii.xl },
  info: { gap: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { flex: 1 },
  meter: { gap: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
  accessories: { gap: spacing.sm, paddingVertical: spacing.xs },
  accessory: {
    width: 104,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 2,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  accessoryOn: { borderColor: colors.success },
  accessoryEmoji: { fontSize: 36 },
});
