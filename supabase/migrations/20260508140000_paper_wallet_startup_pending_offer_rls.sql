-- Startups may read/write investor paper wallets only when a pending offer links them.
-- Operations must run before the offer leaves `pending` (see client accept/reject order).

drop policy if exists paper_wallets_select_via_pending_offer_as_startup on public.paper_wallets;
create policy paper_wallets_select_via_pending_offer_as_startup
on public.paper_wallets
for select
using (
  exists (
    select 1
    from public.paper_investment_offers o
    where o.investor_id = paper_wallets.investor_id
      and o.startup_id = auth.uid()
      and o.status = 'pending'
  )
);

drop policy if exists paper_wallets_insert_via_pending_offer_as_startup on public.paper_wallets;
create policy paper_wallets_insert_via_pending_offer_as_startup
on public.paper_wallets
for insert
with check (
  exists (
    select 1
    from public.paper_investment_offers o
    where o.investor_id = paper_wallets.investor_id
      and o.startup_id = auth.uid()
      and o.status = 'pending'
  )
);

drop policy if exists paper_wallets_update_via_pending_offer_as_startup on public.paper_wallets;
create policy paper_wallets_update_via_pending_offer_as_startup
on public.paper_wallets
for update
using (
  exists (
    select 1
    from public.paper_investment_offers o
    where o.investor_id = paper_wallets.investor_id
      and o.startup_id = auth.uid()
      and o.status = 'pending'
  )
)
with check (
  exists (
    select 1
    from public.paper_investment_offers o
    where o.investor_id = paper_wallets.investor_id
      and o.startup_id = auth.uid()
      and o.status = 'pending'
  )
);

drop policy if exists paper_wallet_transactions_insert_via_pending_offer_as_startup on public.paper_wallet_transactions;
create policy paper_wallet_transactions_insert_via_pending_offer_as_startup
on public.paper_wallet_transactions
for insert
with check (
  exists (
    select 1
    from public.paper_investment_offers o
    where o.investor_id = paper_wallet_transactions.investor_id
      and o.startup_id = auth.uid()
      and o.status = 'pending'
  )
);
