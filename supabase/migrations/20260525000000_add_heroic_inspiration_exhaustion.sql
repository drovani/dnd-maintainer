ALTER TABLE characters
  ADD COLUMN heroic_inspiration boolean NOT NULL DEFAULT false,
  ADD COLUMN exhaustion_level smallint NOT NULL DEFAULT 0
    CHECK (exhaustion_level BETWEEN 0 AND 6);
