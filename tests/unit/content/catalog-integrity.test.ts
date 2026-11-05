import { tokenizeSentence } from '@/domain/curriculum/exercises';
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
    expect(worlds.length).toBeGreaterThanOrEqual(26);
    expect(species.length).toBeGreaterThanOrEqual(36);
    expect(characters.length).toBeGreaterThanOrEqual(8);
    const words = worlds.flatMap((w) => w.words).length;
    const lessons = worlds.flatMap((w) => buildLessonPlans(w)).length;
    expect(words).toBeGreaterThanOrEqual(350);
    expect(lessons).toBeGreaterThanOrEqual(140);
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
