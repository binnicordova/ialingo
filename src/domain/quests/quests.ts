import type { DayKey } from '../shared/day';
import { createRng, hashSeed } from '../shared/rng';

/**
 * Daily quests: three small goals a day plus a chest. They are a gentle
 * reason to come back, never a punishment: unfinished quests simply expire at
 * night, there is no streak to lose, and the chest is a fixed reward (no
 * random loot).
 */
export type QuestKind = 'lessons' | 'perfect' | 'feed' | 'game' | 'practice' | 'listen';

export const QUEST_KINDS: readonly QuestKind[] = ['lessons', 'perfect', 'feed', 'game', 'practice', 'listen'];

export const QUEST_DEFINITIONS: Readonly<Record<QuestKind, { readonly target: number; readonly emoji: string }>> = {
  lessons: { target: 2, emoji: '📚' },
  perfect: { target: 1, emoji: '⭐' },
  feed: { target: 2, emoji: '🍓' },
  game: { target: 1, emoji: '🎡' },
  practice: { target: 1, emoji: '🏋️' },
  listen: { target: 1, emoji: '🎵' },
};

export const QUEST_TUNING = { perDay: 3, chestBerries: 15 } as const;

/** Quests every child can do from day one (the others need words learned first). */
export const BASE_QUEST_KINDS: readonly QuestKind[] = ['lessons', 'perfect', 'feed'];

export interface QuestBoard {
  readonly day: DayKey;
  readonly kinds: readonly QuestKind[];
  readonly progress: Readonly<Partial<Record<QuestKind, number>>>;
  readonly chestClaimed: boolean;
  /** Lifetime chests opened (for a badge). */
  readonly chestsOpened: number;
}

export function isQuestKind(value: unknown): value is QuestKind {
  return typeof value === 'string' && (QUEST_KINDS as readonly string[]).includes(value);
}

/**
 * The day's quests: always "finish lessons" (learning first), plus two
 * others picked deterministically from what the child can do today.
 */
export function createQuestBoard(day: DayKey, available: readonly QuestKind[], chestsOpened = 0): QuestBoard {
  const rng = createRng(hashSeed(`quests|${day}`));
  const others = rng.shuffle(available.filter((k) => k !== 'lessons')).slice(0, QUEST_TUNING.perDay - 1);
  return { day, kinds: ['lessons', ...others], progress: {}, chestClaimed: false, chestsOpened };
}

/** A new board on a new day (lifetime chest count is kept). */
export function rollQuestDay(board: QuestBoard, today: DayKey, available: readonly QuestKind[]): QuestBoard {
  return board.day === today ? board : createQuestBoard(today, available, board.chestsOpened);
}

export function questProgress(board: QuestBoard, kind: QuestKind): number {
  return Math.min(QUEST_DEFINITIONS[kind].target, board.progress[kind] ?? 0);
}

export function isQuestDone(board: QuestBoard, kind: QuestKind): boolean {
  return questProgress(board, kind) >= QUEST_DEFINITIONS[kind].target;
}

/** Adds progress to today's quest of that kind, if there is one. */
export function advanceQuest(board: QuestBoard, kind: QuestKind, amount = 1): QuestBoard {
  if (!board.kinds.includes(kind) || isQuestDone(board, kind) || amount <= 0) return board;
  const value = Math.min(QUEST_DEFINITIONS[kind].target, (board.progress[kind] ?? 0) + amount);
  return { ...board, progress: { ...board.progress, [kind]: value } };
}

export function allQuestsDone(board: QuestBoard): boolean {
  return board.kinds.length > 0 && board.kinds.every((k) => isQuestDone(board, k));
}

export function canClaimChest(board: QuestBoard): boolean {
  return allQuestsDone(board) && !board.chestClaimed;
}

export function claimChest(board: QuestBoard): QuestBoard {
  if (!canClaimChest(board)) return board;
  return { ...board, chestClaimed: true, chestsOpened: board.chestsOpened + 1 };
}
