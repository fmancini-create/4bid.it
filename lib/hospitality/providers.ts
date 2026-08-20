// Riconoscimento del gestionale (PMS), del motore di prenotazione e del channel
// manager a partire da quello che una struttura pubblica sul proprio sito.
//
// Le firme NON stanno qui: stanno nella tabella `hospitality_provider_signatures`,
// che al momento ne contiene 16. Tenerle nel database e' deliberato: aggiungere un
// fornitore nuovo non deve richiedere un rilascio del codice. Se le mettessimo in
// un elenco qui dentro, ogni fornitore andrebbe aggiunto due volte -- e la seconda
// volta non arriverebbe mai.
//
// Questo file contiene SOLO la logica di confronto, senza rete e senza database,
// perche' e' la parte che va provata con esempi veri.

export type TipoTecnologia = "booking_engine" | "pms" | "channel_manager" | "ota" | "other"

export type Firma = {
  slug: string
  provider_name: string
  technology_types: TipoTecnologia[]
  host_patterns: string[]
  url_patterns: string[]
  html_patterns: string[]
  priority: number
  enabled: boolean
}

export type Riscontro = {
  slug: string
  provider_name: string
  technology_types: TipoTecnologia[]
  confidence: number
  // Da dove viene il riconoscimento. Serve a poterlo contestare: un riscontro
  // sull'host di un iframe di prenotazione vale piu' di una parola nell'HTML.
  evidence_kind: "host" | "url" | "html"
  evidence_url: string
  evidence_excerpt: string
}

// Quanto ci fidiamo, secondo DOVE abbiamo trovato la prova.
//
// L'host di un link o di un iframe e' il segnale piu' solido: se il modulo di
// prenotazione punta a `booking.ericsoft.com`, quella struttura usa Ericsoft.
// Una parola nell'HTML e' il segnale piu' debole: puo' venire da un commento,
// da un vecchio script rimasto, o dal nome di un file.
const FIDUCIA: Record<Riscontro["evidence_kind"], number> = {
  host: 90,
  url: 75,
  html: 55,
}

// La soglia sotto la quale NON dichiariamo un fornitore ma chiediamo una
// verifica umana. Meglio "da controllare" che un dato sbagliato in una lista
// che poi usi per mandare email.
export const SOGLIA_ATTENDIBILE = 70

function compilaRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern, "i")
  } catch {
    // Una firma scritta male nel database non deve far cadere l'intero
    // censimento: la salto e vado avanti. Chi la ha scritta la vedra' senza
    // riscontri e potra' correggerla.
    return null
  }
}

/** Estrae host, URL assoluti e testo da una pagina, per darli in pasto alle firme. */
export function estraiSegnali(html: string, urlPagina: string): {
  host: string[]
  url: string[]
} {
  const url: string[] = []
  const host = new Set<string>()

  // src= e href= di qualunque tag: iframe del motore di prenotazione, script di
  // tracciamento, link "Prenota". Sono i posti dove il fornitore si tradisce.
  const re = /(?:src|href|action|data-src)\s*=\s*["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const grezzo = m[1]
    if (!grezzo || grezzo.startsWith("#") || grezzo.startsWith("mailto:") || grezzo.startsWith("tel:")) continue
    try {
      const assoluto = new URL(grezzo, urlPagina)
      if (assoluto.protocol !== "http:" && assoluto.protocol !== "https:") continue
      url.push(assoluto.href)
      host.add(assoluto.hostname.toLowerCase())
    } catch {
      // URL malformato nella pagina di qualcun altro: non e' un nostro errore.
    }
  }

  return { host: [...host], url }
}

/**
 * Confronta i segnali di una pagina con le firme e restituisce i riscontri,
 * dal piu' attendibile al meno.
 *
 * Non decide nulla: dice solo cosa ha visto e con quanta fiducia. La decisione
 * (dichiarare il fornitore, o chiedere una verifica) sta in `decidiFornitori`.
 */
