import * as Speech from 'expo-speech';

import type { SpeechService } from '@/application/ports';

/**
 * Text-to-speech through the operating system's speech engine (expo-speech).
 * No audio is recorded, and nothing is sent anywhere by the app.
 */
export function createExpoSpeechService(): SpeechService {
  return {
    speak(text, options) {
      try {
        // Stop whatever is playing so taps feel instant instead of queueing.
        void Speech.stop();
        Speech.speak(text, {
          language: options.language,
          pitch: options.pitch ?? 1,
          rate: options.rate ?? 1,
          onDone: options.onDone,
          onStopped: options.onDone,
          onError: options.onDone ? () => options.onDone?.() : undefined,
        });
      } catch {
        options.onDone?.();
      }
    },
    stop() {
      void Speech.stop();
    },
  };
}
