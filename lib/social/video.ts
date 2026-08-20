/**
 * Decide UNA VOLTA SOLA che tipo di media ha un post social e se e' pubblicabile
 * su ciascuna piattaforma.
 *
 * Perche' un modulo a se': i tre pubblicatori (Instagram, Facebook, LinkedIn)
 * hanno regole diverse e incompatibili fra loro. Se ognuno decidesse da solo
 * "questo e' un video", basterebbe un controllo diverso in un punto per avere un
 * video spacciato per foto su un canale e non sull'altro. Qui la decisione e'
 * una, e i pubblicatori la ricevono.
 *
 * Il vincolo che governa tutto, misurato e non supposto: un LINK YouTube non e'
 * un file video. Instagram e Facebook caricano BYTE (o scaricano un URL di file
 * diretto); non sanno cosa sia una pagina di YouTube. Quindi:
 *   - file video (mp4/mov)  -> Reel Instagram, video Facebook, upload LinkedIn
 *   - link YouTube          -> SOLO LinkedIn e Facebook, come articolo/anteprima
 * Dire all'operatore che un video YouTube "va su Instagram" sarebbe una bugia:
 * la pubblicazione fallirebbe al momento dell'invio, cioe' troppo tardi.
 */

import { parseYoutubeId } from "@/lib/videos/youtube"

/** Tipo di media di un post, deciso qui e scritto in `social_posts.media_kind`. */
export type MediaKind = "image" | "video" | "youtube"

export type Platform = "instagram" | "facebook" | "linkedin"

/**
 * Limite di dimensione per i video caricati.
 *
 * Non e' un numero arbitrario: il file viene letto dal server per essere
 * inoltrato a LinkedIn e a Facebook, quindi finisce in memoria. 200 MB e' il
 * tetto dichiarato, cosi' un file enorme viene RIFIUTATO SUBITO con un messaggio
 * chiaro invece di far fallire la pubblicazione a meta' strada.
 */
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024

/** Estensioni video accettate: quelle che Instagram e Facebook sanno leggere. */
export const VIDEO_EXTENSIONS = ["mp4", "mov"] as const

/** Tipi MIME accettati in caricamento. */
export const VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime"] as const

/** Estensioni immagine, per distinguere i due casi senza indovinare. */
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"] as const

/** Estrae l'estensione da un URL ignorando query string e frammento. */
function extensionOf(url: string): string | null {
  try {
    const path = url.startsWith("http") ? new URL(url).pathname : url.split("?")[0]
    const m = path.toLowerCase().match(/\.([a-z0-9]+)$/)
    return m ? m[1] : null
  } catch {
    const m = url.toLowerCase().split("?")[0].match(/\.([a-z0-9]+)$/)
    return m ? m[1] : null
  }
}

/** Vero se l'URL punta a un FILE video (non a una pagina che contiene un video). */
export function isVideoFileUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const ext = extensionOf(url)
  return ext !== null && (VIDEO_EXTENSIONS as readonly string[]).includes(ext)
}

/** Vero se l'URL punta a un file immagine. */
export function isImageFileUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const ext = extensionOf(url)
  return ext !== null && (IMAGE_EXTENSIONS as readonly string[]).includes(ext)
}

/** Vero se l'URL e' un video YouTube (pagina, non file). */
export function isYoutubeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  // parseYoutubeId accetta anche un ID nudo di 11 caratteri: qui pretendiamo un
  // vero indirizzo YouTube, altrimenti una parola qualsiasi di 11 lettere
  // passerebbe per un video.
  if (!/youtube\.com|youtu\.be/i.test(url)) return false
  return parseYoutubeId(url) !== null
}

/** URL di embed di un video YouTube, per l'anteprima nell'interfaccia. */
export function youtubeEmbedUrl(url: string): string | null {
  const id = parseYoutubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}

/** Miniatura di un video YouTube: usata come immagine di anteprima del post. */
export function youtubeThumbnail(url: string): string | null {
  const id = parseYoutubeId(url)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}

export interface PostMedia {
  videoUrl?: string | null
  imageUrl?: string | null
}

/**
 * Decide il tipo di media di un post. Un solo punto di verita'.
 * L'ordine conta: il video vince sull'immagine, perche' quando c'e' un video
 * l'immagine e' al massimo una copertina.
 */
