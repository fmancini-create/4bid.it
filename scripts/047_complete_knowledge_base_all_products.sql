-- =====================================================
-- 4BID - KNOWLEDGE BASE COMPLETA TUTTI I PRODOTTI E SITI
-- =====================================================

-- Aggiungi MYPETSENSEAI (mancante)
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  'MYPETSENSEAI - AI Health Monitoring for Dogs',
  'MYPETSENSEAI è la piattaforma AI per il monitoraggio della salute dei cani. 

STATO: Online e operativo
SITO WEB: www.mypetsenseai.com

STATISTICHE:
- 10,000+ analisi completate
- 4.9/5 valutazione utenti
- 2,500+ utenti attivi

FUNZIONALITA PRINCIPALI:

1. Analisi AI Avanzata
   - Carica foto di corpo, occhi, orecchie, pelle e feci
   - AI analizza e fornisce feedback dettagliato
   - Alert veterinari quando rileva potenziali problemi

2. Diario della Salute
   - Traccia peso, umore, energia, sintomi
   - Monitoraggio attività quotidiane
   - Storico completo del benessere

3. Piani Dieta Personalizzati
   - AI crea piani nutrizionali su misura
   - Basati su razza, età, peso e condizioni specifiche

4. Report PDF Professionali
   - Genera report completi da condividere con il veterinario
   - Diagnosi più accurate grazie ai dati raccolti

5. Multi-Cane
   - Gestisci profili separati per tutti i tuoi cani
   - Dati e analisi indipendenti per ciascuno

6. Connessione con Veterinari
   - Condividi profilo salute con il tuo veterinario
   - Trova specialisti nella rete verificata
   - Video consulti in tempo reale

BUSINESS MODEL:
- Piano Free: analisi base limitate, diario salute, 1 profilo cane
- Piano Premium: analisi illimitate, piani dieta AI, report PDF, multi-cane
- Piano Veterinari: abbonamento professionale con strumenti gestione clienti

TARGET: Proprietari di cani attenti alla salute, veterinari',
  'progetti',
  'https://mypetsenseai.com',
  'mypetsenseai, cani, salute cane, veterinario, ai, analisi foto, pet health, monitoraggio salute animali',
  10,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Aggiungi info sui SITI WEB ONLINE di 4BID
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  '4BID - Siti Web e Piattaforme Online',
  'Ecco tutti i siti web e le piattaforme online di 4BID:

SITI PRINCIPALI:
- www.4bid.it - Sito aziendale principale di 4BID Innovation Factory
- www.hotelaccelerator.com - Piattaforma gestionale per hotel (CMS, CRM, Email Marketing)
- www.mypetsenseai.com - Piattaforma AI per la salute dei cani
- www.autoexel.com - Excel intelligente con AI (linguaggio naturale)

PIATTAFORME IN SVILUPPO:
- SANTADDEO - Revenue Management System per hotel (75% completato)
- MANUBOT - Gestione manutenzioni via WhatsApp/Telegram (90% completato)
- RISPARMIO COMPULSIVO - App gamification risparmio (70% completato)
- ECOMOBILITY - Noleggio mobilità elettrica per hotel (85% completato)

CONTATTI:
- Email: info@4bid.it
- Sede: San Casciano in Val di Pesa (FI), Italia
- P.IVA: 07aborire076820484

4BID è una Innovation Factory italiana che sviluppa soluzioni tecnologiche innovative per il settore hospitality, fintech e pet care.',
  'azienda',
  'https://4bid.it',
  '4bid, siti web, piattaforme, hotel accelerator, mypetsenseai, autoexel, santaddeo, manubot, ecomobility',
  10,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Aggiorna AUTOEXEL con info complete
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  'AUTOEXEL - Il primo Excel per chi non sa usare Excel',
  'AUTOEXEL è il primo Excel per chi non sa usare Excel. Una piattaforma AI che permette di analizzare dati e creare fogli di calcolo usando il linguaggio naturale.

STATO: Online e operativo
SITO WEB: www.autoexel.com

FUNZIONALITA:
- Carica file Excel o CSV per ottenere analisi automatiche
- Genera KPI e grafici automaticamente
- Crea fogli intelligenti usando comandi in linguaggio naturale
- Nessuna formula da scrivere
- Interfaccia intuitiva e semplice
- Esporta risultati in Excel/CSV

CASI D USO:
- Analisi vendite e fatturato
- Report finanziari
- Analisi dati marketing
- Gestione inventario
- Dashboard personalizzate

TARGET: Professionisti, PMI, chiunque lavori con dati ma non conosca Excel avanzato',
  'progetti',
  'https://autoexel.com',
  'autoexel, excel, csv, analisi dati, kpi, grafici, linguaggio naturale, ai, spreadsheet',
  10,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Aggiorna HOTEL ACCELERATOR con info complete dal sito
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  'HOTEL ACCELERATOR - Piattaforma Gestionale Completa per Hotel',
  'HOTEL ACCELERATOR è una piattaforma SaaS per strutture ricettive che offre CMS, CRM, Email Marketing, Inbox Omnicanale e AI in un unica soluzione.

