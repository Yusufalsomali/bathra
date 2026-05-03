-- Migration: schema_sync
-- Description: Syncs database schema with frontend expectations, adding missing tables,
--              columns, indexes, functions, storage buckets, and policies.
--              Safe/idempotent: uses IF NOT EXISTS, CREATE OR REPLACE, DROP IF EXISTS.
--              Does NOT delete existing data.

-- ============================================================
-- 0. TRIGGER HELPER (no table dependencies)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. ADMINS  (must exist before is_admin() which queries it)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admins (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  name         text not null,
  admin_level  text not null default 'standard',
  avatar       text,
  phone_number text,
  location     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_public_admins_updated_at') THEN
    CREATE TRIGGER set_public_admins_updated_at
      BEFORE UPDATE ON public.admins
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

-- ============================================================
-- 1a. is_admin helper  (depends on admins table above)
-- ============================================================
-- DROP first: CREATE OR REPLACE cannot rename existing parameters.
-- RLS policies referencing this function are not dropped by PostgreSQL
-- (no dependency tracking), so they survive and work once recreated below.
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE id = uid);
$$;

-- ============================================================
-- 1b. ADMINS RLS  (depends on is_admin)
-- ============================================================
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admins_select ON public.admins;
CREATE POLICY admins_select ON public.admins FOR SELECT USING (true);
DROP POLICY IF EXISTS admins_insert ON public.admins;
CREATE POLICY admins_insert ON public.admins FOR INSERT WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = id);
DROP POLICY IF EXISTS admins_update ON public.admins;
CREATE POLICY admins_update ON public.admins FOR UPDATE USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS admins_delete ON public.admins;
CREATE POLICY admins_delete ON public.admins FOR DELETE USING (public.is_admin(auth.uid()));

-- ============================================================
-- 2. ADMIN INVITES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  name         text not null,
  admin_level  text not null default 'standard',
  phone_number text,
  location     text,
  invited_by   uuid not null,
  invited_at   timestamptz not null default now(),
  status       text not null default 'pending' check (status in ('pending','accepted','expired')),
  invite_token text not null unique,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_public_admin_invites_updated_at') THEN
    CREATE TRIGGER set_public_admin_invites_updated_at
      BEFORE UPDATE ON public.admin_invites
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_invites_all ON public.admin_invites;
-- Allow anyone to read (needed for token-based invite acceptance by unauthenticated users)
-- and admins to manage them.
CREATE POLICY admin_invites_all ON public.admin_invites
  USING (true)
  WITH CHECK (public.is_admin(auth.uid()) OR true);

