import type { VocabularyItem, WordId, World } from '../curriculum/types';
import { isLearned, isMastered, type WordMastery } from './mastery';

/**
 * The sticker album: every word is a sticker. Meeting a word in a lesson
 * collects it, learning it makes it shine, and mastering it turns it gold.
 * It turns the spaced-repetition data into something a child can see.
 */
export type StickerState = 'locked' | 'met' | 'learned' | 'gold';

export interface Sticker {
  readonly word: VocabularyItem;
  readonly state: StickerState;
}

export interface AlbumPage {
  readonly world: World;
  readonly stickers: readonly Sticker[];
  /** Stickers that are not locked. */
  readonly collected: number;
  readonly gold: number;
}

export function stickerState(mastery: WordMastery | undefined): StickerState {
  if (!mastery) return 'locked';
  if (isMastered(mastery)) return 'gold';
  if (isLearned(mastery)) return 'learned';
  return 'met';
}

export function albumPage(world: World, mastery: Readonly<Record<WordId, WordMastery>>): AlbumPage {
  const stickers = world.words.map((word) => ({ word, state: stickerState(mastery[word.id]) }));
  return {
    world,
    stickers,
    collected: stickers.filter((s) => s.state !== 'locked').length,
    gold: stickers.filter((s) => s.state === 'gold').length,
  };
}

export function albumTotals(pages: readonly AlbumPage[]): { collected: number; gold: number; total: number } {
  return pages.reduce(
    (acc, page) => ({
      collected: acc.collected + page.collected,
      gold: acc.gold + page.gold,
      total: acc.total + page.stickers.length,
    }),
    { collected: 0, gold: 0, total: 0 },
  );
}
