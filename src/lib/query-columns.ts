export const CAMPAIGN_SUMMARY_COLS = 'id, name, description, setting, status, theme, created_at, updated_at, archived_at' as const;
export const CAMPAIGN_DETAIL_COLS = 'id, name, description, setting, status, image_url, dm_notes, theme, created_at, updated_at, archived_at' as const;

export const CHARACTER_SUMMARY_COLS = 'id, campaign_id, name, player_name, character_type, is_npc, race, class, subclass, level, hit_points_max, armor_class, updated_at' as const;
export const CHARACTER_DETAIL_COLS = 'id, campaign_id, name, player_name, character_type, is_npc, race, class, subclass, background, alignment, gender, level, experience_points, hit_points_max, hit_points_current, hit_points_temp, armor_class, speed, initiative_bonus, proficiency_bonus, abilities, saving_throws, skills, proficiencies, features, equipment, spells, personality_traits, ideals, bonds, flaws, appearance, backstory, notes, portrait_url, is_active, status, created_at, updated_at' as const;

export const SESSION_SUMMARY_COLS = 'id, campaign_id, session_number, title, date, summary, experience_awarded, created_at, updated_at' as const;
export const SESSION_DETAIL_COLS = 'id, campaign_id, session_number, title, date, summary, experience_awarded, loot, notes, created_at, updated_at' as const;

export const ENCOUNTER_SUMMARY_COLS = 'id, campaign_id, session_id, name, description, status, round, created_at, updated_at' as const;
export const ENCOUNTER_DETAIL_COLS = 'id, campaign_id, session_id, name, description, combatants, round, status, notes, created_at, updated_at' as const;

export const NOTE_SUMMARY_COLS = 'id, campaign_id, title, category, tags, is_pinned, created_at, updated_at' as const;
export const NOTE_DETAIL_COLS = 'id, campaign_id, title, content, category, tags, is_pinned, created_at, updated_at' as const;
