import {
  adoptPet,
  availableQuestKinds,
  buyAccessory,
  claimDailyGift,
  claimQuestChest,
  completeOnboarding,
  equipAccessory,
  feedPet,
  finishLesson,
  finishMiniGame,
  hatchEgg,
  resetGame,
  startDay,
  trackQuests,
  type CommandContext,
} from '@/application/commands';
import { PRACTICE_LESSON_ID } from '@/domain/curriculum/lesson-generator';
import { restoreGameState } from '@/domain/game/snapshot';
import { PLAY_TUNING } from '@/domain/play/mini-games';
import { QUEST_DEFINITIONS, QUEST_TUNING } from '@/domain/quests/quests';
import { isWorldUnlocked } from '@/domain/curriculum/unlock-policy';
import { ECONOMY_TUNING } from '@/domain/economy/economy';
import type { GameState } from '@/domain/game/game-state';
import { freshState, realContent, TODAY, TOMORROW } from '../helpers/fixtures';

/**
 * End-to-end rules for a child's journey, using the real content. This is
 * the "integration test OR documented playtest" evidence for multi-system stories.
 */
describe('game flow', () => {
  const content = realContent();
  const ctx: CommandContext = { today: TODAY, content };
  const firstWorld = content.orderedWorlds[0]!;
  const secondWorld = content.orderedWorlds[1]!;

  function onboard(): GameState {
    return completeOnboarding(freshState(), { speciesId: 'bubbo', nickname: 'Bubbles', locale: 'pt' }, ctx).state;
  }

  function finish(state: GameState, lessonId: string, accuracy = 1, today = TODAY) {
    const plan = content.lessonPlan(lessonId)!;
    const wordResults = plan.newWordIds.flatMap((wordId) => [
      { wordId, correct: true },
      { wordId, correct: accuracy === 1 },
    ]);
    return finishLesson(state, { lessonId, accuracy, wordResults }, { today, content });
  }

  it('onboards with a starter pet, welcome berries and the chosen language', () => {
    const state = onboard();
    expect(state.onboarded).toBe(true);
    expect(state.pets.activeSpeciesId).toBe('bubbo');
    expect(state.wallet.berries).toBe(ECONOMY_TUNING.welcomeBerries);
    expect(state.settings.uiLocale).toBe('pt');
    // Non-starter pets cannot be picked at onboarding.
    expect(
      completeOnboarding(freshState(), { speciesId: 'drago', nickname: 'X', locale: 'es' }, ctx).state.onboarded,
    ).toBe(false);
  });

  it('rewards a lesson with berries, xp, stars and the first badge', () => {
    const before = onboard();
    const { state, events } = finish(before, `${firstWorld.id}.learn-1`);
    expect(events[0]).toMatchObject({ type: 'lesson-completed', stars: 3, perfect: true });
    expect(state.wallet.berries).toBeGreaterThan(before.wallet.berries);
    expect(state.pets.owned.bubbo!.xp).toBeGreaterThan(0);
    expect(events.some((e) => e.type === 'achievement-unlocked' && e.achievementId === 'first-steps')).toBe(true);
    expect(events.some((e) => e.type === 'pet-leveled-up')).toBe(true);
  });

  it('unlocks the next world after all learn lessons and gives the boss egg once', () => {
    let state = onboard();
    expect(isWorldUnlocked(secondWorld, content.orderedWorlds, state.progress)).toBe(false);
    const plans = content.lessonPlansForWorld(firstWorld.id);
    const unlockEvents: string[] = [];
    for (const plan of plans.filter((p) => p.kind === 'learn')) {
      const result = finish(state, plan.id);
      state = result.state;
      for (const e of result.events) if (e.type === 'world-unlocked') unlockEvents.push(e.worldId);
    }
    expect(unlockEvents).toEqual([secondWorld.id]);

    const boss = plans.find((p) => p.kind === 'boss')!;
    const won = finish(state, boss.id);
    expect(won.events).toContainEqual({ type: 'egg-earned', speciesId: firstWorld.rewardSpeciesId, source: 'world-boss' });
    expect(won.state.pets.eggs).toContain(firstWorld.rewardSpeciesId);
    const replay = finish(won.state, boss.id);
    expect(replay.events.some((e) => e.type === 'egg-earned')).toBe(false);

    const hatched = hatchEgg(won.state, { speciesId: firstWorld.rewardSpeciesId, nickname: 'Pickle' }, ctx);
    expect(hatched.state.pets.owned[firstWorld.rewardSpeciesId]?.nickname).toBe('Pickle');
    expect(hatched.state.pets.activeSpeciesId).toBe('bubbo');
  });

  it('feeds pets with berries and refuses when broke', () => {
    let state = onboard();
    state = { ...state, wallet: { berries: 1 } };
    const fed = feedPet(state, { speciesId: 'bubbo' }, ctx);
    expect(fed.state.wallet.berries).toBe(0);
    expect(fed.events[0]).toEqual({ type: 'pet-fed', speciesId: 'bubbo' });
    const broke = feedPet(fed.state, { speciesId: 'bubbo' }, ctx);
    expect(broke.state).toBe(fed.state);
    expect(broke.events[0]).toMatchObject({ type: 'not-enough-berries' });
  });

  it('buys and equips accessories, adopts starters, and gives one daily gift per day', () => {
    let state = { ...onboard(), wallet: { berries: 500 } };
    state = buyAccessory(state, { accessoryId: 'crown' }, ctx).state;
    expect(state.accessoriesOwned).toContain('crown');
    state = equipAccessory(state, { speciesId: 'bubbo', accessoryId: 'crown' }).state;
    expect(state.pets.owned.bubbo!.accessoryId).toBe('crown');
    expect(equipAccessory(state, { speciesId: 'bubbo', accessoryId: 'cap' }).state).toBe(state);

    state = adoptPet(state, { speciesId: 'sprout' }, ctx).state;
    expect(state.pets.eggs).toContain('sprout');
    expect(adoptPet(state, { speciesId: 'drago' }, ctx).state).toBe(state);

    const gift = claimDailyGift(state, ctx);
    expect(gift.state.wallet.berries).toBe(state.wallet.berries + ECONOMY_TUNING.dailyGiftBerries);
    expect(claimDailyGift(gift.state, ctx).state).toBe(gift.state);
    expect(claimDailyGift(gift.state, { today: TOMORROW, content }).events).toHaveLength(1);
  });

  it('starts a new day without punishing the child', () => {
    const state = onboard();
    const later = startDay(state, { today: '2026-06-01', content }).state;
    expect(later.pets.owned.bubbo!.happiness).toBeGreaterThanOrEqual(50);
    expect(later.screenTime.day).toBe('2026-06-01');
  });

  it('resets everything except the language', () => {
    const state = onboard();
    const reset = resetGame(state, ctx).state;
    expect(reset.onboarded).toBe(false);
    expect(reset.settings.uiLocale).toBe('pt');
    expect(Object.keys(reset.pets.owned)).toHaveLength(0);
  });

  /* ------------------------------------------------------------- v1.2 */

  function learnFirstLessons(state: GameState, count: number): GameState {
    let next = state;
    const learn = content.lessonPlansForWorld(firstWorld.id).filter((p) => p.kind === 'learn').slice(0, count);
    for (const plan of learn) next = finish(next, plan.id).state;
    return next;
  }

  it('pays a Word Gym session like a lesson without storing it as one', () => {
    const state = learnFirstLessons(onboard(), 1);
    const wordId = Object.keys(state.progress.mastery)[0]!;
    const result = finishLesson(
      state,
      { lessonId: PRACTICE_LESSON_ID, accuracy: 1, wordResults: [{ wordId, correct: true }] },
      ctx,
    );
    expect(result.state.progress.practiceSessions).toBe(1);
    expect(result.state.progress.lessons[PRACTICE_LESSON_ID]).toBeUndefined();
    expect(result.state.wallet.berries).toBeGreaterThan(state.wallet.berries);
    const done = result.events.find((e) => e.type === 'lesson-completed');
    expect(done?.type === 'lesson-completed' && done.lessonId).toBe(PRACTICE_LESSON_ID);
    expect(result.events.some((e) => e.type === 'egg-earned' && e.source === 'world-boss')).toBe(false);
  });

  it('pays Play Park games within the daily cap and feeds the pet XP', () => {
    let state = onboard();
    const xpBefore = state.pets.owned.bubbo!.xp;
    const first = finishMiniGame(state, { kind: 'bubble-pop', correct: 8, total: 8 }, ctx);
    expect(first.state.wallet.berries).toBe(state.wallet.berries + 8);
    expect(first.state.pets.owned.bubbo!.xp).toBe(xpBefore + 8);
    state = first.state;
    for (let i = 0; i < 3; i += 1) state = finishMiniGame(state, { kind: 'memory-match', correct: 6, total: 6 }, ctx).state;
    expect(state.play.berriesToday).toBe(PLAY_TUNING.dailyBerryCap);
    const capped = finishMiniGame(state, { kind: 'bubble-pop', correct: 8, total: 8 }, ctx);
    const event = capped.events.find((e) => e.type === 'mini-game-finished');
    expect(event?.type === 'mini-game-finished' && event.berries).toBe(0);
    expect(event?.type === 'mini-game-finished' && event.capped).toBe(true);
    expect(capped.state.play.totalGames).toBe(5);
  });

  it('moves quests forward from events and opens the chest once', () => {
    let state = onboard();
    expect(state.quests.kinds[0]).toBe('lessons');
    const run = (result: ReturnType<typeof finishLesson>) => trackQuests(result, ctx);
    const learn = content.lessonPlansForWorld(firstWorld.id).filter((p) => p.kind === 'learn');
    const one = run(finish(state, learn[0]!.id));
    expect(one.state.quests.progress.lessons).toBe(1);
    const two = run(finish(one.state, learn[1]!.id));
    expect(two.events.some((e) => e.type === 'quest-completed' && e.kind === 'lessons')).toBe(true);
    state = two.state;
    // Finish the other quests of the day by hand (feeding and 3-star lessons are covered above).
    for (const kind of state.quests.kinds) {
      state = { ...state, quests: { ...state.quests, progress: { ...state.quests.progress, [kind]: QUEST_DEFINITIONS[kind].target } } };
    }
    const chest = claimQuestChest(state, ctx);
    expect(chest.state.wallet.berries).toBe(state.wallet.berries + QUEST_TUNING.chestBerries);
    expect(chest.events[0]).toEqual({ type: 'berries-earned', amount: QUEST_TUNING.chestBerries, reason: 'quest-chest' });
    expect(claimQuestChest(chest.state, ctx).state).toBe(chest.state);
    // Tomorrow brings a fresh board, with nothing lost.
    const tomorrow = startDay(chest.state, { today: TOMORROW, content }).state;
    expect(tomorrow.quests.day).toBe(TOMORROW);
    expect(tomorrow.quests.chestClaimed).toBe(false);
    expect(tomorrow.quests.chestsOpened).toBe(1);
  });

  it('only offers quests the child can do today', () => {
    const beginner = onboard();
    expect(availableQuestKinds(beginner, ctx)).toEqual(['lessons', 'perfect', 'feed']);
    const learner = learnFirstLessons(beginner, 2);
    const kinds = availableQuestKinds(learner, ctx);
    expect(kinds).toContain('practice');
    expect(kinds).toContain('game');
    const allLearn = learnFirstLessons(beginner, 99);
    expect(availableQuestKinds(allLearn, ctx)).toContain('listen');
  });

  it('feeding counts toward the feed quest', () => {
    let state = onboard();
    state = { ...state, quests: { ...state.quests, kinds: ['lessons', 'feed', 'perfect'] } };
    const fed = trackQuests(feedPet(state, { speciesId: 'bubbo' }, ctx), ctx);
    expect(fed.state.quests.progress.feed).toBe(1);
  });

  it('keeps v1.2 data through a save and restore', () => {
    let state = learnFirstLessons(onboard(), 2);
    state = finishMiniGame(state, { kind: 'bubble-pop', correct: 3, total: 8 }, ctx).state;
    state = finishLesson(state, { lessonId: PRACTICE_LESSON_ID, accuracy: 1, wordResults: [] }, ctx).state;
    const restored = restoreGameState(JSON.parse(JSON.stringify(state)), TODAY, 'es')!;
    expect(restored.play).toEqual(state.play);
    expect(restored.quests).toEqual(state.quests);
    expect(restored.progress.practiceSessions).toBe(1);
    // Saves from v1.1 (no play or quest data) still load.
    const legacy = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
    delete legacy.play;
    delete legacy.quests;
    const old = restoreGameState(legacy, TODAY, 'es')!;
    expect(old.play.totalGames).toBe(0);
    expect(old.quests.kinds[0]).toBe('lessons');
  });
});
