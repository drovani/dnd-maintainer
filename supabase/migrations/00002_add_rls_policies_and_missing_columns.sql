-- Migration: 00002
-- Description: Add permissive RLS policies (no auth yet) and missing campaigns columns

-- ============================================================================
-- Add missing columns to campaigns table
-- ============================================================================

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status text DEFAULT 'planning'
  CHECK (status IN ('active', 'paused', 'completed', 'planning'));
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS dm_notes text;

-- ============================================================================
-- Add is_npc convenience column to characters
-- The frontend uses is_npc but the DB only has character_type
-- ============================================================================

ALTER TABLE characters ADD COLUMN IF NOT EXISTS is_npc boolean
  GENERATED ALWAYS AS (character_type = 'npc') STORED;

-- ============================================================================
-- Permissive RLS policies (allow all operations for anon and authenticated)
-- Replace these with proper user-scoped policies once auth is implemented
-- ============================================================================

-- Grant INSERT/UPDATE/DELETE to anon role (currently only SELECT is granted)
GRANT INSERT, UPDATE, DELETE ON campaigns, characters, sessions, encounters, notes TO anon;

-- Campaigns
CREATE POLICY "Allow all access to campaigns" ON campaigns
  FOR ALL USING (true) WITH CHECK (true);

-- Characters
CREATE POLICY "Allow all access to characters" ON characters
  FOR ALL USING (true) WITH CHECK (true);

-- Sessions
CREATE POLICY "Allow all access to sessions" ON sessions
  FOR ALL USING (true) WITH CHECK (true);

-- Encounters
CREATE POLICY "Allow all access to encounters" ON encounters
  FOR ALL USING (true) WITH CHECK (true);

-- Notes
CREATE POLICY "Allow all access to notes" ON notes
  FOR ALL USING (true) WITH CHECK (true);
