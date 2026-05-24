// D&D 5e Helper Functions and Data
import type { AbilityKey } from '@/types/database';
import { getLogger } from '@/lib/logger';

const logger = getLogger('dnd-helpers');

export type { AbilityKey };
export type AbilityName = AbilityKey;

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getProficiencyBonus(level: number): number {
  if (level < 5) return 2;
  if (level < 9) return 3;
  if (level < 13) return 4;
  if (level < 17) return 5;
  return 6;
}

export type ExhaustionLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function exhaustionPenalty(level: ExhaustionLevel) {
  return {
    d20Penalty: level * 2,
    speedPenalty: level * 5,
    dead: level === 6,
  } as const;
}

export function getSpellSlots(className: string, level: number): number[] {
  // Returns spell slots for levels 1-9 (index 0 is level 1)
  const spellcasters: Record<string, Record<number, number[]>> = {
    bard: {
      1: [2],
      2: [3],
      3: [4, 2],
      4: [4, 3],
      5: [4, 3, 2],
      6: [4, 3, 3],
      7: [4, 3, 3, 1],
      8: [4, 3, 3, 2],
      9: [4, 3, 3, 3, 1],
      10: [4, 3, 3, 3, 2],
      11: [4, 3, 3, 3, 2, 1],
      12: [4, 3, 3, 3, 2, 1],
      13: [4, 3, 3, 3, 2, 1, 1],
      14: [4, 3, 3, 3, 2, 1, 1],
      15: [4, 3, 3, 3, 2, 1, 1, 1],
      16: [4, 3, 3, 3, 2, 1, 1, 1],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
      18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
      19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
    },
    cleric: {
      1: [2],
      2: [3],
      3: [4, 2],
      4: [4, 3],
      5: [4, 3, 2],
      6: [4, 3, 3],
      7: [4, 3, 3, 1],
      8: [4, 3, 3, 2],
      9: [4, 3, 3, 3, 1],
      10: [4, 3, 3, 3, 2],
      11: [4, 3, 3, 3, 2, 1],
      12: [4, 3, 3, 3, 2, 1],
      13: [4, 3, 3, 3, 2, 1, 1],
      14: [4, 3, 3, 3, 2, 1, 1],
      15: [4, 3, 3, 3, 2, 1, 1, 1],
      16: [4, 3, 3, 3, 2, 1, 1, 1],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
      18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
      19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
    },
    druid: {
      1: [2],
      2: [3],
      3: [4, 2],
      4: [4, 3],
      5: [4, 3, 2],
      6: [4, 3, 3],
      7: [4, 3, 3, 1],
      8: [4, 3, 3, 2],
      9: [4, 3, 3, 3, 1],
      10: [4, 3, 3, 3, 2],
      11: [4, 3, 3, 3, 2, 1],
      12: [4, 3, 3, 3, 2, 1],
      13: [4, 3, 3, 3, 2, 1, 1],
      14: [4, 3, 3, 3, 2, 1, 1],
      15: [4, 3, 3, 3, 2, 1, 1, 1],
      16: [4, 3, 3, 3, 2, 1, 1, 1],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
      18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
      19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
    },
    paladin: {
      1: [],
      2: [2],
      3: [3],
      4: [3],
      5: [4, 2],
      6: [4, 2],
      7: [4, 3],
      8: [4, 3],
      9: [4, 3, 2],
      10: [4, 3, 2],
      11: [4, 3, 3],
      12: [4, 3, 3],
      13: [4, 3, 3, 1],
      14: [4, 3, 3, 1],
      15: [4, 3, 3, 2],
      16: [4, 3, 3, 2],
      17: [4, 3, 3, 3, 1],
      18: [4, 3, 3, 3, 1],
      19: [4, 3, 3, 3, 2],
      20: [4, 3, 3, 3, 2],
    },
    ranger: {
      1: [],
      2: [2],
      3: [3],
      4: [3],
      5: [4, 2],
      6: [4, 2],
      7: [4, 3],
      8: [4, 3],
      9: [4, 3, 2],
      10: [4, 3, 2],
      11: [4, 3, 3],
      12: [4, 3, 3],
      13: [4, 3, 3, 1],
      14: [4, 3, 3, 1],
      15: [4, 3, 3, 2],
      16: [4, 3, 3, 2],
      17: [4, 3, 3, 3, 1],
      18: [4, 3, 3, 3, 1],
      19: [4, 3, 3, 3, 2],
      20: [4, 3, 3, 3, 2],
    },
    sorcerer: {
      1: [2],
      2: [3],
      3: [4, 2],
      4: [4, 3],
      5: [4, 3, 2],
      6: [4, 3, 3],
      7: [4, 3, 3, 1],
      8: [4, 3, 3, 2],
      9: [4, 3, 3, 3, 1],
      10: [4, 3, 3, 3, 2],
      11: [4, 3, 3, 3, 2, 1],
      12: [4, 3, 3, 3, 2, 1],
      13: [4, 3, 3, 3, 2, 1, 1],
      14: [4, 3, 3, 3, 2, 1, 1],
      15: [4, 3, 3, 3, 2, 1, 1, 1],
      16: [4, 3, 3, 3, 2, 1, 1, 1],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
      18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
      19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
    },
    wizard: {
      1: [2],
      2: [3],
      3: [4, 2],
      4: [4, 3],
      5: [4, 3, 2],
      6: [4, 3, 3],
      7: [4, 3, 3, 1],
      8: [4, 3, 3, 2],
      9: [4, 3, 3, 3, 1],
      10: [4, 3, 3, 3, 2],
      11: [4, 3, 3, 3, 2, 1],
      12: [4, 3, 3, 3, 2, 1],
      13: [4, 3, 3, 3, 2, 1, 1],
      14: [4, 3, 3, 3, 2, 1, 1],
      15: [4, 3, 3, 3, 2, 1, 1, 1],
      16: [4, 3, 3, 3, 2, 1, 1, 1],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
      18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
      19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
    },
  };

  return spellcasters[className.toLowerCase()]?.[level] || [];
}

