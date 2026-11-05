import type { SpeciesId } from '../curriculum/types';
import type { DayKey } from '../shared/day';
import { createPet, type OwnedPet } from './pet';

/** The child's pets: owned ones, the one joining lessons, and eggs waiting to hatch. */
export interface PetCollection {
  readonly owned: Readonly<Record<SpeciesId, OwnedPet>>;
  readonly activeSpeciesId: SpeciesId | null;
  readonly eggs: readonly SpeciesId[];
}

export function createCollection(): PetCollection {
  return { owned: {}, activeSpeciesId: null, eggs: [] };
}

export function ownsSpecies(collection: PetCollection, speciesId: SpeciesId): boolean {
  return collection.owned[speciesId] !== undefined;
}

export function hasEgg(collection: PetCollection, speciesId: SpeciesId): boolean {
  return collection.eggs.includes(speciesId);
}

/** Adds an egg unless the pet is already owned or the egg is already waiting. */
export function addEgg(collection: PetCollection, speciesId: SpeciesId): PetCollection {
  if (ownsSpecies(collection, speciesId) || hasEgg(collection, speciesId)) return collection;
  return { ...collection, eggs: [...collection.eggs, speciesId] };
}

/** Turns a waiting egg into a pet. The first pet becomes the active one. */
export function hatchEgg(
  collection: PetCollection,
  speciesId: SpeciesId,
  nickname: string,
  today: DayKey,
): PetCollection {
  if (!hasEgg(collection, speciesId) || ownsSpecies(collection, speciesId)) return collection;
  return {
    owned: { ...collection.owned, [speciesId]: createPet(speciesId, nickname, today) },
    eggs: collection.eggs.filter((id) => id !== speciesId),
    activeSpeciesId: collection.activeSpeciesId ?? speciesId,
  };
}

export function setActivePet(collection: PetCollection, speciesId: SpeciesId): PetCollection {
  if (!ownsSpecies(collection, speciesId)) return collection;
  return { ...collection, activeSpeciesId: speciesId };
}

/** Replaces one owned pet (for example after feeding or gaining XP). */
export function updatePet(collection: PetCollection, pet: OwnedPet): PetCollection {
  if (!ownsSpecies(collection, pet.speciesId)) return collection;
  return { ...collection, owned: { ...collection.owned, [pet.speciesId]: pet } };
}

export function activePet(collection: PetCollection): OwnedPet | null {
  return collection.activeSpeciesId ? (collection.owned[collection.activeSpeciesId] ?? null) : null;
}

export function totalTimesFed(collection: PetCollection): number {
  return Object.values(collection.owned).reduce((sum, p) => sum + p.timesFed, 0);
}
