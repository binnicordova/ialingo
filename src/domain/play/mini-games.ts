import type { VocabularyItem, WordId } from '../curriculum/types';
import type { WordMastery } from '../learning/mastery';
import type { DayKey } from '../shared/day';
import type { Rng } from '../shared/rng';

/**
 * Play Park: short arcade games over words the child already met. They are
 * low-stakes retrieval practice, so they never change spaced-repetition
 * boxes, and their berries are capped per day so lessons stay the main path.
 */
export type MiniGameKind = 'bubble-pop' | 'memory-match';

export const MINI_GAME_KINDS: readonly MiniGameKind[] = ['bubble-pop', 'memory-match'];

export const PLAY_TUNING = {
  /** Words a child must have met before the Play Park opens. */
  minWords: 6,
  berriesPerCorrect: 1,
  /** Game berries per day (a 3-star lesson pays about 11). */
  dailyBerryCap: 20,
  bubbleRounds: 8,
  bubbleOptions: 4,
  memoryPairs: 6,
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
