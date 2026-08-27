# Configurazione email per 4BID.IT

## Architettura

Le email sono separate per funzione:

- **Transazionali / operative**: Google Workspace via SMTP.
- **DEM e follow-up commerciali**: Brevo via SMTP relay.
- **Bounce / spam / unsubscribe DEM**: webhook Brevo verso l'endpoint applicativo.

Questa separazione evita che un problema del canale marketing blocchi anche inviti, notifiche operative e comunicazioni di servizio.

## Sicurezza

Non inserire mai password, App Password, API key o altri segreti in questo repository. Le credenziali devono essere salvate esclusivamente nelle Environment Variables di Vercel o nel secret manager dell'ambiente di produzione.

Se una credenziale e' stata committata in passato, considerarla compromessa e ruotarla immediatamente: rimuoverla dal file corrente non la elimina dalla cronologia Git.

## Variabili Google Workspace - email transazionali

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=clienti@4bid.it
SMTP_PASSWORD=<APP_PASSWORD_O_PASSWORD_SMTP>
SMTP_FROM=4BID SRL <clienti@4bid.it>
SMTP_FROM_TRANSACTIONAL=4Bid Project Room <clienti@4bid.it>
SMTP_REPLY_TO=clienti@4bid.it
```

`SMTP_PASS` e' accettata come alias di `SMTP_PASSWORD`.

## Variabili Brevo - DEM e follow-up

```env
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_SECURE=false
BREVO_SMTP_USER=<LOGIN_SMTP_BREVO>
BREVO_SMTP_KEY=<SMTP_KEY_BREVO>
BREVO_FROM_MARKETING=4BID SRL <marketing@mrk.4bid.it>
BREVO_REPLY_TO=clienti@4bid.it
BREVO_WEBHOOK_SECRET=<SEGRETO_RANDOM_LUNGO>
```

`BREVO_SMTP_PASSWORD` e' accettata come alias di `BREVO_SMTP_KEY`.

Il mittente `BREVO_FROM_MARKETING` deve corrispondere al dominio/mittente autorizzato in Brevo. Per 4BID il dominio marketing dedicato e' `mrk.4bid.it`.

## Webhook Brevo

Durante i test di preview configurare il webhook transazionale verso il branch di preview. Dopo il merge in produzione l'endpoint definitivo sara':

```text
https://www.4bid.it/api/dem/resend-webhook
```

Il path mantiene il nome storico solo per compatibilita' con il codice esistente; il provider effettivo e' Brevo.

Metodo di autenticazione consigliato nella UI Brevo: **Token**. Brevo invia il valore come Bearer token e l'applicazione lo confronta con `BREVO_WEBHOOK_SECRET`:

```text
Authorization: Bearer <stesso valore di BREVO_WEBHOOK_SECRET>
```

Per compatibilita' il codice accetta anche `x-brevo-webhook-secret` e `api-key` con lo stesso segreto.

Eventi da abilitare almeno:

- hard bounce
- soft bounce
- spam / complaint
- unsubscribe
- blocked / invalid

Gli altri eventi possono restare abilitati: l'handler ignora in sicurezza quelli non gestiti.

L'applicazione mantiene i soft bounce fuori dalla soppressione permanente; hard bounce, complaint e unsubscribe entrano invece nella lista di soppressione e interrompono i follow-up.

## Verifica funzionamento prima della produzione

1. salvare le variabili in Vercel senza copiarle in ticket, commit o documentazione;
2. verificare dominio/mittente in Brevo;
3. configurare il webhook Brevo e il token segreto;
4. dopo ogni modifica a un secret Vercel creare un nuovo deployment di preview, perche' i deployment esistenti mantengono lo snapshot delle variabili al momento del build;
5. attendere il deployment di preview `READY`;
6. testare una sola email transazionale verso un indirizzo controllato;
7. testare una DEM verso un solo destinatario controllato;
8. verificare `List-Unsubscribe`, reply-to e ricezione del webhook;
9. solo dopo i test riabilitare le code automatiche.

## Note operative

- Il controllo `checkEmailProviderHealth()` verifica il relay Brevo prima di estrarre destinatari dalle code DEM.
- Un errore sistemico Brevo mette automaticamente in pausa campagne e follow-up, conservando le code.
- Un guasto Google Workspace non deve fermare le DEM; un guasto Brevo non deve fermare la posta transazionale.
- La vecchia credenziale rimossa dal repository deve essere ruotata anche se non viene piu' usata.
