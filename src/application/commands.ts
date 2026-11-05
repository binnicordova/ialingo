import { newlyEarned, type AchievementMetrics } from '@/domain/achievements/achievement';
import { isWorldCompleted, isWorldUnlocked } from '@/domain/curriculum/unlock-policy';
import type { LessonId, SpeciesId, WorldId } from '@/domain/curriculum/types';
import { credit, debit, ECONOMY_TUNING, lessonReward } from '@/domain/economy/economy';
import type { CatalogIndex } from '@/domain/game/catalog';
import {
  createInitialGameState,
  type GameState,
  type Settings,
} from '@/domain/game/game-state';
import type { WordResult } from '@/domain/learning/lesson-session';
import {
  countCompletedLessons,
  countLearnedWords,
  recordLessonCompletion,
} from '@/domain/learning/progress';
import {
  activePet,
  addEgg,
  hatchEgg as hatchEggInCollection,
  ownsSpecies,
  setActivePet as setActiveInCollection,
  totalTimesFed,
  updatePet,
} from '@/domain/pets/collection';
import {
  applyHappinessDecay,
  equipAccessory as equipOnPet,
  feedPet as feedOnPet,
  gainXp,
  playWithPet as playOnPet,
  xpMultiplier,
  type AccessoryId,
} from '@/domain/pets/pet';
import type { DayKey } from '@/domain/shared/day';
import type { Locale } from '@/domain/shared/locale';
import {
  addUsage,
  grantExtraTime as grantExtraTimeOnScreen,
  rollOverDay,
} from '@/domain/wellbeing/screen-time';

import type { GameEvent } from './events';

/**
 * Application commands: every change to the saved game goes through one of
 * these pure functions. Each takes the current state, an input and a context
 * (today plus content), and returns the next state and the events produced.
 * They have no I/O; the state layer (Jotai) persists the result.
 */
export interface CommandContext {
  readonly today: DayKey;
  readonly content: CatalogIndex;
}

