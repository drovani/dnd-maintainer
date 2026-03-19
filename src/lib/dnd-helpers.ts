// D&D 5e Helper Functions and Data

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
  abilityBonuses: Record<string, number>
}

export interface DndClass {
  id: string
  name: string
  hitDie: number
  primaryAbility: string
  savingThrowProficiencies: string[]
  spellcastingAbility?: string
  skillChoices: number
  skillPool: readonly string[] | null
}

export type AbilityName = 'Strength' | 'Dexterity' | 'Constitution' | 'Intelligence' | 'Wisdom' | 'Charisma'

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

export const DND_RACES: DndRace[] = [
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
]

export interface DndRaceGroup {
  label: string
  options: Array<{ value: string; label: string }>
}

export const DND_RACE_GROUPS: DndRaceGroup[] = [
  { label: 'Dragonborn', options: [{ value: 'Dragonborn', label: 'Dragonborn' }] },
  { label: 'Dwarf', options: [
    { value: 'Hill Dwarf', label: 'Hill Dwarf' },
    { value: 'Mountain Dwarf', label: 'Mountain Dwarf' },
  ]},
  { label: 'Elf', options: [
    { value: 'Dark Elf (Drow)', label: 'Dark Elf (Drow)' },
    { value: 'High Elf', label: 'High Elf' },
    { value: 'Wood Elf', label: 'Wood Elf' },
  ]},
  { label: 'Gnome', options: [
    { value: 'Forest Gnome', label: 'Forest Gnome' },
    { value: 'Rock Gnome', label: 'Rock Gnome' },
  ]},
  { label: 'Half-Elf', options: [{ value: 'Half-Elf', label: 'Half-Elf' }] },
  { label: 'Half-Orc', options: [{ value: 'Half-Orc', label: 'Half-Orc' }] },
  { label: 'Halfling', options: [
    { value: 'Lightfoot Halfling', label: 'Lightfoot Halfling' },
    { value: 'Stout Halfling', label: 'Stout Halfling' },
  ]},
  { label: 'Human', options: [{ value: 'Human', label: 'Human' }] },
  { label: 'Tiefling', options: [{ value: 'Tiefling', label: 'Tiefling' }] },
]

export const DND_CLASSES: DndClass[] = [
  {
    id: 'barbarian',
    name: 'Barbarian',
    hitDie: 12,
    primaryAbility: 'Strength',
    savingThrowProficiencies: ['Strength', 'Constitution'],
    skillChoices: 2,
    skillPool: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
  },
  {
    id: 'bard',
    name: 'Bard',
    hitDie: 8,
    primaryAbility: 'Charisma',
    savingThrowProficiencies: ['Dexterity', 'Charisma'],
    spellcastingAbility: 'Charisma',
    skillChoices: 3,
    skillPool: null,
  },
  {
    id: 'cleric',
    name: 'Cleric',
    hitDie: 8,
    primaryAbility: 'Wisdom',
    savingThrowProficiencies: ['Wisdom', 'Charisma'],
    spellcastingAbility: 'Wisdom',
    skillChoices: 2,
    skillPool: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
  },
  {
    id: 'druid',
    name: 'Druid',
    hitDie: 8,
    primaryAbility: 'Wisdom',
    savingThrowProficiencies: ['Intelligence', 'Wisdom'],
    spellcastingAbility: 'Wisdom',
    skillChoices: 2,
    skillPool: ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'],
  },
  {
    id: 'fighter',
    name: 'Fighter',
    hitDie: 10,
    primaryAbility: 'Strength',
    savingThrowProficiencies: ['Strength', 'Constitution'],
    skillChoices: 2,
    skillPool: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'],
  },
  {
    id: 'monk',
    name: 'Monk',
    hitDie: 8,
    primaryAbility: 'Dexterity',
    savingThrowProficiencies: ['Strength', 'Dexterity'],
    skillChoices: 2,
    skillPool: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'],
  },
  {
    id: 'paladin',
    name: 'Paladin',
    hitDie: 10,
    primaryAbility: 'Strength',
    savingThrowProficiencies: ['Wisdom', 'Charisma'],
    spellcastingAbility: 'Charisma',
    skillChoices: 2,
    skillPool: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    hitDie: 10,
    primaryAbility: 'Dexterity',
    savingThrowProficiencies: ['Strength', 'Dexterity'],
    spellcastingAbility: 'Wisdom',
    skillChoices: 3,
    skillPool: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'],
  },
  {
    id: 'rogue',
    name: 'Rogue',
    hitDie: 8,
    primaryAbility: 'Dexterity',
    savingThrowProficiencies: ['Dexterity', 'Intelligence'],
    skillChoices: 4,
    skillPool: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'],
  },
  {
    id: 'sorcerer',
    name: 'Sorcerer',
    hitDie: 6,
    primaryAbility: 'Charisma',
    savingThrowProficiencies: ['Constitution', 'Charisma'],
    spellcastingAbility: 'Charisma',
    skillChoices: 2,
    skillPool: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
  },
  {
    id: 'warlock',
    name: 'Warlock',
    hitDie: 8,
    primaryAbility: 'Charisma',
    savingThrowProficiencies: ['Wisdom', 'Charisma'],
    spellcastingAbility: 'Charisma',
    skillChoices: 2,
    skillPool: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'],
  },
  {
    id: 'wizard',
    name: 'Wizard',
    hitDie: 6,
    primaryAbility: 'Intelligence',
    savingThrowProficiencies: ['Intelligence', 'Wisdom'],
    spellcastingAbility: 'Intelligence',
    skillChoices: 2,
    skillPool: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'],
  },
]

