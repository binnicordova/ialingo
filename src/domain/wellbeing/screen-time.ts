import type { DayKey } from '../shared/day';

/**
 * Daily play-time budget set by a parent. When it runs out the pet goes to
 * sleep: a calm, story-based stop instead of a nagging pop-up (Pillar 4).
 * Only active play time is counted (the app in the foreground).
 */
export const SCREEN_TIME_OPTIONS_MINUTES = [10, 15, 20, 30, 45, 60] as const;
export const DEFAULT_DAILY_LIMIT_MINUTES = 30;
export const EXTRA_TIME_MINUTES = 10;

export interface ScreenTime {
  readonly day: DayKey;
  readonly secondsUsed: number;
  readonly bonusMinutes: number;
}

export function createScreenTime(today: DayKey): ScreenTime {
  return { day: today, secondsUsed: 0, bonusMinutes: 0 };
}

/** Starts a fresh budget when the calendar day changes. */
export function rollOverDay(state: ScreenTime, today: DayKey): ScreenTime {
  return state.day === today ? state : createScreenTime(today);
}

export function addUsage(state: ScreenTime, seconds: number, today: DayKey): ScreenTime {
  const current = rollOverDay(state, today);
  return { ...current, secondsUsed: current.secondsUsed + Math.max(0, Math.round(seconds)) };
}

export function grantExtraTime(state: ScreenTime, minutes: number, today: DayKey): ScreenTime {
  const current = rollOverDay(state, today);
  return { ...current, bonusMinutes: current.bonusMinutes + Math.max(0, minutes) };
}

/** Seconds left today, or null when there is no limit. */
export function secondsLeft(
  state: ScreenTime,
  limitMinutes: number | null,
  today: DayKey,
): number | null {
  if (limitMinutes === null) return null;
  const current = rollOverDay(state, today);
  return Math.max(0, (limitMinutes + current.bonusMinutes) * 60 - current.secondsUsed);
}

export function isLimitReached(
  state: ScreenTime,
  limitMinutes: number | null,
  today: DayKey,
): boolean {
  const left = secondsLeft(state, limitMinutes, today);
  return left !== null && left <= 0;
}
