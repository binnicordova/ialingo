import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import type {
  ListenOptions,
  RecognitionCapability,
  RecognitionOutcome,
  SpeechRecognitionService,
} from '@/application/ports';

/** The parts of expo-speech-recognition this adapter uses. */
interface RecognizerModule {
  start(options: Record<string, unknown>): void;
  stop(): void;
  abort(): void;
  requestPermissionsAsync(): Promise<{ granted: boolean }>;
  supportsOnDeviceRecognition(): boolean;
  isRecognitionAvailable(): boolean;
  addListener(event: string, listener: (payload: unknown) => void): { remove(): void };
}

const NATIVE_NAME = 'ExpoSpeechRecognition';

/**
 * The native module only exists in development and store builds. Expo Go
 * and web do not have it, and importing the package there would throw, so it
 * is required lazily after probing for the native side. In that case speaking
 * exercises fall back to self-check (no microphone).
 */
function loadRecognizer(): RecognizerModule | null {
  if (Platform.OS === 'web') return null;
  if (!requireOptionalNativeModule(NATIVE_NAME)) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy on purpose, see above
    const pkg = require('expo-speech-recognition') as { ExpoSpeechRecognitionModule: RecognizerModule };
    return pkg.ExpoSpeechRecognitionModule;
  } catch {
    return null;
  }
}

interface ResultPayload {
  readonly isFinal: boolean;
  readonly results: readonly { readonly transcript: string }[];
}

export function createExpoSpeechRecognitionService(): SpeechRecognitionService {
  let module: RecognizerModule | null | undefined;
  const get = () => {
    if (module === undefined) module = loadRecognizer();
    return module;
  };
  let active: (() => void) | null = null;

  return {
    async capability(): Promise<RecognitionCapability> {
      const recognizer = get();
      if (!recognizer) return { installed: false, available: false, onDevice: false };
      try {
        return {
          installed: true,
          available: recognizer.isRecognitionAvailable(),
          onDevice: recognizer.supportsOnDeviceRecognition(),
        };
      } catch {
        return { installed: true, available: false, onDevice: false };
      }
    },

    async requestPermission() {
      const recognizer = get();
      if (!recognizer) return false;
      try {
        return (await recognizer.requestPermissionsAsync()).granted;
      } catch {
        return false;
      }
    },

    listen(options: ListenOptions): Promise<RecognitionOutcome> {
      const recognizer = get();
      if (!recognizer) return Promise.resolve({ status: 'error', code: 'unavailable' });
      active?.();
      return new Promise((resolve) => {
        let alternatives: string[] = [];
        let settled = false;
        const subscriptions: { remove(): void }[] = [];
        const finish = (outcome: RecognitionOutcome) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          subscriptions.forEach((s) => s.remove());
          active = null;
          resolve(outcome);
        };
        const heardOrSilence = (): RecognitionOutcome =>
          alternatives.length > 0 ? { status: 'heard', alternatives } : { status: 'no-speech' };

        subscriptions.push(
          recognizer.addListener('result', (payload) => {
            const event = payload as ResultPayload;
            alternatives = event.results.map((r) => r.transcript).filter(Boolean);
            options.onPartial?.(alternatives[0] ?? '');
            if (event.isFinal) finish(heardOrSilence());
          }),
          recognizer.addListener('error', (payload) => {
            const code = (payload as { error?: string }).error ?? 'unknown';
            if (code === 'no-speech' || code === 'speech-timeout') finish(heardOrSilence());
            else if (code === 'not-allowed') finish({ status: 'denied' });
            else finish({ status: 'error', code });
          }),
          recognizer.addListener('end', () => finish(heardOrSilence())),
        );

        const timer = setTimeout(() => recognizer.stop(), options.maxSeconds * 1000);
        active = () => {
          recognizer.abort();
          finish({ status: 'error', code: 'aborted' });
        };

        try {
          recognizer.start({
            lang: options.language,
            interimResults: true,
            maxAlternatives: 5,
            continuous: false,
            requiresOnDeviceRecognition: options.onDevice,
            addsPunctuation: false,
            // No contextualStrings: biasing toward the target word would hide
            // the child's real pronunciation (error-preserving scoring).
            iosTaskHint: 'confirmation',
            iosCategory: {
              category: 'playAndRecord',
              categoryOptions: ['defaultToSpeaker', 'allowBluetooth'],
              mode: 'default',
            },
            androidIntentOptions: {
              EXTRA_LANGUAGE_MODEL: 'web_search',
              EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 1200,
            },
          });
        } catch {
          finish({ status: 'error', code: 'start-failed' });
        }
      });
    },

    stop() {
      active?.();
    },
  };
}
