import { atom, type Getter, type Setter } from 'jotai';

import * as commands from '@/application/commands';
import type { CommandContext, CommandResult } from '@/application/commands';
import type { HapticKind, SoundEffect } from '@/application/ports';
import type { LessonId, SpeciesId } from '@/domain/curriculum/types';
import type { GameState, Settings } from '@/domain/game/game-state';
import type { WordResult } from '@/domain/learning/lesson-session';
import type { AccessoryId } from '@/domain/pets/pet';
import { SPEECH_LANGUAGE_TAG, TARGET_LANGUAGE_TAG, type Locale } from '@/domain/shared/locale';

import {
  contentAtom,
  gameStateAtom,
  pendingEventsAtom,
  servicesAtom,
  todayAtom,
} from './core';

/**
 * Action atoms (write-only). Each one runs a pure application command and
 * then stores the new state and queues the events for celebration.
 * Persistence happens in `persistence.ts`, which subscribes to gameStateAtom.
 */
function run(
  get: Getter,
  set: Setter,
  command: (state: GameState, ctx: CommandContext) => CommandResult,
): CommandResult {
  const ctx: CommandContext = { today: get(todayAtom), content: get(contentAtom) };
  const before = get(gameStateAtom);
  const result = command(before, ctx);
  if (result.state !== before) set(gameStateAtom, result.state);
  if (result.events.length > 0) set(pendingEventsAtom, (prev) => [...prev, ...result.events]);
  return result;
}

export const completeOnboardingAtom = atom(
  null,
  (get, set, input: { speciesId: SpeciesId; nickname: string; locale: Locale }) =>
    run(get, set, (s, c) => commands.completeOnboarding(s, input, c)),
);

export const finishLessonAtom = atom(
  null,
  (get, set, input: { lessonId: LessonId; accuracy: number; wordResults: readonly WordResult[] }) =>
    run(get, set, (s, c) => commands.finishLesson(s, input, c)),
);

export const feedPetAtom = atom(null, (get, set, speciesId: SpeciesId) =>
  run(get, set, (s, c) => commands.feedPet(s, { speciesId }, c)),
);

export const playWithPetAtom = atom(null, (get, set, speciesId: SpeciesId) =>
  run(get, set, (s, c) => commands.playWithPet(s, { speciesId }, c)),
);

export const hatchEggAtom = atom(
  null,
  (get, set, input: { speciesId: SpeciesId; nickname: string }) =>
    run(get, set, (s, c) => commands.hatchEgg(s, input, c)),
);

export const setActivePetAtom = atom(null, (get, set, speciesId: SpeciesId) =>
  run(get, set, (s) => commands.setActivePet(s, { speciesId })),
);

export const adoptPetAtom = atom(null, (get, set, speciesId: SpeciesId) =>
  run(get, set, (s, c) => commands.adoptPet(s, { speciesId }, c)),
);

export const buyAccessoryAtom = atom(null, (get, set, accessoryId: AccessoryId) =>
  run(get, set, (s, c) => commands.buyAccessory(s, { accessoryId }, c)),
);

export const equipAccessoryAtom = atom(
  null,
  (get, set, input: { speciesId: SpeciesId; accessoryId: AccessoryId | null }) =>
    run(get, set, (s) => commands.equipAccessory(s, input)),
);

export const claimDailyGiftAtom = atom(null, (get, set) =>
  run(get, set, (s, c) => commands.claimDailyGift(s, c)),
);

export const recordPlayTimeAtom = atom(null, (get, set, seconds: number) =>
  run(get, set, (s, c) => commands.recordPlayTime(s, { seconds }, c)),
);

export const grantExtraTimeAtom = atom(null, (get, set, minutes: number) =>
  run(get, set, (s, c) => commands.grantExtraTime(s, { minutes }, c)),
);

export const updateSettingsAtom = atom(null, (get, set, input: Partial<Settings>) =>
  run(get, set, (s) => commands.updateSettings(s, input)),
);

export const startDayAtom = atom(null, (get, set) => run(get, set, (s, c) => commands.startDay(s, c)));

export const resetGameAtom = atom(null, (get, set) => {
  get(servicesAtom).speech.stop();
  set(pendingEventsAtom, []);
  return run(get, set, (s, c) => commands.resetGame(s, c));
});

/** Removes the first pending event once the UI has celebrated it. */
export const consumeEventAtom = atom(null, (_get, set) => {
  set(pendingEventsAtom, (prev) => prev.slice(1));
});

/* ---------- Side-effect actions (respect the parent's settings) ---------- */

export interface SpeakRequest {
  readonly text: string;
  /** 'target' = English being learned; 'native' = the child's UI language. */
  readonly language: 'target' | 'native';
  readonly voice?: { readonly pitch: number; readonly rate: number };
  readonly onDone?: () => void;
}

/** Speaks text with the right language, character voice and speed setting. */
export const speakAtom = atom(null, (get, _set, request: SpeakRequest) => {
  const { settings } = get(gameStateAtom);
  const speedFactor = settings.voiceSpeed === 'slow' ? 0.7 : 0.92;
  get(servicesAtom).speech.speak(request.text, {
    language:
      request.language === 'target' ? TARGET_LANGUAGE_TAG : SPEECH_LANGUAGE_TAG[settings.uiLocale],
    pitch: request.voice?.pitch ?? 1,
    rate: (request.voice?.rate ?? 1) * speedFactor,
    onDone: request.onDone,
  });
});

export const stopSpeechAtom = atom(null, (get) => get(servicesAtom).speech.stop());

export const playSfxAtom = atom(null, (get, _set, effect: SoundEffect) => {
  if (get(gameStateAtom).settings.soundEffects) get(servicesAtom).sfx.play(effect);
});

export const hapticAtom = atom(null, (get, _set, kind: HapticKind) => {
  if (get(gameStateAtom).settings.haptics) get(servicesAtom).haptics.trigger(kind);
});

/** Common feedback combo for a button press. */
export const tapFeedbackAtom = atom(null, (_get, set) => {
  set(playSfxAtom, 'tap');
  set(hapticAtom, 'tap');
});
