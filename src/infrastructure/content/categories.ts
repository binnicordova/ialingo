import type { WorldCategory, WorldId } from '@/domain/curriculum/types';

/**
 * Semantic family of every world, for Odd One Out. A world is `coherent`
 * only when all of its words share one everyday category; mixed worlds (the
 * sea has boats and beaches, nature has bugs and mountains) never form a
 * group and never supply the odd one, so rounds stay unambiguous.
 */
export const WORLD_CATEGORIES: Readonly<Record<WorldId, WorldCategory>> = {
  feelings: { theme: 'feelings', coherent: false },
  colors: { theme: 'ideas', coherent: true },
  numbers: { theme: 'ideas', coherent: true },
  farm: { theme: 'animals', coherent: true },
  fruits: { theme: 'food', coherent: true },
  family: { theme: 'people', coherent: false },
  body: { theme: 'body', coherent: true },
  toys: { theme: 'things', coherent: false },
  food: { theme: 'food', coherent: true },
  clothes: { theme: 'things', coherent: true },
  home: { theme: 'things', coherent: true },
  school: { theme: 'things', coherent: false },
  wild: { theme: 'animals', coherent: true },
  sea: { theme: 'animals', coherent: false },
  weather: { theme: 'nature', coherent: true },
  nature: { theme: 'nature', coherent: false },
  garden: { theme: 'food', coherent: true },
  transport: { theme: 'things', coherent: true },
  actions: { theme: 'actions', coherent: true },
  sports: { theme: 'actions', coherent: false },
  music: { theme: 'things', coherent: false },
  shapes: { theme: 'ideas', coherent: false },
  time: { theme: 'ideas', coherent: false },
  jobs: { theme: 'people', coherent: true },
  places: { theme: 'places', coherent: true },
  fantasy: { theme: 'fantasy', coherent: false },
  countries: { theme: 'places', coherent: true },
  birds: { theme: 'animals', coherent: true },
  sweets: { theme: 'food', coherent: true },
  kitchen: { theme: 'things', coherent: false },
  health: { theme: 'things', coherent: false },
  tools: { theme: 'things', coherent: true },
  celebrations: { theme: 'events', coherent: false },
  tech: { theme: 'things', coherent: true },
  manners: { theme: 'words', coherent: true },
  routine: { theme: 'actions', coherent: true },
  shopping: { theme: 'things', coherent: true },
  emotions: { theme: 'feelings', coherent: true },
};
