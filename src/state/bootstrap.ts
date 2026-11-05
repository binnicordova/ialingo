import { createStore } from 'jotai';

import type { AppServices } from '@/application/ports';
import { createInitialGameState } from '@/domain/game/game-state';
import { restoreGameState } from '@/domain/game/snapshot';
import { createProfileIndex, restoreProfileIndex } from '@/domain/profiles/profiles';
import { TARGET_LANGUAGE_TAG, type Locale } from '@/domain/shared/locale';

import { startDayAtom } from './actions';
import {
  activeProfileIdAtom,
  flushSaveAtom,
  gameStateAtom,
  hydratedAtom,
  profileChosenAtom,
  profileIndexAtom,
  recognitionAtom,
  servicesAtom,
  storedProfileSummariesAtom,
  type ProfileSummary,
} from './core';
import { summarizeProfile } from './profiles';

export type AppStore = ReturnType<typeof createStore>;

/** Debounce for saves: many quick taps produce one write. */
export const SAVE_DEBOUNCE_MS = 400;

export interface Autosave {
  /** Writes any pending change right away (for example when the app goes to the background). */
  flush(): Promise<void>;
  /** Flushes, then stops listening. */
  stop(): Promise<void>;
}

/**
 * Injects services, loads the profile index and the active child's saved
 * game, probes the speech recognizer, and starts autosaving.
 */
export async function bootstrapStore(
  store: AppStore,
  services: AppServices,
  deviceLocale: Locale,
): Promise<Autosave> {
  store.set(servicesAtom, services);
  const today = services.clock.today();
  const index = restoreProfileIndex(await services.repository.loadProfiles()) ?? createProfileIndex();
  store.set(profileIndexAtom, index);

  const summaries: Record<string, ProfileSummary> = {};
  for (const id of index.ids) {
    const restored = restoreGameState(await services.repository.load(id), today, deviceLocale);
    if (id === index.activeId) {
      store.set(gameStateAtom, restored ?? createInitialGameState(today, deviceLocale));
    } else {
      summaries[id] = summarizeProfile(id, restored);
    }
  }
  store.set(storedProfileSummariesAtom, summaries);
  // With a single child there is nobody to choose between.
  store.set(profileChosenAtom, index.ids.length <= 1);
  store.set(startDayAtom);
  store.set(hydratedAtom, true);
  await services.repository.saveProfiles(index);

  services.recognition
    .capability(TARGET_LANGUAGE_TAG)
    .then((capability) => store.set(recognitionAtom, { ...capability, permission: 'unknown' }))
    .catch(() => undefined);

  const autosave = startAutosave(store, services);
  store.set(flushSaveAtom, { flush: autosave.flush });
  return autosave;
}

export function startAutosave(store: AppStore, services: AppServices): Autosave {
  let timer: ReturnType<typeof setTimeout> | null = null;
  /** Profile the pending change belongs to (captured when the change happens). */
  let pendingProfile: string | null = null;

  const flush = async () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (!pendingProfile) return;
    const profileId = pendingProfile;
    pendingProfile = null;
    try {
      await services.repository.save(profileId, store.get(gameStateAtom));
    } catch {
      // Storage full or unavailable: keep playing, and retry on the next change.
      pendingProfile = profileId;
    }
  };

  const unsubscribe = store.sub(gameStateAtom, () => {
    const profileId = store.get(activeProfileIdAtom);
    if (pendingProfile && pendingProfile !== profileId) {
      // Never write one child's state under another child's key.
      pendingProfile = null;
    }
    pendingProfile = profileId;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS);
  });

  return {
    flush,
    stop: async () => {
      unsubscribe();
      await flush();
    },
  };
}
