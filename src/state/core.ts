import { atom } from 'jotai';

import type { GameEvent } from '@/application/events';
import { createNoopServices } from '@/application/noop-services';
import type { AppServices, RecognitionCapability } from '@/application/ports';
import type { CatalogIndex } from '@/domain/game/catalog';
import { createInitialGameState, type GameState } from '@/domain/game/game-state';
import { createProfileIndex, type ProfileId, type ProfileIndex } from '@/domain/profiles/profiles';
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

/* ------------------------------------------------------------ Profiles */

export const profileIndexAtom = atom<ProfileIndex>(createProfileIndex());
export const activeProfileIdAtom = atom((get) => get(profileIndexAtom).activeId);

/** What the "Who's playing?" picker shows for each child (pet, not a name). */
export interface ProfileSummary {
  readonly id: ProfileId;
  readonly onboarded: boolean;
  readonly petSpeciesId: string | null;
  readonly petNickname: string | null;
  readonly petXp: number;
  readonly lessonsCompleted: number;
}

/** Summaries of the non-active profiles (the active one is derived live). */
export const storedProfileSummariesAtom = atom<Readonly<Record<ProfileId, ProfileSummary>>>({});

/** True once the child picked who is playing in this session (or there is one profile). */
export const profileChosenAtom = atom(false);

/** Flushes the pending autosave; set at boot (used before switching profiles). */
export const flushSaveAtom = atom<{ flush: () => Promise<void> }>({ flush: async () => undefined });

/* -------------------------------------------------------------- Speaking */

export type MicPermission = 'unknown' | 'granted' | 'denied';

export const recognitionAtom = atom<RecognitionCapability & { readonly permission: MicPermission }>({
  installed: false,
  available: false,
  onDevice: false,
  permission: 'unknown',
});
