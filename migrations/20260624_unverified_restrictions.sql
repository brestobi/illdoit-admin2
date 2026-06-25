-- Migration: Block unverified users from posting services/jobs and withdrawing
-- Date: 2026-06-24
--
-- Creates trigger functions that prevent users who haven't completed identity
-- verification from creating services, posting jobs, or requesting withdrawals.
-- This wraps the suspension check + adds the verification check.

-- 1. Enhanced check function that combines account active + verification checks
CREATE OR REPLACE FUNCTION public.check_can_post_or_withdraw()
RETURNS TRIGGER AS $$
DECLARE
  _account_status VARCHAR;
  _verification_status VARCHAR;
  _target_user_id UUID;
BEGIN
  -- Determine which user to check based on the table
  _target_user_id := CASE
    WHEN TG_TABLE_NAME = 'services' THEN NEW.user_id
    WHEN TG_TABLE_NAME = 'jobs' THEN NEW.client_id
    WHEN TG_TABLE_NAME = 'withdrawal_requests' THEN NEW.user_id
    ELSE auth.uid()
  END;

  -- If no user ID found (service_role without context), allow
  IF _target_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fetch user statuses
  SELECT account_status, verification_status
  INTO _account_status, _verification_status
  FROM public.users
  WHERE id = _target_user_id;

  -- Check account is active
  IF _account_status IS NULL OR _account_status != 'active' THEN
    RAISE EXCEPTION 'Account suspended: Your account has been restricted. Contact support for assistance.'
      USING HINT = 'Your account status prevents this action.';
  END IF;

  -- Unverified users cannot post, create services, or withdraw
  IF TG_TABLE_NAME IN ('services', 'jobs', 'withdrawal_requests') THEN
    IF _verification_status IS NULL OR _verification_status != 'verified' THEN
      RAISE EXCEPTION 'Verification required: You must complete identity verification before posting jobs, services, or requesting withdrawals.'
        USING HINT = 'Complete your identity verification in Profile Settings.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop old suspension-only triggers and replace with combined triggers

-- Services
DROP TRIGGER IF EXISTS check_account_before_insert_services ON public.services;
DROP TRIGGER IF EXISTS check_account_before_update_services ON public.services;
CREATE TRIGGER check_can_post_before_insert_services
  BEFORE INSERT ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.check_can_post_or_withdraw();
CREATE TRIGGER check_can_post_before_update_services
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.check_can_post_or_withdraw();

-- Jobs
DROP TRIGGER IF EXISTS check_account_before_insert_jobs ON public.jobs;
DROP TRIGGER IF EXISTS check_account_before_update_jobs ON public.jobs;
CREATE TRIGGER check_can_post_before_insert_jobs
  BEFORE INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.check_can_post_or_withdraw();
CREATE TRIGGER check_can_post_before_update_jobs
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.check_can_post_or_withdraw();

-- Withdrawal Requests
DROP TRIGGER IF EXISTS check_account_before_insert_withdrawals ON public.withdrawal_requests;
DROP TRIGGER IF EXISTS check_account_before_update_withdrawals ON public.withdrawal_requests;
CREATE TRIGGER check_can_post_before_insert_withdrawals
  BEFORE INSERT ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.check_can_post_or_withdraw();
CREATE TRIGGER check_can_post_before_update_withdrawals
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.check_can_post_or_withdraw();

-- Note: Orders, job_applications, messages, reviews, disputes, user_reports
-- still use the old check_account_active() function. This is intentional —
-- those actions don't require identity verification, only an active account.
