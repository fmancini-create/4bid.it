-- Tabella per gli account social collegati
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin')),
  account_name TEXT NOT NULL,
  account_id TEXT, -- ID dell'account sulla piattaforma
  access_token TEXT, -- Token criptato
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  page_id TEXT, -- Per Facebook/Instagram Page
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per i post social (generati da AI o manuali)
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  image_url TEXT,
  post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'link', 'carousel')),
  link_url TEXT,
  hashtags TEXT[],
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed')),
  
  -- AI generation
  is_ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  ai_topic TEXT,
  
  -- Publishing
  platforms TEXT[] DEFAULT '{}', -- ['facebook', 'instagram', 'linkedin']
  platform_post_ids JSONB DEFAULT '{}', -- { "facebook": "123", "linkedin": "456" }
  
  -- Auto-publish settings
  auto_publish BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per le impostazioni social
CREATE TABLE IF NOT EXISTS social_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_frequency_days INTEGER DEFAULT 2,
  auto_generate_enabled BOOLEAN DEFAULT true,
  topics TEXT[] DEFAULT ARRAY['revenue management', 'hotel technology', 'hospitality trends', 'progetti 4bid'],
  tone TEXT DEFAULT 'professional', -- professional, casual, inspirational
  include_hashtags BOOLEAN DEFAULT true,
  default_hashtags TEXT[] DEFAULT ARRAY['#4BID', '#RevenueManagement', '#Hospitality', '#HotelTech'],
  last_auto_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserisci impostazioni di default
INSERT INTO social_settings (id, posting_frequency_days, auto_generate_enabled)
VALUES (gen_random_uuid(), 2, true)
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_settings ENABLE ROW LEVEL SECURITY;

-- Solo admin autenticati possono accedere
CREATE POLICY "Admin full access social_accounts" ON social_accounts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access social_posts" ON social_posts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access social_settings" ON social_settings FOR ALL USING (auth.role() = 'authenticated');

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_social_posts_platforms ON social_posts USING GIN(platforms);
