import type { VoiceDiaryEntry } from '@/domain/game/game-state';
import {
  addProfile,
  createProfileIndex,
  MAX_PROFILES,
  removeProfile,
  restoreProfileIndex,
  setActiveProfile,
} from '@/domain/profiles/profiles';
import {
  addDiaryEntry,
  canRecordPostcard,
  removeDiaryEntry,
  VOICE_DIARY_TUNING,
} from '@/domain/voice/voice-diary';

describe('family profiles', () => {
  it('starts with p1 and adds up to the maximum with the smallest free id', () => {
    let index = createProfileIndex();
    const ids: string[] = [];
    for (let i = 1; i < MAX_PROFILES; i += 1) {
      const added = addProfile(index);
      expect(added).not.toBeNull();
      index = added!.index;
      ids.push(added!.id);
    }
    expect(ids).toEqual(['p2', 'p3', 'p4']);
    expect(index.activeId).toBe('p4');
    expect(addProfile(index)).toBeNull();
    index = removeProfile(index, 'p2');
    expect(addProfile(index)?.id).toBe('p2');
  });

  it('never removes the last profile and moves the active one when needed', () => {
    const single = createProfileIndex();
    expect(removeProfile(single, 'p1')).toBe(single);
    const two = addProfile(single)!.index;
    const removed = removeProfile(two, 'p2');
    expect(removed.ids).toEqual(['p1']);
    expect(removed.activeId).toBe('p1');
    expect(setActiveProfile(two, 'p9')).toBe(two);
  });

  it('restores only valid stored indexes', () => {
    expect(restoreProfileIndex(null)).toBeNull();
    expect(restoreProfileIndex({ ids: [] })).toBeNull();
    expect(restoreProfileIndex({ ids: ['p1', 'p1', 'x', 'p3'], activeId: 'nope' })).toEqual({
      version: 1,
      activeId: 'p1',
      ids: ['p1', 'p3'],
    });
  });
});

describe('voice diary', () => {
  const entry = (n: number): VoiceDiaryEntry => ({
    id: `e${n}`,
    day: `2026-01-${String(n).padStart(2, '0')}`,
    fileName: `e${n}.m4a`,
    prompt: 'Hello!',
    durationMs: 2000,
  });

  it('allows one postcard per week', () => {
    expect(canRecordPostcard([], '2026-01-01')).toBe(true);
    expect(canRecordPostcard([entry(1)], '2026-01-05')).toBe(false);
    expect(canRecordPostcard([entry(1)], '2026-01-08')).toBe(true);
  });

  it('keeps the first postcards and the newest ones, pruning the middle', () => {
    let entries: VoiceDiaryEntry[] = [];
    const removed: string[] = [];
    for (let i = 1; i <= VOICE_DIARY_TUNING.maxEntries + 3; i += 1) {
      const result = addDiaryEntry(entries, entry(i));
      entries = result.entries;
      removed.push(...result.removed.map((r) => r.id));
    }
    expect(entries).toHaveLength(VOICE_DIARY_TUNING.maxEntries);
    expect(entries.slice(0, VOICE_DIARY_TUNING.keepFirst).map((e) => e.id)).toEqual(['e1', 'e2']);
    expect(entries.at(-1)?.id).toBe(`e${VOICE_DIARY_TUNING.maxEntries + 3}`);
    expect(removed).toEqual(['e3', 'e4', 'e5']);
  });

  it('removes a single entry on request', () => {
    const result = removeDiaryEntry([entry(1), entry(2)], 'e1');
    expect(result.entries.map((e) => e.id)).toEqual(['e2']);
    expect(result.removed.map((e) => e.id)).toEqual(['e1']);
  });
});
