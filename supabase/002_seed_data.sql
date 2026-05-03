-- ============================================================
-- Bathra – Seed / Demo Data
-- Run AFTER 001_full_schema.sql
--
-- IMPORTANT: Before running this, you must create auth users
-- in the Supabase Dashboard → Authentication → Users:
--
--   1. admin@bathra.com      / password: Admin123!
--   2. investor@bathra.com   / password: Investor123!
--   3. startup@bathra.com    / password: Startup123!
--   4. startup2@bathra.com   / password: Startup123!
--   5. startup3@bathra.com   / password: Startup123!
--
-- Then copy each user's UUID and replace the placeholders below.
-- ============================================================

-- ========== PLACEHOLDER UUIDs – REPLACE WITH YOUR REAL ONES ==========
-- After creating users in Supabase Auth, replace these:
--   __ADMIN_UUID__    → UUID of admin@bathra.com
--   __INVESTOR_UUID__ → UUID of investor@bathra.com
--   __STARTUP1_UUID__ → UUID of startup@bathra.com
--   __STARTUP2_UUID__ → UUID of startup2@bathra.com
--   __STARTUP3_UUID__ → UUID of startup3@bathra.com

-- =========================
-- 1. ADMIN
-- =========================
insert into public.admins (id, email, name, admin_level)
values ('__ADMIN_UUID__', 'admin@bathra.com', 'Bathra Admin', 'super')
on conflict (id) do nothing;

-- =========================
-- 2. DEMO INVESTOR
-- =========================
insert into public.investors (
  id, email, name, phone, birthday, company, role, country, city,
  preferred_industries, preferred_company_stage, linkedin_profile,
  average_ticket_size, number_of_investments,
  strong_candidate_reason, newsletter_subscribed,
  verified, status, visibility_status
) values (
  '__INVESTOR_UUID__',
  'investor@bathra.com',
  'Ahmed Al-Rashid',
  '+966501234567',
  '1985-03-15',
  'Al-Rashid Ventures',
  'Managing Partner',
  'Saudi Arabia',
  'Riyadh',
  'FinTech,HealthTech,E-Commerce',
  'MVP',
  'https://linkedin.com/in/ahmed-alrashid',
  '500000',
  12,
  'Experienced angel investor with 12+ investments across MENA region startups.',
  true,
  true,
  'approved',
  'featured'
) on conflict (id) do nothing;

-- =========================
-- 3. DEMO STARTUPS
-- =========================
-- Startup 1 – FinTech
insert into public.startups (
  id, email, name, founder_info, phone, startup_name, website, industry, stage,
  problem_solving, solution, uniqueness,
  capital_seeking, pre_money_valuation, funding_already_raised,
  investment_instrument, monthly_burn_rate, team_size,
  achievements, risks, exit_strategy,
  newsletter_subscribed, verified, status, visibility_status
) values (
  '__STARTUP1_UUID__',
  'startup@bathra.com',
  'Sara Al-Mutairi',
  'Sara Al-Mutairi – CEO & Co-Founder',
  '+966509876543',
  'PayFlow',
  'https://payflow.sa',
  'FinTech',
  'MVP',
  'Small businesses in KSA struggle with fragmented payment solutions and high transaction fees.',
  'PayFlow offers a unified payment gateway with the lowest fees in the market, integrated invoicing and analytics.',
  'First Sharia-compliant payment gateway built specifically for Saudi SMEs with instant settlement.',
  2000000,
  8000000,
  500000,
  'SAFE',
  45000,
  8,
  'Processed SAR 2M in test transactions. Onboarded 50 beta merchants. Won Fintech Saudi 2025.',
  'Regulatory approval timeline, competition from established banks.',
  'Company buyout',
  true,
  true,
  'approved',
  'featured'
) on conflict (id) do nothing;

