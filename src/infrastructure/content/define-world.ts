import { levelForOrder } from '@/domain/curriculum/levels';
import type { CharacterId, SpeciesId, World, WorldId, YleLevel } from '@/domain/curriculum/types';
import type { LocalizedText } from '@/domain/shared/locale';

/** [english, emoji, spanish, portuguese] */
export type WordRow = readonly [en: string, emoji: string, es: string, pt: string];
/** [english sentence, emoji, spanish, portuguese] */
export type SentenceRow = readonly [en: string, emoji: string, es: string, pt: string];
/** [english line, emoji, spanish, portuguese, key word (English text of a word in the same world)] */
export type StoryLineRow = readonly [en: string, emoji: string, es: string, pt: string, keyword: string];

export interface StorySource {
  readonly title: LocalizedText;
  readonly lines: readonly StoryLineRow[];
}

export interface WorldSource {
  readonly id: WorldId;
  readonly order: number;
  /** Defaults to the order-based YLE level (1–13 Starters, 14–26 Movers, 27+ Flyers). */
  readonly level?: YleLevel;
  readonly title: LocalizedText;
  readonly emoji: string;
  readonly color: string;
  readonly guideId: CharacterId;
  readonly rewardSpeciesId: SpeciesId;
  readonly words: readonly WordRow[];
  readonly sentences: readonly SentenceRow[];
}

/** Stable id fragment from an English word, for example "ice cream" → "ice-cream". */
export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Expands compact authoring rows into domain objects. Word ids are
 * `<world>.<slug>`; sentence ids are `<world>.s<n>`. Both are stable, so saved
 * progress survives content edits as long as the English text stays the same.
 */
export function defineWorld(source: WorldSource): World {
  return {
    id: source.id,
    order: source.order,
    level: source.level ?? levelForOrder(source.order),
    title: source.title,
    emoji: source.emoji,
    color: source.color,
    guideId: source.guideId,
    rewardSpeciesId: source.rewardSpeciesId,
    words: source.words.map(([en, emoji, es, pt]) => ({
      id: `${source.id}.${slug(en)}`,
      worldId: source.id,
      en,
      emoji,
      meaning: { en, es, pt },
    })),
    sentences: source.sentences.map(([en, emoji, es, pt], i) => ({
      id: `${source.id}.s${i + 1}`,
      worldId: source.id,
      en,
      emoji,
      meaning: { en, es, pt },
    })),
  };
}

/** Adds a picture story to a world. Key words are matched to the world's words by English text. */
export function attachStory(world: World, source: StorySource | undefined): World {
  if (!source) return world;
  return {
    ...world,
    story: {
      id: `${world.id}.story`,
      worldId: world.id,
      title: source.title,
      lines: source.lines.map(([en, emoji, es, pt, keyword]) => ({
        en,
        emoji,
        meaning: { en, es, pt },
        keyWordId: `${world.id}.${slug(keyword)}`,
      })),
    },
  };
}

/** Adds an original sing-along chant to a world (same row format as stories). */
export function attachSong(world: World, source: StorySource | undefined): World {
  if (!source) return world;
  return {
    ...world,
    song: {
      id: `${world.id}.song`,
      worldId: world.id,
      title: source.title,
      lines: source.lines.map(([en, emoji, es, pt, keyword]) => ({
        en,
        emoji,
        meaning: { en, es, pt },
        keyWordId: `${world.id}.${slug(keyword)}`,
      })),
    },
  };
}
