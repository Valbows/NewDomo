-- Pricing tiers and user pricing mapping (idempotent)
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  monthly_price_cents INTEGER NOT NULL CHECK (monthly_price_cents >= 0),
  max_videos INTEGER,
  max_storage_mb INTEGER,
  max_concurrent_streams INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier_id UUID NOT NULL REFERENCES public.pricing_tiers(id) ON DELETE RESTRICT,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pricing_tiers read all" ON public.pricing_tiers;
CREATE POLICY "pricing_tiers read all" ON public.pricing_tiers FOR SELECT USING (true);
-- No insert/update/delete policies => only service role can modify.

ALTER TABLE public.user_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_pricing self access" ON public.user_pricing;
CREATE POLICY "user_pricing self access" ON public.user_pricing
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
