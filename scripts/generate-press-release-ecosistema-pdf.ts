// Genera il PDF del comunicato stampa sull'ecosistema 4 BID.
//
// Usa pdf-lib, GIA' presente nel progetto: nessuna dipendenza aggiunta.
//
// PERCHE' LEGGE DA lib/dem/press-release-ecosistema.ts: il testo del comunicato
// esiste in un solo posto. Se il PDF avesse il suo testo copiato, alla prima
// correzione l'email e l'allegato direbbero cose diverse e una testata citerebbe
// una frase che nell'altra versione non c'e'. Anche l'ENFASI arriva da la':
// `spezzaEnfasi()` e' la stessa funzione che usa l'email, quindi il grassetto
// cade negli stessi punti nei due formati.
//
// ATTENZIONE ALLA CODIFICA: i font standard del PDF (Helvetica) usano WinAnsi,
// che comprende le accentate italiane (è à ù ò é) ma NON i segni tipografici
// (virgolette curve, lineetta lunga, puntini di sospensione). Un carattere fuori
// codifica fa fallire pdf-lib con un errore poco chiaro, quindi il testo passa da
// una conversione esplicita.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { writeFile, mkdir, readFile } from "node:fs/promises"
import {
  COMUNICATO_ECOSISTEMA,
  DATA_COMUNICATO_ECOSISTEMA,
  PERCORSO_PDF_ECOSISTEMA,
  senzaEnfasi,
  spezzaEnfasi,
  type Frammento,
} from "../lib/dem/press-release-ecosistema"

// Marchio dell'AZIENDA: il comunicato parla dei quattro software insieme, non di
// un prodotto, quindi in testa va 4 bid e non uno dei loghi di prodotto.
const LOGO_4BID = "public/4bid-logo-email.png"

const BLU = rgb(0.106, 0.165, 0.29) // #1b2a4a
const ARANCIO = rgb(0.878, 0.541, 0.18) // #e08a2e
const NERO = rgb(0.18, 0.18, 0.18)
const GRIGIO = rgb(0.42, 0.42, 0.42)
const ORO = rgb(0.784, 0.643, 0.361) // #c8a45c

const A4 = { larghezza: 595.28, altezza: 841.89 }
const MARGINE = 62
const LARGHEZZA_TESTO = A4.larghezza - MARGINE * 2

/** Sostituisce i caratteri che la codifica WinAnsi non conosce. */
function perWinAnsi(testo: string): string {
  return testo
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
}

type Font = Awaited<ReturnType<PDFDocument["embedFont"]>>

/**
 * Incorpora un'immagine scegliendo il metodo dai byte iniziali, NON
 * dall'estensione: `public/4bid-logo-email.png` e' in realta' un JPEG con
 * estensione .png, e chiamare embedPng su un JPEG fa fallire pdf-lib.
 */
async function incorporaImmagine(pdf: PDFDocument, percorso: string) {
  // `Uint8Array.from` copia elemento per elemento e rispetta l'offset del
  // Buffer: `new Uint8Array(byte.buffer)` sarebbe SBAGLIATO, perche' Node riusa
  // un ArrayBuffer condiviso e verrebbero letti byte di altri dati.
  const byte = Uint8Array.from(await readFile(percorso))
  const isPng = byte[0] === 0x89 && byte[1] === 0x50 && byte[2] === 0x4e && byte[3] === 0x47
  const isJpeg = byte[0] === 0xff && byte[1] === 0xd8
  if (isPng) return pdf.embedPng(byte)
  if (isJpeg) return pdf.embedJpg(byte)
  throw new Error(`${percorso}: formato non riconosciuto (ne' PNG ne' JPEG)`)
}

/** Pezzo di parola con un solo stile. */
type Segmento = { testo: string; grassetto: boolean }

/**
 * Unita' minima dell'impaginazione: una parola, che puo' essere composta da piu'
 * segmenti con stili diversi.
 *
 * PERCHE' NON BASTA "una parola = uno stile": l'enfasi finisce spesso dentro la
 * punteggiatura, come in "**Hotel Profit AI**, dedicato al controllo". Il
 * grassetto chiude su "AI" e la virgola sta nel frammento successivo, in tondo.
 * Trattandoli come due parole separate il PDF scriveva "Hotel Profit AI ,
 * dedicato": uno spazio prima della virgola, e la riga poteva anche spezzarsi
 * la' in mezzo. Verificato estraendo il testo del PDF: 10 paragrafi su 58 erano
 * colpiti. I segmenti attaccati restano quindi nella STESSA parola.
 */
