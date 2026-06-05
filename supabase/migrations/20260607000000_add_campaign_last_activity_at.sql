-- Migration: campaign last_activity_at computed field
-- Adds a PostgREST computed field on `campaigns` returning the most recent recorded
-- session date, falling back to the campaign's created_at when it has no dated
-- sessions. This lets the campaign list sort by real play activity instead of
-- `updated_at`, so non-activity edits (e.g. changing the theme) no longer reorder it.
--
-- SECURITY INVOKER (the default): the function runs as the calling role, so the
-- permissive per-table RLS policies apply to its `sessions` read just like a direct
-- query would. Follows the search_path hardening convention — empty search_path with
-- schema-qualified references; see 20260602000000_harden_function_search_path.sql.

CREATE OR REPLACE FUNCTION public.last_activity_at(c public.campaigns)
RETURNS timestamptz
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT coalesce(max(s.date)::timestamptz, c.created_at)
  FROM public.sessions s
  WHERE s.campaign_id = c.id;
$$;

-- PostgREST executes computed fields as the request role; grant execute explicitly
-- (mirrors the per-table GRANTs in the initial schema) rather than relying on the
-- default PUBLIC execute privilege.
GRANT EXECUTE ON FUNCTION public.last_activity_at(public.campaigns) TO anon, authenticated;
