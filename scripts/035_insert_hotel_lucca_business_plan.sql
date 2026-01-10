-- Business Plan: Hotel 4 stelle Superior - Lucca
-- 90 camere con centro benessere e ristorante

-- 1. Inserisci il Business Plan
INSERT INTO business_plans (
  id,
  name,
  description,
  business_type,
  client_name,
  location,
  years,
  status,
  currency
) VALUES (
  'e1a2b3c4-d5e6-7f89-0123-456789abcdef',
  'Hotel Le Mura - Lucca',
  'Business Plan per Hotel 4 stelle Superior di nuova realizzazione a Lucca, immediatamente fuori le mura storiche. Struttura con 90 camere, centro benessere e ristorante gourmet.',
  'hotel_4_star',
  'Hotel Le Mura S.r.l.',
  'Lucca, Toscana',
  3,
  'draft',
  'EUR'
);

-- 2. Parametri Anno 1 (primo anno di operatività - soft opening)
INSERT INTO business_plan_params (
  business_plan_id,
  year,
  -- Parametri operativi camere
  rooms_count, days_open, occupancy_rate, adr,
  -- Parametri F&B
  fb_revenue_per_room, fb_external_covers, fb_external_avg_ticket,
  -- Parametri SPA
  spa_revenue_per_room, spa_external_daily, spa_external_avg_ticket,
  -- Altri ricavi
  other_revenue_per_room,
  -- Costi variabili (%)
  cost_rooms_pct, cost_fb_pct, cost_spa_pct, cost_other_pct,
  -- Costi fissi
  cost_personnel, cost_rent, cost_utilities, cost_maintenance,
  cost_insurance, cost_marketing, cost_admin, cost_technology, cost_other_fixed,
  -- Ammortamenti e oneri finanziari
  depreciation, interest_expense,
  -- Aliquota fiscale
  tax_rate
) VALUES (
  'e1a2b3c4-d5e6-7f89-0123-456789abcdef',
  1,
  -- Operativi: 90 camere, 320 giorni (apertura marzo), 55% occupazione, €180 ADR
  90, 320, 55, 180,
  -- F&B: €45/camera, 30 coperti esterni/giorno, €55 scontrino medio
  45, 30, 55,
  -- SPA: €25/camera, 15 esterni/giorno, €80 trattamento medio
  25, 15, 80,
  -- Altri: minibar, parcheggio, servizi €15/camera
  15,
  -- Costi variabili: camere 22%, F&B 35%, SPA 30%, altri 20%
  22, 35, 30, 20,
  -- Costi fissi Anno 1
  1450000,  -- Personale (55 FTE circa)
  180000,   -- Affitto/leasing
  220000,   -- Utenze
  80000,    -- Manutenzione
  45000,    -- Assicurazioni
  150000,   -- Marketing (alto per lancio)
  85000,    -- Amministrazione
  35000,    -- Tecnologia/software
  60000,    -- Altri costi fissi
  -- Ammortamenti e interessi
  450000,   -- Ammortamenti (investimento ~9M su 20 anni)
  320000,   -- Interessi (mutuo ~6M al 5%)
  -- Tasse
  24
);

-- 3. Parametri Anno 2 (consolidamento)
INSERT INTO business_plan_params (
  business_plan_id,
  year,
  rooms_count, days_open, occupancy_rate, adr,
  fb_revenue_per_room, fb_external_covers, fb_external_avg_ticket,
  spa_revenue_per_room, spa_external_daily, spa_external_avg_ticket,
  other_revenue_per_room,
  cost_rooms_pct, cost_fb_pct, cost_spa_pct, cost_other_pct,
  cost_personnel, cost_rent, cost_utilities, cost_maintenance,
  cost_insurance, cost_marketing, cost_admin, cost_technology, cost_other_fixed,
  depreciation, interest_expense,
  tax_rate
) VALUES (
  'e1a2b3c4-d5e6-7f89-0123-456789abcdef',
  2,
  -- Operativi: 90 camere, 345 giorni, 68% occupazione, €195 ADR (+8%)
  90, 345, 68, 195,
  -- F&B: €50/camera, 40 coperti esterni, €58 scontrino
  50, 40, 58,
  -- SPA: €30/camera, 20 esterni, €85 trattamento
  30, 20, 85,
  -- Altri: €18/camera
  18,
  -- Costi variabili ottimizzati
  21, 33, 28, 18,
  -- Costi fissi Anno 2 (incremento personale, riduzione marketing)
  1550000,  -- Personale (+7%)
  185000,   -- Affitto
  240000,   -- Utenze (+9%)
  90000,    -- Manutenzione
  48000,    -- Assicurazioni
  120000,   -- Marketing (ridotto)
  90000,    -- Amministrazione
  38000,    -- Tecnologia
  55000,    -- Altri
  -- Ammortamenti e interessi
  450000,
  300000,   -- Interessi (capitale ridotto)
  24
);