type Parola = Segmento[]

/**
 * Trasforma i frammenti di enfasi in parole, conservando lo stile di ciascun
 * segmento. Serve perche' un paragrafo puo' passare dal tondo al grassetto a
 * meta' riga: impaginare l'intero paragrafo con un font unico perderebbe
 * l'enfasi che invece l'email mostra.
 */
function parole(frammenti: Frammento[]): Parola[] {
  const risultato: Parola[] = []
  // Vero quando il frammento precedente si e' chiuso senza spazio: il primo
  // pezzo del frammento seguente appartiene ancora a quella parola.
  let attaccaAlPrecedente = false

  for (const f of frammenti) {
    const testo = perWinAnsi(f.testo)
    const pezzi = testo.split(/(\s+)/)
    let primo = true
    for (const pezzo of pezzi) {
      if (pezzo === "") continue
      if (/^\s+$/.test(pezzo)) {
        primo = false
        continue
      }
      const segmento: Segmento = { testo: pezzo, grassetto: f.grassetto }
      if (primo && attaccaAlPrecedente && risultato.length > 0) {
        risultato[risultato.length - 1].push(segmento)
      } else {
        risultato.push([segmento])
      }
      primo = false
    }
    attaccaAlPrecedente = !/\s$/.test(testo) && testo !== ""
  }
  return risultato
}

/** Larghezza di una parola, sommando i suoi segmenti nei rispettivi font. */
function larghezzaParola(p: Parola, corpo: number, normale: Font, grassetto: Font): number {
  return p.reduce(
    (somma, s) => somma + (s.grassetto ? grassetto : normale).widthOfTextAtSize(s.testo, corpo),
    0,
  )
}

