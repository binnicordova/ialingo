import { finishJumpChallenge, finishLesson, type CommandContext } from '@/application/commands';
import {
  buildJourney,
  canJumpTo,
  isJumpPassed,
  JUMP_TUNING,
  jumpLessonId,
  jumpTargetOf,
  skippedWorlds,
} from '@/domain/curriculum/journey';
import { generateJumpChallenge } from '@/domain/curriculum/lesson-generator';
import { isWorldUnlocked } from '@/domain/curriculum/unlock-policy';
import { ECONOMY_TUNING } from '@/domain/economy/economy';
import type { GameState } from '@/domain/game/game-state';
import { restoreGameState } from '@/domain/game/snapshot';
import { createProgress, recordJumpChallenge } from '@/domain/learning/progress';

import { freshState, realContent, TODAY } from '../../helpers/fixtures';

const content = realContent();
const worlds = content.orderedWorlds;
const [first, second, third] = worlds as [(typeof worlds)[0], (typeof worlds)[0], (typeof worlds)[0]];
const ctx: CommandContext = { today: TODAY, content };

function finishAllLearn(state: GameState, worldId: string): GameState {
  let next = state;
  for (const plan of content.lessonPlansForWorld(worldId).filter((p) => p.kind === 'learn')) {
    const wordResults = plan.newWordIds.map((wordId) => ({ wordId, correct: true }));
    next = finishLesson(next, { lessonId: plan.id, accuracy: 1, wordResults }, ctx).state;
  }
  return next;
}

describe('journey (the single home map)', () => {
  it('starts on the first lesson of world 1; every other world is locked and can be jumped to', () => {
    const journey = buildJourney(worlds, createProgress());
    expect(journey.current).toEqual({ worldId: first.id, lessonId: `${first.id}.learn-1` });
    const [unit1, unit2] = journey.units;
    expect(unit1?.unlocked).toBe(true);
    expect(unit1?.canJump).toBe(false);
    expect(unit1?.steps.map((s) => s.status).slice(0, 2)).toEqual(['current', 'locked']);
    expect(unit2?.unlocked).toBe(false);
    expect(unit2?.canJump).toBe(true);
    expect(unit2?.steps.every((s) => s.status === 'locked')).toBe(true);
    expect(journey.units.filter((u) => u.startsLevel).length).toBeGreaterThanOrEqual(3);
  });

  it('marks finished lessons done and keeps the optional ones of a world ahead of the next world', () => {
    const state = finishAllLearn(freshState(), first.id);
    const journey = buildJourney(worlds, state.progress);
    const unit1 = journey.units[0]!;
    expect(unit1.steps.filter((s) => s.plan.kind === 'learn').every((s) => s.status === 'done')).toBe(true);
    // The story of world 1 comes next, and world 2 is open.
    expect(journey.current?.worldId).toBe(first.id);
    expect(content.lessonPlan(journey.current!.lessonId)?.kind).toBe('story');
    expect(journey.units[1]?.unlocked).toBe(true);
    expect(journey.units[1]?.steps[0]?.status).toBe('open');
  });
});

describe('jump challenge rules', () => {
  it('names a challenge after its target world and reads it back', () => {
    expect(jumpTargetOf(jumpLessonId(third.id))).toBe(third.id);
    expect(jumpTargetOf(`${first.id}.learn-1`)).toBeNull();
    expect(jumpTargetOf('gym')).toBeNull();
  });

  it('skips every earlier world whose learn lessons are not all done', () => {
    expect(skippedWorlds(third, worlds, createProgress()).map((w) => w.id)).toEqual([first.id, second.id]);
    const state = finishAllLearn(freshState(), first.id);
    expect(skippedWorlds(third, worlds, state.progress).map((w) => w.id)).toEqual([second.id]);
    expect(canJumpTo(second, worlds, state.progress)).toBe(false);
    expect(canJumpTo(third, worlds, state.progress)).toBe(true);
  });

  it('passes at the tuned first-try accuracy', () => {
    expect(isJumpPassed(JUMP_TUNING.passAccuracy)).toBe(true);
    expect(isJumpPassed(JUMP_TUNING.passAccuracy - 0.01)).toBe(false);
  });

  it('opens the target and every world before it, and moves "current" to the target', () => {
    const progress = recordJumpChallenge(createProgress(), {
      accuracy: 1,
      wordResults: [],
      today: TODAY,
      targetWorldId: third.id,
      passed: true,
    }).progress;
    expect(progress.jumpedTo).toEqual([third.id]);
    for (const w of [first, second, third]) expect(isWorldUnlocked(w, worlds, progress)).toBe(true);
    expect(isWorldUnlocked(worlds[3]!, worlds, progress)).toBe(false);
    const journey = buildJourney(worlds, progress);
    expect(journey.current).toEqual({ worldId: third.id, lessonId: `${third.id}.learn-1` });
    // Skipped lessons stay playable but unplayed: their stars and eggs are earned by playing.
    expect(journey.units[1]?.steps[0]?.status).toBe('open');
    expect(journey.units[1]?.steps[0]?.stars).toBe(0);
  });

  it('builds 12 exercises from the skipped worlds only, with no speaking and four options', () => {
    const skipped = skippedWorlds(third, worlds, createProgress());
    const lesson = generateJumpChallenge({ target: third, skipped, worlds, seed: 7 })!;
    expect(lesson.id).toBe(jumpLessonId(third.id));
    expect(lesson.plan.kind).toBe('jump');
    expect(lesson.exercises).toHaveLength(12);
    expect(lesson.exercises.some((e) => e.kind === 'speak-word' || e.kind === 'speak-sentence')).toBe(false);
    const skippedWords = new Set(skipped.flatMap((w) => w.words.map((x) => x.id)));
    for (const e of lesson.exercises) {
      if (e.kind === 'listen-pick-picture' || e.kind === 'picture-pick-word') {
        expect(skippedWords.has(e.answerId)).toBe(true);
        expect(e.optionIds).toHaveLength(4);
      }
    }
    expect(generateJumpChallenge({ target: third, skipped, worlds, seed: 7 })).toEqual(lesson);
    expect(generateJumpChallenge({ target: first, skipped: [], worlds, seed: 7 })).toBeNull();
  });
});

