import { newlyEarned, type AchievementMetrics } from '@/domain/achievements/achievement';
import { canPractice, PRACTICE_LESSON_ID } from '@/domain/curriculum/lesson-generator';
import { buildLessonPlans } from '@/domain/curriculum/lesson-plans';
import { isLessonUnlocked, isWorldCompleted, isWorldUnlocked } from '@/domain/curriculum/unlock-policy';
import type { LessonId, LessonKind, SpeciesId, WorldId } from '@/domain/curriculum/types';
import { credit, debit, ECONOMY_TUNING, lessonReward } from '@/domain/economy/economy';
import type { CatalogIndex } from '@/domain/game/catalog';
import {
  createInitialGameState,
  type GameState,
  type Settings,
  type VoiceDiaryEntry,
} from '@/domain/game/game-state';
import { addDiaryEntry, removeDiaryEntry } from '@/domain/voice/voice-diary';
import type { WordResult } from '@/domain/learning/lesson-session';
import {
  countCompletedLessons,
  countLearnedWords,
  countMasteredWords,
  recordLessonCompletion,
  recordPracticeCompletion,
} from '@/domain/learning/progress';
import { canPlayGames, rollPlayDay, settleMiniGame, type MiniGameKind } from '@/domain/play/mini-games';
import {
  advanceQuest,
  canClaimChest,
  claimChest,
  isQuestDone,
  QUEST_TUNING,
  rollQuestDay,
  type QuestBoard,
  type QuestKind,
} from '@/domain/quests/quests';
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
    storiesCompleted: countCompletedOfKind(state, content, 'story'),
    speakLessonsCompleted: countCompletedOfKind(state, content, 'speak'),
    songsCompleted: countCompletedOfKind(state, content, 'song'),
    practiceSessions: state.progress.practiceSessions,
    miniGamesPlayed: state.play.totalGames,
    questChests: state.quests.chestsOpened,
    wordsMastered: countMasteredWords(state.progress),
  };
}

