ALTER TABLE characters ADD COLUMN IF NOT EXISTS gender text
  CHECK (gender IS NULL OR gender IN ('male', 'female'));
