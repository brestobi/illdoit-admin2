-- Migration: Fix email triggers — use app_secrets table instead of current_setting()
-- Date: 2026-06-24
--
-- Supabase managed Postgres doesn't allow custom GUC parameters via
-- current_setting(). This migration replaces that approach with a
-- dedicated app_secrets table that all trigger functions read from.

-- 1. Create secrets table
CREATE TABLE IF NOT EXISTS public.app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 2. Insert the webhook secret (used by all email edge functions)
INSERT INTO public.app_secrets (key, value)
VALUES ('webhook_secret', '508f423ffe41fb6759568814f33f732a79fe38f01a5d36ce65d707b239a51007')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Drop the old trigger functions (they used current_setting)
-- These will be recreated by the individual migration files below.

-- Note: The updated trigger functions are now part of each individual
-- email trigger migration. Re-run those migrations if you need to
-- recreate them. The key change in each function is:
--
--   OLD: current_setting('app.settings.webhook_secret')
--   NEW: SELECT value INTO _secret FROM public.app_secrets WHERE key = 'webhook_secret'
