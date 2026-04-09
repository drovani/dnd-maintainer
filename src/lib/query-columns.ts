export const CAMPAIGN_SUMMARY_COLS = 'id, slug, name, description, setting, status, theme, created_at, updated_at, archived_at' as const;
export const CAMPAIGN_DETAIL_COLS = 'id, slug, previous_slugs, name, description, setting, status, image_url, dm_notes, theme, created_at, updated_at, archived_at' as const;

export const CHARACTER_SUMMARY_COLS = 'id, slug, campaign_id, name, player_name, character_type, race, class, subclass, level, hit_points_max, armor_class, updated_at' as const;
export const CHARACTER_DETAIL_COLS = 'id, slug, previous_slugs, campaign_id, name, player_name, character_type, race, class, subclass, background, alignment, gender, size, age, height, weight, eye_color, hair_color, skin_color, level, hit_points_max, armor_class, speed, proficiency_bonus, personality_traits, ideals, bonds, flaws, appearance, backstory, notes, portrait_url, is_active, status, created_at, updated_at' as const;

export const SESSION_SUMMARY_COLS = 'id, slug, campaign_id, session_number, name, date, summary, experience_awarded, created_at, updated_at' as const;
export const SESSION_DETAIL_COLS = 'id, slug, previous_slugs, campaign_id, session_number, name, date, summary, experience_awarded, loot, notes, created_at, updated_at' as const;

export const ENCOUNTER_SUMMARY_COLS = 'id, campaign_id, session_id, name, description, status, round, created_at, updated_at' as const;
export const ENCOUNTER_DETAIL_COLS = 'id, campaign_id, session_id, name, description, combatants, round, status, notes, created_at, updated_at' as const;

export const NOTE_SUMMARY_COLS = 'id, campaign_id, title, category, tags, is_pinned, created_at, updated_at' as const;
export const NOTE_DETAIL_COLS = 'id, campaign_id, title, content, category, tags, is_pinned, created_at, updated_at' as const;
