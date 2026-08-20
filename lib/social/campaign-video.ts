/**
 * Video nei post generati automaticamente dalle campagne.
 *
 * Perche' un modulo a se', e non due righe dentro il generatore: una campagna
 * non e' un post singolo. E' una regola che ogni N giorni genera post da sola,
 * quindi la domanda "quale video usa QUESTA volta" ha bisogno di una risposta
 * deterministica e provabile. Dentro `runCampaign` — che chiama l'IA, Supabase e
 * la libreria — quella regola non sarebbe raggiungibile da alcuna prova.
 *
 * La scelta di fondo, decisa dal committente: una RACCOLTA di video usati A
 * ROTAZIONE. Non un video fisso (dopo tre uscite il canale mostra sempre lo
 * stesso filmato) e non un video generato dall'IA a ogni post (costo a ogni
 * uscita e resa imprevedibile).
 *
 * Il video NON si genera: si sceglie da materiale che esiste gia'. La libreria
 * `youtube_videos` ne conteneva 14 visibili al momento di scrivere questo
 * modulo, quindi chiedere di ricaricarli sarebbe stato lavoro inutile.
 */

import { isYoutubeUrl, youtubeThumbnail, type MediaKind } from "@/lib/social/video"

/** Un video della libreria, ridotto a cio' che serve per scegliere e pubblicare. */
export interface VideoLibreria {
  /** id YouTube (colonna `video_id` di `youtube_videos`). */
  video_id: string
  title?: string | null
  /** Ordine deciso dall'operatore: governa la rotazione, che non e' casuale. */
  sort_order?: number | null
}

/**
 * Indirizzo YouTube di un video della libreria.
 *
 * La libreria conserva l'ID nudo, non un URL. Ma `resolveMediaKind` pretende un
 * vero indirizzo YouTube — di proposito, altrimenti una parola qualsiasi di 11
 * lettere passerebbe per un video. Quindi l'URL si costruisce qui, in un punto
 * solo.
 */
export function urlVideoLibreria(video: VideoLibreria): string {
  return `https://www.youtube.com/watch?v=${video.video_id}`
}

/**
 * Ordine di rotazione: `sort_order` deciso dall'operatore, a pari merito l'id.
 *
 * Un ordine non univoco renderebbe la rotazione imprevedibile: due video con lo
 * stesso `sort_order` potrebbero scambiarsi di posto fra una generazione e
 * l'altra, e lo stesso indice darebbe video diversi. Il secondo criterio non e'
 * un vezzo, e' cio' che rende la sequenza ripetibile.
 */
export function ordinaPerRotazione(video: VideoLibreria[]): VideoLibreria[] {
  return [...video].sort((a, b) => {
    const sa = a.sort_order ?? 0
    const sb = b.sort_order ?? 0
    if (sa !== sb) return sa - sb
    return a.video_id.localeCompare(b.video_id)
  })
}

/**
 * Sceglie il video di questo post.
 *
 * `indiceGlobale` deve essere un contatore che SOPRAVVIVE fra le esecuzioni
 * (nel generatore e' `posts_generated_count + i`). Se si usasse solo l'indice
 * dentro il lotto, ogni esecuzione ripartirebbe da zero e una campagna che
 * genera 1 post per volta userebbe SEMPRE il primo video: la rotazione
 * esisterebbe nel codice e non nei fatti.
 *
 * Ritorna null se la raccolta e' vuota: in quel caso il post non diventa un
 * video, torna a essere quello di prima (immagine o testo). Meglio nessun video
 * che un post dichiarato "video" e vuoto, che il vincolo del database
 * rifiuterebbe e che si perderebbe in silenzio.
 */
export function scegliVideoARotazione(input: {
  video: VideoLibreria[]
  indiceGlobale: number
}): VideoLibreria | null {
  const ordinati = ordinaPerRotazione(input.video)
  if (ordinati.length === 0) return null
  // Il modulo di un numero negativo in JavaScript e' negativo: senza questa
  // normalizzazione un contatore anomalo darebbe un indice fuori dall'array e
  // quindi `undefined`, cioe' un post senza video invece del primo video.
  const n = ordinati.length
  const i = ((Math.trunc(input.indiceGlobale) % n) + n) % n
  return ordinati[i]
}

/** I campi media di un post, cosi' come vanno scritti in `social_posts`. */
export interface MediaPost {
  video_url: string | null
  media_kind: MediaKind | null
  post_type: "video" | "image" | "text"
  media_priority: "video" | "image" | "link"
  image_url: string | null
}

/**
 * Traduce la scelta in campi del post.
 *
 * I quattro campi si decidono INSIEME, qui, e non sparsi nel generatore: sono
 * legati da vincoli del database che si contraddicono facilmente. In
 * particolare un post con `post_type='video'` senza `video_url` viene rifiutato
 * — ed e' giusto che lo sia, ma va evitato prima, non scoperto all'inserimento.
 *
 * Per un video YouTube la miniatura diventa `image_url`: e' la copertina, non
 * un secondo media. `resolveMediaKind` dichiara infatti che quando c'e' un
 * video l'immagine e' al massimo una copertina.
 */
export function mediaDelPost(input: {
  video: VideoLibreria | null
  /** L'immagine che il post avrebbe avuto senza video (asset di marca). */
  imageUrl: string | null
  linkUrl?: string | null
}): MediaPost {
  const { video, imageUrl } = input

  if (video) {
    const url = urlVideoLibreria(video)
    // Difesa contro un id malformato nella libreria: se l'URL costruito non e'
    // un vero indirizzo YouTube non si spaccia il post per video, si torna al
    // comportamento di prima. Un id sbagliato non deve produrre un post rotto.
    if (isYoutubeUrl(url)) {
      return {
        video_url: url,
        media_kind: "youtube",
        post_type: "video",
        media_priority: "video",
        image_url: youtubeThumbnail(url) ?? imageUrl,
      }
    }
  }

  // Nessun video: esattamente il comportamento precedente.
  return {
    video_url: null,
    media_kind: imageUrl ? "image" : null,
    post_type: imageUrl ? "image" : "text",
    media_priority: imageUrl ? "image" : input.linkUrl ? "link" : "image",
    image_url: imageUrl,
  }
}

/**
 * Le piattaforme di una campagna che NON riceveranno il video della libreria.
 *
 * Serve per dirlo all'operatore mentre configura, non dopo. I video della
 * libreria sono link YouTube, e Instagram non li accetta: per un Reel serve il
 * file video. Una campagna con Instagram spuntato e i video accesi pubblicherebbe
 * su Facebook e LinkedIn e su Instagram niente — un'assenza silenziosa, che e'
 * il difetto peggiore perche' non fa rumore.
 *
 * Non decide nulla: descrive. La decisione resta di `canPublish`.
 */
export function piattaformeSenzaVideoLibreria(piattaforme: string[] | null | undefined): string[] {
  return (piattaforme ?? []).filter((p) => p === "instagram")
}
