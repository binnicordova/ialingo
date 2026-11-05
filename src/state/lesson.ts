import { atom } from 'jotai';

import { evaluateAnswer, type ExerciseAnswer, type ExerciseLookup } from '@/domain/curriculum/exercises';
import { generateLesson, type GeneratedLesson } from '@/domain/curriculum/lesson-generator';
import type { LessonId } from '@/domain/curriculum/types';
import type { CatalogIndex } from '@/domain/game/catalog';
import {
  answerCurrent,
  currentExercise,
  isFinished,
  sessionAccuracy,
  sessionWordResults,
  startSession,
  type LessonSession,
} from '@/domain/learning/lesson-session';
import { hashSeed } from '@/domain/shared/rng';

import { finishLessonAtom, hapticAtom, playSfxAtom } from './actions';
import { contentAtom, gameStateAtom, servicesAtom, todayAtom } from './core';

/**
 * The lesson being played. It is transient: not saved, because an
 * interrupted 3-minute lesson simply restarts, which is simpler and safer
 * for children.
 */
export interface ActiveLesson {
  readonly lesson: GeneratedLesson;
  readonly session: LessonSession;
  readonly startedAt: number;
  /** Result of the last answer, shown in the feedback bar until "continue". */
  readonly feedback: { readonly correct: boolean } | null;
  readonly completed: boolean;
  /** Rewards of this run, available once completed. */
  readonly summary: LessonSummary | null;
}

export interface LessonSummary {
  readonly stars: 1 | 2 | 3;
  readonly perfect: boolean;
  readonly berries: number;
  readonly xp: number;
  readonly accuracy: number;
}

export const activeLessonAtom = atom<ActiveLesson | null>(null);

export function lookupFromContent(content: CatalogIndex): ExerciseLookup {
  return {
    wordText: (id) => content.word(id)?.en ?? '',
    sentenceText: (id) => content.sentence(id)?.en ?? '',
  };
}

/** Builds a fresh lesson. Replays get a different seed, so exercises vary. */
export const startLessonAtom = atom(null, (get, set, lessonId: LessonId) => {
  const content = get(contentAtom);
  const plan = content.lessonPlan(lessonId);
  if (!plan) return false;
  const state = get(gameStateAtom);
  const today = get(todayAtom);
  const plays = state.progress.lessons[lessonId]?.plays ?? 0;
  const lesson = generateLesson({
    plan,
    worlds: content.orderedWorlds,
    mastery: state.progress.mastery,
    today,
    seed: hashSeed(`${lessonId}|${today}|${plays}`),
  });
  set(activeLessonAtom, {
    lesson,
    session: startSession(lesson.exercises),
    startedAt: get(servicesAtom).clock.now(),
    feedback: null,
    completed: false,
    summary: null,
  });
  return true;
});

/** Checks an answer and shows feedback (it does not advance yet). */
export const submitAnswerAtom = atom(null, (get, set, answer: ExerciseAnswer) => {
  const active = get(activeLessonAtom);
  if (!active || active.feedback) return null;
  const exercise = currentExercise(active.session);
  if (!exercise) return null;
  const correct = evaluateAnswer(exercise, answer, lookupFromContent(get(contentAtom)));
  if (exercise.kind !== 'learn-card') {
    set(playSfxAtom, correct ? 'correct' : 'wrong');
    set(hapticAtom, correct ? 'success' : 'warning');
  }
  set(activeLessonAtom, { ...active, feedback: { correct } });
  return correct;
});

/** Moves on after feedback. Finishing the queue completes the lesson. */
export const continueLessonAtom = atom(null, (get, set) => {
  const active = get(activeLessonAtom);
  if (!active) return;
  const correct = active.feedback?.correct ?? true;
  const session = answerCurrent(active.session, correct);
  if (isFinished(session) && !active.completed) {
    const accuracy = sessionAccuracy(session);
    const result = set(finishLessonAtom, {
      lessonId: active.lesson.id,
      accuracy,
      wordResults: sessionWordResults(session),
    });
    const done = result.events.find((e) => e.type === 'lesson-completed');
    const summary: LessonSummary | null =
      done?.type === 'lesson-completed'
        ? { stars: done.stars, perfect: done.perfect, berries: done.berries, xp: done.xp, accuracy }
        : null;
    set(playSfxAtom, 'level-up');
    set(activeLessonAtom, { ...active, session, feedback: null, completed: true, summary });
    return;
  }
  set(activeLessonAtom, { ...active, session, feedback: null });
});

export const quitLessonAtom = atom(null, (get, set) => {
  get(servicesAtom).speech.stop();
  set(activeLessonAtom, null);
});
