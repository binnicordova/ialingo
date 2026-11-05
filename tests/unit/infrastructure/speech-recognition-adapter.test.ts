/**
 * The recognizer adapter, against a fake native module: proves the event
 * wiring (final result, silence, permission denied, timeout) without a device.
 */
type Listener = (payload: unknown) => void;

const mockListeners = new Map<string, Set<Listener>>();
const mockModule = {
  started: [] as Record<string, unknown>[],
  stopped: 0,
  aborted: 0,
  start(options: Record<string, unknown>) {
    this.started.push(options);
  },
  stop() {
    this.stopped += 1;
    mockEmit('end', null);
  },
  abort() {
    this.aborted += 1;
  },
  requestPermissionsAsync: async () => ({ granted: true }),
  supportsOnDeviceRecognition: () => true,
  isRecognitionAvailable: () => true,
  addListener(event: string, listener: Listener) {
    const set = mockListeners.get(event) ?? new Set<Listener>();
    set.add(listener);
    mockListeners.set(event, set);
    return { remove: () => set.delete(listener) };
  },
};

function mockEmit(event: string, payload: unknown) {
  for (const listener of [...(mockListeners.get(event) ?? [])]) listener(payload);
}

let mockNativePresent = true;
jest.mock('expo', () => ({ requireOptionalNativeModule: () => (mockNativePresent ? {} : null) }));
jest.mock('expo-speech-recognition', () => ({ ExpoSpeechRecognitionModule: mockModule }), { virtual: false });

// Imported after the mocks.
import { createExpoSpeechRecognitionService } from '@/infrastructure/speech/expo-speech-recognition-service';

const options = { language: 'en-US', onDevice: true, maxSeconds: 5 };

beforeEach(() => {
  mockListeners.clear();
  mockModule.started = [];
  mockModule.stopped = 0;
  mockModule.aborted = 0;
  mockNativePresent = true;
});

describe('expo speech recognition adapter', () => {
  it('reports capability from the native module', async () => {
    const service = createExpoSpeechRecognitionService();
    await expect(service.capability()).resolves.toEqual({ installed: true, available: true, onDevice: true });
  });

  it('is unavailable when the native module is missing (Expo Go)', async () => {
    mockNativePresent = false;
    const service = createExpoSpeechRecognitionService();
    await expect(service.capability()).resolves.toEqual({ installed: false, available: false, onDevice: false });
    await expect(service.listen(options)).resolves.toEqual({ status: 'error', code: 'unavailable' });
  });

  it('resolves with all alternatives on a final result, on-device and unbiased', async () => {
    const service = createExpoSpeechRecognitionService();
    const partials: string[] = [];
    const pending = service.listen({ ...options, onPartial: (t) => partials.push(t) });
    mockEmit('result', { isFinal: false, results: [{ transcript: 'do' }] });
    mockEmit('result', { isFinal: true, results: [{ transcript: 'dog' }, { transcript: 'dock' }] });
    await expect(pending).resolves.toEqual({ status: 'heard', alternatives: ['dog', 'dock'] });
    expect(partials).toEqual(['do', 'dog']);
    expect(mockModule.started[0]).toMatchObject({ requiresOnDeviceRecognition: true, lang: 'en-US' });
    expect(mockModule.started[0]).not.toHaveProperty('contextualStrings');
  });

  it('maps silence and permission errors', async () => {
    const service = createExpoSpeechRecognitionService();
    const silent = service.listen(options);
    mockEmit('error', { error: 'no-speech' });
    await expect(silent).resolves.toEqual({ status: 'no-speech' });

    const denied = service.listen(options);
    mockEmit('error', { error: 'not-allowed' });
    await expect(denied).resolves.toEqual({ status: 'denied' });
  });

  it('stops listening after the time limit', async () => {
    jest.useFakeTimers();
    const service = createExpoSpeechRecognitionService();
    const pending = service.listen({ ...options, maxSeconds: 2 });
    jest.advanceTimersByTime(2000);
    await expect(pending).resolves.toEqual({ status: 'no-speech' });
    expect(mockModule.stopped).toBe(1);
    jest.useRealTimers();
  });
});