-- Startup 2 – HealthTech
insert into public.startups (
  id, email, name, founder_info, phone, startup_name, website, industry, stage,
  problem_solving, solution, uniqueness,
  capital_seeking, pre_money_valuation, funding_already_raised,
  investment_instrument, monthly_burn_rate, team_size,
  achievements, risks, exit_strategy,
  newsletter_subscribed, verified, status, visibility_status
) values (
  '__STARTUP2_UUID__',
  'startup2@bathra.com',
  'Khalid Al-Dosari',
  'Khalid Al-Dosari – CEO & Founder',
  '+966507654321',
  'MedConnect',
  'https://medconnect.sa',
  'HealthTech',
  'Scaling',
  'Patients in remote areas have limited access to specialists and face long waiting times.',
  'AI-powered telemedicine platform connecting patients with specialists across the Kingdom in under 5 minutes.',
  'Arabic-first AI triage system with SFDA compliance and integration with all major Saudi hospital systems.',
  5000000,
  20000000,
  2000000,
  'Equity',
  120000,
  25,
  '50,000+ consultations completed. Partnerships with 3 major hospital groups. Revenue growing 30% MoM.',
  'Healthcare regulation changes, patient data privacy concerns.',
  'IPO/RPO',
  true,
  true,
  'approved',
  'hot'
) on conflict (id) do nothing;

-- Startup 3 – E-Commerce
insert into public.startups (
  id, email, name, founder_info, phone, startup_name, website, industry, stage,
  problem_solving, solution, uniqueness,
  capital_seeking, pre_money_valuation, funding_already_raised,
  investment_instrument, monthly_burn_rate, team_size,
  achievements, risks, exit_strategy,
  newsletter_subscribed, verified, status, visibility_status
) values (
  '__STARTUP3_UUID__',
  'startup3@bathra.com',
  'Noura Al-Fahad',
  'Noura Al-Fahad – CEO & Co-Founder',
  '+966505551234',
  'Souk+',
  'https://soukplus.sa',
  'E-Commerce',
  'Idea',
  'Local artisans and small producers lack an affordable platform to reach modern Saudi consumers.',
  'Curated marketplace for Saudi-made artisanal products with same-day delivery in major cities.',
  'Exclusive focus on Saudi-made products with built-in storytelling and live-commerce features.',
  1000000,
  4000000,
  100000,
  'Convertible note',
  25000,
  5,
  'Waitlist of 500+ artisans. Completed pilot with 20 sellers. SAR 150K GMV in first month.',
  'Logistics costs, seller onboarding at scale.',
  'Competitor buyout',
  false,
  true,
  'approved',
  'normal'
) on conflict (id) do nothing;

-- =========================
-- 4. PAPER WALLET for demo investor
-- =========================
insert into public.paper_wallets (
  investor_id, currency_code, starting_balance, total_added,
  available_balance, reserved_balance, invested_balance
) values (
  '__INVESTOR_UUID__', 'SAR', 100000, 50000, 120000, 10000, 20000
) on conflict (investor_id) do nothing;

-- =========================
-- 5. PAPER INVESTMENT OFFERS
-- =========================
-- Pending offer to PayFlow
insert into public.paper_investment_offers (
  investor_id, startup_id, amount, valuation_at_offer,
  implied_equity_percentage, status, note
) values (
  '__INVESTOR_UUID__', '__STARTUP1_UUID__', 10000, 8000000,
  0.125, 'pending', 'Interested in your payment gateway solution.'
);

-- Accepted offer to MedConnect
insert into public.paper_investment_offers (
  investor_id, startup_id, amount, valuation_at_offer,
  implied_equity_percentage, status, note
) values (
  '__INVESTOR_UUID__', '__STARTUP2_UUID__', 20000, 20000000,
  0.1, 'accepted', 'Great traction in telemedicine space.'
);

