-- Phase 0: Source → Grant → Resolver skeleton
-- Drops flat mechanical columns, adds physical traits, creates build-level tables

-- Step 1: Drop obsolete constraints from migration 00006
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_race_check;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_class_check;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_alignment_check;

-- Step 2: Drop is_npc generated column
ALTER TABLE characters DROP COLUMN IF EXISTS is_npc;

-- Step 3: Drop flat mechanical columns
ALTER TABLE characters
  DROP COLUMN IF EXISTS abilities,
  DROP COLUMN IF EXISTS saving_throws,
  DROP COLUMN IF EXISTS skills,
  DROP COLUMN IF EXISTS proficiencies,
  DROP COLUMN IF EXISTS features,
  DROP COLUMN IF EXISTS equipment,
  DROP COLUMN IF EXISTS spells,
  DROP COLUMN IF EXISTS hit_points_max,
  DROP COLUMN IF EXISTS hit_points_current,
  DROP COLUMN IF EXISTS hit_points_temp,
  DROP COLUMN IF EXISTS armor_class,
  DROP COLUMN IF EXISTS initiative_bonus,
  DROP COLUMN IF EXISTS proficiency_bonus,
  DROP COLUMN IF EXISTS speed,
  DROP COLUMN IF EXISTS experience_points;

-- Step 4: Add physical trait columns
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS size text,
  ADD COLUMN IF NOT EXISTS age text,
  ADD COLUMN IF NOT EXISTS height text,
  ADD COLUMN IF NOT EXISTS weight text,
  ADD COLUMN IF NOT EXISTS eye_color text,
  ADD COLUMN IF NOT EXISTS hair_color text,
  ADD COLUMN IF NOT EXISTS skin_color text;

-- Step 5: Re-add pre-calculated columns as nullable
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS hit_points_max integer,
  ADD COLUMN IF NOT EXISTS armor_class integer,
  ADD COLUMN IF NOT EXISTS speed integer,
  ADD COLUMN IF NOT EXISTS proficiency_bonus integer;

-- Step 6: Change level default to 0
ALTER TABLE characters ALTER COLUMN level SET DEFAULT 0;

-- Step 7: Create character_build_levels table
CREATE TABLE IF NOT EXISTS character_build_levels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    sequence integer NOT NULL,
    base_abilities jsonb,
    ability_method text,
    class_id text,
    class_level integer,
    subclass_id text,
    asi_allocation jsonb,
    feat_id text,
    hp_roll integer,
    choices jsonb NOT NULL DEFAULT '{}',
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    UNIQUE (character_id, sequence),
    CHECK (asi_allocation IS NULL OR feat_id IS NULL),
    CHECK (
      (sequence = 0 AND class_id IS NULL AND class_level IS NULL)
      OR
      (sequence > 0 AND class_id IS NOT NULL AND class_level IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_build_levels_character
  ON character_build_levels(character_id, sequence)
  WHERE deleted_at IS NULL;

-- Step 8: Create character_items table
CREATE TABLE IF NOT EXISTS character_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    equipped boolean NOT NULL DEFAULT false,
    attuned boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    updated_at timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS idx_character_items_character ON character_items(character_id);

CREATE TRIGGER update_character_items_updated_at
  BEFORE UPDATE ON character_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Grant access and enable RLS
GRANT SELECT ON character_build_levels, character_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON character_build_levels, character_items TO authenticated;

ALTER TABLE character_build_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_items ENABLE ROW LEVEL SECURITY;
