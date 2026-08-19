// Prove della prova A/B sull'oggetto e del testo accorciato dell'email.
//
// Qui non c'e' vitest: le verifiche sono script Node, come le altre `check-*` del
// progetto. Si esegue con:
//
//   npm run check:ab
//
// Importa i moduli VERI (non copie del loro contenuto): se domani qualcuno cambia
// la suddivisione o riallunga il testo dell'email, queste prove arrossiscono.

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const mod = await import("../lib/dem/ab-oggetto.ts")
const tpl = await import("../lib/dem/air-market-template.ts")

const {
  provaAttiva,
  oggettoPerDestinatario,
  percentuale,
  esitoConfronto,
  numero,
  INVII_MINIMI_PER_VARIANTE,
} = mod
const { AIR_MARKET_PRESET, PAGINA_AIR_MARKET, OGGETTI_ALTERNATIVI } = tpl

let passate = 0
let rosse = 0
const prova = (nome, fn) => {
  try {
    fn()
    passate++
    console.log(`  ok   ${nome}`)
  } catch (e) {
    rosse++
    console.log(`  ROSSA ${nome}`)
    console.log(`        ${e.message.split("\n")[0]}`)
  }
}

const riga = (variante, inviate, aperte, clic) => ({
  variante,
  oggetto: `oggetto ${variante}`,
  inviate,
  aperte,
  clic,
  aperturePct: percentuale(aperte, inviate),
  clicSuApertePct: percentuale(clic, aperte),
})

// --- Formato dei numeri e della lingua a schermo ---------------------------
//
// Nati da uno scatto del pannello: i testi mostravano "in piu'" e "non e'" al
// posto di "in più" e "non è", e le percentuali usavano il punto ("15.1%")
// perche' `toLocaleString` senza lingua prende quella dell'ambiente ("en-US" sul
// server).
//
// Nello stesso scatto avevo letto "4119" come un secondo difetto: NON lo era. In
// italiano i numeri di quattro cifre si scrivono senza separatore (4119, non
// 4.119) e ICU applica correttamente questa regola; il punto compare da cinque
// cifre (28.513). L'attesa sbagliata era la mia, non il codice: le due verifiche
// qui sotto fissano il comportamento REALE misurato, cosi' nessuno "corregge"
// una regola giusta credendola un difetto.
console.log("\n== formato italiano di numeri e testi ==")

prova("percentuali con la virgola, non col punto", () => {
  assert.equal(numero(15.15, 1), "15,2")
  assert.equal(numero(5.9, 1), "5,9")
})

prova("migliaia col punto da cinque cifre, senza sotto (regola italiana)", () => {
  assert.equal(numero(28513), "28.513")
  assert.equal(numero(4119), "4119")
  assert.equal(numero(0), "0")
})

