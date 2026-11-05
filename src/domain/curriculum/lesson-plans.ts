import type { LessonId, LessonPlan, World, WorldId } from './types';

/**
 * Tuning knobs for curriculum structure.
 * wordsPerLesson = 4 keeps new items under a young child's working-memory
 * limit (about 4 chunks). Words are split into ceil(n / 4) lessons of near-equal
 * size, so no lesson is left with 1–2 words (14 words → 4 + 4 + 3 + 3).
 */
export const CURRICULUM_TUNING = {
  wordsPerLesson: 4,
} as const;

/** Splits items into `ceil(n / max)` chunks whose sizes differ by at most one. */
export function balancedChunks<T>(items: readonly T[], max: number): T[][] {
  if (items.length === 0) return [];
  const count = Math.ceil(items.length / max);
  const base = Math.floor(items.length / count);
  const remainder = items.length % count;
  const chunks: T[][] = [];
  let cursor = 0;
  for (let i = 0; i < count; i += 1) {
    const size = base + (i < remainder ? 1 : 0);
    chunks.push(items.slice(cursor, cursor + size));
    cursor += size;
  }
  return chunks;
}

/** Builds the stable lesson id for a world slot, for example `farm.learn-2`. */
export function lessonIdFor(worldId: WorldId, slot: string): LessonId {
  return `${worldId}.${slot}`;
}

/** Splits a world's words into learn lessons and appends a review and a boss lesson. */
export function buildLessonPlans(world: World, tuning = CURRICULUM_TUNING): LessonPlan[] {
  const chunks = balancedChunks(
    world.words.map((w) => w.id),
    tuning.wordsPerLesson,
  );

  const plans: LessonPlan[] = chunks.map((newWordIds, i) => ({
    id: lessonIdFor(world.id, `learn-${i + 1}`),
    worldId: world.id,
    kind: 'learn',
    index: i + 1,
    newWordIds,
  }));
  plans.push({
    id: lessonIdFor(world.id, 'review'),
    worldId: world.id,
    kind: 'review',
    index: plans.length + 1,
    newWordIds: [],
  });
  plans.push({
    id: lessonIdFor(world.id, 'boss'),
    worldId: world.id,
    kind: 'boss',
    index: plans.length + 1,
    newWordIds: [],
  });
  return plans;
}

/** Index of every lesson plan by id, built once from the catalog. */
export function indexLessonPlans(worlds: readonly World[]): ReadonlyMap<LessonId, LessonPlan> {
  const map = new Map<LessonId, LessonPlan>();
  for (const world of worlds) {
    for (const plan of buildLessonPlans(world)) map.set(plan.id, plan);
  }
  return map;
}
