-- Normalize race, class, and background from English names to IDs
-- This migration aligns these columns with alignment/skills which already use IDs

-- Normalize characters.race: English name → ID
UPDATE characters SET race = CASE race
  WHEN 'Dragonborn'         THEN 'dragonborn'
  WHEN 'Hill Dwarf'         THEN 'dwarf-hill'
  WHEN 'Mountain Dwarf'     THEN 'dwarf-mountain'
  WHEN 'Dark Elf (Drow)'    THEN 'elf-dark'
  WHEN 'High Elf'           THEN 'elf-high'
  WHEN 'Wood Elf'           THEN 'elf-wood'
  WHEN 'Forest Gnome'       THEN 'gnome-forest'
  WHEN 'Rock Gnome'         THEN 'gnome-rock'
  WHEN 'Half-Elf'           THEN 'halfelf'
  WHEN 'Half-Orc'           THEN 'halforc'
  WHEN 'Lightfoot Halfling' THEN 'halfling-lightfoot'
  WHEN 'Stout Halfling'     THEN 'halfling-stout'
  WHEN 'Human'              THEN 'human'
  WHEN 'Tiefling'           THEN 'tiefling'
  ELSE race
END
WHERE race IN (
  'Dragonborn', 'Hill Dwarf', 'Mountain Dwarf', 'Dark Elf (Drow)',
  'High Elf', 'Wood Elf', 'Forest Gnome', 'Rock Gnome',
  'Half-Elf', 'Half-Orc', 'Lightfoot Halfling', 'Stout Halfling',
  'Human', 'Tiefling'
);

-- Normalize characters.class: class IDs are just lowercase versions of names
UPDATE characters SET class = LOWER(class)
WHERE class IS NOT NULL AND class != LOWER(class);

-- Normalize characters.background: only update rows matching a known standard background name exactly
-- Custom/free-text backgrounds are intentionally left untouched
UPDATE characters SET background = CASE background
  WHEN 'Acolyte'      THEN 'acolyte'
  WHEN 'Charlatan'    THEN 'charlatan'
  WHEN 'Criminal'     THEN 'criminal'
  WHEN 'Entertainer'  THEN 'entertainer'
  WHEN 'Folk Hero'    THEN 'folkhero'
  WHEN 'Guild Artisan' THEN 'guildartisan'
  WHEN 'Hermit'       THEN 'hermit'
  WHEN 'Noble'        THEN 'noble'
  WHEN 'Outlander'    THEN 'outlander'
  WHEN 'Sage'         THEN 'sage'
  WHEN 'Sailor'       THEN 'sailor'
  WHEN 'Soldier'      THEN 'soldier'
  WHEN 'Urchin'       THEN 'urchin'
  WHEN 'Custom'       THEN 'custom'
  ELSE background
END
WHERE background IN (
  'Acolyte', 'Charlatan', 'Criminal', 'Entertainer', 'Folk Hero',
  'Guild Artisan', 'Hermit', 'Noble', 'Outlander', 'Sage',
  'Sailor', 'Soldier', 'Urchin', 'Custom'
);

-- Normalize encounters.combatants JSONB: lowercase condition strings in each combatant's conditions array
UPDATE encounters
SET combatants = (
  SELECT jsonb_agg(
    CASE
      WHEN combatant ? 'conditions' THEN
        combatant || jsonb_build_object(
          'conditions',
          (
            SELECT jsonb_agg(LOWER(condition))
            FROM jsonb_array_elements_text(combatant -> 'conditions') AS condition
          )
        )
      ELSE combatant
    END
  )
  FROM jsonb_array_elements(combatants) AS combatant
)
WHERE combatants IS NOT NULL AND jsonb_array_length(combatants) > 0;