-- 4. Parametri Anno 3 (maturità)
INSERT INTO business_plan_params (
  business_plan_id,
  year,
  rooms_count, days_open, occupancy_rate, adr,
  fb_revenue_per_room, fb_external_covers, fb_external_avg_ticket,
  spa_revenue_per_room, spa_external_daily, spa_external_avg_ticket,
  other_revenue_per_room,
  cost_rooms_pct, cost_fb_pct, cost_spa_pct, cost_other_pct,
  cost_personnel, cost_rent, cost_utilities, cost_maintenance,
  cost_insurance, cost_marketing, cost_admin, cost_technology, cost_other_fixed,
  depreciation, interest_expense,
  tax_rate
) VALUES (
  'e1a2b3c4-d5e6-7f89-0123-456789abcdef',
  3,
  -- Operativi: 90 camere, 350 giorni, 75% occupazione, €210 ADR (+7.7%)
  90, 350, 75, 210,
  -- F&B: €55/camera, 50 coperti esterni, €62 scontrino
  55, 50, 62,
  -- SPA: €35/camera, 25 esterni, €90 trattamento
  35, 25, 90,
  -- Altri: €20/camera
  20,
  -- Costi variabili ottimizzati
  20, 32, 27, 17,
  -- Costi fissi Anno 3
  1620000,  -- Personale (+4.5%)
  190000,   -- Affitto
  250000,   -- Utenze
  95000,    -- Manutenzione
  50000,    -- Assicurazioni
  100000,   -- Marketing (mantenimento)
  95000,    -- Amministrazione
  40000,    -- Tecnologia
  50000,    -- Altri
  -- Ammortamenti e interessi
  450000,
  280000,   -- Interessi
  24
);

-- 5. Sezioni testuali del Business Plan
INSERT INTO business_plan_sections (business_plan_id, section_key, title, content, sort_order) VALUES

