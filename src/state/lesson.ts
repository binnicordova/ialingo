import { atom } from 'jotai';

import { evaluateAnswer, isScored, type ExerciseAnswer, type ExerciseLookup } from '@/domain/curriculum/exercises';
import { jumpTargetOf, skippedWorlds } from '@/domain/curriculum/journey';
import {
  generateJumpChallenge,
  generateLesson,
  generatePracticeLesson,
  PRACTICE_LESSON_ID,
  type GeneratedLesson,
} from '@/domain/curriculum/lesson-generator';
import type { LessonId, WorldId } from '@/domain/curriculum/types';
import type { CatalogIndex } from '@/domain/game/catalog';
import type { GameState } from '@/domain/game/game-state';
import type { DayKey } from '@/domain/shared/day';
import {
  answerCurrent,
  currentExercise,
  isFinished,
  momentsBetween,
  sessionAccuracy,
  sessionTally,
  sessionWordResults,
  startSession,
  type LessonMoment,
  type LessonSession,
} from '@/domain/learning/lesson-session';
import { hashSeed } from '@/domain/shared/rng';

import { finishJumpChallengeAtom, finishLessonAtom, hapticAtom, playSfxAtom } from './actions';
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
  /** Full-screen pet moments waiting to be shown before the next exercise. */
  readonly moments: readonly LessonMoment[];
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
  /** Scored exercises right on the first try, out of `scoredTotal`. */
  readonly correctFirstTry: number;
  readonly scoredTotal: number;
  readonly bestInARow: number;
  /** Distinct words practised in scored exercises. */
  readonly wordsPracticed: number;
  /** Set for a jump challenge: the world it was for and whether it opened. */
  readonly jump: { readonly worldId: WorldId; readonly passed: boolean } | null;
}

/** An answer to one exercise; ignored if that exercise is no longer the current one. */
export interface SubmitAnswerInput {
  readonly exerciseId: string;
  readonly answer: ExerciseAnswer;
}

export const activeLessonAtom = atom<ActiveLesson | null>(null);

export function lookupFromContent(content: CatalogIndex): ExerciseLookup {
  return {
    wordText: (id) => content.word(id)?.en ?? '',
    sentenceText: (id) => content.sentence(id)?.en ?? '',
  };
}

/**
 * Builds the lesson behind an id: the Word Gym, a jump challenge, or a world's
 * lesson. Replays get a different seed, so exercises vary.
 */
function generateFor(lessonId: LessonId, content: CatalogIndex, state: GameState, today: DayKey): GeneratedLesson | null {
  const worlds = content.orderedWorlds;
  const { mastery } = state.progress;
  if (lessonId === PRACTICE_LESSON_ID) {
    // Word Gym: built from the words the child has met, most due first.
    const seed = hashSeed(`${lessonId}|${today}|${state.progress.practiceSessions}`);
    return generatePracticeLesson({ worlds, mastery, today, seed });
  }
  const jumpTarget = jumpTargetOf(lessonId);
  if (jumpTarget !== null) {
    const target = content.world(jumpTarget);
    if (!target) return null;
    const skipped = skippedWorlds(target, worlds, state.progress);
    const seed = hashSeed(`${lessonId}|${today}|${state.progress.totalAnswers}`);
    return generateJumpChallenge({ target, skipped, worlds, seed });
  }
  const plan = content.lessonPlan(lessonId);
  if (!plan) return null;
  const plays = state.progress.lessons[lessonId]?.plays ?? 0;
  return generateLesson({ plan, worlds, mastery, today, seed: hashSeed(`${lessonId}|${today}|${plays}`) });
}

export const startLessonAtom = atom(null, (get, set, lessonId: LessonId) => {
  const lesson = generateFor(lessonId, get(contentAtom), get(gameStateAtom), get(todayAtom));
  if (!lesson) return false;
  set(activeLessonAtom, {
    lesson,
    session: startSession(lesson.exercises),
    startedAt: get(servicesAtom).clock.now(),
    feedback: null,
    moments: [],
    completed: false,
    summary: null,
  });
  return true;
});

/**
 * Checks an answer and shows feedback (it does not advance yet). Returns null
 * when it is ignored: feedback is already showing, or the answer belongs to an
 * exercise that is no longer current (a fast double tap).
 */
export const submitAnswerAtom = atom(null, (get, set, input: SubmitAnswerInput) => {
  const active = get(activeLessonAtom);
  if (!active || active.feedback || active.moments.length > 0) return null;
  const exercise = currentExercise(active.session);
  if (!exercise || exercise.id !== input.exerciseId) return null;
  const correct = evaluateAnswer(exercise, input.answer, lookupFromContent(get(contentAtom)));
  if (isScored(exercise)) {
    set(playSfxAtom, correct ? 'correct' : 'wrong');
    set(hapticAtom, correct ? 'success' : 'warning');
  }
  set(activeLessonAtom, { ...active, feedback: { correct } });
  return correct;
});

/**
 * Moves on from `exerciseId` once it has been answered. Finishing the queue
 * completes the lesson; otherwise any pet moments are queued for the next one.
 * A stale or repeated call (double tap) is ignored.
 */
export const continueLessonAtom = atom(null, (get, set, exerciseId: string) => {
  const active = get(activeLessonAtom);
  if (!active || active.completed || !active.feedback) return;
  if (currentExercise(active.session)?.id !== exerciseId) return;
  const session = answerCurrent(active.session, active.feedback.correct);
  if (isFinished(session)) {
    const accuracy = sessionAccuracy(session);
    const wordResults = sessionWordResults(session);
    const jumpTarget = jumpTargetOf(active.lesson.id);
    const result =
      jumpTarget === null
        ? set(finishLessonAtom, { lessonId: active.lesson.id, accuracy, wordResults })
        : set(finishJumpChallengeAtom, { targetWorldId: jumpTarget, accuracy, wordResults });
    const done = result.events.find((e) => e.type === 'lesson-completed');
    const jump = result.events.find((e) => e.type === 'jump-finished');
    const tally = sessionTally(session);
    const summary: LessonSummary | null =
      done?.type === 'lesson-completed'
        ? {
            stars: done.stars,
            perfect: done.perfect,
            berries: done.berries,
            xp: done.xp,
            accuracy,
            correctFirstTry: tally.correct,
            scoredTotal: tally.total,
            bestInARow: session.bestInARow,
            wordsPracticed: new Set(wordResults.map((r) => r.wordId)).size,
            jump: jump?.type === 'jump-finished' ? { worldId: jump.worldId, passed: jump.passed } : null,
          }
        : null;
    set(playSfxAtom, 'level-up');
    set(activeLessonAtom, { ...active, session, feedback: null, moments: [], completed: true, summary });
    return;
  }
  const moments = momentsBetween(active.session, session);
  if (moments.length > 0) set(playSfxAtom, moments[0]?.kind === 'in-a-row' ? 'level-up' : 'pop');
  set(activeLessonAtom, { ...active, session, feedback: null, moments });
});

/** Closes the full-screen moment on show; the next exercise starts after the last one. */
export const dismissMomentAtom = atom(null, (get, set) => {
  const active = get(activeLessonAtom);
  if (!active || active.moments.length === 0) return;
  set(activeLessonAtom, { ...active, moments: active.moments.slice(1) });
});

export const quitLessonAtom = atom(null, (get, set) => {
  get(servicesAtom).speech.stop();
  set(activeLessonAtom, null);
});
