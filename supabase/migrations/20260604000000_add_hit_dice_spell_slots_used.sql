ALTER TABLE characters ADD COLUMN hit_dice_used jsonb NOT NULL DEFAULT '{}';
ALTER TABLE characters ADD COLUMN spell_slots_used jsonb NOT NULL DEFAULT '{}';
