// Contratto del riconoscimento del gestionale.
//
// Nasce da un difetto VERO, trovato guardando le righe scritte invece del
// conteggio: il lotto diceva "5 rilevati", e due dei cinque erano sbagliati.
// `booking.holidayonline.org` e `booking.hotelgaribaldi.it` (un sottodominio
// dell'hotel STESSO) erano stati attribuiti a Beds24, perche' il pattern di
// percorso `/(booking|booking2\.php)` veniva confrontato con l'URL intero e il
// `//` di `https://` faceva da falso separatore.
//
// Perche' e' grave qui e non altrove: questi dati alimentano il filtro delle
// DEM. Un falso positivo significa scrivere a un albergatore parlandogli di un
// gestionale che non usa. "Non rilevato" e' un esito onesto; "Beds24" quando
// non e' Beds24 e' un danno.
//
// NOTA sulle firme: qui sono ricopiate dal database (`hospitality_provider_signatures`)
// perche' cio' che si prova e' la LOGICA DI CONFRONTO, che e' l'unica parte in
// codice. Se domani un pattern cambia nel database, questo contratto non se ne
// accorge: la sua promessa e' che `/percorso` non scatti mai dentro un host, non
// che le 16 firme siano quelle giuste.
import { describe, expect, it } from "vitest"
import {
  decidiFornitori,
  estraiSegnali,
  hostDiPrenotazioneSconosciuti,
  riconosci,
  SOGLIA_ATTENDIBILE,
  type Firma,
} from "../lib/hospitality/providers"

const firma = (p: Partial<Firma> & { slug: string; provider_name: string }): Firma => ({
  technology_types: ["booking_engine"],
  host_patterns: [],
  url_patterns: [],
  html_patterns: [],
  priority: 95,
  enabled: true,
  ...p,
})

// Le firme come stanno nel database, per i fornitori che servono a queste prove.
const BEDS24 = firma({
  slug: "beds24",
  provider_name: "Beds24",
  host_patterns: ["(^|\\.)beds24\\.com$"],
  url_patterns: ["/(booking|booking2\\.php)"],
})
const VERTICAL = firma({
  slug: "vertical-booking",
  provider_name: "Vertical Booking",
  host_patterns: ["^(booking|reservations)\\.verticalbooking\\.com$"],
})
const SLOPE = firma({
  slug: "slope",
  provider_name: "Slope",
  host_patterns: ["^booking\\.slope\\.it$"],
  url_patterns: ["booking\\.slope\\.it/[0-9a-f-]{36}"],
  priority: 100,
})
const SCIDOO = firma({
  slug: "scidoo",
  provider_name: "Scidoo",
  host_patterns: ["(^|\\.)scidoo\\.com$"],
  url_patterns: ["/preventivov2/.*[?&]cod="],
  priority: 100,
})
const MEWS = firma({
  slug: "mews",
  provider_name: "Mews",
  host_patterns: ["^app\\.mews\\.com$"],
  url_patterns: ["/distributor/"],
})

const TUTTE = [SCIDOO, SLOPE, VERTICAL, BEDS24, MEWS]

/** Costruisce una pagina minima che linka l'URL dato, come farebbe un sito vero. */
// Accetta PIU' indirizzi: con un solo parametro, una prova che ne passava due
// ne controllava in silenzio soltanto uno (JavaScript ignora gli argomenti in
// eccesso, quindi restava verde). L'ha trovato `tsc`, non vitest: un controllo
// dei tipi vede quello che una prova verde nasconde.
const pagina = (...href: string[]) =>
  `<html><body>${href.map((h) => `<a href="${h}">Prenota</a>`).join("")}</body></html>`

const analizza = (href: string, urlPagina: string, firme: Firma[] = TUTTE) => {
  const html = pagina(href)
  const segnali = estraiSegnali(html, urlPagina)
  return riconosci(firme, segnali, html, urlPagina)
}

describe("i due falsi positivi reali non devono tornare", () => {
  // Caso vero, preso dal primo lotto in produzione.
  it("booking.holidayonline.org NON e' Beds24", () => {
    const r = analizza(
      "https://booking.holidayonline.org/villa-iltrebbio.php?cmd=getscript",
      "https://villailtrebbio.it/"
    )
    expect(r.map((x) => x.slug)).not.toContain("beds24")
    expect(decidiFornitori(r).technology_status).toBe("unknown")
  })

  // Caso vero: qui l'host e' un sottodominio dell'HOTEL STESSO. Attribuirlo a un
  // fornitore e' doppiamente sbagliato.
  it("booking.hotelgaribaldi.it NON e' Beds24 (e' l'hotel stesso)", () => {
    const r = analizza(
      "https://booking.hotelgaribaldi.it/book/offer/index?hotel=17986",
      "https://hotelgaribaldi.it/"
    )
    expect(r.map((x) => x.slug)).not.toContain("beds24")
    expect(decidiFornitori(r).booking_engine_provider).toBeNull()
  })

  // La forma generale del difetto: QUALUNQUE host che inizi per `booking.`
  // faceva scattare un pattern di percorso `/booking`.
  it("nessun host che inizia per 'booking.' fa scattare un pattern di percorso", () => {
    for (const host of ["booking.qualsiasi.it", "booking.esempio.com", "booking.altro.org"]) {
      const r = analizza(`https://${host}/pagina.html`, "https://struttura.it/")
      expect(r.map((x) => x.slug), `host ${host}`).not.toContain("beds24")
    }
  })
})

