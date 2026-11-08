import type { Exercise } from '@/domain/curriculum/exercises';
import {
  answerCurrent,
  currentExercise,
  firstQuizIds,
  isFinished,
  isSecondTry,
  LESSON_FEEL,
  momentsBetween,
  sessionAccuracy,
  sessionProgress,
  sessionTally,
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
import { addDays } from '@/domain/shared/day';
import { TODAY, TOMORROW } from '../../helpers/fixtures';

describe('Leitner mastery', () => {
  it('promotes only on due reviews, demotes on misses, within bounds', () => {
    let m = recordAnswer(undefined, true, TODAY);
    expect(m.box).toBe(1);
    // The same word again in the same session is practice, not promotion.
    m = recordAnswer(m, true, TODAY);
    expect(m).toMatchObject({ box: 1, lastReviewDay: TODAY, seen: 2, correct: 2 });
    // Reviews on schedule climb one box each, up to the top.
    let day = TODAY;
    for (let i = 0; i < 10; i += 1) {
      day = addDays(day, LEITNER_INTERVAL_DAYS[m.box] ?? 1);
      m = recordAnswer(m, true, day);
    }
    expect(m.box).toBe(MAX_BOX);
    m = recordAnswer(m, false, day);
    expect(m.box).toBe(MAX_BOX - 1);
    expect(recordAnswer(undefined, false, TODAY).box).toBe(0);
  });

  it('needs several days to master a word', () => {
    let m = recordAnswer(undefined, true, TODAY);
    for (let i = 0; i < 20; i += 1) m = recordAnswer(m, true, TODAY);
    expect(isLearned(m)).toBe(false);
    m = recordAnswer(m, true, TOMORROW);
    expect(isLearned(m)).toBe(true);
  });

  it('adds calendar days across months', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 14)).toBe('2027-01-14');
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

  it('counts right answers in a row, ignores unscored cards and resets quietly on a miss', () => {
    let s = startSession(exercises);
    s = answerCurrent(s, true); // learn card: not scored
    expect(s.inARow).toBe(0);
    s = answerCurrent(s, true);
    expect(s.inARow).toBe(1);
    s = answerCurrent(s, false);
    expect(s.inARow).toBe(0);
    expect(s.bestInARow).toBe(1);
    expect(sessionTally(s)).toEqual({ correct: 1, total: 2 });
  });

  it('finds the first quiz of each new word (never a learn card, never a review word)', () => {
    const lesson: Exercise[] = [
      { kind: 'learn-card', id: 'c1', wordId: 'w.dog' },
      { kind: 'listen-pick-picture', id: 'q1', answerId: 'w.dog', optionIds: ['w.dog', 'w.cat'] },
      { kind: 'learn-card', id: 'c2', wordId: 'w.cat' },
      { kind: 'picture-pick-word', id: 'q2', answerId: 'w.cat', optionIds: ['w.dog', 'w.cat'] },
      { kind: 'match-pairs', id: 'q3', wordIds: ['w.dog', 'w.cat'] },
      { kind: 'listen-pick-picture', id: 'q4', answerId: 'w.old', optionIds: ['w.old', 'w.cat'] },
    ];
    expect([...firstQuizIds(lesson, ['w.dog', 'w.cat'])]).toEqual(['q1', 'q2']);
  });

  it('announces the second try once, before the first re-queued exercise', () => {
    let s = startSession(exercises);
    s = answerCurrent(s, true);
    const before = s;
    s = answerCurrent(s, false); // e2 goes to the end, e3 is next
    expect(momentsBetween(before, s)).toEqual([]);
    const beforeRetry = s;
    s = answerCurrent(s, true); // e3 done, e2 comes back
    expect(isSecondTry(s)).toBe(true);
    expect(momentsBetween(beforeRetry, s)).toEqual([{ kind: 'second-try' }]);
  });

  it('cheers every LESSON_FEEL.inARowMoment answers in a row, but not after the last exercise', () => {
    const many: Exercise[] = Array.from({ length: LESSON_FEEL.inARowMoment * 2 + 1 }, (_, i) => ({
      kind: 'listen-pick-picture',
      id: `x${i}`,
      answerId: 'w.dog',
      optionIds: ['w.dog', 'w.cat'],
    }));
    let s = startSession(many);
    const cheers: number[] = [];
    while (!isFinished(s)) {
      const next = answerCurrent(s, true);
      for (const m of momentsBetween(s, next)) if (m.kind === 'in-a-row') cheers.push(m.count);
      s = next;
    }
    expect(cheers).toEqual([LESSON_FEEL.inARowMoment, LESSON_FEEL.inARowMoment * 2]);

    const exact = startSession(many.slice(0, LESSON_FEEL.inARowMoment));
    let e = exact;
    let last: ReturnType<typeof momentsBetween> = [];
    while (!isFinished(e)) {
      const next = answerCurrent(e, true);
      last = momentsBetween(e, next);
      e = next;
    }
    expect(last).toEqual([]);
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
    // Two correct answers on one day do not make a word "learned" yet.
    expect(countLearnedWords(progress)).toBe(0);
    const second = recordLessonCompletion(progress, {
      lessonId: 'l1',
      accuracy: 0.5,
      wordResults: [
        { wordId: 'a', correct: true },
        { wordId: 'b', correct: false },
      ],
      today: TOMORROW,
    });
    expect(second.firstCompletion).toBe(false);
    expect(second.progress.lessons.l1).toEqual({ bestStars: 3, plays: 2, lastPlayedDay: TOMORROW });
    expect(second.progress.daysPlayed).toEqual([TODAY, TOMORROW]);
    expect(second.progress.perfectLessons).toBe(1);
    expect(countLearnedWords(second.progress)).toBe(1);
  });
});