export function resolveMediaKind(media: PostMedia): MediaKind | null {
  const { videoUrl, imageUrl } = media
  if (videoUrl) {
    if (isYoutubeUrl(videoUrl)) return "youtube"
    if (isVideoFileUrl(videoUrl)) return "video"
    // Un videoUrl che non e' ne' YouTube ne' un file riconoscibile non viene
    // promosso a "video": meglio nessun media che un media che fallira'.
    return imageUrl ? "image" : null
  }
  return imageUrl ? "image" : null
}

export interface Publishability {
  /** Vero se il post puo' essere pubblicato su questa piattaforma. */
  ok: boolean
  /** Come esce: video nativo, link, foto, o solo testo. */
  as: "video" | "link" | "image" | "text"
  /** Motivo del rifiuto, in italiano, per l'operatore. */
  reason?: string
}

/**
 * Dice se e COME un post esce su una piattaforma.
 *
 * Questa funzione e' il motivo per cui l'interfaccia puo' avvisare PRIMA, invece
 * di far scoprire il problema dall'errore di pubblicazione.
 */
export function canPublish(
  platform: Platform,
  kind: MediaKind | null,
  opts: { hasLink?: boolean; hasText?: boolean } = {},
): Publishability {
  const hasLink = Boolean(opts.hasLink)

  if (platform === "instagram") {
    // Instagram pubblica SOLO media veri: nessun post di solo testo, nessun link.
    if (kind === "video") return { ok: true, as: "video" }
    if (kind === "image") return { ok: true, as: "image" }
    if (kind === "youtube") {
      return {
        ok: false,
        as: "text",
        reason:
          "Instagram non accetta i link YouTube: per un Reel serve il file video. Carica il file oppure togli Instagram da questo post.",
      }
    }
    return { ok: false, as: "text", reason: "Instagram richiede un'immagine o un video." }
  }

  if (platform === "facebook") {
    if (kind === "video") return { ok: true, as: "video" }
    if (kind === "youtube") return { ok: true, as: "link" } // anteprima del link
    if (kind === "image") return { ok: true, as: "image" }
    if (hasLink) return { ok: true, as: "link" }
    return { ok: true, as: "text" }
  }

  // LinkedIn
  if (kind === "video") return { ok: true, as: "video" }
  if (kind === "youtube") return { ok: true, as: "link" }
  if (hasLink) return { ok: true, as: "link" }
  return { ok: true, as: "text" }
}

const NOMI_PIATTAFORMA: Record<Platform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
}

/**
 * Dove uscira' DAVVERO un post con un link YouTube, e dove no.
 *
 * Serve perche' l'avviso all'operatore non puo' basarsi sulle piattaforme
 * spuntate: quello che conta e' avere una DESTINAZIONE scelta. Un canale
 * spuntato ma senza pagina/account selezionato non riceve niente, e nominarlo
 * sarebbe una promessa falsa — l'avviso diceva "uscira' su Facebook e LinkedIn"
 * anche quando nessuna destinazione era stata scelta.
 *
 * Restituisce i soli canali che hanno una destinazione E accettano il media.
 */
export function destinazioniEffettive(input: {
  piattaforme: Platform[]
  kind: MediaKind | null
  /**
   * id delle destinazioni scelte, per piattaforma.
   *
   * ATTENZIONE alla lista VUOTA: non significa "nessuna destinazione", significa
   * "tutte le destinazioni attive di quel canale". E' la regola della rotta di
   * pubblicazione, che filtra gli account solo quando la lista e' piena. Va
   * rispecchiata qui, altrimenti l'avviso direbbe che un canale non riceve nulla
   * proprio mentre riceve tutto.
   */
  destinazioniPerPiattaforma: Partial<Record<Platform, string[]>>
  /** Piattaforme che non hanno alcun account collegato: quelle davvero non ricevono. */
  senzaAccountCollegato?: Platform[]
  hasLink?: boolean
}): { escono: string[]; escluse: string[] } {
  const escono: string[] = []
  const escluse: string[] = []
  const senzaAccount = new Set(input.senzaAccountCollegato ?? [])

  for (const p of input.piattaforme) {
    // Un canale senza NESSUN account collegato non riceve nulla, qualunque sia
    // il formato: non va nominato, ne' fra chi esce ne' fra chi e' escluso.
    if (senzaAccount.has(p)) continue

    const esito = canPublish(p, input.kind, { hasLink: input.hasLink })
    if (esito.ok) escono.push(NOMI_PIATTAFORMA[p])
    else escluse.push(NOMI_PIATTAFORMA[p])
  }

  return { escono, escluse }
}