describe("controlli positivi: il rilevatore funziona ancora", () => {
  // Senza queste, le prove sopra sarebbero verdi anche con il rilevatore rotto.
  it("un host Vertical Booking vero viene riconosciuto", () => {
    const r = analizza("https://reservations.verticalbooking.com/x?id=1", "https://hotel.it/")
    expect(r[0]?.provider_name).toBe("Vertical Booking")
    expect(r[0]?.evidence_kind).toBe("host")
    expect(r[0]?.confidence).toBeGreaterThanOrEqual(SOGLIA_ATTENDIBILE)
    expect(decidiFornitori(r).technology_status).toBe("detected")
  })

  it("un host Beds24 vero viene ancora riconosciuto (la correzione non ha ucciso il rilevamento)", () => {
    const r = analizza("https://www.beds24.com/booking2.php?propid=123", "https://hotel.it/")
    expect(r[0]?.provider_name).toBe("Beds24")
    expect(decidiFornitori(r).technology_status).toBe("detected")
  })

  it("un pattern di URL che contiene l'host continua a combaciare (Slope)", () => {
    // Prova che togliere lo schema non ha rotto i pattern che includono l'host.
    const r = analizza(
      "https://booking.slope.it/1f0a2b3c-4d5e-6f70-8192-a3b4c5d6e7f8",
      "https://hotel.it/"
    )
    expect(r[0]?.provider_name).toBe("Slope")
  })

  it("un pattern di percorso legittimo combacia sul percorso vero (Scidoo)", () => {
    // Scidoo compare anche sul dominio della struttura: qui il percorso E' il segnale.
    const r = analizza("https://www.hoteltest.it/preventivov2/?cod=1234", "https://www.hoteltest.it/")
    expect(r.map((x) => x.provider_name)).toContain("Scidoo")
  })

  it("un pattern di percorso legittimo combacia (Mews /distributor/)", () => {
    const r = analizza("https://app.mews.com/distributor/abc", "https://hotel.it/")
    expect(r[0]?.provider_name).toBe("Mews")
  })
})

describe("prudenza: meglio 'non lo so' che un dato sbagliato", () => {
  it("nessun segnale = unknown, non un fornitore a caso", () => {
    const r = analizza("https://www.facebook.com/hotel", "https://hotel.it/")
    expect(r).toHaveLength(0)
    const d = decidiFornitori(r)
    expect(d.technology_status).toBe("unknown")
    expect(d.booking_engine_provider).toBeNull()
  })

  it("una prova solo nell'HTML sta sotto soglia e chiede una verifica", () => {
    const soloHtml = firma({
      slug: "tale",
      provider_name: "Tale",
      html_patterns: ["gestionale-tale"],
    })
    const html = "<html><body><!-- gestionale-tale --></body></html>"
    const r = riconosci([soloHtml], estraiSegnali(html, "https://hotel.it/"), html, "https://hotel.it/")
    expect(r[0]?.confidence).toBeLessThan(SOGLIA_ATTENDIBILE)
    expect(decidiFornitori(r).technology_status).toBe("needs_review")
  })

  it("una firma con una regex scritta male non fa cadere il censimento", () => {
    const rotta = firma({ slug: "rotta", provider_name: "Rotta", host_patterns: ["([("] })
    // Non deve lanciare: la firma sbagliata si salta, le altre continuano.
    const r = analizza("https://reservations.verticalbooking.com/x", "https://hotel.it/", [rotta, VERTICAL])
    expect(r[0]?.provider_name).toBe("Vertical Booking")
  })
})

