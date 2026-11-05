import type { LessonRecord } from '../learning/progress';
import type { WordMastery } from '../learning/mastery';
import type { OwnedPet } from '../pets/pet';
import { isQuestKind, QUEST_DEFINITIONS, type QuestKind } from '../quests/quests';
import { isDayKey, type DayKey } from '../shared/day';
import { isLocale, type Locale } from '../shared/locale';
import {
  createInitialGameState,
  CURRENT_SCHEMA_VERSION,
  type GameState,
  type Settings,
} from './game-state';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function num(value: unknown, fallback: number, min = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(min, value) : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function day(value: unknown, fallback: DayKey): DayKey {
  return isDayKey(value) ? value : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function record(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

/**
 * Migrations from older schema versions, keyed by the version they upgrade
 * *from*. Version 1 is the first release, so there are none yet. A future
 * change adds `1: (s) => ({ ...s, newField: default, schemaVersion: 2 })`.
 */
const MIGRATIONS: Readonly<Record<number, (state: UnknownRecord) => UnknownRecord>> = {};

/**
 * Turns whatever was stored into a valid GameState.
 *
 * Storage can hold data from an older app version, or (rarely) corrupted
 * data. Each field is validated and missing ones fall back to defaults, so a
 * bad save never crashes the app. Returns null for unusable input, and the
 * caller then starts a fresh game.
 */
export function restoreGameState(raw: unknown, today: DayKey, locale: Locale): GameState | null {
  if (!isRecord(raw)) return null;
  let data: UnknownRecord = raw;
  let version = num(data.schemaVersion, 0);
  if (version < 1 || version > CURRENT_SCHEMA_VERSION) return null;
  while (version < CURRENT_SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) return null;
    data = migrate(data);
    version = num(data.schemaVersion, version + 1);
  }

  const base = createInitialGameState(today, locale);
  const settingsRaw = record(data.settings);
  const limit = settingsRaw.dailyLimitMinutes;
  const settings: Settings = {
    uiLocale: isLocale(settingsRaw.uiLocale) ? settingsRaw.uiLocale : base.settings.uiLocale,
    voiceSpeed: settingsRaw.voiceSpeed === 'slow' ? 'slow' : 'normal',
    soundEffects: bool(settingsRaw.soundEffects, base.settings.soundEffects),
    haptics: bool(settingsRaw.haptics, base.settings.haptics),
    dailyLimitMinutes:
      limit === null ? null : num(limit, base.settings.dailyLimitMinutes ?? 30, 1),
    speaking: settingsRaw.speaking === 'self-check' ? 'self-check' : 'recognition',
    allowOnlineRecognition: bool(settingsRaw.allowOnlineRecognition, false),
    voiceDiary: bool(settingsRaw.voiceDiary, false),
    reducedMotion: bool(settingsRaw.reducedMotion, false),
  };

  const progressRaw = record(data.progress);
  const lessons: Record<string, LessonRecord> = {};
  for (const [id, value] of Object.entries(record(progressRaw.lessons))) {
    const r = record(value);
    const stars = num(r.bestStars, 1);
    lessons[id] = {
      bestStars: (stars >= 3 ? 3 : stars >= 2 ? 2 : 1) as 1 | 2 | 3,
      plays: num(r.plays, 1),
      lastPlayedDay: day(r.lastPlayedDay, today),
    };
  }
  const mastery: Record<string, WordMastery> = {};
  for (const [id, value] of Object.entries(record(progressRaw.mastery))) {
    const m = record(value);
    mastery[id] = {
      box: Math.min(5, Math.round(num(m.box, 0))),
      lastReviewDay: day(m.lastReviewDay, today),
      seen: num(m.seen, 0),
      correct: num(m.correct, 0),
    };
  }

  const petsRaw = record(data.pets);
  const owned: Record<string, OwnedPet> = {};
  for (const [id, value] of Object.entries(record(petsRaw.owned))) {
    const p = record(value);
    owned[id] = {
      speciesId: id,
      nickname: typeof p.nickname === 'string' ? p.nickname.slice(0, 24) : 'Buddy',
      xp: num(p.xp, 0),
      happiness: Math.min(100, num(p.happiness, 80)),
      accessoryId: typeof p.accessoryId === 'string' ? p.accessoryId : null,
      hatchedOn: day(p.hatchedOn, today),
      lastCareDay: day(p.lastCareDay, today),
      timesFed: num(p.timesFed, 0),
    };
  }
  const active =
    typeof petsRaw.activeSpeciesId === 'string' && owned[petsRaw.activeSpeciesId]
      ? petsRaw.activeSpeciesId
      : (Object.keys(owned)[0] ?? null);

  const screenRaw = record(data.screenTime);
  const playRaw = record(data.play);
  const questsRaw = record(data.quests);
  const questKinds = [...new Set(stringArray(questsRaw.kinds).filter(isQuestKind))];
  const questProgress: Partial<Record<QuestKind, number>> = {};
  for (const [kind, value] of Object.entries(record(questsRaw.progress))) {
    if (isQuestKind(kind)) questProgress[kind] = Math.min(QUEST_DEFINITIONS[kind].target, num(value, 0));
  }
  const chestsOpened = num(questsRaw.chestsOpened, 0);

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdOn: day(data.createdOn, today),
    onboarded: bool(data.onboarded, false) && Object.keys(owned).length > 0,
    settings,
    progress: {
      lessons,
      mastery,
      daysPlayed: stringArray(progressRaw.daysPlayed).filter(isDayKey),
      perfectLessons: num(progressRaw.perfectLessons, 0),
      totalAnswers: num(progressRaw.totalAnswers, 0),
      totalCorrect: num(progressRaw.totalCorrect, 0),
      practiceSessions: num(progressRaw.practiceSessions, 0),
    },
    wallet: { berries: Math.floor(num(record(data.wallet).berries, 0)) },
    pets: {
      owned,
      activeSpeciesId: active,
      eggs: stringArray(petsRaw.eggs).filter((id) => owned[id] === undefined),
    },
    accessoriesOwned: stringArray(data.accessoriesOwned),
    achievements: stringArray(data.achievements),
    dailyGiftClaimedOn: isDayKey(data.dailyGiftClaimedOn) ? data.dailyGiftClaimedOn : null,
    screenTime: {
      day: day(screenRaw.day, today),
      secondsUsed: num(screenRaw.secondsUsed, 0),
      bonusMinutes: num(screenRaw.bonusMinutes, 0),
    },
    voiceDiary: (Array.isArray(data.voiceDiary) ? data.voiceDiary : [])
      .map(record)
      .filter((e) => typeof e.id === 'string' && typeof e.fileName === 'string')
      .map((e) => ({
        id: String(e.id),
        day: day(e.day, today),
        fileName: String(e.fileName),
        prompt: typeof e.prompt === 'string' ? e.prompt : '',
        durationMs: num(e.durationMs, 0),
      })),
    play: {
      day: day(playRaw.day, today),
      berriesToday: num(playRaw.berriesToday, 0),
      gamesToday: num(playRaw.gamesToday, 0),
      totalGames: num(playRaw.totalGames, 0),
    },
    quests:
      questKinds.length > 0
        ? {
            day: day(questsRaw.day, today),
            kinds: questKinds,
            progress: questProgress,
            chestClaimed: bool(questsRaw.chestClaimed, false),
            chestsOpened,
          }
        : { ...base.quests, chestsOpened },
  };
}
