-- D&D Campaign Manager - Add Slug Columns
-- Migration: 00012
-- Description: Add slug and previous_slugs columns to campaigns, characters, and sessions.
--   Slugs are human-readable URL identifiers generated from entity names.
--   Also renames sessions.title to sessions.name.

-- ============================================================================
-- Rename sessions.title to sessions.name (idempotent guard)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'sessions'
      AND column_name  = 'title'
  ) THEN
    ALTER TABLE sessions RENAME COLUMN title TO name;
  END IF;
END;
$$;

-- ============================================================================
-- Slug generation function
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_slug(entity_name text, entity_id uuid)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  hex4        text;
  cleaned     text;
  all_words   text[];
  stop_words  text[] := ARRAY['a','an','the','of','in','on','at','to','for','and','or','but','with','by','from'];
  usable      text[];
  word        text;
  base        text;
  result      text;
BEGIN
  -- 4-hex suffix derived from the UUID
  hex4 := substring(replace(entity_id::text, '-', '') FROM 1 FOR 4);

  -- Fallback for NULL or blank names
  IF entity_name IS NULL OR trim(entity_name) = '' THEN
    RETURN 'draft-' || hex4;
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
    RETURN 'draft-' || hex4;
  END IF;

  -- Truncate base to 15 chars, append suffix
  base   := substring(base FROM 1 FOR 15);
  result := base || '-' || hex4;

  -- Total max 20 chars (15 base + 1 dash + 4 hex = 20)
  RETURN substring(result FROM 1 FOR 20);
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
      -- Archive the old slug into previous_slugs (avoid duplicates)
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
-- campaigns: add slug columns, index, trigger, backfill
-- ============================================================================

ALTER TABLE campaigns ADD COLUMN slug          text   NOT NULL DEFAULT '';
ALTER TABLE campaigns ADD COLUMN previous_slugs text[] NOT NULL DEFAULT ARRAY[]::text[];

CREATE UNIQUE INDEX idx_campaigns_slug          ON campaigns (slug);
CREATE INDEX        idx_campaigns_previous_slugs ON campaigns USING GIN (previous_slugs);

CREATE TRIGGER campaigns_manage_slug
BEFORE INSERT OR UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION trigger_manage_slug();

UPDATE campaigns SET slug = generate_slug(name, id) WHERE slug = '';

-- ============================================================================
-- characters: add slug columns, index, trigger, backfill
-- ============================================================================

ALTER TABLE characters ADD COLUMN slug          text   NOT NULL DEFAULT '';
ALTER TABLE characters ADD COLUMN previous_slugs text[] NOT NULL DEFAULT ARRAY[]::text[];

CREATE UNIQUE INDEX idx_characters_slug          ON characters (slug);
CREATE INDEX        idx_characters_previous_slugs ON characters USING GIN (previous_slugs);

CREATE TRIGGER characters_manage_slug
BEFORE INSERT OR UPDATE ON characters
FOR EACH ROW EXECUTE FUNCTION trigger_manage_slug();

UPDATE characters SET slug = generate_slug(name, id) WHERE slug = '';

-- ============================================================================
-- sessions: add slug columns, index, trigger, backfill
-- ============================================================================

ALTER TABLE sessions ADD COLUMN slug          text   NOT NULL DEFAULT '';
ALTER TABLE sessions ADD COLUMN previous_slugs text[] NOT NULL DEFAULT ARRAY[]::text[];

CREATE UNIQUE INDEX idx_sessions_slug          ON sessions (slug);
CREATE INDEX        idx_sessions_previous_slugs ON sessions USING GIN (previous_slugs);

CREATE TRIGGER sessions_manage_slug
BEFORE INSERT OR UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION trigger_manage_slug();

UPDATE sessions SET slug = generate_slug(name, id) WHERE slug = '';
