// D&D 5e Helper Functions and Data
import type { AbilityKey } from '@/types/database'

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function getProficiencyBonus(level: number): number {
  if (level < 5) return 2
  if (level < 9) return 3
  if (level < 13) return 4
  if (level < 17) return 5
  return 6
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
    warlock: {
      1: [1],
      2: [2],
      3: [2, 2],
      4: [2, 2],
      5: [2, 2, 2],
      6: [2, 2, 2],
      7: [2, 2, 2, 2],
      8: [2, 2, 2, 2],
      9: [2, 2, 2, 2, 2],
      10: [2, 2, 2, 2, 2],
      11: [3, 3, 3, 3, 3],
      12: [3, 3, 3, 3, 3],
      13: [3, 3, 3, 3, 3],
      14: [3, 3, 3, 3, 3],
      15: [3, 3, 3, 3, 3],
      16: [3, 3, 3, 3, 3],
      17: [4, 4, 4, 4, 4],
      18: [4, 4, 4, 4, 4],
      19: [4, 4, 4, 4, 4],
      20: [4, 4, 4, 4, 4],
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
  }

  return spellcasters[className.toLowerCase()]?.[level] || []
}

export interface DndRace {
  id: string
  name: string
  size: string
  speed: number
  abilityBonuses: Partial<Record<AbilityKey, number>>
}

export interface DndClass {
  id: string
  name: string
  hitDie: number
  primaryAbility: AbilityName
  savingThrowProficiencies: readonly AbilityName[]
  spellcastingAbility?: AbilityName
  skillChoices: number
  /** Skills this class can choose from (by skill id). null = any skill (e.g., Bard's Jack of All Trades). */
  skillPool: readonly string[] | null
}

export type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export interface DndSkill {
  id: string
  name: string
  ability: AbilityName
}

export interface DndBackground {
  id: string
  name: string
}

export interface DndAlignment {
  id: string
  name: string
  shorthand: string
}

export const DND_RACES = [
  {
    id: 'dragonborn',
    name: 'Dragonborn',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { str: 2, cha: 1 },
  },
  {
    id: 'dwarf-hill',
    name: 'Hill Dwarf',
    size: 'Medium',
    speed: 25,
    abilityBonuses: { con: 2, wis: 1 },
  },
  {
    id: 'dwarf-mountain',
    name: 'Mountain Dwarf',
    size: 'Medium',
    speed: 25,
    abilityBonuses: { con: 2, str: 2 },
  },
  {
    id: 'elf-dark',
    name: 'Dark Elf (Drow)',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { dex: 2, cha: 1 },
  },
  {
    id: 'elf-high',
    name: 'High Elf',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { dex: 2, int: 1 },
  },
  {
    id: 'elf-wood',
    name: 'Wood Elf',
    size: 'Medium',
    speed: 35,
    abilityBonuses: { dex: 2, wis: 1 },
  },
  {
    id: 'gnome-forest',
    name: 'Forest Gnome',
    size: 'Small',
    speed: 25,
    abilityBonuses: { int: 2, dex: 1 },
  },
  {
    id: 'gnome-rock',
    name: 'Rock Gnome',
    size: 'Small',
    speed: 25,
    abilityBonuses: { int: 2, con: 1 },
  },
  {
    id: 'halfelf',
    name: 'Half-Elf',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { cha: 2, int: 1, wis: 1 },
  },
  {
    id: 'halforc',
    name: 'Half-Orc',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { str: 2, con: 1 },
  },
  {
    id: 'halfling-lightfoot',
    name: 'Lightfoot Halfling',
    size: 'Small',
    speed: 25,
    abilityBonuses: { dex: 2, cha: 1 },
  },
  {
    id: 'halfling-stout',
    name: 'Stout Halfling',
    size: 'Small',
    speed: 25,
    abilityBonuses: { dex: 2, con: 1 },
  },
  {
    id: 'human',
    name: 'Human',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
  },
  {
    id: 'tiefling',
    name: 'Tiefling',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { cha: 2, int: 1 },
  },
] as const

export type RaceId = (typeof DND_RACES)[number]['id']

export interface DndRaceGroup {
  id: string
  label: string
  options: Array<{ value: string; label: string }>
}

