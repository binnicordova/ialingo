import type { SpeciesId } from '../curriculum/types';
import { daysBetween, type DayKey } from '../shared/day';
import { levelForXp, stageForLevel, type GrowthStage } from './leveling';

export type AccessoryId = string;

/**
 * A pet the child owns.
 *
 * Pillar 4 (healthy loops): happiness never drops below HAPPINESS_FLOOR, so a pet
 * is never sad or sick. Happy pets (at or above the bonus threshold) give bonus
 * XP, which rewards care without punishing absence.
 */
export const PET_TUNING = {
  startHappiness: 80,
  feedHappiness: 15,
  playHappiness: 5,
  maxHappiness: 100,
  happinessFloor: 50,
  decayPerDay: 10,
  bonusThreshold: 80,
  bonusMultiplier: 1.2,
} as const;

export interface OwnedPet {
  readonly speciesId: SpeciesId;
  readonly nickname: string;
  readonly xp: number;
  readonly happiness: number;
  readonly accessoryId: AccessoryId | null;
  readonly hatchedOn: DayKey;
  readonly lastCareDay: DayKey;
  readonly timesFed: number;
}

export function createPet(speciesId: SpeciesId, nickname: string, today: DayKey): OwnedPet {
  return {
    speciesId,
    nickname,
    xp: 0,
    happiness: PET_TUNING.startHappiness,
    accessoryId: null,
    hatchedOn: today,
    lastCareDay: today,
    timesFed: 0,
  };
}

export function petLevel(pet: OwnedPet): number {
  return levelForXp(pet.xp);
}

export function petStage(pet: OwnedPet): GrowthStage {
  return stageForLevel(petLevel(pet));
}

/** Adds XP and reports level and stage changes, for celebrations. */
export function gainXp(
  pet: OwnedPet,
  amount: number,
): { pet: OwnedPet; leveledUp: boolean; level: number; stageChanged: boolean; stage: GrowthStage } {
  const beforeLevel = petLevel(pet);
  const beforeStage = petStage(pet);
  const next = { ...pet, xp: pet.xp + Math.max(0, Math.round(amount)) };
  const level = petLevel(next);
  const stage = petStage(next);
  return { pet: next, leveledUp: level > beforeLevel, level, stageChanged: stage !== beforeStage, stage };
}

export function feedPet(pet: OwnedPet, today: DayKey): OwnedPet {
  return {
    ...pet,
    happiness: Math.min(PET_TUNING.maxHappiness, pet.happiness + PET_TUNING.feedHappiness),
    timesFed: pet.timesFed + 1,
    lastCareDay: today,
  };
}

export function playWithPet(pet: OwnedPet, today: DayKey): OwnedPet {
  return {
    ...pet,
    happiness: Math.min(PET_TUNING.maxHappiness, pet.happiness + PET_TUNING.playHappiness),
    lastCareDay: today,
  };
}

/** Lowers happiness gently for days without care, never below the floor. */
export function applyHappinessDecay(pet: OwnedPet, today: DayKey): OwnedPet {
  const days = daysBetween(pet.lastCareDay, today);
  if (days <= 0) return pet;
  const happiness = Math.max(
    PET_TUNING.happinessFloor,
    pet.happiness - PET_TUNING.decayPerDay * days,
  );
  return { ...pet, happiness, lastCareDay: today };
}

export function xpMultiplier(pet: OwnedPet): number {
  return pet.happiness >= PET_TUNING.bonusThreshold ? PET_TUNING.bonusMultiplier : 1;
}

export function equipAccessory(pet: OwnedPet, accessoryId: AccessoryId | null): OwnedPet {
  return { ...pet, accessoryId };
}
