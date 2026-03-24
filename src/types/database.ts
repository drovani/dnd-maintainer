import type {
  AlignmentId,
  ArmorProficiencyId,
  ClassId,
  DndGender,
  LanguageId,
  RaceId,
  ToolProficiencyId,
  WeaponProficiencyId,
} from "@/lib/dnd-helpers";
import type { ThemeId } from "@/lib/theme";

// Ability scores using short-form keys matching DB jsonb schema
export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export type AbilityKey = keyof AbilityScores;

// Saving throws with ability + proficiency bonus
export interface SavingThrow {
  ability: AbilityKey;
  proficient: boolean;
  bonus?: number;
}

// Skills mapped to abilities
export interface Skill {
  name: string;
  ability: AbilityKey;
  proficient: boolean;
  bonus?: number;
}

// Proficiencies & Languages
export interface Proficiencies {
  armor: ArmorProficiencyId[];
  weapons: WeaponProficiencyId[];
  tools: ToolProficiencyId[];
  toolChoices: ToolProficiencyId[];
  languages: LanguageId[];
  languageChoices: LanguageId[];
}

// Character features and traits
export interface Feature {
  id: string;
  name: string;
  description: string;
  source: string; // class, race, feat, etc.
  uses?: number;
}

// Equipment/items
export interface EquipmentItem {
  id: string;
  name: string;
  type?: string; // weapon, armor, adventuring gear, etc.
  quantity: number;
  weight?: number;
  value?: {
    amount: number;
    currency: "cp" | "sp" | "ep" | "gp" | "pp";
  };
  description?: string;
  equipped?: boolean;
}

// Spells
export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  components: string[];
  description: string;
  prepared?: boolean;
  known?: boolean;
}

export interface Campaign {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string | null;
  setting?: string | null;
  status: "active" | "paused" | "completed" | "planning" | null;
  image_url?: string | null;
  dm_notes?: string | null;
  /** null = inherit global preference; a ThemeId = explicit override for this campaign */
  theme: ThemeId | null;
  archived_at?: string | null;
}

export interface Character {
  id: string;
  created_at: string;
  updated_at: string;
  campaign_id: string;
  name: string;
  player_name: string | null;
  character_type: "pc" | "npc";
  race: RaceId | null;
  class: ClassId | null;
  subclass: string | null;
  level: number;
  background: string | null;
  alignment: AlignmentId | null;
  experience_points: number;
  hit_points_max: number | null;
  hit_points_current: number | null;
  hit_points_temp: number;
  armor_class: number | null;
  speed: number;
  initiative_bonus: number;
  proficiency_bonus: number;
  abilities: AbilityScores;
  saving_throws?: Record<string, { proficient: boolean }> | null;
  skills: Record<string, { proficient: boolean; expertise: boolean }> | null;
  proficiencies: Proficiencies | null;
  features: Feature[] | null;
  equipment: EquipmentItem[] | null;
  spells: {
    cantrips: string[];
    spellsByLevel?: Record<number, string[]>;
    spellSlots?: Record<number, number>;
  } | null;
  personality_traits: string | null;
  ideals: string | null;
  bonds: string | null;
  flaws: string | null;
  appearance: string | null;
  backstory: string | null;
  notes: string | null;
  portrait_url: string | null;
  is_npc: boolean | null;
  is_active: boolean;
  status: "draft" | "ready";
  gender: DndGender | null;
}

// Combat participant
export interface Combatant {
  id: string;
  name: string;
  type: "character" | "enemy" | "ally";
  initiative: number;
  hit_points: number;
  armor_class: number;
  status: "healthy" | "injured" | "unconscious" | "dead";
  conditions: string[];
}

export interface Encounter {
  id: string;
  created_at: string;
  updated_at: string;
  campaign_id: string;
  session_id?: string | null;
  name: string;
  description?: string | null;
  combatants: Combatant[] | null;
  round: number;
  status: "planning" | "active" | "completed";
  notes?: string | null;
}

export interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  campaign_id: string;
  session_number: number;
  title: string | null;
  date: string | null;
  summary?: string | null;
  experience_awarded: number;
  loot?: unknown | null;
  notes?: string | null;
}

// DM Notes
export interface Note {
  id: string;
  created_at: string;
  updated_at: string;
  campaign_id: string;
  title: string;
  content: string | null;
  category: "lore" | "npc" | "location" | "quest" | "item" | "general" | null;
  tags?: string[] | null;
  is_pinned: boolean;
}

// Summary types for list views (subset of full types)
export type CampaignSummary = Pick<
  Campaign,
  "id" | "name" | "description" | "setting" | "status" | "theme" | "created_at" | "updated_at" | "archived_at"
>;
export type CharacterSummary = Pick<
  Character,
  | "id"
  | "campaign_id"
  | "name"
  | "player_name"
  | "character_type"
  | "is_npc"
  | "race"
  | "class"
  | "subclass"
  | "level"
  | "hit_points_max"
  | "armor_class"
  | "updated_at"
>;
export type SessionSummary = Pick<
  Session,
  | "id"
  | "campaign_id"
  | "session_number"
  | "title"
  | "date"
  | "summary"
  | "experience_awarded"
  | "created_at"
  | "updated_at"
>;
export type EncounterSummary = Pick<
  Encounter,
  "id" | "campaign_id" | "session_id" | "name" | "description" | "status" | "round" | "created_at" | "updated_at"
>;
export type NoteSummary = Pick<
  Note,
  "id" | "campaign_id" | "title" | "category" | "tags" | "is_pinned" | "created_at" | "updated_at"
>;
