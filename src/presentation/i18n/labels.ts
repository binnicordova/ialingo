import type { LessonKind, LessonPlan } from '@/domain/curriculum/types';
import type { QuestKind } from '@/domain/quests/quests';

import type { StringKey, TranslateParams } from './strings';

type Translate = (key: StringKey, params?: TranslateParams) => string;

/** Display name of a lesson slot ("Lesson 2", "Sing-along", "Boss"...). */
export function lessonTitle(plan: LessonPlan, t: Translate): string {
  switch (plan.kind) {
    case 'learn':
      return t('lessonLearn', { n: plan.index });
    case 'story':
      return t('lessonStory');
    case 'song':
      return t('lessonSong');
    case 'speak':
      return t('lessonSpeak');
    case 'review':
      return t('lessonReview');
    case 'boss':
      return t('lessonBoss');
    case 'practice':
      return t('wordGym');
  }
}

/** Map icon for each lesson kind (learn lessons show their number instead). */
export const LESSON_KIND_ICON: Readonly<Record<LessonKind, string>> = {
  learn: '',
  story: '📖',
  song: '🎵',
  speak: '🎤',
  review: '🔁',
  boss: '👑',
  practice: '🏋️',
};

/** Label of each daily quest. */
export const QUEST_LABEL: Readonly<Record<QuestKind, StringKey>> = {
  lessons: 'questLessons',
  perfect: 'questPerfect',
  feed: 'questFeed',
  game: 'questGame',
  practice: 'questPractice',
  listen: 'questListen',
};
