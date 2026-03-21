-- D&D 5th Edition Campaign Manager - Sample Data
-- Seed: Lost Mines of Phandelver Campaign

-- ============================================================================
-- CAMPAIGNS
-- ============================================================================

INSERT INTO campaigns (id, name, description, setting) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'The Accidental Vanguard',
    'Three unlikely heroes stumble into a crisis larger than any single world: the dimensional fabric is fraying. Ancient arcane reagents — scattered across a dozen realms by a forgotten catastrophe — are the only materials that can stabilize the weave before it collapses entirely. Armed with a battered compass that points not north but elsewhere, the party must slide between worlds, navigate each realm''s unique dangers, and gather what they need before the windows between worlds close forever.',
    'Inter-dimensional (D&D 5e)'
);

-- ============================================================================
-- CHARACTERS - Player Characters
-- ============================================================================

INSERT INTO characters (
    id, campaign_id, name, character_type, player_name, race, class, subclass,
    level, background, alignment, gender, hit_points_max, hit_points_current, armor_class,
    speed, proficiency_bonus, abilities, personality_traits, ideals, bonds, flaws,
    appearance, backstory
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Braxus Ironforge',
    'pc',
    'Marcus',
    'human',
    'fighter',
    'Champion',
    1,
    'soldier',
    'lg',
    'male',
    12,
    12,
    16,
    30,
    2,
    '{"str": 16, "dex": 10, "con": 14, "int": 10, "wis": 13, "cha": 12}'::jsonb,
    'I always stand up for those who are weaker than me.',
    'Duty and honor are paramount.',
    'I owe my life to a fellow soldier who saved me.',
    'I have a quick temper and can be reckless in combat.',
    'A broad-shouldered human with a scarred face, standing 6 feet tall. Wears well-maintained plate armor.',
    'A former soldier who left the army to seek adventure and fortune in the Sword Coast.'
),
(
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Silvara Moonwhisper',
    'pc',
    'Jessica',
    'elf-high',
    'wizard',
    'Evocation',
    1,
    'sage',
    'cg',
    'female',
    6,
    6,
    12,
    30,
    2,
    '{"str": 8, "dex": 14, "con": 10, "int": 16, "wis": 12, "cha": 13}'::jsonb,
    'I have a quick wit and use humor to defuse tension.',
    'Knowledge is more precious than gold.',
    'I study the mysteries of magic to understand my elven heritage.',
    'I trust my mind over my instincts, which has gotten me into trouble.',
    'A graceful elf with silver hair and sharp features. Typically wears simple robes and carries a quarterstaff.',
    'A scholarly elf who left the elven forest to study the mysteries of magic in the wider world.'
);

-- ============================================================================
-- CHARACTERS - Non-Player Characters
-- ============================================================================

INSERT INTO characters (
    id, campaign_id, name, character_type, race, class, level, alignment, gender,
    appearance, backstory
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Sildar Hallwinter',
    'npc',
    'human',
    'fighter',
    2,
    'lg',
    'male',
    'A weathered human in his 50s with a graying beard and a missing arm (lost in battle with goblins).',
    'A former adventurer and mercenary who now works as a merchant lord. Seeks the party''s aid in finding Gundren Rockseeker.'
),
(
    '550e8400-e29b-41d4-a716-446655440004'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Grol the Destroyer',
    'npc',
    'goblin',
    'fighter',
    3,
    'ce',
    'male',
    'A large goblin with battle scars and a cruel sneer. Wears armor fashioned from dark iron.',
    'The leader of the goblin tribe that captured Gundren. A cunning and brutal warlord.'
);

-- ============================================================================
-- SESSIONS
-- ============================================================================

INSERT INTO sessions (
    id, campaign_id, session_number, title, date, summary, notes, experience_awarded
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440010'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    1,
    'Ambush on the Sword Coast',
    '2026-03-11'::date,
    'The party was ambushed by goblins while traveling along the Sword Coast. They defeated the goblin ambush party and rescued a dwarf named Gunther who was being held captive. They learned from him that Gundren Rockseeker and his partner Sildar were captured by Grol the Destroyer.',
    'The party showed excellent teamwork in the first combat. Braxus'' display of combat skill was impressive. Silvara''s spell selection was strategic. The goblin ambush was just the beginning - the party will need to investigate further to find Gundren.',
    150
);