const PACT_MAGIC_PROGRESSION: Readonly<Record<number, { readonly count: number; readonly slotLevel: number }>> = {
  1: { count: 1, slotLevel: 1 },
  2: { count: 2, slotLevel: 1 },
  3: { count: 2, slotLevel: 2 },
  4: { count: 2, slotLevel: 2 },
  5: { count: 2, slotLevel: 3 },
  6: { count: 2, slotLevel: 3 },
  7: { count: 2, slotLevel: 4 },
  8: { count: 2, slotLevel: 4 },
  9: { count: 2, slotLevel: 5 },
  10: { count: 2, slotLevel: 5 },
  11: { count: 3, slotLevel: 5 },
  12: { count: 3, slotLevel: 5 },
  13: { count: 3, slotLevel: 5 },
  14: { count: 3, slotLevel: 5 },
  15: { count: 3, slotLevel: 5 },
  16: { count: 3, slotLevel: 5 },
  17: { count: 4, slotLevel: 5 },
  18: { count: 4, slotLevel: 5 },
  19: { count: 4, slotLevel: 5 },
  20: { count: 4, slotLevel: 5 },
};

export function getPactMagicSlots(level: number): { readonly count: number; readonly slotLevel: number } {
  return PACT_MAGIC_PROGRESSION[level] ?? { count: 0, slotLevel: 0 };
}

const PREPARED_CASTER_CLASSES: ReadonlySet<string> = new Set(['cleric', 'druid', 'wizard', 'paladin', 'ranger']);

export function getPreparedSpellCount(classId: string, classLevel: number, abilityMod: number): number {
  if (!PREPARED_CASTER_CLASSES.has(classId)) return 0;
  return Math.max(1, classLevel + abilityMod);
}

export interface DndSpecies {
  readonly id: SpeciesId;
  readonly size: SizeId;
  readonly speed: number;
  readonly languages: readonly LanguageId[];
  readonly languageChoices?: number;
  readonly lineages?: readonly string[];
}

export interface DndClass {
  readonly id: ClassId;
  readonly hitDie: number;
  readonly primaryAbility: AbilityName;
  readonly savingThrowProficiencies: readonly AbilityName[];
  readonly spellcastingAbility?: AbilityName;
  readonly skillChoices: number;
  /** Skills this class can choose from (by skill id). null = can choose from any skill (e.g., Bard). */
  readonly skillPool: readonly SkillId[] | null;
  readonly armorProficiencies: readonly ArmorProficiencyId[];
  readonly weaponProficiencies: readonly WeaponProficiencyId[];
  readonly toolProficiencies: readonly ToolProficiencyId[];
  readonly toolChoices?: { readonly count: number; readonly from: readonly ToolProficiencyId[] };
}

export interface DndSkill {
  readonly id: SkillId;
  readonly ability: AbilityName;
}

export interface DndBackground {
  readonly id: BackgroundId;
}

export const DND_SCRIPTS = ['common', 'dwarvish', 'elvish', 'draconic', 'infernal', 'celestial'] as const;

export type ScriptId = (typeof DND_SCRIPTS)[number];

export const DND_CREATURE_TYPES = [
  'humans',
  'dwarves',
  'elves',
  'gnomes',
  'halflings',
  'orcs',
  'ogres',
  'giants',
  'goblinoids',
  'dragons',
  'dragonborn',
  'demons',
  'devils',
  'celestials',
  'elementals',
  'aboleths',
  'cloakers',
  'fey',
  'underworld-traders',
] as const;

export type CreatureTypeId = (typeof DND_CREATURE_TYPES)[number];

export const DND_SIZES = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'] as const;

export type SizeId = (typeof DND_SIZES)[number];

