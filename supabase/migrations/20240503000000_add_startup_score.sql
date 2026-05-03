ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS score integer CHECK (score >= 0 AND score <= 100);

COMMENT ON COLUMN public.startups.score IS 'Admin-assigned quality score 0-100 from StartupScoringSystem';
