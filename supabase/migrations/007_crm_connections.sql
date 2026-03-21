-- CRM connections table for OAuth tokens
CREATE TABLE IF NOT EXISTS public.crm_connections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) NOT NULL,
  provider    text NOT NULL DEFAULT 'salesforce',
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  instance_url text NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_crm_connections_user_id ON crm_connections(user_id);

ALTER TABLE crm_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own data" ON crm_connections FOR ALL USING (auth.uid() = user_id);