export const DND_RACE_GROUPS: DndRaceGroup[] = [
  { id: 'dragonborn', label: 'Dragonborn', options: [{ value: 'dragonborn', label: 'Dragonborn' }] },
  { id: 'dwarf', label: 'Dwarf', options: [
    { value: 'dwarf-hill', label: 'Hill Dwarf' },
    { value: 'dwarf-mountain', label: 'Mountain Dwarf' },
  ]},
  { id: 'elf', label: 'Elf', options: [
    { value: 'elf-dark', label: 'Dark Elf (Drow)' },
    { value: 'elf-high', label: 'High Elf' },
    { value: 'elf-wood', label: 'Wood Elf' },
  ]},
  { id: 'gnome', label: 'Gnome', options: [
    { value: 'gnome-forest', label: 'Forest Gnome' },
    { value: 'gnome-rock', label: 'Rock Gnome' },
  ]},
  { id: 'halfelf', label: 'Half-Elf', options: [{ value: 'halfelf', label: 'Half-Elf' }] },
  { id: 'halforc', label: 'Half-Orc', options: [{ value: 'halforc', label: 'Half-Orc' }] },
  { id: 'halfling', label: 'Halfling', options: [
    { value: 'halfling-lightfoot', label: 'Lightfoot Halfling' },
    { value: 'halfling-stout', label: 'Stout Halfling' },
  ]},
  { id: 'human', label: 'Human', options: [{ value: 'human', label: 'Human' }] },
  { id: 'tiefling', label: 'Tiefling', options: [{ value: 'tiefling', label: 'Tiefling' }] },
]

