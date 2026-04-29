-- D&D Campaign Manager - Seed Data
-- One demo campaign with 12 PC seed characters, one per class.
-- Slug columns are intentionally omitted — the trigger_manage_slug() trigger fires on INSERT.

SET standard_conforming_strings = ON;

BEGIN;

-- campaigns
INSERT INTO campaigns (id, name, status, description)
VALUES (
  'aaaaaaaa-0000-4000-8000-000000000001',
  'Demo Campaign',
  'active',
  'A demonstration campaign showcasing all character archetypes.'
);

-- characters (12 PCs, one per class)
INSERT INTO characters (campaign_id, name, character_type, species, class, background, alignment, level, status, is_active)
VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Gareth Ironforge',       'pc', 'human',      'fighter',   'soldier',     'lg', 1, 'ready', true),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Anastrianna Galanodel',  'pc', 'elf',        'wizard',    'sage',        'ng', 1, 'ready', true),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Lidda Tosscobble',       'pc', 'halfling',   'rogue',     'criminal',    'cn', 1, 'ready', true),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Adrik Balderk',          'pc', 'dwarf',      'cleric',    'acolyte',     'ln', 1, 'ready', true),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Erdan Siannodel',        'pc', 'elf',        'ranger',    'outlander',   'ng', 1, 'ready', true),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Bharash Daardendrian',   'pc', 'dragonborn', 'paladin',   'noble',       'lg', 1, 'ready', true),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Mara Stoneheart',        'pc', 'human',      'barbarian', 'outlander',   'cn', 1, 'ready', true),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Breena Goodbarrel',      'pc', 'halfling',   'bard',      'entertainer', 'cg', 1, 'ready', true),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Ella Folkor',            'pc', 'gnome',      'druid',     'hermit',      'n',  1, 'ready', true),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Himo Meliamne',          'pc', 'elf',        'monk',      'acolyte',     'ln', 1, 'ready', true),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Damaia Hellborn',        'pc', 'tiefling',   'sorcerer',  'charlatan',   'cn', 1, 'ready', true),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Akta Voidwalker',        'pc', 'tiefling',   'warlock',   'sage',        'ne', 1, 'ready', true);

COMMIT;