export const DND_LANGUAGE_DATA = [
  { id: 'common', category: 'standard', typicalSpeakers: ['humans'], script: 'common' },
  { id: 'common-sign', category: 'standard', typicalSpeakers: [] as readonly CreatureTypeId[], script: null },
  { id: 'dwarvish', category: 'standard', typicalSpeakers: ['dwarves'], script: 'dwarvish' },
  { id: 'elvish', category: 'standard', typicalSpeakers: ['elves'], script: 'elvish' },
  { id: 'giant', category: 'standard', typicalSpeakers: ['ogres', 'giants'], script: 'dwarvish' },
  { id: 'gnomish', category: 'standard', typicalSpeakers: ['gnomes'], script: 'dwarvish' },
  { id: 'goblin', category: 'standard', typicalSpeakers: ['goblinoids'], script: 'dwarvish' },
  { id: 'halfling', category: 'standard', typicalSpeakers: ['halflings'], script: 'common' },
  { id: 'orc', category: 'standard', typicalSpeakers: ['orcs'], script: 'dwarvish' },
  { id: 'abyssal', category: 'exotic', typicalSpeakers: ['demons'], script: 'infernal' },
  { id: 'celestial', category: 'exotic', typicalSpeakers: ['celestials'], script: 'celestial' },
  { id: 'draconic', category: 'exotic', typicalSpeakers: ['dragons', 'dragonborn'], script: 'draconic' },
  { id: 'deepspeech', category: 'exotic', typicalSpeakers: ['aboleths', 'cloakers'], script: null },
  { id: 'infernal', category: 'exotic', typicalSpeakers: ['devils'], script: 'infernal' },
  { id: 'primordial', category: 'exotic', typicalSpeakers: ['elementals'], script: 'dwarvish' },
  { id: 'sylvan', category: 'exotic', typicalSpeakers: ['fey'], script: 'elvish' },
  { id: 'undercommon', category: 'exotic', typicalSpeakers: ['underworld-traders'], script: 'elvish' },
] as const;

export type LanguageId = (typeof DND_LANGUAGE_DATA)[number]['id'];
export type LanguageCategory = (typeof DND_LANGUAGE_DATA)[number]['category'];
export const DND_LANGUAGES: readonly LanguageId[] = DND_LANGUAGE_DATA.map((l) => l.id);

export interface DndLanguage {
  readonly id: LanguageId;
  readonly category: LanguageCategory;
  readonly typicalSpeakers: readonly CreatureTypeId[];
  readonly script: ScriptId | null;
}

export const DND_ARMOR_PROFICIENCIES = [
  'light',
  'medium',
  'medium-nonmetal',
  'heavy',
  'shields',
  'shields-nonmetal',
] as const;

export type ArmorProficiencyId = (typeof DND_ARMOR_PROFICIENCIES)[number];

export const DND_WEAPON_PROFICIENCIES = [
  'simple',
  'martial',
  'handcrossbow',
  'lightcrossbow',
  'longsword',
  'shortsword',
  'rapier',
  'shortbow',
  'longbow',
  'battleaxe',
  'handaxe',
  'lighthammer',
  'warhammer',
  'club',
  'dagger',
  'dart',
  'javelin',
  'mace',
  'quarterstaff',
  'scimitar',
  'sickle',
  'sling',
  'spear',
] as const;

export type WeaponProficiencyId = (typeof DND_WEAPON_PROFICIENCIES)[number];

export const DND_TOOL_PROFICIENCIES = [
  'thievestools',
  'herbalismkit',
  'smithstools',
  'brewersupplies',
  'masonstools',
  'bagpipes',
  'drum',
  'dulcimer',
  'flute',
  'lute',
  'lyre',
  'horn',
  'panflute',
  'shawm',
  'viol',
  'vehicles-land',
  'vehicles-water',
  'gaming-set-dice',
  'gaming-set-cards',
  'gaming-set-dragonchess',
  'gaming-set-three-dragon-ante',
  'disguisekit',
  'poisonerskit',
  'calligrapherstools',
  'carpentertools',
  'cartographerstools',
  'cobblerstools',
  'cooksutensils',
  'forgerykit',
  'glassblowerstools',
  'jewelerstools',
  'leatherworkerstools',
  'navigatorstools',
  'painterstools',
  'potterstools',
  'tinkerstools',
  'weaverstools',
  'woodcarverstools',
] as const;

export type ToolProficiencyId = (typeof DND_TOOL_PROFICIENCIES)[number];

export const DND_SPECIES = [
  {
    id: 'aasimar',
    size: 'medium',
    speed: 30,
    languages: ['common'],
    languageChoices: 2,
  },
  {
    id: 'dragonborn',
    size: 'medium',
    speed: 30,
    languages: ['common'],
    languageChoices: 2,
    lineages: [
      'black',
      'blue',
      'brass',
      'bronze',
      'copper',
      'gold',
      'green',
      'red',
      'silver',
      'white',
      'amethyst',
      'crystal',
      'emerald',
      'sapphire',
      'topaz',
    ] as const,
  },
  {
    id: 'dwarf',
    size: 'medium',
    speed: 30,
    languages: ['common'],
    languageChoices: 2,
  },
  {
    id: 'elf',
    size: 'medium',
    speed: 30,
    languages: ['common'],
    languageChoices: 2,
    lineages: ['drow', 'high-elf', 'wood-elf'] as const,
  },
  {
    id: 'gnome',
    size: 'small',
    speed: 30,
    languages: ['common'],
    languageChoices: 2,
    lineages: ['forest', 'rock', 'deep'] as const,
  },
  {
    id: 'goliath',
    size: 'medium',
    speed: 35,
    languages: ['common'],
    languageChoices: 2,
    lineages: ['cloud', 'fire', 'frost', 'hill', 'stone', 'storm'] as const,
  },
  {
    id: 'halfling',
    size: 'small',
    speed: 30,
    languages: ['common'],
    languageChoices: 2,
  },
  {
    id: 'human',
    size: 'medium',
    speed: 30,
    languages: ['common'],
    languageChoices: 2,
  },
  {
    id: 'orc',
    size: 'medium',
    speed: 30,
    languages: ['common'],
    languageChoices: 2,
  },
  {
    id: 'tiefling',
    size: 'medium',
    speed: 30,
    languages: ['common'],
    languageChoices: 2,
    lineages: ['abyssal', 'chthonic', 'infernal'] as const,
  },
] as const;

