import { isPassingVerdict, type SpeakVerdict } from '../learning/pronunciation';
import type { SentenceId, StoryId, WordId } from './types';

/**
 * Exercise types. Every type can be played without reading: English audio
 * comes from text-to-speech, and pictures are emoji.
 */
export type Exercise =
  /** Introduces a new word: picture, word, translation and audio. Not scored. */
  | { readonly kind: 'learn-card'; readonly id: string; readonly wordId: WordId }
  /** Hear a word, tap its picture. */
  | {
      readonly kind: 'listen-pick-picture';
      readonly id: string;
      readonly answerId: WordId;
      readonly optionIds: readonly WordId[];
    }
  /** See a picture, tap the matching English word (each option can be heard). */
  | {
      readonly kind: 'picture-pick-word';
      readonly id: string;
      readonly answerId: WordId;
      readonly optionIds: readonly WordId[];
    }
  /** Hear a word and see a picture: does it match? */
  | {
      readonly kind: 'true-false';
      readonly id: string;
      readonly spokenWordId: WordId;
      readonly shownWordId: WordId;
    }
  /** Connect pictures with words. */
  | { readonly kind: 'match-pairs'; readonly id: string; readonly wordIds: readonly WordId[] }
  /** Spell the word with letter tiles. */
  | {
      readonly kind: 'spell-word';
      readonly id: string;
      readonly wordId: WordId;
      readonly letters: readonly string[];
    }
  /** Hear a sentence and put the word tiles in order. */
  | {
      readonly kind: 'build-sentence';
      readonly id: string;
      readonly sentenceId: SentenceId;
      readonly tiles: readonly string[];
    }
  /** Say the word out loud (speech recognition in dev builds, self-check in Expo Go). */
  | { readonly kind: 'speak-word'; readonly id: string; readonly wordId: WordId }
  /** Say the whole sentence out loud. */
  | { readonly kind: 'speak-sentence'; readonly id: string; readonly sentenceId: SentenceId }
  /** One page of a picture story, read aloud. Not scored. */
  | {
      readonly kind: 'story-page';
      readonly id: string;
      readonly storyId: StoryId;
      readonly lineIndex: number;
    };

export type ExerciseKind = Exercise['kind'];

/** What the learner did on an exercise. */
export type ExerciseAnswer =
  | { readonly kind: 'seen' }
  | { readonly kind: 'pick'; readonly optionId: WordId }
  | { readonly kind: 'bool'; readonly value: boolean }
  | { readonly kind: 'match'; readonly mistakes: number }
  | { readonly kind: 'spell'; readonly letters: readonly string[] }
  | { readonly kind: 'sentence'; readonly tokens: readonly string[] }
  /** Result of a speaking exercise; 'self-check' when no recognizer is available. */
  | { readonly kind: 'speech'; readonly verdict: SpeakVerdict | 'self-check' };

/** True when the exercise counts toward the score and spaced repetition. */
export function isScored(exercise: Exercise): boolean {
  return exercise.kind !== 'learn-card' && exercise.kind !== 'story-page';
}

/** Words whose mastery is updated by an exercise's result. */
export function targetWordIds(exercise: Exercise): readonly WordId[] {
  switch (exercise.kind) {
    case 'learn-card':
      return [exercise.wordId];
    case 'listen-pick-picture':
    case 'picture-pick-word':
      return [exercise.answerId];
    case 'true-false':
      return [exercise.spokenWordId];
    case 'match-pairs':
      return exercise.wordIds;
    case 'spell-word':
      return [exercise.wordId];
    case 'speak-word':
      return [exercise.wordId];
    case 'build-sentence':
    case 'speak-sentence':
    case 'story-page':
      return [];
  }
}

/** Splits an English sentence into lowercase word tokens without punctuation. */
export function tokenizeSentence(sentence: string): string[] {
  return sentence
    .replace(/[.,!?¿¡]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => t.toLowerCase());
}

/** Lookup functions the evaluator needs, so it does not depend on the content catalog. */
export interface ExerciseLookup {
  wordText(wordId: WordId): string;
  sentenceText(sentenceId: SentenceId): string;
}

/** Decides whether an answer is correct. A learn-card is always correct. */
export function evaluateAnswer(
  exercise: Exercise,
  answer: ExerciseAnswer,
  lookup: ExerciseLookup,
): boolean {
  switch (exercise.kind) {
    case 'learn-card':
    case 'story-page':
      return true;
    case 'speak-word':
    case 'speak-sentence':
      return answer.kind === 'speech' && isPassingVerdict(answer.verdict);
    case 'listen-pick-picture':
    case 'picture-pick-word':
      return answer.kind === 'pick' && answer.optionId === exercise.answerId;
    case 'true-false':
      return (
        answer.kind === 'bool' &&
        answer.value === (exercise.spokenWordId === exercise.shownWordId)
      );
    case 'match-pairs':
      return answer.kind === 'match' && answer.mistakes === 0;
    case 'spell-word':
      return (
        answer.kind === 'spell' &&
        answer.letters.join('').toLowerCase() === lookup.wordText(exercise.wordId).toLowerCase()
      );
    case 'build-sentence':
      return (
        answer.kind === 'sentence' &&
        answer.tokens.map((t) => t.toLowerCase()).join(' ') ===
          tokenizeSentence(lookup.sentenceText(exercise.sentenceId)).join(' ')
      );
  }
}
