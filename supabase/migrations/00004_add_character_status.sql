-- Adds draft/ready status lifecycle to characters table for the builder autosave workflow.
ALTER TABLE characters ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'ready'));