/**
 * Oltre questo tempo un Reel in elaborazione viene dichiarato fallito, invece di
 * restare "in corso" per sempre agli occhi dell'operatore.
 */
export const LIMITE_ATTESA_MS = 2 * 60 * 60 * 1000

export type StatoPost = "processing" | "published" | "failed"

/**
 * Decide lo stato di un post dopo un tentativo di pubblicazione.
 *
 * Vive qui, come funzione pura, per due ragioni. La prima: gli esiti sono TRE e
 * la stessa decisione serve alla pubblicazione manuale e al cron — duplicarla
 * significherebbe farle divergere. La seconda, piu' importante: dentro la rotta
 * questa logica non era provabile, e due sabotaggi (un Reel in elaborazione
 * dichiarato "failed", e l'istante di avvio riscritto a ogni giro cosi' che il
 * limite non scade mai) sono sfuggiti proprio per questo. Una regola che nessuna
 * prova puo' raggiungere non e' protetta.
 */
export function decidiStatoPost(input: {
  qualcosaPubblicato: boolean
  inAttesa: boolean
  avviatoIl?: string | null
  adesso?: number
}): { stato: StatoPost; scaduto: boolean } {
  const { qualcosaPubblicato, inAttesa } = input
  const adesso = input.adesso ?? Date.now()
  const avviato = input.avviatoIl ? Date.parse(input.avviatoIl) : 0

  // L'attesa scaduta chiude il caso: senza questo un container che Meta non
  // finisce mai terrebbe il post appeso per sempre.
  if (inAttesa && avviato > 0 && adesso - avviato > LIMITE_ATTESA_MS) {
    return { stato: qualcosaPubblicato ? "published" : "failed", scaduto: true }
  }
  if (inAttesa) return { stato: "processing", scaduto: false }
  return { stato: qualcosaPubblicato ? "published" : "failed", scaduto: false }
}

/**
 * L'istante di avvio dell'attesa: si CONSERVA quello originale.
 * Riscriverlo a ogni giro del cron azzererebbe il conto alla rovescia e il
 * limite delle 2 ore non scadrebbe mai.
 */
export function avvioAttesa(esistente: string | null | undefined, adesso = new Date()): string {
  return esistente || adesso.toISOString()
}

/** Errore di validazione di un file in caricamento, in italiano. */
export function validateVideoUpload(file: { size: number; type: string; name: string }): string | null {
  const estensione = extensionOf(file.name)
  const extOk = (VIDEO_EXTENSIONS as readonly string[]).includes(estensione || "")
  const mimeOk = (VIDEO_MIME_TYPES as readonly string[]).includes(file.type)

  // L'estensione e' OBBLIGATORIA; il MIME, se dichiarato, non deve contraddirla.
  //
  // Con un `||` bastava che uno solo dei due fosse buono: un `virus.exe` con type
  // "video/mp4" passava, perche' il type lo dichiara il browser ed e' la parte
  // falsificabile. Ma preteserli entrambi rifiutava un `.mp4` legittimo quando il
  // browser non dichiara alcun MIME (caso misurato con una sonda: succede).
  //
  // Quindi: il nome deve finire in mp4/mov, e un MIME presente deve essere fra
  // quelli ammessi. Il MIME vuoto e' tollerato, il MIME sbagliato no.
  if (!extOk || (file.type !== "" && !mimeOk)) {
    return `Formato non supportato. Sono ammessi solo ${VIDEO_EXTENSIONS.join(" e ")} (Instagram e Facebook non leggono altri formati).`
  }
  if (file.size > MAX_VIDEO_BYTES) {
    const mb = Math.round(file.size / 1024 / 1024)
    return `Il video pesa ${mb} MB e supera il limite di ${MAX_VIDEO_BYTES / 1024 / 1024} MB. Il file viene caricato dal server verso LinkedIn e Facebook, quindi oltre questa soglia la pubblicazione fallirebbe.`
  }
  if (file.size === 0) {
    return "Il file e' vuoto."
  }
  return null
}
