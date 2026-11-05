import type { LocalizedText } from '../shared/locale';
import type { YleLevel } from './types';

/**
 * Cambridge Young Learners English ladder. Worlds are grouped so that a child
 * who finishes a level has met that level's core topic vocabulary.
 */
export interface LevelInfo {
  readonly id: YleLevel;
  readonly cefr: string;
  readonly emoji: string;
  readonly color: string;
  readonly title: LocalizedText;
}

export const YLE_LEVELS: readonly LevelInfo[] = [
  {
    id: 'starters',
    cefr: 'Pre-A1',
    emoji: '🌱',
    color: '#3CC46B',
    title: { en: 'Starters', es: 'Starters (inicial)', pt: 'Starters (inicial)' },
  },
  {
    id: 'movers',
    cefr: 'A1',
    emoji: '🚀',
    color: '#59C3FF',
    title: { en: 'Movers', es: 'Movers (básico)', pt: 'Movers (básico)' },
  },
  {
    id: 'flyers',
    cefr: 'A2',
    emoji: '🦅',
    color: '#FF8A3D',
    title: { en: 'Flyers', es: 'Flyers (intermedio)', pt: 'Flyers (intermediário)' },
  },
];

/** Default level by map order: 1–13 Starters, 14–26 Movers, 27+ Flyers. */
export function levelForOrder(order: number): YleLevel {
  if (order <= 13) return 'starters';
  if (order <= 26) return 'movers';
  return 'flyers';
}

export function levelInfo(level: YleLevel): LevelInfo {
  return YLE_LEVELS.find((l) => l.id === level) ?? (YLE_LEVELS[0] as LevelInfo);
}
