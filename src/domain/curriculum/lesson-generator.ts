import { pickReviewWords, type WordMastery } from '../learning/mastery';
import type { DayKey } from '../shared/day';
import { createRng, type Rng } from '../shared/rng';
import { tokenizeSentence, type Exercise } from './exercises';
import type { LessonId, LessonPlan, Sentence, Story, VocabularyItem, WordId, World } from './types';

/**
 * Lesson generation tuning. Values are deliberately small: about 12 exercises
 * is roughly 3–4 minutes for a 7-year-old, inside a typical attention span.
 */
export const LESSON_TUNING = {
  /** Options per pick exercise in learn and review lessons. */
  easyOptionCount: 3,
  /** Options per pick exercise in boss lessons. */
  hardOptionCount: 4,
  /** Already-seen words mixed into each learn lesson. */
  learnReviewCount: 2,
  matchPairCount: 4,
  spellMinLength: 3,
  spellMaxLength: 7,
  spellDistractorLetters: 2,
  sentenceDistractorTiles: 1,
} as const;

type Slot =
  | 'listen'
  | 'picture'
  | 'true-false'
  | 'match'
  | 'spell'
  | 'sentence'
  | 'speak-word'
  | 'speak-sentence';

/** Slot sequence for review lessons (10 exercises). */
const REVIEW_RECIPE: readonly Slot[] = [
  'listen', 'picture', 'true-false', 'listen', 'spell',
  'picture', 'sentence', 'listen', 'match', 'sentence',
];

/** Slot sequence for speaking lessons (9 exercises): warm-up listening, then talking. */
const SPEAK_RECIPE: readonly Slot[] = [
  'listen', 'speak-word', 'speak-word', 'picture', 'speak-word',
  'speak-sentence', 'speak-word', 'speak-word', 'speak-sentence',
];

/** Comprehension questions after a story. */
export const STORY_TUNING = { questions: 3 } as const;

/** Slot sequence for boss lessons (12 exercises, harder options). */
const BOSS_RECIPE: readonly Slot[] = [
  'listen', 'picture', 'spell', 'listen', 'true-false', 'picture',
  'sentence', 'match', 'listen', 'spell', 'picture', 'sentence',
];

export interface GenerateLessonInput {
  readonly plan: LessonPlan;
  /** Every world, so distractors and reviews can come from other worlds. */
  readonly worlds: readonly World[];
  readonly mastery: Readonly<Record<WordId, WordMastery>>;
  readonly today: DayKey;
  readonly seed: number;
}

export interface GeneratedLesson {
  readonly id: LessonId;
  readonly plan: LessonPlan;
  readonly exercises: readonly Exercise[];
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/** Only single, plain words of a reasonable length are spelled. */
export function isSpellable(word: VocabularyItem): boolean {
  const pattern = new RegExp(
    `^[a-z]{${LESSON_TUNING.spellMinLength},${LESSON_TUNING.spellMaxLength}}$`,
  );
  return pattern.test(word.en);
}

class LessonBuilder {
  private readonly exercises: Exercise[] = [];
  private counter = 0;

  constructor(
    private readonly lessonId: LessonId,
    private readonly rng: Rng,
    private readonly localPool: readonly VocabularyItem[],
    private readonly globalPool: readonly VocabularyItem[],
    private readonly optionCount: number,
  ) {}

  build(): Exercise[] {
    return this.exercises;
  }

  push(exercise: Exercise): void {
    this.exercises.push(exercise);
  }

  nextId(): string {
    this.counter += 1;
    return `${this.lessonId}#${this.counter}`;
  }

  /** Distractors that cannot be confused with the answer (different picture and word). */
  distractors(answer: VocabularyItem, count: number): VocabularyItem[] {
    const chosen: VocabularyItem[] = [];
    const usedEmoji = new Set([answer.emoji]);
    const usedText = new Set([answer.en.toLowerCase()]);
    const tryAdd = (candidates: readonly VocabularyItem[]) => {
      for (const c of this.rng.shuffle(candidates)) {
        if (chosen.length >= count) return;
        if (usedEmoji.has(c.emoji) || usedText.has(c.en.toLowerCase())) continue;
        chosen.push(c);
        usedEmoji.add(c.emoji);
        usedText.add(c.en.toLowerCase());
      }
    };
    tryAdd(this.localPool);
    if (chosen.length < count) tryAdd(this.globalPool);
    return chosen;
  }

  options(answer: VocabularyItem): WordId[] {
    const others = this.distractors(answer, this.optionCount - 1);
    return this.rng.shuffle([answer, ...others]).map((w) => w.id);
  }

  learnCard(word: VocabularyItem): void {
    this.push({ kind: 'learn-card', id: this.nextId(), wordId: word.id });
  }

