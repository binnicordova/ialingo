import type { Rng } from '../shared/rng';

/**
 * Parental gate: a multiplication with two factors from 6 to 9. Most 6–8 year
 * olds can't answer it yet, and any adult can. This follows the common
 * kids-category practice of a gate before settings and data deletion.
 */
export const GATE_TUNING = { minFactor: 6, maxFactor: 9 } as const;

export interface GateChallenge {
  readonly a: number;
  readonly b: number;
}

export function createGateChallenge(rng: Rng, tuning = GATE_TUNING): GateChallenge {
  return {
    a: rng.int(tuning.minFactor, tuning.maxFactor),
    b: rng.int(tuning.minFactor, tuning.maxFactor),
  };
}

export function gateAnswer(challenge: GateChallenge): number {
  return challenge.a * challenge.b;
}

/** Accepts the typed answer, ignoring spaces. */
export function verifyGate(challenge: GateChallenge, input: string): boolean {
  const value = Number.parseInt(input.replace(/\s+/g, ''), 10);
  return Number.isFinite(value) && value === gateAnswer(challenge);
}