export type SpeciesId = (typeof DND_SPECIES)[number]['id'];

export const DND_CLASSES = [
  {
    id: 'barbarian',
    hitDie: 12,
    primaryAbility: 'str',
    savingThrowProficiencies: ['str', 'con'],
    skillChoices: 2,
    skillPool: ['animalhandling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
    armorProficiencies: ['light', 'medium', 'shields'],
    weaponProficiencies: ['simple', 'martial'],
    toolProficiencies: [],
  },
  {
    id: 'bard',
    hitDie: 8,
    primaryAbility: 'cha',
    savingThrowProficiencies: ['dex', 'cha'],
    spellcastingAbility: 'cha',
    skillChoices: 3,
    skillPool: null,
    armorProficiencies: ['light'],
    weaponProficiencies: ['simple', 'handcrossbow', 'longsword', 'rapier', 'shortsword'],
    toolProficiencies: [],
    toolChoices: {
      count: 3,
      from: ['bagpipes', 'drum', 'dulcimer', 'flute', 'lute', 'lyre', 'horn', 'panflute', 'shawm', 'viol'],
    },
  },
  {
    id: 'cleric',
    hitDie: 8,
    primaryAbility: 'wis',
    savingThrowProficiencies: ['wis', 'cha'],
    spellcastingAbility: 'wis',
    skillChoices: 2,
    skillPool: ['history', 'insight', 'medicine', 'persuasion', 'religion'],
    armorProficiencies: ['light', 'medium', 'shields'],
    weaponProficiencies: ['simple'],
    toolProficiencies: [],
  },
  {
    id: 'druid',
    hitDie: 8,
    primaryAbility: 'wis',
    savingThrowProficiencies: ['int', 'wis'],
    spellcastingAbility: 'wis',
    skillChoices: 2,
    skillPool: ['arcana', 'animalhandling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
    armorProficiencies: ['light', 'medium-nonmetal', 'shields-nonmetal'],
    weaponProficiencies: [
      'club',
      'dagger',
      'dart',
      'javelin',
      'mace',
      'quarterstaff',
      'scimitar',
      'sickle',
      'sling',
      'spear',
    ],
    toolProficiencies: ['herbalismkit'],
  },
  {
    id: 'fighter',
    hitDie: 10,
    primaryAbility: 'str',
    savingThrowProficiencies: ['str', 'con'],
    skillChoices: 2,
    skillPool: [
      'acrobatics',
      'animalhandling',
      'athletics',
      'history',
      'insight',
      'intimidation',
      'perception',
      'survival',
    ],
    armorProficiencies: ['light', 'medium', 'heavy', 'shields'],
    weaponProficiencies: ['simple', 'martial'],
    toolProficiencies: [],
  },
  {
    id: 'monk',
    hitDie: 8,
    primaryAbility: 'dex',
    savingThrowProficiencies: ['str', 'dex'],
    skillChoices: 2,
    skillPool: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
    armorProficiencies: [],
    weaponProficiencies: ['simple', 'shortsword'],
    toolProficiencies: [],
  },
  {
    id: 'paladin',
    hitDie: 10,
    primaryAbility: 'str',
    savingThrowProficiencies: ['wis', 'cha'],
    spellcastingAbility: 'cha',
    skillChoices: 2,
    skillPool: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
    armorProficiencies: ['light', 'medium', 'heavy', 'shields'],
    weaponProficiencies: ['simple', 'martial'],
    toolProficiencies: [],
  },
  {
    id: 'ranger',
    hitDie: 10,
    primaryAbility: 'dex',
    savingThrowProficiencies: ['str', 'dex'],
    spellcastingAbility: 'wis',
    skillChoices: 3,
    skillPool: [
      'animalhandling',
      'athletics',
      'insight',
      'investigation',
      'nature',
      'perception',
      'stealth',
      'survival',
    ],
    armorProficiencies: ['light', 'medium', 'shields'],
    weaponProficiencies: ['simple', 'martial'],
    toolProficiencies: [],
  },
  {
    id: 'rogue',
    hitDie: 8,
    primaryAbility: 'dex',
    savingThrowProficiencies: ['dex', 'int'],
    skillChoices: 4,
    skillPool: [
      'acrobatics',
      'athletics',
      'deception',
      'insight',
      'intimidation',
      'investigation',
      'perception',
      'performance',
      'persuasion',
      'sleightofhand',
      'stealth',
    ],
    armorProficiencies: ['light'],
    weaponProficiencies: ['simple', 'handcrossbow', 'longsword', 'rapier', 'shortsword'],
    toolProficiencies: ['thievestools'],
  },
  {
    id: 'sorcerer',
    hitDie: 6,
    primaryAbility: 'cha',
    savingThrowProficiencies: ['con', 'cha'],
    spellcastingAbility: 'cha',
    skillChoices: 2,
    skillPool: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
    armorProficiencies: [],
    weaponProficiencies: ['dagger', 'dart', 'sling', 'quarterstaff', 'lightcrossbow'],
    toolProficiencies: [],
  },
  {
    id: 'warlock',
    hitDie: 8,
    primaryAbility: 'cha',
    savingThrowProficiencies: ['wis', 'cha'],
    spellcastingAbility: 'cha',
    skillChoices: 2,
    skillPool: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'],
    armorProficiencies: ['light'],
    weaponProficiencies: ['simple'],
    toolProficiencies: [],
  },
  {
    id: 'wizard',
    hitDie: 6,
    primaryAbility: 'int',
    savingThrowProficiencies: ['int', 'wis'],
    spellcastingAbility: 'int',
    skillChoices: 2,
    skillPool: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'],
    armorProficiencies: [],
    weaponProficiencies: ['dagger', 'dart', 'sling', 'quarterstaff', 'lightcrossbow'],
    toolProficiencies: [],
  },
] as const;

export type ClassId = (typeof DND_CLASSES)[number]['id'];

export const FIGHTING_STYLE_IDS = [
  'archery',
  'defense',
  'dueling',
  'great-weapon-fighting',
  'protection',
  'two-weapon-fighting',
] as const;

export type FightingStyleId = (typeof FIGHTING_STYLE_IDS)[number];

export const FEAT_IDS = [
  // Origin feats (granted by backgrounds, no level prerequisite)
  'alert',
  'crafter',
  'healer',
  'lucky',
  'magic-initiate-cleric',
  'magic-initiate-druid',
  'magic-initiate-wizard',
  'musician',
  'savage-attacker',
  'skilled',
  'tavern-brawler',
  'tough',
  // Fighting Style feats
  'archery',
  'defense',
  'dueling',
  'great-weapon-fighting',
  'protection',
  'two-weapon-fighting',
  // General feats (level 4+ prerequisite)
  'actor',
  'athlete',
  'charger',
  'chef',
  'crossbow-expert',
  'crusher',
  'defensive-duelist',
  'dual-wielder',
  'dungeon-delver',
  'durable',
  'elemental-adept-acid',
  'elemental-adept-cold',
  'elemental-adept-fire',
  'elemental-adept-lightning',
  'elemental-adept-thunder',
  'fey-touched',
  'grappler',
  'great-weapon-master',
  'heavily-armored',
  'heavy-armor-master',
  'inspiring-leader',
  'keen-mind',
  'lightly-armored',
  'mage-slayer',
  'magic-initiate-bard',
  'magic-initiate-sorcerer',
  'magic-initiate-warlock',
  'medium-armor-master',
  'moderately-armored',
  'mounted-combatant',
  'observant',
  'piercer',
  'poisoner',
  'polearm-master',
  'resilient-constitution',
  'resilient-dexterity',
  'resilient-intelligence',
  'resilient-strength',
  'resilient-wisdom',
  'ritual-caster',
  'sentinel',
  'shadow-touched',
  'sharpshooter',
  'shield-master',
  'skill-expert',
  'skulker',
  'slasher',
  'speedy',
  'spell-sniper',
  'telekinetic',
  'telepathic',
  'war-caster',
  'weapon-master',
  // Epic Boon feats (level 19+ prerequisite)
  'boon-of-combat-prowess',
  'boon-of-dimensional-travel',
  'boon-of-energy-resistance',
  'boon-of-fate',
  'boon-of-fortitude',
  'boon-of-irresistible-offense',
  'boon-of-luck',
  'boon-of-night-spirit',
  'boon-of-recovery',
  'boon-of-skill',
  'boon-of-speed',
  'boon-of-spell-recall',
  'boon-of-truesight',
] as const;

export type FeatId = (typeof FEAT_IDS)[number];

export function isFeatId(value: string): value is FeatId {
  return (FEAT_IDS as readonly string[]).includes(value);
}

export const DND_SKILLS = [
  { id: 'acrobatics', ability: 'dex' },
  { id: 'animalhandling', ability: 'wis' },
  { id: 'arcana', ability: 'int' },
  { id: 'athletics', ability: 'str' },
  { id: 'deception', ability: 'cha' },
  { id: 'history', ability: 'int' },
  { id: 'insight', ability: 'wis' },
  { id: 'intimidation', ability: 'cha' },
  { id: 'investigation', ability: 'int' },
  { id: 'medicine', ability: 'wis' },
  { id: 'nature', ability: 'int' },
  { id: 'perception', ability: 'wis' },
  { id: 'performance', ability: 'cha' },
  { id: 'persuasion', ability: 'cha' },
  { id: 'religion', ability: 'int' },
  { id: 'sleightofhand', ability: 'dex' },
  { id: 'stealth', ability: 'dex' },
  { id: 'survival', ability: 'wis' },
] as const;

export type SkillId = (typeof DND_SKILLS)[number]['id'];

export const DND_BACKGROUNDS = [
  { id: 'acolyte' },
  { id: 'artisan' },
  { id: 'charlatan' },
  { id: 'criminal' },
  { id: 'entertainer' },
  { id: 'farmer' },
  { id: 'guard' },
  { id: 'guide' },
  { id: 'hermit' },
  { id: 'merchant' },
  { id: 'noble' },
  { id: 'sage' },
  { id: 'sailor' },
  { id: 'scribe' },
  { id: 'soldier' },
  { id: 'wayfarer' },
] as const;

export type BackgroundId = (typeof DND_BACKGROUNDS)[number]['id'];

const BACKGROUND_ID_SET: ReadonlySet<string> = new Set(DND_BACKGROUNDS.map((b) => b.id));

export function isBackgroundId(value: string): value is BackgroundId {
  return BACKGROUND_ID_SET.has(value);
}

const SPECIES_ID_SET: ReadonlySet<string> = new Set(DND_SPECIES.map((s) => s.id));

export function isSpeciesId(value: string): value is SpeciesId {
  return SPECIES_ID_SET.has(value);
}

export const DND_ALIGNMENTS = [
  { id: 'lg' },
  { id: 'ng' },
  { id: 'cg' },
  { id: 'ln' },
  { id: 'n' },
  { id: 'cn' },
  { id: 'le' },
  { id: 'ne' },
  { id: 'ce' },
] as const;

export type AlignmentId = (typeof DND_ALIGNMENTS)[number]['id'];

export const ABILITY_ABBREVIATIONS: Readonly<Record<AbilityName, string>> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
};

// Ability Score Assignment Methods

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const POINT_BUY_TOTAL = 27;

export function getPointBuyCost(score: number): number {
  return POINT_BUY_COSTS[score] ?? 0;
}

export function getPointBuyIncrementCost(currentScore: number): number {
  if (currentScore >= 15) return Infinity;
  return (POINT_BUY_COSTS[currentScore + 1] ?? 0) - (POINT_BUY_COSTS[currentScore] ?? 0);
}

export function getPointBuyDecrementReturn(currentScore: number): number {
  if (currentScore <= 8) return 0;
  return (POINT_BUY_COSTS[currentScore] ?? 0) - (POINT_BUY_COSTS[currentScore - 1] ?? 0);
}

export function getPointBuyEquivalent(scores: number[]): number {
  return scores.reduce((sum, score) => {
    const clamped = Math.min(Math.max(score, 8), 15);
    return sum + (POINT_BUY_COSTS[clamped] ?? 0);
  }, 0);
}

// SRD d12 random language table (standard languages only, weights sum to 12)
const RANDOM_LANGUAGE_TABLE: readonly { readonly id: LanguageId; readonly weight: number }[] = [
  { id: 'common-sign', weight: 1 },
  { id: 'draconic', weight: 1 },
  { id: 'dwarvish', weight: 2 },
  { id: 'elvish', weight: 2 },
  { id: 'giant', weight: 1 },
  { id: 'gnomish', weight: 1 },
  { id: 'goblin', weight: 1 },
  { id: 'halfling', weight: 2 },
  { id: 'orc', weight: 1 },
];

export function rollRandomLanguage(exclude: readonly LanguageId[]): LanguageId | null {
  const available = RANDOM_LANGUAGE_TABLE.filter((entry) => !exclude.includes(entry.id));
  if (available.length === 0) return null;
  const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.floor(Math.random() * totalWeight);
  for (const entry of available) {
    if (roll < entry.weight) return entry.id;
    roll -= entry.weight;
  }
  return available[available.length - 1].id;
}

export function rollRandomLanguages(count: number, exclude: readonly LanguageId[]): LanguageId[] {
  const rolled: LanguageId[] = [];
  for (let i = 0; i < count; i++) {
    const lang = rollRandomLanguage([...exclude, ...rolled]);
    if (lang) rolled.push(lang);
  }
  return rolled;
}

/** Rolls XdY and returns the sum. Uses injectable rng for testing. */
export function rollDice(count: number, sides: number, rng: () => number = Math.random): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(rng() * sides) + 1;
  }
  return total;
}

