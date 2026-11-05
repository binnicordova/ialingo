import type { VocabularyItem, WorldCategory, WordId, WorldId } from '../curriculum/types';
import type { WordMastery } from '../learning/mastery';
import type { DayKey } from '../shared/day';
import type { Rng } from '../shared/rng';

/**
 * Play Park: short arcade games over words the child already met. They are
 * low-stakes retrieval practice, so they never change spaced-repetition
 * boxes, and their berries are capped per day so lessons stay the main path.
 */
export type MiniGameKind = 'bubble-pop' | 'memory-match' | 'i-spy' | 'odd-one-out';

export const MINI_GAME_KINDS: readonly MiniGameKind[] = ['bubble-pop', 'memory-match', 'i-spy', 'odd-one-out'];

export const PLAY_TUNING = {
  /** Words a child must have met before the Play Park opens. */
  minWords: 6,
  berriesPerCorrect: 1,
  /** Game berries per day (a 3-star lesson pays about 11). */
  dailyBerryCap: 20,
  bubbleRounds: 8,
  bubbleOptions: 4,
  memoryPairs: 6,
  /** I Spy: pictures in the scene, and how many of them are asked for. */
  spyItems: 9,
  spyRounds: 6,
  /** Odd One Out rounds (3 from one category + 1 from another). */
  oddRounds: 6,
  /** Words drawn from (due and weakest first) before sampling. */
  poolSize: 24,
} as const;

/** Daily counters for the Play Park, plus a lifetime total for badges. */
export interface PlayState {
  readonly day: DayKey;
  readonly berriesToday: number;
  readonly gamesToday: number;
  readonly totalGames: number;
}

export function createPlayState(today: DayKey): PlayState {
  return { day: today, berriesToday: 0, gamesToday: 0, totalGames: 0 };
}

export function rollPlayDay(play: PlayState, today: DayKey): PlayState {
  return play.day === today ? play : { ...play, day: today, berriesToday: 0, gamesToday: 0 };
}

export function canPlayGames(mastery: Readonly<Record<WordId, WordMastery>>): boolean {
  return Object.keys(mastery).length >= PLAY_TUNING.minWords;
}

export function berriesLeftToday(play: PlayState, today: DayKey): number {
  return Math.max(0, PLAY_TUNING.dailyBerryCap - rollPlayDay(play, today).berriesToday);
}

/** Pays a finished game, within the daily cap. */
export function settleMiniGame(
  play: PlayState,
  today: DayKey,
  correct: number,
): { play: PlayState; berries: number; capped: boolean } {
  const current = rollPlayDay(play, today);
  const earned = Math.max(0, Math.floor(correct)) * PLAY_TUNING.berriesPerCorrect;
  const berries = Math.min(earned, Math.max(0, PLAY_TUNING.dailyBerryCap - current.berriesToday));
  return {
    berries,
    capped: earned > berries,
    play: {
      ...current,
      berriesToday: current.berriesToday + berries,
      gamesToday: current.gamesToday + 1,
      totalGames: current.totalGames + 1,
    },
  };
}

/** Removes words that share a picture or spelling with an earlier one. */
function distinctWords(words: readonly VocabularyItem[]): VocabularyItem[] {
  const emojis = new Set<string>();
  const texts = new Set<string>();
  const out: VocabularyItem[] = [];
  for (const word of words) {
    const text = word.en.toLowerCase();
    if (emojis.has(word.emoji) || texts.has(text)) continue;
    emojis.add(word.emoji);
    texts.add(text);
    out.push(word);
  }
  return out;
}

/* ------------------------------------------------------------ Bubble Pop */

/** One round: the guide says the target word; bubbles show pictures. */
export interface BubbleRound {
  readonly targetId: WordId;
  readonly optionIds: readonly WordId[];
}

export function createBubbleRounds(
  rng: Rng,
  words: readonly VocabularyItem[],
  rounds: number = PLAY_TUNING.bubbleRounds,
  options: number = PLAY_TUNING.bubbleOptions,
): BubbleRound[] {
  const pool = distinctWords(words);
  if (pool.length < 2) return [];
  const order = rng.shuffle(pool);
  const result: BubbleRound[] = [];
  for (let i = 0; i < rounds; i += 1) {
    const target = order[i % order.length] as VocabularyItem;
    const others = rng
      .shuffle(pool.filter((w) => w.id !== target.id))
      .slice(0, Math.max(1, options - 1));
    result.push({ targetId: target.id, optionIds: rng.shuffle([target, ...others]).map((w) => w.id) });
  }
  return result;
}

/* ---------------------------------------------------------- Memory Match */

export type CardFace = 'picture' | 'word';

export interface MemoryCard {
  readonly id: string;
  readonly wordId: WordId;
  readonly face: CardFace;
}

export interface MemoryBoard {
  readonly cards: readonly MemoryCard[];
  /** Face-up cards that are not matched yet (at most two). */
  readonly open: readonly string[];
  readonly matched: readonly WordId[];
  /** Pairs of cards turned over. */
  readonly moves: number;
}

export type FlipResult = 'ignored' | 'opened' | 'match' | 'mismatch';

/** A board of picture cards and word cards: find each picture's word. */
export function createMemoryBoard(
  rng: Rng,
  words: readonly VocabularyItem[],
  pairs: number = PLAY_TUNING.memoryPairs,
): MemoryBoard {
  const chosen = rng.sample(distinctWords(words), pairs);
  const cards = chosen.flatMap((w): MemoryCard[] => [
    { id: `${w.id}#picture`, wordId: w.id, face: 'picture' },
    { id: `${w.id}#word`, wordId: w.id, face: 'word' },
  ]);
  return { cards: rng.shuffle(cards), open: [], matched: [], moves: 0 };
}