export const DND_CLASSES = [
  {
    id: 'barbarian',
    name: 'Barbarian',
    hitDie: 12,
    primaryAbility: 'str',
    savingThrowProficiencies: ['str', 'con'],
    skillChoices: 2,
    skillPool: ['animalhandling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
  },
  {
    id: 'bard',
    name: 'Bard',
    hitDie: 8,
    primaryAbility: 'cha',
    savingThrowProficiencies: ['dex', 'cha'],
    spellcastingAbility: 'cha',
    skillChoices: 3,
    skillPool: null,
  },
  {
    id: 'cleric',
    name: 'Cleric',
    hitDie: 8,
    primaryAbility: 'wis',
    savingThrowProficiencies: ['wis', 'cha'],
    spellcastingAbility: 'wis',
    skillChoices: 2,
    skillPool: ['history', 'insight', 'medicine', 'persuasion', 'religion'],
  },
  {
    id: 'druid',
    name: 'Druid',
    hitDie: 8,
    primaryAbility: 'wis',
    savingThrowProficiencies: ['int', 'wis'],
    spellcastingAbility: 'wis',
    skillChoices: 2,
    skillPool: ['arcana', 'animalhandling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
  },
  {
    id: 'fighter',
    name: 'Fighter',
    hitDie: 10,
    primaryAbility: 'str',
    savingThrowProficiencies: ['str', 'con'],
    skillChoices: 2,
    skillPool: ['acrobatics', 'animalhandling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'],
  },
  {
    id: 'monk',
    name: 'Monk',
    hitDie: 8,
    primaryAbility: 'dex',
    savingThrowProficiencies: ['str', 'dex'],
    skillChoices: 2,
    skillPool: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
  },
  {
    id: 'paladin',
    name: 'Paladin',
    hitDie: 10,
    primaryAbility: 'str',
    savingThrowProficiencies: ['wis', 'cha'],
    spellcastingAbility: 'cha',
    skillChoices: 2,
    skillPool: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    hitDie: 10,
    primaryAbility: 'dex',
    savingThrowProficiencies: ['str', 'dex'],
    spellcastingAbility: 'wis',
    skillChoices: 3,
    skillPool: ['animalhandling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'],
  },
  {
    id: 'rogue',
    name: 'Rogue',
    hitDie: 8,
    primaryAbility: 'dex',
    savingThrowProficiencies: ['dex', 'int'],
    skillChoices: 4,
    skillPool: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleightofhand', 'stealth'],
  },
  {
    id: 'sorcerer',
    name: 'Sorcerer',
    hitDie: 6,
    primaryAbility: 'cha',
    savingThrowProficiencies: ['con', 'cha'],
    spellcastingAbility: 'cha',
    skillChoices: 2,
    skillPool: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
  },
  {
    id: 'warlock',
    name: 'Warlock',
    hitDie: 8,
    primaryAbility: 'cha',
    savingThrowProficiencies: ['wis', 'cha'],
    spellcastingAbility: 'cha',
    skillChoices: 2,
    skillPool: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'],
  },
  {
    id: 'wizard',
    name: 'Wizard',
    hitDie: 6,
    primaryAbility: 'int',
    savingThrowProficiencies: ['int', 'wis'],
    spellcastingAbility: 'int',
    skillChoices: 2,
    skillPool: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'],
  },
] as const

export type ClassId = (typeof DND_CLASSES)[number]['id']

export const DND_SKILLS = [
  { id: 'acrobatics', name: 'Acrobatics', ability: 'dex' },
  { id: 'animalhandling', name: 'Animal Handling', ability: 'wis' },
  { id: 'arcana', name: 'Arcana', ability: 'int' },
  { id: 'athletics', name: 'Athletics', ability: 'str' },
  { id: 'deception', name: 'Deception', ability: 'cha' },
  { id: 'history', name: 'History', ability: 'int' },
  { id: 'insight', name: 'Insight', ability: 'wis' },
  { id: 'intimidation', name: 'Intimidation', ability: 'cha' },
  { id: 'investigation', name: 'Investigation', ability: 'int' },
  { id: 'medicine', name: 'Medicine', ability: 'wis' },
  { id: 'nature', name: 'Nature', ability: 'int' },
  { id: 'perception', name: 'Perception', ability: 'wis' },
  { id: 'performance', name: 'Performance', ability: 'cha' },
  { id: 'persuasion', name: 'Persuasion', ability: 'cha' },
  { id: 'religion', name: 'Religion', ability: 'int' },
  { id: 'sleightofhand', name: 'Sleight of Hand', ability: 'dex' },
  { id: 'stealth', name: 'Stealth', ability: 'dex' },
  { id: 'survival', name: 'Survival', ability: 'wis' },
] as const

export type SkillId = (typeof DND_SKILLS)[number]['id']

export const DND_BACKGROUNDS = [
  { id: 'acolyte', name: 'Acolyte' },
  { id: 'charlatan', name: 'Charlatan' },
  { id: 'criminal', name: 'Criminal' },
  { id: 'entertainer', name: 'Entertainer' },
  { id: 'folkhero', name: 'Folk Hero' },
  { id: 'guildartisan', name: 'Guild Artisan' },
  { id: 'hermit', name: 'Hermit' },
  { id: 'noble', name: 'Noble' },
  { id: 'outlander', name: 'Outlander' },
  { id: 'sage', name: 'Sage' },
  { id: 'sailor', name: 'Sailor' },
  { id: 'soldier', name: 'Soldier' },
  { id: 'urchin', name: 'Urchin' },
  { id: 'custom', name: 'Custom' },
] as const

export type BackgroundId = (typeof DND_BACKGROUNDS)[number]['id']

export const DND_ALIGNMENTS = [
  { id: 'lg', name: 'Lawful Good', shorthand: 'LG' },
  { id: 'ng', name: 'Neutral Good', shorthand: 'NG' },
  { id: 'cg', name: 'Chaotic Good', shorthand: 'CG' },
  { id: 'ln', name: 'Lawful Neutral', shorthand: 'LN' },
  { id: 'n', name: 'True Neutral', shorthand: 'N' },
  { id: 'cn', name: 'Chaotic Neutral', shorthand: 'CN' },
  { id: 'le', name: 'Lawful Evil', shorthand: 'LE' },
  { id: 'ne', name: 'Neutral Evil', shorthand: 'NE' },
  { id: 'ce', name: 'Chaotic Evil', shorthand: 'CE' },
] as const

export type AlignmentId = (typeof DND_ALIGNMENTS)[number]['id']

export const ABILITY_ABBREVIATIONS: Readonly<Record<AbilityName, string>> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
}

// Ability Score Assignment Methods

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
}

export const POINT_BUY_TOTAL = 27

export function getPointBuyCost(score: number): number {
  return POINT_BUY_COSTS[score] ?? 0
}

export function getPointBuyIncrementCost(currentScore: number): number {
  if (currentScore >= 15) return Infinity
  return (POINT_BUY_COSTS[currentScore + 1] ?? 0) - (POINT_BUY_COSTS[currentScore] ?? 0)
}

export function getPointBuyDecrementReturn(currentScore: number): number {
  if (currentScore <= 8) return 0
  return (POINT_BUY_COSTS[currentScore] ?? 0) - (POINT_BUY_COSTS[currentScore - 1] ?? 0)
}

