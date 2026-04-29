-- D&D 5th Edition Campaign Manager - Squashed Initial Schema
-- Migration: 00001
-- Description: Single squashed migration replacing the original 13 migrations.
--   This is a DESTRUCTIVE reset — all previous migration history is discarded.
--   Reflects the 2024 D&D ruleset: simplified species IDs, no is_npc computed column,
--   slug support, and alignment required by default.

-- gen_random_uuid() is a PG 13+ built-in; no uuid-ossp extension needed.

-- ============================================================================
-- Utility: update_updated_at_column()
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now() at time zone 'utc';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Slug generation function
-- ============================================================================

-- STABLE (not IMMUTABLE): same inputs produce same output within one command, but Postgres cannot pre-evaluate at plan time.
CREATE OR REPLACE FUNCTION generate_slug(entity_name text, entity_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  hex8        text;
  cleaned     text;
  all_words   text[];
  stop_words  text[] := ARRAY['a','an','the','of','in','on','at','to','for','and','or','but','with','by','from'];
  usable      text[];
  word        text;
  base        text;
  result      text;
BEGIN
  -- 8-hex disambiguator derived from the start of the UUID
  hex8 := substring(replace(entity_id::text, '-', '') FROM 1 FOR 8);

  -- Fallback for NULL or blank names
  IF entity_name IS NULL OR trim(entity_name) = '' THEN
    RETURN 'draft-' || hex8;
  END IF;

  -- Lowercase and replace non-alphanumeric (except spaces/hyphens) with space
  cleaned := lower(regexp_replace(entity_name, '[^a-z0-9 \-]', ' ', 'gi'));

  -- Split into words on whitespace or hyphens
  all_words := regexp_split_to_array(trim(cleaned), '[\s\-]+');

  -- Collect non-stop words
  usable := ARRAY[]::text[];
  FOREACH word IN ARRAY all_words LOOP
    IF word <> '' AND NOT (word = ANY(stop_words)) THEN
      usable := usable || word;
    END IF;
  END LOOP;

  -- If all words were stop words, fall back to first 2 original words
  IF array_length(usable, 1) IS NULL OR array_length(usable, 1) = 0 THEN
    usable := ARRAY[]::text[];
    FOREACH word IN ARRAY all_words LOOP
      IF word <> '' THEN
        usable := usable || word;
        IF array_length(usable, 1) >= 2 THEN
          EXIT;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Take first 2 usable words
  IF array_length(usable, 1) >= 2 THEN
    base := usable[1] || '-' || usable[2];
  ELSIF array_length(usable, 1) = 1 THEN
    base := usable[1];
  ELSE
    RETURN 'draft-' || hex8;
  END IF;

  -- Truncate base to 15 chars, append suffix
  base   := substring(base FROM 1 FOR 15);
  result := base || '-' || hex8;

  -- Total max 24 chars (15 base + 1 dash + 8 hex = 24)
  RETURN substring(result FROM 1 FOR 24);
END;
$$;

-- ============================================================================
-- Trigger function: manage slug on INSERT and name-changing UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_manage_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
      NEW.slug := generate_slug(NEW.name, NEW.id);
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      -- Preserve old slugs so previous URLs continue to resolve; lookup is performed
      -- in the application layer using the GIN index on previous_slugs.
      IF OLD.slug <> '' AND NOT (OLD.slug = ANY(NEW.previous_slugs)) THEN
        NEW.previous_slugs := NEW.previous_slugs || OLD.slug;
      END IF;
      NEW.slug := generate_slug(NEW.name, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- CAMPAIGNS TABLE
-- ============================================================================

CREATE TABLE campaigns (
    id          uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text      NOT NULL DEFAULT '',
    previous_slugs text[] NOT NULL DEFAULT ARRAY[]::text[],
    name        text      NOT NULL,
    description text,
    setting     text,
    status      text      DEFAULT 'planning'
                          CHECK (status IN ('active', 'paused', 'completed', 'planning')),
    image_url   text,
    dm_notes    text,
    theme       text
                CHECK (theme IN ('default', 'sylvan', 'arcane')),
    archived_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT (now() at time zone 'utc'),
    updated_at  timestamptz NOT NULL DEFAULT (now() at time zone 'utc')
);

COMMENT ON COLUMN campaigns.theme IS 'Color theme override for this campaign. NULL inherits global preference.';

CREATE UNIQUE INDEX idx_campaigns_slug          ON campaigns (slug);
CREATE INDEX        idx_campaigns_previous_slugs ON campaigns USING GIN (previous_slugs);

CREATE TRIGGER campaigns_updated_at_trigger
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER campaigns_manage_slug
BEFORE INSERT OR UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION trigger_manage_slug();

-- ============================================================================
-- CHARACTERS TABLE
-- ============================================================================

CREATE TABLE characters (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            text        NOT NULL DEFAULT '',
    previous_slugs  text[]      NOT NULL DEFAULT ARRAY[]::text[],
    campaign_id     uuid        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name            text        NOT NULL,
    character_type  text        NOT NULL CHECK (character_type IN ('pc', 'npc')),
    player_name     text,
    species         text
                    CHECK (species IS NULL OR species IN (
                      'aasimar', 'dragonborn', 'dwarf', 'elf', 'gnome',
                      'goliath', 'halfling', 'human', 'orc', 'tiefling'
                    )),
    class           text
                    CHECK (class IS NULL OR class IN (
                      'barbarian', 'bard', 'cleric', 'druid', 'fighter',
                      'monk', 'paladin', 'ranger', 'rogue',
                      'sorcerer', 'warlock', 'wizard'
                    )),
    subclass        text,
    level           integer     NOT NULL DEFAULT 0,
    background      text
                    CHECK (background IS NULL OR background IN (
                      'acolyte', 'artisan', 'charlatan', 'criminal', 'entertainer', 'farmer',
                      'guard', 'guide', 'hermit', 'merchant', 'noble', 'sage',
                      'sailor', 'scribe', 'soldier', 'wayfarer'
                    )),
    alignment       text        NOT NULL DEFAULT 'n'
                    CHECK (alignment IN ('lg', 'ng', 'cg', 'ln', 'n', 'cn', 'le', 'ne', 'ce')),
    gender          text
                    CHECK (gender IS NULL OR gender IN ('male', 'female')),
    size            text,
    age             text,
    height          text,
    weight          text,
    eye_color       text,
    hair_color      text,
    skin_color      text,
    hit_points_max  integer,
    armor_class     integer,
    speed           integer,
    proficiency_bonus integer,
    notes           text,
    personality_traits text,
    ideals          text,
    bonds           text,
    flaws           text,
    appearance      text,
    backstory       text,
    portrait_url    text,
    is_active       boolean     NOT NULL DEFAULT true,
    status          text        NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'ready')),
    created_at      timestamptz NOT NULL DEFAULT (now() at time zone 'utc'),
    updated_at      timestamptz NOT NULL DEFAULT (now() at time zone 'utc')
);

