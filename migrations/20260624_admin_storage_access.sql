-- Migration: Allow admins to read verification documents from storage
-- Date: 2026-06-24
--
-- The verification-docs bucket is private (non-public). This policy
-- allows admin users to view any user's verification documents.

-- Drop first to be idempotent
DROP POLICY IF EXISTS "Admins can view all verification docs" ON storage.objects;

CREATE POLICY "Admins can view all verification docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'verification-docs' AND public.is_admin());
