import type { LocalizedText } from '../shared/locale';

export type WorldId = string;
export type WordId = string;
export type SentenceId = string;
export type LessonId = string;
export type CharacterId = string;
export type SpeciesId = string;
export type StoryId = string;

/** Cambridge Young Learners English levels (CEFR Pre-A1 → A2). */
export type YleLevel = 'starters' | 'movers' | 'flyers';

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

/** One page of a picture story, read aloud by the world's guide. */
export interface StoryLine {
  readonly en: string;
  readonly emoji: string;
  readonly meaning: LocalizedText;
  /** World word this page is about; used for the comprehension questions. */
  readonly keyWordId: WordId;
}

/** A short listening story that reuses the world's vocabulary in context. */
export interface Story {
  readonly id: StoryId;
  readonly worldId: WorldId;
  readonly title: LocalizedText;
  readonly lines: readonly StoryLine[];
}

/** A themed unit of the curriculum (for example "Farm Animals"). */
export interface World {
  readonly id: WorldId;
  /** 1-based order on the Adventure Map. */
  readonly order: number;
  readonly level: YleLevel;
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
  readonly story?: Story;
}

/**
 * Lesson kinds, in map order inside a world:
 * learn (new words) → story (listening) → speak (pronunciation) → review → boss.
 */
export type LessonKind = 'learn' | 'story' | 'speak' | 'review' | 'boss';

/** Static description of one lesson slot inside a world. */
export interface LessonPlan {
  readonly id: LessonId;
  readonly worldId: WorldId;
  readonly kind: LessonKind;
  /** 1-based position among the world's lessons. */
  readonly index: number;
  /** Words introduced by this lesson (empty for the other kinds). */
  readonly newWordIds: readonly WordId[];
}
