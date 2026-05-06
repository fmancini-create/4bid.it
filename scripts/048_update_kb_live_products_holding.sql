-- =====================================================
-- 4BID - AGGIORNAMENTO KNOWLEDGE BASE (Maggio 2026)
-- - Aggiunge HOTELPROFIT AI (nuovo, online)
-- - Aggiunge 4BID ECOMOBILITY (mancava la scheda dedicata)
-- - Aggiorna SANTADDEO -> ONLINE (santaddeo.com)
-- - Aggiorna MANUBOT -> ONLINE (manubot.it)
-- - Aggiorna AUTOEXEL e MYPETSENSEAI in "Altri progetti"
-- - Aggiorna scheda azienda 4BID -> Holding suite HORECA
-- =====================================================

-- 1) Disattiva la vecchia scheda generale obsoleta (se presente)
UPDATE knowledge_base
SET is_active = false, updated_at = NOW()
WHERE title = '4BID - Siti Web e Piattaforme Online';

-- 2) Nuova scheda azienda 4BID (holding + suite turismo)
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  '4BID SRL - Holding di software e tool per il turismo',
  '4BID SRL e la holding italiana che sviluppa una suite completa di software, app e piattaforme per il settore HORECA (hotel, ristoranti, strutture ricettive), oltre a progetti verticali in altri settori.

POSIZIONAMENTO:
4BID e una Innovation Factory che funge da holding sotto cui crescono prodotti specializzati. Lo slogan e "L ecosistema 4BID": una suite per il mondo del turismo + altri progetti verticali.

SUITE HORECA (prodotti per il settore turismo):
1. SANTADDEO - Revenue Management AI - ONLINE su www.santaddeo.com
2. HOTELPROFIT AI - Controllo di gestione AI per hotel - ONLINE su www.hotelprofitai.com
3. MANUBOT - Gestione manutenzioni via WhatsApp/Telegram - ONLINE su www.manubot.it
4. HOTEL ACCELERATOR - Suite gestionale (CMS, CRM, Email) - In sviluppo (80%)
5. 4BID ECOMOBILITY - Noleggio mobilita elettrica per hotel - In sviluppo (85%)

ALTRI PROGETTI:
1. AUTOEXEL - Excel AI in linguaggio naturale - Online su www.autoexel.com
2. MYPETSENSEAI - Salute cani con AI - Online su www.mypetsenseai.com
3. RISPARMIO COMPULSIVO - Gamification del risparmio - In sviluppo (70%)

CONTATTI:
- Sito holding: www.4bid.it
- Email: info@4bid.it
- Sede: San Casciano in Val di Pesa (FI), Italia
- LinkedIn: https://www.linkedin.com/company/4bid-srl/
- Instagram: @4bid_revenue_guru

I 5 prodotti della Suite HORECA condividono filosofia e dati: revenue management, controllo di gestione, manutenzioni, marketing/CRM e mobilita per hotel.',
  'azienda',
  'https://4bid.it',
  ARRAY['4bid', '4bid srl', 'holding', 'suite horeca', 'santaddeo', 'hotelprofit ai', 'manubot', 'hotel accelerator', 'ecomobility', 'autoexel', 'mypetsenseai', 'risparmio compulsivo', 'innovation factory', 'turismo', 'hotel'],
  10,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  is_active = true,
  updated_at = NOW();

-- 3) HOTELPROFIT AI (NUOVO PRODOTTO)
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  'HOTELPROFIT AI - Controllo di gestione AI per hotel',
  'HOTELPROFIT AI e la piattaforma di controllo di gestione e analisi finanziaria potenziata dall AI per hotel e strutture ricettive.

STATO: ONLINE e operativo
SITO WEB: www.hotelprofitai.com
PARTE DELLA: Suite HORECA di 4BID SRL

COSA FA:
- Analisi automatica di P&L, CoGS, costi del personale, margini per centro di ricavo
- Forecast e budgeting dinamico basato su storico e previsioni
- Dashboard KPI real-time per direttori e proprietari (RevPAR, GOPPAR, Total Revenue, ALOS)
- Integrazione con PMS, gestionali contabili, sistemi POS F&B
- Alert automatici su scostamenti budget vs actual
- Suggerimenti AI per ottimizzare profittabilita per area (camere, F&B, SPA, etc.)

