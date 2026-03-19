import type { AbilityScores } from '@/types/database'

export interface CharacterData {
  // Basics
  name: string
  player_name: string
  character_type: 'pc' | 'npc'
  race: string
  class: string
  level: number
  background: string
  custom_background: string
  alignment: string

  // Abilities
  abilityMethod: 'standard-array' | 'point-buy' | 'rolling'
  abilities: AbilityScores
  abilityAssignments: Record<keyof AbilityScores, number | null>
  rolledValues: number[]

  // Skills
  skills: Record<string, { proficient: boolean; expertise: boolean }>

  // Features
  features: Array<{ id: string; name: string; description: string; source: string; uses: number }>

  // Equipment
  equipment: Array<{ id: string; name: string; quantity: number; weight: number; equipped: boolean }>

  // Spells
  spells: {
    cantrips: string[]
    spellsByLevel: Record<number, string[]>
    spellSlots: Record<number, number>
  }

  // Backstory
  personalityTraits: string
  ideals: string
  bonds: string
  flaws: string
  appearance: string
  backstory: string
}

export const ABILITY_NAMES: Record<keyof AbilityScores, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}
