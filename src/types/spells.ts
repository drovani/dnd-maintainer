import type { ClassId } from '@/lib/dnd-helpers';

export const SPELL_SCHOOLS = [
  'abjuration',
  'conjuration',
  'divination',
  'enchantment',
  'evocation',
  'illusion',
  'necromancy',
  'transmutation',
] as const;

export type SpellSchool = (typeof SPELL_SCHOOLS)[number];

export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface SpellDef {
  readonly id: string;
  readonly level: SpellLevel;
  readonly school: SpellSchool;
  readonly ritual: boolean;
  readonly concentration: boolean;
  readonly castingTime: string;
  readonly range: string;
  readonly components: string;
  readonly duration: string;
  readonly classes: readonly ClassId[];
}
