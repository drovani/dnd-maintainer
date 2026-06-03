import type { ClassId } from '@/lib/dnd-helpers';
import type { SpellId } from '@/lib/sources/spells';

export type { SpellId };

export type SpellSchool =
  | 'abjuration'
  | 'conjuration'
  | 'divination'
  | 'enchantment'
  | 'evocation'
  | 'illusion'
  | 'necromancy'
  | 'transmutation';

export interface SpellComponents {
  readonly verbal: boolean;
  readonly somatic: boolean;
  readonly material: string | false;
}

export interface SpellDef {
  readonly id: string;
  readonly level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  readonly school: SpellSchool;
  readonly ritual: boolean;
  readonly concentration: boolean;
  readonly castingTime: string;
  readonly range: string;
  readonly components: SpellComponents;
  readonly duration: string;
  readonly nativeClasses: readonly ClassId[];
}
