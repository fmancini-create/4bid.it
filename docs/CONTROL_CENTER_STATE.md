# 4 BID Control Center — stato dei luoghi

## Scopo

Il Control Center e' un modulo indipendente del back office 4 BID. Osserva i prodotti,
ma non esegue modifiche nei loro repository e non accede ai dati degli hotel.

## Prodotti monitorati

- `fmancini-create/HotelAccelerator` (`main`)
- `fmancini-create/v0-manu-bot` (`main`)
- `fmancini-create/santaddeo-V1` (`main`)
- `fmancini-create/v0-hotel-profit-ai` (`main`)
- `fmancini-create/4bid.it` (`4bid`)

## Flusso

1. Un super admin avvia l'analisi oppure il cron giornaliero chiama l'endpoint.
2. Il motore legge metadata, albero dei file, configurazioni e workflow GitHub.
3. Controlli deterministici producono finding con evidenza, gravita' e rimedio.
4. Il risultato viene salvato in Supabase e mostrato nella dashboard.
5. Ogni esecuzione e' legata allo SHA del commit analizzato.

## Confini di sicurezza

- Token GitHub solo server-side (`GITHUB_AUDIT_TOKEN`), permesso `Contents: read`.
- Endpoint manuale protetto dalla sessione super admin.
- Endpoint cron protetto da `CRON_SECRET`.
- Nessun token o sorgente completo viene salvato nel database.
- Il sistema e' read-only verso i repository monitorati.

## Tabelle

- `technical_audit_runs`: una riga per progetto/esecuzione.
- `technical_audit_findings`: problemi rilevati, collegati all'esecuzione.

## Evoluzione prevista

Il primo motore verifica repository e CI. Vercel runtime, Supabase advisor, test E2E e
analisi AI contestuale possono essere aggiunti come provider separati senza cambiare
lo schema pubblico della dashboard.

