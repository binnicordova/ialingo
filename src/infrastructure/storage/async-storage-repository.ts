import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GameRepository } from '@/application/ports';

/** Key of the one and only stored item. Everything stays on the device. */
export const SAVE_KEY = 'ialingo.save.v1';

/**
 * Saves the game as a single JSON document in AsyncStorage (device-local,
 * sandboxed per app; localStorage on web). It is never synced or uploaded.
 */
export function createAsyncStorageRepository(storageKey = SAVE_KEY): GameRepository {
  return {
    async load() {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        return raw ? (JSON.parse(raw) as unknown) : null;
      } catch {
        // A corrupt save must never block the app: start fresh instead.
        return null;
      }
    },
    async save(snapshot) {
      await AsyncStorage.setItem(storageKey, JSON.stringify(snapshot));
    },
    async clear() {
      await AsyncStorage.removeItem(storageKey);
    },
  };
}
