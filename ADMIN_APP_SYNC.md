# Admin ↔ App Sync Tracker (Final)

Tracks all admin console actions and their corresponding enforcement in the illdoit Flutter app.
Only items **not yet implemented** are marked 🔴.

## Legend
- 🔴 Not implemented / 🟡 Partial / 🟢 Complete

---

## 1. User Suspension / Ban / Reactivation
**Admin:** `users.account_status` (active | suspended | banned)

- ✅ 1.1 Auth gate — block login if suspended/banned  
- ✅ 1.2 Session resume check — splash screen restriction UI  
- ✅ 1.3 API gate — DB triggers block writes on 9 tables  
- 🟡 1.4 In-app suspension banner (splash screen done, in-app browsing not)  
- ✅ 1.5 Ban screen — permanent restriction UI  

## 2. Identity Verification
**Admin:** `users.verification_status` + `is_verified`

- ✅ 2.1 Block posting services/jobs unless verified → DB trigger  
- ✅ 2.2 Verified badge → shown on profile & detail screens  
- ✅ 2.3 Block withdrawals unless verified → DB trigger  

## 3. Withdrawal Processing
**Admin:** Approve / reject `withdrawal_requests`

- ✅ 3.1 Approve → release funds (DB balance trigger)  
- ✅ 3.2 Reject → return funds (DB balance trigger)  
- ✅ 3.3 Email notification on approve/reject → Edge Function  

## 4. Dispute Resolution
**Admin:** Resolve dispute (refund / release)

- ✅ 4.1 Refund → cancel escrow (DB balance trigger)  
- ✅ 4.2 Release → complete to seller (DB balance trigger)  
- ✅ 4.3 Email notification to both parties → Edge Function  

## 5. User Reports
**Admin:** Review / dismiss `user_reports`

- 🔴 5.1 Auto-suspend after X pending reports  
- 🔴 5.2 Email reporter on review/dismiss → Edge Function  

## 6. Content Moderation
**Admin:** Delete services / jobs

- ✅ 6.1 Removed from DB → automatic feed removal  
- ✅ 6.2 Email notification to owner → Edge Function  

## 7. Reference Data
**Admin:** Add/edit categories, skills, locations, etc.

- ✅ 7.1 Fetched dynamically from Supabase (not hardcoded)  

---

## Summary

| Section | Total | 🟢 Done | 🔴 Remaining |
|---------|-------|---------|-------------|
| 1. Suspension | 5 | 4 | 1 🟡 |
| 2. Verification | 3 | 3 | 0 |
| 3. Withdrawals | 3 | 3 | 0 |
| 4. Disputes | 3 | 3 | 0 |
| 5. Reports | 2 | 0 | 2 |
| 6. Content | 2 | 2 | 0 |
| 7. Reference Data | 1 | 1 | 0 |
| **Total** | **19** | **16 🟢 + 1 🟡** | **2 🔴** |

---

## Migrations to Run (in order)

| # | File | Purpose |
|---|------|---------|
| 1 | `20260624_admin_schema_updates.sql` | Create `user_reports`, `admin_audit_logs`, missing columns, RLS policies |
| 2 | `20260624_account_suspension_triggers.sql` | Suspension triggers on 9 tables |
| 3 | `20260624_unverified_restrictions.sql` | Combined verification + suspension triggers for services/jobs/withdrawals |
| 4 | `20260624_verification_email_trigger.sql` | Email on verification approve/reject |
| 5 | `20260624_withdrawal_email_trigger.sql` | Email on withdrawal approve/reject |
| 6 | `20260624_dispute_email_trigger.sql` | Email to buyer + seller on dispute resolution |
| 7 | `20260624_content_deletion_email_trigger.sql` | Email to owner on service/job deletion |
| 8 | `20260624_admin_storage_access.sql` | Admin read access to `verification-docs` bucket |
| 9 | `20260624_fix_admin_audit_logs_schema.sql` | Ensure `target_table` column exists |

## Edge Functions Deployed

| Function | Trigger | Purpose |
|----------|---------|---------|
| `send_verification_email` | `users.verification_status` change | Email on approve/reject |
| `send_withdrawal_email` | `withdrawal_requests.status` change | Email on approve/reject |
| `send_dispute_email` | `disputes.status → resolved` | Email to both parties |
| `send_content_deletion_email` | BEFORE DELETE on services/jobs | Email to content owner |

## Environment Variables (Supabase)

| Variable | Set? |
|----------|------|
| `RESEND_API_KEY` | ✅ |
| `WEBHOOK_SECRET` | ✅ (`508f423ffe41fb6759568814f33f732a79fe38f01a5d36ce65d707b239a51007`) |
| `app.settings.webhook_secret` (DB) | ✅ |
