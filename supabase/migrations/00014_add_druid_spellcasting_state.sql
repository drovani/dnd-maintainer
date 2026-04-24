-- Add prepared_spells column to characters table for Druid spellcasting state.
-- Druids prepare spells from their spell list each long rest; this column stores
-- the current set of prepared spell IDs as a JSON array of strings.
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS prepared_spells JSONB NOT NULL DEFAULT '[]'::jsonb;