describe("host sconosciuti: si raccolgono quelli utili, non il sito della struttura", () => {
  it("il dominio della struttura stessa non e' un fornitore", () => {
    const html = pagina("https://booking.hotelgaribaldi.it/book/offer/index")
    const segnali = estraiSegnali(html, "https://hotelgaribaldi.it/")
    const host = hostDiPrenotazioneSconosciuti(segnali, [], "hotelgaribaldi.it")
    expect(host).not.toContain("booking.hotelgaribaldi.it")
    expect(host).toHaveLength(0)
  })

  it("un host di prenotazione di terzi viene raccolto", () => {
    const html = pagina("https://booking.holidayonline.org/villa.php")
    const segnali = estraiSegnali(html, "https://villailtrebbio.it/")
    const host = hostDiPrenotazioneSconosciuti(segnali, [], "villailtrebbio.it")
    expect(host).toContain("booking.holidayonline.org")
  })

  it("se il fornitore e' gia' stato riconosciuto non si raccoglie nulla", () => {
    const html = pagina("https://reservations.verticalbooking.com/x")
    const segnali = estraiSegnali(html, "https://hotel.it/")
    const riscontri = riconosci(TUTTE, segnali, html, "https://hotel.it/")
    expect(hostDiPrenotazioneSconosciuti(segnali, riscontri, "hotel.it")).toHaveLength(0)
  })

  // Difetto misurato in produzione: su 30 siti l'elenco dei "possibili
  // fornitori" conteneva `www.facebook.com` 12 volte. Causa: il pulsante
  // "condividi" porta la pagina di prenotazione della struttura DENTRO la
  // propria query, e l'indizio venuto cercato nell'URL intero scattava.
  it("un link di condivisione social non rende Facebook un gestionale", () => {
    const html = pagina("https://www.facebook.com/sharer/sharer.php?u=https://hotel.it/prenota-ora")
    const segnali = estraiSegnali(html, "https://hotel.it/")
    const host = hostDiPrenotazioneSconosciuti(segnali, [], "hotel.it")
    expect(host).not.toContain("www.facebook.com")
    expect(host).toHaveLength(0)
  })

  // Questa prova ISOLA il difetto della query, e la precedente NO: Facebook e'
  // gia' nell'elenco dei non-fornitori, quindi resta fuori anche cercando
  // nell'URL intero. Provando a rimettere il difetto, il contratto restava
  // verde: due difese sovrapposte, e la prova misurava solo quella sbagliata.
  //
  // Qui l'host NON e' in nessun elenco e la parola "prenota" sta SOLO nella
  // query: viene raccolto se e solo se si cerca dove non si deve.
  it("una parola di prenotazione nella sola query non basta a raccogliere l'host", () => {
    const html = pagina("https://tracciamento.example.net/click?destinazione=https://hotel.it/prenota")
    const segnali = estraiSegnali(html, "https://hotel.it/")
    const host = hostDiPrenotazioneSconosciuti(segnali, [], "hotel.it")
    expect(host).not.toContain("tracciamento.example.net")
    expect(host).toHaveLength(0)
  })

  it("analitiche e reti di distribuzione non finiscono fra i fornitori", () => {
    const html = pagina(
      "https://www.googletagmanager.com/gtm.js?id=GTM-X&booking=1",
      "https://cdn.jsdelivr.net/npm/booking-widget.js",
    )
    const segnali = estraiSegnali(html, "https://hotel.it/")
    expect(hostDiPrenotazioneSconosciuti(segnali, [], "hotel.it")).toHaveLength(0)
  })

  it("un host di prenotazione vero passa ancora: il filtro non e' un tappo", () => {
    // Controllo positivo dell'elenco: se escludesse troppo, questa prova cade.
    const html = pagina("https://be.bookingexpert.it/reserve/hotel-x")
    const segnali = estraiSegnali(html, "https://hotel.it/")
    expect(hostDiPrenotazioneSconosciuti(segnali, [], "hotel.it")).toContain("be.bookingexpert.it")
  })
})

describe("la prova di un rilevamento deve essere controllabile", () => {
  // Difetto misurato: `evidence_url` conteneva la pagina VISITATA e non l'host
  // del fornitore, e la stessa pagina finiva anche in `source_url`. Due colonne
  // con lo stesso valore, e la prova reperibile solo riscaricando l'HTML: la
  // mia verifica dava "0 su 3 coerenti" su rilevamenti in parte corretti.
  it("evidence_url e' l'host del fornitore, source_url la pagina della struttura", () => {
    const r = analizza("https://reservations.verticalbooking.com/x", "https://ilcasale.it/index.php")
    expect(r).toHaveLength(1)
    expect(r[0].evidence_url).toBe("reservations.verticalbooking.com")
    expect(r[0].source_url).toBe("https://ilcasale.it/index.php")
    expect(r[0].evidence_url).not.toBe(r[0].source_url)
  })

  it("per un riscontro su URL la prova e' l'URL del fornitore, non la pagina", () => {
    const r = analizza("https://terzi.example.com/distributor/hotel-9", "https://hotel.it/camere")
    expect(r.length).toBeGreaterThan(0)
    expect(r[0].evidence_url).toContain("/distributor/")
    expect(r[0].source_url).toBe("https://hotel.it/camere")
  })
})
