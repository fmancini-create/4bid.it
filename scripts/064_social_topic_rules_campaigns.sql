-- 064_social_topic_rules_campaigns.sql
-- Trasforma social_topic_rules in vere "campagne" auto-generative.
-- Aggiunge colonne per cadenza, tracking esecuzioni, scheduling e RLS.

-- 1. Nuove colonne per il flow campagne
ALTER TABLE social_topic_rules
  ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS posts_generated_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Default sensati per i campi gia' esistenti su righe vecchie
UPDATE social_topic_rules SET frequency_days = 3 WHERE frequency_days IS NULL OR frequency_days < 1;
UPDATE social_topic_rules SET batch_size = 1 WHERE batch_size IS NULL OR batch_size < 1;
UPDATE social_topic_rules SET tone = 'professional' WHERE tone IS NULL;
UPDATE social_topic_rules
  SET time_windows = '[{"hour":9,"minute":30},{"hour":15,"minute":0}]'::jsonb
  WHERE time_windows IS NULL;
UPDATE social_topic_rules
  SET platforms = ARRAY['facebook','linkedin']::text[]
  WHERE platforms IS NULL OR array_length(platforms, 1) IS NULL;

-- 3. Indici per il cron
CREATE INDEX IF NOT EXISTS idx_social_topic_rules_active
  ON social_topic_rules(is_active, last_generated_at);
CREATE INDEX IF NOT EXISTS idx_social_topic_rules_start_date
  ON social_topic_rules(start_date);

-- 4. RLS: la tabella ha RLS attivo ma 0 policy.
--    Aggiungiamo policy admin e service_role.
ALTER TABLE social_topic_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access social_topic_rules" ON social_topic_rules;
CREATE POLICY "Admin full access social_topic_rules"
  ON social_topic_rules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access social_topic_rules" ON social_topic_rules;
CREATE POLICY "Service role full access social_topic_rules"
  ON social_topic_rules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Aggiungiamo "campaign_rule_id" su social_posts per tracciare l'origine
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS campaign_rule_id UUID REFERENCES social_topic_rules(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_social_posts_campaign_rule
  ON social_posts(campaign_rule_id) WHERE campaign_rule_id IS NOT NULL;

COMMENT ON COLUMN social_topic_rules.last_generated_at IS 'Ultima volta che il cron ha generato un post per questa campagna';
COMMENT ON COLUMN social_topic_rules.frequency_days IS 'Cadenza in giorni tra una generazione e la successiva';
COMMENT ON COLUMN social_topic_rules.time_windows IS 'Array JSON di slot orari preferiti, es. [{"hour":9,"minute":30}]';
COMMENT ON COLUMN social_topic_rules.batch_size IS 'Quanti post generare per ogni esecuzione (default 1)';
COMMENT ON COLUMN social_topic_rules.exclude_weekdays IS 'Giorni della settimana da escludere (0=domenica, 6=sabato)';
COMMENT ON COLUMN social_topic_rules.start_date IS 'Data minima a partire dalla quale il cron puo&apos; generare';
COMMENT ON COLUMN social_topic_rules.end_date IS 'Data oltre la quale la campagna si disattiva (NULL = nessuna scadenza)';
COMMENT ON COLUMN social_topic_rules.image_style_prompt IS 'Stile aggiuntivo per la generazione immagine (vuoto = nessuna immagine)';