DIFFERENZIATORI:
- Controllo di gestione DEDICATO al settore hospitality (USALI compliant)
- Integrazione nativa con i flussi operativi dell hotel
- AI che spiega le performance e suggerisce azioni concrete
- Multi-property: gestione gruppi alberghieri

TARGET: Hotel indipendenti, gruppi alberghieri, asset manager, CFO hospitality

INTEGRAZIONI: PMS principali, software contabili italiani, POS F&B, channel manager',
  'progetti',
  'https://hotelprofitai.com',
  ARRAY['hotelprofit ai', 'hotelprofitai', 'controllo di gestione hotel', 'analisi finanziaria hotel', 'budgeting hotel', 'forecast hotel', 'kpi hotel', 'revpar', 'goppar', 'p&l hotel', 'usali', 'cfo hospitality', 'asset manager hotel'],
  10,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  is_active = true,
  updated_at = NOW();

-- 4) SANTADDEO (aggiornata: ora ONLINE)
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  'SANTADDEO - The Human Revenue Manager',
  'SANTADDEO e il primo sistema di Revenue Management Intelligente e Umano per hotel, che spiega le proprie decisioni di pricing e si adatta ad ogni struttura.

STATO: ONLINE e operativo
SITO WEB: www.santaddeo.com
PARTE DELLA: Suite HORECA di 4BID SRL

COSA FA:
- Pricing dinamico AI in tempo reale per ogni tipologia di camera
- Algoritmi che spiegano IL PERCHE di ogni suggerimento (no black box)
- Si adatta alle regole di business della struttura (segmenti, canali, mercati)
- Integrazione PMS e channel manager
- Dashboard intuitiva per revenue manager
- Forecast occupancy + ricavi
- Confronto con competitor set in tempo reale
- Alert su anomalie e opportunita di pricing

DIFFERENZIATORI:
- Trasparenza algoritmica: ogni decisione e motivata
- Configurabilita totale: ogni hotel ha le sue regole
- "Human in the loop": il revenue manager resta al centro
- Funziona dal boutique al gruppo alberghiero

BUSINESS MODEL:
- SaaS: piani da 99 a 499 euro/mese
- Performance pricing: percentuale sui risultati (zero rischio per l hotel)

TARGET: Hotel indipendenti, boutique hotel, gruppi alberghieri, revenue manager',
  'progetti',
  'https://santaddeo.com',
  ARRAY['santaddeo', 'revenue management', 'pricing dinamico', 'rms hotel', 'ai revenue', 'revenue manager', 'pricing hotel', 'forecast hotel', 'occupancy', 'channel manager'],
  10,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  is_active = true,
  updated_at = NOW();

-- 5) MANUBOT (aggiornata: ora ONLINE)
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  'MANUBOT - Sistema Smart di Gestione Manutenzioni',
  'MANUBOT e il sistema universale di gestione e automazione delle manutenzioni che parla la lingua di tutti: WhatsApp e Telegram.

STATO: ONLINE e operativo
SITO WEB: www.manubot.it
PARTE DELLA: Suite HORECA di 4BID SRL

CARATTERISTICHE PRINCIPALI:
- Bot Telegram e WhatsApp completamente operativi
- Database multi-organizzazione e multi-struttura
- Sistema ticket completo con escalation automatica
- Dashboard reportistica avanzata per manager
- Foto, firme digitali, storico completo

VANTAGGI:
- Zero app da installare: usa solo WhatsApp o Telegram
- Dashboard web completa per i manager
- Tracciabilita totale con foto, firme e timestamp
- Categorie e priorita personalizzabili
- Notifiche in tempo reale ai gruppi di intervento

MODULI:
- Manubot Core: gestione segnalazioni e interventi
- ReClean: pulizie e housekeeping
- Planner: pianificazione manutenzioni preventive
- IoT (in roadmap): integrazione sensori smart

