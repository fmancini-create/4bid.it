import { describe, it, expect } from "vitest"
import {
  LIMITE_ATTESA_MS,
  MAX_VIDEO_BYTES,
  type Platform,
  avvioAttesa,
  canPublish,
  decidiStatoPost,
  destinazioniEffettive,
  isVideoFileUrl,
  isYoutubeUrl,
  resolveMediaKind,
  validateVideoUpload,
  youtubeThumbnail,
} from "@/lib/social/video"

/**
 * Prove sul giudice unico del tipo di media.
 *
 * Il punto delicato non e' "riconosce un mp4": e' che la MEDESIMA funzione
 * risponda a interfaccia, pubblicazione manuale e cron. Se divergessero,
 * l'anteprima potrebbe promettere un Reel dove il server pubblica un link.
 */
describe("resolveMediaKind", () => {
  it("un file video vince sull'immagine (l'immagine diventa copertina)", () => {
    expect(resolveMediaKind({ videoUrl: "https://blob.vercel-storage.com/a.mp4", imageUrl: "https://x/y.jpg" })).toBe(
      "video",
    )
  })

  it("riconosce il .mov anche con parametri di query nell'indirizzo", () => {
    expect(resolveMediaKind({ videoUrl: "https://blob.vercel-storage.com/a.mov?v=2" })).toBe("video")
  })

  it("un link YouTube NON e' un file video", () => {
    expect(resolveMediaKind({ videoUrl: "https://www.youtube.com/watch?v=abc12345678" })).toBe("youtube")
  })

  it("senza alcun media restituisce null, non 'image'", () => {
    // Un post di solo testo non deve dichiararsi immagine: altrimenti
    // Instagram lo accetterebbe in teoria e fallirebbe in pratica.
    expect(resolveMediaKind({})).toBeNull()
  })

  it("un indirizzo che non e' ne' video ne' youtube non diventa video", () => {
    expect(resolveMediaKind({ videoUrl: "https://example.com/pagina.html" })).toBeNull()
  })

  // Un indirizzo su dominio youtube.com che punta a un FILE (nessun ID di video)
  // non e' una pagina YouTube: e' un file, e va trattato come tale. Misurato,
  // non supposto: `isYoutubeUrl` pretende un ID valido, non solo il dominio.
  //
  // Da qui una conseguenza utile: i due controlli sono mutuamente esclusivi, cioe'
  // quando uno e' vero l'altro e' falso. Il loro ORDINE in resolveMediaKind non
  // cambia dunque alcun risultato. Lo lascio scritto perche' invertirlo sembra un
  // difetto e non lo e' — e perche' se un domani un controllo si allargasse fino a
  // sovrapporsi all'altro, questa prova cadrebbe segnalando che l'ordine e'
  // diventato importante.
  it("su youtube.com un file senza ID di video resta un file", () => {
    expect(resolveMediaKind({ videoUrl: "https://youtube.com/file.mp4" })).toBe("video")
    expect(isYoutubeUrl("https://youtube.com/file.mp4")).toBe(false)
  })

  it("i due riconoscimenti non si sovrappongono mai (l'ordine non conta)", () => {
    const casi = [
      "https://www.youtube.com/watch?v=abc12345678",
      "https://youtu.be/abc12345678",
      "https://youtube.com/file.mp4",
      "https://blob.vercel-storage.com/a.mp4",
      "https://example.com/pagina.html",
    ]
    for (const u of casi) {
      expect(isYoutubeUrl(u) && isVideoFileUrl(u), `si sovrappongono su ${u}`).toBe(false)
    }
  })
})

describe("isYoutubeUrl / youtubeThumbnail", () => {
  it("accetta youtu.be e youtube.com, rifiuta un dominio che li contiene", () => {
    expect(isYoutubeUrl("https://youtu.be/abc12345678")).toBe(true)
    expect(isYoutubeUrl("https://www.youtube.com/watch?v=abc12345678")).toBe(true)
    // Difesa contro il dominio civetta: "youtube.com.malware.example" NON e' YouTube.
    expect(isYoutubeUrl("https://youtube.com.malware.example/watch?v=x")).toBe(false)
    // Buco trovato da un sabotaggio: senza il controllo sul dominio, parseYoutubeId
    // accetta un ID nudo di 11 caratteri, quindi una parola qualsiasi di 11 lettere
    // passava per un video. La prova sul dominio civetta non lo coglieva, perche'
    // quell'indirizzo falliva comunque sull'ID.
    expect(isYoutubeUrl("undecidable")).toBe(false)
    expect(isYoutubeUrl("abcdefghijk")).toBe(false)
  })

  it("la miniatura si ricava dall'identificativo del video", () => {
    const t = youtubeThumbnail("https://www.youtube.com/watch?v=abc12345678")
    expect(t).toContain("abc12345678")
  })
})

