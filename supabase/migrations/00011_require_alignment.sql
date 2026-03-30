-- Migration: 00011
-- Description: Make alignment a required field on characters

-- Backfill any existing NULL alignments to 'n' (True Neutral)
UPDATE characters SET alignment = 'n' WHERE alignment IS NULL;

-- Add NOT NULL constraint
ALTER TABLE characters ALTER COLUMN alignment SET NOT NULL;
ALTER TABLE characters ALTER COLUMN alignment SET DEFAULT 'n';
