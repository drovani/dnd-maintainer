-- D&D 5th Edition Campaign Manager - Initial Schema
-- Migration: 00001
-- Description: Create the complete database schema for campaign management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Trigger Function for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now() at time zone 'utc';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CAMPAIGNS TABLE
-- ============================================================================

CREATE TABLE campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    setting text,
    created_at timestamptz NOT NULL DEFAULT (now() at time zone 'utc'),
    updated_at timestamptz NOT NULL DEFAULT (now() at time zone 'utc')
);

CREATE TRIGGER campaigns_updated_at_trigger
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CHARACTERS TABLE
-- ============================================================================

CREATE TABLE characters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name text NOT NULL,
    character_type text NOT NULL CHECK (character_type IN ('pc', 'npc')),
    player_name text,
    race text,
    class text,
    subclass text,
    level integer NOT NULL DEFAULT 1,
    background text,
    alignment text,
    experience_points integer NOT NULL DEFAULT 0,
    hit_points_max integer,
    hit_points_current integer,
    hit_points_temp integer NOT NULL DEFAULT 0,
    armor_class integer,
    speed integer NOT NULL DEFAULT 30,
    initiative_bonus integer NOT NULL DEFAULT 0,
    proficiency_bonus integer NOT NULL DEFAULT 2,
    abilities jsonb NOT NULL DEFAULT '{"str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10}'::jsonb,
    saving_throws jsonb DEFAULT '{}'::jsonb,
    skills jsonb DEFAULT '{}'::jsonb,
    features jsonb DEFAULT '[]'::jsonb,
    equipment jsonb DEFAULT '[]'::jsonb,
    spells jsonb DEFAULT '{"cantrips": [], "level_1": {"slots_max": 0, "slots_used": 0, "spells": []}}'::jsonb,
    notes text,
    personality_traits text,
    ideals text,
    bonds text,
    flaws text,
    appearance text,
    backstory text,
    portrait_url text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT (now() at time zone 'utc'),
    updated_at timestamptz NOT NULL DEFAULT (now() at time zone 'utc')
);

CREATE TRIGGER characters_updated_at_trigger
BEFORE UPDATE ON characters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_characters_campaign_id ON characters(campaign_id);

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================

CREATE TABLE sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    session_number integer NOT NULL,
    name text,
    date date,
    summary text,
    notes text,
    experience_awarded integer NOT NULL DEFAULT 0,
    loot jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT (now() at time zone 'utc'),
    updated_at timestamptz NOT NULL DEFAULT (now() at time zone 'utc')
);

CREATE TRIGGER sessions_updated_at_trigger
BEFORE UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_sessions_campaign_id ON sessions(campaign_id);

-- ============================================================================
-- ENCOUNTERS TABLE
-- ============================================================================

CREATE TABLE encounters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
    campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    status text NOT NULL CHECK (status IN ('planned', 'active', 'completed')) DEFAULT 'planned',
    round integer NOT NULL DEFAULT 0,
    combatants jsonb DEFAULT '[]'::jsonb,
    notes text,
    created_at timestamptz NOT NULL DEFAULT (now() at time zone 'utc'),
    updated_at timestamptz NOT NULL DEFAULT (now() at time zone 'utc')
);

CREATE TRIGGER encounters_updated_at_trigger
BEFORE UPDATE ON encounters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_encounters_campaign_id ON encounters(campaign_id);
CREATE INDEX idx_encounters_session_id ON encounters(session_id);

-- ============================================================================
-- NOTES TABLE
-- ============================================================================

CREATE TABLE notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text,
    category text DEFAULT 'general' CHECK (category IN ('lore', 'npc', 'location', 'quest', 'item', 'general')),
    tags text[] DEFAULT ARRAY[]::text[],
    is_pinned boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT (now() at time zone 'utc'),
    updated_at timestamptz NOT NULL DEFAULT (now() at time zone 'utc')
);

CREATE TRIGGER notes_updated_at_trigger
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_notes_campaign_id ON notes(campaign_id);
CREATE INDEX idx_notes_category ON notes(category);

-- ============================================================================
-- Grants (if using authentication)
-- ============================================================================

-- These grants ensure the anon and authenticated roles can access the tables
GRANT SELECT ON campaigns, characters, sessions, encounters, notes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON campaigns, characters, sessions, encounters, notes TO authenticated;

-- Enable Row Level Security (optional, comment out if not using RLS)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