describe("canPublish", () => {
  it("Instagram RIFIUTA un link YouTube dichiarando il perche'", () => {
    const r = canPublish("instagram", "youtube", { hasLink: false })
    expect(r.ok).toBe(false)
    // Il messaggio deve spiegare, non solo negare.
    expect(r.reason).toMatch(/file video|Reel/i)
  })

  it("Instagram accetta un file video (Reel)", () => {
    expect(canPublish("instagram", "video", { hasLink: false }).ok).toBe(true)
  })

  it("Instagram rifiuta un post di solo testo", () => {
    expect(canPublish("instagram", null, { hasLink: false }).ok).toBe(false)
  })

  it("Facebook e LinkedIn accettano il link YouTube", () => {
    expect(canPublish("facebook", "youtube", { hasLink: false }).ok).toBe(true)
    expect(canPublish("linkedin", "youtube", { hasLink: false }).ok).toBe(true)
  })
})

describe("validateVideoUpload", () => {
  it("accetta un mp4 di dimensione normale", () => {
    expect(validateVideoUpload({ size: 5_000_000, type: "video/mp4", name: "clip.mp4" })).toBeNull()
  })

  it("rifiuta un file oltre il limite dichiarando il limite", () => {
    const e = validateVideoUpload({ size: MAX_VIDEO_BYTES + 1, type: "video/mp4", name: "grosso.mp4" })
    expect(e).not.toBeNull()
    expect(e).toMatch(/200/)
  })

  it("rifiuta un ineseguibile travestito da video", () => {
    // Il tipo dichiarato dal browser non basta: conta anche l'estensione.
    expect(validateVideoUpload({ size: 1000, type: "video/mp4", name: "virus.exe" })).not.toBeNull()
  })

  it("rifiuta un'immagine passata al caricamento video", () => {
    expect(validateVideoUpload({ size: 1000, type: "image/jpeg", name: "foto.jpg" })).not.toBeNull()
  })

  // Casi trovati con una sonda mentre correggevo il controllo: il primo tentativo
  // pretendeva estensione E mime, e rifiutava file legittimi. Restano qui perche'
  // un irrigidimento futuro del controllo li romperebbe di nuovo in silenzio.
  it("accetta un .mov che il browser dichiara video/mp4 (iPhone/Safari)", () => {
    expect(validateVideoUpload({ size: 1000, type: "video/mp4", name: "clip.mov" })).toBeNull()
  })

  it("accetta un .mp4 quando il browser non dichiara alcun tipo", () => {
    expect(validateVideoUpload({ size: 1000, type: "", name: "clip.mp4" })).toBeNull()
  })

  it("accetta l'estensione in maiuscolo", () => {
    expect(validateVideoUpload({ size: 1000, type: "video/mp4", name: "CLIP.MP4" })).toBeNull()
  })

  it("rifiuta un .mp4 con tipo dichiarato eseguibile", () => {
    expect(validateVideoUpload({ size: 1000, type: "application/x-msdownload", name: "clip.mp4" })).not.toBeNull()
  })
})

/**
 * Prove sulla logica di stato del Reel.
 *
 * Non c'erano, e due sabotaggi su questa logica sono sfuggiti. E' la parte che
 * protegge il video GIA' CARICATO su Meta: se un Reel in elaborazione viene
 * dichiarato "failed", l'operatore vede un errore su un video che sta uscendo, e
 * il container viene abbandonato.
 */
describe("decidiStatoPost", () => {
  const ORA = Date.parse("2026-08-19T12:00:00Z")

  it("un Reel in elaborazione NON e' un fallimento", () => {
    const r = decidiStatoPost({ qualcosaPubblicato: false, inAttesa: true, avviatoIl: null, adesso: ORA })
    expect(r.stato).toBe("processing")
    expect(r.scaduto).toBe(false)
  })

  it("in elaborazione resta 'processing' anche se un altro canale ha gia' pubblicato", () => {
    // Caso reale: Facebook esce subito, Instagram sta elaborando. Dichiararlo
    // "published" chiuderebbe il post e il Reel non verrebbe mai ripreso.
    const r = decidiStatoPost({ qualcosaPubblicato: true, inAttesa: true, avviatoIl: null, adesso: ORA })
    expect(r.stato).toBe("processing")
  })

  it("senza attese e senza pubblicazioni e' 'failed'", () => {
    expect(decidiStatoPost({ qualcosaPubblicato: false, inAttesa: false, adesso: ORA }).stato).toBe("failed")
  })

  it("senza attese e con almeno una pubblicazione e' 'published'", () => {
    expect(decidiStatoPost({ qualcosaPubblicato: true, inAttesa: false, adesso: ORA }).stato).toBe("published")
  })

  it("oltre il limite l'attesa scade: il post non resta appeso per sempre", () => {
    const vecchio = new Date(ORA - LIMITE_ATTESA_MS - 1000).toISOString()
    const r = decidiStatoPost({ qualcosaPubblicato: false, inAttesa: true, avviatoIl: vecchio, adesso: ORA })
    expect(r.stato).toBe("failed")
    expect(r.scaduto).toBe(true)
  })

  it("appena prima del limite l'attesa continua", () => {
    const quasi = new Date(ORA - LIMITE_ATTESA_MS + 1000).toISOString()
    const r = decidiStatoPost({ qualcosaPubblicato: false, inAttesa: true, avviatoIl: quasi, adesso: ORA })
    expect(r.stato).toBe("processing")
    expect(r.scaduto).toBe(false)
  })
})

