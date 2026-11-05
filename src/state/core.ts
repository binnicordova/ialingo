import { atom } from 'jotai';

import type { GameEvent } from '@/application/events';
import { createNoopServices } from '@/application/noop-services';
import type { AppServices } from '@/application/ports';
import type { CatalogIndex } from '@/domain/game/catalog';
import { createInitialGameState, type GameState } from '@/domain/game/game-state';
import { getContentIndex } from '@/infrastructure/content/catalog';

/**
 * Root atoms. The whole saved game is one immutable value, changed only by
 * the action atoms in `actions.ts` (which call the pure application commands).
 * Small derived atoms in `selectors.ts` let each screen subscribe only to the
 * slice it renders.
 */

/** Injected services (dependency injection; swapped for fakes in tests). */
export const servicesAtom = atom<AppServices>(createNoopServices());

/** Read-only content indexes (overridable in tests). */
export const contentAtom = atom<CatalogIndex>(getContentIndex());

/** The saved game. */
export const gameStateAtom = atom<GameState>(createInitialGameState('2000-01-01', 'es'));

/** True once the saved game has been loaded from storage. */
export const hydratedAtom = atom(false);

/**
 * Bumped when the app returns to the foreground, so `todayAtom` recomputes
 * (the date may have changed while the app was in the background).
 */
export const clockTickAtom = atom(0);

export const todayAtom = atom((get) => {
  get(clockTickAtom);
  return get(servicesAtom).clock.today();
});

/** Events waiting to be celebrated by the UI (level-ups, eggs, badges). */
export const pendingEventsAtom = atom<readonly GameEvent[]>([]);
