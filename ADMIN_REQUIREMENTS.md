# Admin Dashboard — Complete Requirements Reference

## Supabase Connection

```
URL:    https://bvnaffajgxxylatshlwc.supabase.co
Anon:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz...
```

- Admin users have `user_type = 'admin'` in `public.users`
- Use **service_role key** for admin write operations
- Admin check function: `public.is_admin()` checks `auth.uid()` against `user_type`
- RLS policies for admin use `public.is_admin()` — you'll need to bypass RLS with service_role key for full CRUD

---

## Database Tables Reference

### Core Tables (full schema)

```
public.users
  id UUID PK → auth.users
  email VARCHAR nullable
  phone VARCHAR
  display_name VARCHAR (not null)
  bio TEXT
  avatar_url TEXT
  location VARCHAR
  skills TEXT[]
  rating DECIMAL(3,1) DEFAULT 0
  completed_jobs INT DEFAULT 0
  balance DECIMAL(10,2) DEFAULT 0
  escrow_balance DECIMAL(10,2) DEFAULT 0
  is_verified BOOLEAN DEFAULT false
  is_profile_public BOOLEAN DEFAULT true
  show_last_seen BOOLEAN DEFAULT true
  show_contact_info BOOLEAN DEFAULT false
  is_onboarding_completed BOOLEAN DEFAULT false
  user_type VARCHAR DEFAULT 'viewer'      -- viewer | job_seeker | admin
  preferred_job_type VARCHAR              -- digital | physical | both
  verification_status VARCHAR DEFAULT 'unverified'  -- unverified | pending | verified | rejected
  verification_metadata JSONB DEFAULT '{}'
  real_name TEXT                          -- verification data
  id_number TEXT
  address TEXT
  id_type TEXT
  id_front_url TEXT
  id_back_url TEXT
  selfie_url TEXT
  bank_name TEXT
  bank_account_number TEXT
  bank_account_type TEXT
  bank_branch_code TEXT
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
  -- ❌ MISSING: account_status (active/suspended/banned)
  -- ❌ MISSING: suspension_reason TEXT
  -- ❌ MISSING: suspended_until TIMESTAMPTZ

public.services
  id UUID PK
  user_id UUID FK → users
  title VARCHAR
  description TEXT
  category VARCHAR
  price DECIMAL(10,2)
  delivery_time INT (days)
  images TEXT[]
  rating DECIMAL(3,1)
  total_orders INT
  is_active BOOLEAN DEFAULT true
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ

public.jobs
  id UUID PK
  client_id UUID FK → users
  title VARCHAR
  description TEXT
  category VARCHAR
  budget DECIMAL(10,2)
  deadline TIMESTAMPTZ
  status VARCHAR DEFAULT 'open'    -- open | in_progress | completed | cancelled
  images TEXT[]
  latitude DOUBLE PRECISION
  longitude DOUBLE PRECISION
  job_type VARCHAR                  -- digital | physical | both
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ

public.orders
  id UUID PK
  buyer_id UUID FK → users
  seller_id UUID FK → users
  service_id UUID FK → services (nullable)
  job_id UUID FK → jobs (nullable)
  amount DECIMAL(10,2)
  status VARCHAR                   -- pending | in_progress | completed | cancelled | disputed
  fee DECIMAL(10,2) DEFAULT 0
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ

public.job_applications
  id UUID PK
  job_id UUID FK → jobs
  applicant_id UUID FK → users
  cover_letter TEXT
  bid_amount DECIMAL(10,2)
  status VARCHAR                   -- pending | accepted | rejected
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ

public.job_milestones
  id UUID PK
  job_id UUID FK → jobs
  title TEXT
  description TEXT
  status VARCHAR DEFAULT 'pending' -- pending | completed
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ

public.transactions
  id UUID PK
  sender_id UUID FK → users
  receiver_id UUID FK → users
  amount DECIMAL(10,2)
  type VARCHAR                     -- deposit | withdrawal | escrow | escrow_release | payment
  status VARCHAR DEFAULT 'pending' -- pending | completed | cancelled
  reference VARCHAR
  order_id UUID FK → orders (nullable)
  fee DECIMAL(10,2) DEFAULT 0
  payment_id UUID FK → payments (nullable, ❌ MISSING from migration)
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ

public.payments
  id UUID PK
  user_id UUID FK → users
  amount DECIMAL(10,2)
  currency VARCHAR DEFAULT 'ZAR'
  status VARCHAR DEFAULT 'pending' -- pending | successful | failed
  reference VARCHAR UNIQUE
  external_id VARCHAR               -- Yoco checkout ID
  metadata JSONB
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ

public.withdrawal_requests
  id UUID PK
  user_id UUID FK → users
  amount DECIMAL(10,2)
  bank_name VARCHAR
  account_holder VARCHAR
  account_number VARCHAR
  branch_code VARCHAR
  account_type VARCHAR
  status VARCHAR DEFAULT 'pending' -- pending | processed | rejected
  rejection_reason TEXT
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ

public.messages
  id UUID PK
  sender_id UUID FK → users
  receiver_id UUID FK → users
  content TEXT
  image_url TEXT
  is_read BOOLEAN DEFAULT false
  created_at TIMESTAMPTZ

public.reviews
  id UUID PK
  reviewer_id UUID FK → users
  target_user_id UUID FK → users
  service_id UUID FK → services (nullable)
  rating INT (1-5)
  comment TEXT
  created_at TIMESTAMPTZ

public.disputes
  id UUID PK
  order_id UUID FK → orders
  raised_by UUID FK → users
  reason TEXT
  description TEXT
  status VARCHAR DEFAULT 'open'    -- open | under_review | resolved | cancelled
  resolution_summary TEXT
  resolved_at TIMESTAMPTZ
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ

public.user_blocks
  id UUID PK
  blocker_id UUID FK → users
  blocked_id UUID FK → users
  created_at TIMESTAMPTZ
  UNIQUE(blocker_id, blocked_id)

public.notifications
  id UUID PK
  user_id UUID FK → users
  type VARCHAR                     -- chat | order | job_application
  title VARCHAR
  body TEXT
  data JSONB
  is_read BOOLEAN DEFAULT false
  created_at TIMESTAMPTZ

public.storage
  Buckets: avatars | service-images | job-images | verification-docs
  All have folder-based access: {user_id}/filename.ext
```