export const DND_SKILLS: DndSkill[] = [
  { id: 'acrobatics', name: 'Acrobatics', ability: 'Dexterity' },
  { id: 'animalhandling', name: 'Animal Handling', ability: 'Wisdom' },
  { id: 'arcana', name: 'Arcana', ability: 'Intelligence' },
  { id: 'athletics', name: 'Athletics', ability: 'Strength' },
  { id: 'deception', name: 'Deception', ability: 'Charisma' },
  { id: 'history', name: 'History', ability: 'Intelligence' },
  { id: 'insight', name: 'Insight', ability: 'Wisdom' },
  { id: 'intimidation', name: 'Intimidation', ability: 'Charisma' },
  { id: 'investigation', name: 'Investigation', ability: 'Intelligence' },
  { id: 'medicine', name: 'Medicine', ability: 'Wisdom' },
  { id: 'nature', name: 'Nature', ability: 'Intelligence' },
  { id: 'perception', name: 'Perception', ability: 'Wisdom' },
  { id: 'performance', name: 'Performance', ability: 'Charisma' },
  { id: 'persuasion', name: 'Persuasion', ability: 'Charisma' },
  { id: 'religion', name: 'Religion', ability: 'Intelligence' },
  { id: 'sleightofhand', name: 'Sleight of Hand', ability: 'Dexterity' },
  { id: 'stealth', name: 'Stealth', ability: 'Dexterity' },
  { id: 'survival', name: 'Survival', ability: 'Wisdom' },
]

export const DND_BACKGROUNDS: DndBackground[] = [
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
]

export const DND_ALIGNMENTS: DndAlignment[] = [
  { id: 'lg', name: 'Lawful Good', shorthand: 'LG' },
  { id: 'ng', name: 'Neutral Good', shorthand: 'NG' },
  { id: 'cg', name: 'Chaotic Good', shorthand: 'CG' },
  { id: 'ln', name: 'Lawful Neutral', shorthand: 'LN' },
  { id: 'n', name: 'True Neutral', shorthand: 'N' },
  { id: 'cn', name: 'Chaotic Neutral', shorthand: 'CN' },
  { id: 'le', name: 'Lawful Evil', shorthand: 'LE' },
  { id: 'ne', name: 'Neutral Evil', shorthand: 'NE' },
  { id: 'ce', name: 'Chaotic Evil', shorthand: 'CE' },
]

export const ABILITY_ABBREVIATIONS: Readonly<Record<string, string>> = {
  Strength: 'STR',
  Dexterity: 'DEX',
  Constitution: 'CON',
  Intelligence: 'INT',
  Wisdom: 'WIS',
  Charisma: 'CHA',
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
