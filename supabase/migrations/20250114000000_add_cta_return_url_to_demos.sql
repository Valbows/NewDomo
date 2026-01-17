-- Add return URL field for post-conversation redirect
ALTER TABLE public.demos
  ADD COLUMN IF NOT EXISTS cta_return_url TEXT;

COMMENT ON COLUMN public.demos.cta_return_url IS 'URL to redirect users back to after conversation ends (customer website)';
