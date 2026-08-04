// Genera il PDF del comunicato stampa da consegnare alle redazioni.
//
// Usa pdf-lib, GIA' presente nel progetto: nessuna dipendenza aggiunta per
// produrre un documento di due pagine.
//
// PERCHE' LEGGE DA lib/dem/press-release-air-market.ts: il testo del comunicato
// esiste in un solo posto. Se il PDF avesse il suo testo copiato, alla prima
// correzione l'email e l'allegato direbbero cose diverse e una testata
// citerebbe una frase che nell'altra versione non c'e'.
//
// ATTENZIONE ALLA CODIFICA: i font standard del PDF (Helvetica) usano la
// codifica WinAnsi, che comprende le accentate italiane (è à ù ò é È) ma NON i
// segni tipografici come le virgolette curve o la lineetta lunga. Un carattere
// fuori codifica fa fallire pdf-lib con un errore poco chiaro, quindi il testo
// passa da una conversione esplicita che li sostituisce con l'equivalente
// semplice. Meglio una virgoletta diritta che un documento che non si genera.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { writeFile, mkdir, readFile } from "node:fs/promises"
import { COMUNICATO, DATA_COMUNICATO } from "../lib/dem/press-release-air-market"

// Marchi: Santaddeo in testa (e' il prodotto di cui parla il comunicato),
// 4 bid in coda (e' chi lo pubblica).
const LOGO_SANTADDEO = "public/santaddeo-logo.png"
const LOGO_4BID = "public/4bid-logo-email.png"

const BLU = rgb(0.106, 0.165, 0.29) // #1b2a4a
const VERDE = rgb(0.169, 0.702, 0.639) // #2bb3a3
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
 * dall'estensione del file: `public/4bid-logo-email.png` e' in realta' un JPEG
 * con estensione .png, e chiamare embedPng su un JPEG fa fallire pdf-lib.
 */
async function incorporaImmagine(pdf: PDFDocument, percorso: string) {
  // Stessa conversione usata in app/api/dem/resend-webhook: con @types/node 22
  // il tipo `Buffer` non e' assegnabile a `Uint8Array<ArrayBuffer>`.
  // `Uint8Array.from` copia elemento per elemento, quindi rispetta l'offset del
  // Buffer: `new Uint8Array(byte.buffer)` sarebbe SBAGLIATO, perche' Node riusa
  // un ArrayBuffer condiviso e verrebbero letti byte di altri dati.
  const byte = Uint8Array.from(await readFile(percorso))
  const isPng = byte[0] === 0x89 && byte[1] === 0x50 && byte[2] === 0x4e && byte[3] === 0x47
  const isJpeg = byte[0] === 0xff && byte[1] === 0xd8
  if (isPng) return pdf.embedPng(byte)
  if (isJpeg) return pdf.embedJpg(byte)
  throw new Error(`${percorso}: formato non riconosciuto (ne' PNG ne' JPEG)`)
}

/** Spezza il testo in righe che stanno nella larghezza data. */
function spezzaRighe(testo: string, font: Font, corpo: number, larghezza: number): string[] {
  const parole = perWinAnsi(testo).split(/\s+/)
  const righe: string[] = []
  let riga = ""
  for (const parola of parole) {
    const tentativo = riga ? `${riga} ${parola}` : parola
    if (font.widthOfTextAtSize(tentativo, corpo) > larghezza && riga) {
      righe.push(riga)
      riga = parola
    } else {
      riga = tentativo
    }
  }
  if (riga) righe.push(riga)
  return righe
}

