-- Create knowledge_base table for dynamic AI information
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL, -- 'website', 'admin', 'chat', 'external'
    source_url TEXT, -- URL where info was scraped from
    category TEXT NOT NULL, -- 'company', 'project', 'service', 'faq', 'technical'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    keywords TEXT[], -- Array of keywords for search
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Higher priority = more important
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT -- admin email who created/approved
);

-- Create external_sites table for sites to crawl
CREATE TABLE IF NOT EXISTS public.external_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    base_url TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    crawl_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
    last_crawled_at TIMESTAMP WITH TIME ZONE,
    pages_crawled INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crawl_logs table for tracking scraping
CREATE TABLE IF NOT EXISTS public.crawl_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES public.external_sites(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'failed', 'skipped'
    pages_found INTEGER DEFAULT 0,
    knowledge_items_added INTEGER DEFAULT 0,
    error_message TEXT,
    crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_source ON public.knowledge_base(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_is_active ON public.knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_keywords ON public.knowledge_base USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_updated_at ON public.knowledge_base(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_sites_is_active ON public.external_sites(is_active);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_base
CREATE POLICY "Public can read active knowledge"
ON public.knowledge_base
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin full access knowledge"
ON public.knowledge_base
FOR ALL
TO authenticated
USING (auth.jwt()->>'email' = 'f.mancini@4bid.it')
WITH CHECK (auth.jwt()->>'email' = 'f.mancini@4bid.it');

-- RLS Policies for external_sites
CREATE POLICY "Public can read active sites"
ON public.external_sites
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin full access sites"
ON public.external_sites
FOR ALL
TO authenticated
USING (auth.jwt()->>'email' = 'f.mancini@4bid.it')
WITH CHECK (auth.jwt()->>'email' = 'f.mancini@4bid.it');

-- RLS Policies for crawl_logs
CREATE POLICY "Admin can view crawl logs"
ON public.crawl_logs
FOR SELECT
TO authenticated
USING (auth.jwt()->>'email' = 'f.mancini@4bid.it');

CREATE POLICY "Admin can insert crawl logs"
ON public.crawl_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.jwt()->>'email' = 'f.mancini@4bid.it');

-- Insert initial external sites
INSERT INTO public.external_sites (name, base_url, description, crawl_frequency) VALUES
('SantAddeo', 'https://santaddeo.it', 'Software Revenue Management per Hotel', 'weekly'),
('Autoexel', 'https://autoexel.it', 'Sistema di automazione Excel', 'weekly'),
('Manubot', 'https://manubot.it', 'Bot per gestione manutenzione', 'weekly'),
('MyPetSenseAI', 'https://mypetsenseai.com', 'AI per pet care', 'weekly'),
('Risparmio Compulsivo', 'https://risparmiocompulsivo.it', 'App gestione risparmi', 'weekly'),
('HotelProfitAI', 'https://hotelprofitai.com', 'AI per ottimizzazione profitti hotel', 'weekly'),
('ZeRoBuGaI', 'https://zerobugai.com', 'AI per debugging e testing', 'weekly')
ON CONFLICT (base_url) DO NOTHING;

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_knowledge_base_updated_at ON public.knowledge_base;
CREATE TRIGGER trigger_knowledge_base_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW
EXECUTE FUNCTION update_knowledge_base_updated_at();