  listen(word: VocabularyItem): void {
    this.push({
      kind: 'listen-pick-picture',
      id: this.nextId(),
      answerId: word.id,
      optionIds: this.options(word),
    });
  }

  picture(word: VocabularyItem): void {
    this.push({
      kind: 'picture-pick-word',
      id: this.nextId(),
      answerId: word.id,
      optionIds: this.options(word),
    });
  }

  trueFalse(word: VocabularyItem): void {
    const matches = this.rng.chance(0.5);
    const shown = matches ? word : (this.distractors(word, 1)[0] ?? word);
    this.push({
      kind: 'true-false',
      id: this.nextId(),
      spokenWordId: word.id,
      shownWordId: shown.id,
    });
  }

  match(words: readonly VocabularyItem[]): void {
    const unique: VocabularyItem[] = [];
    for (const w of words) {
      if (unique.some((u) => u.emoji === w.emoji || u.en.toLowerCase() === w.en.toLowerCase())) {
        continue;
      }
      unique.push(w);
    }
    if (unique.length < 2) {
      if (unique[0]) this.listen(unique[0]);
      return;
    }
    this.push({
      kind: 'match-pairs',
      id: this.nextId(),
      wordIds: unique.slice(0, LESSON_TUNING.matchPairCount).map((w) => w.id),
    });
  }

  spell(word: VocabularyItem): void {
    const letters = word.en.split('');
    const extras = this.rng
      .shuffle(ALPHABET.split('').filter((l) => !letters.includes(l)))
      .slice(0, LESSON_TUNING.spellDistractorLetters);
    let tiles = this.rng.shuffle([...letters, ...extras]);
    // Never present the tiles already in solved order.
    if (tiles.slice(0, letters.length).join('') === word.en) tiles = [...tiles].reverse();
    this.push({ kind: 'spell-word', id: this.nextId(), wordId: word.id, letters: tiles });
  }

  speakWord(word: VocabularyItem): void {
    this.push({ kind: 'speak-word', id: this.nextId(), wordId: word.id });
  }

  speakSentence(sentence: Sentence): void {
    this.push({ kind: 'speak-sentence', id: this.nextId(), sentenceId: sentence.id });
  }

  storyPage(story: Story, lineIndex: number): void {
    this.push({ kind: 'story-page', id: this.nextId(), storyId: story.id, lineIndex });
  }