### Reference Data Tables (admin-editable)

```
public.categories          (id, name, type, icon, is_active)
public.skills              (id, name, is_active)
public.locations           (id, name, is_active)
public.id_types            (id, name, is_active)   -- pre-seeded: SA ID, Passport, etc.
public.supported_banks     (id, name, is_active)   -- pre-seeded: 11 SA banks
public.report_reasons      (id, name, is_active)   -- pre-seeded: 9 reasons
public.dispute_reasons     (id, name, is_active)   -- pre-seeded: 7 reasons
```

### Edge Functions (Supabase)

```
yoco_checkout/         → Creates Yoco payment session, returns checkout URL
yoco_webhook/          → Receives Yoco callbacks, updates payments.status
push_notifications/    → Sends FCM push via Expo push API
cleanup_jobs/          → Scheduled cleanup of expired jobs
send_completion_email/ → Sends order completion email via Resend
resend-email/          → Email resend utility
```

### Balance Triggers (auto-fire on transactions)

```
AFTER INSERT OR UPDATE ON public.transactions:
  deposit completed      → balance += amount
  withdrawal pending     → balance -= amount, escrow += amount (lock)
  withdrawal completed   → escrow -= amount (finalize)
  withdrawal cancelled   → balance += amount, escrow -= amount (return)
  escrow pending         → sender balance -= amount, sender escrow += amount
                           receiver escrow += amount
  escrow_release complete → sender escrow -= amount
                           receiver balance += (amount - fee)
                           receiver escrow -= amount
  escrow cancelled       → sender balance += amount, sender escrow -= amount
                           receiver escrow -= amount
  payment completed      → sender balance -= amount, receiver balance += amount

AFTER UPDATE ON public.payments:
  payment status → 'successful' → auto-creates deposit transaction
```

---

## Admin Feature Specifications

### Feature 1 — Identity Verification Management

**Path:** `/admin/verifications`

| Action | SQL / Operation |
|--------|----------------|
| List all pending verifications | `SELECT * FROM users WHERE verification_status = 'pending' ORDER BY created_at` |
| View verification documents | Read from `storage.verification-docs/{user_id}/` |
| Approve | `UPDATE users SET verification_status = 'verified', is_verified = true WHERE id = $1` |
| Reject | `UPDATE users SET verification_status = 'rejected' WHERE id = $1` (add rejection_reason field) |
| View full user + verification detail | JOIN with verification_metadata fields |

**UI Notes:**
- Show ID document images side-by-side (front, back, selfie)
- Show user's real_name, id_number, address, bank details
- Approve/Reject buttons with confirmation dialog
- Rejection requires a text reason
- Filter tabs: Pending | Verified | Rejected | All

