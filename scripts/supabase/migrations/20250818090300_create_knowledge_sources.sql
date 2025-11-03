-- Knowledge sources registry for ingestion pipeline (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'knowledge_source_type') THEN
    CREATE TYPE public.knowledge_source_type AS ENUM ('pdf','csv','url','text');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id UUID NOT NULL REFERENCES public.demos(id) ON DELETE CASCADE,
  source_type public.knowledge_source_type NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS knowledge_sources_demo_idx
  ON public.knowledge_sources(demo_id);

-- RLS policies mirroring knowledge_chunks ownership by demo
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "knowledge_sources owner select" ON public.knowledge_sources;
CREATE POLICY "knowledge_sources owner select" ON public.knowledge_sources
  FOR SELECT USING ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid());
DROP POLICY IF EXISTS "knowledge_sources owner modify" ON public.knowledge_sources;
CREATE POLICY "knowledge_sources owner modify" ON public.knowledge_sources
  FOR ALL
  USING ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid())
  WITH CHECK ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid());
