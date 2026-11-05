import { evaluateAnswer, isScored, tokenizeSentence, type Exercise } from '@/domain/curriculum/exercises';
import { generateLesson, isSpellable, LESSON_TUNING } from '@/domain/curriculum/lesson-generator';
import { buildLessonPlans } from '@/domain/curriculum/lesson-plans';
import type { World } from '@/domain/curriculum/types';
import { recordAnswer } from '@/domain/learning/mastery';
import { makeWorld, TODAY } from '../../helpers/fixtures';

function lookupFor(worlds: readonly World[]) {
  const words = new Map(worlds.flatMap((w) => w.words).map((w) => [w.id, w]));
  const sentences = new Map(worlds.flatMap((w) => w.sentences).map((s) => [s.id, s]));
  return {
    wordText: (id: string) => words.get(id)?.en ?? '',
    sentenceText: (id: string) => sentences.get(id)?.en ?? '',
    emoji: (id: string) => words.get(id)?.emoji ?? '',
  };
}

describe('generateLesson', () => {
  const world = makeWorld();
  const worlds = [world];
  const plans = buildLessonPlans(world);
  const lookup = lookupFor(worlds);

  it('is deterministic for the same seed', () => {
    const plan = plans[0]!;
    const a = generateLesson({ plan, worlds, mastery: {}, today: TODAY, seed: 42 });
    const b = generateLesson({ plan, worlds, mastery: {}, today: TODAY, seed: 42 });
    expect(a).toEqual(b);
  });

  it('introduces every new word with a learn card before testing it', () => {
    const plan = plans[0]!;
    const lesson = generateLesson({ plan, worlds, mastery: {}, today: TODAY, seed: 7 });
    for (const wordId of plan.newWordIds) {
      const cardIndex = lesson.exercises.findIndex((e) => e.kind === 'learn-card' && e.wordId === wordId);
      const firstTest = lesson.exercises.findIndex(
        (e) => isScored(e) && 'answerId' in e && e.answerId === wordId,
      );
      expect(cardIndex).toBeGreaterThanOrEqual(0);
      if (firstTest >= 0) expect(cardIndex).toBeLessThan(firstTest);
    }
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])('produces valid exercises for every plan (seed %i)', (seed) => {
    for (const plan of plans) {
      const lesson = generateLesson({ plan, worlds, mastery: {}, today: TODAY, seed });
      expect(lesson.exercises.length).toBeGreaterThan(0);
      expect(new Set(lesson.exercises.map((e) => e.id)).size).toBe(lesson.exercises.length);
      for (const exercise of lesson.exercises) assertValid(exercise);
    }
  });

  function assertValid(exercise: Exercise) {
    switch (exercise.kind) {
      case 'listen-pick-picture':
      case 'picture-pick-word': {
        expect(exercise.optionIds).toContain(exercise.answerId);
        const emojis = exercise.optionIds.map(lookup.emoji);
        const texts = exercise.optionIds.map(lookup.wordText);
        expect(new Set(emojis).size).toBe(emojis.length);
        expect(new Set(texts).size).toBe(texts.length);
        expect(exercise.optionIds.length).toBeLessThanOrEqual(LESSON_TUNING.hardOptionCount);
        break;
      }
      case 'match-pairs':
        expect(exercise.wordIds.length).toBeGreaterThanOrEqual(2);
        expect(new Set(exercise.wordIds.map(lookup.emoji)).size).toBe(exercise.wordIds.length);
        break;
      case 'spell-word': {
        const word = lookup.wordText(exercise.wordId);
        const pool = [...exercise.letters];
        for (const letter of word) {
          const i = pool.indexOf(letter);
          expect(i).toBeGreaterThanOrEqual(0);
          pool.splice(i, 1);
        }
        expect(exercise.letters.join('')).not.toBe(word);
        break;
      }
      case 'build-sentence': {
        const tokens = tokenizeSentence(lookup.sentenceText(exercise.sentenceId));
        for (const t of tokens) expect(exercise.tiles).toContain(t);
        break;
      }
      default:
        break;
    }
  }

  it('reviews words already seen in earlier lessons', () => {
    const [first, second] = plans;
    const mastery = Object.fromEntries(
      first!.newWordIds.map((id) => [id, recordAnswer(undefined, true, '2026-03-01')]),
    );
    const lesson = generateLesson({ plan: second!, worlds, mastery, today: TODAY, seed: 3 });
    const reviewed = lesson.exercises
      .filter((e) => e.kind === 'listen-pick-picture' || e.kind === 'picture-pick-word')
      .map((e) => ('answerId' in e ? e.answerId : ''))
      .filter((id) => first!.newWordIds.includes(id));
    expect(reviewed.length).toBeGreaterThan(0);
  });

  it('uses four options in boss lessons', () => {
    const boss = plans.find((p) => p.kind === 'boss')!;
    const lesson = generateLesson({ plan: boss, worlds, mastery: {}, today: TODAY, seed: 11 });
    const pick = lesson.exercises.find((e) => e.kind === 'listen-pick-picture');
    expect(pick && 'optionIds' in pick ? pick.optionIds.length : 0).toBe(LESSON_TUNING.hardOptionCount);
  });
});

describe('isSpellable', () => {
  it('accepts short plain words and rejects phrases', () => {
    const world = makeWorld();
    const dog = world.words.find((w) => w.en === 'dog')!;
    const teddy = world.words.find((w) => w.en === 'teddy bear')!;
    expect(isSpellable(dog)).toBe(true);
    expect(isSpellable(teddy)).toBe(false);
  });
});

describe('evaluateAnswer', () => {
  const world = makeWorld();
  const lookup = lookupFor([world]);
  const [dog, cat] = world.words;

  it('checks picks, booleans, matches, spelling and sentences', () => {
    const pick: Exercise = { kind: 'listen-pick-picture', id: 'x', answerId: dog!.id, optionIds: [dog!.id, cat!.id] };
    expect(evaluateAnswer(pick, { kind: 'pick', optionId: dog!.id }, lookup)).toBe(true);
    expect(evaluateAnswer(pick, { kind: 'pick', optionId: cat!.id }, lookup)).toBe(false);

    const tf: Exercise = { kind: 'true-false', id: 'y', spokenWordId: dog!.id, shownWordId: cat!.id };
    expect(evaluateAnswer(tf, { kind: 'bool', value: false }, lookup)).toBe(true);

    const match: Exercise = { kind: 'match-pairs', id: 'm', wordIds: [dog!.id, cat!.id] };
    expect(evaluateAnswer(match, { kind: 'match', mistakes: 0 }, lookup)).toBe(true);
    expect(evaluateAnswer(match, { kind: 'match', mistakes: 1 }, lookup)).toBe(false);

    const spell: Exercise = { kind: 'spell-word', id: 's', wordId: dog!.id, letters: ['g', 'o', 'd'] };
    expect(evaluateAnswer(spell, { kind: 'spell', letters: ['d', 'o', 'g'] }, lookup)).toBe(true);

    const sentence: Exercise = { kind: 'build-sentence', id: 'b', sentenceId: world.sentences[0]!.id, tiles: [] };
    expect(
      evaluateAnswer(sentence, { kind: 'sentence', tokens: ['the', 'dog', 'is', 'happy'] }, lookup),
    ).toBe(true);
    expect(
      evaluateAnswer(sentence, { kind: 'sentence', tokens: ['dog', 'the', 'is', 'happy'] }, lookup),
    ).toBe(false);
  });
});
