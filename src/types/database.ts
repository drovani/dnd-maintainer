import type { AlignmentId, ClassId, DndGender, Proficiencies, RaceId, SizeId } from '@/lib/dnd-helpers'
import type { ThemeId } from '@/lib/theme'

export type { Proficiencies }

// Ability scores using short-form keys matching DB jsonb schema
export interface AbilityScores {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

export type AbilityKey = keyof AbilityScores

export interface Campaign {
  id: string
  slug: string
  previous_slugs: string[]
  created_at: string
  updated_at: string
  name: string
  description?: string | null
  setting?: string | null
  status: 'active' | 'paused' | 'completed' | 'planning' | null
  image_url?: string | null
  dm_notes?: string | null
  /** null = inherit global preference; a ThemeId = explicit override for this campaign */
  theme: ThemeId | null
  archived_at?: string | null
}

export interface Character {
  id: string
  slug: string
  previous_slugs: string[]
  created_at: string
  updated_at: string
  campaign_id: string
  name: string
  player_name: string | null
  character_type: 'pc' | 'npc'
  race: RaceId | null
  class: ClassId | null
  subclass: string | null
  level: number
  background: string | null
  alignment: AlignmentId | null
  gender: DndGender | null
  size: SizeId | null
  age: string | null
  height: string | null
  weight: string | null
  eye_color: string | null
  hair_color: string | null
  skin_color: string | null
  hit_points_max: number | null
  armor_class: number | null
  speed: number | null
  proficiency_bonus: number | null
  personality_traits: string | null
  ideals: string | null
  bonds: string | null
  flaws: string | null
  appearance: string | null
  backstory: string | null
  notes: string | null
  portrait_url: string | null
  is_active: boolean
  status: 'draft' | 'ready'
}

// Combat participant
export interface Combatant {
  id: string
  name: string
  type: 'character' | 'enemy' | 'ally'
  initiative: number
  hit_points: number
  armor_class: number
  status: 'healthy' | 'injured' | 'unconscious' | 'dead'
  conditions: string[]
}

export interface Encounter {
  id: string
  created_at: string
  updated_at: string
  campaign_id: string
  session_id?: string | null
  name: string
  description?: string | null
  combatants: Combatant[] | null
  round: number
  status: 'planning' | 'active' | 'completed'
  notes?: string | null
}

export interface Session {
  id: string
  slug: string
  previous_slugs: string[]
  created_at: string
  updated_at: string
  campaign_id: string
  session_number: number
  name: string | null
  date: string | null
  summary?: string | null
  experience_awarded: number
  loot?: unknown | null
  notes?: string | null
}

// DM Notes
export interface Note {
  id: string
  created_at: string
  updated_at: string
  campaign_id: string
  title: string
  content: string | null
  category: 'lore' | 'npc' | 'location' | 'quest' | 'item' | 'general' | null
  tags?: string[] | null
  is_pinned: boolean
}

// Summary types for list views (subset of full types)
export type CampaignSummary = Pick<Campaign, 'id' | 'slug' | 'name' | 'description' | 'setting' | 'status' | 'theme' | 'created_at' | 'updated_at' | 'archived_at'>
export type CharacterSummary = Pick<Character, 'id' | 'slug' | 'campaign_id' | 'name' | 'player_name' | 'character_type' | 'race' | 'class' | 'subclass' | 'level' | 'hit_points_max' | 'armor_class' | 'updated_at'>
export type SessionSummary = Pick<Session, 'id' | 'slug' | 'campaign_id' | 'session_number' | 'name' | 'date' | 'summary' | 'experience_awarded' | 'created_at' | 'updated_at'>
export type EncounterSummary = Pick<Encounter, 'id' | 'campaign_id' | 'session_id' | 'name' | 'description' | 'status' | 'round' | 'created_at' | 'updated_at'>
export type NoteSummary = Pick<Note, 'id' | 'campaign_id' | 'title' | 'category' | 'tags' | 'is_pinned' | 'created_at' | 'updated_at'>
