# Configurazione SMTP per 4BID.IT

## Variabili d'Ambiente da Aggiungere su Vercel

Aggiungi queste variabili d'ambiente nel tuo progetto Vercel (Settings → Environment Variables):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=clienti@4bid.it
SMTP_PASSWORD=Pippolo75@clienti
SMTP_FROM=clienti@4bid.it
```

## Note Importanti

- **SMTP_HOST**: `smtp.gmail.com` (Gmail Workspace)
- **SMTP_PORT**: `587` (TLS standard)
- **SMTP_SECURE**: `false` (usa STARTTLS su porta 587)
- **SMTP_USER**: Email completa del mittente
- **SMTP_PASSWORD**: Password dell'account Gmail Workspace
- **SMTP_FROM**: Email che apparirà come mittente

## Verifica Funzionamento

Dopo aver aggiunto le variabili d'ambiente:

1. Fai un nuovo deployment su Vercel
2. Testa il form "Proponi la tua idea" su https://4bid.it/proponi-idea
3. Verifica che arrivino 2 email:
   - Una di conferma all'utente che ha compilato il form
   - Una di notifica all'admin (f.mancini@4bid.it)

## Troubleshooting

Se le email non arrivano:
- Verifica che le credenziali siano corrette
- Controlla che l'account Gmail Workspace permetta "App meno sicure" o usa una App Password
- Controlla i log di Vercel per eventuali errori SMTP