prova("i testi dell'esito non usano apostrofi al posto degli accenti", () => {
  const casi = [
    esitoConfronto(riga("A", 100, 15, 2), riga("B", 100, 15, 2)).motivo,
    esitoConfronto(riga("A", 2000, 300, 30), riga("B", 2000, 300, 30)).motivo,
    esitoConfronto(riga("A", 2000, 400, 40), riga("B", 2000, 300, 30)).motivo,
  ]
  for (const testo of casi) {
    assert.ok(
      !/(piu'|\be'\s|puo'|perche'|cioe')/i.test(testo),
      `accento scritto con apostrofo in un testo visibile: "${testo}"`,
    )
  }
})

prova("i testi dell'esito non mostrano decimali col punto", () => {
  const m = esitoConfronto(riga("A", 2000, 400, 40), riga("B", 2000, 300, 30)).motivo
  assert.ok(!/\d+\.\d/.test(m), `decimale col punto in un testo visibile: "${m}"`)
  assert.ok(/\d+,\d/.test(m), `nessun decimale con la virgola: "${m}"`)
})

console.log("\n== provaAttiva: quando la prova NON deve partire ==")

prova("secondo oggetto assente (null) => spenta", () => {
  assert.equal(provaAttiva("Oggetto A", null), false)
})
prova("secondo oggetto assente (undefined) => spenta", () => {
  assert.equal(provaAttiva("Oggetto A", undefined), false)
})
prova("secondo oggetto vuoto => spenta", () => {
  assert.equal(provaAttiva("Oggetto A", ""), false)
})
prova("secondo oggetto di soli spazi => spenta (campo svuotato nel pannello)", () => {
  assert.equal(provaAttiva("Oggetto A", "   "), false)
})
prova("due oggetti IDENTICI => spenta (confronto con se stesso)", () => {
  assert.equal(provaAttiva("Stesso oggetto", "Stesso oggetto"), false)
})
prova("identici a meno di spazi ai bordi => spenta", () => {
  assert.equal(provaAttiva("Stesso oggetto", "  Stesso oggetto  "), false)
})
prova("primo oggetto vuoto => spenta", () => {
  assert.equal(provaAttiva("", "Oggetto B"), false)
})
prova("due oggetti diversi => attiva", () => {
  assert.equal(provaAttiva("Oggetto A", "Oggetto B"), true)
})

console.log("\n== oggettoPerDestinatario: quale email parte davvero ==")

prova("prova spenta => spedisce l'oggetto attuale, variante null", () => {
  const r = oggettoPerDestinatario({ oggettoA: "Attuale", oggettoB: null, idDestinatario: "abc" })
  assert.equal(r.oggetto, "Attuale")
  assert.equal(r.variante, null, "senza secondo oggetto la variante deve essere null, non 'A'")
})

prova("STESSO destinatario => SEMPRE la stessa variante (invio ripetuto)", () => {
  const args = { oggettoA: "A", oggettoB: "B", idDestinatario: "e7f1c0d2-1111-2222-3333-444455556666" }
  const primo = oggettoPerDestinatario(args)
  for (let i = 0; i < 50; i++) {
    const ancora = oggettoPerDestinatario(args)
    assert.equal(ancora.variante, primo.variante, "la variante cambia fra due chiamate: stessa persona, due oggetti")
    assert.equal(ancora.oggetto, primo.oggetto)
  }
})

prova("la variante A riceve l'oggetto A, la B riceve l'oggetto B", () => {
  for (let i = 0; i < 500; i++) {
    const r = oggettoPerDestinatario({ oggettoA: "AAA", oggettoB: "BBB", idDestinatario: `id-${i}` })
    if (r.variante === "A") assert.equal(r.oggetto, "AAA")
    else if (r.variante === "B") assert.equal(r.oggetto, "BBB")
    else assert.fail(`variante inattesa: ${r.variante}`)
  }
})

prova("entrambe le varianti vengono usate (non tutte da un lato)", () => {
  const viste = new Set()
  for (let i = 0; i < 200; i++) {
    viste.add(oggettoPerDestinatario({ oggettoA: "A", oggettoB: "B", idDestinatario: `x-${i}` }).variante)
  }
  assert.equal(viste.size, 2, `usata una sola variante su 200 destinatari: ${[...viste]}`)
})

prova("suddivisione vicina al 50/50 su 4.000 destinatari (coda reale)", () => {
  let a = 0
  let b = 0
  for (let i = 0; i < 4000; i++) {
    const v = oggettoPerDestinatario({
      oggettoA: "A",
      oggettoB: "B",
      // Identificativi simili a quelli veri (uuid-like), non numeri consecutivi:
      // un hash puo' comportarsi bene sui numeri e male su stringhe reali.
      idDestinatario: `9f${i.toString(16).padStart(6, "0")}-aa11-bb22-cc33-dd44ee55ff66`,
    }).variante
    if (v === "A") a++
    else b++
  }
  const scarto = Math.abs(a - b) / 4000
  assert.ok(scarto < 0.05, `suddivisione sbilanciata: A=${a} B=${b} (scarto ${(scarto * 100).toFixed(1)}%)`)
})

console.log("\n== percentuale: denominatore zero ==")

prova("zero invii => null, non 0% (il dato non c'e', non e' uno zero)", () => {
  assert.equal(percentuale(0, 0), null)
})
prova("arrotondamento a un decimale", () => {
  assert.equal(percentuale(1515, 10000), 15.2)
  assert.equal(percentuale(15, 100), 15)
})

console.log("\n== esitoConfronto: quando si puo' dichiarare un vincente ==")

prova("sotto la soglia di invii => nessun vincente", () => {
  const e = esitoConfronto(riga("A", 100, 30, 3), riga("B", 100, 10, 1))
  assert.equal(e.vincente, null, "con 100 invii per parte non si dichiara un vincente")
  assert.match(e.motivo, /troppo presto/i)
})

prova("soglia raggiunta ma scarto minimo => equivalenti, nessun vincente", () => {
  // 15,0% contro 15,5%: mezzo punto.
  const e = esitoConfronto(riga("A", 2000, 300, 30), riga("B", 2000, 310, 31))
  assert.equal(e.vincente, null)
  assert.match(e.motivo, /equivalenti/i)
})

prova("scarto ampio => dichiara il vincente giusto (B)", () => {
  // A 15,0% contro B 20,0%.
  const e = esitoConfronto(riga("A", 2000, 300, 30), riga("B", 2000, 400, 40))
  assert.equal(e.vincente, "B")
  // Virgola, non punto: il testo finisce sotto gli occhi di chi legge il pannello.
  assert.match(e.motivo, /5,0 punti/)
})

prova("scarto ampio a favore di A => dichiara A", () => {
  const e = esitoConfronto(riga("A", 2000, 400, 40), riga("B", 2000, 300, 30))
  assert.equal(e.vincente, "A")
})

prova("aperture non ancora rilevate => nessun vincente", () => {
  const a = { ...riga("A", 2000, 0, 0), aperturePct: null }
  const b = { ...riga("B", 2000, 0, 0), aperturePct: null }
  assert.equal(esitoConfronto(a, b).vincente, null)
})

prova("la soglia dichiarata e' quella usata", () => {
  const sotto = esitoConfronto(
    riga("A", INVII_MINIMI_PER_VARIANTE - 1, 60, 6),
    riga("B", INVII_MINIMI_PER_VARIANTE - 1, 20, 2),
  )
  assert.equal(sotto.vincente, null)
  const sopra = esitoConfronto(
    riga("A", INVII_MINIMI_PER_VARIANTE, 60, 6),
    riga("B", INVII_MINIMI_PER_VARIANTE, 20, 2),
  )
  assert.equal(sopra.vincente, "A", "alla soglia esatta il confronto deve poter concludere")
})

console.log("\n== email: testo accorciato e pulsante ==")

const html = AIR_MARKET_PRESET.html
const testoVisibile = html
  .replace(/<style[\s\S]*?<\/style>/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&[a-z]+;/g, " ")
  .replace(/\s+/g, " ")
  .trim()
const parole = testoVisibile.split(" ").filter(Boolean).length

prova(`corpo email breve (parole totali: ${parole}, prima erano 152)`, () => {
  assert.ok(parole < 130, `il testo e' tornato lungo: ${parole} parole`)
})

prova("il gancio sta in tre paragrafi, non di piu'", () => {
  const gancio = html.split("<!-- Gancio -->")[1]?.split("</td>")[0] || ""
  const paragrafi = (gancio.match(/<p /g) || []).length
  assert.equal(paragrafi, 3, `paragrafi nel gancio: ${paragrafi}`)
})

prova("il riquadro di confronto NON e' piu' nell'email (va nella pagina)", () => {
  assert.ok(
    !/Cosa cambia rispetto|A differenza dei/i.test(testoVisibile),
    "il riquadro di confronto e' ancora nell'email: spiega troppo e toglie motivo di cliccare",
  )
})

prova("il pulsante porta all'indirizzo dichiarato nella costante", () => {
  assert.ok(html.includes(`href="${PAGINA_AIR_MARKET}"`), "il pulsante non porta a PAGINA_AIR_MARKET")
})

// Questa verifica legge il SORGENTE, non l'HTML generato.
//
// Prima controllava l'html: ma finche' `PAGINA_AIR_MARKET` vale esattamente
// l'indirizzo attuale, scriverlo a mano nel pulsante produce un html IDENTICO.
// La prova passava in entrambi i casi, cioe' confrontava un valore con se stesso
// e non poteva accorgersi di nulla. Il sabotaggio 8 l'ha smascherata.
prova("nel sorgente il pulsante usa la costante, non un indirizzo scritto a mano", () => {
  const sorgente = readFileSync(new URL("../lib/dem/air-market-template.ts", import.meta.url), "utf8")
  const rigaPulsante = sorgente
    .split("\n")
    .find((l) => l.includes("<a href=") && l.includes("border-radius"))
  assert.ok(rigaPulsante, "riga del pulsante non trovata nel sorgente")
  assert.ok(
    rigaPulsante.includes("${PAGINA_AIR_MARKET}"),
    "il pulsante ha un indirizzo scritto a mano: quando arrivera' il link della pagina nuova, cambiarlo in un solo posto non basterebbe piu'",
  )
  assert.ok(
    !/href="https?:\/\//.test(rigaPulsante),
    `indirizzo letterale nel pulsante: ${rigaPulsante.trim().slice(0, 80)}`,
  )
})

prova("un solo indirizzo di atterraggio in tutta l'email", () => {
  const occorrenze = (html.match(/santaddeo\.com\/features/g) || []).length
  assert.ok(occorrenze <= 1, `l'indirizzo compare ${occorrenze} volte: cambiarlo richiederebbe piu' modifiche`)
})

prova("resta un invito alla demo", () => {
  assert.ok(/prenota una demo/i.test(testoVisibile), "l'invito alla demo e' scomparso")
})

console.log("\n== oggetti alternativi da provare ==")

prova("ci sono piu' proposte fra cui scegliere", () => {
  assert.ok(OGGETTI_ALTERNATIVI.length >= 4, `solo ${OGGETTI_ALTERNATIVI.length} proposte`)
})

prova("nessuna proposta promette numeri o percentuali", () => {
  for (const o of OGGETTI_ALTERNATIVI) {
    assert.ok(!/%|\+\d|\d+%/.test(o), `promessa numerica non sostenibile: "${o}"`)
  }
})

prova("nessuna proposta e' uguale all'oggetto attuale", () => {
  for (const o of OGGETTI_ALTERNATIVI) {
    assert.notEqual(o.trim(), AIR_MARKET_PRESET.subject.trim(), `duplicato dell'attuale: "${o}"`)
  }
})

prova("lunghezza adatta all'anteprima del telefono (max 60 caratteri)", () => {
  for (const o of OGGETTI_ALTERNATIVI) {
    assert.ok(o.length <= 60, `troncato sul telefono (${o.length} caratteri): "${o}"`)
  }
})

prova("nessuna proposta contiene parole che finiscono in spam", () => {
  // "gratis", "offerta", il punto esclamativo doppio e le maiuscole urlate sono i
  // segnali che i filtri pesano di piu' su una lista fredda.
  for (const o of OGGETTI_ALTERNATIVI) {
    assert.ok(!/gratis|offerta|!!|sconto|promozione/i.test(o), `parola a rischio spam: "${o}"`)
  }
})

console.log(`\n=== ESITO: ${passate} passate, ${rosse} rosse ===`)
if (rosse > 0) process.exit(1)
