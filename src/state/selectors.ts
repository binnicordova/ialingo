import { atom } from 'jotai';

import { canClaimDailyGift, computeMetrics } from '@/application/commands';
import {
  isLessonUnlocked,
  isWorldCompleted,
  isWorldUnlocked,
  nextLessonInWorld,
  worldStars,
} from '@/domain/curriculum/unlock-policy';
import type { LessonPlan, World } from '@/domain/curriculum/types';
import { countLearnedWords, countMasteredWords, countCompletedLessons } from '@/domain/learning/progress';
import { levelProgress, stageForLevel, type GrowthStage } from '@/domain/pets/leveling';
import type { OwnedPet } from '@/domain/pets/pet';
import type { PetSpecies } from '@/domain/pets/species';
import { isLimitReached, secondsLeft } from '@/domain/wellbeing/screen-time';

import { contentAtom, gameStateAtom, recognitionAtom, todayAtom } from './core';
import { canRecordPostcard } from '@/domain/voice/voice-diary';

/** Small derived atoms: each screen re-renders only when its slice changes. */
export const settingsAtom = atom((get) => get(gameStateAtom).settings);
export const localeAtom = atom((get) => get(gameStateAtom).settings.uiLocale);
export const berriesAtom = atom((get) => get(gameStateAtom).wallet.berries);
export const onboardedAtom = atom((get) => get(gameStateAtom).onboarded);
export const progressAtom = atom((get) => get(gameStateAtom).progress);
export const petCollectionAtom = atom((get) => get(gameStateAtom).pets);
export const accessoriesOwnedAtom = atom((get) => get(gameStateAtom).accessoriesOwned);
export const achievementsEarnedAtom = atom((get) => get(gameStateAtom).achievements);

export interface PetView {
  readonly pet: OwnedPet;
  readonly species: PetSpecies;
  readonly level: number;
  readonly stage: GrowthStage;
  readonly xpInLevel: number;
  readonly xpNeeded: number;
  readonly isMaxLevel: boolean;
}

function toPetView(pet: OwnedPet, species: PetSpecies): PetView {
  const p = levelProgress(pet.xp);
  return {
    pet,
    species,
    level: p.level,
    stage: stageForLevel(p.level),
    xpInLevel: p.current,
    xpNeeded: p.needed,
    isMaxLevel: p.isMax,
  };
}

export const activePetAtom = atom<PetView | null>((get) => {
  const { pets } = get(gameStateAtom);
  const content = get(contentAtom);
  const pet = pets.activeSpeciesId ? pets.owned[pets.activeSpeciesId] : undefined;
  const species = pet ? content.species(pet.speciesId) : undefined;
  return pet && species ? toPetView(pet, species) : null;
});

export const ownedPetsAtom = atom<readonly PetView[]>((get) => {
  const { pets } = get(gameStateAtom);
  const content = get(contentAtom);
  return Object.values(pets.owned)
    .map((pet) => {
      const species = content.species(pet.speciesId);
      return species ? toPetView(pet, species) : null;
    })
    .filter((v): v is PetView => v !== null);
});

export interface WorldView {
  readonly world: World;
  readonly unlocked: boolean;
  readonly completed: boolean;
  readonly stars: { readonly earned: number; readonly max: number };
  readonly nextLesson: LessonPlan | null;
}

export const worldViewsAtom = atom<readonly WorldView[]>((get) => {
  const progress = get(progressAtom);
  const worlds = get(contentAtom).orderedWorlds;
  return worlds.map((world) => ({
    world,
    unlocked: isWorldUnlocked(world, worlds, progress),
    completed: isWorldCompleted(world, progress),
    stars: worldStars(world, progress),
    nextLesson: nextLessonInWorld(world, progress),
  }));
});

export interface LessonView {
  readonly plan: LessonPlan;
  readonly unlocked: boolean;
  readonly stars: number;
  readonly plays: number;
}

export function lessonViewsFor(worldId: string) {
  return atom<readonly LessonView[]>((get) => {
    const content = get(contentAtom);
    const progress = get(progressAtom);
    const world = content.world(worldId);
    if (!world) return [];
    return content.lessonPlansForWorld(worldId).map((plan) => ({
      plan,
      unlocked: isLessonUnlocked(plan, world, content.orderedWorlds, progress),
      stars: progress.lessons[plan.id]?.bestStars ?? 0,
      plays: progress.lessons[plan.id]?.plays ?? 0,
    }));
  });
}

export const statsAtom = atom((get) => {
  const state = get(gameStateAtom);
  const content = get(contentAtom);
  return {
    wordsLearned: countLearnedWords(state.progress),
    wordsMastered: countMasteredWords(state.progress),
    lessonsCompleted: countCompletedLessons(state.progress),
    totalLessons: content.orderedWorlds.reduce(
      (sum, w) => sum + content.lessonPlansForWorld(w.id).length,
      0,
    ),
    totalWords: content.orderedWorlds.reduce((sum, w) => sum + w.words.length, 0),
    daysPlayed: state.progress.daysPlayed.length,
    accuracy:
      state.progress.totalAnswers === 0 ? 0 : state.progress.totalCorrect / state.progress.totalAnswers,
    metrics: computeMetrics(state, content),
  };
});

export const screenTimeAtom = atom((get) => {
  const state = get(gameStateAtom);
  const today = get(todayAtom);
  const limit = state.settings.dailyLimitMinutes;
  return {
    limitMinutes: limit,
    secondsLeft: secondsLeft(state.screenTime, limit, today),
    limitReached: isLimitReached(state.screenTime, limit, today),
    minutesUsedToday:
      state.screenTime.day === today ? Math.floor(state.screenTime.secondsUsed / 60) : 0,
  };
});

export const canClaimGiftAtom = atom((get) => canClaimDailyGift(get(gameStateAtom), get(todayAtom)));

export const eggsAtom = atom((get) => get(gameStateAtom).pets.eggs);

/**
 * How speaking exercises run right now: 'recognition' when the device can
 * recognize speech within the parent's privacy settings, else 'self-check'
 * (Expo Go, web, microphone denied, or online-only recognizer without consent).
 */
export type SpeakMode = 'recognition' | 'self-check';

export const speakModeAtom = atom<SpeakMode>((get) => {
  const settings = get(settingsAtom);
  const capability = get(recognitionAtom);
  if (settings.speaking !== 'recognition') return 'self-check';
  if (!capability.installed || !capability.available) return 'self-check';
  if (!capability.onDevice && !settings.allowOnlineRecognition) return 'self-check';
  if (capability.permission === 'denied') return 'self-check';
  return 'recognition';
});

export const voiceDiaryAtom = atom((get) => get(gameStateAtom).voiceDiary);

/** Offer a voice postcard (diary on, and none recorded in the last week). */
export const canRecordPostcardAtom = atom((get) => {
  const state = get(gameStateAtom);
  return state.settings.voiceDiary && canRecordPostcard(state.voiceDiary, get(todayAtom));
});
