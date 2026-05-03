-- ============================================================
-- Bathra – Complete Database Schema
-- Run this ONCE against a fresh Supabase project.
-- It is idempotent (uses IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- =========================
-- 0. Helper function: is_admin
-- =========================
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (select 1 from public.admins where id = uid);
$$;

-- =========================
-- 1. ADMINS
-- =========================
create table if not exists public.admins (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null,
  admin_level text not null default 'standard',
  avatar      text,
  phone_number text,
  location    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists admins_select on public.admins;
create policy admins_select on public.admins for select using (true);

drop policy if exists admins_insert on public.admins;
create policy admins_insert on public.admins for insert with check (public.is_admin(auth.uid()) or auth.uid() = id);

drop policy if exists admins_update on public.admins;
create policy admins_update on public.admins for update using (public.is_admin(auth.uid()));

drop policy if exists admins_delete on public.admins;
create policy admins_delete on public.admins for delete using (public.is_admin(auth.uid()));

-- =========================
-- 2. ADMIN INVITES
-- =========================
create table if not exists public.admin_invites (
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

alter table public.admin_invites enable row level security;

drop policy if exists admin_invites_all on public.admin_invites;
create policy admin_invites_all on public.admin_invites using (public.is_admin(auth.uid()) or true) with check (true);

-- =========================
-- 3. INVESTORS
-- =========================
create table if not exists public.investors (
  id                        uuid primary key references auth.users(id) on delete cascade,
  email                     text not null,
  name                      text not null,
  phone                     text not null default '',
  birthday                  text,
  company                   text,
  role                      text not null default '',
  country                   text not null default '',
  city                      text not null default '',
  preferred_industries      text,
  preferred_company_stage   text,
  linkedin_profile          text,
  other_social_media_profile text,
  calendly_link             text,
  heard_about_us            text,
  number_of_investments     integer,
  average_ticket_size       text,
  secured_lead_investor     boolean,
  participated_as_advisor   boolean,
  strong_candidate_reason   text,
  newsletter_subscribed     boolean not null default false,
  verified                  boolean not null default false,
  status                    text not null default 'pending' check (status in ('pending','approved','rejected','flagged')),
  visibility_status         text default 'normal' check (visibility_status in ('featured','hot','normal')),
  admin_notes               text,
  verified_at               timestamptz,
  verified_by               text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz
);

alter table public.investors enable row level security;

drop policy if exists investors_select on public.investors;
create policy investors_select on public.investors for select using (true);

drop policy if exists investors_insert on public.investors;
create policy investors_insert on public.investors for insert with check (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists investors_update on public.investors;
create policy investors_update on public.investors for update using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists investors_delete on public.investors;
create policy investors_delete on public.investors for delete using (public.is_admin(auth.uid()));

-- =========================
-- 4. STARTUPS
-- =========================
create table if not exists public.startups (
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

alter table public.startups enable row level security;

drop policy if exists startups_select on public.startups;
create policy startups_select on public.startups for select using (true);

drop policy if exists startups_insert on public.startups;
create policy startups_insert on public.startups for insert with check (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists startups_update on public.startups;
create policy startups_update on public.startups for update using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists startups_delete on public.startups;
create policy startups_delete on public.startups for delete using (public.is_admin(auth.uid()));

-- =========================
-- 5. MATCHMAKINGS
-- =========================
create table if not exists public.matchmakings (
  id              uuid primary key default gen_random_uuid(),
  investor_id     uuid not null references public.investors(id) on delete cascade,
  investor_name   text not null,
  investor_email  text not null,
  startup_id      uuid not null references public.startups(id) on delete cascade,
  startup_name    text not null,
  startup_email   text not null,
  expiry_date     timestamptz not null,
  is_interested   boolean not null default false,
  is_archived     boolean not null default false,
  matched_by      uuid not null,
  comment         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.matchmakings enable row level security;

drop policy if exists matchmakings_select on public.matchmakings;
create policy matchmakings_select on public.matchmakings for select using (
  auth.uid() = investor_id or auth.uid() = startup_id or public.is_admin(auth.uid())
);

drop policy if exists matchmakings_insert on public.matchmakings;
create policy matchmakings_insert on public.matchmakings for insert with check (public.is_admin(auth.uid()));

drop policy if exists matchmakings_update on public.matchmakings;
create policy matchmakings_update on public.matchmakings for update using (
  auth.uid() = investor_id or auth.uid() = startup_id or public.is_admin(auth.uid())
);

drop policy if exists matchmakings_delete on public.matchmakings;
create policy matchmakings_delete on public.matchmakings for delete using (public.is_admin(auth.uid()));

-- =========================
-- 6. INVESTOR-STARTUP CONNECTIONS
-- =========================
create table if not exists public.investor_startup_connections (
  id                      uuid primary key default gen_random_uuid(),
  investor_id             uuid not null references public.investors(id) on delete cascade,
  startup_id              uuid not null references public.startups(id) on delete cascade,
  connection_type         text not null check (connection_type in ('interested','info_request')),
  investor_name           text not null,
  investor_email          text not null,
  investor_calendly_link  text,
  startup_name            text not null,
  startup_email           text not null,
  message                 text,
  status                  text not null default 'active' check (status in ('active','archived')),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz
);

alter table public.investor_startup_connections enable row level security;

drop policy if exists connections_select on public.investor_startup_connections;
create policy connections_select on public.investor_startup_connections for select using (
  auth.uid() = investor_id or auth.uid() = startup_id or public.is_admin(auth.uid())
);

drop policy if exists connections_insert on public.investor_startup_connections;
create policy connections_insert on public.investor_startup_connections for insert with check (
  auth.uid() = investor_id or public.is_admin(auth.uid())
);

drop policy if exists connections_update on public.investor_startup_connections;
create policy connections_update on public.investor_startup_connections for update using (
  auth.uid() = investor_id or auth.uid() = startup_id or public.is_admin(auth.uid())
);

drop policy if exists connections_delete on public.investor_startup_connections;
create policy connections_delete on public.investor_startup_connections for delete using (public.is_admin(auth.uid()));

-- =========================
-- 7. NOTIFICATIONS
-- =========================
create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null,
  type            text not null default 'other',
  title           text not null,
  content         text not null,
  metadata        jsonb default '{}'::jsonb,
  is_read         boolean not null default false,
  read_at         timestamptz,
  priority        text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  newsletter_id   uuid,
  recipient_type  text,
  action_url      text,
  action_label    text,
  is_archived     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  scheduled_for   timestamptz,
  sent_at         timestamptz
);

alter table public.notifications enable row level security;

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select using (
  auth.uid() = user_id or public.is_admin(auth.uid())
);

drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert with check (
  auth.uid() = user_id or public.is_admin(auth.uid())
);

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update using (
  auth.uid() = user_id or public.is_admin(auth.uid())
);

drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications for delete using (public.is_admin(auth.uid()));

-- =========================
-- 8. NEWSLETTER CAMPAIGNS
-- =========================
create table if not exists public.newsletter_campaigns (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  subject              text not null,
  content              text not null,
  recipient_type       text not null default 'all' check (recipient_type in ('all','investors','startups','specific')),
  specific_recipients  text[],
  status               text not null default 'draft' check (status in ('draft','scheduled','sending','sent','cancelled')),
  scheduled_for        timestamptz,
  sent_at              timestamptz,
  total_recipients     integer not null default 0,
  created_by           uuid not null,
  metadata             jsonb default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.newsletter_campaigns enable row level security;

drop policy if exists campaigns_select on public.newsletter_campaigns;
create policy campaigns_select on public.newsletter_campaigns for select using (public.is_admin(auth.uid()));

drop policy if exists campaigns_insert on public.newsletter_campaigns;
create policy campaigns_insert on public.newsletter_campaigns for insert with check (public.is_admin(auth.uid()));

drop policy if exists campaigns_update on public.newsletter_campaigns;
create policy campaigns_update on public.newsletter_campaigns for update using (public.is_admin(auth.uid()));

drop policy if exists campaigns_delete on public.newsletter_campaigns;
create policy campaigns_delete on public.newsletter_campaigns for delete using (public.is_admin(auth.uid()));

-- =========================
-- 9. USER INVITES
-- =========================
create table if not exists public.user_invites (
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

alter table public.user_invites enable row level security;

drop policy if exists user_invites_select on public.user_invites;
create policy user_invites_select on public.user_invites for select using (true);

drop policy if exists user_invites_insert on public.user_invites;
create policy user_invites_insert on public.user_invites for insert with check (public.is_admin(auth.uid()) or true);

drop policy if exists user_invites_update on public.user_invites;
create policy user_invites_update on public.user_invites for update using (true);

drop policy if exists user_invites_delete on public.user_invites;
create policy user_invites_delete on public.user_invites for delete using (public.is_admin(auth.uid()) or true);

-- =========================
-- 10. ARTICLES
-- =========================
create table if not exists public.articles (
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

alter table public.articles enable row level security;

drop policy if exists articles_select on public.articles;
create policy articles_select on public.articles for select using (true);

drop policy if exists articles_insert on public.articles;
create policy articles_insert on public.articles for insert with check (public.is_admin(auth.uid()));

drop policy if exists articles_update on public.articles;
create policy articles_update on public.articles for update using (public.is_admin(auth.uid()));

drop policy if exists articles_delete on public.articles;
create policy articles_delete on public.articles for delete using (public.is_admin(auth.uid()));

-- =========================
-- 11. PAPER WALLETS
-- =========================
create table if not exists public.paper_wallets (
  investor_id      uuid primary key references public.investors(id) on delete cascade,
  currency_code    text not null default 'SAR',
  starting_balance numeric(14,2) not null default 100000,
  total_added      numeric(14,2) not null default 0,
  available_balance numeric(14,2) not null default 100000,
  reserved_balance numeric(14,2) not null default 0,
  invested_balance numeric(14,2) not null default 0,
  realized_pnl     numeric(14,2) not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);

alter table public.paper_wallets enable row level security;

drop policy if exists paper_wallets_select on public.paper_wallets;
create policy paper_wallets_select on public.paper_wallets for select using (
  auth.uid() = investor_id or public.is_admin(auth.uid())
);

drop policy if exists paper_wallets_insert on public.paper_wallets;
create policy paper_wallets_insert on public.paper_wallets for insert with check (
  auth.uid() = investor_id or public.is_admin(auth.uid())
);

drop policy if exists paper_wallets_update on public.paper_wallets;
create policy paper_wallets_update on public.paper_wallets for update using (
  auth.uid() = investor_id or public.is_admin(auth.uid())
);

-- =========================
-- 12. PAPER WALLET TRANSACTIONS
-- =========================
create table if not exists public.paper_wallet_transactions (
  id          uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investors(id) on delete cascade,
  type        text not null check (type in ('initial_funding','add_funds','investment_reserved','investment_finalized','investment_released')),
  amount      numeric(14,2) not null check (amount > 0),
  description text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

alter table public.paper_wallet_transactions enable row level security;

drop policy if exists pwt_select on public.paper_wallet_transactions;
create policy pwt_select on public.paper_wallet_transactions for select using (
  auth.uid() = investor_id or public.is_admin(auth.uid())
);

drop policy if exists pwt_insert on public.paper_wallet_transactions;
create policy pwt_insert on public.paper_wallet_transactions for insert with check (
  auth.uid() = investor_id or public.is_admin(auth.uid())
);

-- =========================
-- 13. PAPER INVESTMENT OFFERS
-- =========================
create table if not exists public.paper_investment_offers (
  id                        uuid primary key default gen_random_uuid(),
  investor_id               uuid not null references public.investors(id) on delete cascade,
  startup_id                uuid not null references public.startups(id) on delete cascade,
  matchmaking_id            uuid references public.matchmakings(id) on delete set null,
  amount                    numeric(14,2) not null check (amount > 0),
  valuation_at_offer        numeric(14,2) not null check (valuation_at_offer > 0),
  implied_equity_percentage numeric(9,6) not null check (implied_equity_percentage >= 0 and implied_equity_percentage <= 100),
  status                    text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  note                      text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table public.paper_investment_offers enable row level security;

drop policy if exists pio_select on public.paper_investment_offers;
create policy pio_select on public.paper_investment_offers for select using (
  auth.uid() = investor_id or auth.uid() = startup_id or public.is_admin(auth.uid())
);

drop policy if exists pio_insert on public.paper_investment_offers;
create policy pio_insert on public.paper_investment_offers for insert with check (
  auth.uid() = investor_id or public.is_admin(auth.uid())
);

drop policy if exists pio_update on public.paper_investment_offers;
create policy pio_update on public.paper_investment_offers for update using (
  auth.uid() = investor_id or auth.uid() = startup_id or public.is_admin(auth.uid())
);

-- =========================
-- 14. PAPER INVESTMENTS
-- =========================
create table if not exists public.paper_investments (
  id                       uuid primary key default gen_random_uuid(),
  investor_id              uuid not null references public.investors(id) on delete cascade,
  startup_id               uuid not null references public.startups(id) on delete cascade,
  offer_id                 uuid references public.paper_investment_offers(id) on delete set null,
  matchmaking_id           uuid references public.matchmakings(id) on delete set null,
  amount                   numeric(14,2) not null check (amount > 0),
  valuation_at_investment  numeric(14,2),
  ownership_pct            numeric(9,6),
  instrument               text check (instrument in ('Equity','Convertible note','SAFE','Loan','Other','Undecided','Not interested in funding')),
  notes                    text,
  status                   text not null default 'active' check (status in ('active','exited','cancelled')),
  exit_amount              numeric(14,2),
  exited_at                timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz
);

alter table public.paper_investments enable row level security;

drop policy if exists pi_select on public.paper_investments;
create policy pi_select on public.paper_investments for select using (
  auth.uid() = investor_id or auth.uid() = startup_id or public.is_admin(auth.uid())
);

drop policy if exists pi_insert on public.paper_investments;
create policy pi_insert on public.paper_investments for insert with check (
  auth.uid() = investor_id or auth.uid() = startup_id or public.is_admin(auth.uid())
);

drop policy if exists pi_update on public.paper_investments;
create policy pi_update on public.paper_investments for update using (
  auth.uid() = investor_id or auth.uid() = startup_id or public.is_admin(auth.uid())
);

-- =========================
-- 15. STARTUP VALUATION HISTORY
-- =========================
create table if not exists public.startup_valuation_history (
  id         uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups(id) on delete cascade,
  valuation  numeric(14,2) not null check (valuation > 0),
  reason     text,
  created_at timestamptz not null default now()
);

alter table public.startup_valuation_history enable row level security;

drop policy if exists svh_select on public.startup_valuation_history;
create policy svh_select on public.startup_valuation_history for select using (
  auth.role() = 'authenticated'
);

drop policy if exists svh_insert on public.startup_valuation_history;
create policy svh_insert on public.startup_valuation_history for insert with check (
  auth.uid() = startup_id or public.is_admin(auth.uid())
);

-- =========================
-- 16. INDEXES
-- =========================
create index if not exists idx_investors_status on public.investors(status);
create index if not exists idx_startups_status on public.startups(status);
create index if not exists idx_notifications_user on public.notifications(user_id, is_archived, created_at desc);
create index if not exists idx_connections_investor on public.investor_startup_connections(investor_id);
create index if not exists idx_connections_startup on public.investor_startup_connections(startup_id);
create index if not exists idx_matchmakings_investor on public.matchmakings(investor_id);
create index if not exists idx_matchmakings_startup on public.matchmakings(startup_id);
create index if not exists idx_articles_slug on public.articles(slug);
create index if not exists idx_articles_status on public.articles(status, published_at desc);
create index if not exists idx_paper_wallet_tx_investor on public.paper_wallet_transactions(investor_id, created_at desc);
create index if not exists idx_pio_investor on public.paper_investment_offers(investor_id, status, created_at desc);
create index if not exists idx_pio_startup on public.paper_investment_offers(startup_id, status, created_at desc);
create index if not exists idx_pi_investor on public.paper_investments(investor_id, status);
create index if not exists idx_pi_startup on public.paper_investments(startup_id, status);
create index if not exists idx_svh_startup on public.startup_valuation_history(startup_id, created_at desc);

-- =========================
-- 17. RPC FUNCTIONS
-- =========================

-- Increment article views
create or replace function public.increment_article_views(article_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.articles set views_count = views_count + 1 where id = article_id;
end;
$$;

-- Get unread notification count
create or replace function public.get_unread_notification_count(p_user_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  cnt integer;
begin
  select count(*)::integer into cnt
  from public.notifications
  where user_id = p_user_id and is_read = false and is_archived = false;
  return cnt;
end;
$$;

-- Send notification to multiple users (bulk)
create or replace function public.send_notification_to_users(
  p_user_ids uuid[],
  p_type text,
  p_title text,
  p_content text,
  p_metadata jsonb default '{}'::jsonb,
  p_newsletter_id uuid default null,
  p_priority text default 'normal',
  p_action_url text default null,
  p_action_label text default null
)
returns integer
language plpgsql
security definer
as $$
declare
  uid uuid;
  cnt integer := 0;
begin
  foreach uid in array p_user_ids loop
    insert into public.notifications (user_id, type, title, content, metadata, newsletter_id, priority, action_url, action_label, sent_at)
    values (uid, p_type, p_title, p_content, p_metadata, p_newsletter_id, p_priority, p_action_url, p_action_label, now());
    cnt := cnt + 1;
  end loop;
  return cnt;
end;
$$;