CREATE UNIQUE INDEX idx_characters_slug          ON characters (slug);
CREATE INDEX        idx_characters_previous_slugs ON characters USING GIN (previous_slugs);
CREATE INDEX        idx_characters_campaign_id    ON characters(campaign_id);

CREATE TRIGGER characters_updated_at_trigger
BEFORE UPDATE ON characters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER characters_manage_slug
BEFORE INSERT OR UPDATE ON characters
FOR EACH ROW EXECUTE FUNCTION trigger_manage_slug();

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================

CREATE TABLE sessions (
    id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug               text        NOT NULL DEFAULT '',
    previous_slugs     text[]      NOT NULL DEFAULT ARRAY[]::text[],
    campaign_id        uuid        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    session_number     integer     NOT NULL,
    name               text,
    date               date,
    summary            text,
    notes              text,
    experience_awarded integer     NOT NULL DEFAULT 0,
    loot               jsonb       DEFAULT '[]'::jsonb,
    created_at         timestamptz NOT NULL DEFAULT (now() at time zone 'utc'),
    updated_at         timestamptz NOT NULL DEFAULT (now() at time zone 'utc')
);

CREATE UNIQUE INDEX idx_sessions_slug          ON sessions (slug);
CREATE INDEX        idx_sessions_previous_slugs ON sessions USING GIN (previous_slugs);
CREATE INDEX        idx_sessions_campaign_id    ON sessions(campaign_id);

