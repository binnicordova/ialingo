import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import type { JourneyUnit } from '@/domain/curriculum/journey';
import { contentAtom } from '@/state/core';
import { petCollectionAtom } from '@/state/selectors';

import { EggPortrait } from '../art/PetPortrait';
import type { LessonPathProps, PathLesson } from '../components/LessonPath';
import { useT } from '../i18n/use-t';

/**
 * What a world's path draws (shared by the home map and a world's page): each
 * step with its words' emoji, the story's title, the boss's egg while the
 * world's pet is still to be won, and that pet standing beside the path.
 */
export function usePathLessons(unit: JourneyUnit | null): {
  lessons: PathLesson[];
  mascot: LessonPathProps['mascot'];
} {
  const { t, l } = useT();
  const content = useAtomValue(contentAtom);
  const pets = useAtomValue(petCollectionAtom);
  return useMemo(() => {
    if (!unit) return { lessons: [], mascot: null };
    const { world } = unit;
    const species = content.species(world.rewardSpeciesId);
    const won = Boolean(pets.owned[world.rewardSpeciesId]) || pets.eggs.includes(world.rewardSpeciesId);
    const lessons = unit.steps.map(
      (step): PathLesson => ({
        step,
        wordsEmoji: step.plan.newWordIds.map((id) => content.word(id)?.emoji ?? '').join(' '),
        subtitle: step.plan.kind === 'story' && world.story ? l(world.story.title) : undefined,
        reward:
          step.plan.kind === 'boss' && species && !won ? <EggPortrait blueprint={species.blueprint} size={58} /> : undefined,
      }),
    );
    const mascot = species
      ? { blueprint: species.blueprint, locked: !unit.unlocked, label: won ? species.name : t('winPet', { name: species.name }) }
      : null;
    return { lessons, mascot };
  }, [unit, content, pets, l, t]);
}