export function flipCard(board: MemoryBoard, cardId: string): { board: MemoryBoard; result: FlipResult } {
  const card = board.cards.find((c) => c.id === cardId);
  if (!card || board.matched.includes(card.wordId) || board.open.includes(cardId)) {
    return { board, result: 'ignored' };
  }
  // A missed pair still showing is turned back first.
  const open = board.open.length >= 2 ? [] : board.open;
  const firstId = open[0];
  if (firstId === undefined) return { board: { ...board, open: [cardId] }, result: 'opened' };
  const first = board.cards.find((c) => c.id === firstId);
  const moves = board.moves + 1;
  if (first && first.wordId === card.wordId) {
    return { board: { ...board, open: [], matched: [...board.matched, card.wordId], moves }, result: 'match' };
  }
  return { board: { ...board, open: [firstId, cardId], moves }, result: 'mismatch' };
}

export function closeOpenCards(board: MemoryBoard): MemoryBoard {
  return board.open.length === 0 ? board : { ...board, open: [] };
}

export function isBoardSolved(board: MemoryBoard): boolean {
  return board.cards.length > 0 && board.matched.length * 2 === board.cards.length;
}

/* ------------------------------------------------------------------ I Spy */

/** One picture in the scene. Positions are fractions of the scene size. */
export interface SpyItem {
  readonly wordId: WordId;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly tilt: number;
}

export interface SpyScene {
  readonly items: readonly SpyItem[];
  /** Words asked for, in order (each one appears in the scene). */
  readonly targets: readonly WordId[];
}

/**
 * A scene of pictures laid out on a jittered 3×3 grid (no overlaps), and the
 * words the guide will ask the child to find.
 */
export function createSpyScene(
  rng: Rng,
  words: readonly VocabularyItem[],
  itemCount: number = PLAY_TUNING.spyItems,
  rounds: number = PLAY_TUNING.spyRounds,
): SpyScene {
  const chosen = rng.sample(distinctWords(words), Math.min(itemCount, 9));
  if (chosen.length < 2) return { items: [], targets: [] };
  const cells = rng.shuffle(Array.from({ length: 9 }, (_, i) => i));
  const items = chosen.map((word, i): SpyItem => {
    const cell = cells[i] as number;
    const col = cell % 3;
    const row = Math.floor(cell / 3);
    const jitter = () => (rng.next() - 0.5) * 0.34;
    return {
      wordId: word.id,
      x: (col + 0.5 + jitter()) / 3,
      y: (row + 0.5 + jitter()) / 3,
      scale: 0.85 + rng.next() * 0.3,
      tilt: Math.round((rng.next() - 0.5) * 24),
    };
  });
  const targets = rng.sample(items, Math.min(rounds, items.length)).map((item) => item.wordId);
  return { items, targets };
}

/* ------------------------------------------------------------ Odd One Out */

export interface OddRound {
  /** World whose words form the group. */
  readonly groupWorldId: WorldId;
  readonly oddWorldId: WorldId;
  readonly oddId: WordId;
  readonly optionIds: readonly WordId[];
}

/** Category of each world (from the content catalog). */
export type WorldCategories = Readonly<Record<WorldId, WorldCategory | undefined>>;

function coherentGroups(
  words: readonly VocabularyItem[],
  categories: WorldCategories,
): Map<WorldId, VocabularyItem[]> {
  const groups = new Map<WorldId, VocabularyItem[]>();
  for (const word of distinctWords(words)) {
    if (!categories[word.worldId]?.coherent) continue;
    const list = groups.get(word.worldId) ?? [];
    list.push(word);
    groups.set(word.worldId, list);
  }
  return groups;
}

/**
 * Rounds of "which one doesn't belong?": three words from one coherent world
 * and one from a coherent world of a *different* theme, so there is exactly
 * one right answer (never "cow, dog, pig + owl").
 */
export function createOddOneOutRounds(
  rng: Rng,
  words: readonly VocabularyItem[],
  categories: WorldCategories,
  rounds: number = PLAY_TUNING.oddRounds,
): OddRound[] {
  const groups = coherentGroups(words, categories);
  const groupWorlds = [...groups.entries()].filter(([, list]) => list.length >= 3);
  const result: OddRound[] = [];
  for (let i = 0; i < rounds * 3 && result.length < rounds && groupWorlds.length > 0; i += 1) {
    const [groupWorldId, list] = rng.pick(groupWorlds);
    const theme = categories[groupWorldId]?.theme;
    const oddPool = [...groups.entries()]
      .filter(([worldId]) => categories[worldId]?.theme !== theme)
      .flatMap(([, others]) => others);
    if (oddPool.length === 0) break;
    const group = rng.sample(list, 3);
    const used = new Set(group.flatMap((w) => [w.emoji, w.en.toLowerCase()]));
    const odd = rng.shuffle(oddPool).find((w) => !used.has(w.emoji) && !used.has(w.en.toLowerCase()));
    if (!odd) continue;
    result.push({
      groupWorldId,
      oddWorldId: odd.worldId,
      oddId: odd.id,
      optionIds: rng.shuffle([...group, odd]).map((w) => w.id),
    });
  }
  return result;
}

/** Enough met words in two different themes to make a fair round. */
export function canPlayOddOneOut(words: readonly VocabularyItem[], categories: WorldCategories): boolean {
  const groups = coherentGroups(words, categories);
  return [...groups.entries()].some(
    ([worldId, list]) =>
      list.length >= 3 &&
      [...groups.keys()].some((other) => categories[other]?.theme !== categories[worldId]?.theme),
  );
}
