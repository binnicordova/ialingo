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

/**
 * How speaking exercises work: 'recognition' listens with the device's speech
 * recognizer (development and store builds); 'self-check' never opens the
 * microphone (the child says it aloud and taps "I said it").
 */
export type SpeakingMode = 'recognition' | 'self-check';

export interface Settings {
  readonly uiLocale: Locale;
  readonly voiceSpeed: VoiceSpeed;
  readonly soundEffects: boolean;
  readonly haptics: boolean;
  /** Minutes of play per day, or null for no limit. */
  readonly dailyLimitMinutes: number | null;
  readonly speaking: SpeakingMode;
  /**
   * Parent consent to use the OS vendor's online recognizer when on-device
   * recognition is not available. Off by default (privacy by design).
   */
  readonly allowOnlineRecognition: boolean;
  /** Parent opt-in: keep short voice postcards on this device. */
  readonly voiceDiary: boolean;
  /** Calmer animations for children sensitive to motion. */
  readonly reducedMotion: boolean;
}

/** A voice postcard saved on the device (only when the parent turned it on). */
export interface VoiceDiaryEntry {
  readonly id: string;
  readonly day: DayKey;
  readonly fileName: string;
  /** English sentence the child said. */
  readonly prompt: string;
  readonly durationMs: number;
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
  readonly voiceDiary: readonly VoiceDiaryEntry[];
}

export function createDefaultSettings(locale: Locale): Settings {
  return {
    uiLocale: locale,
    voiceSpeed: 'normal',
    soundEffects: true,
    haptics: true,
    dailyLimitMinutes: DEFAULT_DAILY_LIMIT_MINUTES,
    speaking: 'recognition',
    allowOnlineRecognition: false,
    voiceDiary: false,
    reducedMotion: false,
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
    voiceDiary: [],
  };
}
