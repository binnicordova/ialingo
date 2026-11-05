import type { LocalizedText } from '../shared/locale';

export type WorldId = string;
export type WordId = string;
export type SentenceId = string;
export type LessonId = string;
export type CharacterId = string;
export type SpeciesId = string;

/** One English word with a picture (emoji) and its meaning in every UI locale. */
export interface VocabularyItem {
  readonly id: WordId;
  readonly worldId: WorldId;
  /** The English word or short phrase being taught. */
  readonly en: string;
  /** Picture used by picture-based exercises. Unique within its world. */
  readonly emoji: string;
  /** Translation shown to the learner (`meaning.en` equals `en`). */
  readonly meaning: LocalizedText;
}

/** A short, useful English sentence built from the world's theme. */
export interface Sentence {
  readonly id: SentenceId;
  readonly worldId: WorldId;
  readonly en: string;
  readonly meaning: LocalizedText;
  readonly emoji: string;
}

/** A themed unit of the curriculum (for example "Farm Animals"). */
export interface World {
  readonly id: WorldId;
  /** 1-based order on the Adventure Map. */
  readonly order: number;
  readonly title: LocalizedText;
  readonly emoji: string;
  /** Theme color (hex). */
  readonly color: string;
  /** Guide character who hosts this world. */
  readonly guideId: CharacterId;
  /** Pet egg awarded the first time the boss lesson is completed. */
  readonly rewardSpeciesId: SpeciesId;
  readonly words: readonly VocabularyItem[];
  readonly sentences: readonly Sentence[];
}

export type LessonKind = 'learn' | 'review' | 'boss';

/** Static description of one lesson slot inside a world. */
export interface LessonPlan {
  readonly id: LessonId;
  readonly worldId: WorldId;
  readonly kind: LessonKind;
  /** 1-based position among the world's lessons. */
  readonly index: number;
  /** Words introduced by this lesson (empty for review / boss). */
  readonly newWordIds: readonly WordId[];
}
