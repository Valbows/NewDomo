-- HubSpot CRM Integration Tables
-- Migration: 20260202000000_add_hubspot_integration

-- =============================================================================
-- Table: demo_integrations
-- Per-demo integration configuration (for future per-demo HubSpot settings)
-- =============================================================================

CREATE TABLE IF NOT EXISTS demo_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id UUID NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL, -- 'hubspot', 'salesforce', etc.
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}', -- Integration-specific config (e.g., custom field mappings)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each demo can only have one config per integration type
  UNIQUE(demo_id, integration_type)
);

-- Index for quick lookup by demo
CREATE INDEX IF NOT EXISTS idx_demo_integrations_demo_id
  ON demo_integrations(demo_id);

-- Index for filtering by integration type
CREATE INDEX IF NOT EXISTS idx_demo_integrations_type
  ON demo_integrations(integration_type);

-- =============================================================================
-- Table: hubspot_sync_log
-- Track all HubSpot sync attempts for debugging and retry purposes
-- =============================================================================

CREATE TABLE IF NOT EXISTS hubspot_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id UUID REFERENCES demos(id) ON DELETE SET NULL,
  conversation_id TEXT,
  email TEXT NOT NULL,
  hubspot_contact_id TEXT, -- HubSpot's contact ID (if sync succeeded)
  action TEXT NOT NULL, -- 'created', 'updated', 'skipped', 'failed'
  success BOOLEAN NOT NULL,
  error_message TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional metadata for debugging
  request_payload JSONB, -- Optional: store what was sent
  response_payload JSONB -- Optional: store what was received
);

-- Index for finding sync history by demo
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_demo_id
  ON hubspot_sync_log(demo_id);

-- Index for finding sync history by conversation
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_conversation_id
  ON hubspot_sync_log(conversation_id);

-- Index for finding sync history by email
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_email
  ON hubspot_sync_log(email);

-- Index for finding failed syncs (for retry logic)
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_failed
  ON hubspot_sync_log(success, synced_at)
  WHERE success = false;

-- =============================================================================
-- RLS Policies
-- =============================================================================

-- Enable RLS on both tables
ALTER TABLE demo_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubspot_sync_log ENABLE ROW LEVEL SECURITY;

-- demo_integrations: Users can only see integrations for their own demos
CREATE POLICY demo_integrations_select_policy ON demo_integrations
  FOR SELECT
  USING (
    demo_id IN (
      SELECT id FROM demos WHERE user_id = auth.uid()
    )
  );

CREATE POLICY demo_integrations_insert_policy ON demo_integrations
  FOR INSERT
  WITH CHECK (
    demo_id IN (
      SELECT id FROM demos WHERE user_id = auth.uid()
    )
  );

CREATE POLICY demo_integrations_update_policy ON demo_integrations
  FOR UPDATE
  USING (
    demo_id IN (
      SELECT id FROM demos WHERE user_id = auth.uid()
    )
  );

CREATE POLICY demo_integrations_delete_policy ON demo_integrations
  FOR DELETE
  USING (
    demo_id IN (
      SELECT id FROM demos WHERE user_id = auth.uid()
    )
  );

-- hubspot_sync_log: Users can only see sync logs for their own demos
CREATE POLICY hubspot_sync_log_select_policy ON hubspot_sync_log
  FOR SELECT
  USING (
    demo_id IS NULL OR demo_id IN (
      SELECT id FROM demos WHERE user_id = auth.uid()
    )
  );

-- Only service role can insert sync logs (from webhook handlers)
CREATE POLICY hubspot_sync_log_insert_policy ON hubspot_sync_log
  FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- Triggers
-- =============================================================================

-- Auto-update updated_at for demo_integrations
CREATE OR REPLACE FUNCTION update_demo_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER demo_integrations_updated_at
  BEFORE UPDATE ON demo_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_demo_integrations_updated_at();
