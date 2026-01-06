-- Fix: salva le visite GIORNALIERE, non cumulative
-- La funzione calcola la differenza tra il totale attuale e il totale dello snapshot precedente

CREATE OR REPLACE FUNCTION save_daily_snapshot()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  yesterday_date date := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Per ogni landing page, calcola le visite giornaliere come differenza
  INSERT INTO landing_page_daily_stats (landing_page_id, date, views, conversions)
  SELECT 
    lp.id,
    yesterday_date,
    -- Visite di ieri = totale attuale - totale di 2 giorni fa (o 0 se non esiste)
    GREATEST(0, COALESCE(lp.views, 0) - COALESCE(prev_stats.cumulative_views, 0)),
    -- Conversioni di ieri = totale attuale - totale di 2 giorni fa (o 0 se non esiste)
    GREATEST(0, COALESCE(lp.conversions, 0) - COALESCE(prev_stats.cumulative_conversions, 0))
  FROM landing_pages lp
  LEFT JOIN LATERAL (
    -- Prendi il totale cumulativo salvato 2 giorni fa (per calcolare la differenza di ieri)
    SELECT 
      SUM(views) as cumulative_views,
      SUM(conversions) as cumulative_conversions
    FROM landing_page_daily_stats lpds
    WHERE lpds.landing_page_id = lp.id
    AND lpds.date < yesterday_date
  ) prev_stats ON true
  ON CONFLICT (landing_page_id, date)
  DO UPDATE SET 
    views = EXCLUDED.views, 
    conversions = EXCLUDED.conversions;
    
  -- Log per debug
  RAISE NOTICE 'Daily snapshot saved for date: %', yesterday_date;
END;
$$;

-- Aggiorna anche i dati esistenti: resetta a 0 i valori gonfiati
-- (opzionale - da eseguire manualmente se i dati sono sbagliati)
-- UPDATE landing_page_daily_stats SET views = 0, conversions = 0 WHERE views > 100;
