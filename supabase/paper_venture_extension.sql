begin;

create table if not exists public.paper_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investors(id) on delete cascade,
  type text not null check (
    type in (
      'initial_funding',
      'add_funds',
      'investment_reserved',
      'investment_finalized',
      'investment_released'
    )
  ),
  amount numeric(14,2) not null check (amount > 0),
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.paper_wallets
  add column if not exists total_added numeric(14,2) not null default 0,
  add column if not exists reserved_balance numeric(14,2) not null default 0;

create table if not exists public.paper_investment_offers (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investors(id) on delete cascade,
  startup_id uuid not null references public.startups(id) on delete cascade,
  matchmaking_id uuid references public.matchmakings(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  valuation_at_offer numeric(14,2) not null check (valuation_at_offer > 0),
  implied_equity_percentage numeric(9,6) not null check (
    implied_equity_percentage >= 0 and implied_equity_percentage <= 100
  ),
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'rejected', 'cancelled')
  ),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.paper_investments
  add column if not exists offer_id uuid references public.paper_investment_offers(id) on delete set null;

create table if not exists public.startup_valuation_history (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups(id) on delete cascade,
  valuation numeric(14,2) not null check (valuation > 0),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists paper_wallet_transactions_investor_idx
  on public.paper_wallet_transactions (investor_id, created_at desc);

create index if not exists paper_investment_offers_investor_idx
  on public.paper_investment_offers (investor_id, status, created_at desc);

create index if not exists paper_investment_offers_startup_idx
  on public.paper_investment_offers (startup_id, status, created_at desc);

create index if not exists startup_valuation_history_startup_idx
  on public.startup_valuation_history (startup_id, created_at desc);

alter table public.paper_wallet_transactions enable row level security;
alter table public.paper_investment_offers enable row level security;
alter table public.startup_valuation_history enable row level security;

create policy if not exists paper_wallet_transactions_select_owner_or_admin
on public.paper_wallet_transactions
for select
using (investor_id = auth.uid() or public.is_admin(auth.uid()));

create policy if not exists paper_wallet_transactions_insert_owner_or_admin
on public.paper_wallet_transactions
for insert
with check (investor_id = auth.uid() or public.is_admin(auth.uid()));

create policy if not exists paper_investment_offers_select_participants_or_admin
on public.paper_investment_offers
for select
using (
  investor_id = auth.uid()
  or startup_id = auth.uid()
  or public.is_admin(auth.uid())
);

create policy if not exists paper_investment_offers_insert_owner_or_admin
on public.paper_investment_offers
for insert
with check (investor_id = auth.uid() or public.is_admin(auth.uid()));

create policy if not exists paper_investment_offers_update_participants_or_admin
on public.paper_investment_offers
for update
using (
  investor_id = auth.uid()
  or startup_id = auth.uid()
  or public.is_admin(auth.uid())
)
with check (
  investor_id = auth.uid()
  or startup_id = auth.uid()
  or public.is_admin(auth.uid())
);

create policy if not exists startup_valuation_history_select_participants_or_admin
on public.startup_valuation_history
for select
using (
  startup_id = auth.uid()
  or public.is_admin(auth.uid())
  or auth.role() = 'authenticated'
);

create policy if not exists startup_valuation_history_insert_startup_or_admin
on public.startup_valuation_history
for insert
with check (startup_id = auth.uid() or public.is_admin(auth.uid()));

commit;
