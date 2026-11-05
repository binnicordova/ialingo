import type { SpeciesId } from '../curriculum/types';
import type { LocalizedText } from '../shared/locale';

export type AchievementId = string;

export type AchievementCondition =
  | { readonly type: 'lessons-completed'; readonly count: number }
  | { readonly type: 'words-learned'; readonly count: number }
  | { readonly type: 'perfect-lessons'; readonly count: number }
  | { readonly type: 'days-played'; readonly count: number }
  | { readonly type: 'pets-fed'; readonly count: number }
  | { readonly type: 'worlds-completed'; readonly count: number };

export interface AchievementReward {
  readonly berries?: number;
  readonly speciesId?: SpeciesId;
}

export interface Achievement {
  readonly id: AchievementId;
  readonly emoji: string;
  readonly title: LocalizedText;
  readonly description: LocalizedText;
  readonly condition: AchievementCondition;
  readonly reward: AchievementReward;
}

/** Numbers the achievement rules are checked against. */
export interface AchievementMetrics {
  readonly lessonsCompleted: number;
  readonly wordsLearned: number;
  readonly perfectLessons: number;
  readonly daysPlayed: number;
  readonly petsFed: number;
  readonly worldsCompleted: number;
}

export function metricFor(condition: AchievementCondition, metrics: AchievementMetrics): number {
  switch (condition.type) {
    case 'lessons-completed':
      return metrics.lessonsCompleted;
    case 'words-learned':
      return metrics.wordsLearned;
    case 'perfect-lessons':
      return metrics.perfectLessons;
    case 'days-played':
      return metrics.daysPlayed;
    case 'pets-fed':
      return metrics.petsFed;
    case 'worlds-completed':
      return metrics.worldsCompleted;
  }
}

/** Achievements whose condition is now met and that have not been earned yet. */
export function newlyEarned(
  all: readonly Achievement[],
  earned: readonly AchievementId[],
  metrics: AchievementMetrics,
): Achievement[] {
  return all.filter(
    (a) => !earned.includes(a.id) && metricFor(a.condition, metrics) >= a.condition.count,
  );
}

/** Progress from 0 to 1 toward an achievement, for the badges screen. */
export function achievementProgress(achievement: Achievement, metrics: AchievementMetrics): number {
  return Math.min(1, metricFor(achievement.condition, metrics) / achievement.condition.count);
}
