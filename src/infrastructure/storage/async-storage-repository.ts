import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GameRepository } from '@/application/ports';
import { FIRST_PROFILE_ID } from '@/domain/profiles/profiles';

/** v1.0 key. The first profile keeps it, so existing progress carries over. */
export const SAVE_KEY = 'ialingo.save.v1';
export const PROFILES_KEY = 'ialingo.profiles.v1';

export function saveKeyFor(profileId: string): string {
  return profileId === FIRST_PROFILE_ID ? SAVE_KEY : `${SAVE_KEY}.${profileId}`;
}

async function readJson(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    // A corrupt save must never block the app: start fresh instead.
    return null;
  }
}

/**
 * One JSON document per child profile in AsyncStorage (device-local,
 * sandboxed per app; localStorage on web). Nothing is synced or uploaded.
 */
export function createAsyncStorageRepository(): GameRepository {
  return {
    load: (profileId) => readJson(saveKeyFor(profileId)),
    async save(profileId, snapshot) {
      await AsyncStorage.setItem(saveKeyFor(profileId), JSON.stringify(snapshot));
    },
    async clear(profileId) {
      await AsyncStorage.removeItem(saveKeyFor(profileId));
    },
    loadProfiles: () => readJson(PROFILES_KEY),
    async saveProfiles(index) {
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(index));
    },
  };
}
