import {
  adoptPet,
  buyAccessory,
  claimDailyGift,
  completeOnboarding,
  equipAccessory,
  feedPet,
  finishLesson,
  hatchEgg,
  resetGame,
  startDay,
  type CommandContext,
} from '@/application/commands';
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
});
