import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { levelInfo } from '@/domain/curriculum/levels';
import { tapFeedbackAtom } from '@/state/actions';
import { contentAtom } from '@/state/core';
import { berriesAtom, lessonViewsFor, petCollectionAtom, type LessonView } from '@/state/selectors';

import { CharacterAvatar } from '../art/CharacterAvatar';
import { EggPortrait } from '../art/PetPortrait';
import { SectionTitle, SpeechBubble } from '../components/game';
import { AppText, BerryPill, Pill, Screen, StarRow, TopBar } from '../components/ui';
import { useSpeak } from '../hooks/use-speak';
import { lessonTitle, LESSON_KIND_ICON } from '../i18n/labels';
import { useT } from '../i18n/use-t';
import { colors, radii, shade, shadow, spacing, tint } from '../theme/tokens';

/** One world: the guide's welcome, the lesson path, and a word gallery to explore. */
export function WorldScreen({ worldId }: { worldId: string }) {
  const { t, l } = useT();
  const content = useAtomValue(contentAtom);
  const berries = useAtomValue(berriesAtom);
  const pets = useAtomValue(petCollectionAtom);
  const lessonsAtom = useMemo(() => lessonViewsFor(worldId), [worldId]);
  const lessons = useAtomValue(lessonsAtom);
  const { native, english } = useSpeak();
  const [talking, setTalking] = useState(false);

  const world = content.world(worldId);
  const guide = world ? content.character(world.guideId) : undefined;

  useEffect(() => {
    if (!guide) return;
    const timer = setTimeout(() => {
      setTalking(true);
      native(l(guide.greeting), guide, () => setTalking(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [guide, native, l]);

  if (!world) return <Screen>{null}</Screen>;
  const rewardSpecies = content.species(world.rewardSpeciesId);
  const rewardOwned = Boolean(pets.owned[world.rewardSpeciesId]) || pets.eggs.includes(world.rewardSpeciesId);

  return (
    <Screen background={tint(world.color, 0.8)}>
      <TopBar title={`${world.emoji} ${l(world.title)}`} onBack={() => router.back()} right={<BerryPill amount={berries} />} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {guide ? (
          <Pressable
            style={styles.guideRow}
            accessibilityRole="button"
            accessibilityLabel={guide.name}
            onPress={() => {
              setTalking(true);
              native(l(guide.greeting), guide, () => setTalking(false));
            }}
          >
            <CharacterAvatar look={guide.look} size={110} talking={talking} />
            <SpeechBubble style={styles.bubble}>
              <AppText variant="small" color={colors.inkSoft}>
                {guide.name}
              </AppText>
              <AppText variant="body">{l(guide.greeting)}</AppText>
            </SpeechBubble>
          </Pressable>
        ) : null}

        <View style={styles.levelRow}>
          <Pill
            label={`${levelInfo(world.level).emoji} ${l(levelInfo(world.level).title)} · ${levelInfo(world.level).cefr}`}
            color={levelInfo(world.level).color}
          />
        </View>

        <View style={styles.path}>
          {lessons.map((lesson, i) => (
            <Animated.View key={lesson.plan.id} entering={FadeInDown.delay(i * 60).springify()}>
              <LessonNode
                lesson={lesson}
                color={world.color}
                wordsEmoji={lesson.plan.newWordIds.map((id) => content.word(id)?.emoji ?? '').join(' ')}
                storyTitle={world.story ? l(world.story.title) : undefined}
                rewardEgg={
                  lesson.plan.kind === 'boss' && rewardSpecies && !rewardOwned ? (
                    <EggPortrait blueprint={rewardSpecies.blueprint} size={54} />
                  ) : null
                }
              />
            </Animated.View>
          ))}
        </View>

        <SectionTitle>{t('wordsInWorld')}</SectionTitle>
        <View style={styles.words}>
          {world.words.map((word) => (
            <Pressable
              key={word.id}
              accessibilityRole="button"
              accessibilityLabel={word.en}
              onPress={() => english(word.en)}
              style={({ pressed }) => [styles.wordChip, shadow, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
            >
              <Text style={styles.wordEmoji}>{word.emoji}</Text>
              <AppText variant="small" center numberOfLines={1}>
                {word.en}
              </AppText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function LessonNode({
  lesson,
  color,
  wordsEmoji,
  rewardEgg,
  storyTitle,
}: {
  lesson: LessonView;
  color: string;
  wordsEmoji: string;
  rewardEgg: React.ReactNode;
  storyTitle?: string;
}) {
  const { t } = useT();
  const feedback = useSetAtom(tapFeedbackAtom);
  const { plan, unlocked, stars } = lesson;
  const icon = plan.kind === 'learn' ? String(plan.index) : LESSON_KIND_ICON[plan.kind];
  const tone = unlocked ? (plan.kind === 'boss' ? colors.orange : color) : colors.locked;
  return (
    <Pressable
      testID={`lesson-${plan.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${lessonTitle(plan, t)}${unlocked ? '' : `, ${t('locked')}`}`}
      disabled={!unlocked}
      onPress={() => {
        feedback();
        router.push({ pathname: '/lesson/[lessonId]', params: { lessonId: plan.id } });
      }}
      style={({ pressed }) => [styles.lesson, shadow, { opacity: unlocked ? 1 : 0.7, transform: [{ translateY: pressed ? 3 : 0 }] }]}
    >
      <View style={[styles.lessonBadge, { backgroundColor: tone, borderBottomColor: shade(tone, 0.25) }]}>
        <AppText variant="title" color="#FFFFFF">
          {unlocked ? icon : '🔒'}
        </AppText>
      </View>
      <View style={styles.lessonInfo}>
        <AppText variant="heading">{lessonTitle(plan, t)}</AppText>
        {plan.kind === 'learn' ? (
          <AppText variant="body" numberOfLines={1}>
            {wordsEmoji}
          </AppText>
        ) : plan.kind === 'boss' ? (
          <Pill label={t('bossReward')} color={colors.orange} />
        ) : plan.kind === 'story' && storyTitle ? (
          <AppText variant="small" color={colors.inkSoft} numberOfLines={1}>
            {storyTitle}
          </AppText>
        ) : null}
        {stars > 0 ? <StarRow stars={stars} size={18} /> : null}
      </View>
      {rewardEgg}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bubble: { flex: 1 },
  path: { gap: spacing.md },
  levelRow: { flexDirection: 'row' },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  lessonBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonInfo: { flex: 1, gap: 2 },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  wordChip: {
    width: '30.5%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  wordEmoji: { fontSize: 34 },
});