describe('finishJumpChallenge command', () => {
  const words = first.words.slice(0, 4).map((w) => ({ wordId: w.id, correct: true }));

  it('opens the worlds, pays a one-time bonus and announces the new worlds', () => {
    const before = freshState();
    const { state, events } = finishJumpChallenge(before, { targetWorldId: third.id, accuracy: 0.9, wordResults: words }, ctx);
    expect(state.progress.jumpedTo).toEqual([third.id]);
    expect(events).toContainEqual({ type: 'jump-finished', worldId: third.id, passed: true });
    const opened = events.filter((e) => e.type === 'world-unlocked').map((e) => (e.type === 'world-unlocked' ? e.worldId : ''));
    expect(opened).toEqual([second.id, third.id]);
    const done = events.find((e) => e.type === 'lesson-completed');
    expect(done?.type === 'lesson-completed' && done.berries).toBeGreaterThanOrEqual(ECONOMY_TUNING.jumpPassBonusBerries);
    expect(state.wallet.berries - before.wallet.berries).toBe(done?.type === 'lesson-completed' ? done.berries : -1);
    // Mastery counts what the child showed; no lesson record is stored.
    expect(state.progress.mastery[first.words[0]!.id]).toBeDefined();
    expect(Object.keys(state.progress.lessons)).toEqual([]);
  });

  it('a near miss changes nothing but mastery: no penalty, no bonus, try again any time', () => {
    const { state, events } = finishJumpChallenge(freshState(), { targetWorldId: third.id, accuracy: 0.5, wordResults: words }, ctx);
    expect(state.progress.jumpedTo).toEqual([]);
    expect(events).toContainEqual({ type: 'jump-finished', worldId: third.id, passed: false });
    expect(events.some((e) => e.type === 'world-unlocked')).toBe(false);
    expect(canJumpTo(third, worlds, state.progress)).toBe(true);
  });

  it('does not count a challenge for a world that is already open', () => {
    const open = finishJumpChallenge(freshState(), { targetWorldId: third.id, accuracy: 1, wordResults: words }, ctx).state;
    const again = finishJumpChallenge(open, { targetWorldId: second.id, accuracy: 1, wordResults: words }, ctx);
    expect(again.events).toContainEqual({ type: 'jump-finished', worldId: second.id, passed: false });
    expect(again.state.progress.jumpedTo).toEqual([third.id]);
  });

  it('keeps jumps across a save and repairs bad data', () => {
    const jumped = finishJumpChallenge(freshState(), { targetWorldId: third.id, accuracy: 1, wordResults: words }, ctx).state;
    const restored = restoreGameState(JSON.parse(JSON.stringify(jumped)), TODAY, 'es')!;
    expect(restored.progress.jumpedTo).toEqual([third.id]);
    const raw = JSON.parse(JSON.stringify(jumped)) as { progress: { jumpedTo: unknown } };
    raw.progress.jumpedTo = [third.id, third.id, 42];
    expect(restoreGameState(raw, TODAY, 'es')!.progress.jumpedTo).toEqual([third.id]);
    delete (raw.progress as { jumpedTo?: unknown }).jumpedTo;
    expect(restoreGameState(raw, TODAY, 'es')!.progress.jumpedTo).toEqual([]);
  });
});
