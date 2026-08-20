import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  mediaDelPost,
  ordinaPerRotazione,
  piattaformeSenzaVideoLibreria,
  scegliVideoARotazione,
  urlVideoLibreria,
  type VideoLibreria,
} from "@/lib/social/campaign-video"

/**
 * Prove sui video nelle campagne.
 *
 * Cosa proteggono, in concreto:
 *  - la ROTAZIONE deve davvero ruotare fra le esecuzioni, non solo dentro il
 *    lotto: e' il difetto piu' facile da introdurre e il piu' silenzioso, perche'
 *    un canale che pubblica sempre lo stesso video non da' alcun errore;
 *  - un post non deve MAI dichiararsi "video" senza avere un video: il vincolo
 *    social_posts_video_coerente lo rifiuterebbe e il post si perderebbe;
 *  - con la raccolta vuota il comportamento deve essere ESATTAMENTE quello di
 *    prima (immagine o testo), non un post rotto.
 */

const v = (id: string, sort?: number): VideoLibreria => ({
  video_id: id,
  title: `Video ${id}`,
  sort_order: sort ?? 0,
})

/**
 * Il generatore non e' provabile a unita': chiama l'IA e Supabase. Ma il pezzo
 * che conta e' un solo argomento — il contatore che rende la rotazione vera fra
 * le esecuzioni — e quello si puo' controllare leggendo il codice.
 *
 * I COMMENTI VANNO VIA prima di cercare. Altrimenti la prova misurerebbe la
 * prosa che spiega la regola invece della riga che la applica, e resterebbe
 * verde su un generatore rotto: l'errore che ho gia' commesso, cercando la
 * menzione di un nome invece della riga che decide.
 */
function codiceSenzaCommenti(percorso: string): string {
  const testo = readFileSync(join(process.cwd(), percorso), "utf8")
  return testo
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((r) => !r.trim().startsWith("//"))
    .join("\n")
}

describe("indirizzo del video di libreria", () => {
  it("costruisce un vero indirizzo YouTube dall'id nudo", () => {
    expect(urlVideoLibreria(v("dQw4w9WgXcQ"))).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
  })
})

describe("ordine di rotazione", () => {
  it("segue il sort_order deciso dall'operatore", () => {
    const ord = ordinaPerRotazione([v("bbbbbbbbbbb", 3), v("aaaaaaaaaaa", 1), v("ccccccccccc", 2)])
    expect(ord.map((x) => x.video_id)).toEqual(["aaaaaaaaaaa", "ccccccccccc", "bbbbbbbbbbb"])
  })

  it("a pari sort_order resta RIPETIBILE", () => {
    // Senza un secondo criterio due video con lo stesso sort_order potrebbero
    // scambiarsi di posto: lo stesso indice darebbe video diversi e la rotazione
    // diventerebbe imprevedibile senza mai sbagliare in modo visibile.
    const a = ordinaPerRotazione([v("zzzzzzzzzzz", 5), v("aaaaaaaaaaa", 5)])
    const b = ordinaPerRotazione([v("aaaaaaaaaaa", 5), v("zzzzzzzzzzz", 5)])
    expect(a.map((x) => x.video_id)).toEqual(b.map((x) => x.video_id))
  })

  it("non modifica la lista ricevuta", () => {
    const lista = [v("bbbbbbbbbbb", 2), v("aaaaaaaaaaa", 1)]
    ordinaPerRotazione(lista)
    expect(lista[0].video_id).toBe("bbbbbbbbbbb")
  })
})

describe("scelta del video a rotazione", () => {
  it("avanza con l'indice", () => {
    const video = [v("aaaaaaaaaaa", 1), v("bbbbbbbbbbb", 2), v("ccccccccccc", 3)]
    const scelti = [0, 1, 2, 3, 4].map((i) => scegliVideoARotazione({ video, indiceGlobale: i })?.video_id)
    expect(scelti).toEqual([
      "aaaaaaaaaaa",
      "bbbbbbbbbbb",
      "ccccccccccc",
      "aaaaaaaaaaa",
      "bbbbbbbbbbb",
    ])
  })

  it("CONTINUA fra le esecuzioni, non riparte da zero", () => {
    // Prova centrale. Una campagna che genera 1 post per volta avanza solo se il
    // contatore persistito entra nel calcolo: con il solo indice del lotto
    // (sempre 0) userebbe per sempre il primo video, e nulla lo segnalerebbe.
    const video = [v("aaaaaaaaaaa", 1), v("bbbbbbbbbbb", 2)]
    const esecuzione1 = scegliVideoARotazione({ video, indiceGlobale: 0 + 0 })?.video_id
    const esecuzione2 = scegliVideoARotazione({ video, indiceGlobale: 1 + 0 })?.video_id
    expect(esecuzione1).not.toBe(esecuzione2)
  })

  it("un contatore negativo non produce un post senza video", () => {
    // Il modulo di un negativo in JavaScript e' negativo: senza normalizzazione
    // l'accesso all'array darebbe undefined, cioe' nessun video invece del primo.
    const video = [v("aaaaaaaaaaa", 1), v("bbbbbbbbbbb", 2)]
    const scelto = scegliVideoARotazione({ video, indiceGlobale: -3 })
    expect(scelto).not.toBeNull()
    expect(["aaaaaaaaaaa", "bbbbbbbbbbb"]).toContain(scelto!.video_id)
  })

  it("con raccolta vuota non sceglie nulla", () => {
    expect(scegliVideoARotazione({ video: [], indiceGlobale: 7 })).toBeNull()
  })
})