/**
 * Returns the "D&D average" of XdY — each die's average rounded up.
 * d10 → 6, d8 → 5, d6 → 4, d4 → 3. Produces 2d10=12, 2d8=10, 2d4=6.
 */
export function averageDice(count: number, sides: number): number {
  return Math.ceil((sides + 1) / 2) * count;
}

export function roll4d6DropLowest(): number {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
}

export function rollAbilityScores(): number[] {
  return Array.from({ length: 6 }, () => roll4d6DropLowest()).sort((a, b) => b - a);
}

export type DndGender = 'male' | 'female';

export type SpeciesNameData = {
  readonly [G in DndGender]: readonly string[];
} & {
  readonly clan: readonly string[];
};

export const DND_SPECIES_NAMES: Readonly<Partial<Record<SpeciesId, SpeciesNameData>>> = {
  aasimar: { male: [], female: [], clan: [] },
  dragonborn: {
    male: [
      'Arjhan',
      'Balasar',
      'Bharash',
      'Donaar',
      'Ghesh',
      'Heskan',
      'Kriv',
      'Medrash',
      'Mehen',
      'Nadarr',
      'Pandjed',
      'Patrin',
      'Rhogar',
      'Shamash',
      'Shedinn',
    ],
    female: [
      'Akra',
      'Biri',
      'Daar',
      'Farideh',
      'Harann',
      'Havilar',
      'Jheri',
      'Kava',
      'Korinn',
      'Mishann',
      'Nala',
      'Perra',
      'Raiann',
      'Sora',
      'Surina',
    ],
    clan: [
      'Clethtinthiallor',
      'Daardendrian',
      'Delmirev',
      'Drachedandion',
      'Fenkenkabradon',
      'Kepeshkmolik',
      'Kerrhylon',
      'Kimbatuul',
      'Linxakasendalor',
      'Myastan',
    ],
  },
  dwarf: {
    male: [
      'Adrik',
      'Alberich',
      'Baern',
      'Barendd',
      'Brottor',
      'Bruenor',
      'Dain',
      'Darrak',
      'Delg',
      'Eberk',
      'Einkil',
      'Fargrim',
      'Flint',
      'Gardain',
      'Harbek',
    ],
    female: [
      'Amber',
      'Artin',
      'Audhild',
      'Bardryn',
      'Dagnal',
      'Diesa',
      'Eldeth',
      'Falkrunn',
      'Finellen',
      'Gunnloda',
      'Gurdis',
      'Helja',
      'Hlin',
      'Kathra',
      'Kristryd',
    ],
    clan: [
      'Balderk',
      'Dankil',
      'Gorunn',
      'Holderhek',
      'Loderr',
      'Lutgehr',
      'Rumnaheim',
      'Strakeln',
      'Torunn',
      'Ungart',
    ],
  },
  elf: {
    male: [
      'Adran',
      'Aelar',
      'Aramil',
      'Arannis',
      'Aust',
      'Beiro',
      'Berrian',
      'Carric',
      'Enialis',
      'Erdan',
      'Erevan',
      'Galinndan',
      'Hadarai',
      'Heian',
      'Himo',
    ],
    female: [
      'Adrie',
      'Althaea',
      'Anastrianna',
      'Andraste',
      'Antinua',
      'Bethrynna',
      'Birel',
      'Caelynn',
      'Drusilia',
      'Enna',
      'Felosial',
      'Ielenia',
      'Jelenneth',
      'Keyleth',
      'Leshanna',
    ],
    clan: [
      'Amakiir',
      'Amastacia',
      'Galanodel',
      'Holimion',
      'Ilphelkiir',
      'Liadon',
      'Meliamne',
      'Nailo',
      'Siannodel',
      'Xiloscient',
    ],
  },
  gnome: {
    male: [
      'Alston',
      'Alvyn',
      'Boddynock',
      'Brocc',
      'Burgell',
      'Dimble',
      'Eldon',
      'Erky',
      'Fonkin',
      'Frug',
      'Gerbo',
      'Gimble',
      'Glim',
      'Jebeddo',
      'Kellen',
    ],
    female: [
      'Bimpnottin',
      'Breena',
      'Caramip',
      'Carlin',
      'Donella',
      'Duvamil',
      'Ella',
      'Ellyjobell',
      'Ellywick',
      'Lilli',
      'Loopmottin',
      'Lorilla',
      'Mardnab',
      'Nissa',
      'Nyx',
    ],
    clan: ['Beren', 'Daergel', 'Folkor', 'Garrick', 'Nackle', 'Murnig', 'Ningel', 'Raulnor', 'Scheppen', 'Timbers'],
  },
  goliath: { male: [], female: [], clan: [] },
  halfling: {
    male: [
      'Alton',
      'Ander',
      'Cade',
      'Corrin',
      'Eldon',
      'Errich',
      'Finnan',
      'Garret',
      'Lindal',
      'Lyle',
      'Merric',
      'Milo',
      'Osborn',
      'Perrin',
      'Reed',
    ],
    female: [
      'Andry',
      'Bree',
      'Callie',
      'Cora',
      'Euphemia',
      'Jillian',
      'Kithri',
      'Lavinia',
      'Lidda',
      'Merla',
      'Nedda',
      'Paela',
      'Portia',
      'Seraphina',
      'Shaena',
    ],
    clan: [
      'Brushgather',
      'Goodbarrel',
      'Greenbottle',
      'High-hill',
      'Hilltopple',
      'Leagallow',
      'Tealeaf',
      'Thorngage',
      'Tosscobble',
      'Underbough',
    ],
  },
  human: {
    male: [
      'Ander',
      'Blath',
      'Bram',
      'Frath',
      'Geth',
      'Lander',
      'Luth',
      'Malcer',
      'Stor',
      'Taman',
      'Urth',
      'Aldric',
      'Cedric',
      'Edrick',
      'Gareth',
    ],
    female: [
      'Amafrey',
      'Betha',
      'Cefrey',
      'Kethra',
      'Mara',
      'Olga',
      'Silifrey',
      'Westra',
      'Aldara',
      'Brenna',
      'Calla',
      'Dara',
      'Elara',
      'Freya',
      'Greta',
    ],
    clan: [
      'Brightmantle',
      'Crownsilver',
      'Dundragon',
      'Eaglecloak',
      'Goldvein',
      'Hammerfall',
      'Ironforge',
      'Lionmane',
      'Proudmoore',
      'Stoneheart',
    ],
  },
  orc: { male: [], female: [], clan: [] },
  tiefling: {
    male: [
      'Akmenos',
      'Amnon',
      'Barakas',
      'Damakos',
      'Ekemon',
      'Iados',
      'Kairon',
      'Leucis',
      'Melech',
      'Mordai',
      'Morthos',
      'Pelaios',
      'Skamos',
      'Therai',
      'Zovvak',
    ],
    female: [
      'Akta',
      'Anakis',
      'Bryseis',
      'Criella',
      'Damaia',
      'Ea',
      'Kallista',
      'Lerissa',
      'Makaria',
      'Nemeia',
      'Orianna',
      'Phelaia',
      'Rieta',
      'Tanis',
      'Zelaia',
    ],
    clan: [
      'Bloodthorn',
      'Darkfire',
      'Embersoul',
      'Grimhallow',
      'Hellborn',
      'Infernus',
      'Nightshade',
      'Shadowflame',
      'Soulreaper',
      'Voidwalker',
    ],
  },
};