BUSINESS MODEL:
- Abbonamento base: 39-299 euro/mese in funzione di strutture e moduli
- White Label per gruppi e catene

TARGET: Hotel, strutture ricettive, ristoranti, condomini, facility management, aziende multi-sede',
  'progetti',
  'https://manubot.it',
  ARRAY['manubot', 'gestione manutenzioni', 'whatsapp bot', 'telegram bot', 'facility management', 'housekeeping', 'ticket manutenzione', 'iot hotel', 'reclean', 'planner manutenzioni'],
  10,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  is_active = true,
  updated_at = NOW();

-- 6) HOTEL ACCELERATOR (aggiornato: 80%, in sviluppo)
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  'HOTEL ACCELERATOR - Piattaforma Gestionale Completa per Hotel',
  'HOTEL ACCELERATOR e la piattaforma SaaS che unifica CMS, CRM, Email Marketing, Inbox Omnicanale e AI in una sola soluzione per strutture ricettive.

STATO: in sviluppo (80% completato)
SITO WEB: www.hotelaccelerator.com
PARTE DELLA: Suite HORECA di 4BID SRL

RISULTATI ATTESI:
- +35% prenotazioni dirette
- -50% tempo di risposta agli ospiti
- 2x engagement sulle email post-soggiorno
- 150+ hotel gia in fase pilota

FUNZIONALITA PRINCIPALI:
1. CMS per Hotel: sito web professionale, multilingua, mobile-first, SEO ottimizzato
2. CRM Alberghiero: gestione contatti, segmentazione, +45% retention
3. Email Marketing: campagne automatizzate pre/post soggiorno, A/B testing
4. Inbox Omnicanale: email, WhatsApp, Telegram e chat in un unica inbox
5. AI Assistant: risposte automatiche 24/7, suggerimenti personalizzati

PRICING:
- Starter: funzionalita base
- Professional: analytics avanzata + consulenza
- Enterprise: custom

TARGET: Hotel indipendenti, piccole catene italiane, marketing manager hospitality',
  'progetti',
  'https://hotelaccelerator.com',
  ARRAY['hotel accelerator', 'cms hotel', 'crm alberghiero', 'email marketing hotel', 'inbox omnicanale', 'ai hotel', 'prenotazioni dirette', 'whatsapp hotel', 'marketing hotel'],
  10,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  is_active = true,
  updated_at = NOW();

-- 7) 4BID ECOMOBILITY (NUOVA scheda dedicata)
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  '4BID ECOMOBILITY - Mobilita elettrica per hotel',
  '4BID ECOMOBILITY e la piattaforma turnkey che permette agli hotel di offrire ai propri ospiti il noleggio di veicoli elettrici (e-bike, monopattini, e-car, scooter) come servizio aggiuntivo brandizzato.

STATO: in sviluppo (85% completato)
PARTE DELLA: Suite HORECA di 4BID SRL

COSA FA:
- Self-service di noleggio veicoli elettrici dai totem in hotel
- Gestione flotta in tempo reale (batteria, posizione GPS, manutenzione)
- Pagamenti automatici via Stripe (deposito + uso effettivo)
- Self-checkout con foto pre/post noleggio e analisi AI dei danni
- Multi-struttura: dashboard centralizzata per gruppi alberghieri
- Tracciabilita totale via dispositivi IoT installati sui mezzi
- Notifiche automatiche per inizio/fine noleggio e anomalie

CONFIGURAZIONI:
- Noleggio gestito dall hotel (revenue per la struttura)
- Modello white-label con flotta 4BID
- Subscription SaaS o revenue share

TARGET: Hotel, resort, agriturismi, catene che vogliono offrire servizi green agli ospiti',
  'progetti',
  'https://4bid.it/progetti/ecomobility',
  ARRAY['ecomobility', '4bid ecomobility', 'mobilita elettrica hotel', 'noleggio ebike hotel', 'monopattini hotel', 'ev rental hotel', 'turismo green', 'sostenibilita hotel', 'ancillary revenue'],
  10,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  is_active = true,
  updated_at = NOW();

