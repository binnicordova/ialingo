import { createCatalogIndex, type CatalogIndex, type ContentCatalog } from '@/domain/game/catalog';

import { CHARACTERS } from './characters';
import { PET_SPECIES } from './pets';
import { ACCESSORIES, ACHIEVEMENTS } from './rewards';
import { WORLDS_PART_1 } from './worlds-part1';
import { WORLDS_PART_2 } from './worlds-part2';

/** The bundled content. It ships inside the app, so the game works fully offline. */
export const CONTENT_CATALOG: ContentCatalog = {
  worlds: [...WORLDS_PART_1, ...WORLDS_PART_2],
  species: PET_SPECIES,
  characters: CHARACTERS,
  accessories: ACCESSORIES,
  achievements: ACHIEVEMENTS,
};

let cachedIndex: CatalogIndex | null = null;

/** Lazily built read-only indexes over the bundled content. */
export function getContentIndex(): CatalogIndex {
  cachedIndex ??= createCatalogIndex(CONTENT_CATALOG);
  return cachedIndex;
}