export interface Proficiencies {
  readonly armor: readonly ArmorProficiencyId[];
  readonly weapons: readonly WeaponProficiencyId[];
  readonly tools: readonly ToolProficiencyId[];
  readonly toolChoices: readonly ToolProficiencyId[];
  readonly languages: readonly LanguageId[];
  readonly languageChoices: readonly LanguageId[];
}

const EMPTY_PROFICIENCIES: Proficiencies = {
  armor: [],
  weapons: [],
  tools: [],
  toolChoices: [],
  languages: [],
  languageChoices: [],
};

export function computeProficiencies(
  classId: ClassId | '',
  speciesId: SpeciesId | '',
  prev: Proficiencies,
  classChanged: boolean,
  speciesChanged: boolean
): Proficiencies {
  if (!classChanged && !speciesChanged) return prev;
  const cls: DndClass | undefined = DND_CLASSES.find((c) => c.id === classId);
  const race: DndSpecies | undefined = DND_SPECIES.find((r) => r.id === speciesId);
  return {
    armor: cls ? [...cls.armorProficiencies] : [],
    weapons: cls ? [...cls.weaponProficiencies] : [],
    tools: cls ? [...cls.toolProficiencies] : [],
    toolChoices: classChanged ? [] : prev.toolChoices,
    languages: race ? [...race.languages] : [],
    languageChoices: speciesChanged ? [] : prev.languageChoices,
  };
}