CREATE TRIGGER sessions_updated_at_trigger
BEFORE UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sessions_manage_slug
BEFORE INSERT OR UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION trigger_manage_slug();

-- ============================================================================
-- ENCOUNTERS TABLE
-- ============================================================================

CREATE TABLE encounters (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  uuid        REFERENCES sessions(id) ON DELETE CASCADE,
    campaign_id uuid        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name        text        NOT NULL,
    description text,
    status      text        NOT NULL DEFAULT 'planning'
                CHECK (status IN ('planning', 'active', 'completed')),
    round       integer     NOT NULL DEFAULT 0,
    combatants  jsonb       DEFAULT '[]'::jsonb,
    notes       text,
    created_at  timestamptz NOT NULL DEFAULT (now() at time zone 'utc'),
    updated_at  timestamptz NOT NULL DEFAULT (now() at time zone 'utc')
);

CREATE INDEX idx_encounters_campaign_id ON encounters(campaign_id);
CREATE INDEX idx_encounters_session_id  ON encounters(session_id);

CREATE TRIGGER encounters_updated_at_trigger
BEFORE UPDATE ON encounters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- NOTES TABLE
-- ============================================================================

CREATE TABLE notes (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    title       text        NOT NULL,
    content     text,
    category    text        DEFAULT 'general'
                CHECK (category IN ('lore', 'npc', 'location', 'quest', 'item', 'general')),
    tags        text[]      DEFAULT ARRAY[]::text[],
    is_pinned   boolean     NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT (now() at time zone 'utc'),
    updated_at  timestamptz NOT NULL DEFAULT (now() at time zone 'utc')
);

CREATE INDEX idx_notes_campaign_id ON notes(campaign_id);
CREATE INDEX idx_notes_category    ON notes(category);

CREATE TRIGGER notes_updated_at_trigger
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CHARACTER_BUILD_LEVELS TABLE
-- ============================================================================

CREATE TABLE character_build_levels (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id    uuid        NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    sequence        integer     NOT NULL,
    base_abilities  jsonb,
    ability_method  text,
    class_id        text,
    class_level     integer,
    subclass_id     text,
    asi_allocation  jsonb,
    feat_id         text,
    hp_roll         integer,
    choices         jsonb       NOT NULL DEFAULT '{}',
    deleted_at      timestamptz,
    created_at      timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    UNIQUE (character_id, sequence),
    CHECK (asi_allocation IS NULL OR feat_id IS NULL),  -- ASI and feat are mutually exclusive at each level-up
    CHECK (
      (sequence = 0 AND class_id IS NULL AND class_level IS NULL)
      OR
      (sequence > 0 AND class_id IS NOT NULL AND class_level IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_build_levels_character
  ON character_build_levels(character_id, sequence)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- CHARACTER_ITEMS TABLE
-- ============================================================================

CREATE TABLE character_items (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id uuid        NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id      text        NOT NULL,
    quantity     integer     NOT NULL DEFAULT 1,
    equipped     boolean     NOT NULL DEFAULT false,
    attuned      boolean     NOT NULL DEFAULT false,
    source       jsonb,
    created_at   timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    updated_at   timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

COMMENT ON COLUMN character_items.source IS
  'Provenance tag mirroring TypeScript SourceTag (src/types/sources.ts). Written at materialization (grant-sourced) or by loot flows. Validated in application layer.';

CREATE INDEX IF NOT EXISTS idx_character_items_character     ON character_items(character_id);
CREATE INDEX IF NOT EXISTS idx_character_items_source_origin ON character_items((source->>'origin'));

CREATE TRIGGER update_character_items_updated_at
  BEFORE UPDATE ON character_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (permissive — no auth policies yet)
-- Replace with user-scoped policies once authentication is implemented.
-- WARNING: anon role currently has unrestricted DML on all tables via the GRANTs above.
-- This is intentional for local development only — not for production.
-- ============================================================================

ALTER TABLE campaigns             ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_build_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_items       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to campaigns"              ON campaigns              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to characters"             ON characters             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sessions"               ON sessions               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to encounters"             ON encounters             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to notes"                  ON notes                  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to character_build_levels" ON character_build_levels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to character_items"        ON character_items        FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- GRANTs
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON campaigns, characters, sessions, encounters, notes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON character_build_levels, character_items TO anon, authenticated;
