# Quote Commerce Engine

## Flusso
1. L'amministratore crea un preventivo multi-progetto da `/admin/quotes/commerce`.
2. Ogni voce conserva snapshot di catalogo, prezzo, sconto, trial, funzionalità e SLA.
3. Il cliente compila i dati fiscali, accetta e sceglie carta o bonifico.
4. Stripe usa `payment` per voci una tantum e `subscription` quando esistono canoni.
5. Il webhook crea un job idempotente per ogni progetto acquistato.
6. Ogni connettore crea tenant, amministratore, piano e moduli nel progetto corrispondente.

## Variabili richieste
- `STRIPE_SECRET_KEY`
- `STRIPE_QUOTES_WEBHOOK_SECRET` oppure `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- catalogo: `<PROGETTO>_CATALOG_URL` e `<PROGETTO>_CATALOG_TOKEN`, oppure `<PROGETTO>_CATALOG_JSON`
- provisioning: `<PROGETTO>_PROVISIONING_URL` e `<PROGETTO>_PROVISIONING_TOKEN`

I progetti supportati sono `SANTADDEO`, `HOTELPROFITAI` e `MANUBOT`.

## Blocco intenzionale
Gli sconti ricorrenti a durata limitata vengono rifiutati dal Checkout con codice `TEMPORARY_DISCOUNT_REQUIRES_SCHEDULE` finché non viene configurato uno Stripe Subscription Schedule. È preferibile bloccare il pagamento anziché applicare per errore uno sconto permanente.

## Checklist prima del merge
- Applicare `scripts/20260806_quote_commerce_engine.sql` su Supabase staging.
- Configurare cataloghi ed endpoint di provisioning test.
- Abilitare i deployment Vercel per commit GitHub non verificati oppure firmare i commit.
- Eseguire build Next.js e lint.
- Testare Stripe test mode: una tantum, abbonamento, trial e preventivo misto.
- Riprodurre webhook duplicato e verificare un solo tenant per progetto.
- Simulare errore connettore e verificare stato parziale/manuale e retry.
- Verificare che un preventivo pagato non sia modificabile o eliminabile.
