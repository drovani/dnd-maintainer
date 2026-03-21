-- Normalize race, class, and background from English names to IDs
-- This migration aligns these columns with alignment/skills which already use IDs

-- Normalize characters.race: English name → ID (case-insensitive matching via LOWER/TRIM)
UPDATE characters SET race = CASE LOWER(TRIM(race))
  WHEN 'dragonborn'         THEN 'dragonborn'
  WHEN 'hill dwarf'         THEN 'dwarf-hill'
  WHEN 'mountain dwarf'     THEN 'dwarf-mountain'
  WHEN 'dark elf (drow)'    THEN 'elf-dark'
  WHEN 'high elf'           THEN 'elf-high'
  WHEN 'wood elf'           THEN 'elf-wood'
  WHEN 'forest gnome'       THEN 'gnome-forest'
  WHEN 'rock gnome'         THEN 'gnome-rock'
  WHEN 'half-elf'           THEN 'halfelf'
  WHEN 'half-orc'           THEN 'halforc'
  WHEN 'lightfoot halfling' THEN 'halfling-lightfoot'
  WHEN 'stout halfling'     THEN 'halfling-stout'
  WHEN 'human'              THEN 'human'
  WHEN 'tiefling'           THEN 'tiefling'
  ELSE race
END
WHERE race IS NOT NULL AND race != LOWER(TRIM(race))
   OR race IN (
  'Dragonborn', 'Hill Dwarf', 'Mountain Dwarf', 'Dark Elf (Drow)',
  'High Elf', 'Wood Elf', 'Forest Gnome', 'Rock Gnome',
  'Half-Elf', 'Half-Orc', 'Lightfoot Halfling', 'Stout Halfling',
  'Human', 'Tiefling'
);

-- Normalize characters.class: class IDs are just lowercase versions of names
UPDATE characters SET class = LOWER(class)
WHERE class IS NOT NULL AND class != LOWER(class);

-- Normalize characters.background: case-insensitive matching via LOWER/TRIM
-- Custom/free-text backgrounds are intentionally left untouched
-- WARNING: migration 00007 adds a CHECK constraint limiting background to these IDs plus 'custom'
UPDATE characters SET background = CASE LOWER(TRIM(background))
  WHEN 'acolyte'        THEN 'acolyte'
  WHEN 'charlatan'      THEN 'charlatan'
  WHEN 'criminal'       THEN 'criminal'
  WHEN 'entertainer'    THEN 'entertainer'
  WHEN 'folk hero'      THEN 'folkhero'
  WHEN 'guild artisan'  THEN 'guildartisan'
  WHEN 'hermit'         THEN 'hermit'
  WHEN 'noble'          THEN 'noble'
  WHEN 'outlander'      THEN 'outlander'
  WHEN 'sage'           THEN 'sage'
  WHEN 'sailor'         THEN 'sailor'
  WHEN 'soldier'        THEN 'soldier'
  WHEN 'urchin'         THEN 'urchin'
  WHEN 'custom'         THEN 'custom'
  ELSE background
END
WHERE background IS NOT NULL AND background != LOWER(TRIM(background))
   OR background IN (
  'Acolyte', 'Charlatan', 'Criminal', 'Entertainer', 'Folk Hero',
  'Guild Artisan', 'Hermit', 'Noble', 'Outlander', 'Sage',
  'Sailor', 'Soldier', 'Urchin', 'Custom'
);

-- Normalize encounters.combatants JSONB: lowercase condition strings in each combatant's conditions array
UPDATE encounters
SET combatants = (
  SELECT jsonb_agg(
    CASE
      WHEN combatant ? 'conditions' AND jsonb_typeof(combatant -> 'conditions') = 'array' THEN
        combatant || jsonb_build_object(
          'conditions',
          COALESCE(
            (SELECT jsonb_agg(LOWER(condition))
             FROM jsonb_array_elements_text(combatant -> 'conditions') AS condition),
            '[]'::jsonb
          )
        )
      ELSE combatant
    END
  )
  FROM jsonb_array_elements(combatants) AS combatant
)
WHERE combatants IS NOT NULL AND jsonb_array_length(combatants) > 0;
