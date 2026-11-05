import {
  addEgg,
  activePet,
  createCollection,
  hatchEgg,
  setActivePet,
} from '@/domain/pets/collection';
import {
  LEVELING_TUNING,
  levelForXp,
  levelProgress,
  stageForLevel,
  xpToNextLevel,
} from '@/domain/pets/leveling';
import {
  applyHappinessDecay,
  createPet,
  feedPet,
  gainXp,
  PET_TUNING,
  xpMultiplier,
} from '@/domain/pets/pet';
import { TODAY } from '../../helpers/fixtures';

describe('leveling formula', () => {
  it('follows base + step × (level − 1)', () => {
    expect(xpToNextLevel(1)).toBe(LEVELING_TUNING.baseXp);
    expect(xpToNextLevel(3)).toBe(LEVELING_TUNING.baseXp + 2 * LEVELING_TUNING.stepXp);
  });

  it('maps total xp to levels and caps at the max level', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(xpToNextLevel(1))).toBe(2);
    expect(levelForXp(xpToNextLevel(1) + xpToNextLevel(2) - 1)).toBe(2);
    expect(levelForXp(1_000_000)).toBe(LEVELING_TUNING.maxLevel);
    expect(levelProgress(1_000_000).isMax).toBe(true);
  });

  it('grows through baby, kid and grown stages', () => {
    expect(stageForLevel(1)).toBe('baby');
    expect(stageForLevel(LEVELING_TUNING.kidStageLevel)).toBe('kid');
    expect(stageForLevel(LEVELING_TUNING.grownStageLevel)).toBe('grown');
  });
});

describe('pet care', () => {
  it('reports level ups', () => {
    const pet = createPet('bubbo', 'Bubbles', TODAY);
    const result = gainXp(pet, xpToNextLevel(1));
    expect(result.leveledUp).toBe(true);
    expect(result.level).toBe(2);
  });

  it('caps happiness at the max when fed', () => {
    let pet = createPet('bubbo', 'Bubbles', TODAY);
    for (let i = 0; i < 10; i += 1) pet = feedPet(pet, TODAY);
    expect(pet.happiness).toBe(PET_TUNING.maxHappiness);
    expect(pet.timesFed).toBe(10);
  });

  it('never decays below the floor (pets are never sad)', () => {
    const pet = createPet('bubbo', 'Bubbles', '2026-01-01');
    const later = applyHappinessDecay(pet, '2026-12-31');
    expect(later.happiness).toBe(PET_TUNING.happinessFloor);
  });

  it('gives bonus xp only to happy pets', () => {
    const pet = createPet('bubbo', 'Bubbles', TODAY);
    expect(xpMultiplier({ ...pet, happiness: 100 })).toBe(PET_TUNING.bonusMultiplier);
    expect(xpMultiplier({ ...pet, happiness: 50 })).toBe(1);
  });
});

describe('pet collection', () => {
  it('hatches eggs, sets the first pet active and ignores duplicates', () => {
    let c = addEgg(createCollection(), 'bubbo');
    c = addEgg(c, 'bubbo');
    expect(c.eggs).toEqual(['bubbo']);
    c = hatchEgg(c, 'bubbo', 'Bubbles', TODAY);
    expect(activePet(c)?.nickname).toBe('Bubbles');
    expect(c.eggs).toEqual([]);
    expect(addEgg(c, 'bubbo')).toBe(c);
    c = hatchEgg(addEgg(c, 'sprout'), 'sprout', 'Kiwi', TODAY);
    expect(c.activeSpeciesId).toBe('bubbo');
    expect(setActivePet(c, 'sprout').activeSpeciesId).toBe('sprout');
    expect(setActivePet(c, 'unknown')).toBe(c);
  });
});
