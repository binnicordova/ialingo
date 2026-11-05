import type { VoiceDiaryEntry } from '../game/game-state';
import { daysBetween, type DayKey } from '../shared/day';

/**
 * Voice diary ("progress you can hear"): once a week, if a parent turned it
 * on, the child records a short voice postcard. Parents can compare the first
 * postcards with the latest ones. Retention is bounded: the first entries
 * (the "before") and the most recent ones are kept, and the middle is pruned.
 */
export const VOICE_DIARY_TUNING = {
  maxEntries: 12,
  keepFirst: 2,
  daysBetweenPostcards: 7,
  maxSeconds: 6,
} as const;

export function canRecordPostcard(
  entries: readonly VoiceDiaryEntry[],
  today: DayKey,
  tuning = VOICE_DIARY_TUNING,
): boolean {
  const last = entries[entries.length - 1];
  return !last || daysBetween(last.day, today) >= tuning.daysBetweenPostcards;
}

/** Appends an entry and reports which old entries to delete from disk. */
export function addDiaryEntry(
  entries: readonly VoiceDiaryEntry[],
  entry: VoiceDiaryEntry,
  tuning = VOICE_DIARY_TUNING,
): { entries: VoiceDiaryEntry[]; removed: VoiceDiaryEntry[] } {
  const all = [...entries, entry];
  if (all.length <= tuning.maxEntries) return { entries: all, removed: [] };
  const overflow = all.length - tuning.maxEntries;
  const removed = all.slice(tuning.keepFirst, tuning.keepFirst + overflow);
  const kept = [...all.slice(0, tuning.keepFirst), ...all.slice(tuning.keepFirst + overflow)];
  return { entries: kept, removed };
}

export function removeDiaryEntry(
  entries: readonly VoiceDiaryEntry[],
  id: string,
): { entries: VoiceDiaryEntry[]; removed: VoiceDiaryEntry[] } {
  return {
    entries: entries.filter((e) => e.id !== id),
    removed: entries.filter((e) => e.id === id),
  };
}
