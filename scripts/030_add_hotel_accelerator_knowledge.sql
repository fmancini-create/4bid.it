-- Add Hotel Accelerator knowledge to AI chat
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES 
(
  'Hotel Accelerator - Progetto in Sviluppo',
  'Hotel Accelerator è una piattaforma completa sviluppata da 4BID per accelerare le performance degli hotel. Combina analytics avanzata, strategie di revenue management e consulenza integrata. Il progetto è attualmente al 70% di completamento. Funzionalità principali: Dashboard analytics in tempo reale con KPI e trend, Revenue optimization con pricing dinamico, Consulenza on-demand con revenue manager esperti, Benchmark competitivo con il mercato locale. Modelli di pricing: Starter €149/mese (analytics base), Professional €349/mese (analytics avanzata + consulenza), Enterprise custom (revenue manager dedicato). Target: hotel indipendenti e piccole catene in Italia. Sito web: hotelaccelerator.com',
  'progetti',
  'https://hotelaccelerator.com',
  'hotel accelerator, performance hotel, analytics, revenue management, consulenza alberghiera, pricing dinamico',
  9,
  true
),
(
  'MANUBOT - Stato Aggiornato',
  'MANUBOT è al 90% di completamento. È un sistema smart di gestione manutenzioni che usa WhatsApp e Telegram. Funzionalità completate: Bot Telegram/WhatsApp funzionante, Database operativo, Sistema ticket completo, Dashboard reportistica avanzata. In corso: Testing finale e ottimizzazioni. Prezzo: abbonamento €39-€299/mese. Target: hotel, strutture ricettive, aziende, condomini.',
  'progetti',
  'https://4bid.it/progetti/manubot',
  'manubot, gestione manutenzioni, whatsapp, telegram, facility management',
  9,
  true
),
(
  'SANTADDEO - Stato Aggiornato',
  'SANTADDEO è al 75% di completamento. È il primo sistema di Revenue Management Intelligente e Umano che spiega le proprie decisioni. Funzionalità completate: Architettura definita, Logica di pricing completata, Dashboard AI in sviluppo avanzato. In corso: Integrazione PMS/OTA. Modello business: SaaS €99-€499/mese oppure percentuale sui risultati (zero rischio). Target: hotel e strutture ricettive che vogliono un RMS trasparente e configurabile.',
  'progetti',
  'https://4bid.it/progetti/santaddeo',
  'santaddeo, revenue management, AI, pricing intelligente, RMS',
  9,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  updated_at = NOW();
