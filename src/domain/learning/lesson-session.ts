import { isScored, targetWordIds, type Exercise } from '../curriculum/exercises';
import type { WordId } from '../curriculum/types';

/**
 * Lesson feel tuning (design/tuning.md, ADR 0008). "In a row" is momentum
 * shown to the child, never a penalty: a miss quietly starts it again.
 */
export const LESSON_FEEL = {
  /** The "in a row" badge appears from this many right answers in a row. */
  inARowShownFrom: 3,
  /** Every this-many in a row: a full-screen pet moment, and the progress bar turns gold. */
  inARowMoment: 5,
  /** Seconds before an in-a-row moment moves on by itself (a tap skips it). */
  inARowMomentSeconds: 2.6,
} as const;

/**
 * State of a lesson being played.
 *
 * Rule (from the game brief): a missed exercise comes back once at the end of
 * the queue. Only the first attempt counts for the score, so children practise
 * the miss without being punished twice.
 */
export interface LessonSession {
  readonly exercises: Readonly<Record<string, Exercise>>;
  /** Exercise ids still to play; the head is the current one. */
  readonly queue: readonly string[];
  /** First-attempt result per scored exercise. */
  readonly firstAttempt: Readonly<Record<string, boolean>>;
  /** Exercises already re-queued after a miss. */
  readonly retried: readonly string[];
  readonly totalPlanned: number;
  readonly answeredCount: number;
  /** Scored answers right in a row (any attempt); a miss resets it to 0. */
  readonly inARow: number;
  readonly bestInARow: number;
}

export function startSession(exercises: readonly Exercise[]): LessonSession {
  return {
    exercises: Object.fromEntries(exercises.map((e) => [e.id, e])),
    queue: exercises.map((e) => e.id),
    firstAttempt: {},
    retried: [],
    totalPlanned: exercises.length,
    answeredCount: 0,
    inARow: 0,
    bestInARow: 0,
  };
}

export function currentExercise(session: LessonSession): Exercise | null {
  const id = session.queue[0];
  return id ? (session.exercises[id] ?? null) : null;
}

export function isFinished(session: LessonSession): boolean {
  return session.queue.length === 0;
}

/** Records the answer to the current exercise and advances the queue. */
export function answerCurrent(session: LessonSession, correct: boolean): LessonSession {
  const [id, ...rest] = session.queue;
  if (!id) return session;
  const exercise = session.exercises[id];
  if (!exercise) return { ...session, queue: rest };

  const scored = isScored(exercise);
  const firstTime = scored && session.firstAttempt[id] === undefined;
  const firstAttempt = firstTime ? { ...session.firstAttempt, [id]: correct } : session.firstAttempt;

  const shouldRetry = scored && !correct && !session.retried.includes(id);
  const inARow = !scored ? session.inARow : correct ? session.inARow + 1 : 0;
  return {
    ...session,
    firstAttempt,
    queue: shouldRetry ? [...rest, id] : rest,
    retried: shouldRetry ? [...session.retried, id] : session.retried,
    answeredCount: session.answeredCount + 1,
    inARow,
    bestInARow: Math.max(session.bestInARow, inARow),
  };
}

/** True when the current exercise is the second try of an earlier miss. */
export function isSecondTry(session: LessonSession): boolean {
  const id = session.queue[0];
  return id !== undefined && session.retried.includes(id);
}

/** A full-screen pet moment shown between two exercises. */
export type LessonMoment =
  | { readonly kind: 'in-a-row'; readonly count: number }
  | { readonly kind: 'second-try' };

/**
 * Moments to show after advancing from `before` to `after`: a cheer every
 * `inARowMoment` answers in a row, and a "let's try again" intro before the
 * first re-queued exercise. None once the lesson is finished (the results
 * screen celebrates instead).
 */
export function momentsBetween(before: LessonSession, after: LessonSession): LessonMoment[] {
  if (isFinished(after)) return [];
  const moments: LessonMoment[] = [];
  if (after.inARow > before.inARow && after.inARow % LESSON_FEEL.inARowMoment === 0) {
    moments.push({ kind: 'in-a-row', count: after.inARow });
  }
  if (isSecondTry(after) && !isSecondTry(before)) moments.push({ kind: 'second-try' });
  return moments;
}

/**
 * The first scored exercise for each word a lesson introduces: where the child
 * meets the new word in a quiz for the first time (shown with a "new word" tag).
 */
export function firstQuizIds(exercises: readonly Exercise[], newWordIds: readonly WordId[]): ReadonlySet<string> {
  const fresh = new Set(newWordIds);
  const met = new Set<WordId>();
  const ids = new Set<string>();
  for (const exercise of exercises) {
    if (!isScored(exercise)) continue;
    for (const wordId of targetWordIds(exercise)) {
      if (!fresh.has(wordId) || met.has(wordId)) continue;
      met.add(wordId);
      ids.add(exercise.id);
    }
  }
  return ids;
}

/** Correct first attempts and scored exercises, for the results screen. */
export function sessionTally(session: LessonSession): { readonly correct: number; readonly total: number } {
  const results = Object.values(session.firstAttempt);
  return { correct: results.filter(Boolean).length, total: results.length };
}

/** Share of the lesson done, for the progress bar. Re-queued items extend the bar. */
export function sessionProgress(session: LessonSession): number {
  const total = session.answeredCount + session.queue.length;
  return total === 0 ? 1 : session.answeredCount / total;
}

/** Share of scored exercises answered correctly on the first try. */
export function sessionAccuracy(session: LessonSession): number {
  const results = Object.values(session.firstAttempt);
  if (results.length === 0) return 1;
  return results.filter(Boolean).length / results.length;
}

/** One mastery update per (word, first-attempt result), consumed by progress. */
export interface WordResult {
  readonly wordId: WordId;
  readonly correct: boolean;
}

export function sessionWordResults(session: LessonSession): WordResult[] {
  const results: WordResult[] = [];
  for (const [id, correct] of Object.entries(session.firstAttempt)) {
    const exercise = session.exercises[id];
    if (!exercise) continue;
    for (const wordId of targetWordIds(exercise)) results.push({ wordId, correct });
  }
  return results;
}
