import type { ClassId } from '@/lib/dnd-helpers';
import type { SpellDef } from '@/types/spells';

export const SPELL_CATALOG = [
  {
    id: 'druidcraft',
    level: 0,
    school: 'transmutation',
    ritual: false,
    concentration: false,
    castingTime: 'Action',
    range: '30 feet',
    components: { verbal: true, somatic: true, material: false },
    duration: 'Instantaneous',
    nativeClasses: ['druid'],
  },
  {
    id: 'guidance',
    level: 0,
    school: 'divination',
    ritual: false,
    concentration: true,
    castingTime: 'Action',
    range: 'Touch',
    components: { verbal: true, somatic: true, material: false },
    duration: '1 minute',
    nativeClasses: ['cleric', 'druid'],
  },
  {
    id: 'mending',
    level: 0,
    school: 'transmutation',
    ritual: false,
    concentration: false,
    castingTime: '1 minute',
    range: 'Touch',
    components: {
      verbal: true,
      somatic: true,
      material: 'two lodestones',
    },
    duration: 'Instantaneous',
    nativeClasses: ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'],
  },
  {
    id: 'message',
    level: 0,
    school: 'transmutation',
    ritual: false,
    concentration: false,
    castingTime: 'Action',
    range: '120 feet',
    components: { verbal: true, somatic: true, material: 'a copper wire' },
    duration: '1 round',
    nativeClasses: ['bard', 'druid', 'sorcerer', 'wizard'],
  },
  {
    id: 'poison-spray',
    level: 0,
    school: 'necromancy',
    ritual: false,
    concentration: false,
    castingTime: 'Action',
    range: '30 feet',
    components: { verbal: true, somatic: true, material: false },
    duration: 'Instantaneous',
    nativeClasses: ['druid', 'sorcerer', 'warlock', 'wizard'],
  },
  {
    id: 'produce-flame',
    level: 0,
    school: 'conjuration',
    ritual: false,
    concentration: false,
    castingTime: 'Action',
    range: 'Self',
    components: { verbal: true, somatic: true, material: false },
    duration: '10 minutes',
    nativeClasses: ['druid'],
  },
  {
    id: 'resistance',
    level: 0,
    school: 'abjuration',
    ritual: false,
    concentration: true,
    castingTime: 'Action',
    range: 'Touch',
    components: { verbal: true, somatic: true, material: 'a miniature cloak' },
    duration: '1 minute',
    nativeClasses: ['cleric', 'druid'],
  },
  {
    id: 'shillelagh',
    level: 0,
    school: 'transmutation',
    ritual: false,
    concentration: false,
    castingTime: 'Bonus Action',
    range: 'Self',
    components: { verbal: true, somatic: true, material: 'mistletoe and shamrock leaves, plus a club or quarterstaff' },
    duration: '1 minute',
    nativeClasses: ['druid'],
  },
  {
    id: 'spare-the-dying',
    level: 0,
    school: 'necromancy',
    ritual: false,
    concentration: false,
    castingTime: 'Action',
    range: '15 feet',
    components: { verbal: true, somatic: true, material: false },
    duration: 'Instantaneous',
    nativeClasses: ['cleric', 'druid'],
  },
  {
    id: 'thorn-whip',
    level: 0,
    school: 'transmutation',
    ritual: false,
    concentration: false,
    castingTime: 'Action',
    range: '30 feet',
    components: { verbal: true, somatic: true, material: 'the stem of a plant with thorns' },
    duration: 'Instantaneous',
    nativeClasses: ['druid'],
  },
  {
    id: 'speak-with-animals',
    level: 1,
    school: 'divination',
    ritual: true,
    concentration: false,
    castingTime: '1 minute',
    range: 'Self',
    components: { verbal: true, somatic: true, material: false },
    duration: '10 minutes',
    nativeClasses: ['bard', 'druid', 'ranger'],
  },
  {
    id: 'commune-with-nature',
    level: 5,
    school: 'divination',
    ritual: true,
    concentration: false,
    castingTime: '1 minute',
    range: 'Self',
    components: { verbal: true, somatic: true, material: false },
    duration: 'Instantaneous',
    nativeClasses: ['druid', 'ranger'],
  },
] as const satisfies readonly SpellDef[];

export type SpellId = (typeof SPELL_CATALOG)[number]['id'];

export function isSpellId(id: string): id is SpellId {
  return (SPELL_CATALOG as readonly { id: string }[]).some((s) => s.id === id);
}

export function getSpellDef(id: string): SpellDef | undefined {
  return (SPELL_CATALOG as readonly SpellDef[]).find((s) => s.id === id);
}

export function requireSpellDef(id: string): SpellDef {
  const def = getSpellDef(id);
  if (!def) {
    throw new Error(`Unknown spell id "${id}" — no entry in SPELL_CATALOG`);
  }
  return def;
}

export function getSpellsForList(classId: ClassId, level?: number): readonly SpellDef[] {
  return (SPELL_CATALOG as readonly SpellDef[]).filter(
    (s) => (s.nativeClasses as readonly string[]).includes(classId) && (level === undefined || s.level === level)
  );
}
