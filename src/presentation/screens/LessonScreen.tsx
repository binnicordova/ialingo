import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, SlideInDown, ZoomIn } from 'react-native-reanimated';

import type { Exercise, ExerciseAnswer } from '@/domain/curriculum/exercises';
import type { CatalogIndex } from '@/domain/game/catalog';
import { currentExercise, sessionProgress } from '@/domain/learning/lesson-session';
import { hashSeed } from '@/domain/shared/rng';
import { contentAtom } from '@/state/core';
import {
  activeLessonAtom,
  continueLessonAtom,
  quitLessonAtom,
  startLessonAtom,
  submitAnswerAtom,
  type ActiveLesson,
} from '@/state/lesson';
import { activePetAtom, canRecordPostcardAtom } from '@/state/selectors';

import { CharacterAvatar } from '../art/CharacterAvatar';
import { PetPortrait } from '../art/PetPortrait';
import { AppText, BigButton, IconButton, ProgressBar, Screen, StarRow } from '../components/ui';
import { ExerciseView } from '../exercises/ExerciseViews';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { PetStage3D, type PetStageHandle } from '../three/PetStage3D';
import { colors, radii, spacing, tint } from '../theme/tokens';

/** Plays one lesson: exercises, then feedback, then the results screen. */
export function LessonScreen({ lessonId }: { lessonId: string }) {
  const active = useAtomValue(activeLessonAtom);
  const start = useSetAtom(startLessonAtom);
  const quit = useSetAtom(quitLessonAtom);

  useEffect(() => {
    start(lessonId);
  }, [lessonId, start]);

  useEffect(() => () => quit(), [quit]);

  if (!active || active.lesson.id !== lessonId) return <Screen>{null}</Screen>;
  if (active.completed) return <LessonResults active={active} onReplay={() => start(lessonId)} />;
  return <LessonPlayer active={active} />;
}

function correctAnswerText(exercise: Exercise, content: CatalogIndex): { emoji: string; text: string } {
  switch (exercise.kind) {
    case 'learn-card':
      return { emoji: content.word(exercise.wordId)?.emoji ?? '', text: content.word(exercise.wordId)?.en ?? '' };
    case 'listen-pick-picture':
    case 'picture-pick-word': {
      const w = content.word(exercise.answerId);
      return { emoji: w?.emoji ?? '', text: w?.en ?? '' };
    }
    case 'true-false': {
      const w = content.word(exercise.spokenWordId);
      const same = exercise.spokenWordId === exercise.shownWordId;
      return { emoji: same ? '✅' : '❌', text: w?.en ?? '' };
    }
    case 'match-pairs':
      return { emoji: '🧩', text: exercise.wordIds.map((id) => content.word(id)?.en ?? '').join(' · ') };
    case 'spell-word': {
      const w = content.word(exercise.wordId);
      return { emoji: w?.emoji ?? '', text: w?.en ?? '' };
    }
    case 'build-sentence':
    case 'speak-sentence': {
      const s = content.sentence(exercise.sentenceId);
      return { emoji: s?.emoji ?? '', text: s?.en ?? '' };
    }
    case 'speak-word': {
      const w = content.word(exercise.wordId);
      return { emoji: w?.emoji ?? '', text: w?.en ?? '' };
    }
    case 'story-page': {
      const line = content.story(exercise.storyId)?.lines[exercise.lineIndex];
      return { emoji: line?.emoji ?? '', text: line?.en ?? '' };
    }
  }
}

