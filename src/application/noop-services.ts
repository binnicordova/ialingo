import { toDayKey } from '@/domain/shared/day';

import type { AppServices } from './ports';

/** In-memory services: the default before boot, and a test double. */
export function createNoopServices(
  today?: string,
  options: { recognizer?: (text: string) => readonly string[] } = {},
): AppServices {
  const saves = new Map<string, unknown>();
  let profiles: unknown = null;
  const voices = new Map<string, Set<string>>();
  return {
    repository: {
      load: async (profileId) => saves.get(profileId) ?? null,
      save: async (profileId, snapshot) => {
        saves.set(profileId, snapshot);
      },
      clear: async (profileId) => {
        saves.delete(profileId);
      },
      loadProfiles: async () => profiles,
      saveProfiles: async (index) => {
        profiles = index;
      },
    },
    speech: { speak: (_text, opts) => opts.onDone?.(), stop: () => undefined },
    recognition: {
      capability: async () => ({
        installed: options.recognizer !== undefined,
        available: options.recognizer !== undefined,
        onDevice: options.recognizer !== undefined,
      }),
      requestPermission: async () => options.recognizer !== undefined,
      listen: async () =>
        options.recognizer
          ? { status: 'heard', alternatives: options.recognizer('') }
          : { status: 'error', code: 'unavailable' },
      stop: () => undefined,
    },
    voiceStore: {
      keep: async (profileId, _uri, fileName) => {
        const set = voices.get(profileId) ?? new Set<string>();
        set.add(fileName);
        voices.set(profileId, set);
        return fileName;
      },
      uriFor: (profileId, fileName) => (voices.get(profileId)?.has(fileName) ? `memory://${profileId}/${fileName}` : null),
      remove: async (profileId, fileNames) => {
        for (const name of fileNames) voices.get(profileId)?.delete(name);
      },
      removeAll: async (profileId) => {
        voices.delete(profileId);
      },
    },
    sfx: { play: () => undefined },
    haptics: { trigger: () => undefined },
    clock: { today: () => today ?? toDayKey(new Date()), now: () => Date.now() },
  };
}
