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
  installed: ['en-US'] as string[],
  locales: ['en-US', 'es-ES'] as string[],
  downloadStatus: 'download_scheduled' as string | Error,
  downloads: [] as string[],
  async getSupportedLocales(_options: { androidRecognitionServicePackage?: string }) {
    return { locales: this.locales, installedLocales: this.installed };
  },
  async androidTriggerOfflineModelDownload({ locale }: { locale: string }) {
    this.downloads.push(locale);
    if (this.downloadStatus instanceof Error) throw this.downloadStatus;
    return { status: this.downloadStatus, message: '' };
  },
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
  mockModule.installed = ['en-US'];
  mockModule.locales = ['en-US', 'es-ES'];
  mockModule.downloadStatus = 'download_scheduled';
  mockModule.downloads = [];
  mockNativePresent = true;
});

describe('expo speech recognition adapter', () => {
  it('reports capability from the native module', async () => {
    const service = createExpoSpeechRecognitionService();
    await expect(service.capability('en-US')).resolves.toEqual({
      installed: true,
      available: true,
      onDevice: true,
      offlineModel: 'unsupported',
    });
  });

  it('is unavailable when the native module is missing (Expo Go)', async () => {
    mockNativePresent = false;
    const service = createExpoSpeechRecognitionService();
    await expect(service.capability('en-US')).resolves.toEqual({
      installed: false,
      available: false,
      onDevice: false,
      offlineModel: 'unsupported',
    });
    await expect(service.downloadOfflineModel('en-US')).resolves.toBe('unsupported');
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

  describe('Android offline English model', () => {
    const android = () => createExpoSpeechRecognitionService({ platform: 'android' });

    it('reports an installed model and keeps on-device recognition', async () => {
      await expect(android().capability('en-US')).resolves.toMatchObject({ onDevice: true, offlineModel: 'installed' });
      mockModule.installed = ['en_us'];
      await expect(android().capability('en-US')).resolves.toMatchObject({ offlineModel: 'installed' });
    });

    it('turns on-device off while the English model is missing', async () => {
      mockModule.installed = ['es-ES'];
      await expect(android().capability('en-US')).resolves.toMatchObject({ onDevice: false, offlineModel: 'missing' });
    });

    it('cannot tell on Android 12 and below (no locales reported)', async () => {
      mockModule.installed = [];
      mockModule.locales = [];
      await expect(android().capability('en-US')).resolves.toMatchObject({ onDevice: true, offlineModel: 'unsupported' });
    });

    it('asks the OS to download the model and maps the result', async () => {
      await expect(android().downloadOfflineModel('en-US')).resolves.toBe('started');
      mockModule.downloadStatus = 'download_success';
      await expect(android().downloadOfflineModel('en-US')).resolves.toBe('downloaded');
      mockModule.downloadStatus = new Error('not supported');
      await expect(android().downloadOfflineModel('en-US')).resolves.toBe('failed');
      expect(mockModule.downloads).toEqual(['en-US', 'en-US', 'en-US']);
      // Never on iOS.
      await expect(createExpoSpeechRecognitionService({ platform: 'ios' }).downloadOfflineModel('en-US')).resolves.toBe('unsupported');
    });
  });
});
