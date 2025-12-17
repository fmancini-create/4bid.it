# Configurazione Cron Job per Snapshot Giornalieri

## Problema
La dashboard admin mostra "visite di ieri" vuote perché il cron job non salva snapshot giornalieri.

## Soluzione

### 1. Esegui lo script SQL per popolare i dati di ieri
Esegui `scripts/028_populate_yesterday_stats.sql` per creare dati retroattivi per ieri.

### 2. Configura il Cron Job su Vercel
Il cron job è già implementato in `/api/cron/save-daily-snapshot/route.ts` ma deve essere configurato.

**Aggiungi al file `vercel.json` nella root del progetto:**

```json
{
  "crons": [
    {
      "path": "/api/cron/save-daily-snapshot",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Questo eseguirà il cron job ogni giorno a mezzanotte (00:00 UTC).

### 3. Aggiungi la variabile d'ambiente CRON_SECRET
Il cron job richiede autenticazione. Aggiungi questa variabile nelle impostazioni Vercel:

```
CRON_SECRET=<genera-un-token-sicuro-random>
```

### 4. Verifica che funzioni
Dopo il deploy, il cron job verrà eseguito automaticamente ogni mezzanotte e salverà lo snapshot delle visite del giorno precedente.

## Test Manuale
Puoi testare il cron job chiamando manualmente l'endpoint:

```bash
curl -X POST https://4bid.it/api/cron/save-daily-snapshot \
  -H "Authorization: Bearer <CRON_SECRET>"
```

## Come Funziona
Il cron job:
1. Recupera tutte le landing pages dal database
2. Per ogni pagina, salva uno snapshot con:
   - Data di ieri
   - Visite totali alla mezzanotte
   - Conversioni totali alla mezzanotte
3. Salva nella tabella `landing_page_daily_stats`

La dashboard admin poi confronta:
- Visite totali oggi VS visite salvate ieri
- Per mostrare la differenza giornaliera
