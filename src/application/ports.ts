import type { DayKey } from '@/domain/shared/day';

/**
 * Ports: the side effects the app needs, described as interfaces. The
 * infrastructure layer provides Expo implementations; tests and the web
 * preview can provide fakes. Nothing here talks to a network.
 */

/** Persists one saved-game snapshot per child profile, plus the profile index, on the device. */
export interface GameRepository {
  load(profileId: string): Promise<unknown>;
  save(profileId: string, snapshot: unknown): Promise<void>;
  clear(profileId: string): Promise<void>;
  loadProfiles(): Promise<unknown>;
  saveProfiles(index: unknown): Promise<void>;
}

export interface SpeakOptions {
  /** BCP-47 language tag, for example 'en-US'. */
  readonly language: string;
  readonly pitch?: number;
  readonly rate?: number;
  readonly onDone?: () => void;
}

/** On-device text-to-speech. */
export interface SpeechService {
  speak(text: string, options: SpeakOptions): void;
  stop(): void;
}

export type SoundEffect =
  | 'tap'
  | 'correct'
  | 'wrong'
  | 'coin'
  | 'level-up'
  | 'hatch'
  | 'pop'
  | 'clap';

export interface SoundEffectsService {
  play(effect: SoundEffect): void;
}

export type HapticKind = 'tap' | 'success' | 'warning';

export interface HapticsService {
  trigger(kind: HapticKind): void;
}

/**
 * Android only: whether the on-device model for the target language is
 * installed. 'unsupported' means it cannot be checked (iOS, Android 12 and
 * below, or no Google on-device service), so nothing should be offered.
 */
export type OfflineModelStatus = 'installed' | 'missing' | 'unsupported';

/** Outcome of asking the OS to download the offline model (Android 13+). */
export type OfflineModelDownload = 'downloaded' | 'started' | 'failed' | 'unsupported';

/** What the device's speech recognizer can do (probed at startup and in the parent area). */
export interface RecognitionCapability {
  /** The native module exists (development or store build, not Expo Go or web). */
  readonly installed: boolean;
  /** A recognizer service is available on this device. */
  readonly available: boolean;
  /**
   * Recognition can run fully on the device (no audio leaves it) for the
   * target language. False on Android while the English model is missing.
   */
  readonly onDevice: boolean;
  readonly offlineModel: OfflineModelStatus;
}

export type RecognitionOutcome =
  | { readonly status: 'heard'; readonly alternatives: readonly string[] }
  | { readonly status: 'no-speech' }
  | { readonly status: 'denied' }
  | { readonly status: 'error'; readonly code: string };

export interface ListenOptions {
  /** BCP-47 tag of the language spoken, for example 'en-US'. */
  readonly language: string;
  readonly onDevice: boolean;
  readonly maxSeconds: number;
  /** Live transcript while the child speaks. */
  readonly onPartial?: (text: string) => void;
}

/** Speech recognition for speaking practice. Nothing is recorded or stored. */
export interface SpeechRecognitionService {
  /** `language` is the BCP-47 tag that will be recognized (for example 'en-US'). */
  capability(language: string): Promise<RecognitionCapability>;
  /** Asks the OS to download the on-device model (the OS does the download, not the app). */
  downloadOfflineModel(language: string): Promise<OfflineModelDownload>;
  requestPermission(): Promise<boolean>;
  listen(options: ListenOptions): Promise<RecognitionOutcome>;
  stop(): void;
}

/** Stores voice postcards in the app's private documents folder. */
export interface VoiceStore {
  /** Moves a finished recording into the diary; returns the stored file name. */
  keep(profileId: string, recordingUri: string, fileName: string): Promise<string | null>;
  uriFor(profileId: string, fileName: string): string | null;
  remove(profileId: string, fileNames: readonly string[]): Promise<void>;
  removeAll(profileId: string): Promise<void>;
}

export interface Clock {
  today(): DayKey;
  /** Monotonic-ish milliseconds, for durations only. */
  now(): number;
}

/** Everything the state layer needs from the outside world (dependency injection). */
export interface AppServices {
  readonly repository: GameRepository;
  readonly speech: SpeechService;
  readonly recognition: SpeechRecognitionService;
  readonly voiceStore: VoiceStore;
  readonly sfx: SoundEffectsService;
  readonly haptics: HapticsService;
  readonly clock: Clock;
}
