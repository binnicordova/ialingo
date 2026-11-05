import type { LessonId, WordId } from '../curriculum/types';
import type { DayKey } from '../shared/day';
import type { WordResult } from './lesson-session';
import { isLearned, isMastered, recordAnswer, type WordMastery } from './mastery';

/**
 * Stars for a finished lesson. Every finished lesson earns at least one star:
 * there is no fail state (Pillar 4: healthy loops).
 */
export const STAR_THRESHOLDS = { three: 0.9, two: 0.7 } as const;

export type Stars = 1 | 2 | 3;

export function starsForAccuracy(accuracy: number): Stars {
  if (accuracy >= STAR_THRESHOLDS.three) return 3;
  if (accuracy >= STAR_THRESHOLDS.two) return 2;
  return 1;
}

export interface LessonRecord {
  readonly bestStars: Stars;
  readonly plays: number;
  readonly lastPlayedDay: DayKey;
}

export interface LearnerProgress {
  readonly lessons: Readonly<Record<LessonId, LessonRecord>>;
  readonly mastery: Readonly<Record<WordId, WordMastery>>;
  /** Distinct days with at least one finished lesson (most recent last). */
  readonly daysPlayed: readonly DayKey[];
  readonly perfectLessons: number;
  readonly totalAnswers: number;
  readonly totalCorrect: number;
  /** Finished Word Gym sessions (practice is not stored per lesson). */
  readonly practiceSessions: number;
}

/** Number of distinct play days kept (bounded so storage never grows forever). */
export const MAX_DAYS_TRACKED = 400;

export function createProgress(): LearnerProgress {
  return {
    lessons: {},
    mastery: {},
    daysPlayed: [],
    perfectLessons: 0,
    totalAnswers: 0,
    totalCorrect: 0,
    practiceSessions: 0,
  };
}

export interface LessonCompletion {
  readonly lessonId: LessonId;
  readonly accuracy: number;
  readonly wordResults: readonly WordResult[];
  readonly today: DayKey;
}

export interface CompletionResult {
  readonly progress: LearnerProgress;
  readonly stars: Stars;
  readonly perfect: boolean;
  readonly firstCompletion: boolean;
}

/** Updates word mastery, play days and answer totals (shared by lessons and practice). */
function applyAnswers(
  progress: LearnerProgress,
  completion: Omit<LessonCompletion, 'lessonId'>,
): { progress: LearnerProgress; stars: Stars; perfect: boolean } {
  const stars = starsForAccuracy(completion.accuracy);
  const perfect = completion.accuracy >= 1;
  const mastery: Record<WordId, WordMastery> = { ...progress.mastery };
  for (const result of completion.wordResults) {
    mastery[result.wordId] = recordAnswer(mastery[result.wordId], result.correct, completion.today);
  }
  const daysPlayed = progress.daysPlayed.includes(completion.today)
    ? progress.daysPlayed
    : [...progress.daysPlayed, completion.today].slice(-MAX_DAYS_TRACKED);
  const correct = completion.wordResults.filter((r) => r.correct).length;
  return {
    stars,
    perfect,
    progress: {
      ...progress,
      mastery,
      daysPlayed,
      perfectLessons: progress.perfectLessons + (perfect ? 1 : 0),
      totalAnswers: progress.totalAnswers + completion.wordResults.length,
      totalCorrect: progress.totalCorrect + correct,
    },
  };
}

/** Applies a finished lesson to the learner's progress. */
export function recordLessonCompletion(
  progress: LearnerProgress,
  completion: LessonCompletion,
): CompletionResult {
  const previous = progress.lessons[completion.lessonId];
  const applied = applyAnswers(progress, completion);
  return {
    stars: applied.stars,
    perfect: applied.perfect,
    firstCompletion: previous === undefined,
    progress: {
      ...applied.progress,
      lessons: {
        ...progress.lessons,
        [completion.lessonId]: {
          bestStars: previous ? (Math.max(previous.bestStars, applied.stars) as Stars) : applied.stars,
          plays: (previous?.plays ?? 0) + 1,
          lastPlayedDay: completion.today,
        },
      },
    },
  };
}

/**
 * Applies a finished Word Gym session: mastery and totals change like a
 * lesson, but no lesson record is kept (practice is unlimited and never
 * unlocks anything).
 */
export function recordPracticeCompletion(
  progress: LearnerProgress,
  completion: Omit<LessonCompletion, 'lessonId'>,
): CompletionResult {
  const applied = applyAnswers(progress, completion);
  return {
    stars: applied.stars,
    perfect: applied.perfect,
    firstCompletion: progress.practiceSessions === 0,
    progress: { ...applied.progress, practiceSessions: progress.practiceSessions + 1 },
  };
}

export function isLessonCompleted(progress: LearnerProgress, lessonId: LessonId): boolean {
  return progress.lessons[lessonId] !== undefined;
}

export function countLearnedWords(progress: LearnerProgress): number {
  return Object.values(progress.mastery).filter(isLearned).length;
}

export function countMasteredWords(progress: LearnerProgress): number {
  return Object.values(progress.mastery).filter(isMastered).length;
}

export function countCompletedLessons(progress: LearnerProgress): number {
  return Object.keys(progress.lessons).length;
}