function countCompletedOfKind(state: GameState, content: CatalogIndex, kind: LessonKind): number {
  return Object.keys(state.progress.lessons).filter((id) => content.lessonPlan(id)?.kind === kind).length;
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
  const isPractice = input.lessonId === PRACTICE_LESSON_ID;
  const plan = isPractice ? null : ctx.content.lessonPlan(input.lessonId);
  const world = plan ? ctx.content.world(plan.worldId) : undefined;
  if (!isPractice && (!plan || !world)) return unchanged(state);
  const kind: LessonKind = plan?.kind ?? 'practice';
  const lessonId = plan?.id ?? PRACTICE_LESSON_ID;

  const unlockedBefore = unlockedWorldIds(state, ctx);
  const answers = { accuracy: input.accuracy, wordResults: input.wordResults, today: ctx.today };
  const completion = isPractice
    ? recordPracticeCompletion(state.progress, answers)
    : recordLessonCompletion(state.progress, { ...answers, lessonId });

  const pet = activePet(state.pets);
  const reward = lessonReward(kind, completion.stars, completion.perfect, pet ? xpMultiplier(pet) : 1);
  const events: GameEvent[] = [
    {
      type: 'lesson-completed',
      lessonId,
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

  if (plan?.kind === 'boss' && world && completion.firstCompletion) {
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
  const next: GameState = { ...state, settings: { ...state.settings, ...input } };
  // Turning the voice diary off deletes every recording (privacy by default).
  if (input.voiceDiary === false && state.voiceDiary.length > 0) {
    return {
      state: { ...next, voiceDiary: [] },
      events: [{ type: 'voice-files-removed', fileNames: state.voiceDiary.map((e) => e.fileName) }],
    };
  }
  return { state: next, events: [] };
}

/** Keeps a new voice postcard (only when a parent turned the diary on). */
export function addVoicePostcard(state: GameState, input: { entry: VoiceDiaryEntry }): CommandResult {
  if (!state.settings.voiceDiary) {
    return { state, events: [{ type: 'voice-files-removed', fileNames: [input.entry.fileName] }] };
  }
  const { entries, removed } = addDiaryEntry(state.voiceDiary, input.entry);
  const events: GameEvent[] = [{ type: 'postcard-saved' }];
  if (removed.length > 0) events.push({ type: 'voice-files-removed', fileNames: removed.map((e) => e.fileName) });
  return { state: { ...state, voiceDiary: entries }, events };
}

export function deleteVoicePostcard(state: GameState, input: { id: string }): CommandResult {
  const { entries, removed } = removeDiaryEntry(state.voiceDiary, input.id);
  if (removed.length === 0) return unchanged(state);
  return {
    state: { ...state, voiceDiary: entries },
    events: [{ type: 'voice-files-removed', fileNames: removed.map((e) => e.fileName) }],
  };
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
      play: rollPlayDay(state.play, ctx.today),
      quests: rollQuestDay(state.quests, ctx.today, availableQuestKinds(state, ctx)),
    },
    events: [],
  };
}

/* ------------------------------------------------------- Play and quests */

/** Pays a finished Play Park game (daily cap) and gives the pet a little XP. */
export function finishMiniGame(
  state: GameState,
  input: { kind: MiniGameKind; correct: number; total: number },
  ctx: CommandContext,
): CommandResult {
  const settled = settleMiniGame(state.play, ctx.today, input.correct);
  let next: GameState = { ...state, play: settled.play, wallet: credit(state.wallet, settled.berries) };
  const events: GameEvent[] = [
    {
      type: 'mini-game-finished',
      kind: input.kind,
      correct: input.correct,
      total: input.total,
      berries: settled.berries,
      capped: settled.capped,
    },
  ];
  const pet = activePet(next.pets);
  if (pet && settled.berries > 0) {
    const grown = gainXp(pet, settled.berries);
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
  const achievements = applyAchievements(next, ctx);
  return { state: achievements.state, events: [...events, ...achievements.events] };
}

/** Opens the quest chest once all of today's quests are done (fixed reward). */
export function claimQuestChest(state: GameState, ctx: CommandContext): CommandResult {
  const board = rollQuestDay(state.quests, ctx.today, availableQuestKinds(state, ctx));
  if (!canClaimChest(board)) return unchanged(state);
  const next: GameState = {
    ...state,
    quests: claimChest(board),
    wallet: credit(state.wallet, QUEST_TUNING.chestBerries),
  };
  const achievements = applyAchievements(next, ctx);
  return {
    state: achievements.state,
    events: [
      { type: 'berries-earned', amount: QUEST_TUNING.chestBerries, reason: 'quest-chest' },
      ...achievements.events,
    ],
  };
}

/** Quests a child can actually do today, so a board never asks the impossible. */
export function availableQuestKinds(state: GameState, ctx: CommandContext): QuestKind[] {
  const kinds: QuestKind[] = ['lessons', 'perfect', 'feed'];
  const { mastery } = state.progress;
  if (canPractice(mastery)) kinds.push('practice');
  if (canPlayGames(mastery)) kinds.push('game');
  const worlds = ctx.content.orderedWorlds;
  const listeningOpen = worlds.some((world) =>
    buildLessonPlans(world).some(
      (plan) =>
        (plan.kind === 'story' || plan.kind === 'song') &&
        isLessonUnlocked(plan, world, worlds, state.progress),
    ),
  );
  if (listeningOpen) kinds.push('listen');
  return kinds;
}

/** Which quests an event moves forward. */
function questSignals(event: GameEvent, ctx: CommandContext): QuestKind[] {
  switch (event.type) {
    case 'lesson-completed': {
      const signals: QuestKind[] = ['lessons'];
      if (event.stars === 3) signals.push('perfect');
      if (event.lessonId === PRACTICE_LESSON_ID) signals.push('practice');
      const kind = ctx.content.lessonPlan(event.lessonId)?.kind;
      if (kind === 'story' || kind === 'song') signals.push('listen');
      return signals;
    }
    case 'pet-fed':
      return ['feed'];
    case 'mini-game-finished':
      return ['game'];
    default:
      return [];
  }
}

/**
 * Applies a command's events to today's quests (run after every command by
 * the state layer). Emits 'quest-completed' when a quest is finished.
 */
export function trackQuests(result: CommandResult, ctx: CommandContext): CommandResult {
  const signals = result.events.flatMap((event) => questSignals(event, ctx));
  if (signals.length === 0) return result;
  const before: QuestBoard = rollQuestDay(
    result.state.quests,
    ctx.today,
    availableQuestKinds(result.state, ctx),
  );
  let board = before;
  for (const signal of signals) board = advanceQuest(board, signal);
  if (board === result.state.quests) return result;
  const completed: GameEvent[] = board.kinds
    .filter((kind) => isQuestDone(board, kind) && !isQuestDone(before, kind))
    .map((kind) => ({ type: 'quest-completed', kind }));
  return { state: { ...result.state, quests: board }, events: [...result.events, ...completed] };
}

/** Deletes all progress (parent area). Keeps only the UI language. */
export function resetGame(state: GameState, ctx: CommandContext): CommandResult {
  return {
    state: createInitialGameState(ctx.today, state.settings.uiLocale),
    events:
      state.voiceDiary.length > 0
        ? [{ type: 'voice-files-removed', fileNames: state.voiceDiary.map((e) => e.fileName) }]
        : [],
  };
}
