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
    level, background, alignment, gender, size, hit_points_max, armor_class,
    speed, proficiency_bonus, personality_traits, ideals, bonds, flaws,
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
    'medium',
    12,
    16,
    30,
    2,
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
    'medium',
    6,
    12,
    30,
    2,
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
    size, appearance, backstory
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
    'medium',
    'A weathered human in his 50s with a graying beard and a missing arm (lost in battle with goblins).',
    'A former adventurer and mercenary who now works as a merchant lord. Seeks the party''s aid in finding Gundren Rockseeker.'
),
(
    '550e8400-e29b-41d4-a716-446655440004'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Grol the Destroyer',
    'npc',
    'halforc',
    'fighter',
    3,
    'ce',
    'male',
    'medium',
    'A towering half-orc with battle scars and a cruel sneer. Wears armor fashioned from dark iron.',
    'The half-orc warlord who captured Gundren on behalf of the Black Spider. Cunning and brutal, he commands goblins through fear.'
);
INSERT INTO characters (
    id, campaign_id, name, character_type, player_name, race, class, subclass,
    level, background, alignment, size, hit_points_max, armor_class, speed, proficiency_bonus,
    notes, personality_traits, ideals, bonds, flaws, appearance, backstory,
    portrait_url, is_active, status, gender, created_at, updated_at
) VALUES
(
    '6e52661f-d630-4242-8dbb-539f12060fa5'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Seraphina Thorngage',
    'npc',
    NULL,
    'halfling-stout',
    'paladin',
    NULL,
    1,
    'Gutsy Striver',
    'lg',
    'small',
    12,
    10,
    25,
    2,
    NULL,
    'She carries herself like she''s six feet tall and has the battle scars to prove it — and somehow, in the moment, people believe her. The swagger is real; only the physical evidence is missing.

After every chaotic fight she walks away from, she goes quiet for just a moment — looks at her hands, looks around at the carnage, shakes her head slowly, and says something under her breath like "...how am I not dead right now." Then she straightens up and acts like it never happened.',
    'Justice from the Bottom Up. The strong don''t get to decide who matters. Rules and titles and institutions are all fine until the moment they start protecting the wrong people — and she has zero patience for that moment. She doesn''t need a mandate from a god or an order to know that a bully deserves to be knocked flat. The gods, she figures, can sort out the paperwork later.',
    'Her mentor, Aldric. A retired soldier — scarred, skeptical, and deeply uninterested in taking on another student when she found him. She talked him into it anyway. He trained her harder than anyone else precisely because he expected her to quit, and when she didn''t, he quietly revised his opinion of both her and himself. He gave her the longsword — it was his, once. Too heavy for her to wield properly. She wields it anyway.

Home, at arm''s length. She left her halfling community voluntarily, warmly, and with a lot of firm hugs. She loves them. She is not ready to go back. There''s something she needs to prove first — not to them, to herself — and she hasn''t proved it yet. She writes when she can.',
    'She cannot walk past it. A merchant berating a dockworker, a guard shaking down a child, a nobleman sneering at a servant — she will stop, she will intervene, and she will not calculate the odds first. She has started a remarkable number of fights this way. She has, inexplicably, survived all of them.

She also has a slight and persistent blind spot about her own physical limitations. Her first plan in any situation tends to assume capabilities she doesn''t quite have. Her second plan, improvised on the fly when the first plan meets reality, is usually better anyway.',
    'Seraphina is stout even by halfling standards — broad-shouldered, solid, built like someone who''s been climbing hills her whole life and found them insufficient. She wears studded leather that''s been mended in four places and cleaned in all of them. The longsword across her back is genuinely too large for her frame, which she is aware of and unbothered by.

Her eyes are the first thing people notice: direct, assessing, and faintly amused — like she''s already spotted the thing in the room that''s about to go sideways and is deciding whether to stop it or let it play out. She keeps her dark hair short and practical. She smells faintly of whatever she last grabbed as an improvised weapon, which is occasionally furniture polish.',
    'The Gutsy Striver grew up somewhere lovely, safe, and small — and left it voluntarily, on an ordinary morning, because she looked at the road out of town and decided she needed to know where it went. No tragedy. No catalyst. Just a halfling who woke up one day and understood that comfort and contentment aren''t the same thing.

She tried a knightly order first, drawn by the idea of doing something meaningful with the restlessness. The politics drove her out within a season — too much energy spent managing who sat at which table, not nearly enough spent on actually helping anyone. A temple came next; same problem, fancier robes. Institutions, she concluded, were designed for people who wanted to belong to something. She wanted to do something. She found Aldric living outside a market town, retired from the world and apparently committed to staying that way, and refused to leave until he agreed to train her. He made it hard on purpose, expecting her to quit. She didn''t.

What she can''t entirely explain is the luck. She''s been in situations that should have ended her — badly outnumbered, outmatched, occasionally on fire — and somehow they didn''t. She walks away, checks herself for damage that isn''t there, and genuinely cannot account for it. She doesn''t think she''s blessed, exactly. But something is either watching out for her, or the universe keeps miscounting, and she has learned not to examine it too hard in case examining it makes it stop.',
    NULL,
    TRUE,
    'ready',
    'female',
    '2026-03-24T17:23:47.256096+00:00',
    '2026-03-24T18:00:54.640906+00:00'
) ON CONFLICT (id) DO NOTHING;


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
-- CHARACTER BUILD LEVELS
-- ============================================================================

-- Braxus Ironforge (Human Fighter Level 1)
INSERT INTO character_build_levels (character_id, sequence, base_abilities, ability_method, choices)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    0,
    '{"str": 15, "dex": 13, "con": 14, "int": 8, "wis": 10, "cha": 12}'::jsonb,
    'standard-array',
    '{}'::jsonb
);

INSERT INTO character_build_levels (character_id, sequence, class_id, class_level, hp_roll, choices)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    1,
    'fighter',
    1,
    null,
    '{"skill-choice:class:fighter:0": {"type": "skill-choice", "skills": ["athletics", "intimidation"]}}'::jsonb
);

-- Seraphina Thorngage (Halfling-Stout Paladin Level 1)
INSERT INTO character_build_levels (character_id, sequence, base_abilities, ability_method, choices)
VALUES (
    '6e52661f-d630-4242-8dbb-539f12060fa5'::uuid,
    0,
    '{"str": 15, "dex": 10, "con": 14, "int": 8, "wis": 12, "cha": 13}'::jsonb,
    'standard-array',
    '{}'::jsonb
);

INSERT INTO character_build_levels (character_id, sequence, class_id, class_level, hp_roll, choices)
VALUES (
    '6e52661f-d630-4242-8dbb-539f12060fa5'::uuid,
    1,
    'paladin',
    1,
    null,
    '{}'::jsonb
);

-- ============================================================================
-- Summary
-- ============================================================================
-- Created campaign: "Lost Mines of Phandelver"
-- Player Characters: Braxus Ironforge (Fighter), Silvara Moonwhisper (Wizard)
-- NPCs: Sildar Hallwinter (Ally), Grol the Destroyer (Villain)
-- Sample Session: Goblin Ambush encounter
-- Campaign Notes: Quest hooks and NPC information for DM reference