export interface CommandResult {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

const unchanged = (state: GameState): CommandResult => ({ state, events: [] });

/** Numbers used by achievement rules. */
export function computeMetrics(state: GameState, content: CatalogIndex): AchievementMetrics {
  return {
    lessonsCompleted: countCompletedLessons(state.progress),
    wordsLearned: countLearnedWords(state.progress),
    perfectLessons: state.progress.perfectLessons,
    daysPlayed: state.progress.daysPlayed.length,
    petsFed: totalTimesFed(state.pets),
    worldsCompleted: content.orderedWorlds.filter((w) => isWorldCompleted(w, state.progress)).length,
  };
}

/** Grants any newly met achievements (berries and/or an egg). */
function applyAchievements(state: GameState, ctx: CommandContext): CommandResult {
  const earned = newlyEarned(
    ctx.content.catalog.achievements,
    state.achievements,
    computeMetrics(state, ctx.content),
  );
  if (earned.length === 0) return unchanged(state);
  let next = state;
  const events: GameEvent[] = [];
  for (const achievement of earned) {
    next = { ...next, achievements: [...next.achievements, achievement.id] };
    events.push({ type: 'achievement-unlocked', achievementId: achievement.id });
    if (achievement.reward.berries) {
      next = { ...next, wallet: credit(next.wallet, achievement.reward.berries) };
      events.push({ type: 'berries-earned', amount: achievement.reward.berries, reason: 'achievement' });
    }
    const speciesId = achievement.reward.speciesId;
    if (speciesId && !ownsSpecies(next.pets, speciesId) && !next.pets.eggs.includes(speciesId)) {
      next = { ...next, pets: addEgg(next.pets, speciesId) };
      events.push({ type: 'egg-earned', speciesId, source: 'achievement' });
    }
  }
  return { state: next, events };
}

function unlockedWorldIds(state: GameState, ctx: CommandContext): Set<WorldId> {
  const worlds = ctx.content.orderedWorlds;
  return new Set(worlds.filter((w) => isWorldUnlocked(w, worlds, state.progress)).map((w) => w.id));
}

/** First run: the child picks a starter egg, hatches it and names it. */
export function completeOnboarding(
  state: GameState,
  input: { speciesId: SpeciesId; nickname: string; locale: Locale },
  ctx: CommandContext,
): CommandResult {
  const species = ctx.content.species(input.speciesId);
  if (state.onboarded || !species || species.unlock.type !== 'starter') return unchanged(state);
  const pets = hatchEggInCollection(
    addEgg(state.pets, species.id),
    species.id,
    input.nickname,
    ctx.today,
  );
  return {
    state: {
      ...state,
      onboarded: true,
      settings: { ...state.settings, uiLocale: input.locale },
      pets,
      wallet: credit(state.wallet, ECONOMY_TUNING.welcomeBerries),
    },
    events: [
      { type: 'pet-hatched', speciesId: species.id },
      { type: 'berries-earned', amount: ECONOMY_TUNING.welcomeBerries, reason: 'welcome' },
    ],
  };
}

/** Applies a finished lesson: stars, mastery, berries, pet XP, eggs, badges, unlocks. */
export function finishLesson(
  state: GameState,
  input: { lessonId: LessonId; accuracy: number; wordResults: readonly WordResult[] },
  ctx: CommandContext,
): CommandResult {
  const plan = ctx.content.lessonPlan(input.lessonId);
  const world = plan ? ctx.content.world(plan.worldId) : undefined;
  if (!plan || !world) return unchanged(state);

  const unlockedBefore = unlockedWorldIds(state, ctx);
  const completion = recordLessonCompletion(state.progress, {
    lessonId: plan.id,
    accuracy: input.accuracy,
    wordResults: input.wordResults,
    today: ctx.today,
  });

  const pet = activePet(state.pets);
  const reward = lessonReward(plan.kind, completion.stars, completion.perfect, pet ? xpMultiplier(pet) : 1);
  const events: GameEvent[] = [
    {
      type: 'lesson-completed',
      lessonId: plan.id,
      stars: completion.stars,
      perfect: completion.perfect,
      berries: reward.berries,
      xp: reward.xp,
      firstCompletion: completion.firstCompletion,
    },
  ];

  let next: GameState = {
    ...state,
    progress: completion.progress,
    wallet: credit(state.wallet, reward.berries),
  };

  if (pet) {
    const grown = gainXp(pet, reward.xp);
    next = { ...next, pets: updatePet(next.pets, grown.pet) };
    if (grown.leveledUp) {
      events.push({
        type: 'pet-leveled-up',
        speciesId: pet.speciesId,
        level: grown.level,
        stage: grown.stage,
        stageChanged: grown.stageChanged,
      });
    }
  }

  if (plan.kind === 'boss' && completion.firstCompletion) {
    const speciesId = world.rewardSpeciesId;
    if (!ownsSpecies(next.pets, speciesId) && !next.pets.eggs.includes(speciesId)) {
      next = { ...next, pets: addEgg(next.pets, speciesId) };
      events.push({ type: 'egg-earned', speciesId, source: 'world-boss' });
    }
  }

  const achievements = applyAchievements(next, ctx);
  next = achievements.state;
  events.push(...achievements.events);

  for (const worldId of unlockedWorldIds(next, ctx)) {
    if (!unlockedBefore.has(worldId)) events.push({ type: 'world-unlocked', worldId });
  }

  return { state: next, events };
}

/** Spends berries to feed a pet. */
export function feedPet(
  state: GameState,
  input: { speciesId: SpeciesId },
  ctx: CommandContext,
): CommandResult {
  const pet = state.pets.owned[input.speciesId];
  if (!pet) return unchanged(state);
  const paid = debit(state.wallet, ECONOMY_TUNING.feedCost);
  if (!paid.ok) {
    return { state, events: [{ type: 'not-enough-berries', needed: ECONOMY_TUNING.feedCost }] };
  }
  const fed: GameState = {
    ...state,
    wallet: paid.wallet,
    pets: updatePet(state.pets, feedOnPet(pet, ctx.today)),
  };
  const achievements = applyAchievements(fed, ctx);
  return {
    state: achievements.state,
    events: [{ type: 'pet-fed', speciesId: pet.speciesId }, ...achievements.events],
  };
}

/** Tapping or petting: a little happiness, free. */
export function playWithPet(
  state: GameState,
  input: { speciesId: SpeciesId },
  ctx: CommandContext,
): CommandResult {
  const pet = state.pets.owned[input.speciesId];
  if (!pet) return unchanged(state);
  return { state: { ...state, pets: updatePet(state.pets, playOnPet(pet, ctx.today)) }, events: [] };
}

export function hatchEgg(
  state: GameState,
  input: { speciesId: SpeciesId; nickname: string },
  ctx: CommandContext,
): CommandResult {
  if (!state.pets.eggs.includes(input.speciesId)) return unchanged(state);
  return {
    state: {
      ...state,
      pets: hatchEggInCollection(state.pets, input.speciesId, input.nickname.slice(0, 24), ctx.today),
    },
    events: [{ type: 'pet-hatched', speciesId: input.speciesId }],
  };
}

export function setActivePet(state: GameState, input: { speciesId: SpeciesId }): CommandResult {
  if (!ownsSpecies(state.pets, input.speciesId)) return unchanged(state);
  return { state: { ...state, pets: setActiveInCollection(state.pets, input.speciesId) }, events: [] };
}

/** Starter pets not chosen at onboarding can be adopted later with berries. */
export function adoptPet(
  state: GameState,
  input: { speciesId: SpeciesId },
  ctx: CommandContext,
): CommandResult {
  const species = ctx.content.species(input.speciesId);
  if (
    !species?.shopPrice ||
    ownsSpecies(state.pets, species.id) ||
    state.pets.eggs.includes(species.id)
  ) {
    return unchanged(state);
  }
  const paid = debit(state.wallet, species.shopPrice);
  if (!paid.ok) return { state, events: [{ type: 'not-enough-berries', needed: species.shopPrice }] };
  return {
    state: { ...state, wallet: paid.wallet, pets: addEgg(state.pets, species.id) },
    events: [{ type: 'egg-earned', speciesId: species.id, source: 'shop' }],
  };
}

export function buyAccessory(
  state: GameState,
  input: { accessoryId: AccessoryId },
  ctx: CommandContext,
): CommandResult {
  const accessory = ctx.content.accessory(input.accessoryId);
  if (!accessory || state.accessoriesOwned.includes(accessory.id)) return unchanged(state);
  const paid = debit(state.wallet, accessory.price);
  if (!paid.ok) return { state, events: [{ type: 'not-enough-berries', needed: accessory.price }] };
  return {
    state: {
      ...state,
      wallet: paid.wallet,
      accessoriesOwned: [...state.accessoriesOwned, accessory.id],
    },
    events: [{ type: 'accessory-bought', accessoryId: accessory.id }],
  };
}

/** Puts an owned accessory on a pet (or removes it when null). */
export function equipAccessory(
  state: GameState,
  input: { speciesId: SpeciesId; accessoryId: AccessoryId | null },
): CommandResult {
  const pet = state.pets.owned[input.speciesId];
  if (!pet) return unchanged(state);
  if (input.accessoryId !== null && !state.accessoriesOwned.includes(input.accessoryId)) {
    return unchanged(state);
  }
  return {
    state: { ...state, pets: updatePet(state.pets, equipOnPet(pet, input.accessoryId)) },
    events: [],
  };
}

/** A small present once per calendar day. Nothing is lost for missing a day. */
export function claimDailyGift(state: GameState, ctx: CommandContext): CommandResult {
  if (state.dailyGiftClaimedOn === ctx.today) return unchanged(state);
  return {
    state: {
      ...state,
      dailyGiftClaimedOn: ctx.today,
      wallet: credit(state.wallet, ECONOMY_TUNING.dailyGiftBerries),
    },
    events: [{ type: 'berries-earned', amount: ECONOMY_TUNING.dailyGiftBerries, reason: 'daily-gift' }],
  };
}

export function canClaimDailyGift(state: GameState, today: DayKey): boolean {
  return state.onboarded && state.dailyGiftClaimedOn !== today;
}

/** Adds foreground play time to today's budget. */
export function recordPlayTime(
  state: GameState,
  input: { seconds: number },
  ctx: CommandContext,
): CommandResult {
  return {
    state: { ...state, screenTime: addUsage(state.screenTime, input.seconds, ctx.today) },
    events: [],
  };
}

export function grantExtraTime(
  state: GameState,
  input: { minutes: number },
  ctx: CommandContext,
): CommandResult {
  return {
    state: {
      ...state,
      screenTime: grantExtraTimeOnScreen(state.screenTime, input.minutes, ctx.today),
    },
    events: [],
  };
}

export function updateSettings(state: GameState, input: Partial<Settings>): CommandResult {
  return { state: { ...state, settings: { ...state.settings, ...input } }, events: [] };
}

/** Runs at app start and resume: resets the daily budget and eases pet happiness. */
export function startDay(state: GameState, ctx: CommandContext): CommandResult {
  const owned = Object.fromEntries(
    Object.entries(state.pets.owned).map(([id, pet]) => [id, applyHappinessDecay(pet, ctx.today)]),
  );
  return {
    state: {
      ...state,
      screenTime: rollOverDay(state.screenTime, ctx.today),
      pets: { ...state.pets, owned },
    },
    events: [],
  };
}

/** Deletes all progress (parent area). Keeps only the UI language. */
export function resetGame(state: GameState, ctx: CommandContext): CommandResult {
  return { state: createInitialGameState(ctx.today, state.settings.uiLocale), events: [] };
}
