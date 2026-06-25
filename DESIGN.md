# Implementation Plan: Admin Dashboard

## 1. Objective
Build a comprehensive admin dashboard for the `illdoit-admin` system.

## 2. Architecture
- **Frontend:** React (Vite, TypeScript, Tailwind CSS, TanStack Query, React Router)
- **Backend:** Node.js (Express, TypeScript)
- **Database/Auth:** Supabase

## 3. Implementation Roadmap

### Phase 1: Infrastructure & Database (Backend Focus)
1.  **Refine Migrations:**
    - Finalize `20260624_admin_schema_updates.sql`.
    - Ensure all required tables and RLS policies are in place.
2.  **Backend API Setup:**
    - Define core API routes (`/api/admin/...`).
    - Implement `adminAuth` middleware for all admin routes.
    - Setup controllers for each admin feature (Verifications, Withdrawals, Users, etc.).
    - Implement central audit logging for all admin actions.

### Phase 2: Frontend Dashboard (Frontend Focus)
1.  **Initialize Frontend:**
    - Vite + React + TypeScript + Tailwind.
    - Set up routing (`/admin/*`).
    - Implement Supabase Auth UI (admin guard).
2.  **Feature Implementation:**
    - Develop dashboard layout (Sidebar, Header, Main Content).
    - Implement data grids/tables for each view (using TanStack Query for data fetching).
    - Implement detail views and action forms (Approve/Reject/Suspend).

### Phase 3: Validation & Testing
1.  **End-to-End Testing:**
    - Test auth flow.
    - Verify admin access restrictions.
    - Verify audit log entries.
    - Test all CRUD operations.

## 4. API Structure (Backend)
- `GET /api/admin/analytics`
- `GET /api/admin/verifications` / `POST /api/admin/verifications/:id/{approve|reject}`
- `GET /api/admin/withdrawals` / `POST /api/admin/withdrawals/:id/{approve|reject}`
- `GET /api/admin/users` / `POST /api/admin/users/:id/{suspend|ban|reactivate}`
- `GET /api/admin/disputes` / `POST /api/admin/disputes/:id/resolve`

## 5. Audit Logging Strategy
- Create a reusable middleware or helper function `logAdminAction(adminId, action, targetTable, targetId, oldData, newData)` to be called in every write-action controller.
