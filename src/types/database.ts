// Core D&D ability scores
export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// Saving throws with ability + proficiency bonus
export interface SavingThrow {
  ability: keyof AbilityScores;
  proficient: boolean;
  bonus?: number;
}

// Skills mapped to abilities
export interface Skill {
  name: string;
  ability: keyof AbilityScores;
  proficient: boolean;
  bonus?: number;
}

// Character features and traits
export interface Feature {
  id: string;
  name: string;
  description: string;
  source: string; // class, race, feat, etc.
}

// Equipment/items
export interface EquipmentItem {
  id: string;
  name: string;
  type: string; // weapon, armor, adventuring gear, etc.
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

// Campaign model
export interface Campaign {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  setting?: string;
  status: "active" | "paused" | "completed" | "planning";
  image_url?: string;
  dm_notes?: string;
}

// Character model
export interface Character {
  id: string;
  created_at: string;
  updated_at: string;
  campaign_id: string;
  user_id?: string;
  name: string;
  player_name?: string;
  class: string;
  race: string;
  level: number;
  experience?: number;
  alignment: string;
  background?: string;
  hit_points: number;
  armor_class: number;
  speed: number; // in feet
  ability_scores: AbilityScores;
  saving_throws?: SavingThrow[];
  skills?: Skill[];
  features?: Feature[];
  equipment?: EquipmentItem[];
  spells?: Spell[];
  personality_traits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  backstory?: string;
  image_url?: string;
  is_npc?: boolean;
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

// Encounter (combat encounter or major event)
export interface Encounter {
  id: string;
  created_at: string;
  updated_at: string;
  campaign_id: string;
  session_id?: string;
  name: string;
  description?: string;
  location?: string;
  difficulty: "trivial" | "easy" | "medium" | "hard" | "deadly";
  combatants: Combatant[];
  status: "planning" | "active" | "completed";
  notes?: string;
}

// Session (play session)
export interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  campaign_id: string;
  session_number: number;
  title: string;
  description?: string;
  date: string;
  duration_minutes?: number;
  location?: string;
  summary?: string;
  xp_awarded?: number;
  encounters?: Encounter[];
  image_url?: string;
  status: "planned" | "in-progress" | "completed";
}

// DM Notes
export interface Note {
  id: string;
  created_at: string;
  updated_at: string;
  campaign_id: string;
  title: string;
  content: string;
  category: "lore" | "npc" | "location" | "quest" | "item" | "general";
  tags?: string[];
  pinned?: boolean;
}

// Loot item/treasure
export interface LootItem {
  id: string;
  name: string;
  type: string; // weapon, armor, potion, scroll, treasure, etc.
  rarity: "common" | "uncommon" | "rare" | "very-rare" | "legendary" | "artifact";
  quantity: number;
  description?: string;
  gold_value?: number;
}

// Encounter loot table
export interface LootTable {
  id: string;
  created_at: string;
  updated_at: string;
  campaign_id: string;
  name: string;
  description?: string;
  items: LootItem[];
}

// NPC model
export interface NPC extends Character {
  role?: string; // innkeeper, guard, quest-giver, etc.
  affiliation?: string; // guild, town, faction, etc.
}

// Campaign-specific rules/houserules
export interface HouseRule {
  id: string;
  created_at: string;
  updated_at: string;
  campaign_id: string;
  title: string;
  description: string;
  category: "combat" | "spells" | "magic-items" | "rules" | "other";
}
