import type { Exercise } from '@/domain/curriculum/exercises';
import {
  answerCurrent,
  currentExercise,
  isFinished,
  sessionAccuracy,
  sessionProgress,
  sessionWordResults,
  startSession,
} from '@/domain/learning/lesson-session';
import {
  isDue,
  isLearned,
  LEITNER_INTERVAL_DAYS,
  MAX_BOX,
  pickReviewWords,
  recordAnswer,
} from '@/domain/learning/mastery';
import {
  countLearnedWords,
  createProgress,
  recordLessonCompletion,
  starsForAccuracy,
} from '@/domain/learning/progress';
import { TODAY, TOMORROW } from '../../helpers/fixtures';

describe('Leitner mastery', () => {
  it('moves up on correct answers and down on misses, within bounds', () => {
    let m = recordAnswer(undefined, true, TODAY);
    expect(m.box).toBe(1);
    for (let i = 0; i < 10; i += 1) m = recordAnswer(m, true, TODAY);
    expect(m.box).toBe(MAX_BOX);
    m = recordAnswer(m, false, TODAY);
    expect(m.box).toBe(MAX_BOX - 1);
    expect(recordAnswer(undefined, false, TODAY).box).toBe(0);
  });

  it('becomes due after the box interval', () => {
    const m = { box: 2, lastReviewDay: TODAY, seen: 3, correct: 3 };
    expect(isDue(m, TODAY)).toBe(false);
    expect(isDue(m, `2026-03-${10 + LEITNER_INTERVAL_DAYS[2]}`)).toBe(true);
  });

  it('counts a word as learned from box 2', () => {
    expect(isLearned({ box: 1, lastReviewDay: TODAY, seen: 1, correct: 1 })).toBe(false);
    expect(isLearned({ box: 2, lastReviewDay: TODAY, seen: 2, correct: 2 })).toBe(true);
  });

  it('prefers due, low-box, older words for review and ignores unseen ones', () => {
    const mastery = {
      a: { box: 3, lastReviewDay: '2026-03-01', seen: 4, correct: 4 },
      b: { box: 1, lastReviewDay: '2026-03-09', seen: 1, correct: 1 },
      c: { box: 5, lastReviewDay: TODAY, seen: 9, correct: 9 },
    };
    expect(pickReviewWords(mastery, ['a', 'b', 'c', 'unseen'], TODAY, 3)).toEqual(['b', 'a', 'c']);
  });
});

describe('lesson session', () => {
  const exercises: Exercise[] = [
    { kind: 'learn-card', id: 'e1', wordId: 'w.dog' },
    { kind: 'listen-pick-picture', id: 'e2', answerId: 'w.dog', optionIds: ['w.dog', 'w.cat'] },
    { kind: 'match-pairs', id: 'e3', wordIds: ['w.dog', 'w.cat'] },
  ];

  it('re-queues a missed exercise once and scores only the first attempt', () => {
    let s = startSession(exercises);
    s = answerCurrent(s, true); // learn card
    s = answerCurrent(s, false); // miss e2: it goes to the end
    expect(currentExercise(s)?.id).toBe('e3');
    s = answerCurrent(s, true); // e3
    expect(currentExercise(s)?.id).toBe('e2');
    s = answerCurrent(s, false); // miss again: no second retry
    expect(isFinished(s)).toBe(true);
    expect(sessionAccuracy(s)).toBe(0.5);
    expect(sessionProgress(s)).toBe(1);
  });

  it('reports word results for mastery (not for learn cards)', () => {
    let s = startSession(exercises);
    s = answerCurrent(s, true);
    s = answerCurrent(s, true);
    s = answerCurrent(s, true);
    expect(sessionWordResults(s)).toEqual([
      { wordId: 'w.dog', correct: true },
      { wordId: 'w.dog', correct: true },
      { wordId: 'w.cat', correct: true },
    ]);
  });
});

describe('progress', () => {
  it.each([
    [1, 3],
    [0.9, 3],
    [0.75, 2],
    [0.2, 1],
    [0, 1],
  ])('accuracy %f gives %i stars (never zero)', (accuracy, stars) => {
    expect(starsForAccuracy(accuracy)).toBe(stars);
  });

  it('keeps the best stars, counts plays and play days, updates mastery', () => {
    let progress = createProgress();
    const first = recordLessonCompletion(progress, {
      lessonId: 'l1',
      accuracy: 1,
      wordResults: [
        { wordId: 'a', correct: true },
        { wordId: 'a', correct: true },
      ],
      today: TODAY,
    });
    expect(first.perfect).toBe(true);
    expect(first.firstCompletion).toBe(true);
    progress = first.progress;
    const second = recordLessonCompletion(progress, {
      lessonId: 'l1',
      accuracy: 0.5,
      wordResults: [{ wordId: 'b', correct: false }],
      today: TOMORROW,
    });
    expect(second.firstCompletion).toBe(false);
    expect(second.progress.lessons.l1).toEqual({ bestStars: 3, plays: 2, lastPlayedDay: TOMORROW });
    expect(second.progress.daysPlayed).toEqual([TODAY, TOMORROW]);
    expect(second.progress.perfectLessons).toBe(1);
    expect(countLearnedWords(second.progress)).toBe(1);
  });
});
