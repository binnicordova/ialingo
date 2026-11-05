import { createStore } from 'jotai';

import type { AppServices } from '@/application/ports';
import { createInitialGameState } from '@/domain/game/game-state';
import { restoreGameState } from '@/domain/game/snapshot';
import type { Locale } from '@/domain/shared/locale';

import { startDayAtom } from './actions';
import { gameStateAtom, hydratedAtom, servicesAtom } from './core';

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
 * Injects services, loads the saved game into the store and starts the
 * autosave subscription.
 */
export async function bootstrapStore(
  store: AppStore,
  services: AppServices,
  deviceLocale: Locale,
): Promise<Autosave> {
  store.set(servicesAtom, services);
  const today = services.clock.today();
  const raw = await services.repository.load();
  const restored = restoreGameState(raw, today, deviceLocale);
  store.set(gameStateAtom, restored ?? createInitialGameState(today, deviceLocale));
  store.set(startDayAtom);
  store.set(hydratedAtom, true);
  return startAutosave(store, services);
}

export function startAutosave(store: AppStore, services: AppServices): Autosave {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending = false;

  const flush = async () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (!pending) return;
    pending = false;
    try {
      await services.repository.save(store.get(gameStateAtom));
    } catch {
      // Storage full or unavailable: keep playing, and retry on the next change.
      pending = true;
    }
  };

  const unsubscribe = store.sub(gameStateAtom, () => {
    pending = true;
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
