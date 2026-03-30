-- Migration: 00010
-- Description: Add permissive RLS policies for character_build_levels and character_items
-- These tables had RLS enabled in 00009 but no policies were created, blocking all access.
-- TODO: Replace these permissive policies with user-scoped policies when authentication is implemented.

-- Grant INSERT/UPDATE/DELETE to anon role (00009 only granted to authenticated)
GRANT INSERT, UPDATE, DELETE ON character_build_levels, character_items TO anon;

-- character_build_levels
CREATE POLICY "Allow all access to character_build_levels" ON character_build_levels
  FOR ALL USING (true) WITH CHECK (true);

-- character_items
CREATE POLICY "Allow all access to character_items" ON character_items
  FOR ALL USING (true) WITH CHECK (true);
