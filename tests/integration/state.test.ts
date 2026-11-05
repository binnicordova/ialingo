import { createStore } from 'jotai';

import { createNoopServices } from '@/application/noop-services';
import { currentExercise } from '@/domain/learning/lesson-session';
import type { Exercise, ExerciseAnswer } from '@/domain/curriculum/exercises';
import { completeOnboardingAtom, feedPetAtom } from '@/state/actions';
import { bootstrapStore } from '@/state/bootstrap';
import { contentAtom, gameStateAtom, hydratedAtom, pendingEventsAtom } from '@/state/core';
import {
  activeLessonAtom,
  continueLessonAtom,
  startLessonAtom,
  submitAnswerAtom,
} from '@/state/lesson';
import { activePetAtom, berriesAtom, worldViewsAtom } from '@/state/selectors';
import { TODAY } from '../helpers/fixtures';

/** The correct answer for any exercise, as a child who knows everything would play. */
function correctAnswer(exercise: Exercise, wordText: (id: string) => string, sentence: (id: string) => string): ExerciseAnswer {
  switch (exercise.kind) {
    case 'learn-card':
      return { kind: 'seen' };
    case 'listen-pick-picture':
    case 'picture-pick-word':
      return { kind: 'pick', optionId: exercise.answerId };
    case 'true-false':
      return { kind: 'bool', value: exercise.spokenWordId === exercise.shownWordId };
    case 'match-pairs':
      return { kind: 'match', mistakes: 0 };
    case 'spell-word':
      return { kind: 'spell', letters: wordText(exercise.wordId).split('') };
    case 'build-sentence':
      return {
        kind: 'sentence',
        tokens: sentence(exercise.sentenceId).replace(/[.,!?]/g, '').toLowerCase().split(/\s+/),
      };
  }
}

describe('Jotai state wiring', () => {
  it('boots, onboards, plays a full lesson, rewards the pet and autosaves', async () => {
    const services = createNoopServices(TODAY);
    const store = createStore();
    const autosave = await bootstrapStore(store, services, 'es');
    expect(store.get(hydratedAtom)).toBe(true);
    expect(store.get(gameStateAtom).onboarded).toBe(false);

    store.set(completeOnboardingAtom, { speciesId: 'sprout', nickname: 'Kiwi', locale: 'es' });
    expect(store.get(activePetAtom)?.pet.nickname).toBe('Kiwi');
    const berriesBefore = store.get(berriesAtom);

    const firstLesson = store.get(worldViewsAtom)[0]!.nextLesson!;
    expect(store.set(startLessonAtom, firstLesson.id)).toBe(true);
    const content = store.get(contentAtom);
    const wordText = (id: string) => content.word(id)?.en ?? '';
    const sentence = (id: string) => content.sentence(id)?.en ?? '';

    let guard = 0;
    while (!store.get(activeLessonAtom)!.completed && guard < 100) {
      const exercise = currentExercise(store.get(activeLessonAtom)!.session)!;
      expect(store.set(submitAnswerAtom, correctAnswer(exercise, wordText, sentence))).toBe(true);
      store.set(continueLessonAtom);
      guard += 1;
    }
    expect(store.get(activeLessonAtom)!.completed).toBe(true);
    expect(store.get(berriesAtom)).toBeGreaterThan(berriesBefore);
    expect(store.get(activePetAtom)!.pet.xp).toBeGreaterThan(0);
    expect(store.get(pendingEventsAtom).map((e) => e.type)).toContain('lesson-completed');

    store.set(feedPetAtom, 'sprout');
    await autosave.stop();
    const saved = (await services.repository.load()) as { onboarded: boolean; progress: { lessons: object } };
    expect(saved.onboarded).toBe(true);
    expect(Object.keys(saved.progress.lessons)).toContain(firstLesson.id);
  });

  it('restores a previous save on the next boot', async () => {
    const services = createNoopServices(TODAY);
    const first = createStore();
    const autosave = await bootstrapStore(first, services, 'pt');
    first.set(completeOnboardingAtom, { speciesId: 'bubbo', nickname: 'Bubbles', locale: 'pt' });
    await autosave.stop();

    const second = createStore();
    await bootstrapStore(second, services, 'es');
    expect(second.get(gameStateAtom).onboarded).toBe(true);
    expect(second.get(gameStateAtom).settings.uiLocale).toBe('pt');
    expect(second.get(activePetAtom)?.species.id).toBe('bubbo');
  });
});
