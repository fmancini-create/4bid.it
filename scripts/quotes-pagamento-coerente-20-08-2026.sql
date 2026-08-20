-- Preventivi: chiude il buco latente dei solleciti.
-- Applicata al database il 20/08/2026. Versionata qui perche' un vincolo che
-- vive solo nel database e' invisibile a chi legge il deposito.
--
-- IL PROBLEMA
-- Il cron dei solleciti (app/api/cron/quote-reminders/route.ts) filtra con:
--     .neq("payment_status", "paid")   ->   payment_status <> 'paid'
-- In SQL, su una riga con payment_status NULL quel confronto non vale ne' vero
-- ne' falso: vale NULL, e una riga che non risulta vera viene SCARTATA.
-- Risultato: nessun sollecito, per sempre, senza alcun errore.
--
-- Il cruscotto (app/admin/.../quotes-dashboard.tsx) risponde alla stessa domanda
-- in JavaScript: `payment_status !== "paid"`, che su null e' VERO, quindi mostra
-- il preventivo fra quelli da pagare. Due luoghi, due risposte OPPOSTE sullo
-- stesso dato: il cruscotto lo mostra in attesa, il cron non gli manda nulla.
--
-- E' la forma peggiore di guasto: un sollecito che non parte non fa rumore. Nel
-- cron c'e' perfino un commento che dice che quel percorso esiste proprio perche'
-- "chi accettava e non pagava non riceveva piu' nulla" -- lo stesso sintomo che
-- il filtro puo' reintrodurre.
--
-- STESSA FAMIGLIA della trappola su social_posts_video_coerente: in SQL NULL non
-- significa "falso", significa "non so", e il "non so" viene filtrato via sia da
-- `=` sia da `<>`. La' un CHECK che valeva NULL era considerato soddisfatto; qui
-- una riga con NULL viene considerata non idonea. Stessa causa, effetti opposti,
-- e in entrambi i casi nessun errore: solo un'assenza.
--
-- LA CORREZIONE
-- Invece di rincorrere ogni filtro, si rende impossibile la riga ambigua: se un
-- preventivo e' arrivato a 'accepted' o 'paid' il ciclo di pagamento e' iniziato,
-- quindi payment_status deve esistere.
--
-- MISURATO PRIMA DI APPLICARE
--   4 righe in tabella, ZERO violerebbero il vincolo  => additivo, nessun dato
--   toccato. Nessun preventivo cadeva ancora nel buco: i 3 con payment_status
--   NULL sono in stato 'sent', quindi il cron li escludeva per il motivo giusto.
--   La protezione stava nel CODICE (la rotta di accettazione si ricorda di
--   impostare payment_status), non nel database: un percorso di scrittura nuovo
--   avrebbe potuto riaprire il buco in silenzio.
--
-- VERIFICATO CHE NON BLOCCA I FLUSSI LEGITTIMI
--   - la creazione di un preventivo nasce 'draft' (app/api/quotes/route.ts)
--   - l'unico punto che scrive 'accepted' imposta payment_status nello stesso
--     update: 'awaiting_transfer' oppure 'pending'
--     (app/api/quotes/shared/[token]/accept/route.ts)
--   - i due punti che scrivono 'paid' impostano payment_status='paid' nello
--     stesso update (app/api/quotes/[id]/payment, app/api/quotes/webhook)
--
-- NOTA sul coalesce: qui `status` e' NOT NULL, quindi coalesce e' difensivo, non
-- indispensabile. Lo tengo perche' se un domani la colonna diventasse annullabile
-- il vincolo continuerebbe a valere TRUE o FALSE, mai NULL. Il NULL che conta in
-- questo vincolo e' su payment_status, gestito con `is not null`, che e' sicuro
-- rispetto ai NULL (a differenza di `<> 'paid'`).
--
-- COME E' PROVATO
--   npm run check:vincolo-pagamento   (7 casi: 2 da rifiutare, 5 da accettare,
--   righe di prova sempre cancellate; verifica anche il NOME del vincolo che
--   morde, altrimenti un rifiuto per un altro motivo sembrerebbe una prova
--   riuscita). Provato che sa fallire: rimosso il vincolo -> uscita 1 con rosso
--   sulle 2 prove che contano; ripristinato -> uscita 0. Dati integri: 4 righe
--   prima e dopo.

alter table public.sales_channel_quotes
  drop constraint if exists sales_channel_quotes_pagamento_coerente;

alter table public.sales_channel_quotes
  add  constraint sales_channel_quotes_pagamento_coerente
  check (
    coalesce(status, '') not in ('accepted', 'paid')
    or payment_status is not null
  );