/**
 * Prove sull'avviso dei link YouTube.
 *
 * Difetto trovato guardando la pagina vera: l'avviso prometteva "uscira' su
 * Facebook e LinkedIn" basandosi sulle piattaforme SPUNTATE, e restava identico
 * anche quando Instagram non aveva destinazioni. Una frase che l'operatore legge
 * prima di premere "Pubblica" non puo' nominare canali a caso.
 */
describe("destinazioniEffettive", () => {
  const TUTTE: Platform[] = ["facebook", "instagram", "linkedin"]

  it("con un link YouTube: Instagram escluso, gli altri due escono", () => {
    const r = destinazioniEffettive({ piattaforme: TUTTE, kind: "youtube", destinazioniPerPiattaforma: {} })
    expect(r.escluse).toEqual(["Instagram"])
    expect(r.escono).toEqual(["Facebook", "LinkedIn"])
  })

  it("un canale senza account collegato non viene nominato affatto", () => {
    // Ne' fra chi esce ne' fra chi e' escluso: non riceve nulla comunque, e
    // nominarlo confonderebbe il motivo (formato contro collegamento assente).
    const r = destinazioniEffettive({
      piattaforme: TUTTE,
      kind: "youtube",
      destinazioniPerPiattaforma: {},
      senzaAccountCollegato: ["linkedin"],
    })
    expect(r.escono).toEqual(["Facebook"])
    expect(r.escluse).toEqual(["Instagram"])
  })

  it("se c'e' solo Instagram e il media e' YouTube, non esce nulla", () => {
    const r = destinazioniEffettive({ piattaforme: ["instagram"], kind: "youtube", destinazioniPerPiattaforma: {} })
    expect(r.escono).toEqual([])
    expect(r.escluse).toEqual(["Instagram"])
  })

  it("con un file video nessuno viene escluso: il Reel si puo' fare", () => {
    const r = destinazioniEffettive({ piattaforme: TUTTE, kind: "video", destinazioniPerPiattaforma: {} })
    expect(r.escluse).toEqual([])
    expect(r.escono).toEqual(["Facebook", "Instagram", "LinkedIn"])
  })

  // Errore che avevo commesso scrivendo questa funzione: trattare la lista vuota
  // come "nessuna destinazione". La rotta di pubblicazione filtra gli account
  // SOLO quando la lista e' piena, quindi vuota significa "tutti gli attivi".
  it("lista di destinazioni VUOTA significa 'tutti gli account attivi'", () => {
    const vuota = destinazioniEffettive({ piattaforme: TUTTE, kind: "youtube", destinazioniPerPiattaforma: {} })
    const piena = destinazioniEffettive({
      piattaforme: TUTTE,
      kind: "youtube",
      destinazioniPerPiattaforma: { facebook: ["pagina-1"], instagram: ["ig-1"], linkedin: ["li-1"] },
    })
    expect(vuota).toEqual(piena)
  })
})

describe("avvioAttesa", () => {
  it("CONSERVA l'istante originale: altrimenti il limite non scade mai", () => {
    // Questo era il secondo sabotaggio sfuggito. Riscrivendo l'istante a ogni
    // giro del cron, il conto alla rovescia ripartiva da zero ogni volta e il
    // post restava "in elaborazione" per sempre, senza che nulla fallisse.
    const originale = "2026-08-19T10:00:00.000Z"
    expect(avvioAttesa(originale, new Date("2026-08-19T12:00:00Z"))).toBe(originale)
  })

  it("alla prima attesa nasce adesso", () => {
    expect(avvioAttesa(null, new Date("2026-08-19T12:00:00Z"))).toBe("2026-08-19T12:00:00.000Z")
  })
})