async function main() {
  const pdf = await PDFDocument.create()
  const normale = await pdf.embedFont(StandardFonts.Helvetica)
  const grassetto = await pdf.embedFont(StandardFonts.HelveticaBold)

  const c = COMUNICATO_ECOSISTEMA

  pdf.setTitle(`Comunicato stampa - ${senzaEnfasi(c.titolo)}`)
  pdf.setAuthor("4 bid srl")
  pdf.setSubject(
    "L'ecosistema 4 BID: Santaddeo, Hotel Accelerator, ManuBot e Hotel Profit AI collegati fra loro",
  )
  pdf.setProducer("4 bid srl")

  let pagina = pdf.addPage([A4.larghezza, A4.altezza])
  let y = A4.altezza - MARGINE

  /** Passa a una pagina nuova quando lo spazio residuo non basta. */
  function assicuraSpazio(necessario: number) {
    if (y - necessario < MARGINE + 30) {
      pagina = pdf.addPage([A4.larghezza, A4.altezza])
      y = A4.altezza - MARGINE
    }
  }

  /** Scrive un testo SENZA enfasi (titoli, etichette, contatti). */
  function scrivi(
    testo: string,
    opzioni: {
      font?: Font
      corpo?: number
      colore?: ReturnType<typeof rgb>
      interlinea?: number
      spazioSotto?: number
      larghezza?: number
      x?: number
    } = {},
  ) {
    const font = opzioni.font ?? normale
    const corpo = opzioni.corpo ?? 10.5
    const colore = opzioni.colore ?? NERO
    const interlinea = opzioni.interlinea ?? corpo * 1.55
    const larghezza = opzioni.larghezza ?? LARGHEZZA_TESTO
    const x = opzioni.x ?? MARGINE

    const testoPulito = perWinAnsi(testo)
    let riga = ""
    const righe: string[] = []
    for (const parola of testoPulito.split(/\s+/)) {
      const tentativo = riga ? `${riga} ${parola}` : parola
      if (font.widthOfTextAtSize(tentativo, corpo) > larghezza && riga) {
        righe.push(riga)
        riga = parola
      } else {
        riga = tentativo
      }
    }
    if (riga) righe.push(riga)

    for (const r of righe) {
      assicuraSpazio(interlinea)
      pagina.drawText(r, { x, y: y - corpo, size: corpo, font, color: colore })
      y -= interlinea
    }
    y -= opzioni.spazioSotto ?? 0
  }

  /**
   * Scrive un paragrafo CON enfasi: le parole in grassetto usano HelveticaBold e
   * il colore del marchio, come lo <strong> dell'email.
   */
  function scriviConEnfasi(
    testo: string,
    opzioni: {
      corpo?: number
      colore?: ReturnType<typeof rgb>
      coloreEnfasi?: ReturnType<typeof rgb>
      interlinea?: number
      spazioSotto?: number
      larghezza?: number
      x?: number
      tuttoGrassetto?: boolean
    } = {},
  ) {
    const corpo = opzioni.corpo ?? 10.5
    const colore = opzioni.colore ?? NERO
    const coloreEnfasi = opzioni.coloreEnfasi ?? BLU
    const interlinea = opzioni.interlinea ?? corpo * 1.55
    const larghezza = opzioni.larghezza ?? LARGHEZZA_TESTO
    const x = opzioni.x ?? MARGINE

    const elenco = parole(spezzaEnfasi(testo)).map((p) =>
      opzioni.tuttoGrassetto ? p.map((s) => ({ ...s, grassetto: true })) : p,
    )
    const spazio = normale.widthOfTextAtSize(" ", corpo)

    // NOTA su un difetto APPARENTE, per non rincorrerlo di nuovo: aprendo il PDF,
    // qualche spazio sembra sparito ("Telefonate,email"). Misurato: lo spazio c'e'
    // ed e' esatto - "Telefonate," e' larga 50,80 pt e la parola dopo comincia a
    // 115,72, cioe' 62 + 50,80 + 2,92 (uno spazio) al centesimo. L'occhio vede
    // strette solo le coppie che finiscono per virgola.
    // La causa e' che Helvetica e' un font "standard": non viene incorporato, e il
    // lettore lo sostituisce con Arial/Liberation, i cui glifi sono leggermente
    // piu' larghi (pdfjs misura "Telefonate," 52,53 invece di 50,80) e mangiano
    // parte dello spazio. Incorporare un TTF vero lo risolverebbe, ma servirebbe
    // una dipendenza in piu' (@pdf-lib/fontkit) e un file di font nel repo: il
    // comunicato Air Market inviato alle stesse 54 redazioni e' fatto con gli
    // stessi font standard.

    // Impaginazione parola per parola: si accumula una riga e la si disegna solo
    // quando e' completa, perche' la larghezza dipende dal font di OGNI segmento.
    let riga: Parola[] = []
    let largRiga = 0

    const disegnaRiga = (parole: Parola[]) => {
      if (parole.length === 0) return
      assicuraSpazio(interlinea)
      let cursore = x
      parole.forEach((p, i) => {
        for (const s of p) {
          const font = s.grassetto ? grassetto : normale
          pagina.drawText(s.testo, {
            x: cursore,
            y: y - corpo,
            size: corpo,
            font,
            color: s.grassetto ? coloreEnfasi : colore,
          })
          cursore += font.widthOfTextAtSize(s.testo, corpo)
        }
        if (i < parole.length - 1) cursore += spazio
      })
      y -= interlinea
    }

    for (const p of elenco) {
      const largParola = larghezzaParola(p, corpo, normale, grassetto)
      const largConSpazio = riga.length === 0 ? largParola : largRiga + spazio + largParola
      if (largConSpazio > larghezza && riga.length > 0) {
        disegnaRiga(riga)
        riga = [p]
        largRiga = largParola
      } else {
        riga.push(p)
        largRiga = largConSpazio
      }
    }
    disegnaRiga(riga)
    y -= opzioni.spazioSotto ?? 0
  }

  // Intestazione: marchio 4 bid e filo arancio, come il bordo dell'email.
  // L'altezza si RICAVA dalle proporzioni reali dell'immagine: fissare entrambe
  // le dimensioni la deformerebbe.
  const logo = await incorporaImmagine(pdf, LOGO_4BID)
  const LARGHEZZA_LOGO = 96
  const altezzaLogo = (logo.height / logo.width) * LARGHEZZA_LOGO
  pagina.drawImage(logo, {
    x: MARGINE,
    y: y - altezzaLogo,
    width: LARGHEZZA_LOGO,
    height: altezzaLogo,
  })
  y -= altezzaLogo + 14

  pagina.drawRectangle({ x: MARGINE, y, width: LARGHEZZA_TESTO, height: 3, color: ARANCIO })
  y -= 22

  scrivi(c.etichetta, { font: grassetto, corpo: 11, colore: ARANCIO, spazioSotto: 2 })
  scrivi(c.luogoData, { corpo: 10, colore: GRIGIO, spazioSotto: 14 })
  scrivi(senzaEnfasi(c.titolo), {
    font: grassetto,
    corpo: 18,
    colore: BLU,
    interlinea: 24,
    spazioSotto: 12,
  })

  // Sommario: barra dorata a sinistra e tutto in grassetto, come nell'email.
  const altezzaBarra = (() => {
    // Si misura prima di scrivere, perche' la barra si disegna sotto al testo.
    const parole_ = parole(spezzaEnfasi(c.sommario)).map((p) =>
      p.map((s) => ({ ...s, grassetto: true })),
    )
    const spazio = grassetto.widthOfTextAtSize(" ", 11)
    let righe = 1
    let largRiga = 0
    for (const p of parole_) {
      const w = larghezzaParola(p, 11, normale, grassetto)
      const conSpazio = largRiga === 0 ? w : largRiga + spazio + w
      if (conSpazio > LARGHEZZA_TESTO - 18) {
        righe += 1
        largRiga = w
      } else {
        largRiga = conSpazio
      }
    }
    return righe * 17 + 6
  })()
  assicuraSpazio(altezzaBarra + 20)
  pagina.drawRectangle({ x: MARGINE, y: y - altezzaBarra + 12, width: 3, height: altezzaBarra, color: ORO })
  scriviConEnfasi(c.sommario, {
    corpo: 11,
    tuttoGrassetto: true,
    colore: BLU,
    coloreEnfasi: BLU,
    interlinea: 17,
    larghezza: LARGHEZZA_TESTO - 18,
    x: MARGINE + 18,
    spazioSotto: 18,
  })

  for (const sezione of c.sezioni) {
    if (sezione.titolo) {
      // Il titolo non deve restare da solo in fondo alla pagina: si chiede lo
      // spazio per il titolo PIU' due righe del paragrafo che segue.
      assicuraSpazio(20 + 16 * 2)
      scrivi(sezione.titolo, {
        font: grassetto,
        corpo: 13,
        colore: BLU,
        interlinea: 18,
        spazioSotto: 8,
      })
    }
    for (const paragrafo of sezione.paragrafi) {
      scriviConEnfasi(paragrafo, { spazioSotto: 10 })
    }
    y -= 6
  }

  // Scheda e contatti
  assicuraSpazio(150)
  pagina.drawRectangle({ x: MARGINE, y, width: LARGHEZZA_TESTO, height: 0.8, color: rgb(0.9, 0.89, 0.87) })
  y -= 16
  scrivi(c.scheda.titolo, { font: grassetto, corpo: 11, colore: BLU, spazioSotto: 4 })
  scrivi(c.scheda.testo, { corpo: 10, colore: GRIGIO, interlinea: 15, spazioSotto: 14 })
  scrivi(c.contatti.titolo, { font: grassetto, corpo: 11, colore: BLU, spazioSotto: 4 })
  for (const riga of c.contatti.righe) {
    scrivi(riga, { corpo: 10, colore: GRIGIO, interlinea: 14 })
  }

  // Piede di pagina: la numerazione serve perche' un comunicato di piu' pagine,
  // se stampato, si scompagina sul tavolo di redazione. Resta sotto la soglia
  // oltre la quale il testo non scende mai (MARGINE + 30), quindi non copre
  // nessuna riga.
  const pagine = pdf.getPages()
  pagine.forEach((p, i) => {
    const etichetta = `4 bid srl - Comunicato stampa - ${DATA_COMUNICATO_ECOSISTEMA} - pagina ${i + 1} di ${pagine.length}`
    p.drawText(perWinAnsi(etichetta), {
      x: MARGINE,
      y: MARGINE - 22,
      size: 8,
      font: normale,
      color: rgb(0.62, 0.62, 0.62),
    })
    p.drawText("www.4bid.it", {
      x: A4.larghezza - MARGINE - normale.widthOfTextAtSize("www.4bid.it", 8),
      y: MARGINE - 22,
      size: 8,
      font: normale,
      color: rgb(0.62, 0.62, 0.62),
    })
  })

  const byte = await pdf.save()
  // Il percorso deriva dalla costante usata anche dal marcatore ATTACH
  // dell'email: se cambiasse solo qui, l'allegato non si scaricherebbe piu'.
  await mkdir("public/comunicati", { recursive: true })
  const percorso = `public${PERCORSO_PDF_ECOSISTEMA}`
  await writeFile(percorso, byte)

  console.log(`  scritto: ${percorso}`)
  console.log(`  pagine:  ${pagine.length}`)
  console.log(`  peso:    ${(byte.length / 1024).toFixed(1)} KB`)
}

main().catch((e) => {
  console.error("  ERRORE:", e instanceof Error ? e.message : e)
  process.exit(1)
})