-- ============================================================================
-- ENCOUNTERS
-- ============================================================================

INSERT INTO encounters (
    id, session_id, campaign_id, name, description, status, round,
    combatants, notes
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440020'::uuid,
    '550e8400-e29b-41d4-a716-446655440010'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Goblin Ambush',
    'The party was ambushed by a gang of goblins on the Sword Coast road.',
    'completed',
    3,
    '[
        {"name": "Braxus Ironforge", "initiative": 11, "hp_max": 12, "hp_current": 12, "ac": 16, "conditions": [], "is_player": true, "character_id": "550e8400-e29b-41d4-a716-446655440001"},
        {"name": "Silvara Moonwhisper", "initiative": 14, "hp_max": 6, "hp_current": 6, "ac": 12, "conditions": [], "is_player": true, "character_id": "550e8400-e29b-41d4-a716-446655440002"},
        {"name": "Goblin Warrior 1", "initiative": 9, "hp_max": 7, "hp_current": 0, "ac": 15, "conditions": ["unconscious"], "is_player": false, "character_id": null},
        {"name": "Goblin Warrior 2", "initiative": 8, "hp_max": 7, "hp_current": 0, "ac": 15, "conditions": ["unconscious"], "is_player": false, "character_id": null},
        {"name": "Grol the Destroyer", "initiative": 10, "hp_max": 22, "hp_current": 5, "ac": 17, "conditions": ["frightened"], "is_player": false, "character_id": "550e8400-e29b-41d4-a716-446655440004"}
    ]'::jsonb,
    'Grol fled combat after being surrounded. The party successfully defeated the goblin war party.'
);

-- ============================================================================
-- NOTES (DM Campaign Notes)
-- ============================================================================

INSERT INTO notes (
    id, campaign_id, title, content, category, tags, is_pinned
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440030'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Main Quest: Find Gundren Rockseeker',
    'Gundren was captured by goblins led by Grol the Destroyer. The goblins were hired by the Black Spider to prevent Gundren from opening the Lost Mine of Phandelver. The party must find the goblin hideout (Cragmaw Castle) and rescue Gundren.',
    'quest',
    ARRAY['main_quest', 'gundren', 'priority'],
    true
),
(
    '550e8400-e29b-41d4-a716-446655440031'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Phandalin Town Hook',
    'Phandalin is a sleepy frontier town that serves as a base for adventurers. Sildar Hallwinter has connections here. The town is threatened by a gang of ruffians called the Redbrand Mercenaries who are bullying the townsfolk.',
    'location',
    ARRAY['phandalin', 'town', 'redbrand'],
    false
),
(
    '550e8400-e29b-41d4-a716-446655440032'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'NPC: Sildar Hallwinter',
    'A former adventurer and mercenary in his 50s. Missing his left arm from a goblin attack. Friendly to the party and can provide information about Gundren and the mines. Uses Sildar as a source of quests and information.',
    'npc',
    ARRAY['ally', 'merchant', 'quest_giver'],
    false
),
(
    '550e8400-e29b-41d4-a716-446655440033'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Villain: The Black Spider',
    'A mysterious wizard who hired the goblins to capture Gundren. Wants to keep the Lost Mine of Phandelver secret. Likely operating from a stronghold somewhere in the region. Identity and motives remain unknown.',
    'npc',
    ARRAY['villain', 'enemy', 'mysterious'],
    false
),
(
    '550e8400-e29b-41d4-a716-446655440034'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Lore: The Lost Mine of Phandelver',
    'An ancient dwarven mine that produced exquisite mithril. It was lost centuries ago and its location has been forgotten. Recent discoveries suggest it may be rediscoverable. The mine contains vast wealth and powerful magical artifacts.',
    'lore',
    ARRAY['magic', 'dwarves', 'treasure'],
    false
);

-- ============================================================================
-- Summary
-- ============================================================================
-- Created campaign: "Lost Mines of Phandelver"
-- Player Characters: Braxus Ironforge (Fighter), Silvara Moonwhisper (Wizard)
-- NPCs: Sildar Hallwinter (Ally), Grol the Destroyer (Villain)
-- Sample Session: Goblin Ambush encounter
-- Campaign Notes: Quest hooks and NPC information for DM reference
