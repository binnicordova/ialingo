import type { CharacterId } from '../curriculum/types';
import type { LocalizedText } from '../shared/locale';

export type CharacterKind =
  | 'owl'
  | 'mouse'
  | 'robot'
  | 'dino'
  | 'turtle'
  | 'coconut'
  | 'cloud'
  | 'lion'
  | 'parrot'
  | 'beaver';

/** Look parameters for the 2D SVG renderer. */
export interface CharacterLook {
  readonly kind: CharacterKind;
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
}

/**
 * A guide who hosts worlds. Guides give instructions in the child's language
 * and cheer in simple English, so classroom phrases are learned by repetition.
 */
export interface Character {
  readonly id: CharacterId;
  readonly name: string;
  readonly role: LocalizedText;
  readonly look: CharacterLook;
  /** Text-to-speech voice shaping, so every guide sounds different. */
  readonly voice: { readonly pitch: number; readonly rate: number };
  readonly greeting: LocalizedText;
  /** Short English cheers, for example "Great job!". */
  readonly cheers: readonly string[];
  /** Short English encouragement after a miss, for example "Almost!". */
  readonly encouragements: readonly string[];
}
