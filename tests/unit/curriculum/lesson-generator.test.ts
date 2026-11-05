import { evaluateAnswer, gapLine, isScored, tokenizeSentence, type Exercise } from '@/domain/curriculum/exercises';
import {
  canPractice,
  generateLesson,
  generatePracticeLesson,
  isSpellable,
  LESSON_TUNING,
  PRACTICE_LESSON_ID,
  PRACTICE_TUNING,
  SONG_TUNING,
} from '@/domain/curriculum/lesson-generator';
import { buildLessonPlans } from '@/domain/curriculum/lesson-plans';
import type { World } from '@/domain/curriculum/types';
import { recordAnswer } from '@/domain/learning/mastery';
import { attachSong, attachStory } from '@/infrastructure/content/define-world';
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

describe('story and speaking lessons', () => {
  const base = makeWorld();
  const world = attachStory(base, {
    title: { en: 'A day', es: 'Un día', pt: 'Um dia', fr: 'Un jour' },
    lines: [
      ['The dog runs.', '🐶', 'El perro corre.', 'O cachorro corre.', 'fr', 'dog'],
      ['The cat sleeps.', '🐱', 'El gato duerme.', 'O gato dorme.', 'fr', 'cat'],
      ['The cow eats.', '🐮', 'La vaca come.', 'A vaca come.', 'fr', 'cow'],
      ['The pig plays.', '🐷', 'El cerdo juega.', 'O porco brinca.', 'fr', 'pig'],
    ],
  });
  const worlds = [world];
  const plans = buildLessonPlans(world);

  it('orders follow-up lessons story → speak → review → boss', () => {
    expect(plans.filter((p) => p.kind !== 'learn').map((p) => p.kind)).toEqual(['story', 'speak', 'review', 'boss']);
  });

  it('reads every story page first, then asks about the story words', () => {
    const plan = plans.find((p) => p.kind === 'story')!;
    const lesson = generateLesson({ plan, worlds, mastery: {}, today: TODAY, seed: 5 });
    const pages = lesson.exercises.filter((e) => e.kind === 'story-page');
    expect(pages).toHaveLength(4);
    expect(lesson.exercises.slice(0, 4).every((e) => e.kind === 'story-page')).toBe(true);
    const keyIds = new Set(world.story!.lines.map((l) => l.keyWordId));
    const asked = lesson.exercises
      .slice(4)
      .map((e) => ('answerId' in e ? e.answerId : 'spokenWordId' in e ? e.spokenWordId : ''));
    expect(asked.length).toBeGreaterThanOrEqual(3);
    for (const id of asked) expect(keyIds.has(id)).toBe(true);
  });

  it('makes speaking lessons mostly speaking', () => {
    const plan = plans.find((p) => p.kind === 'speak')!;
    const lesson = generateLesson({ plan, worlds, mastery: {}, today: TODAY, seed: 9 });
    const speaking = lesson.exercises.filter((e) => e.kind === 'speak-word' || e.kind === 'speak-sentence');
    expect(speaking.length).toBeGreaterThanOrEqual(6);
  });

  it('adds one speaking exercise to every learn lesson', () => {
    for (const plan of plans.filter((p) => p.kind === 'learn')) {
      const lesson = generateLesson({ plan, worlds, mastery: {}, today: TODAY, seed: 2 });
      expect(lesson.exercises.filter((e) => e.kind === 'speak-word')).toHaveLength(1);
    }
  });
});

