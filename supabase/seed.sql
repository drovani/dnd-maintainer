-- D&D Campaign Manager - Seed Data
-- One demo campaign with no pre-made characters.
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

COMMIT;
