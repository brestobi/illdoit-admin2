-- Migration: Withdrawal email notification trigger
-- Date: 2026-06-24
--
-- Sends an email when a withdrawal request status changes to 'processed' or 'rejected'.

CREATE OR REPLACE FUNCTION public.handle_withdrawal_email()
RETURNS TRIGGER AS $$
DECLARE
  _secret TEXT;
BEGIN
  IF (NEW.status IN ('processed', 'rejected')
      AND (OLD.status IS DISTINCT FROM NEW.status)) THEN
    SELECT value INTO _secret FROM public.app_secrets WHERE key = 'webhook_secret';
    IF _secret IS NOT NULL THEN
      PERFORM
        net.http_post(
          url := 'https://bvnaffajgxxylatshlwc.supabase.co/functions/v1/send_withdrawal_email',
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

DROP TRIGGER IF EXISTS on_withdrawal_status_change ON public.withdrawal_requests;
CREATE TRIGGER on_withdrawal_status_change
  AFTER UPDATE ON public.withdrawal_requests
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_withdrawal_email();
