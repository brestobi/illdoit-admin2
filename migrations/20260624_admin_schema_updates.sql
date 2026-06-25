-- Migration: Admin Schema Updates
-- Date: 2026-06-24

-- 1. Create user_reports table
CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  target_id UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  description TEXT,
  status VARCHAR DEFAULT 'pending',  -- pending | reviewed | dismissed
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR NOT NULL,             -- 'verify_user', 'approve_withdrawal', 'resolve_dispute', etc.
  target_table VARCHAR,                -- 'users', 'withdrawal_requests', 'disputes', etc.
  target_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update users table with status and rejection reason
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='account_status') THEN
        ALTER TABLE public.users ADD COLUMN account_status VARCHAR DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='suspension_reason') THEN
        ALTER TABLE public.users ADD COLUMN suspension_reason TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='suspended_until') THEN
        ALTER TABLE public.users ADD COLUMN suspended_until TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='verification_rejection_reason') THEN
        ALTER TABLE public.users ADD COLUMN verification_rejection_reason TEXT;
    END IF;
END $$;

-- 4. Add payment_id to transactions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='payment_id') THEN
        ALTER TABLE public.transactions ADD COLUMN payment_id UUID REFERENCES public.payments(id);
    END IF;
END $$;

-- 5. Enable RLS on new tables
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Admin Write Policies
-- Note: is_admin() function is assumed to exist as per requirements

CREATE POLICY "Admin manage withdrawals" ON public.withdrawal_requests 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admin manage disputes" ON public.disputes 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admin manage user_reports" ON public.user_reports 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admin read messages" ON public.messages 
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin manage reviews" ON public.reviews 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admin manage notifications" ON public.notifications 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admin manage payments" ON public.payments 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can create reports" ON user_reports 
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admin read audit logs" ON public.admin_audit_logs
  FOR SELECT USING (public.is_admin());