async function main() {
  const pdf = await PDFDocument.create()
  const normale = await pdf.embedFont(StandardFonts.Helvetica)
  const grassetto = await pdf.embedFont(StandardFonts.HelveticaBold)
  const corsivo = await pdf.embedFont(StandardFonts.HelveticaOblique)

  pdf.setTitle("Comunicato stampa - Air Market Intelligence | Santaddeo")
  pdf.setAuthor("4 bid srl")
  pdf.setSubject("Air Market Intelligence: la capacità aerea diventa indicazione sui mercati da sviluppare")
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

    for (const riga of spezzaRighe(testo, font, corpo, larghezza)) {
      assicuraSpazio(interlinea)
      pagina.drawText(riga, { x, y: y - corpo, size: corpo, font, color: colore })
      y -= interlinea
    }
    y -= opzioni.spazioSotto ?? 0
  }

  // Intestazione: marchio Santaddeo e sotto il filo verde che richiama il bordo
  // dell'email. Il logo e' largo 3,4 volte la sua altezza, quindi l'altezza si
  // ricava dalla larghezza scelta: fissarle entrambe lo deformerebbe.
  const logoSantaddeo = await incorporaImmagine(pdf, LOGO_SANTADDEO)
  const LARGHEZZA_LOGO = 148
  const altezzaLogo = (logoSantaddeo.height / logoSantaddeo.width) * LARGHEZZA_LOGO
  pagina.drawImage(logoSantaddeo, {
    x: MARGINE,
    y: y - altezzaLogo,
    width: LARGHEZZA_LOGO,
    height: altezzaLogo,
  })
  y -= altezzaLogo + 14

  pagina.drawRectangle({ x: MARGINE, y, width: LARGHEZZA_TESTO, height: 3, color: VERDE })
  y -= 22

  scrivi(COMUNICATO.etichetta, { font: grassetto, corpo: 11, colore: VERDE, spazioSotto: 2 })
  scrivi(COMUNICATO.luogoData, { corpo: 10, colore: GRIGIO, spazioSotto: 14 })
  scrivi(COMUNICATO.titolo, { font: grassetto, corpo: 18, colore: BLU, interlinea: 24, spazioSotto: 8 })
  scrivi(COMUNICATO.sottotitolo, { corpo: 12, colore: GRIGIO, interlinea: 18, spazioSotto: 18 })

  for (const paragrafo of COMUNICATO.paragrafi) {
    scrivi(paragrafo, { spazioSotto: 12 })
  }

  // Citazione: barra dorata a sinistra, come il riquadro dell'email.
  const righeCitazione = spezzaRighe(
    `"${COMUNICATO.citazione.testo}"`,
    corsivo,
    10.5,
    LARGHEZZA_TESTO - 16,
  )
  const altezzaCitazione = righeCitazione.length * 16 + 20
  assicuraSpazio(altezzaCitazione + 20)
  pagina.drawRectangle({ x: MARGINE, y: y - altezzaCitazione + 6, width: 3, height: altezzaCitazione, color: ORO })
  y -= 6
  scrivi(`"${COMUNICATO.citazione.testo}"`, {
    font: corsivo,
    interlinea: 16,
    larghezza: LARGHEZZA_TESTO - 16,
    x: MARGINE + 16,
    spazioSotto: 4,
  })
  scrivi(COMUNICATO.citazione.attribuzione, {
    corpo: 10,
    colore: GRIGIO,
    larghezza: LARGHEZZA_TESTO - 16,
    x: MARGINE + 16,
    spazioSotto: 16,
  })

  scrivi(COMUNICATO.chiusura, { spazioSotto: 20 })

  // Scheda e contatti
  assicuraSpazio(120)
  pagina.drawRectangle({ x: MARGINE, y, width: LARGHEZZA_TESTO, height: 0.8, color: rgb(0.9, 0.89, 0.87) })
  y -= 16
  scrivi(COMUNICATO.scheda.titolo, { font: grassetto, corpo: 11, colore: BLU, spazioSotto: 4 })
  scrivi(COMUNICATO.scheda.testo, { corpo: 10, colore: GRIGIO, interlinea: 15, spazioSotto: 14 })
  scrivi(COMUNICATO.contatti.titolo, { font: grassetto, corpo: 11, colore: BLU, spazioSotto: 4 })
  for (const riga of COMUNICATO.contatti.righe) {
    scrivi(riga, { corpo: 10, colore: GRIGIO, interlinea: 14 })
  }

  // Piede di pagina: numerazione a sinistra (un comunicato di due pagine senza
  // numeri, se stampato, si scompagina sul tavolo di redazione) e marchio 4 bid
  // a destra. Il logo sta a DESTRA di proposito: la numerazione occupa la fascia
  // sinistra e sovrapporre i due elementi sulla stessa colonna li farebbe
  // scontrare. In verticale resta sotto la soglia oltre la quale il testo non
  // scende mai (MARGINE + 30), quindi non copre mai una riga del comunicato.
  const logo4bid = await incorporaImmagine(pdf, LOGO_4BID)
  const ALTEZZA_LOGO_4BID = 26
  const larghezza4bid = (logo4bid.width / logo4bid.height) * ALTEZZA_LOGO_4BID

  const pagine = pdf.getPages()
  pagine.forEach((p, i) => {
    const etichetta = `Santaddeo - Comunicato stampa - ${DATA_COMUNICATO} - pagina ${i + 1} di ${pagine.length}`
    p.drawText(perWinAnsi(etichetta), {
      x: MARGINE,
      y: MARGINE - 22,
      size: 8,
      font: normale,
      color: rgb(0.62, 0.62, 0.62),
    })
    p.drawImage(logo4bid, {
      x: A4.larghezza - MARGINE - larghezza4bid,
      y: MARGINE - 30,
      width: larghezza4bid,
      height: ALTEZZA_LOGO_4BID,
    })
  })

  const byte = await pdf.save()
  await mkdir("public/comunicati", { recursive: true })
  const percorso = "public/comunicati/santaddeo-air-market-intelligence.pdf"
  await writeFile(percorso, byte)

  console.log(`  scritto: ${percorso}`)
  console.log(`  pagine:  ${pagine.length}`)
  console.log(`  peso:    ${(byte.length / 1024).toFixed(1)} KB`)
}

main().catch((e) => {
  console.error("  ERRORE:", e instanceof Error ? e.message : e)
  process.exit(1)
})
