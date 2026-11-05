import type { AchievementId } from '@/domain/achievements/achievement';
import type { LessonId, SpeciesId, WorldId } from '@/domain/curriculum/types';
import type { Stars } from '@/domain/learning/progress';
import type { GrowthStage } from '@/domain/pets/leveling';
import type { AccessoryId } from '@/domain/pets/pet';

/**
 * Domain events emitted by commands. The UI uses them for celebrations
 * (level-up, new egg, badges) without re-deriving what changed.
 */
export type GameEvent =
  | {
      readonly type: 'lesson-completed';
      readonly lessonId: LessonId;
      readonly stars: Stars;
      readonly perfect: boolean;
      readonly berries: number;
      readonly xp: number;
      readonly firstCompletion: boolean;
    }
  | {
      readonly type: 'pet-leveled-up';
      readonly speciesId: SpeciesId;
      readonly level: number;
      readonly stage: GrowthStage;
      readonly stageChanged: boolean;
    }
  | {
      readonly type: 'egg-earned';
      readonly speciesId: SpeciesId;
      readonly source: 'world-boss' | 'achievement' | 'shop';
    }
  | { readonly type: 'achievement-unlocked'; readonly achievementId: AchievementId }
  | { readonly type: 'world-unlocked'; readonly worldId: WorldId }
  | { readonly type: 'pet-hatched'; readonly speciesId: SpeciesId }
  | { readonly type: 'pet-fed'; readonly speciesId: SpeciesId }
  | {
      readonly type: 'berries-earned';
      readonly amount: number;
      readonly reason: 'daily-gift' | 'achievement' | 'welcome';
    }
  | { readonly type: 'accessory-bought'; readonly accessoryId: AccessoryId }
  | { readonly type: 'not-enough-berries'; readonly needed: number };

export type GameEventType = GameEvent['type'];