  sentence(sentence: Sentence): void {
    const tokens = tokenizeSentence(sentence.en);
    const extras = this.rng
      .shuffle(this.localPool.map((w) => w.en.toLowerCase()))
      .filter((t) => !t.includes(' ') && !tokens.includes(t))
      .slice(0, LESSON_TUNING.sentenceDistractorTiles);
    let tiles = this.rng.shuffle([...tokens, ...extras]);
    if (tiles.slice(0, tokens.length).join(' ') === tokens.join(' ')) tiles = [...tiles].reverse();
    this.push({ kind: 'build-sentence', id: this.nextId(), sentenceId: sentence.id, tiles });
  }
}

function indexWords(worlds: readonly World[]): Map<WordId, VocabularyItem> {
  const map = new Map<WordId, VocabularyItem>();
  for (const world of worlds) for (const word of world.words) map.set(word.id, word);
  return map;
}

/**
 * Builds a playable lesson from a plan. Pure and deterministic for a given seed.
 */
export function generateLesson(input: GenerateLessonInput): GeneratedLesson {
  const { plan, worlds, mastery, today } = input;
  const world = worlds.find((w) => w.id === plan.worldId);
  if (!world) throw new Error(`Unknown world for lesson ${plan.id}`);

  const rng = createRng(input.seed);
  const words = indexWords(worlds);
  const globalPool = worlds.flatMap((w) => w.words);
  const optionCount =
    plan.kind === 'boss' ? LESSON_TUNING.hardOptionCount : LESSON_TUNING.easyOptionCount;
  const builder = new LessonBuilder(plan.id, rng, world.words, globalPool, optionCount);

  if (plan.kind === 'learn') {
    buildLearnLesson(builder, plan, world, worlds, words, mastery, today, rng);
  } else if (plan.kind === 'story' && world.story) {
    buildStoryLesson(builder, world.story, words, rng);
  } else {
    const recipe =
      plan.kind === 'boss' ? BOSS_RECIPE : plan.kind === 'speak' ? SPEAK_RECIPE : REVIEW_RECIPE;
    buildFromRecipe(builder, recipe, world, mastery, today, rng);
  }

  return { id: plan.id, plan, exercises: builder.build() };
}

function buildLearnLesson(
  builder: LessonBuilder,
  plan: LessonPlan,
  world: World,
  worlds: readonly World[],
  words: Map<WordId, VocabularyItem>,
  mastery: Readonly<Record<WordId, WordMastery>>,
  today: DayKey,
  rng: Rng,
): void {
  const newWords = plan.newWordIds
    .map((id) => words.get(id))
    .filter((w): w is VocabularyItem => w !== undefined);
  if (newWords.length === 0) throw new Error(`Lesson ${plan.id} has no words`);

  // Introduce each word, then practise it straight away.
  newWords.forEach((word, i) => {
    builder.learnCard(word);
    if (i % 2 === 0) builder.listen(word);
    else builder.picture(word);
  });

  // Consolidation block, shuffled for variety.
  const tail: (() => void)[] = [];
  tail.push(() => builder.trueFalse(rng.pick(newWords)));
  tail.push(() => builder.match(rng.sample(newWords, LESSON_TUNING.matchPairCount)));
  const spellable = newWords.filter(isSpellable);
  if (spellable.length > 0) tail.push(() => builder.spell(rng.pick(spellable)));
  // Speaking from the very first lesson: one "say it" per lesson.
  tail.push(() => builder.speakWord(rng.pick(newWords)));
  if (plan.index >= 2 && world.sentences.length > 0) {
    const sentence = world.sentences[(plan.index - 2) % world.sentences.length];
    if (sentence) tail.push(() => builder.sentence(sentence));
  }

  // Spaced-repetition review of words met before (this world and earlier ones).
  const newIds = new Set(plan.newWordIds);
  const candidates = worlds
    .filter((w) => w.order <= world.order)
    .flatMap((w) => w.words.map((x) => x.id))
    .filter((id) => !newIds.has(id));
  for (const id of pickReviewWords(mastery, candidates, today, LESSON_TUNING.learnReviewCount)) {
    const word = words.get(id);
    if (!word) continue;
    tail.push(() => (rng.chance(0.5) ? builder.listen(word) : builder.picture(word)));
  }

  for (const step of rng.shuffle(tail)) step();
}

/** Picture-book pages read aloud, then questions about the words in the story. */
function buildStoryLesson(
  builder: LessonBuilder,
  story: Story,
  words: Map<WordId, VocabularyItem>,
  rng: Rng,
): void {
  story.lines.forEach((_, i) => builder.storyPage(story, i));
  const keyWords = [...new Set(story.lines.map((line) => line.keyWordId))]
    .map((id) => words.get(id))
    .filter((w): w is VocabularyItem => w !== undefined);
  const asked = rng.sample(keyWords, STORY_TUNING.questions);
  asked.forEach((word, i) => (i % 2 === 0 ? builder.listen(word) : builder.picture(word)));
  const extra = keyWords.find((w) => !asked.includes(w)) ?? keyWords[0];
  if (extra) builder.trueFalse(extra);
}

function buildFromRecipe(
  builder: LessonBuilder,
  recipe: readonly Slot[],
  world: World,
  mastery: Readonly<Record<WordId, WordMastery>>,
  today: DayKey,
  rng: Rng,
): void {
  const allIds = world.words.map((w) => w.id);
  const seenFirst = pickReviewWords(mastery, allIds, today, allIds.length);
  const unseen = rng.shuffle(allIds.filter((id) => !seenFirst.includes(id)));
  const focusOrder = [...seenFirst, ...unseen]
    .map((id) => world.words.find((w) => w.id === id))
    .filter((w): w is VocabularyItem => w !== undefined);
  const sentences = rng.shuffle(world.sentences);
  let wordCursor = 0;
  let sentenceCursor = 0;
  const nextWord = (): VocabularyItem => {
    const word = focusOrder[wordCursor % focusOrder.length] as VocabularyItem;
    wordCursor += 1;
    return word;
  };

  for (const slot of recipe) {
    switch (slot) {
      case 'listen':
        builder.listen(nextWord());
        break;
      case 'picture':
        builder.picture(nextWord());
        break;
      case 'true-false':
        builder.trueFalse(nextWord());
        break;
      case 'match': {
        const group = [nextWord(), nextWord(), nextWord(), nextWord()];
        builder.match(group);
        break;
      }
      case 'spell': {
        const spellable = focusOrder.filter(isSpellable);
        if (spellable.length > 0) {
          builder.spell(spellable[wordCursor % spellable.length] as VocabularyItem);
          wordCursor += 1;
        } else {
          builder.listen(nextWord());
        }
        break;
      }
      case 'sentence': {
        const sentence = sentences[sentenceCursor % Math.max(1, sentences.length)];
        sentenceCursor += 1;
        if (sentence) builder.sentence(sentence);
        else builder.picture(nextWord());
        break;
      }
      case 'speak-word':
        builder.speakWord(nextWord());
        break;
      case 'speak-sentence': {
        const sentence = sentences[sentenceCursor % Math.max(1, sentences.length)];
        sentenceCursor += 1;
        if (sentence) builder.speakSentence(sentence);
        else builder.speakWord(nextWord());
        break;
      }
    }
  }
}
