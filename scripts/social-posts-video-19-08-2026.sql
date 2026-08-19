-- Video nei post social programmati.
--
-- APPLICATA il 19/08/2026 su approvazione esplicita del committente.
-- Additiva: nessun rename, nessun drop di colonne, nessuna riga modificata.
-- Verificato prima e dopo: 233 righe, impronta md5 IDENTICA
-- (dad34d9383a2fbca424ba2d9ce5f81c3).
--
-- Perche' era indispensabile: i tre CHECK esistenti RIFIUTAVANO i valori che i
-- requisiti chiedono. Non era questione di aggiungere una colonna comoda:
--   status         non ammetteva 'processing'  -> lo stato "in elaborazione"
--   post_type      non ammetteva 'video'
--   media_priority non ammetteva 'video'
-- Inoltre esisteva solo `image_url`: sui 233 post presenti puntava a un video
-- ZERO volte, quindi riusarla per i video avrebbe significato spacciare un
-- video per una foto, cioe' esattamente cio' che il requisito 7 vieta.

-- 1) Colonne nuove. NULL su tutti i post esistenti, che restano invariati.
alter table public.social_posts
  add column if not exists video_url        text,
  add column if not exists media_kind       text,
  add column if not exists processing_state jsonb default '{}'::jsonb;

-- `processing_state` non e' un vezzo: un Reel Instagram richiede da decine di
-- secondi a minuti di elaborazione, mentre il codice attendeva 10 secondi
-- (5 tentativi x 2s) e poi rinunciava. Senza conservare l'id del container, un
-- video ancora in lavorazione andrebbe perso invece di essere ripreso dal cron.

-- 2) I tre CHECK vengono ALLARGATI: si ricreano con gli stessi valori di prima
--    PIU' quelli nuovi. Nessun valore ammesso in precedenza viene rimosso, cosi'
--    i post esistenti restano tutti validi.
alter table public.social_posts drop constraint if exists social_posts_status_check;
alter table public.social_posts add  constraint social_posts_status_check
  check (status = any (array['draft','pending_approval','approved','scheduled',
                            'processing',              -- NUOVO: requisito 6
                            'published','failed']));

alter table public.social_posts drop constraint if exists social_posts_post_type_check;
alter table public.social_posts add  constraint social_posts_post_type_check
  check (post_type = any (array['text','image','link','carousel',
                               'video']));             -- NUOVO

alter table public.social_posts drop constraint if exists social_posts_media_priority_check;
alter table public.social_posts add  constraint social_posts_media_priority_check
  check (media_priority = any (array['image','link',
                                    'video']));        -- NUOVO

-- 3) Presidio del requisito 7 messo NEL DATABASE, non solo nel codice: un post
--    dichiarato "video" deve avere un video vero (file) oppure essere un link
--    YouTube dichiarato tale. Cosi' nessuna via di scrittura, nemmeno futura,
--    puo' creare un "video" che in realta' e' una foto.
--    Nessuna riga attuale ha post_type='video', quindi e' soddisfatto subito.
alter table public.social_posts drop constraint if exists social_posts_video_coerente;
alter table public.social_posts add  constraint social_posts_video_coerente
  check (post_type <> 'video' or video_url is not null or media_kind = 'youtube');

alter table public.social_posts drop constraint if exists social_posts_media_kind_check;
alter table public.social_posts add  constraint social_posts_media_kind_check
  check (media_kind is null or media_kind = any (array['image','video','youtube']));

-- 4) Requisito 4: i video nei post AUTOMATICI si accendono per singola campagna.
--    SPENTO di default, quindi al momento dell'applicazione nulla cambia: le 5
--    campagne continuano a usare le immagini finche' non lo accendi tu.
--    Verificato dopo l'applicazione: 5 regole, impronta identica, 0 accese.
alter table public.social_topic_rules
  add column if not exists use_library_video boolean not null default false;
