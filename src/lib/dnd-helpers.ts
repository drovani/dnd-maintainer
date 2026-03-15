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
}

export interface DndSkill {
  id: string
  name: string
  ability: string
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
  },
  {
    id: 'bard',
    name: 'Bard',
    hitDie: 8,
    primaryAbility: 'Charisma',
    savingThrowProficiencies: ['Dexterity', 'Charisma'],
    spellcastingAbility: 'Charisma',
  },
  {
    id: 'cleric',
    name: 'Cleric',
    hitDie: 8,
    primaryAbility: 'Wisdom',
    savingThrowProficiencies: ['Wisdom', 'Charisma'],
    spellcastingAbility: 'Wisdom',
  },
  {
    id: 'druid',
    name: 'Druid',
    hitDie: 8,
    primaryAbility: 'Wisdom',
    savingThrowProficiencies: ['Intelligence', 'Wisdom'],
    spellcastingAbility: 'Wisdom',
  },
  {
    id: 'fighter',
    name: 'Fighter',
    hitDie: 10,
    primaryAbility: 'Strength',
    savingThrowProficiencies: ['Strength', 'Constitution'],
  },
  {
    id: 'monk',
    name: 'Monk',
    hitDie: 8,
    primaryAbility: 'Dexterity',
    savingThrowProficiencies: ['Strength', 'Dexterity'],
  },
  {
    id: 'paladin',
    name: 'Paladin',
    hitDie: 10,
    primaryAbility: 'Strength',
    savingThrowProficiencies: ['Wisdom', 'Charisma'],
    spellcastingAbility: 'Charisma',
  },
  {
    id: 'ranger',
    name: 'Ranger',
    hitDie: 10,
    primaryAbility: 'Dexterity',
    savingThrowProficiencies: ['Strength', 'Dexterity'],
    spellcastingAbility: 'Wisdom',
  },
  {
    id: 'rogue',
    name: 'Rogue',
    hitDie: 8,
    primaryAbility: 'Dexterity',
    savingThrowProficiencies: ['Dexterity', 'Intelligence'],
  },
  {
    id: 'sorcerer',
    name: 'Sorcerer',
    hitDie: 6,
    primaryAbility: 'Charisma',
    savingThrowProficiencies: ['Constitution', 'Charisma'],
    spellcastingAbility: 'Charisma',
  },
  {
    id: 'warlock',
    name: 'Warlock',
    hitDie: 8,
    primaryAbility: 'Charisma',
    savingThrowProficiencies: ['Wisdom', 'Charisma'],
    spellcastingAbility: 'Charisma',
  },
  {
    id: 'wizard',
    name: 'Wizard',
    hitDie: 6,
    primaryAbility: 'Intelligence',
    savingThrowProficiencies: ['Intelligence', 'Wisdom'],
    spellcastingAbility: 'Intelligence',
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
  { id: 'sleightofhand', name: 'Sleight of Hand', ability: 'Dexterity' },
  { id: 'stealth', name: 'Stealth', ability: 'Dexterity' },
  { id: 'survival', name: 'Survival', ability: 'Wisdom' },
  { id: 'religion', name: 'Religion', ability: 'Intelligence' },
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
