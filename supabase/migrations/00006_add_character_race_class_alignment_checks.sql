ALTER TABLE characters
ADD CONSTRAINT characters_race_check
CHECK (race IS NULL OR race IN (
  'dragonborn', 'dwarf-hill', 'dwarf-mountain',
  'elf-dark', 'elf-high', 'elf-wood',
  'gnome-forest', 'gnome-rock',
  'halfelf', 'halforc',
  'halfling-lightfoot', 'halfling-stout',
  'human', 'tiefling'
));

ALTER TABLE characters
ADD CONSTRAINT characters_class_check
CHECK (class IS NULL OR class IN (
  'barbarian', 'bard', 'cleric', 'druid', 'fighter',
  'monk', 'paladin', 'ranger', 'rogue',
  'sorcerer', 'warlock', 'wizard'
));

ALTER TABLE characters
ADD CONSTRAINT characters_alignment_check
CHECK (alignment IS NULL OR alignment IN (
  'lg', 'ng', 'cg', 'ln', 'n', 'cn', 'le', 'ne', 'ce'
));
