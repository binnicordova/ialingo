import type { SpeciesId, WorldId } from '../curriculum/types';
import type { LocalizedText } from '../shared/locale';

export type BodyShape = 'round' | 'tall' | 'wide';
export type EarStyle = 'none' | 'cat' | 'bunny' | 'round' | 'floppy' | 'horns' | 'antenna';
export type TailStyle = 'none' | 'fluffy' | 'long' | 'fish' | 'curly' | 'stub';
export type ExtraFeature = 'none' | 'wings' | 'spikes' | 'horn' | 'shell' | 'mane' | 'fins' | 'leaf';
export type SkinPattern = 'plain' | 'belly' | 'spots';
export type EyeStyle = 'round' | 'sleepy' | 'sparkle';

/**
 * Data-only description of a pet's look. The same blueprint drives the 3D
 * model (three.js) and the 2D portrait (SVG), so the two always match and new
 * pets need no art pipeline.
 */
export interface PetBlueprint {
  readonly body: BodyShape;
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly ears: EarStyle;
  readonly tail: TailStyle;
  readonly extra: ExtraFeature;
  readonly pattern: SkinPattern;
  readonly eyes: EyeStyle;
}

export type PetUnlock =
  | { readonly type: 'starter' }
  | { readonly type: 'world-boss'; readonly worldId: WorldId }
  | { readonly type: 'achievement'; readonly achievementId: string };

export interface PetSpecies {
  readonly id: SpeciesId;
  /** Proper name; the same in every locale. */
  readonly name: string;
  /** Short description, for example "the bubbly water pup". */
  readonly title: LocalizedText;
  /** English phrase the pet says when tapped (extra listening practice). */
  readonly catchphrase: string;
  readonly blueprint: PetBlueprint;
  readonly unlock: PetUnlock;
  /** Starter pets the child did not pick can be adopted later for berries. */
  readonly shopPrice?: number;
}
