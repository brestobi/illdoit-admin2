-- Migration: Verification email trigger
-- Date: 2026-06-24
--
-- Fires when a user's verification_status changes to 'verified' or 'rejected'.
-- Calls the send_verification_email edge function via Resend to notify the user.

-- 1. Function to trigger verification email
CREATE OR REPLACE FUNCTION public.handle_verification_email()
RETURNS TRIGGER AS $$
DECLARE
  _secret TEXT;
BEGIN
  -- Trigger only when verification_status changes to verified or rejected
  IF (NEW.verification_status IN ('verified', 'rejected')
      AND (OLD.verification_status IS DISTINCT FROM NEW.verification_status)) THEN
    SELECT value INTO _secret FROM public.app_secrets WHERE key = 'webhook_secret';
    IF _secret IS NOT NULL THEN
      PERFORM
        net.http_post(
          url := 'https://bvnaffajgxxylatshlwc.supabase.co/functions/v1/send_verification_email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webhook-secret', _secret
          ),
          body := jsonb_build_object('record', row_to_json(NEW))
        );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger
DROP TRIGGER IF EXISTS on_verification_status_change ON public.users;
CREATE TRIGGER on_verification_status_change
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_verification_email();

-- 3. Set default webhook secret if not already set
-- NOTE: You must set this in Supabase Dashboard → Settings → Database → Session Settings
-- or via: SELECT set_config('app.settings.webhook_secret', 'your-secret-here', false);
