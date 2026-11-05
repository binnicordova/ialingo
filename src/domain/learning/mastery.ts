import type { WordId } from '../curriculum/types';
import { daysBetween, type DayKey } from '../shared/day';

/**
 * Spaced repetition with Leitner boxes.
 *
 * Box 0 = just met, box 5 = long-term. A correct answer moves the word up one
 * box. A wrong answer moves it down one box (a gentle variant for children;
 * classic Leitner sends it back to box 1).
 * A word is due again after LEITNER_INTERVAL_DAYS[box] days.
 */
export const LEITNER_INTERVAL_DAYS = [0, 1, 2, 4, 7, 14] as const;
export const MAX_BOX = LEITNER_INTERVAL_DAYS.length - 1;
/** A word counts as "learned" from this box (shown to parents). */
export const LEARNED_BOX = 2;
/** A word counts as "mastered" from this box. */
export const MASTERED_BOX = 4;

export interface WordMastery {
  readonly box: number;
  readonly lastReviewDay: DayKey;
  readonly seen: number;
  readonly correct: number;
}

/** Returns the new mastery after one scored answer. */
export function recordAnswer(
  previous: WordMastery | undefined,
  correct: boolean,
  today: DayKey,
): WordMastery {
  const box = previous?.box ?? 0;
  const nextBox = correct ? Math.min(MAX_BOX, box + 1) : Math.max(0, box - 1);
  return {
    box: nextBox,
    lastReviewDay: today,
    seen: (previous?.seen ?? 0) + 1,
    correct: (previous?.correct ?? 0) + (correct ? 1 : 0),
  };
}

/** True when the word should be reviewed again. */
export function isDue(mastery: WordMastery, today: DayKey): boolean {
  const interval = LEITNER_INTERVAL_DAYS[mastery.box] ?? 0;
  return daysBetween(mastery.lastReviewDay, today) >= interval;
}

export function isLearned(mastery: WordMastery | undefined): boolean {
  return (mastery?.box ?? 0) >= LEARNED_BOX;
}

export function isMastered(mastery: WordMastery | undefined): boolean {
  return (mastery?.box ?? 0) >= MASTERED_BOX;
}

/**
 * Orders already-seen candidate words for review: due words first, then lower
 * boxes, then the longest time since the last review.
 */
export function pickReviewWords(
  masteryByWord: Readonly<Record<WordId, WordMastery>>,
  candidateIds: readonly WordId[],
  today: DayKey,
  limit: number,
): WordId[] {
  return candidateIds
    .filter((id) => masteryByWord[id] !== undefined)
    .map((id) => {
      const m = masteryByWord[id] as WordMastery;
      return { id, due: isDue(m, today), box: m.box, age: daysBetween(m.lastReviewDay, today) };
    })
    .sort((a, b) => {
      if (a.due !== b.due) return a.due ? -1 : 1;
      if (a.box !== b.box) return a.box - b.box;
      if (a.age !== b.age) return b.age - a.age;
      return a.id.localeCompare(b.id);
    })
    .slice(0, limit)
    .map((x) => x.id);
}
