import { isScored, targetWordIds, type Exercise } from '../curriculum/exercises';
import type { WordId } from '../curriculum/types';

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
}

export function startSession(exercises: readonly Exercise[]): LessonSession {
  return {
    exercises: Object.fromEntries(exercises.map((e) => [e.id, e])),
    queue: exercises.map((e) => e.id),
    firstAttempt: {},
    retried: [],
    totalPlanned: exercises.length,
    answeredCount: 0,
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
  return {
    ...session,
    firstAttempt,
    queue: shouldRetry ? [...rest, id] : rest,
    retried: shouldRetry ? [...session.retried, id] : session.retried,
    answeredCount: session.answeredCount + 1,
  };
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
