import { atom } from 'jotai';

import { availableQuestKinds, canClaimDailyGift, computeMetrics } from '@/application/commands';
import { canPractice, practiceFocusWords, PRACTICE_TUNING } from '@/domain/curriculum/lesson-generator';
import { isDue, pickReviewWords } from '@/domain/learning/mastery';
import { albumPage, albumTotals } from '@/domain/learning/album';
import {
  berriesLeftToday,
  canPlayGames,
  canPlayOddOneOut,
  PLAY_TUNING,
  type WorldCategories,
} from '@/domain/play/mini-games';
import {
  canClaimChest,
  isQuestDone,
  QUEST_DEFINITIONS,
  questProgress,
  rollQuestDay,
  type QuestKind,
} from '@/domain/quests/quests';
import {
  isLessonUnlocked,
  isWorldCompleted,
  isWorldUnlocked,
  nextLessonInWorld,
  worldStars,
} from '@/domain/curriculum/unlock-policy';
import type { LessonPlan, VocabularyItem, World } from '@/domain/curriculum/types';
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

/* ------------------------------------------------- v1.2: practice and play */

/** Word Gym status: open once a few words were met; how many are due today. */
export const wordGymAtom = atom((get) => {
  const { mastery } = get(gameStateAtom).progress;
  const today = get(todayAtom);
  const open = canPractice(mastery);
  const due = Object.values(mastery).filter((m) => isDue(m, today)).length;
  const focus = open ? practiceFocusWords(get(contentAtom).orderedWorlds, mastery, today).length : 0;
  return {
    open,
    due,
    focus,
    minWords: PRACTICE_TUNING.minWords,
    sessions: get(gameStateAtom).progress.practiceSessions,
  };
});

/** Sticker album pages (one per unlocked world) and totals. */
export const albumAtom = atom((get) => {
  const { mastery } = get(gameStateAtom).progress;
  const pages = get(worldViewsAtom)
    .filter((v) => v.unlocked)
    .map((v) => albumPage(v.world, mastery));
  const all = get(contentAtom).orderedWorlds.map((w) => albumPage(w, mastery));
  return { pages, totals: albumTotals(all) };
});

/** Every word the child has met (any world). */
export const metWordsAtom = atom<readonly VocabularyItem[]>((get) => {
  const { mastery } = get(gameStateAtom).progress;
  return get(contentAtom)
    .orderedWorlds.flatMap((w) => w.words)
    .filter((w) => mastery[w.id] !== undefined);
});

/** Semantic category of each world (for Odd One Out). */
export const worldCategoriesAtom = atom<WorldCategories>((get) =>
  Object.fromEntries(get(contentAtom).orderedWorlds.map((w) => [w.id, w.category])),
);

/** Play Park status: open after a few words; berries games can still pay today. */
export const playParkAtom = atom((get) => {
  const state = get(gameStateAtom);
  return {
    open: canPlayGames(state.progress.mastery),
    oddOneOutOpen: canPlayOddOneOut(get(metWordsAtom), get(worldCategoriesAtom)),
    minWords: PLAY_TUNING.minWords,
    berriesLeft: berriesLeftToday(state.play, get(todayAtom)),
    cap: PLAY_TUNING.dailyBerryCap,
  };
});

export interface QuestView {
  readonly kind: QuestKind;
  readonly emoji: string;
  readonly progress: number;
  readonly target: number;
  readonly done: boolean;
}

/** Today's quests (rolled over if the stored board is from another day). */
export const questsAtom = atom((get) => {
  const state = get(gameStateAtom);
  const today = get(todayAtom);
  const ctx = { today, content: get(contentAtom) };
  const board = rollQuestDay(state.quests, today, availableQuestKinds(state, ctx));
  const quests: QuestView[] = board.kinds.map((kind) => ({
    kind,
    emoji: QUEST_DEFINITIONS[kind].emoji,
    progress: questProgress(board, kind),
    target: QUEST_DEFINITIONS[kind].target,
    done: isQuestDone(board, kind),
  }));
  return { quests, canClaim: canClaimChest(board), claimed: board.chestClaimed };
});

/** Words for Play Park games: met words, most due and weakest first. */
export const playWordsAtom = atom<readonly VocabularyItem[]>((get) => {
  const content = get(contentAtom);
  const { mastery } = get(gameStateAtom).progress;
  const ids = content.orderedWorlds.flatMap((w) => w.words.map((x) => x.id));
  return pickReviewWords(mastery, ids, get(todayAtom), PLAY_TUNING.poolSize)
    .map((id) => content.word(id))
    .filter((w): w is VocabularyItem => w !== undefined);
});

/** Games played today (part of the seed, so each game is a new board). */
export const gamesTodayAtom = atom((get) => {
  const { play } = get(gameStateAtom);
  return play.day === get(todayAtom) ? play.gamesToday : 0;
});
