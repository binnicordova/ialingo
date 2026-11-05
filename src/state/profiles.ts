import { atom } from 'jotai';

import * as commands from '@/application/commands';
import { createInitialGameState, type GameState } from '@/domain/game/game-state';
import { restoreGameState } from '@/domain/game/snapshot';
import { countCompletedLessons } from '@/domain/learning/progress';
import { activePet } from '@/domain/pets/collection';
import {
  addProfile,
  canAddProfile,
  removeProfile,
  setActiveProfile,
  type ProfileId,
} from '@/domain/profiles/profiles';

import {
  activeProfileIdAtom,
  contentAtom,
  flushSaveAtom,
  gameStateAtom,
  pendingEventsAtom,
  profileChosenAtom,
  profileIndexAtom,
  servicesAtom,
  storedProfileSummariesAtom,
  todayAtom,
  type ProfileSummary,
} from './core';

export function summarizeProfile(id: ProfileId, state: GameState | null): ProfileSummary {
  const pet = state ? activePet(state.pets) : null;
  return {
    id,
    onboarded: state?.onboarded ?? false,
    petSpeciesId: pet?.speciesId ?? null,
    petNickname: pet?.nickname ?? null,
    petXp: pet?.xp ?? 0,
    lessonsCompleted: state ? countCompletedLessons(state.progress) : 0,
  };
}

/** Every profile in order; the active one is summarized from live state. */
export const profilesAtom = atom<readonly ProfileSummary[]>((get) => {
  const index = get(profileIndexAtom);
  const stored = get(storedProfileSummariesAtom);
  const state = get(gameStateAtom);
  return index.ids.map((id) =>
    id === index.activeId ? summarizeProfile(id, state) : (stored[id] ?? summarizeProfile(id, null)),
  );
});

export const canAddProfileAtom = atom((get) => canAddProfile(get(profileIndexAtom)));

/** Saves the current child, loads another child's game and makes it active. */
export const switchProfileAtom = atom(null, async (get, set, id: ProfileId) => {
  const index = get(profileIndexAtom);
  if (!index.ids.includes(id)) return;
  set(profileChosenAtom, true);
  if (id === index.activeId) return;
  const services = get(servicesAtom);
  await get(flushSaveAtom).flush();
  const leaving = get(gameStateAtom);
  const today = get(todayAtom);
  const raw = await services.repository.load(id);
  const restored = restoreGameState(raw, today, leaving.settings.uiLocale);
  const nextIndex = setActiveProfile(index, id);
  set(storedProfileSummariesAtom, (prev) => ({ ...prev, [index.activeId]: summarizeProfile(index.activeId, leaving) }));
  set(pendingEventsAtom, []);
  set(profileIndexAtom, nextIndex);
  const fresh = restored ?? createInitialGameState(today, leaving.settings.uiLocale);
  set(gameStateAtom, commands.startDay(fresh, { today, content: get(contentAtom) }).state);
  await services.repository.saveProfiles(nextIndex);
});

/** Adds a new child (parent area). The new profile starts at onboarding. */
export const addProfileAtom = atom(null, async (get, set): Promise<ProfileId | null> => {
  const index = get(profileIndexAtom);
  const added = addProfile(index);
  if (!added) return null;
  const services = get(servicesAtom);
  await get(flushSaveAtom).flush();
  const leaving = get(gameStateAtom);
  set(storedProfileSummariesAtom, (prev) => ({ ...prev, [index.activeId]: summarizeProfile(index.activeId, leaving) }));
  set(pendingEventsAtom, []);
  set(profileIndexAtom, added.index);
  set(gameStateAtom, createInitialGameState(get(todayAtom), leaving.settings.uiLocale));
  set(profileChosenAtom, true);
  await services.repository.saveProfiles(added.index);
  return added.id;
});

/** Deletes a child's profile, save and recordings. The last profile cannot be deleted. */
export const deleteProfileAtom = atom(null, async (get, set, id: ProfileId) => {
  const index = get(profileIndexAtom);
  if (!index.ids.includes(id) || index.ids.length <= 1) return;
  const services = get(servicesAtom);
  if (get(activeProfileIdAtom) === id) {
    const other = index.ids.find((x) => x !== id);
    if (other) await set(switchProfileAtom, other);
  }
  const nextIndex = removeProfile(get(profileIndexAtom), id);
  set(profileIndexAtom, nextIndex);
  set(storedProfileSummariesAtom, (prev) => {
    const copy = { ...prev };
    delete copy[id];
    return copy;
  });
  await services.repository.clear(id);
  await services.voiceStore.removeAll(id);
  await services.repository.saveProfiles(nextIndex);
});
