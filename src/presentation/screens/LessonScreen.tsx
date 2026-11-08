import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Modal, ScrollView, StyleSheet, View } from 'react-native';

import { isScored, type Exercise, type ExerciseAnswer } from '@/domain/curriculum/exercises';
import type { CatalogIndex } from '@/domain/game/catalog';
import { currentExercise, firstQuizIds, isSecondTry, sessionProgress } from '@/domain/learning/lesson-session';
import { hashSeed } from '@/domain/shared/rng';
import { contentAtom } from '@/state/core';
import {
  activeLessonAtom,
  continueLessonAtom,
  dismissMomentAtom,
  quitLessonAtom,
  startLessonAtom,
  submitAnswerAtom,
  type ActiveLesson,
} from '@/state/lesson';
import { activePetAtom } from '@/state/selectors';

import { PetPortrait } from '../art/PetPortrait';
import { AnswerBurst, ExerciseTag, FeedbackSheet, Hop, LessonProgress, Wobble } from '../components/lesson';
import { PetMoment } from '../components/PetMoment';
import { AppText, BigButton, IconButton, Screen } from '../components/ui';
import { ExerciseView } from '../exercises/ExerciseViews';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { colors, radii, spacing, tint } from '../theme/tokens';
import { LessonResults } from './LessonResults';

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
    case 'song': {
      const song = content.song(exercise.songId);
      return { emoji: '🎵', text: song?.lines[0]?.en ?? '' };
    }
    case 'lyric-gap': {
      const w = content.word(exercise.answerId);
      return { emoji: w?.emoji ?? '', text: w?.en ?? '' };
    }
  }
}

function LessonPlayer({ active }: { active: ActiveLesson }) {
  const { t } = useT();
  const content = useAtomValue(contentAtom);
  const pet = useAtomValue(activePetAtom);
  const submit = useSetAtom(submitAnswerAtom);
  const proceed = useSetAtom(continueLessonAtom);
  const dismissMoment = useSetAtom(dismissMomentAtom);
  const { characterEnglish, english, englishSlow, stop } = useSpeak();
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [line, setLine] = useState<string | null>(null);
  /** Counters that cue the header pet's hop and the content's wobble. */
  const [cues, setCues] = useState({ right: 0, miss: 0 });
  const firstQuizzes = useMemo(
    () => firstQuizIds(active.lesson.exercises, active.lesson.plan.newWordIds),
    [active.lesson],
  );

  const world = content.world(active.lesson.plan.worldId);
  const guide = world ? content.character(world.guideId) : undefined;
  const exercise = currentExercise(active.session);
  if (!exercise || !world) return <Screen>{null}</Screen>;

  // The spoken instruction plays the first time each kind appears in this lesson.
  const firstOfKind =
    active.lesson.exercises.find((e) => e.kind === exercise.kind)?.id === exercise.id &&
    !active.session.retried.includes(exercise.id);
  const secondTry = isSecondTry(active.session);
  const moment = active.moments[0];

  const onAnswer = (answer: ExerciseAnswer) => {
    // `exercise` is the one this view was rendered for: a stale tap is ignored by the state.
    const correct = submit({ exerciseId: exercise.id, answer });
    if (correct === null) return;
    if (!isScored(exercise)) {
      proceed(exercise.id);
      return;
    }
    AccessibilityInfo.announceForAccessibility(
      correct ? t('correct') : `${t('almost')} ${t('answerIs')} ${correctAnswerText(exercise, content).text}`,
    );
    setCues((c) => (correct ? { ...c, right: c.right + 1 } : { ...c, miss: c.miss + 1 }));
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
  const hearable = answer && exercise.kind !== 'match-pairs' ? answer.text : null;

  return (
    <Screen background={background}>
      <View style={styles.header}>
        <IconButton icon="✖️" label={t('quitYes')} onPress={() => setConfirmQuit(true)} size={48} testID="lesson-close" />
        <LessonProgress value={sessionProgress(active.session)} inARow={active.session.inARow} />
        {pet ? (
          <Hop cue={cues.right}>
            <PetPortrait blueprint={pet.species.blueprint} stage={pet.stage} size={52} mood={feedback?.correct ? 'wow' : 'happy'} />
          </Hop>
        ) : null}
      </View>

      <View style={styles.tagRow}>
        {secondTry ? (
          <ExerciseTag kind="second-try" />
        ) : firstQuizzes.has(exercise.id) ? (
          <ExerciseTag kind="new-word" />
        ) : null}
      </View>

      <Wobble cue={cues.miss} style={styles.stage}>
        <ScrollView contentContainerStyle={styles.body} bounces={false}>
          {moment ? null : (
            <ExerciseView
              key={`${exercise.id}-${active.session.answeredCount}`}
              exercise={exercise}
              locked={feedback !== null}
              onAnswer={onAnswer}
              introduce={firstOfKind}
              guide={guide}
            />
          )}
        </ScrollView>
      </Wobble>

      {feedback && isScored(exercise) ? (
        <AnswerBurst key={`burst-${exercise.id}-${active.session.answeredCount}`} correct={feedback.correct} />
      ) : null}

      {feedback ? (
        <FeedbackSheet
          key={`sheet-${exercise.id}-${active.session.answeredCount}`}
          correct={feedback.correct}
          title={feedback.correct ? t('correct') : t('almost')}
          line={line}
          answer={answer}
          guide={guide}
          onHear={hearable ? () => english(hearable) : undefined}
          onHearSlow={hearable ? () => englishSlow(hearable) : undefined}
          onContinue={() => {
            stop();
            setLine(null);
            proceed(exercise.id);
          }}
        />
      ) : null}

      {moment ? (
        <PetMoment
          key={`moment-${active.session.answeredCount}-${moment.kind}`}
          moment={moment}
          worldColor={world.color}
          guide={guide}
          onDone={dismissMoment}
        />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  tagRow: { minHeight: 26, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
  stage: { flex: 1 },
  body: { flexGrow: 1, paddingBottom: spacing.sm },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  modalCard: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.xl, gap: spacing.md, alignItems: 'stretch' },
});
