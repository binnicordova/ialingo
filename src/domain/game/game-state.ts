import type { AchievementId } from '../achievements/achievement';
import { createWallet, type Wallet } from '../economy/economy';
import { createProgress, type LearnerProgress } from '../learning/progress';
import { createCollection, type PetCollection } from '../pets/collection';
import type { AccessoryId } from '../pets/pet';
import type { DayKey } from '../shared/day';
import type { Locale } from '../shared/locale';
import {
  createScreenTime,
  DEFAULT_DAILY_LIMIT_MINUTES,
  type ScreenTime,
} from '../wellbeing/screen-time';

export const CURRENT_SCHEMA_VERSION = 1;

export type VoiceSpeed = 'slow' | 'normal';

export interface Settings {
  readonly uiLocale: Locale;
  readonly voiceSpeed: VoiceSpeed;
  readonly soundEffects: boolean;
  readonly haptics: boolean;
  /** Minutes of play per day, or null for no limit. */
  readonly dailyLimitMinutes: number | null;
}

/**
 * The whole saved game: one snapshot, stored only on the device.
 * It contains no personal data: no name, birthday, email, voice or photos.
 */
export interface GameState {
  readonly schemaVersion: number;
  readonly createdOn: DayKey;
  readonly onboarded: boolean;
  readonly settings: Settings;
  readonly progress: LearnerProgress;
  readonly wallet: Wallet;
  readonly pets: PetCollection;
  readonly accessoriesOwned: readonly AccessoryId[];
  readonly achievements: readonly AchievementId[];
  readonly dailyGiftClaimedOn: DayKey | null;
  readonly screenTime: ScreenTime;
}

export function createDefaultSettings(locale: Locale): Settings {
  return {
    uiLocale: locale,
    voiceSpeed: 'normal',
    soundEffects: true,
    haptics: true,
    dailyLimitMinutes: DEFAULT_DAILY_LIMIT_MINUTES,
  };
}

export function createInitialGameState(today: DayKey, locale: Locale): GameState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdOn: today,
    onboarded: false,
    settings: createDefaultSettings(locale),
    progress: createProgress(),
    wallet: createWallet(0),
    pets: createCollection(),
    accessoriesOwned: [],
    achievements: [],
    dailyGiftClaimedOn: null,
    screenTime: createScreenTime(today),
  };
}
