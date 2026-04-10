ALTER TABLE character_items
  ADD COLUMN source jsonb;

COMMENT ON COLUMN character_items.source IS
  'Provenance tag mirroring TypeScript SourceTag. Written at materialization (grant-sourced) or by loot/gift flows.';

CREATE INDEX IF NOT EXISTS idx_character_items_source_origin
  ON character_items((source->>'origin'));
