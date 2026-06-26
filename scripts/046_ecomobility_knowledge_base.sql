-- =====================================================
-- 4BID ECOMOBILITY - KNOWLEDGE BASE
-- Informazioni per l'assistente AI
-- =====================================================

-- Informazione principale sul progetto
INSERT INTO knowledge_base (title, content, category, source, keywords, priority, is_active) VALUES
(
  '4BID Ecomobility - Panoramica Progetto',
  '4BID Ecomobility è una piattaforma SaaS multi-tenant per la gestione del noleggio di mobilità elettrica nelle strutture turistiche (hotel, resort, agriturismi, campeggi). 

MODELLO DI BUSINESS: Piattaforma + Hardware (Modello 2)
- 4BID fornisce la piattaforma software e dispositivi hardware (GPS tracker, lucchetti smart)
- Le strutture pagano un abbonamento mensile + fee per dispositivo
- I clienti finali pagano direttamente alla struttura (Stripe Connect)
- 4BID trattiene una commissione del 5% su ogni transazione

PIANI DISPONIBILI:
- Starter: €49/mese - fino a 5 veicoli - €5/dispositivo
- Professional: €99/mese - fino a 15 veicoli - €4/dispositivo  
- Enterprise: €199/mese - veicoli illimitati - €3/dispositivo

STATO SVILUPPO: 85% completato
- Schema database multi-tenant: completato
- Dashboard admin 4BID: completata
- Dashboard gestore struttura: completata
- Pagina prenotazione cliente: completata
- Sistema pagamenti Stripe Connect: completato
- QR Code voucher: completato
- Landing page SEO: 3 pagine completate',
  'progetti',
  'internal',
  ARRAY['ecomobility', 'mobilità elettrica', 'noleggio', 'e-bike', 'scooter', 'hotel', 'SaaS', 'multi-tenant'],
  10,
  true
),
(
  '4BID Ecomobility - Funzionalità Piattaforma',
  'FUNZIONALITÀ PRINCIPALI:

1. PRENOTAZIONE CLIENTE (5 step):
   - Scelta veicolo disponibile con filtro per tipo
   - Selezione data e ora ritiro
   - Inserimento dati personali e camera
   - Upload documenti (carta identità + patente)
   - Accettazione condizioni e dichiarazione autonomia batteria
   - Pagamento tramite Stripe

2. GESTIONE FLOTTA:
   - Anagrafica veicoli con codice, nome, tipo
   - Monitoraggio stato batteria in tempo reale
   - Storico manutenzioni
   - Tracking GPS (con dispositivi hardware)

3. PRICING DECRESCENTE:
   - Tariffe orarie che diminuiscono con la durata
   - Esempio: €8 prima ora, €6 seconda, €5 terza...
   - Cap giornaliero massimo
   - Cauzione configurabile

4. RICONSEGNA:
   - 4 foto obbligatorie (fronte, retro, lato sx, lato dx)
   - Dichiarazione livello batteria
   - Segnalazione eventuali danni
   - Calcolo automatico importo finale

5. DASHBOARD ADMIN 4BID:
   - Overview multi-struttura
   - Gestione prenotazioni, veicoli, tipi veicolo, tariffe
   - Configurazione Stripe Connect per ogni struttura
   - Fatturazione e abbonamenti

6. DASHBOARD GESTORE STRUTTURA:
   - Login dedicato per operatori
   - Vista prenotazioni del giorno
   - Gestione ritiro/riconsegna
   - Verifica QR code voucher',
  'progetti',
  'internal',
  ARRAY['ecomobility', 'funzionalità', 'prenotazione', 'flotta', 'pricing', 'dashboard'],
  9,
  true
),
(
  '4BID Ecomobility - Architettura Tecnica',
  'ARCHITETTURA MULTI-TENANT:

DATABASE (Supabase PostgreSQL):
- 19 tabelle con prefisso ecomobility_
- Tutte le tabelle operative hanno FK a structure_id
- Row Level Security (RLS) attivo su tutte le tabelle

TABELLE PRINCIPALI:
- ecomobility_structures: anagrafica strutture (tenant)
- ecomobility_vehicles: veicoli con stato batteria
- ecomobility_vehicle_types: tipi veicolo (e-bike, scooter, etc)
- ecomobility_bookings: prenotazioni
- ecomobility_customers: clienti con documenti
- ecomobility_pricing: tariffe orarie decrescenti
- ecomobility_operators: operatori struttura
- ecomobility_devices: GPS tracker e lucchetti smart
- ecomobility_subscriptions: abbonamenti strutture
- ecomobility_invoices: fatture 4BID alle strutture

ROUTING:
- /ecomobility/[slug] - Pagina prenotazione pubblica
- /ecomobility/[slug]/admin - Dashboard gestore struttura
- /ecomobility/[slug]/return/[bookingCode] - Riconsegna
- /ecomobility/[slug]/verify/[bookingCode] - Verifica QR
- /admin/ecomobility - Dashboard admin 4BID
- /admin/ecomobility/billing - Gestione fatturazione 4BID

INTEGRAZIONI:
- Stripe Connect per pagamenti split (struttura + commissione 4BID)
- Supabase Storage per upload documenti e foto
- SMTP per notifiche email',
  'progetti',
  'internal',
  ARRAY['ecomobility', 'architettura', 'database', 'multi-tenant', 'API', 'Supabase'],
  8,
  true
),
(
  '4BID Ecomobility - Target e Mercato',
  'TARGET CLIENTI:

STRUTTURE RICETTIVE:
- Hotel 3-5 stelle con servizi aggiuntivi
- Resort e villaggi turistici
- Agriturismi e country house
- Campeggi e glamping
- B&B di lusso
- Residence e appartamenti turistici

AREE GEOGRAFICHE PRIORITARIE:
- Toscana (Chianti, Val d''Orcia, Maremma)
- Lago di Garda
- Costiera Amalfitana
- Sardegna e Sicilia
- Dolomiti e zone montane

VANTAGGI PER LE STRUTTURE:
- Nuovo revenue stream (noleggio veicoli)
- Servizio differenziante per gli ospiti
- Gestione completamente automatizzata
- Nessun investimento in sviluppo software
- Branding personalizzabile (white-label)

VANTAGGI PER GLI OSPITI:
- Prenotazione self-service 24/7
- Pagamento sicuro con carta
- Voucher digitale con QR code
- Nessuna carta di credito in deposito
- Esperienza eco-friendly',
  'progetti',
  'internal',
  ARRAY['ecomobility', 'target', 'mercato', 'hotel', 'turismo', 'cliente'],
  7,
  true
),
(
  '4BID Ecomobility - Contatti e Demo',
  'Per informazioni commerciali su 4BID Ecomobility:

CONTATTI:
- Email: info@4bid.it
- Telefono: +39 055 XXX XXXX
- Sito web: https://4bid.it/ecomobility

LANDING PAGE SEO:
- /ecomobility/noleggio-mobilita-elettrica-hotel - Per strutture che cercano soluzioni
- /ecomobility/piattaforma-ecomobility - Dettagli tecnici della piattaforma
- /ecomobility/come-funziona - Guida visuale in 8 step

DEMO:
- Struttura demo: Villa I Barronci (slug: villa-i-barronci)
- URL prenotazione: /ecomobility/villa-i-barronci
- Dashboard gestore: /ecomobility/villa-i-barronci/admin

PREZZI:
- Starter: €49/mese (fino a 5 veicoli)
- Professional: €99/mese (fino a 15 veicoli)
- Enterprise: €199/mese (veicoli illimitati)
- Fee dispositivi: €3-5/mese per GPS/lucchetto
- Commissione transazioni: 5%',
  'progetti',
  'internal',
  ARRAY['ecomobility', 'contatti', 'demo', 'prezzi', 'commerciale'],
  6,
  true
);

-- Aggiorna il contenuto esistente se già presente
-- (in caso di re-esecuzione dello script)
