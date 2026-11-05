/**
 * Pet growth curve.
 *
 * Formula: XP needed to go from level n to n + 1 = BASE + STEP × (n − 1).
 * With BASE = 20 and STEP = 10, and about 25 XP per lesson, level 2 takes
 * about 1 lesson, level 5 about 5 lessons and level 10 about 20 lessons. Early
 * growth is fast (immediate reward) and slows down later.
 */
export const LEVELING_TUNING = {
  baseXp: 20,
  stepXp: 10,
  maxLevel: 20,
  /** First level of each growth stage. */
  kidStageLevel: 5,
  grownStageLevel: 10,
} as const;

export type GrowthStage = 'baby' | 'kid' | 'grown';

export function xpToNextLevel(level: number, tuning = LEVELING_TUNING): number {
  return tuning.baseXp + tuning.stepXp * (level - 1);
}

/** Level reached with a total amount of XP (1-based, capped at maxLevel). */
export function levelForXp(totalXp: number, tuning = LEVELING_TUNING): number {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  while (level < tuning.maxLevel && remaining >= xpToNextLevel(level, tuning)) {
    remaining -= xpToNextLevel(level, tuning);
    level += 1;
  }
  return level;
}

/** Progress inside the current level, for XP bars. */
export function levelProgress(
  totalXp: number,
  tuning = LEVELING_TUNING,
): { level: number; current: number; needed: number; isMax: boolean } {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  while (level < tuning.maxLevel && remaining >= xpToNextLevel(level, tuning)) {
    remaining -= xpToNextLevel(level, tuning);
    level += 1;
  }
  const isMax = level >= tuning.maxLevel;
  return { level, current: isMax ? 0 : remaining, needed: isMax ? 0 : xpToNextLevel(level, tuning), isMax };
}

export function stageForLevel(level: number, tuning = LEVELING_TUNING): GrowthStage {
  if (level >= tuning.grownStageLevel) return 'grown';
  if (level >= tuning.kidStageLevel) return 'kid';
  return 'baby';
}

/** Model scale per stage, used by the 3D renderer and portraits. */
export const STAGE_SCALE: Readonly<Record<GrowthStage, number>> = {
  baby: 0.75,
  kid: 0.9,
  grown: 1.05,
};
