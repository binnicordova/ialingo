import type { Achievement } from '../achievements/achievement';
import type { Character } from '../characters/character';
import { indexLessonPlans } from '../curriculum/lesson-plans';
import type {
  CharacterId,
  LessonId,
  LessonPlan,
  Sentence,
  SentenceId,
  SpeciesId,
  VocabularyItem,
  WordId,
  World,
  WorldId,
} from '../curriculum/types';
import type { Accessory } from '../pets/accessory';
import type { AccessoryId } from '../pets/pet';
import type { PetSpecies } from '../pets/species';

/** All authored reference data: the "content" the domain rules run on. */
export interface ContentCatalog {
  readonly worlds: readonly World[];
  readonly species: readonly PetSpecies[];
  readonly characters: readonly Character[];
  readonly accessories: readonly Accessory[];
  readonly achievements: readonly Achievement[];
}

/** Read-only indexes over the catalog, built once at startup. */
export interface CatalogIndex {
  readonly catalog: ContentCatalog;
  world(id: WorldId): World | undefined;
  word(id: WordId): VocabularyItem | undefined;
  sentence(id: SentenceId): Sentence | undefined;
  species(id: SpeciesId): PetSpecies | undefined;
  character(id: CharacterId): Character | undefined;
  accessory(id: AccessoryId): Accessory | undefined;
  lessonPlan(id: LessonId): LessonPlan | undefined;
  lessonPlansForWorld(id: WorldId): LessonPlan[];
  /** Worlds sorted by map order. */
  readonly orderedWorlds: readonly World[];
}

export function createCatalogIndex(catalog: ContentCatalog): CatalogIndex {
  const worlds = new Map(catalog.worlds.map((w) => [w.id, w]));
  const words = new Map<WordId, VocabularyItem>();
  const sentences = new Map<SentenceId, Sentence>();
  for (const world of catalog.worlds) {
    for (const word of world.words) words.set(word.id, word);
    for (const sentence of world.sentences) sentences.set(sentence.id, sentence);
  }
  const species = new Map(catalog.species.map((s) => [s.id, s]));
  const characters = new Map(catalog.characters.map((c) => [c.id, c]));
  const accessories = new Map(catalog.accessories.map((a) => [a.id, a]));
  const plans = indexLessonPlans(catalog.worlds);
  const orderedWorlds = [...catalog.worlds].sort((a, b) => a.order - b.order);

  return {
    catalog,
    orderedWorlds,
    world: (id) => worlds.get(id),
    word: (id) => words.get(id),
    sentence: (id) => sentences.get(id),
    species: (id) => species.get(id),
    character: (id) => characters.get(id),
    accessory: (id) => accessories.get(id),
    lessonPlan: (id) => plans.get(id),
    lessonPlansForWorld: (id) => [...plans.values()].filter((p) => p.worldId === id),
  };
}