export function riconosci(
  firme: Firma[],
  segnali: { host: string[]; url: string[] },
  html: string,
  urlPagina: string
): Riscontro[] {
  const out: Riscontro[] = []

  for (const f of firme) {
    if (!f.enabled) continue

    let trovato: Riscontro | null = null

    // 1) host: il segnale piu' forte
    for (const p of f.host_patterns || []) {
      const re = compilaRegex(p)
      if (!re) continue
      const h = segnali.host.find((x) => re.test(x))
      if (h) {
        trovato = {
          slug: f.slug,
          provider_name: f.provider_name,
          technology_types: f.technology_types,
          confidence: FIDUCIA.host,
          evidence_kind: "host",
          evidence_url: urlPagina,
          evidence_excerpt: h,
        }
        break
      }
    }

    // 2) URL, SENZA lo schema.
    //
    // Perche' senza schema: quasi tutti gli `url_patterns` sono pattern di
    // PERCORSO (`/distributor/`, `/preventivov2/...`, `/(booking|booking2.php)`).
    // Confrontandoli con l'URL intero, il `//` di `https://` fa da falso
    // separatore di percorso: `https://booking.qualsiasi.it/pagina` contiene
    // la sottostringa `/booking` DENTRO L'HOST, e il pattern di Beds24
    // `/(booking|booking2\.php)` scattava su qualunque sito il cui host
    // iniziasse per `booking.`.
    //
    // Misurato su due casi reali: `booking.holidayonline.org` e
    // `booking.hotelgaribaldi.it` (un sottodominio dell'hotel STESSO) erano
    // stati attribuiti a Beds24. In una DEM filtrata per gestionale, un falso
    // positivo e' peggio di un "non rilevato": scrive a un albergatore
    // parlandogli di un gestionale che non usa.
    //
    // Togliere lo schema non indebolisce i pattern che includono l'host
    // (`booking\.slope\.it/<uuid>`): quelli continuano a combaciare.
    if (!trovato) {
      for (const p of f.url_patterns || []) {
        const re = compilaRegex(p)
        if (!re) continue
        const u = segnali.url.find((x) => re.test(x.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")))
        if (u) {
          trovato = {
            slug: f.slug,
            provider_name: f.provider_name,
            technology_types: f.technology_types,
            confidence: FIDUCIA.url,
            evidence_kind: "url",
            evidence_url: urlPagina,
            evidence_excerpt: u.slice(0, 300),
          }
          break
        }
      }
    }

    // 3) HTML: il segnale piu' debole, sotto soglia da solo
    if (!trovato) {
      for (const p of f.html_patterns || []) {
        const re = compilaRegex(p)
        if (!re) continue
        const mm = re.exec(html)
        if (mm) {
          const at = Math.max(0, mm.index - 60)
          trovato = {
            slug: f.slug,
            provider_name: f.provider_name,
            technology_types: f.technology_types,
            confidence: FIDUCIA.html,
            evidence_kind: "html",
            evidence_url: urlPagina,
            evidence_excerpt: html.slice(at, at + 220).replace(/\s+/g, " "),
          }
          break
        }
      }
    }

    if (trovato) out.push(trovato)
  }

  // Prima i piu' attendibili; a pari fiducia, la priorita' dichiarata nel database.
  const priorita = new Map(firme.map((f) => [f.slug, f.priority ?? 0]))
  return out.sort(
    (a, b) => b.confidence - a.confidence || (priorita.get(a.slug) ?? 0) - (priorita.get(b.slug) ?? 0)
  )
}

export type Fornitori = {
  booking_engine_provider: string | null
  booking_engine_confidence: number | null
  pms_provider: string | null
  pms_confidence: number | null
  channel_manager_provider: string | null
  channel_manager_confidence: number | null
  technology_status: "detected" | "unknown" | "needs_review"
}

/**
 * Da un elenco di riscontri ricava UN fornitore per ciascuna delle tre caselle.
 *
 * Regola importante: un riscontro sotto la soglia viene comunque registrato, ma
 * lo stato diventa `needs_review` invece di `detected`. Un dato incerto spacciato
 * per certo e' peggio di un dato mancante: qui finisce in una lista per mandare
 * email, e "credevo usasse Ericsoft" non e' una scusa accettabile davanti a un
 * cliente.
 */
export function decidiFornitori(riscontri: Riscontro[]): Fornitori {
  const scegli = (tipo: TipoTecnologia): Riscontro | null =>
    riscontri.find((r) => r.technology_types.includes(tipo)) ?? null

  const be = scegli("booking_engine")
  const pms = scegli("pms")
  const cm = scegli("channel_manager")

  const trovati = [be, pms, cm].filter((x): x is Riscontro => x !== null)

  let stato: Fornitori["technology_status"] = "unknown"
  if (trovati.length > 0) {
    stato = trovati.some((r) => r.confidence >= SOGLIA_ATTENDIBILE) ? "detected" : "needs_review"
  }

  return {
    booking_engine_provider: be?.provider_name ?? null,
    booking_engine_confidence: be?.confidence ?? null,
    pms_provider: pms?.provider_name ?? null,
    pms_confidence: pms?.confidence ?? null,
    channel_manager_provider: cm?.provider_name ?? null,
    channel_manager_confidence: cm?.confidence ?? null,
    technology_status: stato,
  }
}

// Host di prenotazione che NON corrispondono a nessuna delle 16 firme.
//
// Serve a far crescere l'elenco dei fornitori riconosciuti: se 200 strutture
// puntano allo stesso host sconosciuto, quello e' un fornitore che ci manca, e
// va aggiunto. Senza questo, il censimento resterebbe fermo a cio' che sapevamo
// il primo giorno.
const INDIZI_PRENOTAZIONE = /(book|prenot|reserv|availab|disponibil|rate|tariff)/i

export function hostDiPrenotazioneSconosciuti(
  segnali: { host: string[]; url: string[] },
  riscontri: Riscontro[],
  hostStruttura: string
): string[] {
  if (riscontri.some((r) => r.confidence >= SOGLIA_ATTENDIBILE)) return []

  const suoi = new Set<string>()
  const base = hostStruttura.replace(/^www\./, "")

  for (const u of segnali.url) {
    try {
      const parsed = new URL(u)
      const h = parsed.hostname.toLowerCase()
      // Il sito della struttura stessa non e' un fornitore.
      if (h === base || h === `www.${base}` || h.endsWith(`.${base}`)) continue
      if (INDIZI_PRENOTAZIONE.test(u)) suoi.add(h)
    } catch {
      // gia' gestito in estraiSegnali
    }
  }

  return [...suoi]
}
