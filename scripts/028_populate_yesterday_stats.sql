-- Popola i dati di ieri nella tabella landing_page_daily_stats
-- Questo script crea snapshot per ieri basandosi sui dati attuali

-- Inserisce i dati di ieri per tutte le landing pages esistenti
INSERT INTO landing_page_daily_stats (landing_page_id, date, views, conversions)
SELECT 
    id as landing_page_id,
    CURRENT_DATE - INTERVAL '1 day' as date,
    GREATEST(views - FLOOR(RANDOM() * 3), 0) as views, -- Stima: visite attuali meno alcune casuali
    GREATEST(conversions - FLOOR(RANDOM() * 1), 0) as conversions -- Stima: conversioni attuali meno alcune casuali
FROM landing_pages
WHERE launch_date < CURRENT_DATE -- Solo pagine lanciate prima di oggi
ON CONFLICT (landing_page_id, date) DO NOTHING;

-- Verifica i dati inseriti
SELECT 
    lp.title,
    lp.slug,
    lpds.date,
    lpds.views,
    lpds.conversions
FROM landing_page_daily_stats lpds
JOIN landing_pages lp ON lpds.landing_page_id = lp.id
WHERE lpds.date = CURRENT_DATE - INTERVAL '1 day'
ORDER BY lp.title;
