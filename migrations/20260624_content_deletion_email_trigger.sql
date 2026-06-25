-- Migration: Content deletion email notification trigger
-- Date: 2026-06-24
--
-- Sends an email to the owner when a service or job is deleted by an admin.
-- Uses BEFORE DELETE trigger so it can read the record before it's removed.

CREATE OR REPLACE FUNCTION public.handle_content_deletion_email()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://bvnaffajgxxylatshlwc.supabase.co/functions/v1/send_content_deletion_email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', current_setting('app.settings.webhook_secret')
      ),
      body := jsonb_build_object('record', jsonb_build_object(
        'id', OLD.id,
        'content_type', TG_TABLE_NAME,
        'title', OLD.title,
        'owner_id', CASE
          WHEN TG_TABLE_NAME = 'services' THEN OLD.user_id
          WHEN TG_TABLE_NAME = 'jobs' THEN OLD.client_id
        END
      ))
    );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Services
DROP TRIGGER IF EXISTS on_service_deleted ON public.services;
CREATE TRIGGER on_service_deleted
  BEFORE DELETE ON public.services
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_content_deletion_email();

-- Jobs
DROP TRIGGER IF EXISTS on_job_deleted ON public.jobs;
CREATE TRIGGER on_job_deleted
  BEFORE DELETE ON public.jobs
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_content_deletion_email();