('e1a2b3c4-d5e6-7f89-0123-456789abcdef', 'executive_summary', 'Executive Summary',
'Il progetto prevede la realizzazione di un Hotel 4 stelle Superior di nuova costruzione situato immediatamente fuori le mura storiche di Lucca, in una posizione strategica che combina la vicinanza al centro storico con la comodità di accesso e parcheggio.

La struttura disporrà di 90 camere suddivise in diverse tipologie (Superior, Deluxe, Junior Suite e Suite), un centro benessere di 800 mq con piscina interna, area umida e cabine trattamenti, e un ristorante gourmet da 80 coperti aperto anche alla clientela esterna.

L''investimento complessivo è stimato in circa €9.000.000, con un finanziamento bancario di €6.000.000 e capitale proprio di €3.000.000.

Obiettivi finanziari:
• Anno 1: Ricavi €3.8M, EBITDA positivo
• Anno 2: Ricavi €5.2M, EBITDA margin >15%
• Anno 3: Ricavi €6.3M, EBITDA margin >20%', 1),

('e1a2b3c4-d5e6-7f89-0123-456789abcdef', 'market_analysis', 'Analisi di Mercato',
'MERCATO DI RIFERIMENTO
Lucca rappresenta una delle destinazioni turistiche più apprezzate della Toscana, con un flusso turistico in costante crescita. La città attrae principalmente:
• Turismo culturale (mura storiche, chiese, Puccini)
• Turismo enogastronomico
• MICE e business travel
• Turismo wellness

ANALISI COMPETITIVA
Nel raggio di 5 km dal sito sono presenti:
• 3 hotel 4 stelle (totale 180 camere)
• 5 hotel 3 stelle (totale 250 camere)
• Numerosi B&B e agriturismi

Nessun competitor diretto offre la combinazione di:
• Struttura di nuova costruzione
• Centro benessere di alto livello
• Ristorante gourmet
• Parcheggio privato ampio

POSIZIONAMENTO
L''hotel si posizionerà nel segmento upper-upscale, con:
• ADR target: €180-210 (vs €130-160 competitor)
• RevPAR obiettivo Anno 3: €157
• Focus su qualità servizio e experience', 2),

('e1a2b3c4-d5e6-7f89-0123-456789abcdef', 'product_description', 'Descrizione Prodotto',
'CAMERE (90 unità)
• 45 Superior (25-28 mq) - €160-200/notte
• 30 Deluxe (30-35 mq) - €200-250/notte
• 10 Junior Suite (40-45 mq) - €280-350/notte
• 5 Suite (55-70 mq) - €400-550/notte

Tutte le camere dotate di:
• Climatizzazione individuale
• Smart TV 55" con streaming
• Minibar premium
• Macchina caffè Nespresso
• Bagno con doccia rain e/o vasca
• Prodotti cortesia di alta gamma

CENTRO BENESSERE "LE TERME" (800 mq)
• Piscina interna riscaldata (15x8m)
• Area umida: sauna finlandese, bagno turco, docce emozionali
• 6 cabine trattamenti
• Palestra attrezzata Technogym
• Area relax con tisaneria

RISTORANTE "IL BALUARDO" (80 coperti)
• Cucina toscana contemporanea
• Chef con esperienza stellata
• Cantina con 300+ etichette
• Terrazza panoramica sulle mura
• Aperto pranzo e cena, anche a esterni', 3),

('e1a2b3c4-d5e6-7f89-0123-456789abcdef', 'operations', 'Piano Operativo',
'ORGANIZZAZIONE DEL PERSONALE

Anno 1: 55 FTE
• Direzione: 3 (GM, Revenue Manager, F&B Manager)
• Front Office: 8
• Housekeeping: 15
• F&B Service: 12
• Cucina: 8
• SPA: 6
• Manutenzione: 3

Anno 3: 62 FTE (incremento per volumi)

STAGIONALITÀ E APERTURA
• Apertura annuale con chiusura tecnica gennaio (15 giorni)
• Alta stagione: aprile-giugno, settembre-ottobre
• Media stagione: marzo, luglio-agosto, novembre-dicembre
• Bassa stagione: gennaio-febbraio

FORNITORI STRATEGICI
• F&B: filiera corta toscana (80% prodotti locali)
• Amenities: partnership con brand luxury
• Tecnologia: PMS Oracle Opera, Channel Manager
• Revenue Management: supporto 4BID', 4),

('e1a2b3c4-d5e6-7f89-0123-456789abcdef', 'marketing', 'Strategia Marketing',
'CANALI DI DISTRIBUZIONE
• Booking.com, Expedia: 35%
• Sito diretto: 30%
• Tour Operator: 15%
• Corporate/MICE: 15%
• Walk-in e altri: 5%

POSIZIONAMENTO PREZZO
Strategia di revenue management dinamico con:
• Pricing differenziato per stagione/giorno
• Best Rate Guarantee sul sito diretto
• Pacchetti esperienziali (Wine&Spa, Gourmet, Cultura)

AZIONI DI MARKETING
Anno 1 (lancio - budget €150.000):
• Campagna PR e influencer pre-apertura
• Google Ads e Meta Ads
• Partnership con DMO Lucca
• Evento inaugurale

Anno 2-3 (consolidamento - budget €100-120.000):
• SEO e content marketing
• CRM e fidelizzazione
• Collaborazioni luxury travel
• Presenza fiere di settore', 5),

('e1a2b3c4-d5e6-7f89-0123-456789abcdef', 'investment', 'Piano degli Investimenti',
'INVESTIMENTO TOTALE: €9.000.000

DETTAGLIO INVESTIMENTI
Terreno e oneri: €800.000 (9%)
Costruzione e opere: €5.200.000 (58%)
Impianti tecnologici: €900.000 (10%)
Arredi e attrezzature: €1.400.000 (16%)
Pre-opening e capitale circolante: €700.000 (7%)

FONTI DI FINANZIAMENTO
Capitale proprio: €3.000.000 (33%)
Mutuo bancario: €6.000.000 (67%)
• Durata: 15 anni
• Tasso: 5% fisso
• Rata annua: circa €580.000

AMMORTAMENTI
• Fabbricato: 3% annuo su €5.200.000 = €156.000
• Impianti: 12% annuo su €900.000 = €108.000
• Arredi: 15% annuo su €1.400.000 = €210.000
• Totale ammortamenti: €474.000/anno (arrotondato a €450.000)', 6),

('e1a2b3c4-d5e6-7f89-0123-456789abcdef', 'risk_analysis', 'Analisi dei Rischi',
'RISCHI IDENTIFICATI E MITIGAZIONI

1. RISCHIO DI MERCATO
Scenario: calo domanda turistica
Mitigazione: diversificazione target (leisure, business, wellness)
Impatto stimato: -15% ricavi

2. RISCHIO OPERATIVO
Scenario: difficoltà reperimento personale qualificato
Mitigazione: partnership con scuole alberghiere, welfare aziendale
Impatto: +5% costi personale

3. RISCHIO FINANZIARIO
Scenario: aumento tassi interesse
Mitigazione: tasso fisso già negoziato
Impatto: nullo su debito esistente

4. RISCHIO COMPETITIVO
Scenario: apertura nuovo hotel 4* in zona
Mitigazione: differenziazione su SPA e F&B, fidelizzazione
Impatto: -10% occupazione per 12 mesi

SCENARIO PESSIMISTICO (Anno 3)
• Occupazione: 65% (-10 pp)
• ADR: €190 (-10%)
• EBITDA: circa €650.000 (vs €1.2M base case)
• Servizio debito: coperto', 7);

-- Grant permissions
GRANT ALL ON business_plans TO authenticated;
GRANT ALL ON business_plan_params TO authenticated;
GRANT ALL ON business_plan_sections TO authenticated;
GRANT ALL ON business_plan_shares TO authenticated;
GRANT ALL ON business_plan_access_logs TO authenticated;
