-- Migration: Server-side Suspension/Ban Enforcement
-- Date: 2026-06-24
--
-- Creates a trigger function that blocks INSERT/UPDATE operations on key
-- tables when the writing user's account is suspended or banned.
-- This works regardless of RLS (anon key) or service_role key usage.
--
-- Note: Admin operations via service_role key will also be blocked for
-- non-admin tables. Admins should use the admin panel's backend which
-- uses service_role and is already designed for admin workflows.

-- 1. Create the check function
CREATE OR REPLACE FUNCTION public.check_account_active()
RETURNS TRIGGER AS $$
DECLARE
  _account_status VARCHAR;
BEGIN
  -- Get the current user's account status
  -- auth.uid() works for both anon key (JWT) and service_role (when user context is set)
  SELECT account_status INTO _account_status
  FROM public.users
  WHERE id = auth.uid();

  -- If no user found (service_role without user context), allow the operation
  -- This is typically admin operations through the backend
  IF _account_status IS NULL THEN
    RETURN NEW;
  END IF;

  -- Block if suspended or banned
  IF _account_status NOT IN ('active') THEN
    RAISE EXCEPTION 'Account suspended: Your account has been restricted. Contact support for assistance.'
      USING HINT = 'Check your account status or contact support.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach triggers to relevant tables

-- Services (users create services)
CREATE TRIGGER check_account_before_insert_services
  BEFORE INSERT ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();
CREATE TRIGGER check_account_before_update_services
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();

-- Jobs (users post jobs)
CREATE TRIGGER check_account_before_insert_jobs
  BEFORE INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();
CREATE TRIGGER check_account_before_update_jobs
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();

-- Orders (users create orders)
CREATE TRIGGER check_account_before_insert_orders
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();
CREATE TRIGGER check_account_before_update_orders
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();

-- Job Applications (users apply for jobs)
CREATE TRIGGER check_account_before_insert_job_applications
  BEFORE INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();
CREATE TRIGGER check_account_before_update_job_applications
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();

-- Messages (users send messages)
CREATE TRIGGER check_account_before_insert_messages
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();

-- Reviews (users leave reviews)
CREATE TRIGGER check_account_before_insert_reviews
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();
CREATE TRIGGER check_account_before_update_reviews
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();

-- Disputes (users raise disputes)
CREATE TRIGGER check_account_before_insert_disputes
  BEFORE INSERT ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();
CREATE TRIGGER check_account_before_update_disputes
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();

-- Withdrawal Requests (users request withdrawals)
CREATE TRIGGER check_account_before_insert_withdrawals
  BEFORE INSERT ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();
CREATE TRIGGER check_account_before_update_withdrawals
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();

-- User Reports (users report others)
CREATE TRIGGER check_account_before_insert_reports
  BEFORE INSERT ON public.user_reports
  FOR EACH ROW EXECUTE FUNCTION public.check_account_active();

-- 3. Also update the admin audit log to record who performed each action
-- (already handled by the admin backend's auditLogger utility)

-- 4. Helper function for RLS policies (optional, for anon key queries)
CREATE OR REPLACE FUNCTION public.is_account_active()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND account_status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
