-- Add per-demo CTA fields to demos table (idempotent)
ALTER TABLE public.demos
  ADD COLUMN IF NOT EXISTS cta_title TEXT,
  ADD COLUMN IF NOT EXISTS cta_message TEXT,
  ADD COLUMN IF NOT EXISTS cta_button_text TEXT,
  ADD COLUMN IF NOT EXISTS cta_button_url TEXT;

COMMENT ON COLUMN public.demos.cta_title IS 'Per-demo CTA title';
COMMENT ON COLUMN public.demos.cta_message IS 'Per-demo CTA message/body';
COMMENT ON COLUMN public.demos.cta_button_text IS 'Per-demo CTA button label';
COMMENT ON COLUMN public.demos.cta_button_url IS 'Per-demo CTA button URL';