-- Rejected offer to Souk+
insert into public.paper_investment_offers (
  investor_id, startup_id, amount, valuation_at_offer,
  implied_equity_percentage, status, note
) values (
  '__INVESTOR_UUID__', '__STARTUP3_UUID__', 5000, 4000000,
  0.125, 'rejected', 'Exploring e-commerce opportunities.'
);

-- =========================
-- 6. PAPER INVESTMENT (from accepted offer)
-- =========================
insert into public.paper_investments (
  investor_id, startup_id, amount, valuation_at_investment,
  ownership_pct, instrument, notes, status
) values (
  '__INVESTOR_UUID__', '__STARTUP2_UUID__', 20000, 20000000,
  0.1, 'Equity', 'Accepted investment in MedConnect.', 'active'
);

-- =========================
-- 7. WALLET TRANSACTIONS
-- =========================
insert into public.paper_wallet_transactions (investor_id, type, amount, description) values
  ('__INVESTOR_UUID__', 'initial_funding', 100000, 'Initial simulated venture fund balance'),
  ('__INVESTOR_UUID__', 'add_funds', 50000, 'Added simulated venture capital funds'),
  ('__INVESTOR_UUID__', 'investment_reserved', 10000, 'Reserved simulated funds for PayFlow'),
  ('__INVESTOR_UUID__', 'investment_reserved', 20000, 'Reserved simulated funds for MedConnect'),
  ('__INVESTOR_UUID__', 'investment_finalized', 20000, 'Finalized simulated investment in MedConnect');

-- =========================
-- 8. SAMPLE NOTIFICATIONS
-- =========================
insert into public.notifications (user_id, type, title, content, priority) values
  ('__INVESTOR_UUID__', 'system_update', 'Welcome to Bathra!', 'Your investor account has been approved. Start exploring startups.', 'high'),
  ('__INVESTOR_UUID__', 'investment_interest', 'Offer Accepted', 'MedConnect has accepted your simulated investment offer of SAR 20,000.', 'high'),
  ('__STARTUP1_UUID__', 'system_update', 'Welcome to Bathra!', 'Your startup profile for PayFlow has been approved.', 'normal'),
  ('__STARTUP1_UUID__', 'investment_interest', 'New Investment Offer', 'Ahmed Al-Rashid has submitted a simulated investment offer of SAR 10,000.', 'high'),
  ('__STARTUP2_UUID__', 'system_update', 'Welcome to Bathra!', 'Your startup profile for MedConnect has been approved.', 'normal');

-- =========================
-- 9. SAMPLE ARTICLE
-- =========================
insert into public.articles (
  title, slug, content, excerpt, category, tags, status,
  author_id, author_name, published_at, is_featured
) values (
  'Saudi Startup Ecosystem Reaches New Heights in 2025',
  'saudi-startup-ecosystem-2025',
  E'The Saudi startup ecosystem has seen unprecedented growth in 2025, with total funding exceeding SAR 5 billion across 200+ deals.\n\n## Key Highlights\n\n- **FinTech** leads with 35% of total funding\n- **HealthTech** saw 150% year-over-year growth\n- **E-Commerce** continues to expand with new verticals\n\nVision 2030 initiatives continue to drive innovation and entrepreneurship across the Kingdom.',
  'The Saudi startup ecosystem has seen unprecedented growth in 2025 with record-breaking funding rounds.',
  'news',
  ARRAY['saudi-arabia', 'startups', 'funding', 'vision-2030'],
  'published',
  '__ADMIN_UUID__',
  'Bathra Admin',
  now(),
  true
);

-- =========================
-- 10. SAMPLE CONNECTION
-- =========================
insert into public.investor_startup_connections (
  investor_id, startup_id, connection_type,
  investor_name, investor_email, startup_name, startup_email, status
) values (
  '__INVESTOR_UUID__', '__STARTUP1_UUID__', 'interested',
  'Ahmed Al-Rashid', 'investor@bathra.com', 'PayFlow', 'startup@bathra.com', 'active'
);
