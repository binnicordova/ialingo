import { atom, type Getter, type Setter } from 'jotai';

import * as commands from '@/application/commands';
import type { CommandContext, CommandResult } from '@/application/commands';
import type { HapticKind, RecognitionOutcome, SoundEffect } from '@/application/ports';
import type { LessonId, SpeciesId, WorldId } from '@/domain/curriculum/types';
import type { GameState, Settings } from '@/domain/game/game-state';
import { VOICE_DIARY_TUNING } from '@/domain/voice/voice-diary';
import type { WordResult } from '@/domain/learning/lesson-session';
import type { AccessoryId } from '@/domain/pets/pet';
import type { MiniGameKind } from '@/domain/play/mini-games';
import { SPEECH_LANGUAGE_TAG, TARGET_LANGUAGE_TAG, type Locale } from '@/domain/shared/locale';

import {
  activeProfileIdAtom,
  contentAtom,
  gameStateAtom,
  pendingEventsAtom,
  recognitionAtom,
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
  // Every command's events also move today's quests forward.
  const result = commands.trackQuests(command(before, ctx), ctx);
  if (result.state !== before) set(gameStateAtom, result.state);
  if (result.events.length > 0) set(pendingEventsAtom, (prev) => [...prev, ...result.events]);
  // Side effect requested by the domain: delete recordings from disk.
  for (const event of result.events) {
    if (event.type === 'voice-files-removed' && event.fileNames.length > 0) {
      void get(servicesAtom).voiceStore.remove(get(activeProfileIdAtom), event.fileNames);
    }
  }
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

export const finishJumpChallengeAtom = atom(
  null,
  (get, set, input: { targetWorldId: WorldId; accuracy: number; wordResults: readonly WordResult[] }) =>
    run(get, set, (s, c) => commands.finishJumpChallenge(s, input, c)),
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

export const finishMiniGameAtom = atom(
  null,
  (get, set, input: { kind: MiniGameKind; correct: number; total: number }) =>
    run(get, set, (s, c) => commands.finishMiniGame(s, input, c)),
);

export const claimQuestChestAtom = atom(null, (get, set) =>
  run(get, set, (s, c) => commands.claimQuestChest(s, c)),
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
  /** The "turtle" replay: noticeably slower than the child's usual speed. */
  readonly slow?: boolean;
  readonly onDone?: () => void;
}

/** Rate factor of the slow replay (on top of the parent's voice speed). */
export const SLOW_REPLAY_RATE = 0.62;

/** Speaks text with the right language, character voice and speed setting. */
export const speakAtom = atom(null, (get, _set, request: SpeakRequest) => {
  const { settings } = get(gameStateAtom);
  const speedFactor = settings.voiceSpeed === 'slow' ? 0.7 : 0.92;
  get(servicesAtom).speech.speak(request.text, {
    language:
      request.language === 'target' ? TARGET_LANGUAGE_TAG : SPEECH_LANGUAGE_TAG[settings.uiLocale],
    pitch: request.voice?.pitch ?? 1,
    rate: (request.voice?.rate ?? 1) * speedFactor * (request.slow ? SLOW_REPLAY_RATE : 1),
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

/* ---------------------------------------------------------- Speaking */

/** Probes the recognizer again (for example after the offline model downloads). */
export const refreshRecognitionAtom = atom(null, async (get, set) => {
  try {
    const capability = await get(servicesAtom).recognition.capability(TARGET_LANGUAGE_TAG);
    set(recognitionAtom, (prev) => ({ ...capability, permission: prev.permission }));
  } catch {
    // Keep what we knew.
  }
});

/** Parent area, Android: asks the OS to download the offline English model. */
export const downloadOfflineModelAtom = atom(null, async (get, set) => {
  const result = await get(servicesAtom).recognition.downloadOfflineModel(TARGET_LANGUAGE_TAG);
  if (result === 'downloaded' || result === 'started') await set(refreshRecognitionAtom);
  return result;
});

/** Asks the OS for microphone + speech permission (shown to a grown-up first). */
export const requestMicPermissionAtom = atom(null, async (get, set) => {
  const granted = await get(servicesAtom).recognition.requestPermission();
  set(recognitionAtom, (prev) => ({ ...prev, permission: granted ? 'granted' : 'denied' }));
  return granted;
});

/** Listens once for English speech, on the device when possible. */
export const listenAtom = atom(
  null,
  async (get, set, input: { onPartial?: (text: string) => void }): Promise<RecognitionOutcome> => {
    get(servicesAtom).speech.stop();
    const capability = get(recognitionAtom);
    const outcome = await get(servicesAtom).recognition.listen({
      language: TARGET_LANGUAGE_TAG,
      onDevice: capability.onDevice,
      maxSeconds: 6,
      onPartial: input.onPartial,
    });
    if (outcome.status === 'denied') set(recognitionAtom, (prev) => ({ ...prev, permission: 'denied' }));
    return outcome;
  },
);

export const stopListeningAtom = atom(null, (get) => get(servicesAtom).recognition.stop());

/* --------------------------------------------------------- Voice diary */

/** Keeps a finished recording as this week's postcard (parent opt-in only). */
export const savePostcardAtom = atom(
  null,
  async (get, set, input: { recordingUri: string; durationMs: number; prompt: string }) => {
    const state = get(gameStateAtom);
    if (!state.settings.voiceDiary) return false;
    const services = get(servicesAtom);
    const today = get(todayAtom);
    const id = `${today}-${services.clock.now().toString(36)}`;
    const fileName = `${id}.m4a`;
    const stored = await services.voiceStore.keep(get(activeProfileIdAtom), input.recordingUri, fileName);
    if (!stored) return false;
    run(get, set, (s) =>
      commands.addVoicePostcard(s, {
        entry: {
          id,
          day: today,
          fileName: stored,
          prompt: input.prompt,
          durationMs: Math.min(input.durationMs, VOICE_DIARY_TUNING.maxSeconds * 1000),
        },
      }),
    );
    return true;
  },
);

export const deletePostcardAtom = atom(null, (get, set, id: string) =>
  run(get, set, (s) => commands.deleteVoicePostcard(s, { id })),
);
