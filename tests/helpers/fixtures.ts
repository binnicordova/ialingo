import type { World } from '@/domain/curriculum/types';
import { createCatalogIndex, type CatalogIndex } from '@/domain/game/catalog';
import { createInitialGameState, type GameState } from '@/domain/game/game-state';
import { defineWorld, type WordRow } from '@/infrastructure/content/define-world';
import { CONTENT_CATALOG } from '@/infrastructure/content/catalog';

export const TODAY = '2026-03-10';
export const TOMORROW = '2026-03-11';

const ANIMAL_ROWS: readonly WordRow[] = [
  ['dog', '🐶', 'perro', 'cachorro', 'chien'],
  ['cat', '🐱', 'gato', 'gato', 'chat'],
  ['cow', '🐮', 'vaca', 'vaca', 'vache'],
  ['pig', '🐷', 'cerdo', 'porco', 'cochon'],
  ['duck', '🦆', 'pato', 'pato', 'canard'],
  ['frog', '🐸', 'rana', 'sapo', 'grenouille'],
  ['bee', '🐝', 'abeja', 'abelha', 'abeille'],
  ['goat', '🐐', 'cabra', 'cabra', 'chèvre'],
  ['teddy bear', '🧸', 'osito', 'ursinho', 'nounours'],
];

/** A small world built with the real authoring helper. */
export function makeWorld(id = 'animals', order = 1, wordCount = ANIMAL_ROWS.length): World {
  return defineWorld({
    id,
    order,
    title: { en: id, es: id, pt: id, fr: id },
    emoji: '🐾',
    color: '#FFFFFF',
    guideId: 'luna',
    rewardSpeciesId: 'giggles',
    words: ANIMAL_ROWS.slice(0, wordCount).map(
      ([en, emoji, es, pt, fr]) => [`${en}`, emoji, es, pt, fr] as const,
    ),
    sentences: [
      ['The dog is happy.', '🐶', 'El perro está feliz.', 'O cachorro está feliz.', 'Le chien est content.'],
      ['I have a cat.', '🐱', 'Tengo un gato.', 'Eu tenho um gato.', "J'ai un chat."],
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
