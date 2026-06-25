# Next Implementation Steps

## Priority 1: Backend Feature Expansion (High Impact)

1.  **Feature 1: Identity Verification Management**
    - `controllers/verificationController.ts`: `listPending`, `approve`, `reject`.
    - Routes: `GET /api/admin/verifications`, `POST /api/admin/verifications/:id/{approve|reject}`.
    - Integration: Audit logging for approval/rejection.
2.  **Feature 2: Withdrawal Request Processing**
    - `controllers/withdrawalController.ts`: `listPending`, `process`.
    - Routes: `GET /api/admin/withdrawals`, `POST /api/admin/withdrawals/:id/{approve|reject}`.
    - Integration: Audit logging + status synchronization with transactions.
3.  **Feature 3: Dispute Resolution**
    - `controllers/disputeController.ts`: `listOpen`, `resolve`.
    - Routes: `GET /api/admin/disputes`, `POST /api/admin/disputes/:id/resolve`.
    - Integration: Audit logging.

## Priority 2: Frontend Dashboard (Initialization)

1.  **Project Setup**
    - Create `frontend` project (Vite + React + TS + Tailwind).
    - Configure routing (`/admin`).
    - Basic layout (Sidebar + Main View).
2.  **State Management & Data Fetching**
    - Set up TanStack Query for API calls.
    - Auth guard component wrapping the dashboard.

## Priority 3: Remaining Features

- User Reports, Transactions, Content Moderation, Config Management.

---

*Decision:* Shall I proceed with implementing **Identity Verification** and **Withdrawals** in the backend next?
