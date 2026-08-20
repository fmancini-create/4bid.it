-- Video nelle campagne: raccolta usata a rotazione.
--
-- APPLICATA il 20/08/2026 su approvazione esplicita del committente.
-- Additiva: nessun rename, nessun drop, nessuna riga modificata.
-- Misurato PRIMA:  5 campagne, 0 con i video accesi, impronta 2c4acb58e16a7cf602132a15b9e84043
-- Misurato DOPO:   5 campagne, 5 con lista vuota,     impronta 2c4acb58e16a7cf602132a15b9e84043 (IDENTICA)
--
-- Il file sta nel deposito perche' un vincolo (o una colonna) che vive solo nel
-- database e' un divario che nessuno vede: nella PR #227 una migrazione era
-- applicata solo in parte e il pezzo mancante non faceva rumore.
--
-- CONTESTO. `use_library_video` esisteva GIA' dalla migrazione del 19/08
-- (punto 4), ma era una colonna MORTA: la cercavo nel codice e non compariva in
-- nessun file, solo nel proprio SQL di creazione. Un interruttore dichiarato nel
-- database e ignorato dal codice e' peggio di un interruttore assente, perche'
-- sembra una funzione che c'e' e non lo e'.
--
-- Qui si aggiunge la sola cosa che mancava: QUALI video usa la campagna.
-- Il video non si genera, si sceglie: la libreria `youtube_videos` conteneva 14
-- video visibili, quindi chiedere di ricaricarli sarebbe stato lavoro inutile.
alter table public.social_topic_rules
  add column if not exists video_ids text[] not null default '{}'::text[];

-- Semantica della lista VUOTA, dichiarata qui perche' e' esattamente il punto
-- dove ci si sbaglia: VUOTA significa "tutti i video visibili della libreria",
-- non "nessun video". E' la stessa convenzione di `target_accounts`, dove la
-- lista vuota vale "tutti gli account attivi" — una regola che in passato ho
-- scritto al contrario, facendo promettere all'interfaccia canali che non
-- ricevevano nulla. Scriverla al contrario qui spegnerebbe la funzione proprio
-- quando l'operatore non ha ancora scelto nulla.
comment on column public.social_topic_rules.video_ids is
  'Video YouTube (colonna video_id di youtube_videos) usati a rotazione dalla campagna. Lista VUOTA = tutti i video visibili della libreria. Ha effetto solo se use_library_video = true.';

comment on column public.social_topic_rules.use_library_video is
  'Se true, i post generati da questa campagna usano un video della libreria a rotazione invece dell''immagine di marca. Spento di default.';

-- NOTA sui vincoli che governano i post generati, gia' presenti da 19/08:
--   social_posts_video_coerente   post_type='video' pretende video_url oppure
--                                 media_kind='youtube'
--   social_posts_media_kind_check media_kind in (image, video, youtube)
--   social_posts_post_type_check  post_type ammette 'video'
-- Il generatore scrive video_url + media_kind='youtube', quindi li soddisfa.
-- Se la raccolta e' vuota il post TORNA a essere immagine/testo: meglio nessun
-- video che un post dichiarato "video" e vuoto, che il vincolo rifiuterebbe e
-- che si perderebbe in silenzio.
