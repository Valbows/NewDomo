-- ============================================================================
-- MODULAR SUB-CONTEXT ARCHITECTURE
-- Migration: Add modules as first-class citizens
--
-- This migration introduces the module system that binds together:
-- - Objectives (what the agent tries to accomplish)
-- - Knowledge (documents, Q&A, transcripts)
-- - Videos (demo content)
-- - Session state (runtime tracking)
-- ============================================================================

-- 1. Create demo_modules table
-- Stores module definitions per demo, seeded from defaults on demo creation
CREATE TABLE IF NOT EXISTS public.demo_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_id UUID NOT NULL REFERENCES public.demos(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL,           -- 'intro', 'qualification', etc.
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    requires_video BOOLEAN DEFAULT FALSE,
    upload_guidance TEXT,              -- Help text for configure UI
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one module_id per demo
CREATE UNIQUE INDEX IF NOT EXISTS demo_modules_demo_id_module_id_idx
ON demo_modules (demo_id, module_id);

-- Index for ordering
CREATE INDEX IF NOT EXISTS demo_modules_demo_id_order_idx
ON demo_modules (demo_id, order_index);

-- Enable RLS
ALTER TABLE demo_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own demo's modules
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'demo_modules' AND policyname = 'Users can view their own demo modules'
    ) THEN
        CREATE POLICY "Users can view their own demo modules" ON demo_modules
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM demos WHERE demos.id = demo_modules.demo_id AND demos.user_id = auth.uid())
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'demo_modules' AND policyname = 'Users can insert modules for their own demos'
    ) THEN
        CREATE POLICY "Users can insert modules for their own demos" ON demo_modules
            FOR INSERT WITH CHECK (
                EXISTS (SELECT 1 FROM demos WHERE demos.id = demo_modules.demo_id AND demos.user_id = auth.uid())
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'demo_modules' AND policyname = 'Users can update their own demo modules'
    ) THEN
        CREATE POLICY "Users can update their own demo modules" ON demo_modules
            FOR UPDATE USING (
                EXISTS (SELECT 1 FROM demos WHERE demos.id = demo_modules.demo_id AND demos.user_id = auth.uid())
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'demo_modules' AND policyname = 'Users can delete their own demo modules'
    ) THEN
        CREATE POLICY "Users can delete their own demo modules" ON demo_modules
            FOR DELETE USING (
                EXISTS (SELECT 1 FROM demos WHERE demos.id = demo_modules.demo_id AND demos.user_id = auth.uid())
            );
    END IF;
END $$;

-- 2. Add module_id to demo_videos
ALTER TABLE demo_videos
    ADD COLUMN IF NOT EXISTS module_id TEXT;

-- Index for filtering videos by module
CREATE INDEX IF NOT EXISTS demo_videos_demo_id_module_id_idx
ON demo_videos (demo_id, module_id);

-- 3. Add module_id to knowledge_sources
ALTER TABLE knowledge_sources
    ADD COLUMN IF NOT EXISTS module_id TEXT;

CREATE INDEX IF NOT EXISTS knowledge_sources_demo_id_module_id_idx
ON knowledge_sources (demo_id, module_id);

-- 4. Add module_id to knowledge_chunks
ALTER TABLE knowledge_chunks
    ADD COLUMN IF NOT EXISTS module_id TEXT;

CREATE INDEX IF NOT EXISTS knowledge_chunks_demo_id_module_id_idx
ON knowledge_chunks (demo_id, module_id);

-- 5. Add module tracking to conversation_details
ALTER TABLE conversation_details
    ADD COLUMN IF NOT EXISTS current_module_id TEXT,
    ADD COLUMN IF NOT EXISTS module_state JSONB DEFAULT '{}'::jsonb;

-- Index for querying sessions by current module
CREATE INDEX IF NOT EXISTS conversation_details_current_module_idx
ON conversation_details (demo_id, current_module_id);

-- 6. Updated_at trigger for demo_modules
CREATE OR REPLACE FUNCTION update_demo_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_demo_modules_updated_at ON demo_modules;
CREATE TRIGGER trigger_update_demo_modules_updated_at
    BEFORE UPDATE ON demo_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_demo_modules_updated_at();

-- 7. Add comments for documentation
COMMENT ON TABLE demo_modules IS 'Stores module definitions per demo for sub-context architecture. Modules group objectives, videos, and knowledge content.';
COMMENT ON COLUMN demo_modules.module_id IS 'Standard module identifier: intro, qualification, overview, feature_deep_dive, pricing, cta';
COMMENT ON COLUMN demo_modules.upload_guidance IS 'Help text shown in the configure UI to guide content uploads for this module';
COMMENT ON COLUMN demo_videos.module_id IS 'Which module this video belongs to (intro, qualification, overview, etc.)';
COMMENT ON COLUMN knowledge_sources.module_id IS 'Which module this knowledge source belongs to. NULL means global/all modules.';
COMMENT ON COLUMN knowledge_chunks.module_id IS 'Which module this knowledge chunk belongs to. NULL means global/all modules.';
COMMENT ON COLUMN conversation_details.current_module_id IS 'Current module the conversation is in, updated as objectives complete.';
COMMENT ON COLUMN conversation_details.module_state IS 'JSON tracking completed modules, objectives, and module-specific data.';
