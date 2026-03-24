ALTER TABLE campaigns ADD COLUMN theme text
  CHECK (theme IN ('default', 'sylvan', 'arcane'));

COMMENT ON COLUMN campaigns.theme IS 'Color theme override for this campaign. NULL inherits global preference.';
