-- N8.chat Supabase Schema
-- Run this in your Supabase SQL Editor

-- Table: OAuth states for CSRF protection
CREATE TABLE IF NOT EXISTS n8n_chat_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT NOT NULL UNIQUE,
  nonce TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-cleanup old OAuth states (older than 10 minutes)
CREATE INDEX IF NOT EXISTS idx_oauth_states_created_at ON n8n_chat_oauth_states(created_at);

-- Table: App installations
CREATE TABLE IF NOT EXISTS n8n_chat_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT NOT NULL UNIQUE,
  access_token TEXT,
  scope TEXT,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uninstalled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active installations
CREATE INDEX IF NOT EXISTS idx_installations_active ON n8n_chat_installations(shop)
  WHERE uninstalled_at IS NULL;

-- Table: GDPR request log (for audit purposes)
CREATE TABLE IF NOT EXISTS n8n_chat_gdpr_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT NOT NULL,
  request_type TEXT NOT NULL, -- 'customers_data_request', 'customers_redact', 'shop_redact'
  payload JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for GDPR log queries
CREATE INDEX IF NOT EXISTS idx_gdpr_log_shop ON n8n_chat_gdpr_log(shop);
CREATE INDEX IF NOT EXISTS idx_gdpr_log_type ON n8n_chat_gdpr_log(request_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for installations table
DROP TRIGGER IF EXISTS update_installations_updated_at ON n8n_chat_installations;
CREATE TRIGGER update_installations_updated_at
  BEFORE UPDATE ON n8n_chat_installations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup old OAuth states (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM n8n_chat_oauth_states
  WHERE created_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) - Enable for production
ALTER TABLE n8n_chat_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_chat_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_chat_gdpr_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access these tables
CREATE POLICY "Service role access only" ON n8n_chat_oauth_states
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access only" ON n8n_chat_installations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access only" ON n8n_chat_gdpr_log
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions to service role
GRANT ALL ON n8n_chat_oauth_states TO service_role;
GRANT ALL ON n8n_chat_installations TO service_role;
GRANT ALL ON n8n_chat_gdpr_log TO service_role;
