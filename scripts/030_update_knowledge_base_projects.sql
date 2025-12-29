-- Aggiornamento Knowledge Base con informazioni REALI sui progetti
-- Eseguire questo script per aggiornare le informazioni della chat AI

-- Rimuovi vecchie entries sui progetti
DELETE FROM knowledge_base WHERE category = 'progetti';

-- MANUBOT - 90%
INSERT INTO knowledge_base (title, content, category, keywords, priority, is_active)
VALUES (
  'MANUBOT - Sistema Smart di Gestione Manutenzioni',
  'MANUBOT è un sistema universale di gestione e automazione delle manutenzioni che parla la lingua di tutti: WhatsApp e Telegram.

STATO: 90% completato

CARATTERISTICHE PRINCIPALI:
- Bot Telegram/WhatsApp funzionante
- Database operativo
- Sistema ticket completo
- Dashboard reportistica avanzata
- In fase di testing finale e ottimizzazioni

VANTAGGI:
- Zero app da installare - gli operativi usano solo WhatsApp o Telegram
- Dashboard completa per i manager con statistiche avanzate
- Totale tracciabilità con foto, firme digitali e storico completo
- Moduli personalizzabili con integrazione futura IoT e sensori

BUSINESS MODEL:
- Abbonamento base: 39-299 euro al mese
- Moduli opzionali: ReClean per pulizie, Planner manutenzioni
- White Label per gruppi e catene

MERCATO: Software per manutenzione e facility management, oltre 80 miliardi di dollari entro il 2030',
  'progetti',
  'manubot, gestione manutenzioni, whatsapp, telegram, facility management, hotel, manutenzione',
  10,
  true
);

-- SANTADDEO - 75%
INSERT INTO knowledge_base (title, content, category, keywords, priority, is_active)
VALUES (
  'SANTADDEO - The Human Revenue Manager',
  'SANTADDEO è il primo sistema di Revenue Management Intelligente e Umano, che spiega le proprie decisioni e si adatta ad ogni struttura nel mondo.

STATO: 75% completato

CARATTERISTICHE PRINCIPALI:
- Sistema di pricing dinamico con AI
- Spiega le proprie decisioni in modo comprensibile
- Si adatta ad ogni tipo di struttura ricettiva
- Dashboard intuitiva per revenue manager

È un progetto in sviluppo da 4BID.IT per rivoluzionare il revenue management alberghiero.',
  'progetti',
  'santaddeo, revenue management, pricing dinamico, hotel, ai, intelligenza artificiale',
  10,
  true
);

-- HOTEL ACCELERATOR - 70% (DATI REALI dal sito hotelaccelerator.com)
INSERT INTO knowledge_base (title, content, category, keywords, priority, is_active)
VALUES (
  'HOTEL ACCELERATOR - Il Software Gestionale Completo per Hotel',
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
   - Gestisci contenuti senza competenze tecniche
   - +300% visibilita organica

2. CRM Alberghiero
   - Gestione contatti centralizzata
   - Segmentazione avanzata
   - Tracking prenotazioni e lead scoring automatico
   - +45% retention ospiti

3. Email Marketing
   - Campagne automatizzate pre e post soggiorno
   - Template professionali
   - A/B testing e analytics dettagliati
   - 2x engagement rate

4. Inbox Omnicanale
   - Email, WhatsApp, Telegram e Chat in unica inbox
   - Rispondi da un solo posto
   - Mai piu messaggi persi
   - -50% tempo risposta

5. Analytics Avanzati
   - Dashboard in tempo reale
   - Tracking eventi
   - Attribution model
   - Insight per decisioni data-driven
   - +25% conversioni

6. AI Assistant
   - Risposte automatiche intelligenti 24/7
   - Suggerimenti personalizzati
   - Analisi intento ospiti
   - 24/7 disponibilita

Hotel Accelerator e progettato specificamente per le strutture ricettive italiane e aiuta a ridurre le commissioni OTA aumentando le prenotazioni dirette.',
  'progetti',
  'hotel accelerator, software gestionale hotel, cms hotel, crm alberghiero, email marketing hotel, inbox omnicanale, ai hotel, prenotazioni dirette, ota',
  10,
  true
);

-- AUTOEXEL - Online
INSERT INTO knowledge_base (title, content, category, keywords, priority, is_active)
VALUES (
  'AUTOEXEL - Il primo Excel per chi non sa usare Excel',
  'AUTOEXEL e il primo Excel per chi non sa usare Excel.

STATO: Online e operativo

FUNZIONALITA:
- Carica un file Excel o CSV per ottenere analisi automatiche, KPI e grafici
- Crea fogli intelligenti usando comandi in linguaggio naturale
- Nessuna formula da scrivere
- Interfaccia intuitiva e semplice

E un progetto di 4BID.IT gia disponibile e funzionante.',
  'progetti',
  'autoexel, excel, csv, analisi dati, kpi, grafici, linguaggio naturale',
  10,
  true
);

-- RISPARMIO COMPULSIVO - 70%
INSERT INTO knowledge_base (title, content, category, keywords, priority, is_active)
VALUES (
  'RISPARMIO COMPULSIVO - Save. Play. Win.',
  'RISPARMIO COMPULSIVO e app che trasforma il risparmio personale in un gioco globale, motivante e automatico.

STATO: 70% completato

CONCEPT:
- Gamification del risparmio
- Sfide e obiettivi personalizzati
- Sistema di reward e achievement
- Community globale di risparmiatori

E un progetto in sviluppo da 4BID.IT nel settore fintech.',
  'progetti',
  'risparmio compulsivo, risparmio, app, fintech, gamification, saving',
  10,
  true
);
