import { balancedChunks, buildLessonPlans } from '@/domain/curriculum/lesson-plans';
import { makeWorld } from '../../helpers/fixtures';

describe('balancedChunks', () => {
  it.each([
    [16, [4, 4, 4, 4]],
    [15, [4, 4, 4, 3]],
    [14, [4, 4, 3, 3]],
    [13, [4, 3, 3, 3]],
    [12, [4, 4, 4]],
    [9, [3, 3, 3]],
    [5, [3, 2]],
  ])('splits %i items into sizes %j', (count, sizes) => {
    const items = Array.from({ length: count }, (_, i) => i);
    const chunks = balancedChunks(items, 4);
    expect(chunks.map((c) => c.length)).toEqual(sizes);
    expect(chunks.flat()).toEqual(items);
  });

  it('returns no chunks for no items', () => {
    expect(balancedChunks([], 4)).toEqual([]);
  });
});

describe('buildLessonPlans', () => {
  it('creates learn lessons covering every word, then review and boss', () => {
    const world = makeWorld();
    const plans = buildLessonPlans(world);
    const learn = plans.filter((p) => p.kind === 'learn');
    expect(learn.flatMap((p) => p.newWordIds)).toEqual(world.words.map((w) => w.id));
    expect(plans.slice(-2).map((p) => p.kind)).toEqual(['review', 'boss']);
    expect(plans.map((p) => p.index)).toEqual(plans.map((_, i) => i + 1));
  });

  it('uses stable ids', () => {
    const plans = buildLessonPlans(makeWorld('zoo'));
    expect(plans[0]?.id).toBe('zoo.learn-1');
    expect(plans.at(-1)?.id).toBe('zoo.boss');
  });
});
