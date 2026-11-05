/**
 * Calendar day in the device's local time zone, formatted `YYYY-MM-DD`.
 * The game works in whole days (daily gift, screen-time reset, spaced repetition),
 * so we never store precise timestamps, which also keeps stored data minimal.
 */
export type DayKey = string;

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

/** Formats a Date as a local-time DayKey. */
export function toDayKey(date: Date): DayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** True when the value looks like a DayKey. */
export function isDayKey(value: unknown): value is DayKey {
  return typeof value === 'string' && DAY_KEY_PATTERN.test(value);
}

function toUtcMidnight(day: DayKey): number {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round((toUtcMidnight(to) - toUtcMidnight(from)) / MS_PER_DAY);
}

/** The day `days` after `day` (calendar arithmetic in UTC, so no time zone drift). */
export function addDays(day: DayKey, days: number): DayKey {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}