-- ============================================================
-- 3. INVESTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.investors (
  id                         uuid primary key references auth.users(id) on delete cascade,
  email                      text not null,
  name                       text not null,
  phone                      text not null default '',
  birthday                   text,
  company                    text,
  role                       text not null default '',
  country                    text not null default '',
  city                       text not null default '',
  preferred_industries       text,
  preferred_company_stage    text,
  linkedin_profile           text,
  other_social_media_profile text,
  calendly_link              text,
  heard_about_us             text,
  number_of_investments      integer,
  average_ticket_size        text,
  secured_lead_investor      boolean,
  participated_as_advisor    boolean,
  strong_candidate_reason    text,
  newsletter_subscribed      boolean not null default false,
  verified                   boolean not null default false,
  status                     text not null default 'pending' check (status in ('pending','approved','rejected','flagged')),
  visibility_status          text default 'normal' check (visibility_status in ('featured','hot','normal')),
  admin_notes                text,
  verified_at                timestamptz,
  verified_by                text,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_public_investors_updated_at') THEN
    CREATE TRIGGER set_public_investors_updated_at
      BEFORE UPDATE ON public.investors
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS investors_select ON public.investors;
CREATE POLICY investors_select ON public.investors FOR SELECT USING (true);
DROP POLICY IF EXISTS investors_insert ON public.investors;
CREATE POLICY investors_insert ON public.investors FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS investors_update ON public.investors;
CREATE POLICY investors_update ON public.investors FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS investors_delete ON public.investors;
CREATE POLICY investors_delete ON public.investors FOR DELETE USING (public.is_admin(auth.uid()));

-- ============================================================
-- 4. STARTUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.startups (
  id                              uuid primary key references auth.users(id) on delete cascade,
  email                           text not null,
  name                            text not null,
  founder_info                    text not null default '',
  phone                           text not null default '',
  startup_name                    text not null default '',
  website                         text,
  industry                        text not null default '',
  stage                           text check (stage in ('Idea','MVP','Scaling')),
  logo                            text,
  social_media_accounts           text,
  problem_solving                 text not null default '',
  solution                        text not null default '',
  uniqueness                      text not null default '',
  previous_financial_year_revenue numeric,
  current_financial_year_revenue  numeric,
  has_received_funding            boolean,
  monthly_burn_rate               numeric,
  investment_instrument           text check (investment_instrument in ('Equity','Convertible note','SAFE','Loan','Other','Undecided','Not interested in funding')),
  capital_seeking                 numeric,
  pre_money_valuation             numeric,
  funding_already_raised          numeric,
  team_size                       integer,
  co_founders                     text,
  calendly_link                   text,
  video_link                      text,
  pitch_deck                      text,
  additional_files                text,
  additional_video_url            text not null default '',
  achievements                    text,
  risks                           text,
  risk_mitigation                 text,
  exit_strategy                   text check (exit_strategy in ('Competitor buyout','Company buyout','Shareholder/employee buyout','IPO/RPO')),
  participated_in_accelerator     boolean,
  newsletter_subscribed           boolean not null default false,
  verified                        boolean not null default false,
  status                          text not null default 'pending' check (status in ('pending','approved','rejected','flagged')),
  visibility_status               text default 'normal' check (visibility_status in ('featured','hot','normal')),
  admin_notes                     text,
  verified_at                     timestamptz,
  verified_by                     text,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_public_startups_updated_at') THEN
    CREATE TRIGGER set_public_startups_updated_at
      BEFORE UPDATE ON public.startups
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS startups_select ON public.startups;
CREATE POLICY startups_select ON public.startups FOR SELECT USING (true);
DROP POLICY IF EXISTS startups_insert ON public.startups;
CREATE POLICY startups_insert ON public.startups FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS startups_update ON public.startups;
CREATE POLICY startups_update ON public.startups FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS startups_delete ON public.startups;
CREATE POLICY startups_delete ON public.startups FOR DELETE USING (public.is_admin(auth.uid()));

-- ============================================================
-- 5. MATCHMAKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.matchmakings (
  id             uuid primary key default gen_random_uuid(),
  investor_id    uuid not null references public.investors(id) on delete cascade,
  investor_name  text not null,
  investor_email text not null,
  startup_id     uuid not null references public.startups(id) on delete cascade,
  startup_name   text not null,
  startup_email  text not null,
  expiry_date    timestamptz not null,
  is_interested  boolean not null default false,
  is_archived    boolean not null default false,
  matched_by     uuid not null,
  comment        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_public_matchmakings_updated_at') THEN
    CREATE TRIGGER set_public_matchmakings_updated_at
      BEFORE UPDATE ON public.matchmakings
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

ALTER TABLE public.matchmakings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS matchmakings_select ON public.matchmakings;
CREATE POLICY matchmakings_select ON public.matchmakings FOR SELECT USING (
  auth.uid() = investor_id OR auth.uid() = startup_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS matchmakings_insert ON public.matchmakings;
CREATE POLICY matchmakings_insert ON public.matchmakings FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS matchmakings_update ON public.matchmakings;
CREATE POLICY matchmakings_update ON public.matchmakings FOR UPDATE USING (
  auth.uid() = investor_id OR auth.uid() = startup_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS matchmakings_delete ON public.matchmakings;
CREATE POLICY matchmakings_delete ON public.matchmakings FOR DELETE USING (public.is_admin(auth.uid()));

-- ============================================================
-- 6. INVESTOR-STARTUP CONNECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.investor_startup_connections (
  id                     uuid primary key default gen_random_uuid(),
  investor_id            uuid not null references public.investors(id) on delete cascade,
  startup_id             uuid not null references public.startups(id) on delete cascade,
  connection_type        text not null check (connection_type in ('interested','info_request')),
  investor_name          text not null,
  investor_email         text not null,
  investor_calendly_link text,
  startup_name           text not null,
  startup_email          text not null,
  message                text,
  status                 text not null default 'active' check (status in ('active','archived')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_public_investor_startup_connections_updated_at') THEN
    CREATE TRIGGER set_public_investor_startup_connections_updated_at
      BEFORE UPDATE ON public.investor_startup_connections
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

ALTER TABLE public.investor_startup_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS connections_select ON public.investor_startup_connections;
CREATE POLICY connections_select ON public.investor_startup_connections FOR SELECT USING (
  auth.uid() = investor_id OR auth.uid() = startup_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS connections_insert ON public.investor_startup_connections;
CREATE POLICY connections_insert ON public.investor_startup_connections FOR INSERT WITH CHECK (
  auth.uid() = investor_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS connections_update ON public.investor_startup_connections;
CREATE POLICY connections_update ON public.investor_startup_connections FOR UPDATE USING (
  auth.uid() = investor_id OR auth.uid() = startup_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS connections_delete ON public.investor_startup_connections;
CREATE POLICY connections_delete ON public.investor_startup_connections FOR DELETE USING (public.is_admin(auth.uid()));

-- ============================================================
-- 7. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null,
  type           text not null default 'other',
  title          text not null,
  content        text not null,
  metadata       jsonb default '{}'::jsonb,
  is_read        boolean not null default false,
  read_at        timestamptz,
  priority       text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  newsletter_id  uuid,
  recipient_type text,
  action_url     text,
  action_label   text,
  is_archived    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  scheduled_for  timestamptz,
  sent_at        timestamptz
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_public_notifications_updated_at') THEN
    CREATE TRIGGER set_public_notifications_updated_at
      BEFORE UPDATE ON public.notifications
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (
  auth.uid() = user_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications FOR INSERT WITH CHECK (
  auth.uid() = user_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (
  auth.uid() = user_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete ON public.notifications FOR DELETE USING (public.is_admin(auth.uid()));

-- ============================================================
-- 8. NEWSLETTER CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  subject             text not null,
  content             text not null,
  recipient_type      text not null default 'all' check (recipient_type in ('all','investors','startups','specific')),
  specific_recipients text[],
  status              text not null default 'draft' check (status in ('draft','scheduled','sending','sent','cancelled')),
  scheduled_for       timestamptz,
  sent_at             timestamptz,
  total_recipients    integer not null default 0,
  created_by          uuid not null,
  metadata            jsonb default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_public_newsletter_campaigns_updated_at') THEN
    CREATE TRIGGER set_public_newsletter_campaigns_updated_at
      BEFORE UPDATE ON public.newsletter_campaigns
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS campaigns_select ON public.newsletter_campaigns;
CREATE POLICY campaigns_select ON public.newsletter_campaigns FOR SELECT USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS campaigns_insert ON public.newsletter_campaigns;
CREATE POLICY campaigns_insert ON public.newsletter_campaigns FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS campaigns_update ON public.newsletter_campaigns;
CREATE POLICY campaigns_update ON public.newsletter_campaigns FOR UPDATE USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS campaigns_delete ON public.newsletter_campaigns;
CREATE POLICY campaigns_delete ON public.newsletter_campaigns FOR DELETE USING (public.is_admin(auth.uid()));

-- ============================================================
-- 9. USER INVITES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_invites (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  name         text not null,
  invited_by   uuid not null,
  invited_at   timestamptz not null default now(),
  status       text not null default 'pending' check (status in ('pending','accepted','expired')),
  invite_token text not null unique,
  expires_at   timestamptz not null,
  user_id      uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_public_user_invites_updated_at') THEN
    CREATE TRIGGER set_public_user_invites_updated_at
      BEFORE UPDATE ON public.user_invites
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_invites_select ON public.user_invites;
-- Anyone can read (needed for token lookup during invite acceptance)
CREATE POLICY user_invites_select ON public.user_invites FOR SELECT USING (true);
DROP POLICY IF EXISTS user_invites_insert ON public.user_invites;
CREATE POLICY user_invites_insert ON public.user_invites FOR INSERT WITH CHECK (public.is_admin(auth.uid()) OR true);
DROP POLICY IF EXISTS user_invites_update ON public.user_invites;
CREATE POLICY user_invites_update ON public.user_invites FOR UPDATE USING (true);
DROP POLICY IF EXISTS user_invites_delete ON public.user_invites;
CREATE POLICY user_invites_delete ON public.user_invites FOR DELETE USING (public.is_admin(auth.uid()) OR true);

-- ============================================================
-- 10. ARTICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.articles (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  slug               text not null unique,
  content            text not null,
  excerpt            text not null default '',
  featured_image_url text,
  category           text not null default 'news',
  tags               text[] not null default '{}',
  status             text not null default 'draft' check (status in ('draft','published','archived')),
  author_id          uuid not null,
  author_name        text not null,
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  views_count        integer not null default 0,
  is_featured        boolean not null default false,
  seo_title          text,
  seo_description    text
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_public_articles_updated_at') THEN
    CREATE TRIGGER set_public_articles_updated_at
      BEFORE UPDATE ON public.articles
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS articles_select ON public.articles;
CREATE POLICY articles_select ON public.articles FOR SELECT USING (true);
DROP POLICY IF EXISTS articles_insert ON public.articles;
CREATE POLICY articles_insert ON public.articles FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS articles_update ON public.articles;
CREATE POLICY articles_update ON public.articles FOR UPDATE USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS articles_delete ON public.articles;
CREATE POLICY articles_delete ON public.articles FOR DELETE USING (public.is_admin(auth.uid()));

-- ============================================================
-- 11. PAPER WALLETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.paper_wallets (
  investor_id       uuid primary key references public.investors(id) on delete cascade,
  currency_code     text not null default 'SAR',
  starting_balance  numeric(14,2) not null default 100000,
  total_added       numeric(14,2) not null default 0,
  available_balance numeric(14,2) not null default 100000,
  reserved_balance  numeric(14,2) not null default 0,
  invested_balance  numeric(14,2) not null default 0,
  realized_pnl      numeric(14,2) not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_public_paper_wallets_updated_at') THEN
    CREATE TRIGGER set_public_paper_wallets_updated_at
      BEFORE UPDATE ON public.paper_wallets
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

ALTER TABLE public.paper_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS paper_wallets_select ON public.paper_wallets;
CREATE POLICY paper_wallets_select ON public.paper_wallets FOR SELECT USING (
  auth.uid() = investor_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS paper_wallets_insert ON public.paper_wallets;
CREATE POLICY paper_wallets_insert ON public.paper_wallets FOR INSERT WITH CHECK (
  auth.uid() = investor_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS paper_wallets_update ON public.paper_wallets;
CREATE POLICY paper_wallets_update ON public.paper_wallets FOR UPDATE USING (
  auth.uid() = investor_id OR public.is_admin(auth.uid())
);

-- ============================================================
-- 12. PAPER WALLET TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.paper_wallet_transactions (
  id          uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investors(id) on delete cascade,
  type        text not null check (type in ('initial_funding','add_funds','investment_reserved','investment_finalized','investment_released')),
  amount      numeric(14,2) not null check (amount > 0),
  description text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

ALTER TABLE public.paper_wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pwt_select ON public.paper_wallet_transactions;
CREATE POLICY pwt_select ON public.paper_wallet_transactions FOR SELECT USING (
  auth.uid() = investor_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS pwt_insert ON public.paper_wallet_transactions;
CREATE POLICY pwt_insert ON public.paper_wallet_transactions FOR INSERT WITH CHECK (
  auth.uid() = investor_id OR public.is_admin(auth.uid())
);

-- ============================================================
-- 13. PAPER INVESTMENT OFFERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.paper_investment_offers (
  id                        uuid primary key default gen_random_uuid(),
  investor_id               uuid not null references public.investors(id) on delete cascade,
  startup_id                uuid not null references public.startups(id) on delete cascade,
  matchmaking_id            uuid references public.matchmakings(id) on delete set null,
  amount                    numeric(14,2) not null check (amount > 0),
  valuation_at_offer        numeric(14,2) not null check (valuation_at_offer > 0),
  implied_equity_percentage numeric(9,6) not null check (implied_equity_percentage >= 0 AND implied_equity_percentage <= 100),
  status                    text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  note                      text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_public_paper_investment_offers_updated_at') THEN
    CREATE TRIGGER set_public_paper_investment_offers_updated_at
      BEFORE UPDATE ON public.paper_investment_offers
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

ALTER TABLE public.paper_investment_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pio_select ON public.paper_investment_offers;
CREATE POLICY pio_select ON public.paper_investment_offers FOR SELECT USING (
  auth.uid() = investor_id OR auth.uid() = startup_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS pio_insert ON public.paper_investment_offers;
CREATE POLICY pio_insert ON public.paper_investment_offers FOR INSERT WITH CHECK (
  auth.uid() = investor_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS pio_update ON public.paper_investment_offers;
CREATE POLICY pio_update ON public.paper_investment_offers FOR UPDATE USING (
  auth.uid() = investor_id OR auth.uid() = startup_id OR public.is_admin(auth.uid())
);

-- ============================================================
-- 14. PAPER INVESTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.paper_investments (
  id                      uuid primary key default gen_random_uuid(),
  investor_id             uuid not null references public.investors(id) on delete cascade,
  startup_id              uuid not null references public.startups(id) on delete cascade,
  offer_id                uuid references public.paper_investment_offers(id) on delete set null,
  matchmaking_id          uuid references public.matchmakings(id) on delete set null,
  amount                  numeric(14,2) not null check (amount > 0),
  valuation_at_investment numeric(14,2),
  ownership_pct           numeric(9,6),
  instrument              text check (instrument in ('Equity','Convertible note','SAFE','Loan','Other','Undecided','Not interested in funding')),
  notes                   text,
  status                  text not null default 'active' check (status in ('active','exited','cancelled')),
  exit_amount             numeric(14,2),
  exited_at               timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_public_paper_investments_updated_at') THEN
    CREATE TRIGGER set_public_paper_investments_updated_at
      BEFORE UPDATE ON public.paper_investments
      FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

ALTER TABLE public.paper_investments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pi_select ON public.paper_investments;
CREATE POLICY pi_select ON public.paper_investments FOR SELECT USING (
  auth.uid() = investor_id OR auth.uid() = startup_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS pi_insert ON public.paper_investments;
CREATE POLICY pi_insert ON public.paper_investments FOR INSERT WITH CHECK (
  auth.uid() = investor_id OR auth.uid() = startup_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS pi_update ON public.paper_investments;
CREATE POLICY pi_update ON public.paper_investments FOR UPDATE USING (
  auth.uid() = investor_id OR auth.uid() = startup_id OR public.is_admin(auth.uid())
);

-- ============================================================
-- 15. STARTUP VALUATION HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.startup_valuation_history (
  id         uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups(id) on delete cascade,
  valuation  numeric(14,2) not null check (valuation > 0),
  reason     text,
  created_at timestamptz not null default now()
);

ALTER TABLE public.startup_valuation_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS svh_select ON public.startup_valuation_history;
-- Any authenticated user can read valuation history (investors need this for portfolio math)
CREATE POLICY svh_select ON public.startup_valuation_history FOR SELECT USING (
  auth.role() = 'authenticated'
);
DROP POLICY IF EXISTS svh_insert ON public.startup_valuation_history;
CREATE POLICY svh_insert ON public.startup_valuation_history FOR INSERT WITH CHECK (
  auth.uid() = startup_id OR public.is_admin(auth.uid())
);

-- ============================================================
-- 16. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_investors_status           ON public.investors(status);
CREATE INDEX IF NOT EXISTS idx_startups_status            ON public.startups(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user         ON public.notifications(user_id, is_archived, created_at desc);
CREATE INDEX IF NOT EXISTS idx_connections_investor       ON public.investor_startup_connections(investor_id);
CREATE INDEX IF NOT EXISTS idx_connections_startup        ON public.investor_startup_connections(startup_id);
CREATE INDEX IF NOT EXISTS idx_matchmakings_investor      ON public.matchmakings(investor_id);
CREATE INDEX IF NOT EXISTS idx_matchmakings_startup       ON public.matchmakings(startup_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug              ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status            ON public.articles(status, published_at desc);
CREATE INDEX IF NOT EXISTS idx_paper_wallet_tx_investor   ON public.paper_wallet_transactions(investor_id, created_at desc);
CREATE INDEX IF NOT EXISTS idx_pio_investor               ON public.paper_investment_offers(investor_id, status, created_at desc);
CREATE INDEX IF NOT EXISTS idx_pio_startup                ON public.paper_investment_offers(startup_id, status, created_at desc);
CREATE INDEX IF NOT EXISTS idx_pi_investor                ON public.paper_investments(investor_id, status);
CREATE INDEX IF NOT EXISTS idx_pi_startup                 ON public.paper_investments(startup_id, status);
CREATE INDEX IF NOT EXISTS idx_svh_startup                ON public.startup_valuation_history(startup_id, created_at desc);

-- ============================================================
-- 17. RPC FUNCTIONS
-- ============================================================

-- Increment article views (callable by anyone, SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.increment_article_views(article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.articles SET views_count = views_count + 1 WHERE id = article_id;
END;
$$;

-- Get unread notification count for a user
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cnt integer;
BEGIN
  SELECT count(*)::integer INTO cnt
  FROM public.notifications
  WHERE user_id = p_user_id AND is_read = false AND is_archived = false;
  RETURN cnt;
END;
$$;

-- Send notifications to multiple users in bulk
CREATE OR REPLACE FUNCTION public.send_notification_to_users(
  p_user_ids     uuid[],
  p_type         text,
  p_title        text,
  p_content      text,
  p_metadata     jsonb    default '{}'::jsonb,
  p_newsletter_id uuid   default null,
  p_priority     text    default 'normal',
  p_action_url   text    default null,
  p_action_label text    default null
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid;
  cnt integer := 0;
BEGIN
  FOREACH uid IN ARRAY p_user_ids LOOP
    INSERT INTO public.notifications (
      user_id, type, title, content, metadata,
      newsletter_id, priority, action_url, action_label, sent_at
    ) VALUES (
      uid, p_type, p_title, p_content, p_metadata,
      p_newsletter_id, p_priority, p_action_url, p_action_label, now()
    );
    cnt := cnt + 1;
  END LOOP;
  RETURN cnt;
END;
$$;

-- ============================================================
-- 18. STORAGE BUCKET: pitchdecks
-- ============================================================

-- Create the bucket if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pitchdecks',
  'pitchdecks',
  true,
  10485760,  -- 10 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS policies for pitchdecks bucket
-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS pitchdecks_select  ON storage.objects;
DROP POLICY IF EXISTS pitchdecks_insert  ON storage.objects;
DROP POLICY IF EXISTS pitchdecks_update  ON storage.objects;
DROP POLICY IF EXISTS pitchdecks_delete  ON storage.objects;

-- Public read (bucket is public, but enforce via RLS as well)
CREATE POLICY pitchdecks_select ON storage.objects
  FOR SELECT USING (bucket_id = 'pitchdecks');

-- Authenticated users can upload their own files
-- Convention: files are stored as <startup_id>/<filename>
CREATE POLICY pitchdecks_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pitchdecks' AND auth.role() = 'authenticated'
  );

-- Owners and admins can update/replace their files
CREATE POLICY pitchdecks_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'pitchdecks' AND auth.role() = 'authenticated'
  );

-- Owners and admins can delete files
CREATE POLICY pitchdecks_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pitchdecks' AND auth.role() = 'authenticated'
  );