STATO: 70% completato
SITO WEB: www.hotelaccelerator.com

RISULTATI GARANTITI:
- +35% Prenotazioni dirette
- -50% Tempo di risposta
- 2x Engagement email
- 150+ Hotel soddisfatti

FUNZIONALITA PRINCIPALI:

1. CMS per Hotel
   - Sito web professionale con SEO ottimizzato
   - Multilingua, mobile-first, veloce
   - +300% visibilità organica

2. CRM Alberghiero
   - Gestione contatti centralizzata
   - Segmentazione avanzata
   - +45% retention ospiti

3. Email Marketing
   - Campagne automatizzate pre e post soggiorno
   - Template professionali, A/B testing
   - 2x engagement rate

4. Inbox Omnicanale
   - Email, WhatsApp, Telegram, Chat in unica inbox
   - -50% tempo risposta

5. AI Assistant
   - Risposte automatiche 24/7
   - Suggerimenti personalizzati

PRICING:
- Starter: funzionalità base
- Professional: analytics avanzata + consulenza
- Enterprise: custom

TARGET: Hotel indipendenti e piccole catene in Italia',
  'progetti',
  'https://hotelaccelerator.com',
  'hotel accelerator, software gestionale hotel, cms hotel, crm alberghiero, email marketing hotel, inbox omnicanale, ai hotel, prenotazioni dirette',
  10,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Verifica prodotti esistenti - aggiorna MANUBOT
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  'MANUBOT - Sistema Smart di Gestione Manutenzioni',
  'MANUBOT è un sistema universale di gestione e automazione delle manutenzioni che parla la lingua di tutti: WhatsApp e Telegram.

STATO: 90% completato

CARATTERISTICHE PRINCIPALI:
- Bot Telegram/WhatsApp funzionante
- Database operativo
- Sistema ticket completo
- Dashboard reportistica avanzata
- In fase di testing finale

VANTAGGI:
- Zero app da installare - usa solo WhatsApp o Telegram
- Dashboard completa per manager con statistiche
- Totale tracciabilità con foto, firme digitali e storico
- Moduli personalizzabili

MODULI:
- ReClean: gestione pulizie
- Planner: pianificazione manutenzioni
- IoT: integrazione sensori (futuro)

BUSINESS MODEL:
- Abbonamento base: 39-299 euro/mese
- White Label per gruppi e catene

TARGET: Hotel, strutture ricettive, aziende, condomini, facility management',
  'progetti',
  'https://4bid.it/progetti/manubot',
  'manubot, gestione manutenzioni, whatsapp, telegram, facility management, hotel, manutenzione, ticket',
  10,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Aggiorna SANTADDEO
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  'SANTADDEO - The Human Revenue Manager',
  'SANTADDEO è il primo sistema di Revenue Management Intelligente e Umano, che spiega le proprie decisioni e si adatta ad ogni struttura nel mondo.

STATO: 75% completato

CARATTERISTICHE PRINCIPALI:
- Sistema di pricing dinamico con AI
- Spiega le proprie decisioni in modo comprensibile
- Si adatta ad ogni tipo di struttura ricettiva
- Dashboard intuitiva per revenue manager
- Integrazione PMS/OTA in corso

DIFFERENZIATORI:
- Trasparenza: mostra PERCHE suggerisce un prezzo
- Configurabilità: si adatta alle regole della struttura
- Semplicità: interfaccia user-friendly

BUSINESS MODEL:
- SaaS: 99-499 euro/mese
- Performance: percentuale sui risultati (zero rischio)

TARGET: Hotel e strutture ricettive che vogliono un RMS trasparente',
  'progetti',
  'https://4bid.it/progetti/santaddeo',
  'santaddeo, revenue management, pricing dinamico, hotel, ai, intelligenza artificiale, rms',
  10,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Aggiorna RISPARMIO COMPULSIVO
INSERT INTO knowledge_base (title, content, category, source_url, keywords, priority, is_active)
VALUES (
  'RISPARMIO COMPULSIVO - Save. Play. Win.',
  'RISPARMIO COMPULSIVO è l app che trasforma il risparmio personale in un gioco globale, motivante e automatico.

STATO: 70% completato

CONCEPT:
- Gamification del risparmio
- Sfide e obiettivi personalizzati
- Sistema di reward e achievement
- Community globale di risparmiatori
- Risparmio automatico basato su regole

FUNZIONALITA:
- Obiettivi di risparmio personalizzati
- Sfide settimanali/mensili
- Classifiche e competizioni
- Badge e premi virtuali
- Integrazione conti bancari

BUSINESS MODEL:
- Freemium con funzionalità premium
- Partnership con istituti finanziari

TARGET: Millennials e Gen Z che vogliono risparmiare in modo divertente',
  'progetti',
  'https://4bid.it/progetti/risparmio-compulsivo',
  'risparmio compulsivo, risparmio, app, fintech, gamification, saving, money management',
  10,
  true
)
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  source_url = EXCLUDED.source_url,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  updated_at = NOW();
