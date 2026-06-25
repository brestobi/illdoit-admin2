-- Migration: Suspension/ban email notification trigger
-- Date: 2026-06-25
--
-- Sends an email to the user when their account is suspended or banned by an admin.
-- Fires AFTER UPDATE of account_status on the users table.

CREATE OR REPLACE FUNCTION public.handle_suspension_email()
RETURNS TRIGGER AS $$
DECLARE
  _secret TEXT;
BEGIN
  IF (NEW.account_status IN ('suspended', 'banned')
      AND (OLD.account_status IS DISTINCT FROM NEW.account_status)) THEN
    SELECT value INTO _secret FROM public.app_secrets WHERE key = 'webhook_secret';
    IF _secret IS NOT NULL THEN
      PERFORM
        net.http_post(
          url := 'https://bvnaffajgxxylatshlwc.supabase.co/functions/v1/send_suspension_email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webhook-secret', _secret
          ),
          body := jsonb_build_object('record', jsonb_build_object(
            'id', NEW.id,
            'account_status', NEW.account_status,
            'suspension_reason', NEW.suspension_reason,
            'suspended_until', NEW.suspended_until
          ))
        );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_account_suspension ON public.users;
CREATE TRIGGER on_account_suspension
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_suspension_email();
