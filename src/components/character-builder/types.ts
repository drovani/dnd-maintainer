import type { AlignmentId, BackgroundId, ClassId, DndGender, RaceId } from '@/lib/dnd-helpers'
import type { AbilityScores } from '@/types/database'

export interface CharacterData {
  // Basics
  name: string
  player_name: string
  character_type: 'pc' | 'npc'
  race: RaceId | ''
  class: ClassId | ''
  level: number
  background: BackgroundId | ''
  custom_background: string
  alignment: AlignmentId | ''
  gender: DndGender | ''

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

