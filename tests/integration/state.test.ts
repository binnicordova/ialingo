import { createStore } from 'jotai';

import { createNoopServices } from '@/application/noop-services';
import { currentExercise } from '@/domain/learning/lesson-session';
import type { Exercise, ExerciseAnswer } from '@/domain/curriculum/exercises';
import { completeOnboardingAtom, feedPetAtom, savePostcardAtom, updateSettingsAtom } from '@/state/actions';
import { addProfileAtom, deleteProfileAtom, profilesAtom, switchProfileAtom } from '@/state/profiles';
import { bootstrapStore } from '@/state/bootstrap';
import { contentAtom, gameStateAtom, hydratedAtom, pendingEventsAtom, profileChosenAtom } from '@/state/core';
import {
  activeLessonAtom,
  continueLessonAtom,
  dismissMomentAtom,
  startLessonAtom,
  submitAnswerAtom,
} from '@/state/lesson';
import { activePetAtom, berriesAtom, speakModeAtom, voiceDiaryAtom, worldViewsAtom } from '@/state/selectors';
import { TODAY } from '../helpers/fixtures';

/** The correct answer for any exercise, as a child who knows everything would play. */
function correctAnswer(exercise: Exercise, wordText: (id: string) => string, sentence: (id: string) => string): ExerciseAnswer {
  switch (exercise.kind) {
    case 'learn-card':
      return { kind: 'seen' };
    case 'listen-pick-picture':
    case 'picture-pick-word':
    case 'lyric-gap':
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
    case 'speak-word':
    case 'speak-sentence':
      return { kind: 'speech', verdict: 'great' };
    case 'story-page':
    case 'song':
      return { kind: 'seen' };
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
      const answer = correctAnswer(exercise, wordText, sentence);
      expect(store.set(submitAnswerAtom, { exerciseId: exercise.id, answer })).toBe(true);
      store.set(continueLessonAtom, exercise.id);
      while (store.get(activeLessonAtom)!.moments.length > 0) store.set(dismissMomentAtom);
      guard += 1;
    }
    expect(store.get(activeLessonAtom)!.completed).toBe(true);
    const summary = store.get(activeLessonAtom)!.summary!;
    expect(summary.correctFirstTry).toBe(summary.scoredTotal);
    expect(summary.bestInARow).toBe(summary.scoredTotal);
    expect(summary.wordsPracticed).toBeGreaterThan(0);
    expect(store.get(berriesAtom)).toBeGreaterThan(berriesBefore);
    expect(store.get(activePetAtom)!.pet.xp).toBeGreaterThan(0);
    expect(store.get(pendingEventsAtom).map((e) => e.type)).toContain('lesson-completed');

    store.set(feedPetAtom, 'sprout');
    await autosave.stop();
    const saved = (await services.repository.load('p1')) as { onboarded: boolean; progress: { lessons: object } };
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

  it('keeps each child separate across profile switches and restarts', async () => {
    const services = createNoopServices(TODAY);
    const store = createStore();
    const autosave = await bootstrapStore(store, services, 'es');
    expect(store.get(profileChosenAtom)).toBe(true);
    store.set(completeOnboardingAtom, { speciesId: 'bubbo', nickname: 'Bubbles', locale: 'es' });

    const second = await store.set(addProfileAtom);
    expect(second).toBe('p2');
    expect(store.get(gameStateAtom).onboarded).toBe(false);
    store.set(completeOnboardingAtom, { speciesId: 'sprout', nickname: 'Kiwi', locale: 'es' });

    await store.set(switchProfileAtom, 'p1');
    expect(store.get(activePetAtom)?.pet.nickname).toBe('Bubbles');
    expect(store.get(profilesAtom).map((p) => p.petNickname)).toEqual(['Bubbles', 'Kiwi']);
    await autosave.stop();

    const again = createStore();
    await bootstrapStore(again, services, 'es');
    expect(again.get(profileChosenAtom)).toBe(false);
    expect(again.get(activePetAtom)?.pet.nickname).toBe('Bubbles');
    await again.set(switchProfileAtom, 'p2');
    expect(again.get(activePetAtom)?.pet.nickname).toBe('Kiwi');
    await again.set(deleteProfileAtom, 'p2');
    expect(again.get(profilesAtom)).toHaveLength(1);
    expect(again.get(activePetAtom)?.pet.nickname).toBe('Bubbles');
  });

  it('keeps voice postcards only with parent opt-in and deletes them when turned off', async () => {
    const services = createNoopServices(TODAY);
    const store = createStore();
    await bootstrapStore(store, services, 'es');
    store.set(completeOnboardingAtom, { speciesId: 'bubbo', nickname: 'Bubbles', locale: 'es' });
    const postcard = { recordingUri: 'file:///tmp/a.m4a', durationMs: 3000, prompt: 'I like apples.' };

    expect(await store.set(savePostcardAtom, postcard)).toBe(false);
    store.set(updateSettingsAtom, { voiceDiary: true });
    expect(await store.set(savePostcardAtom, postcard)).toBe(true);
    const [entry] = store.get(voiceDiaryAtom);
    expect(services.voiceStore.uriFor('p1', entry!.fileName)).not.toBeNull();

    store.set(updateSettingsAtom, { voiceDiary: false });
    expect(store.get(voiceDiaryAtom)).toHaveLength(0);
    expect(services.voiceStore.uriFor('p1', entry!.fileName)).toBeNull();
  });

  it('uses speech recognition only when it is installed and allowed', async () => {
    const withRecognizer = createStore();
    await bootstrapStore(withRecognizer, createNoopServices(TODAY, { recognizer: () => ['dog'] }), 'es');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(withRecognizer.get(speakModeAtom)).toBe('recognition');
    withRecognizer.set(updateSettingsAtom, { speaking: 'self-check' });
    expect(withRecognizer.get(speakModeAtom)).toBe('self-check');

    const expoGo = createStore();
    await bootstrapStore(expoGo, createNoopServices(TODAY), 'es');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(expoGo.get(speakModeAtom)).toBe('self-check');
  });
  it('ignores stale double taps and queues pet moments between exercises', async () => {
    const services = createNoopServices(TODAY);
    const store = createStore();
    await bootstrapStore(store, services, 'es');
    store.set(completeOnboardingAtom, { speciesId: 'sprout', nickname: 'Kiwi', locale: 'es' });
    const firstLesson = store.get(worldViewsAtom)[0]!.nextLesson!;
    store.set(startLessonAtom, firstLesson.id);
    const content = store.get(contentAtom);
    const wordText = (id: string) => content.word(id)?.en ?? '';
    const sentence = (id: string) => content.sentence(id)?.en ?? '';
    const current = () => currentExercise(store.get(activeLessonAtom)!.session)!;

    // A learn card, tapped twice: the second "Next" must not answer the following exercise.
    const card = current();
    expect(card.kind).toBe('learn-card');
    store.set(submitAnswerAtom, { exerciseId: card.id, answer: { kind: 'seen' } });
    store.set(continueLessonAtom, card.id);
    const next = current();
    expect(store.set(submitAnswerAtom, { exerciseId: card.id, answer: { kind: 'seen' } })).toBeNull();
    store.set(continueLessonAtom, card.id);
    expect(current().id).toBe(next.id);
    expect(store.get(activeLessonAtom)!.feedback).toBeNull();

    // Right answers in a row: a moment every 5, and answers wait until it is dismissed.
    let moments = 0;
    for (let guard = 0; guard < 60 && !store.get(activeLessonAtom)!.completed; guard += 1) {
      const exercise = current();
      store.set(submitAnswerAtom, { exerciseId: exercise.id, answer: correctAnswer(exercise, wordText, sentence) });
      store.set(continueLessonAtom, exercise.id);
      const pending = store.get(activeLessonAtom)!.moments;
      if (pending.length > 0) {
        moments += 1;
        expect(pending[0]).toEqual({ kind: 'in-a-row', count: store.get(activeLessonAtom)!.session.inARow });
        const blocked = current();
        expect(
          store.set(submitAnswerAtom, { exerciseId: blocked.id, answer: correctAnswer(blocked, wordText, sentence) }),
        ).toBeNull();
        store.set(dismissMomentAtom);
      }
    }
    expect(store.get(activeLessonAtom)!.completed).toBe(true);
    expect(moments).toBeGreaterThan(0);
  });
});

