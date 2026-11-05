import type { DayKey } from '@/domain/shared/day';

/**
 * Ports: the side effects the app needs, described as interfaces. The
 * infrastructure layer provides Expo implementations; tests and the web
 * preview can provide fakes. Nothing here talks to a network.
 */

/** Persists the single saved-game snapshot on the device. */
export interface GameRepository {
  load(): Promise<unknown>;
  save(snapshot: unknown): Promise<void>;
  clear(): Promise<void>;
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

export type SoundEffect = 'tap' | 'correct' | 'wrong' | 'coin' | 'level-up' | 'hatch' | 'pop';

export interface SoundEffectsService {
  play(effect: SoundEffect): void;
}

export type HapticKind = 'tap' | 'success' | 'warning';

export interface HapticsService {
  trigger(kind: HapticKind): void;
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
  readonly sfx: SoundEffectsService;
  readonly haptics: HapticsService;
  readonly clock: Clock;
}
