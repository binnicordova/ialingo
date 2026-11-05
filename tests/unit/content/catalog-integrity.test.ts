import { gapLine, tokenizeSentence } from '@/domain/curriculum/exercises';
import { generateLesson } from '@/domain/curriculum/lesson-generator';
import { buildLessonPlans } from '@/domain/curriculum/lesson-plans';
import { SUPPORTED_LOCALES } from '@/domain/shared/locale';
import { CONTENT_CATALOG } from '@/infrastructure/content/catalog';
import { PET_NAME_SUGGESTIONS } from '@/infrastructure/content/pets';
import { TODAY } from '../../helpers/fixtures';

/**
 * Content is data, so it gets data tests (studio rule: no orphaned entries,
 * every reference resolves). These catch authoring mistakes before a child does.
 */
const { worlds, species, characters, accessories, achievements } = CONTENT_CATALOG;

describe('content catalog integrity', () => {
  it('has the promised scale', () => {
    expect(worlds.length).toBeGreaterThanOrEqual(34);
    expect(species.length).toBeGreaterThanOrEqual(51);
    expect(characters.length).toBeGreaterThanOrEqual(10);
    const words = worlds.flatMap((w) => w.words).length;
    const lessons = worlds.flatMap((w) => buildLessonPlans(w)).length;
    expect(words).toBeGreaterThanOrEqual(500);
    expect(lessons).toBeGreaterThanOrEqual(300);
  });

  it('gives every world a story whose key words exist in that world', () => {
    for (const world of worlds) {
      expect(world.story).toBeDefined();
      const ids = new Set(world.words.map((w) => w.id));
      for (const line of world.story?.lines ?? []) {
        expect(ids.has(line.keyWordId)).toBe(true);
        for (const locale of SUPPORTED_LOCALES) expect(line.meaning[locale].trim()).not.toBe('');
      }
      expect(world.story?.lines.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('gives every world a sing-along whose key words can be blanked out', () => {
    for (const world of worlds) {
      expect(world.song).toBeDefined();
      const byId = new Map(world.words.map((w) => [w.id, w]));
      for (const line of world.song?.lines ?? []) {
        const word = byId.get(line.keyWordId);
        expect(word).toBeDefined();
        expect(gapLine(line.en, word?.en ?? '')).not.toBeNull();
        for (const locale of SUPPORTED_LOCALES) expect(line.meaning[locale].trim()).not.toBe('');
      }
      expect(world.song?.lines.length).toBe(4);
      const keys = world.song?.lines.map((l) => l.keyWordId) ?? [];
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('spreads worlds over the three YLE levels in map order', () => {
    const levels = [...worlds].sort((a, b) => a.order - b.order).map((w) => w.level);
    expect(levels[0]).toBe('starters');
    expect(levels).toContain('movers');
    expect(levels.at(-1)).toBe('flyers');
    const firstMovers = levels.indexOf('movers');
    const firstFlyers = levels.indexOf('flyers');
    expect(firstMovers).toBeLessThan(firstFlyers);
  });

  it('uses unique ids everywhere', () => {
    const unique = (ids: string[]) => expect(new Set(ids).size).toBe(ids.length);
    unique(worlds.map((w) => w.id));
    unique(worlds.map((w) => String(w.order)));
    unique(worlds.flatMap((w) => w.words.map((x) => x.id)));
    unique(worlds.flatMap((w) => w.sentences.map((x) => x.id)));
    unique(species.map((s) => s.id));
    unique(characters.map((c) => c.id));
    unique(accessories.map((a) => a.id));
    unique(achievements.map((a) => a.id));
  });

  it.each(worlds.map((w) => [w.id, w] as const))('world %s is well formed', (_id, world) => {
    expect(world.words.length).toBeGreaterThanOrEqual(10);
    expect(world.sentences.length).toBeGreaterThanOrEqual(4);
    const emojis = world.words.map((w) => w.emoji);
    expect(new Set(emojis).size).toBe(emojis.length);
    const texts = world.words.map((w) => w.en.toLowerCase());
    expect(new Set(texts).size).toBe(texts.length);
    for (const item of [...world.words, ...world.sentences]) {
      for (const locale of SUPPORTED_LOCALES) expect(item.meaning[locale].trim()).not.toBe('');
    }
    for (const s of world.sentences) expect(tokenizeSentence(s.en).length).toBeGreaterThanOrEqual(2);
    expect(characters.some((c) => c.id === world.guideId)).toBe(true);
    expect(species.some((s) => s.id === world.rewardSpeciesId)).toBe(true);
  });

  it('links every pet to exactly one valid unlock source', () => {
    for (const pet of species) {
      switch (pet.unlock.type) {
        case 'starter':
          expect(pet.shopPrice).toBeGreaterThan(0);
          break;
        case 'world-boss': {
          const worldId = pet.unlock.worldId;
          expect(worlds.find((w) => w.id === worldId)?.rewardSpeciesId).toBe(pet.id);
          break;
        }
        case 'achievement': {
          const achievementId = pet.unlock.achievementId;
          expect(achievements.find((a) => a.id === achievementId)?.reward.speciesId).toBe(pet.id);
          break;
        }
      }
    }
    expect(species.filter((s) => s.unlock.type === 'starter')).toHaveLength(3);
    // Every world boss has its own pet and no pet is claimed by two worlds.
    expect(new Set(worlds.map((w) => w.rewardSpeciesId)).size).toBe(worlds.length);
  });

  it('only rewards pets that exist', () => {
    for (const a of achievements) {
      if (a.reward.speciesId) expect(species.some((s) => s.id === a.reward.speciesId)).toBe(true);
    }
  });

  it('can generate every lesson of every world', () => {
    for (const world of worlds) {
      for (const plan of buildLessonPlans(world)) {
        const lesson = generateLesson({ plan, worlds, mastery: {}, today: TODAY, seed: 1234 });
        expect(lesson.exercises.length).toBeGreaterThanOrEqual(8);
        expect(lesson.exercises.length).toBeLessThanOrEqual(16);
      }
    }
  });

  it('offers enough preset pet names', () => {
    expect(new Set(PET_NAME_SUGGESTIONS).size).toBeGreaterThanOrEqual(12);
  });
});
