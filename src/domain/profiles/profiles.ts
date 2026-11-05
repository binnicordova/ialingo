/**
 * Family profiles: up to four children share one device, each with their own
 * pets and progress. A profile is identified by its pet, never by a child's
 * name (no personal data).
 */
export const MAX_PROFILES = 4;

export type ProfileId = string;

export interface ProfileIndex {
  readonly version: 1;
  readonly activeId: ProfileId;
  readonly ids: readonly ProfileId[];
}

/** The first profile keeps id "p1", which maps to the v1.0 save key. */
export const FIRST_PROFILE_ID: ProfileId = 'p1';

export function createProfileIndex(): ProfileIndex {
  return { version: 1, activeId: FIRST_PROFILE_ID, ids: [FIRST_PROFILE_ID] };
}

export function canAddProfile(index: ProfileIndex): boolean {
  return index.ids.length < MAX_PROFILES;
}

/** Adds a profile with the smallest free id ("p2", "p3", …) and makes it active. */
export function addProfile(index: ProfileIndex): { index: ProfileIndex; id: ProfileId } | null {
  if (!canAddProfile(index)) return null;
  let n = 1;
  while (index.ids.includes(`p${n}`)) n += 1;
  const id = `p${n}`;
  return { index: { ...index, ids: [...index.ids, id], activeId: id }, id };
}

/** Removes a profile. The last profile can never be removed (reset it instead). */
export function removeProfile(index: ProfileIndex, id: ProfileId): ProfileIndex {
  if (!index.ids.includes(id) || index.ids.length <= 1) return index;
  const ids = index.ids.filter((x) => x !== id);
  return { ...index, ids, activeId: index.activeId === id ? (ids[0] as ProfileId) : index.activeId };
}

export function setActiveProfile(index: ProfileIndex, id: ProfileId): ProfileIndex {
  return index.ids.includes(id) ? { ...index, activeId: id } : index;
}

/** Validates a stored index; returns null for anything unusable. */
export function restoreProfileIndex(raw: unknown): ProfileIndex | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const data = raw as Record<string, unknown>;
  const ids = Array.isArray(data.ids)
    ? [...new Set(data.ids.filter((x): x is string => typeof x === 'string' && /^p\d+$/.test(x)))].slice(
        0,
        MAX_PROFILES,
      )
    : [];
  if (ids.length === 0) return null;
  const activeId = typeof data.activeId === 'string' && ids.includes(data.activeId) ? data.activeId : (ids[0] as string);
  return { version: 1, activeId, ids };
}
