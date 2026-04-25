-- ============================================================
-- FleetOS: subscriptions table
-- Run this in your Supabase SQL editor or via Supabase CLI:
--   supabase db push
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id    UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan          TEXT        NOT NULL DEFAULT 'free'
                              CHECK (plan IN ('free', 'basic', 'pro')),
  status        TEXT        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'suspended')),
  vehicle_limit INTEGER     NOT NULL DEFAULT 2,
  driver_limit  INTEGER     NOT NULL DEFAULT 2,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One subscription per company
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_company_id_idx
  ON public.subscriptions (company_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Company members can read their own subscription
CREATE POLICY "company members can read subscription"
  ON public.subscriptions FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Only service-role (admin API) can insert/update/delete
CREATE POLICY "service role full access"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- ── Seed default subscriptions for existing companies ────────────────────────
-- Free plan defaults for every company that doesn't have one yet
INSERT INTO public.subscriptions (company_id, plan, status, vehicle_limit, driver_limit)
SELECT id, 'free', 'active', 2, 2
FROM   public.companies
WHERE  id NOT IN (SELECT company_id FROM public.subscriptions)
ON CONFLICT DO NOTHING;