function LessonPlayer({ active }: { active: ActiveLesson }) {
  const { t, l } = useT();
  const content = useAtomValue(contentAtom);
  const pet = useAtomValue(activePetAtom);
  const submit = useSetAtom(submitAnswerAtom);
  const proceed = useSetAtom(continueLessonAtom);
  const { characterEnglish, english, stop } = useSpeak();
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [line, setLine] = useState<string | null>(null);

  const world = content.world(active.lesson.plan.worldId);
  const guide = world ? content.character(world.guideId) : undefined;
  const exercise = currentExercise(active.session);
  if (!exercise || !world) return <Screen>{null}</Screen>;

  // The spoken instruction plays the first time each kind appears in this lesson.
  const firstOfKind =
    active.lesson.exercises.find((e) => e.kind === exercise.kind)?.id === exercise.id &&
    !active.session.retried.includes(exercise.id);

  const onAnswer = (answer: ExerciseAnswer) => {
    const correct = submit(answer);
    if (exercise.kind === 'learn-card' || exercise.kind === 'story-page') {
      proceed();
      return;
    }
    if (correct === null) return;
    if (correct) {
      const cheers = guide?.cheers ?? ['Great job!'];
      // Deterministic variety: the same exercise always gets the same line.
      const cheer = cheers[hashSeed(exercise.id) % cheers.length] ?? 'Great job!';
      setLine(cheer);
      characterEnglish(cheer, guide);
    } else {
      const encouragements = guide?.encouragements ?? ['Almost!'];
      setLine(encouragements[hashSeed(exercise.id) % encouragements.length] ?? 'Almost!');
      const answerText = correctAnswerText(exercise, content).text;
      if (exercise.kind === 'speak-word' || exercise.kind === 'speak-sentence') setLine(t('moveOn'));
      if (exercise.kind !== 'match-pairs') english(answerText);
    }
  };

  const background = tint(world.color, 0.82);
  const feedback = active.feedback;
  const answer = feedback && !feedback.correct ? correctAnswerText(exercise, content) : null;

  return (
    <Screen background={background}>
      <View style={styles.header}>
        <IconButton icon="✖️" label={t('quitYes')} onPress={() => setConfirmQuit(true)} size={48} testID="lesson-close" />
        <ProgressBar value={sessionProgress(active.session)} style={styles.progress} />
        {pet ? (
          <PetPortrait blueprint={pet.species.blueprint} stage={pet.stage} size={52} mood={feedback?.correct ? 'wow' : 'happy'} />
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.body} bounces={false}>
        <ExerciseView
          key={`${exercise.id}-${active.session.answeredCount}`}
          exercise={exercise}
          locked={feedback !== null}
          onAnswer={onAnswer}
          introduce={firstOfKind}
          guide={guide}
        />
      </ScrollView>

      {guide && !feedback ? (
        <View style={styles.guideCorner} pointerEvents="none">
          <CharacterAvatar look={guide.look} size={64} />
        </View>
      ) : null}

      {feedback ? (
        <Animated.View
          entering={SlideInDown.springify().damping(16)}
          style={[styles.feedback, { backgroundColor: feedback.correct ? colors.successSoft : '#FFF1E0' }]}
        >
          <View style={styles.feedbackRow}>
            {guide ? <CharacterAvatar look={guide.look} size={64} mood={feedback.correct ? 'cheer' : 'happy'} bob={false} /> : null}
            <View style={styles.feedbackText}>
              <AppText variant="title" color={feedback.correct ? colors.successDark : colors.orangeDark}>
                {feedback.correct ? t('correct') : t('almost')}
              </AppText>
              {line ? (
                <AppText variant="body" color={colors.inkSoft}>
                  {line}
                </AppText>
              ) : null}
              {answer ? (
                <AppText variant="body" color={colors.ink}>
                  {t('answerIs')} {answer.emoji} {answer.text}
                </AppText>
              ) : null}
            </View>
          </View>
          <BigButton
            label={t('continue')}
            tone={feedback.correct ? 'success' : 'orange'}
            onPress={() => {
              stop();
              setLine(null);
              proceed();
            }}
            testID="lesson-continue"
          />
        </Animated.View>
      ) : null}

      <Modal transparent visible={confirmQuit} animationType="fade" onRequestClose={() => setConfirmQuit(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {pet ? <PetPortrait blueprint={pet.species.blueprint} stage={pet.stage} size={110} /> : null}
            <AppText variant="title" center>
              {t('quitLessonTitle')}
            </AppText>
            <AppText variant="body" center color={colors.inkSoft}>
              {t('quitLessonBody')}
            </AppText>
            <BigButton label={t('quitNo')} tone="success" onPress={() => setConfirmQuit(false)} />
            <BigButton
              label={t('quitYes')}
              tone="neutral"
              compact
              onPress={() => {
                setConfirmQuit(false);
                stop();
                router.back();
              }}
            />
          </View>
        </View>
      </Modal>
      {world && !feedback ? (
        <View style={styles.worldTag} pointerEvents="none">
          <Text style={styles.worldTagEmoji}>{world.emoji}</Text>
          <AppText variant="tiny" color={colors.inkSoft}>
            {l(world.title)}
          </AppText>
        </View>
      ) : null}
    </Screen>
  );
}

function LessonResults({ active, onReplay }: { active: ActiveLesson; onReplay: () => void }) {
  const { t } = useT();
  const pet = useAtomValue(activePetAtom);
  const content = useAtomValue(contentAtom);
  const { characterEnglish } = useSpeak();
  const stageRef = useRef<PetStageHandle>(null);
  const offerPostcard = useAtomValue(canRecordPostcardAtom);
  const summary = active.summary;
  const world = content.world(active.lesson.plan.worldId);
  const guide = world ? content.character(world.guideId) : undefined;

  useEffect(() => {
    stageRef.current?.play('love');
    const timer = setTimeout(() => stageRef.current?.play('jump'), 1300);
    characterEnglish(summary?.perfect ? 'Perfect! You are amazing!' : 'Great job! Well done!', guide);
    return () => clearTimeout(timer);
  }, [characterEnglish, guide, summary?.perfect]);

  return (
    <Screen background={colors.backgroundWarm}>
      <ScrollView contentContainerStyle={styles.results}>
        <Animated.View entering={ZoomIn.springify()}>
          <AppText variant="hero" center color={colors.primary}>
            {summary?.perfect ? t('perfectLesson') : t('lessonComplete')}
          </AppText>
        </Animated.View>
        <Animated.View entering={ZoomIn.delay(250).springify()}>
          <StarRow stars={summary?.stars ?? 1} size={54} />
        </Animated.View>
        {pet ? (
          <PetStage3D
            ref={stageRef}
            blueprint={pet.species.blueprint}
            stage={pet.stage}
            accessory={(() => {
              const acc = pet.pet.accessoryId ? content.accessory(pet.pet.accessoryId) : undefined;
              return acc ? { model: acc.model, color: acc.color } : null;
            })()}
            background={colors.backgroundWarm}
            ground="#FFD8A8"
            style={styles.resultStage}
            onTap={() => stageRef.current?.play('spin')}
            accessibilityLabel={pet.pet.nickname}
          />
        ) : null}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.rewardRow}>
          <View style={styles.rewardChip}>
            <Text style={styles.rewardEmoji}>🍓</Text>
            <AppText variant="heading" color={colors.berry}>
              {t('earnedBerries', { n: summary?.berries ?? 0 })}
            </AppText>
          </View>
          {pet ? (
            <View style={styles.rewardChip}>
              <Text style={styles.rewardEmoji}>✨</Text>
              <AppText variant="heading" color={colors.primary}>
                {t('earnedXp', { n: summary?.xp ?? 0, name: pet.pet.nickname })}
              </AppText>
            </View>
          ) : null}
        </Animated.View>
        {pet ? (
          <View style={styles.xpBlock}>
            <AppText variant="small" color={colors.inkSoft}>
              {t('level', { n: pet.level })}
            </AppText>
            <ProgressBar value={pet.isMaxLevel ? 1 : pet.xpInLevel / pet.xpNeeded} color={colors.primary} />
          </View>
        ) : null}
        <View style={styles.resultButtons}>
          {offerPostcard ? (
            <BigButton
              label={t('postcardOffer')}
              icon="💌"
              tone="orange"
              compact
              onPress={() => router.replace('/postcard')}
              testID="results-postcard"
            />
          ) : null}
          <BigButton label={t('continue')} tone="success" onPress={() => router.back()} testID="results-continue" />
          <BigButton label={t('playAgain')} tone="neutral" compact icon="🔁" onPress={onReplay} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  progress: { flex: 1 },
  body: { flexGrow: 1, paddingTop: spacing.md, paddingBottom: 140 },
  guideCorner: { position: 'absolute', right: spacing.md, bottom: spacing.xl },
  worldTag: {
    position: 'absolute',
    left: spacing.lg,
    bottom: spacing.xl + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    opacity: 0.8,
  },
  worldTagEmoji: { fontSize: 18 },
  feedback: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    gap: spacing.md,
  },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  feedbackText: { flex: 1, gap: 2 },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  modalCard: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.xl, gap: spacing.md, alignItems: 'stretch' },
  results: { padding: spacing.xl, gap: spacing.lg, alignItems: 'center' },
  resultStage: { width: '100%', height: 280, borderRadius: radii.xl },
  rewardRow: { gap: spacing.sm, alignSelf: 'stretch' },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  rewardEmoji: { fontSize: 28 },
  xpBlock: { alignSelf: 'stretch', gap: spacing.xs },
  resultButtons: { alignSelf: 'stretch', gap: spacing.sm },
});