describe("campi media del post generato", () => {
  it("un video della libreria produce un post video coerente", () => {
    const m = mediaDelPost({ video: v("dQw4w9WgXcQ"), imageUrl: "/logo.png" })
    expect(m.post_type).toBe("video")
    expect(m.media_kind).toBe("youtube")
    expect(m.media_priority).toBe("video")
    expect(m.video_url).toContain("dQw4w9WgXcQ")
    // La miniatura diventa la copertina, non un secondo media.
    expect(m.image_url).toContain("dQw4w9WgXcQ")
  })

  it("post_type='video' implica SEMPRE un video_url", () => {
    // social_posts_video_coerente rifiuta post_type='video' senza video_url:
    // qualunque combinazione deve rispettarlo, altrimenti il post si perde.
    const casi = [
      mediaDelPost({ video: v("dQw4w9WgXcQ"), imageUrl: "/logo.png" }),
      mediaDelPost({ video: v("dQw4w9WgXcQ"), imageUrl: null }),
      mediaDelPost({ video: null, imageUrl: "/logo.png" }),
      mediaDelPost({ video: null, imageUrl: null }),
      mediaDelPost({ video: null, imageUrl: null, linkUrl: "https://4bid.it" }),
    ]
    for (const m of casi) {
      if (m.post_type === "video") expect(m.video_url).toBeTruthy()
    }
  })

  it("media_priority non e' MAI 'text'", () => {
    // Il vincolo social_posts_media_priority_check ammette solo image/link/video.
    const casi = [
      mediaDelPost({ video: v("dQw4w9WgXcQ"), imageUrl: null }),
      mediaDelPost({ video: null, imageUrl: "/logo.png" }),
      mediaDelPost({ video: null, imageUrl: null }),
      mediaDelPost({ video: null, imageUrl: null, linkUrl: "https://4bid.it" }),
    ]
    for (const m of casi) {
      expect(["image", "link", "video"]).toContain(m.media_priority)
    }
  })

  it("media_kind resta nei valori ammessi dal vincolo", () => {
    const casi = [
      mediaDelPost({ video: v("dQw4w9WgXcQ"), imageUrl: null }),
      mediaDelPost({ video: null, imageUrl: "/logo.png" }),
      mediaDelPost({ video: null, imageUrl: null }),
    ]
    for (const m of casi) {
      if (m.media_kind !== null) expect(["image", "video", "youtube"]).toContain(m.media_kind)
    }
  })

  it("senza video il comportamento e' quello di PRIMA: immagine", () => {
    const m = mediaDelPost({ video: null, imageUrl: "/logo.png" })
    expect(m.post_type).toBe("image")
    expect(m.media_priority).toBe("image")
    expect(m.video_url).toBeNull()
    expect(m.image_url).toBe("/logo.png")
  })

  it("senza video e senza immagine: solo testo, come prima", () => {
    const m = mediaDelPost({ video: null, imageUrl: null })
    expect(m.post_type).toBe("text")
    expect(m.video_url).toBeNull()
  })

  it("un id malformato NON viene spacciato per video", () => {
    // Se la libreria contenesse un id rotto, promuovere il post a "video"
    // creerebbe un post che fallisce alla pubblicazione: meglio l'immagine.
    const m = mediaDelPost({ video: { video_id: "non valido!" }, imageUrl: "/logo.png" })
    expect(m.post_type).toBe("image")
    expect(m.video_url).toBeNull()
  })
})

describe("avviso onesto sulle destinazioni", () => {
  it("dichiara Instagram fra i canali che non ricevono il video", () => {
    expect(piattaformeSenzaVideoLibreria(["facebook", "instagram", "linkedin"])).toEqual(["instagram"])
  })

  it("non inventa esclusioni quando Instagram non c'e'", () => {
    expect(piattaformeSenzaVideoLibreria(["facebook", "linkedin"])).toEqual([])
    expect(piattaformeSenzaVideoLibreria(null)).toEqual([])
  })
})

describe("contratto del generatore", () => {
  it("passa alla rotazione il contatore PERSISTITO, non l'indice del lotto", () => {
    // Il difetto che questa prova esiste per fermare: usare solo `i`. La suite
    // resterebbe verde, il codice sembrerebbe giusto, e ogni esecuzione
    // ripartirebbe dal primo video — una rotazione che non ruota.
    const codice = codiceSenzaCommenti("lib/social/campaign-runner.ts")
    expect(codice).toContain("posts_generated_count || 0) + i")
  })

  it("scrive i campi media da un punto solo, senza ricalcolarli a mano", () => {
    // Se il generatore tornasse a comporre post_type/media_priority da se',
    // i vincoli del database potrebbero contraddirsi di nuovo.
    const codice = codiceSenzaCommenti("lib/social/campaign-runner.ts")
    expect(codice).toContain("mediaDelPost(")
    expect(codice).not.toContain('post_type: imageUrl ? "image" : "text"')
  })
})