-- 8) AUTOEXEL (riconfermato: ALTRI PROGETTI, online)
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  'AUTOEXEL - Il primo Excel per chi non sa usare Excel',
  'AUTOEXEL e il primo Excel per chi non sa usare Excel. Una piattaforma AI che permette di analizzare dati e creare fogli di calcolo usando il linguaggio naturale.

STATO: ONLINE e operativo
SITO WEB: www.autoexel.com
PARTE DI: "Altri progetti" 4BID (verticali extra-turismo)

FUNZIONALITA:
- Carica file Excel o CSV per analisi automatiche
- Genera KPI e grafici automaticamente
- Crea fogli intelligenti con comandi in linguaggio naturale
- Nessuna formula da scrivere
- Esporta in Excel/CSV

CASI D USO: analisi vendite, report finanziari, marketing analytics, gestione inventario, dashboard

TARGET: professionisti, PMI, chiunque lavori con dati senza essere esperto Excel',
  'progetti',
  'https://autoexel.com',
  ARRAY['autoexel', 'excel ai', 'csv ai', 'analisi dati', 'kpi automatici', 'spreadsheet ai', 'linguaggio naturale', 'pmi', 'business intelligence'],
  9,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  is_active = true,
  updated_at = NOW();

-- 9) MYPETSENSEAI (riconfermato: ALTRI PROGETTI, online)
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  'MYPETSENSEAI - AI Health Monitoring for Dogs',
  'MYPETSENSEAI e la piattaforma AI per il monitoraggio della salute dei cani.

STATO: ONLINE e operativo
SITO WEB: www.mypetsenseai.com
PARTE DI: "Altri progetti" 4BID (verticali extra-turismo)

STATISTICHE: 10.000+ analisi completate, 4.9/5 valutazione utenti, 2.500+ utenti attivi

FUNZIONALITA:
- Analisi AI da foto (corpo, occhi, orecchie, pelle, feci) con feedback dettagliato
- Diario salute (peso, umore, energia, sintomi)
- Piani dieta personalizzati AI
- Report PDF professionali per veterinari
- Multi-cane, condivisione con vet, video consulti

PIANI:
- Free: analisi base e diario
- Premium: analisi illimitate, dieta AI, report PDF, multi-cane
- Vet: piano professionale per veterinari

TARGET: proprietari cani, veterinari',
  'progetti',
  'https://mypetsenseai.com',
  ARRAY['mypetsenseai', 'salute cane', 'ai veterinaria', 'pet health', 'monitoraggio cani', 'app cani', 'veterinari', 'dieta cane'],
  9,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  is_active = true,
  updated_at = NOW();

-- 10) RISPARMIO COMPULSIVO (riconfermato: ALTRI PROGETTI, in sviluppo)
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  'RISPARMIO COMPULSIVO - Save. Play. Win.',
  'RISPARMIO COMPULSIVO e l app che trasforma il risparmio personale in un gioco motivante e automatico.

STATO: in sviluppo (70% completato)
PARTE DI: "Altri progetti" 4BID (verticali extra-turismo)

CONCEPT:
- Gamification del risparmio
- Sfide e obiettivi personalizzati
- Reward, badge, classifiche
- Risparmio automatico basato su regole

FUNZIONALITA:
- Obiettivi personalizzati
- Sfide settimanali e mensili
- Classifiche community
- Integrazione conti bancari (PSD2)

BUSINESS MODEL: freemium + partnership istituti finanziari

TARGET: Millennials e Gen Z',
  'progetti',
  'https://4bid.it/progetti/risparmio-compulsivo',
  ARRAY['risparmio compulsivo', 'app risparmio', 'gamification', 'fintech', 'saving app', 'money management', 'psd2'],
  9,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  is_active = true,
  updated_at = NOW();

-- =====================================================
-- VERIFICA FINALE
-- =====================================================
SELECT title, category,
       CASE WHEN length(content) > 100 THEN substring(content, 1, 100) || '...' ELSE content END AS content_preview,
       priority,
       is_active,
       updated_at
FROM knowledge_base
WHERE is_active = true
ORDER BY priority DESC, title;
