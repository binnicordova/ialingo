import type { LocalizedText } from '../shared/locale';
import type { AccessoryId } from './pet';

export type AccessoryModel =
  | 'party-hat'
  | 'crown'
  | 'bow'
  | 'glasses'
  | 'flower'
  | 'scarf'
  | 'headphones'
  | 'cap';

/** A cosmetic item. Berries buy looks only, never progress (Pillar 2). */
export interface Accessory {
  readonly id: AccessoryId;
  readonly name: LocalizedText;
  readonly emoji: string;
  readonly price: number;
  readonly model: AccessoryModel;
  readonly color: string;
}
