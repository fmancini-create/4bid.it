# Configurazione SMTP per 4BID.IT

## Variabili d'Ambiente su Vercel

Aggiungi/Aggiorna queste variabili d'ambiente nel tuo progetto Vercel (Settings → Environment Variables):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=clienti@4bid.it
SMTP_PASSWORD=Pippolo75@google
SMTP_FROM=clienti@4bid.it
```

## Note Importanti

- **SMTP_HOST**: `smtp.gmail.com` (Gmail/Google Workspace)
- **SMTP_PORT**: `587` (TLS standard)
- **SMTP_SECURE**: `false` (usa STARTTLS su porta 587)
- **SMTP_USER**: Email completa del mittente
- **SMTP_PASSWORD**: Password dell'account (o App Password se 2FA attivo)
- **SMTP_FROM**: Email che apparirà come mittente

## Se la 2FA è Attiva su Google

Se l'account Google ha la verifica in due passaggi attiva, devi creare una **App Password**:

1. Vai su https://myaccount.google.com/apppasswords
2. Accedi con clienti@4bid.it
3. Seleziona "Mail" e "Altro (nome personalizzato)" → scrivi "4BID Website"
4. Clicca "Genera"
5. Copia la password di 16 caratteri generata
6. Usa quella password come `SMTP_PASSWORD` invece di Pippolo75@google

## Verifica Funzionamento

Dopo aver aggiunto le variabili d'ambiente:

1. Fai un nuovo deployment su Vercel
2. Testa il form "Proponi la tua idea" su https://4bid.it/proponi-idea
3. Verifica che arrivino le email

## Troubleshooting

Se le email non arrivano:
- Verifica che le credenziali siano corrette
- Se 2FA attivo, usa una App Password
- Controlla i log di Vercel per eventuali errori SMTP
- Verifica che l'account non sia bloccato per troppi tentativi
