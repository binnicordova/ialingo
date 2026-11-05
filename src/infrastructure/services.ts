import type { AppServices } from '@/application/ports';

import { createExpoSfxService } from './audio/expo-sfx-service';
import { systemClock } from './device/device';
import { createExpoHapticsService } from './haptics/expo-haptics-service';
import { createExpoSpeechService } from './speech/expo-speech-service';
import { createAsyncStorageRepository } from './storage/async-storage-repository';

/** Composition root: wires the real Expo adapters into the app's ports. */
export function createAppServices(): AppServices {
  return {
    repository: createAsyncStorageRepository(),
    speech: createExpoSpeechService(),
    sfx: createExpoSfxService(),
    haptics: createExpoHapticsService(),
    clock: systemClock,
  };
}
