-- Create social_topic_rules table for topic-driven social media automation
CREATE TABLE IF NOT EXISTS social_topic_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  topic_name text UNIQUE NOT NULL,
  batch_size int DEFAULT 15,
  frequency_days int DEFAULT 3,
  time_windows jsonb DEFAULT '[{"start":"09:30","end":"11:30"},{"start":"15:00","end":"18:00"}]',
  exclude_weekdays int[] DEFAULT '{0}',  -- 0=Sun
  platforms text[] DEFAULT '{facebook,linkedin}',
  target_accounts text[] DEFAULT '{}',
  tone text DEFAULT 'professional',
  include_hashtags boolean DEFAULT true,
  default_hashtags text[] DEFAULT '{}',
  link_url text,
  image_style_prompt text,
  min_queue_pending int DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS - NO permissive policies.
-- All access is via service_role (createAdminClient) which bypasses RLS.
-- anon/authenticated roles get zero access by default.
ALTER TABLE social_topic_rules ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_social_topic_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS social_topic_rules_updated_at ON social_topic_rules;
CREATE TRIGGER social_topic_rules_updated_at
  BEFORE UPDATE ON social_topic_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_social_topic_rules_updated_at();