### Feature 2 — Withdrawal Request Processing

**Path:** `/admin/withdrawals`

| Action | SQL / Operation |
|--------|----------------|
| List all pending | `SELECT * FROM withdrawal_requests WHERE status = 'pending' ORDER BY created_at` |
| Approve | `UPDATE withdrawal_requests SET status = 'processed' WHERE id = $1` + `UPDATE transactions SET status = 'completed' WHERE type = 'withdrawal' AND reference LIKE '%$bankName'` (balance trigger fires) |
| Reject | `UPDATE withdrawal_requests SET status = 'rejected', rejection_reason = $2 WHERE id = $1` + `UPDATE transactions SET status = 'cancelled' WHERE ...` |

**UI Notes:**
- Show user's balance, bank details, amount
- Confirm dialog: "Approve R500 withdrawal to Absa account ending in 1234?"
- Bulk approve queue
- Filter: Pending | Processed | Rejected

### Feature 3 — Dispute Resolution

**Path:** `/admin/disputes`

| Action | SQL / Operation |
|--------|----------------|
| List all open | `SELECT * FROM disputes WHERE status IN ('open', 'under_review') ORDER BY created_at` |
| View details | JOIN disputes → orders → users (buyer, seller) → services/jobs |
| Start review | `UPDATE disputes SET status = 'under_review' WHERE id = $1` |
| Resolve for buyer (refund) | `UPDATE disputes SET status = 'resolved', resolution_summary = $2, resolved_at = NOW() WHERE id = $1` + `UPDATE transactions SET status = 'cancelled' WHERE order_id = $orderId AND type = 'escrow'` |
| Resolve for seller (release) | Release escrow to seller |
| Cancel | `UPDATE disputes SET status = 'cancelled' WHERE id = $1` |

**UI Notes:**
- Full order breakdown: buyer, seller, amount, service title, dates
- Chat log between parties (from messages table)
- Resolution text area with templates
- "Refund buyer" / "Release to seller" actions

### Feature 4 — User Reports

**Path:** `/admin/reports`

⚠️ **`user_reports` table needs a migration.** Create:

```sql
CREATE TABLE public.user_reports (
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
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage reports" ON user_reports FOR ALL USING (public.is_admin());
CREATE POLICY "Users can create reports" ON user_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
```

| Action | SQL |
|--------|-----|
| List pending | `SELECT * FROM user_reports WHERE status = 'pending' ORDER BY created_at` |
| Review | `UPDATE user_reports SET status = 'reviewed', admin_notes = $2 WHERE id = $1` |
| Dismiss | `UPDATE user_reports SET status = 'dismissed', admin_notes = $2 WHERE id = $1` |
| Block target user | Insert into `user_blocks` |
| Suspend target user | `UPDATE users SET account_status = 'suspended' ...` |

### Feature 5 — User Management

**Path:** `/admin/users`

⚠️ **Missing fields on `users` table:**

```sql
ALTER TABLE public.users ADD COLUMN account_status VARCHAR DEFAULT 'active';  -- active | suspended | banned
ALTER TABLE public.users ADD COLUMN suspension_reason TEXT;
ALTER TABLE public.users ADD COLUMN suspended_until TIMESTAMPTZ;
```

| Action | SQL |
|--------|-----|
| Search users | `SELECT * FROM users WHERE display_name ILIKE '%$q%' OR email ILIKE '%$q%'` |
| View user detail | Full profile + balance + transactions + orders + reports |
| Suspend user | `UPDATE users SET account_status = 'suspended', suspension_reason = $2 WHERE id = $1` |
| Ban user | `UPDATE users SET account_status = 'banned', suspension_reason = $2 WHERE id = $1` |
| Reactivate | `UPDATE users SET account_status = 'active', suspension_reason = NULL WHERE id = $1` |
| Promote to admin | `UPDATE users SET user_type = 'admin' WHERE id = $1` |

### Feature 6 — Transactions & Payments

**Path:** `/admin/transactions`

| Action | SQL |
|--------|-----|
| All transactions | `SELECT * FROM transactions ORDER BY created_at DESC` |
| Filter by type | `... WHERE type = $1` (deposit/withdrawal/escrow/payment) |
| Filter by status | `... WHERE status = $1` (pending/completed/cancelled) |
| View payment records | `SELECT * FROM payments ORDER BY created_at DESC` |
| Manual balance adjust | Insert transaction + create audit log entry |

### Feature 7 — Content Moderation

**Path:** `/admin/content`

