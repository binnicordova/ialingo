import { isLessonCompleted, type LearnerProgress } from '../learning/progress';
import { buildLessonPlans } from './lesson-plans';
import type { LessonId, LessonPlan, World, WorldId } from './types';
import {
  areLearnLessonsDone,
  furthestJumpIndex,
  isLessonUnlocked,
  isWorldCompleted,
  isWorldUnlocked,
  worldStars,
} from './unlock-policy';

/**
 * The journey: every world and every lesson on one path, in map order (the
 * home screen's single map). Statuses come only from the unlock policy, so the
 * home map, a world's page and the commands always agree.
 */

/** Jump challenge tuning (design/tuning.md, ADR 0009). */
export const JUMP_TUNING = {
  /** First-try accuracy needed to open the world (Duolingo: fewer than 5 mistakes in about 20). */
  passAccuracy: 0.8,
  /** Words asked, spread across the worlds being skipped. */
  focusWords: 12,
} as const;

export type StepStatus = 'done' | 'current' | 'open' | 'locked';

export interface JourneyStep {
  readonly plan: LessonPlan;
  readonly status: StepStatus;
  readonly stars: number;
}

export interface JourneyUnit {
  readonly world: World;
  /** 1-based position on the map. */
  readonly position: number;
  /** True for the first world of its level (a new section starts here). */
  readonly startsLevel: boolean;
  readonly unlocked: boolean;
  readonly completed: boolean;
  readonly stars: { readonly earned: number; readonly max: number };
  readonly steps: readonly JourneyStep[];
  /** A locked world can be opened early with a jump challenge. */
  readonly canJump: boolean;
}

export interface Journey {
  readonly units: readonly JourneyUnit[];
  /** The lesson to play next, or null when everything is done. */
  readonly current: { readonly worldId: WorldId; readonly lessonId: LessonId } | null;
}

export function buildJourney(worlds: readonly World[], progress: LearnerProgress): Journey {
  const sorted = [...worlds].sort((a, b) => a.order - b.order);
  const current = currentLesson(sorted, progress);
  const units = sorted.map((world, i): JourneyUnit => {
    const unlocked = isWorldUnlocked(world, sorted, progress);
    const steps = buildLessonPlans(world).map((plan): JourneyStep => {
      const stars = progress.lessons[plan.id]?.bestStars ?? 0;
      let status: StepStatus;
      if (plan.id === current?.lessonId) status = 'current';
      else if (isLessonCompleted(progress, plan.id)) status = 'done';
      else if (unlocked && isLessonUnlocked(plan, world, sorted, progress)) status = 'open';
      else status = 'locked';
      return { plan, status, stars };
    });
    return {
      world,
      position: i + 1,
      startsLevel: i === 0 || sorted[i - 1]?.level !== world.level,
      unlocked,
      completed: isWorldCompleted(world, progress),
      stars: worldStars(world, progress),
      steps,
      canJump: canJumpTo(world, sorted, progress),
    };
  });
  return { units, current };
}

/**
 * The next lesson: the first unlocked, unfinished lesson on the map, starting
 * from the furthest world reached by a jump (skipped worlds stay playable but
 * the child is not sent back to them). Falls back to the start of the map.
 */
export function currentLesson(
  sortedWorlds: readonly World[],
  progress: LearnerProgress,
): Journey['current'] {
  const from = Math.max(0, furthestJumpIndex(sortedWorlds, progress));
  const scan = (start: number, end: number) => {
    for (let i = start; i < end; i += 1) {
      const world = sortedWorlds[i] as World;
      if (!isWorldUnlocked(world, sortedWorlds, progress)) continue;
      const plan = buildLessonPlans(world).find(
        (p) => !isLessonCompleted(progress, p.id) && isLessonUnlocked(p, world, sortedWorlds, progress),
      );
      if (plan) return { worldId: world.id, lessonId: plan.id };
    }
    return null;
  };
  return scan(from, sortedWorlds.length) ?? scan(0, from);
}

/* ------------------------------------------------------------ Jumping */

const JUMP_PREFIX = 'jump-';

/** Lesson id of the challenge that opens `worldId` (not a slot of any world). */
export function jumpLessonId(worldId: WorldId): LessonId {
  return `${JUMP_PREFIX}${worldId}`;
}

/** The world a jump challenge opens, or null for any other lesson id. */
export function jumpTargetOf(lessonId: LessonId): WorldId | null {
  return lessonId.startsWith(JUMP_PREFIX) ? lessonId.slice(JUMP_PREFIX.length) : null;
}

/**
 * Worlds the child would skip by jumping to `target`: every world before it
 * whose learn lessons are not all done. The challenge asks their words.
 */
export function skippedWorlds(
  target: World,
  worlds: readonly World[],
  progress: LearnerProgress,
): World[] {
  return [...worlds]
    .sort((a, b) => a.order - b.order)
    .filter((w) => w.order < target.order && !areLearnLessonsDone(w, progress));
}

/**
 * Can the child try to jump to this world now? Any locked world: a locked
 * world always has something to skip (at least the world before it).
 */
export function canJumpTo(target: World, worlds: readonly World[], progress: LearnerProgress): boolean {
  return !isWorldUnlocked(target, worlds, progress);
}

/** A jump challenge is passed with this first-try accuracy. There is no other way to fail it. */
export function isJumpPassed(accuracy: number, tuning = JUMP_TUNING): boolean {
  return accuracy >= tuning.passAccuracy;
}

/** The synthetic plan of a jump challenge, hosted by its target world (color, guide). */
export function jumpPlan(target: World): LessonPlan {
  return { id: jumpLessonId(target.id), worldId: target.id, kind: 'jump', index: 1, newWordIds: [] };
}
