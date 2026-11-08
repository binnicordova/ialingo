import { isLessonCompleted, type LearnerProgress } from '../learning/progress';
import { buildLessonPlans } from './lesson-plans';
import type { LessonPlan, World } from './types';

/**
 * Unlock rules (kept generous for young children):
 * - World 1 is always open.
 * - A world opens when every *learn* lesson of the previous world is done
 *   (review and boss are optional for moving on).
 * - A passed jump challenge opens its target world and every world before it.
 * - Inside a world, learn lessons open one after another; review and boss open
 *   once every learn lesson is done.
 */
export function isWorldUnlocked(
  world: World,
  worlds: readonly World[],
  progress: LearnerProgress,
): boolean {
  const sorted = [...worlds].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((w) => w.id === world.id);
  if (index <= 0) return true;
  if (index <= furthestJumpIndex(sorted, progress)) return true;
  const previous = sorted[index - 1];
  return previous ? areLearnLessonsDone(previous, progress) : true;
}

/** Position (in map order) of the furthest world reached by a jump, or -1. */
export function furthestJumpIndex(sortedWorlds: readonly World[], progress: LearnerProgress): number {
  let furthest = -1;
  sortedWorlds.forEach((w, i) => {
    if (progress.jumpedTo.includes(w.id)) furthest = i;
  });
  return furthest;
}

export function areLearnLessonsDone(world: World, progress: LearnerProgress): boolean {
  return buildLessonPlans(world)
    .filter((p) => p.kind === 'learn')
    .every((p) => isLessonCompleted(progress, p.id));
}

export function isLessonUnlocked(
  plan: LessonPlan,
  world: World,
  worlds: readonly World[],
  progress: LearnerProgress,
): boolean {
  if (!isWorldUnlocked(world, worlds, progress)) return false;
  const plans = buildLessonPlans(world);
  if (plan.kind === 'learn') {
    const previous = plans.find((p) => p.kind === 'learn' && p.index === plan.index - 1);
    return previous ? isLessonCompleted(progress, previous.id) : true;
  }
  return areLearnLessonsDone(world, progress);
}

/** A world is completed when its boss lesson has been finished. */
export function isWorldCompleted(world: World, progress: LearnerProgress): boolean {
  const boss = buildLessonPlans(world).find((p) => p.kind === 'boss');
  return boss ? isLessonCompleted(progress, boss.id) : false;
}

/** Stars collected in a world out of the maximum possible. */
export function worldStars(world: World, progress: LearnerProgress): { earned: number; max: number } {
  const plans = buildLessonPlans(world);
  const earned = plans.reduce((sum, p) => sum + (progress.lessons[p.id]?.bestStars ?? 0), 0);
  return { earned, max: plans.length * 3 };
}

/** The next lesson a child should play in a world (or null when everything is done). */
export function nextLessonInWorld(world: World, progress: LearnerProgress): LessonPlan | null {
  return buildLessonPlans(world).find((p) => !isLessonCompleted(progress, p.id)) ?? null;
}
