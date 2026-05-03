# Bathra – Startup Investment Platform

A Vite + React + TypeScript application backed by Supabase. Investors browse and make simulated (paper) investments in Saudi startups. Admins manage users, articles, and matchmaking.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Supabase project | Any hosted plan (free tier works) |

---

## Environment Variables

Copy `.env.example` → `.env.local` and fill in your Supabase project values:

```env
# Required
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional – demo account quick-login buttons
VITE_DEMO_INVESTOR_EMAIL=investor@bathra.com
VITE_DEMO_INVESTOR_PASSWORD=Investor123!
VITE_DEMO_STARTUP_EMAIL=startup@bathra.com
VITE_DEMO_STARTUP_PASSWORD=Startup123!
```

---

## Database Setup

### Step 1 – Run the schema migration

Open the **Supabase Dashboard → SQL Editor** and execute:

```
supabase/001_full_schema.sql
```

This creates all 15 tables, foreign keys, RLS policies, indexes, and RPC functions.

### Step 2 – Create demo auth users

In **Supabase Dashboard → Authentication → Users**, create these accounts:

| Email | Password | Notes |
|-------|----------|-------|
| `admin@bathra.com` | `Admin123!` | Will become super admin |
| `investor@bathra.com` | `Investor123!` | Demo investor |
| `startup@bathra.com` | `Startup123!` | Demo startup (PayFlow) |
| `startup2@bathra.com` | `Startup123!` | Demo startup (MedConnect) |
| `startup3@bathra.com` | `Startup123!` | Demo startup (Souk+) |

> **Tip:** If email confirmation is enabled, toggle it off temporarily in **Authentication → Settings → Email** or use "Confirm email" in the user menu.

### Step 3 – Seed demo data

1. Copy each user's UUID from the Authentication dashboard
2. Open `supabase/002_seed_data.sql`
3. Find-and-replace the 5 placeholders:
   - `__ADMIN_UUID__` → UUID of admin@bathra.com
   - `__INVESTOR_UUID__` → UUID of investor@bathra.com
   - `__STARTUP1_UUID__` → UUID of startup@bathra.com
   - `__STARTUP2_UUID__` → UUID of startup2@bathra.com
   - `__STARTUP3_UUID__` → UUID of startup3@bathra.com
4. Run the file in **SQL Editor**

### Step 4 (Optional) – Create storage bucket

For pitch deck uploads, create a storage bucket named `pitchdecks` in **Supabase Dashboard → Storage** with public access and PDF-only MIME type restriction.

---

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and log in with any demo account.

---

## Database Tables Overview

| Table | Description |
|-------|-------------|
| `admins` | Admin user profiles (linked to auth.users) |
| `admin_invites` | Pending admin invitations |
| `investors` | Investor profiles (linked to auth.users) |
| `startups` | Startup profiles (linked to auth.users) |
| `matchmakings` | Admin-created investor↔startup matches |
| `investor_startup_connections` | Investor interest / info requests |
| `notifications` | In-app notifications for all users |
| `newsletter_campaigns` | Admin-managed newsletter campaigns |
| `user_invites` | User invitation system |
| `articles` | Blog articles / news |
| `paper_wallets` | Simulated investor wallet balances |
| `paper_wallet_transactions` | Wallet transaction history |
| `paper_investment_offers` | Pending/accepted/rejected offers |
| `paper_investments` | Finalized simulated investments |
| `startup_valuation_history` | Startup valuation change log |

---

## RLS Policy Summary

- **Investors & Startups**: Readable by everyone (for browsing). Insertable/updatable by the owner or admins.
- **Paper trading tables**: Visible to the investor who owns them, the startup involved, or admins.
- **Notifications**: Visible only to the recipient user or admins.
- **Articles**: Readable by everyone. Writable only by admins.
- **Admin tables**: Readable by everyone (for display). Writable only by admins.

---

## Key RPC Functions

| Function | Purpose |
|----------|---------|
| `increment_article_views(article_id)` | Atomically increment article view count |
| `get_unread_notification_count(p_user_id)` | Return unread notification count |
| `send_notification_to_users(p_user_ids, ...)` | Bulk-insert notifications for multiple users |
| `is_admin(uid)` | Check if a user ID exists in the admins table |

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, Recharts
- **Backend:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **State:** TanStack React Query, React Context
- **Routing:** React Router v6
