# Architettura fiscale dei prodotti 4BID

Ultimo aggiornamento: 2026-09-05

4BID adotta un'architettura fiscale centralizzata per i propri prodotti software.

- **HotelProfitAI** e' l'hub fiscale della suite.
- I singoli prodotti gestiscono i rispettivi pagamenti e servizi, mentre gli eventi necessari alla fatturazione vengono centralizzati nell'hub fiscale.
- **FattureInCloud** e' il provider utilizzato per la gestione dei documenti fiscali e il successivo canale verso SDI.
- Per le fatture clienti ordinarie l'invio allo SDI resta un'operazione manuale effettuata in FattureInCloud.
- HotelProfitAI sincronizza successivamente i documenti e gli stati disponibili dal provider, mantenendo una sola rappresentazione riconciliata della fattura.

Questa pagina descrive esclusivamente la responsabilita' funzionale. Endpoint, credenziali, chiavi, identificativi interni e dettagli di sicurezza non devono essere pubblicati in questo repository.