export function toggleToolProficiencyChoice(
  proficiencies: Proficiencies,
  classId: ClassId | '',
  toolId: ToolProficiencyId
): Proficiencies {
  const cls: DndClass | undefined = DND_CLASSES.find((c) => c.id === classId);
  if (!cls?.toolChoices) return proficiencies;
  if (!cls.toolChoices.from.includes(toolId)) {
    logger.warn(`toggleToolProficiencyChoice: "${toolId}" is not in ${cls.id} toolChoices.from`);
    return proficiencies;
  }
  if (proficiencies.tools.includes(toolId)) {
    logger.warn(`toggleToolProficiencyChoice: "${toolId}" is already auto-granted`);
    return proficiencies;
  }
  const current = proficiencies.toolChoices;
  if (current.includes(toolId)) {
    return { ...proficiencies, toolChoices: current.filter((t) => t !== toolId) };
  }
  if (current.length >= cls.toolChoices.count) return proficiencies;
  return { ...proficiencies, toolChoices: [...current, toolId] };
}

export function toggleLanguageProficiencyChoice(
  proficiencies: Proficiencies,
  speciesId: SpeciesId | '',
  langId: LanguageId
): Proficiencies {
  const race: DndSpecies | undefined = DND_SPECIES.find((r) => r.id === speciesId);
  const maxChoices = race?.languageChoices ?? 0;
  if (maxChoices === 0) return proficiencies;
  if (proficiencies.languages.includes(langId)) {
    logger.warn(`toggleLanguageProficiencyChoice: "${langId}" is already auto-granted`);
    return proficiencies;
  }
  const current = proficiencies.languageChoices;
  if (current.includes(langId)) {
    return { ...proficiencies, languageChoices: current.filter((l) => l !== langId) };
  }
  if (current.length >= maxChoices) return proficiencies;
  return { ...proficiencies, languageChoices: [...current, langId] };
}

export { EMPTY_PROFICIENCIES };

export function generateCharacterName(
  speciesId: SpeciesId,
  gender: DndGender,
  rng: () => number = Math.random
): string | null {
  const raceData = DND_SPECIES_NAMES[speciesId];
  if (!raceData) return null;

  const firstNames = raceData[gender];
  if (!firstNames?.length || !raceData.clan?.length) return null;

  const firstName = firstNames[Math.floor(rng() * firstNames.length)];
  const clanName = raceData.clan[Math.floor(rng() * raceData.clan.length)];

  return `${firstName} ${clanName}`;
}
