-- Migration: Dispute resolution email notification trigger
-- Date: 2026-06-24
--
-- Sends an email to both buyer and seller when a dispute is resolved.

CREATE OR REPLACE FUNCTION public.handle_dispute_email()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'resolved' AND (OLD.status IS DISTINCT FROM 'resolved')) THEN
    PERFORM
      net.http_post(
        url := 'https://bvnaffajgxxylatshlwc.supabase.co/functions/v1/send_dispute_email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-webhook-secret', current_setting('app.settings.webhook_secret')
        ),
        body := jsonb_build_object('record', row_to_json(NEW))
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_dispute_resolved ON public.disputes;
CREATE TRIGGER on_dispute_resolved
  AFTER UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_dispute_email();
