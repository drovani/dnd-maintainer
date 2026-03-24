ALTER TABLE characters
ADD COLUMN IF NOT EXISTS proficiencies jsonb
DEFAULT '{"armor":[],"weapons":[],"tools":[],"toolChoices":[],"languages":[],"languageChoices":[]}'::jsonb;