| Action | Table | SQL |
|--------|-------|-----|
| List all services | services | `SELECT * FROM services ORDER BY created_at DESC` |
| Delete service | services | `DELETE FROM services WHERE id = $1` (or set is_active = false) |
| List all jobs | jobs | `SELECT * FROM jobs ORDER BY created_at DESC` |
| Delete job | jobs | `DELETE FROM jobs WHERE id = $1` |
| View all reviews | reviews | `SELECT * FROM reviews ORDER BY created_at DESC` |
| Delete review | reviews | `DELETE FROM reviews WHERE id = $1` |

### Feature 8 — Reference Data Management

**Path:** `/admin/config`

| Action | Table |
|--------|-------|
| Add/edit/delete categories | `categories` |
| Add/edit/delete skills | `skills` |
| Add/edit/delete locations | `locations` |
| Add/edit/delete ID types | `id_types` |
| Add/edit/delete supported banks | `supported_banks` |
| Add/edit/delete report reasons | `report_reasons` |
| Add/edit/delete dispute reasons | `dispute_reasons` |

### Feature 9 — Audit Log

**Path:** `/admin/audit`

⚠️ **`admin_audit_logs` table needs a migration.** Create:

```sql
CREATE TABLE public.admin_audit_logs (
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
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
-- Policy already exists from migration 20260621120000
```

### Feature 10 — Analytics Dashboard

**Path:** `/admin` (home)

| Metric | Query |
|--------|-------|
| Total users | `SELECT COUNT(*) FROM users` |
| Verified users | `SELECT COUNT(*) FROM users WHERE is_verified = true` |
| Total balance held | `SELECT SUM(balance) FROM users` |
| Total escrow held | `SELECT SUM(escrow_balance) FROM users` |
| Total transactions | `SELECT COUNT(*) FROM transactions` |
| Transaction volume | `SELECT SUM(amount) FROM transactions WHERE status = 'completed'` |
| Pending verifications | `SELECT COUNT(*) FROM users WHERE verification_status = 'pending'` |
| Pending withdrawals | `SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending'` |
| Open disputes | `SELECT COUNT(*) FROM disputes WHERE status IN ('open', 'under_review')` |
| New users today | `SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '1 day'` |

---

## Migration Gaps — Must Fix Before Admin Launch

| # | What | Priority |
|---|------|----------|
| 1 | Create `user_reports` table | **Blocker** |
| 2 | Create `admin_audit_logs` table | **Blocker** |
| 3 | Add `account_status`, `suspension_reason`, `suspended_until` to `users` | **Blocker** |
| 4 | Add `verification_rejection_reason` to `users` | High |
| 5 | Add admin WRITE policies for `withdrawal_requests` (currently SELECT-only) | **Blocker** |
| 6 | Add admin WRITE policies for `disputes` (currently SELECT-only) | **Blocker** |
| 7 | Add admin policies for `user_reports`, `notifications`, `messages`, `reviews`, `payments` | High |
| 8 | Add `payment_id` FK column to `transactions` (referenced by depositFunds but not in schema) | High |
| 9 | Add `categories` table (has model/repo in Flutter but uses type+name, verify migration 20260514214241) | Medium |
| 10 | Add platform_fee setting table or config key | Low |

---

## Authentication for Admin Website

Since admin users are regular Supabase auth users with `user_type = 'admin'`, your admin website should:

1. Use `@supabase/supabase-js` client library
2. Have admin log in via the standard email/password Supabase auth
3. After login, check `user_type === 'admin'` — redirect non-admins
4. Use `supabase.auth.getSession()` for auth state
5. For write operations that RLS blocks, use the **service_role key** (never expose in frontend — do these via a backend API or Edge Function)

```
// Public (anon) key — for read operations admin policies allow
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Service role key — for write operations, call via Edge Function
// NEVER put service_role key in client-side code
```

---

## Recommended Admin Website Stack

| Layer | Suggestion |
|-------|-----------|
| Framework | Next.js (App Router) or plain React |
| Auth | Supabase Auth UI component |
| Data fetch | Supabase JS client + React Query |
| UI | Tailwind CSS or Mantine |
| Write ops | Supabase Edge Functions (calls service_role) or Next.js API routes |
| Hosting | Vercel or Supabase static hosting |

---

## Quick-Start SQL for Admin

```sql
-- Make yourself admin (replace with your user ID)
UPDATE public.users SET user_type = 'admin' WHERE id = 'your-user-uuid-here';

-- Add missing admin write policies
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
```
