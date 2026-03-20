-- Add CHECK constraints to enforce valid IDs for normalized columns
-- These columns were normalized from English names to IDs in migration 00006

ALTER TABLE characters ADD CONSTRAINT characters_race_valid CHECK (
  race IS NULL OR race IN (
    'dragonborn', 'dwarf-hill', 'dwarf-mountain',
    'elf-dark', 'elf-high', 'elf-wood',
    'gnome-forest', 'gnome-rock',
    'halfelf', 'halforc',
    'halfling-lightfoot', 'halfling-stout',
    'human', 'tiefling'
  )
);

ALTER TABLE characters ADD CONSTRAINT characters_class_valid CHECK (
  class IS NULL OR class IN (
    'barbarian', 'bard', 'cleric', 'druid', 'fighter',
    'monk', 'paladin', 'ranger', 'rogue', 'sorcerer',
    'warlock', 'wizard'
  )
);

ALTER TABLE characters ADD CONSTRAINT characters_background_valid CHECK (
  background IS NULL OR background IN (
    'acolyte', 'charlatan', 'criminal', 'entertainer', 'folkhero',
    'guildartisan', 'hermit', 'noble', 'outlander', 'sage',
    'sailor', 'soldier', 'urchin', 'custom'
  )
);