describe('song lessons', () => {
  const base = makeWorld();
  const world = attachSong(base, {
    title: { en: 'Farm song', es: 'Canción', pt: 'Música', fr: 'Chanson' },
    lines: [
      ['The dog says woof, woof!', '🐶', 'El perro dice guau.', 'O cachorro faz au.', 'fr', 'dog'],
      ['Cat, cat, meow, cat!', '🐱', 'Gato, gato, miau.', 'Gato, gato, miau.', 'fr', 'cat'],
      ['The cow says moo!', '🐮', 'La vaca dice mu.', 'A vaca faz mu.', 'fr', 'cow'],
      ['Hug my teddy bear!', '🧸', 'Abrazo mi osito.', 'Abraço meu ursinho.', 'fr', 'teddy bear'],
    ],
  });
  const worlds = [world];
  const plans = buildLessonPlans(world);

  it('slots the song between the story and the speaking lesson', () => {
    const withStory = attachStory(world, {
      title: { en: 'A day', es: 'Un día', pt: 'Um dia', fr: 'Un jour' },
      lines: [['The dog runs.', '🐶', 'El perro corre.', 'O cachorro corre.', 'fr', 'dog']],
    });
    const kinds = buildLessonPlans(withStory).filter((p) => p.kind !== 'learn').map((p) => p.kind);
    expect(kinds).toEqual(['story', 'song', 'speak', 'review', 'boss']);
    expect(plans.find((p) => p.kind === 'song')?.id).toBe('animals.song');
  });

  it('sings first, then blanks key words, then checks and speaks them', () => {
    const plan = plans.find((p) => p.kind === 'song')!;
    const lesson = generateLesson({ plan, worlds, mastery: {}, today: TODAY, seed: 3 });
    expect(lesson.exercises[0]?.kind).toBe('song');
    const gaps = lesson.exercises.filter((e) => e.kind === 'lyric-gap');
    expect(gaps).toHaveLength(SONG_TUNING.gaps);
    for (const gap of gaps) {
      if (gap.kind !== 'lyric-gap') continue;
      const line = world.song!.lines[gap.lineIndex]!;
      expect(gap.answerId).toBe(line.keyWordId);
      expect(gap.optionIds).toContain(gap.answerId);
      expect(new Set(gap.optionIds).size).toBe(gap.optionIds.length);
    }
    expect(lesson.exercises.filter((e) => e.kind === 'speak-word')).toHaveLength(1);
    expect(lesson.exercises.length).toBe(8);
    expect(isScored(lesson.exercises[0]!)).toBe(false);
  });

  it('blanks every occurrence of the missing word', () => {
    expect(gapLine('Cat, cat, meow, cat!', 'cat')).toEqual({ segments: ['', ', ', ', meow, ', '!'], missing: 'Cat' });
    expect(gapLine('Hug my teddy bear!', 'teddy bear')?.segments).toEqual(['Hug my ', '!']);
    expect(gapLine('A snowman in the snow', 'snow')?.segments).toEqual(['A snowman in the ', '']);
    expect(gapLine('Scattered toys', 'cat')).toBeNull();
    expect(gapLine('Hit the piñata!', 'piñata')?.missing).toBe('piñata');
  });

  it('scores a lyric gap like a pick', () => {
    const exercise: Exercise = {
      kind: 'lyric-gap',
      id: 'x',
      songId: 'animals.song',
      lineIndex: 0,
      answerId: 'animals.dog',
      optionIds: ['animals.dog', 'animals.cat'],
    };
    const lookup = lookupFor(worlds);
    expect(evaluateAnswer(exercise, { kind: 'pick', optionId: 'animals.dog' }, lookup)).toBe(true);
    expect(evaluateAnswer(exercise, { kind: 'pick', optionId: 'animals.cat' }, lookup)).toBe(false);
  });
});

describe('Word Gym practice', () => {
  const farm = makeWorld('farm', 1);
  const zoo = makeWorld('zoo', 2);
  const worlds = [farm, zoo];
  const seen = (ids: string[], box = 1, day = '2026-03-01') =>
    Object.fromEntries(ids.map((id) => [id, { box, lastReviewDay: day }])) as Record<string, ReturnType<typeof recordAnswer>>;

  it('opens once a few words have been met', () => {
    expect(canPractice({})).toBe(false);
    expect(canPractice(seen(['farm.dog', 'farm.cat', 'farm.cow']))).toBe(false);
    expect(canPractice(seen(['farm.dog', 'farm.cat', 'farm.cow', 'farm.pig']))).toBe(true);
    expect(generatePracticeLesson({ worlds, mastery: {}, today: TODAY, seed: 1 })).toBeNull();
  });

  it('only trains words already met, across worlds, never teaching new ones', () => {
    const mastery = { ...seen(['farm.dog', 'farm.cat', 'farm.cow']), ...seen(['zoo.pig', 'zoo.duck'], 3) };
    const lesson = generatePracticeLesson({ worlds, mastery, today: TODAY, seed: 7 })!;
    expect(lesson.id).toBe(PRACTICE_LESSON_ID);
    expect(lesson.plan.kind).toBe('practice');
    expect(lesson.exercises.some((e) => e.kind === 'learn-card')).toBe(false);
    expect(lesson.exercises.length).toBe(10);
    const allowed = new Set(Object.keys(mastery));
    const targets = lesson.exercises.flatMap((e) =>
      'answerId' in e ? [e.answerId] : 'spokenWordId' in e ? [e.spokenWordId] : 'wordId' in e ? [e.wordId] : 'wordIds' in e ? e.wordIds : [],
    );
    for (const id of targets) expect(allowed.has(id)).toBe(true);
  });

  it('puts the weakest words first and hosts the session in their world', () => {
    const mastery = { ...seen(['farm.dog', 'farm.cat'], 4, '2026-03-09'), ...seen(['zoo.pig', 'zoo.duck', 'zoo.cow'], 0) };
    const lesson = generatePracticeLesson({ worlds, mastery, today: TODAY, seed: 2 })!;
    expect(lesson.plan.worldId).toBe('zoo');
    const first = lesson.exercises[0]!;
    expect('answerId' in first && first.answerId.startsWith('zoo.')).toBe(true);
  });

  it('caps the focus list', () => {
    const many = seen([...farm.words, ...zoo.words].map((w) => w.id));
    const lesson = generatePracticeLesson({ worlds, mastery: many, today: TODAY, seed: 4 })!;
    const answers = new Set(lesson.exercises.flatMap((e) => ('answerId' in e ? [e.answerId] : [])));
    expect(answers.size).toBeLessThanOrEqual(PRACTICE_TUNING.focusWords);
  });

  it('refuses to build a practice plan through the world generator', () => {
    const plan = { id: PRACTICE_LESSON_ID, worldId: 'farm', kind: 'practice' as const, index: 1, newWordIds: [] };
    expect(() => generateLesson({ plan, worlds, mastery: {}, today: TODAY, seed: 1 })).toThrow();
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
