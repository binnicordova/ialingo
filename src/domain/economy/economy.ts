import type { LessonKind } from '../curriculum/types';
import type { Stars } from '../learning/progress';

/**
 * Berries are the only currency. They are earned only by learning (or the
 * daily gift) and spent on pet food, accessories and leftover starter pets.
 * There are no real-money purchases and no random rewards (Pillar 4).
 *
 * Tuning rationale: a 3-star learn lesson pays 5 + 3×2 = 11 berries, so one
 * lesson buys about 10 snacks, and a mid-price accessory (30) takes about 3 lessons.
 */
export const ECONOMY_TUNING = {
  lessonBaseBerries: 5,
  berriesPerStar: 2,
  perfectBonusBerries: 3,
  bossBonusBerries: 10,
  reviewBonusBerries: 2,
  storyBonusBerries: 2,
  songBonusBerries: 2,
  speakBonusBerries: 3,
  practiceBonusBerries: 1,
  /** A jump challenge pays like a lesson; passing it adds this once per world. */
  jumpPassBonusBerries: 10,
  dailyGiftBerries: 10,
  welcomeBerries: 15,
  feedCost: 1,
  lessonBaseXp: 10,
  xpPerStar: 5,
  bossBonusXp: 15,
} as const;

export interface Wallet {
  readonly berries: number;
}

export function createWallet(initial = 0): Wallet {
  return { berries: Math.max(0, Math.floor(initial)) };
}

export function credit(wallet: Wallet, amount: number): Wallet {
  return { berries: wallet.berries + Math.max(0, Math.floor(amount)) };
}

export type DebitResult =
  | { readonly ok: true; readonly wallet: Wallet }
  | { readonly ok: false; readonly reason: 'insufficient-berries' };

export function debit(wallet: Wallet, amount: number): DebitResult {
  const cost = Math.max(0, Math.floor(amount));
  if (wallet.berries < cost) return { ok: false, reason: 'insufficient-berries' };
  return { ok: true, wallet: { berries: wallet.berries - cost } };
}

export interface LessonReward {
  readonly berries: number;
  readonly xp: number;
}

/** Rewards for a finished lesson. The XP multiplier comes from pet happiness. */
export function lessonReward(
  kind: LessonKind,
  stars: Stars,
  perfect: boolean,
  xpMultiplier = 1,
  tuning = ECONOMY_TUNING,
): LessonReward {
  const KIND_BONUS: Readonly<Record<LessonKind, number>> = {
    learn: 0,
    story: tuning.storyBonusBerries,
    song: tuning.songBonusBerries,
    speak: tuning.speakBonusBerries,
    practice: tuning.practiceBonusBerries,
    jump: 0,
    review: tuning.reviewBonusBerries,
    boss: tuning.bossBonusBerries,
  };
  const kindBonus = KIND_BONUS[kind];
  const berries =
    tuning.lessonBaseBerries +
    stars * tuning.berriesPerStar +
    (perfect ? tuning.perfectBonusBerries : 0) +
    kindBonus;
  const baseXp =
    tuning.lessonBaseXp + stars * tuning.xpPerStar + (kind === 'boss' ? tuning.bossBonusXp : 0);
  return { berries, xp: Math.round(baseXp * xpMultiplier) };
}
