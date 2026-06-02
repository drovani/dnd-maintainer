-- Migration: harden function search_path (security review H2)
-- Recreates the existing trigger/helper functions with `SET search_path = ''` so they
-- cannot be hijacked by a mutable search_path. Object references are schema-qualified.
--
-- These functions are SECURITY INVOKER today, so the risk is latent — but any future
-- SECURITY DEFINER auth helper (membership checks, owner_id enforcement triggers) MUST
-- follow this same pattern, or a mutable search_path becomes a privilege-escalation vector.
-- See docs/security-review-2026-06-01.md (H2).

-- ============================================================================
-- update_updated_at_column() — only references pg_catalog built-ins (now()),
-- which are always resolvable even with an empty search_path.
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now() at time zone 'utc';
    RETURN NEW;
END;
$$;

-- ============================================================================
-- generate_slug() — string helpers used here all live in pg_catalog, so an empty
-- search_path is sufficient; no application schema objects are referenced.
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_slug(entity_name text, entity_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = ''
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
-- trigger_manage_slug() — calls generate_slug(), which is now schema-qualified
-- (public.generate_slug) because the empty search_path no longer resolves
-- unqualified names in the public schema.
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_manage_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
      NEW.slug := public.generate_slug(NEW.name, NEW.id);
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      -- Preserve old slugs so previous URLs continue to resolve; lookup is performed
      -- in the application layer using the GIN index on previous_slugs.
      IF OLD.slug <> '' AND NOT (OLD.slug = ANY(NEW.previous_slugs)) THEN
        NEW.previous_slugs := NEW.previous_slugs || OLD.slug;
      END IF;
      NEW.slug := public.generate_slug(NEW.name, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