export function getPointBuyEquivalent(scores: number[]): number {
  return scores.reduce((sum, score) => {
    const clamped = Math.min(Math.max(score, 8), 15)
    return sum + (POINT_BUY_COSTS[clamped] ?? 0)
  }, 0)
}

export function roll4d6DropLowest(): number {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
  rolls.sort((a, b) => a - b)
  return rolls[1] + rolls[2] + rolls[3]
}

export function rollAbilityScores(): number[] {
  return Array.from({ length: 6 }, () => roll4d6DropLowest())
    .sort((a, b) => b - a)
}

export type DndGender = 'male' | 'female'

export type RaceNameData = {
  readonly [G in DndGender]: readonly string[]
} & {
  readonly clan: readonly string[]
}

export const DND_RACE_NAMES: Readonly<Partial<Record<string, RaceNameData>>> = {
  'dragonborn': {
    male: ['Arjhan', 'Balasar', 'Bharash', 'Donaar', 'Ghesh', 'Heskan', 'Kriv', 'Medrash', 'Mehen', 'Nadarr', 'Pandjed', 'Patrin', 'Rhogar', 'Shamash', 'Shedinn'],
    female: ['Akra', 'Biri', 'Daar', 'Farideh', 'Harann', 'Havilar', 'Jheri', 'Kava', 'Korinn', 'Mishann', 'Nala', 'Perra', 'Raiann', 'Sora', 'Surina'],
    clan: ['Clethtinthiallor', 'Daardendrian', 'Delmirev', 'Drachedandion', 'Fenkenkabradon', 'Kepeshkmolik', 'Kerrhylon', 'Kimbatuul', 'Linxakasendalor', 'Myastan'],
  },
  'dwarf': {
    male: ['Adrik', 'Alberich', 'Baern', 'Barendd', 'Brottor', 'Bruenor', 'Dain', 'Darrak', 'Delg', 'Eberk', 'Einkil', 'Fargrim', 'Flint', 'Gardain', 'Harbek'],
    female: ['Amber', 'Artin', 'Audhild', 'Bardryn', 'Dagnal', 'Diesa', 'Eldeth', 'Falkrunn', 'Finellen', 'Gunnloda', 'Gurdis', 'Helja', 'Hlin', 'Kathra', 'Kristryd'],
    clan: ['Balderk', 'Dankil', 'Gorunn', 'Holderhek', 'Loderr', 'Lutgehr', 'Rumnaheim', 'Strakeln', 'Torunn', 'Ungart'],
  },
  'elf': {
    male: ['Adran', 'Aelar', 'Aramil', 'Arannis', 'Aust', 'Beiro', 'Berrian', 'Carric', 'Enialis', 'Erdan', 'Erevan', 'Galinndan', 'Hadarai', 'Heian', 'Himo'],
    female: ['Adrie', 'Althaea', 'Anastrianna', 'Andraste', 'Antinua', 'Bethrynna', 'Birel', 'Caelynn', 'Drusilia', 'Enna', 'Felosial', 'Ielenia', 'Jelenneth', 'Keyleth', 'Leshanna'],
    clan: ['Amakiir', 'Amastacia', 'Galanodel', 'Holimion', 'Ilphelkiir', 'Liadon', 'Meliamne', 'Nailo', 'Siannodel', 'Xiloscient'],
  },
  'gnome': {
    male: ['Alston', 'Alvyn', 'Boddynock', 'Brocc', 'Burgell', 'Dimble', 'Eldon', 'Erky', 'Fonkin', 'Frug', 'Gerbo', 'Gimble', 'Glim', 'Jebeddo', 'Kellen'],
    female: ['Bimpnottin', 'Breena', 'Caramip', 'Carlin', 'Donella', 'Duvamil', 'Ella', 'Ellyjobell', 'Ellywick', 'Lilli', 'Loopmottin', 'Lorilla', 'Mardnab', 'Nissa', 'Nyx'],
    clan: ['Beren', 'Daergel', 'Folkor', 'Garrick', 'Nackle', 'Murnig', 'Ningel', 'Raulnor', 'Scheppen', 'Timbers'],
  },
  'halfelf': {
    male: ['Adran', 'Aramil', 'Beiro', 'Carric', 'Erdan', 'Galinndan', 'Hadarai', 'Immeral', 'Ivellios', 'Laucian', 'Mindartis', 'Paelias', 'Peren', 'Quarion', 'Riardon'],
    female: ['Adrie', 'Althaea', 'Andraste', 'Caelynn', 'Drusilia', 'Felosial', 'Ielenia', 'Jelenneth', 'Keyleth', 'Leshanna', 'Lia', 'Mialee', 'Naivara', 'Quelenna', 'Quillathe'],
    clan: ['Brightwood', 'Evenwood', 'Farleaf', 'Galanodel', 'Holimion', 'Moonshadow', 'Nailo', 'Siannodel', 'Silverfrond', 'Windriver'],
  },
  'halforc': {
    male: ['Dench', 'Feng', 'Gell', 'Henk', 'Holg', 'Imsh', 'Keth', 'Krusk', 'Mhurren', 'Ront', 'Shump', 'Thokk', 'Urtra', 'Volen', 'Yargath'],
    female: ['Baggi', 'Emen', 'Engong', 'Kansif', 'Myev', 'Neega', 'Ovak', 'Ownka', 'Shautha', 'Sutha', 'Vola', 'Volen', 'Yevelda', 'Zharra', 'Zovak'],
    clan: ['Bloodfist', 'Dreadblade', 'Grimtusk', 'Ironhide', 'Marrowsmasher', 'Ragebringer', 'Skullcrusher', 'Stoneback', 'Thunderstep', 'Warchief'],
  },
  'halfling': {
    male: ['Alton', 'Ander', 'Cade', 'Corrin', 'Eldon', 'Errich', 'Finnan', 'Garret', 'Lindal', 'Lyle', 'Merric', 'Milo', 'Osborn', 'Perrin', 'Reed'],
    female: ['Andry', 'Bree', 'Callie', 'Cora', 'Euphemia', 'Jillian', 'Kithri', 'Lavinia', 'Lidda', 'Merla', 'Nedda', 'Paela', 'Portia', 'Seraphina', 'Shaena'],
    clan: ['Brushgather', 'Goodbarrel', 'Greenbottle', 'High-hill', 'Hilltopple', 'Leagallow', 'Tealeaf', 'Thorngage', 'Tosscobble', 'Underbough'],
  },
  'human': {
    male: ['Ander', 'Blath', 'Bram', 'Frath', 'Geth', 'Lander', 'Luth', 'Malcer', 'Stor', 'Taman', 'Urth', 'Aldric', 'Cedric', 'Edrick', 'Gareth'],
    female: ['Amafrey', 'Betha', 'Cefrey', 'Kethra', 'Mara', 'Olga', 'Silifrey', 'Westra', 'Aldara', 'Brenna', 'Calla', 'Dara', 'Elara', 'Freya', 'Greta'],
    clan: ['Brightmantle', 'Crownsilver', 'Dundragon', 'Eaglecloak', 'Goldvein', 'Hammerfall', 'Ironforge', 'Lionmane', 'Proudmoore', 'Stoneheart'],
  },
  'tiefling': {
    male: ['Akmenos', 'Amnon', 'Barakas', 'Damakos', 'Ekemon', 'Iados', 'Kairon', 'Leucis', 'Melech', 'Mordai', 'Morthos', 'Pelaios', 'Skamos', 'Therai', 'Zovvak'],
    female: ['Akta', 'Anakis', 'Bryseis', 'Criella', 'Damaia', 'Ea', 'Kallista', 'Lerissa', 'Makaria', 'Nemeia', 'Orianna', 'Phelaia', 'Rieta', 'Tanis', 'Zelaia'],
    clan: ['Bloodthorn', 'Darkfire', 'Embersoul', 'Grimhallow', 'Hellborn', 'Infernus', 'Nightshade', 'Shadowflame', 'Soulreaper', 'Voidwalker'],
  },
}

export function getBaseRaceId(raceId: string): string {
  // Direct match first
  if (raceId in DND_RACE_NAMES) return raceId

  // Subrace IDs: check first segment before the first dash
  const firstSegment = raceId.split('-')[0]
  if (firstSegment && firstSegment in DND_RACE_NAMES) return firstSegment

  return raceId
}

export function generateCharacterName(raceId: string, gender: DndGender): string | null {
  const baseId = getBaseRaceId(raceId)
  const raceData = DND_RACE_NAMES[baseId]
  if (!raceData) return null

  const firstNames = raceData[gender]
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const clanName = raceData.clan[Math.floor(Math.random() * raceData.clan.length)]

  return `${firstName} ${clanName}`
}
