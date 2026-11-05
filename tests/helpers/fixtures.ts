import type { World } from '@/domain/curriculum/types';
import { createCatalogIndex, type CatalogIndex } from '@/domain/game/catalog';
import { createInitialGameState, type GameState } from '@/domain/game/game-state';
import { defineWorld, type WordRow } from '@/infrastructure/content/define-world';
import { CONTENT_CATALOG } from '@/infrastructure/content/catalog';

export const TODAY = '2026-03-10';
export const TOMORROW = '2026-03-11';

const ANIMAL_ROWS: readonly WordRow[] = [
  ['dog', '🐶', 'perro', 'cachorro'],
  ['cat', '🐱', 'gato', 'gato'],
  ['cow', '🐮', 'vaca', 'vaca'],
  ['pig', '🐷', 'cerdo', 'porco'],
  ['duck', '🦆', 'pato', 'pato'],
  ['frog', '🐸', 'rana', 'sapo'],
  ['bee', '🐝', 'abeja', 'abelha'],
  ['goat', '🐐', 'cabra', 'cabra'],
  ['teddy bear', '🧸', 'osito', 'ursinho'],
];

/** A small world built with the real authoring helper. */
export function makeWorld(id = 'animals', order = 1, wordCount = ANIMAL_ROWS.length): World {
  return defineWorld({
    id,
    order,
    title: { en: id, es: id, pt: id },
    emoji: '🐾',
    color: '#FFFFFF',
    guideId: 'luna',
    rewardSpeciesId: 'giggles',
    words: ANIMAL_ROWS.slice(0, wordCount).map(
      ([en, emoji, es, pt]) => [`${en}`, emoji, es, pt] as const,
    ),
    sentences: [
      ['The dog is happy.', '🐶', 'El perro está feliz.', 'O cachorro está feliz.'],
      ['I have a cat.', '🐱', 'Tengo un gato.', 'Eu tenho um gato.'],
    ],
  });
}

/** Catalog index over the real bundled content (used by integration tests). */
export function realContent(): CatalogIndex {
  return createCatalogIndex(CONTENT_CATALOG);
}

export function freshState(): GameState {
  return createInitialGameState(TODAY, 'es');
}
