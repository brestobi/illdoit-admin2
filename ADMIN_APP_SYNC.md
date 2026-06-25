# Admin ↔ App Sync Tracker

Tracks what admin console actions need corresponding enforcement in the illdoit Flutter app.
Only features listed here if **not yet implemented** in the app.

## Legend
- 🔴 Not implemented
- 🟡 Partially implemented
- 🟢 Implemented

---

## 1. User Suspension / Ban / Reactivation

**Admin action:** Update `users.account_status` (active | suspended | banned)

| # | App-side enforcement | Status | Details |
|---|---------------------|--------|---------|
| 1.1 | **Auth gate — block login on suspended/banned** | 🟢 | `_checkSuspension()` in auth provider fetches `account_status` after sign-in, signs out suspended/banned users. |
| 1.2 | **Auth gate — block session on resume** | 🟢 | Splash screen checks `authState.suspensionMessage` before navigating to home, shows restriction UI. |
| 1.3 | **API gate — reject requests from suspended/banned users** | 🟢 | Database triggers on 9 tables block INSERT/UPDATE when `account_status != 'active'`. Works for both anon key (RLS) and service_role. |
| 1.4 | **UI — show suspension banner** | 🟡 | Splash screen shows restriction UI for suspended/banned. In-app banner (while browsing) not yet implemented. |
| 1.5 | **UI — ban screen** | 🟢 | Splash screen shows permanent ban message with no recovery option. |

## 2. Identity Verification Status

**Admin action:** Update `users.verification_status` (unverified | pending | verified | rejected)

| # | App-side enforcement | Status | Details |
|---|---------------------|--------|---------|
| 2.1 | **Restrict posting jobs/services until verified** | 🟢 | DB trigger blocks INSERT/UPDATE on `services` and `jobs` when `verification_status != 'verified'`. |
| 2.2 | **Show verification badge** | 🔴 | Display verified badge on user profiles when `is_verified = true`. |
| 2.3 | **Block withdrawal until verified** | 🟢 | DB trigger blocks INSERT/UPDATE on `withdrawal_requests` when `verification_status != 'verified'`. |

## 3. Withdrawal Processing

**Admin action:** Approve/reject withdrawal requests

| # | App-side enforcement | Status | Details |
|---|---------------------|--------|---------|
| 3.1 | **Approve → release funds** | 🟢 | DB trigger handles balance update when transaction status changes to `completed`. |
| 3.2 | **Reject → return funds** | 🟢 | DB trigger returns funds to user balance when transaction changes to `cancelled`. |
| 3.3 | **Notify user of withdrawal result** | 🟢 | Admin action should trigger a push notification or in-app notification. |

## 4. Dispute Resolution

**Admin action:** Resolve dispute (refund buyer / release to seller)

| # | App-side enforcement | Status | Details |
|---|---------------------|--------|---------|
| 4.1 | **Refund → return escrow to buyer** | 🟢 | DB trigger handles escrow release on transaction status change. |
| 4.2 | **Release → pay seller** | 🟢 | DB trigger completes escrow to seller. |
| 4.3 | **Notify both parties** | 🟢 | Admin resolution should trigger notifications to buyer + seller. |

## 5. User Reports

**Admin action:** Review/dismiss reports

| # | App-side enforcement | Status | Details |
|---|---------------------|--------|---------|
| 5.1 | **Auto-suspend on X reports** | 🔴 | After N pending reports against a user, auto-flag for admin review. |
| 5.2 | **Notify reporter of outcome** | 🔴 | When admin reviews a report, notify the reporter. |

## 6. Content Moderation

**Admin action:** Delete services/jobs

| # | App-side enforcement | Status | Details |
|---|---------------------|--------|---------|
| 6.1 | **Remove deleted content from feeds** | 🟢 | Direct DB delete removes from queries. |
| 6.2 | **Notify content owner** | 🔴 | When admin deletes a service/job, notify the owner with reason. |

## 7. Reference Data Changes

**Admin action:** Add/edit categories, skills, locations, etc.

| # | App-side enforcement | Status | Details |
|---|---------------------|--------|---------|
| 7.1 | **App fetches reference data dynamically** | 🟡 | If hardcoded in app, needs to switch to API fetch. Check Flutter code. |

---

## Priority Order for App-Side Work

1. **🔴 2.2** — Show verified badge on user profiles (small UI change)
2. **🔴 3.3** — Notifications for admin withdrawal/dispute actions
3. **🔴 6.2** — Notify content owner when admin deletes their post
4. **🔴 5.1** — Auto-suspend on X reports
5. **🔴 5.2** — Notify reporter of report outcome
6. **🔴 7.1** — Switch from hardcoded to API-fetched reference data
