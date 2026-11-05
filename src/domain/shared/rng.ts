/**
 * Deterministic pseudo-random number generator.
 *
 * Lessons are generated from a seed so the same seed always produces the same
 * lesson. That makes generation unit-testable and lets a lesson be rebuilt
 * after the app reloads.
 */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max] (inclusive). */
  int(min: number, max: number): number;
  /** Random element of a non-empty array. */
  pick<T>(items: readonly T[]): T;
  /** New array with the items shuffled (Fisher–Yates). The input is not mutated. */
  shuffle<T>(items: readonly T[]): T[];
  /** Up to `count` distinct random items. */
  sample<T>(items: readonly T[], count: number): T[];
  /** True with the given probability. */
  chance(probability: number): boolean;
}

/** Mulberry32: a small, fast, well-distributed 32-bit generator. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));

  const shuffle = <T>(items: readonly T[]): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1));
      const tmp = copy[i] as T;
      copy[i] = copy[j] as T;
      copy[j] = tmp;
    }
    return copy;
  };

  return {
    next,
    int,
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error('Rng.pick called with an empty array');
      return items[Math.floor(next() * items.length)] as T;
    },
    shuffle,
    sample: <T>(items: readonly T[], count: number): T[] => shuffle(items).slice(0, Math.max(0, count)),
    chance: (probability: number) => next() < probability,
  };
}

/** FNV-1a hash: turns any string (for example a lesson id plus a day) into a 32-bit seed. */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
