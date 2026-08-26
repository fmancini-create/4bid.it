# Configurazione SMTP per 4BID.IT

## Sicurezza

Non inserire mai password, App Password, API key o altri segreti in questo repository. Le credenziali SMTP devono essere salvate esclusivamente nelle Environment Variables di Vercel o nel secret manager dell'ambiente di produzione.

Se una credenziale e' stata committata in passato, considerarla compromessa e ruotarla immediatamente: rimuoverla dal file corrente non la elimina dalla cronologia Git.

## Variabili d'Ambiente su Vercel

Aggiungi o aggiorna queste variabili nel progetto Vercel che serve `4bid.it`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=clienti@4bid.it
SMTP_PASSWORD=<APP_PASSWORD_O_PASSWORD_SMTP>
SMTP_FROM=4BID SRL <clienti@4bid.it>
SMTP_FROM_TRANSACTIONAL=4Bid Project Room <clienti@4bid.it>
SMTP_FROM_MARKETING=4BID SRL <clienti@4bid.it>
SMTP_REPLY_TO=clienti@4bid.it
```

`SMTP_PASS` e' accettata come alias di `SMTP_PASSWORD` per compatibilita' con configurazioni esistenti.

## Note Importanti

- **SMTP_HOST**: server SMTP del provider; per Google Workspace e' `smtp.gmail.com`.
- **SMTP_PORT**: `587` con STARTTLS oppure `465` con TLS implicito.
- **SMTP_SECURE**: `false` su porta 587; `true` su porta 465.
- **SMTP_USER**: casella autorizzata all'invio.
- **SMTP_PASSWORD**: credenziale SMTP/App Password, mai da committare.
- **SMTP_FROM**: fallback del mittente.
- **SMTP_FROM_TRANSACTIONAL**: identita' per inviti e posta di servizio.
- **SMTP_FROM_MARKETING**: identita' per campagne DEM; deve essere autorizzata dal provider SMTP.
- **SMTP_REPLY_TO**: casella monitorata per le risposte.

## Google Workspace con verifica in due passaggi

Se l'account Google usa la verifica in due passaggi, utilizza una App Password valida per SMTP e salvala direttamente in Vercel come `SMTP_PASSWORD`. Non copiarla in documenti, ticket o commit.

## Verifica Funzionamento

Dopo aver configurato le variabili:

1. esegui un nuovo deployment di preview;
2. verifica che il controllo provider SMTP risulti sano;
3. testa una sola email transazionale verso un indirizzo controllato;
4. verifica una campagna DEM con un destinatario di prova, inclusi `List-Unsubscribe` e reply-to;
5. solo dopo i test abilita nuovamente le code automatiche.

## Troubleshooting

Se le email non partono:

- verifica host, porta, TLS e credenziali;
- con Google Workspace, verifica che l'uso SMTP/App Password sia consentito per l'account;
- controlla i Runtime Logs Vercel per errori di autenticazione, rete o TLS;
- verifica che `SMTP_FROM*` usi indirizzi o alias autorizzati dal provider;
- non riattivare le DEM finche' `checkEmailProviderHealth()` non torna sano.
