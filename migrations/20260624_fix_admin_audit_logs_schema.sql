-- Migration: Fix admin_audit_logs schema — ensure all columns exist
-- Date: 2026-06-24
--
-- This fixes the issue where admin_audit_logs was created without the
-- target_table column (e.g., from a previous partial migration run).
-- Since CREATE TABLE IF NOT EXISTS skips existing tables, missing
-- columns need to be added via ALTER TABLE ADD COLUMN IF NOT EXISTS.

DO $$
BEGIN
  -- Ensure target_table column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_audit_logs' AND column_name = 'target_table'
  ) THEN
    ALTER TABLE public.admin_audit_logs ADD COLUMN target_table VARCHAR;
  END IF;

  -- Ensure all other columns exist (safety check)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_audit_logs' AND column_name = 'admin_id'
  ) THEN
    ALTER TABLE public.admin_audit_logs ADD COLUMN admin_id UUID NOT NULL REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_audit_logs' AND column_name = 'action'
  ) THEN
    ALTER TABLE public.admin_audit_logs ADD COLUMN action VARCHAR NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_audit_logs' AND column_name = 'target_id'
  ) THEN
    ALTER TABLE public.admin_audit_logs ADD COLUMN target_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_audit_logs' AND column_name = 'old_data'
  ) THEN
    ALTER TABLE public.admin_audit_logs ADD COLUMN old_data JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_audit_logs' AND column_name = 'new_data'
  ) THEN
    ALTER TABLE public.admin_audit_logs ADD COLUMN new_data JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_audit_logs' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE public.admin_audit_logs ADD COLUMN ip_address VARCHAR;
  END IF;
END $$;
