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
  confrontoConStorico,
  distinguibili,
  numero,
  INVII_MINIMI_PER_VARIANTE,
  SCARTO_MINIMO_PUNTI,
  applicaVarianteAlLink,
} = mod
const {
  AIR_MARKET_PRESET,
  AIR_MARKET_CLIENTI_PRESET,
  AIR_MARKET_COLLABORATORI_PRESET,
  PAGINA_AIR_MARKET,
  OGGETTI_ALTERNATIVI,
  OGGETTO_A,
  OGGETTO_B,
  OGGETTO_STORICO,
} = tpl

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

// Riga dello storico (le email spedite prima della prova). Definita qui e non
// piu' in basso perche' serve anche alle verifiche sulla soglia.
const STOR = (inviate, aperte) => ({ inviate, aperturePct: percentuale(aperte, inviate) })

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

// --- La soglia dello scarto: una sola, non due copie -----------------------
//
// Difetto trovato MISURANDO uno scatto, non leggendo il codice: sugli stessi
// numeri (A 15,5% / B 14,0%, scarto esattamente 1,5) il pannello dichiarava "A
// apre di piu'" nel riquadro delle varianti e "in linea, nessun miglioramento"
// in quello contro lo storico. La soglia 1,5 era scritta due volte, con due
// confronti diversi: `scarto < 1.5` e `Math.abs(scarto) < 1.5`. Due copie della
// stessa regola sono due regole che possono divergere.
console.log("\n== soglia dello scarto: una sola regola ==")

prova("allo scarto ESATTO la soglia decide, non rifiuta", () => {
  assert.equal(distinguibili(15.5, 14), true, "1,5 e' il minimo accettabile, non il primo rifiutato")
  assert.equal(distinguibili(14, 15.5), true, "l'ordine degli argomenti non deve contare")
})

prova("sotto la soglia non si distingue", () => {
  assert.equal(distinguibili(15.5, 14.1), false)
  assert.equal(distinguibili(15, 15), false)
})

prova("la costante dichiarata e' quella usata", () => {
  assert.equal(distinguibili(10, 10 + SCARTO_MINIMO_PUNTI), true)
  assert.equal(distinguibili(10, 10 + SCARTO_MINIMO_PUNTI - 0.1), false)
})

// Questa verifica esiste perche' un sabotaggio ha smascherato un buco: alzando
// SOLO la soglia del confronto con lo storico (a 3 punti) nessuna prova
// arrossiva. Le verifiche c'erano, ma tutte con scarti larghi (5 punti) o
// piccolissimi (0,4): nessuna cadeva nella fascia in cui le due soglie
// divergono. Un guasto che nessuna prova vede e' un guasto che arriva in
// produzione.
prova("il confronto con lo storico usa la SOGLIA CONDIVISA, non una propria", () => {
  // Storico 15,0% (300/2000). La variante piu' alta apre 16,6% (332/2000): scarto
  // 1,6 punti, appena SOPRA la soglia condivisa di 1,5 ma sotto qualsiasi soglia
  // piu' generosa. Se questo caso non dice "supera", la soglia dello storico e'
  // stata slegata da quella delle varianti.
  const m = confrontoConStorico([riga("A", 2000, 332, 33), riga("B", 2000, 300, 30)], STOR(2000, 300))
  assert.match(
    m,
    /supera/,
    `scarto di 1,6 punti sopra la soglia condivisa (${SCARTO_MINIMO_PUNTI}) ma non dichiarato: il confronto con lo storico usa una soglia propria`,
  )
})

prova("i due confronti concordano sugli STESSI numeri (scarto esatto)", () => {
  // Il caso dello scatto: A 15,5% - B 14,0% = 1,5 esatti, e A supera lo storico
  // (15,1%) di 0,4 punti, che invece e' sotto soglia. Le due frasi devono essere
  // coerenti: A vince fra le varianti, ma NON e' un miglioramento sullo storico.
  const a = riga("A", 2000, 310, 30)
  const b = riga("B", 2000, 280, 28)
  const e = esitoConfronto(a, b)
  assert.equal(e.vincente, "A", "allo scarto esatto il vincente deve essere dichiarato")

  const m = confrontoConStorico([a, b], STOR(4119, 624))
  assert.match(m, /in linea/, "0,4 punti sullo storico sono sotto soglia: non e' un miglioramento")
  // La coerenza che il pannello deve garantire: se qui si dichiara un vincente,
  // il testo non puo' chiamare "equivalenti" le due varianti.
  assert.ok(!/equivalenti/i.test(e.motivo), `dichiara un vincente e le dice equivalenti: "${e.motivo}"`)
})

// I commenti in testa al modulo citano numeri, e sbagliavano entrambi: "soglia di
// 300" contro una costante di 400, e "coda utile di ~4.000" contro 24.394 righe
// reali. Un commento che contraddice il codice e' peggio di un commento assente,
// perche' chi legge gli crede. Qui il numero dichiarato viene confrontato con la
// costante vera, cosi' non possono piu' divergere in silenzio.
prova("il commento in testa dichiara la soglia VERA, non un numero inventato", () => {
  const sorgente = readFileSync(new URL("../lib/dem/ab-oggetto.ts", import.meta.url), "utf8")
  const testa = sorgente.slice(0, sorgente.indexOf("export type VarianteOggetto"))
  // Si cerca solo la forma che DICHIARA la soglia, cioe' seguita dal nome della
  // costante. La prima versione di questa sonda prendeva ogni "soglia di N" e
  // arrossiva sulla nota storica in fondo al commento, quella che RACCONTA il
  // numero sbagliato di prima: il codice era giusto e il difetto stava nel mio
  // metro. Anche una prova puo' essere il sospettato.
  const citati = [...testa.matchAll(/soglia di (\d+) \(INVII_MINIMI_PER_VARIANTE\)/g)].map((m) => Number(m[1]))
  assert.ok(citati.length > 0, "il commento non dichiara piu' la soglia: verifica da aggiornare o da togliere")
  for (const n of citati) {
    assert.equal(
      n,
      INVII_MINIMI_PER_VARIANTE,
      `il commento dice "soglia di ${n}" ma la costante vale ${INVII_MINIMI_PER_VARIANTE}`,
    )
  }
})

// --- Link della pagina e attribuzione dei contatti -------------------------
//
// Misurato sulla pagina VERA (19/08/2026): la landing ricopia `utm_content` nei
// propri link verso `/request-info`, e senza parametri passa solo
// `ref=landing-air-market`. Quindi cio' che l'email scrive nell'indirizzo decide
// se un contatto nato da questa campagna sara' riconoscibile, e da quale variante.
console.log("\n== link della pagina: provenienza e variante ==")

const linkDi = (testo) => {
  const m = testo.match(/href="(https:\/\/www\.santaddeo\.com[^"]*)"/)
  assert.ok(m, "nessun link a www.santaddeo.com nel corpo")
  return m[1]
}

prova("il pulsante punta alla pagina dedicata, non a quella generica", () => {
  const l = linkDi(AIR_MARKET_PRESET.html)
  assert.ok(l.startsWith("https://www.santaddeo.com/landing/air-market"), `punta a: ${l}`)
  assert.ok(!l.includes("/features"), "punta ancora alla pagina generica delle funzionalita'")
})

prova("l'host e' quello finale, senza un reindirizzamento in mezzo", () => {
  // `santaddeo.com` risponde con un reindirizzamento a `www.santaddeo.com`, e
  // questo link passa GIA' dal reindirizzamento del tracciamento clic: ogni salto
  // in meno e' un punto in meno dove perdere i parametri.
  assert.match(linkDi(AIR_MARKET_PRESET.html), /^https:\/\/www\.santaddeo\.com\//)
})

prova("le & sono nude, non scritte come &amp;", () => {
  // Vincolo tecnico, non stilistico: la riscrittura dei link per il tracciamento
  // clic prende l'indirizzo dall'attributo e lo codifica cosi' com'e'. Con
  // `&amp;` l'indirizzo finale avrebbe `amp;utm_medium` e il parametro sarebbe
  // perso senza che nulla sembri rotto.
  for (const [nome, p] of [
    ["freddi", AIR_MARKET_PRESET],
    ["clienti", AIR_MARKET_CLIENTI_PRESET],
    ["collaboratori", AIR_MARKET_COLLABORATORI_PRESET],
  ]) {
    assert.ok(!linkDi(p.html).includes("&amp;"), `la versione ${nome} scrive &amp; nel link`)
  }
})

prova("i tre pubblici finiscono in campagne DISTINTE", () => {
  // Lo stesso pulsante e' usato dalle tre versioni: un `utm_campaign` unico
  // avrebbe fatto sembrare tre invii a pubblici diversi una sola campagna.
  const c = (p) => new URL(linkDi(p.html)).searchParams.get("utm_campaign")
  const freddi = c(AIR_MARKET_PRESET)
  const clienti = c(AIR_MARKET_CLIENTI_PRESET)
  const collab = c(AIR_MARKET_COLLABORATORI_PRESET)
  assert.equal(freddi, "air-market")
  assert.notEqual(clienti, freddi, "clienti e freddi nella stessa campagna")
  assert.notEqual(collab, freddi, "collaboratori e freddi nella stessa campagna")
  assert.notEqual(clienti, collab, "clienti e collaboratori nella stessa campagna")
})

prova("solo la versione con la prova A/B porta il segnaposto della variante", () => {
  assert.ok(linkDi(AIR_MARKET_PRESET.html).includes("{{variante}}"), "manca nella versione per i freddi")
  for (const [nome, p] of [
    ["clienti", AIR_MARKET_CLIENTI_PRESET],
    ["collaboratori", AIR_MARKET_COLLABORATORI_PRESET],
  ]) {
    assert.ok(
      !linkDi(p.html).includes("{{variante}}"),
      `la versione ${nome} non ha un oggetto B: il parametro darebbe una colonna senza significato`,
    )
  }
})

// Le tre che seguono ESEGUONO `applicaVarianteAlLink`, la funzione che usa la
// rotta di invio: non una copia dell'espressione riscritta qui dentro, che
// proverebbe l'imitazione e non il codice che spedisce.
prova("a prova accesa il link porta la variante realmente spedita", () => {
  for (const v of ["A", "B"]) {
    const l = linkDi(applicaVarianteAlLink(AIR_MARKET_PRESET.html, v))
    assert.equal(new URL(l).searchParams.get("utm_content"), v)
    assert.ok(!l.includes("{{"), `segnaposto non sostituito: ${l}`)
  }
})

prova("a prova spenta il parametro sparisce insieme alla sua &", () => {
  const l = linkDi(applicaVarianteAlLink(AIR_MARKET_PRESET.html, null))
  assert.ok(!l.includes("utm_content"), `parametro rimasto senza valore: ${l}`)
  assert.ok(!l.includes("{{"), `segnaposto rimasto nell'indirizzo: ${l}`)
  assert.ok(!l.includes("&&"), `doppia & nell'indirizzo: ${l}`)
  assert.ok(!l.endsWith("&"), `indirizzo che finisce con &: ${l}`)
  // Gli altri tre devono restare: senza di essi il contatto arriverebbe al modulo
  // indistinguibile da uno venuto da una ricerca.
  const p = new URL(l).searchParams
  assert.equal(p.get("utm_source"), "dem")
  assert.equal(p.get("utm_medium"), "email")
  assert.equal(p.get("utm_campaign"), "air-market")
})

prova("i parametri sono quelli attesi, letti da un lettore di indirizzi", () => {
  // Un `?` o una `&` fuori posto danno un indirizzo che si apre comunque, ma con i
  // parametri attaccati fra loro: un difetto che si vedrebbe solo mesi dopo,
  // guardando le statistiche.
  const p = new URL(linkDi(applicaVarianteAlLink(AIR_MARKET_PRESET.html, "A"))).searchParams
  assert.deepEqual(
    [...p.keys()].sort(),
    ["utm_campaign", "utm_content", "utm_medium", "utm_source"],
    "i parametri letti non sono i quattro attesi",
  )
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
  // L'indirizzo ora porta i parametri di provenienza, quindi non e' piu' uguale
  // alla costante: si verifica che ci COMINCI, seguito da `?`. Il confronto per
  // uguaglianza esatta che c'era prima diventerebbe rosso senza che nulla sia
  // rotto, e "aggiustarlo" togliendo il controllo avrebbe lasciato il pulsante
  // libero di puntare altrove.
  assert.ok(
    html.includes(`href="${PAGINA_AIR_MARKET}?`),
    `il pulsante non porta a PAGINA_AIR_MARKET: ${linkDi(html)}`,
  )
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
  // Cercava `santaddeo.com/features`, che dal cambio di pagina non esiste piu' in
  // nessuna email: contava zero occorrenze e passava sempre. Un controllo che non
  // puo' fallire non e' un controllo. Ora conta l'indirizzo VERO, e la verifica
  // che sia esattamente uno la rende capace di arrossire in entrambi i sensi.
  const occorrenze = (html.match(/www\.santaddeo\.com\/landing\/air-market/g) || []).length
  assert.equal(occorrenze, 1, `l'indirizzo di atterraggio compare ${occorrenze} volte, non una`)
})

prova("resta un invito alla demo", () => {
  assert.ok(/prenota una demo/i.test(testoVisibile), "l'invito alla demo e' scomparso")
})

console.log("\n== confronto con l'oggetto storico (l'asticella) ==")

// La prova mette in gara due oggetti NUOVI: dice quale dei due apre meglio, ma
// non se battono quello di prima. Queste verifiche proteggono la riga che
// risponde a "abbiamo migliorato?".

prova("senza abbastanza invii storici non si dice niente", () => {
  // 30 invii storici darebbero una percentuale precisa e insensata.
  assert.equal(confrontoConStorico([riga("A", 2000, 400, 40), riga("B", 2000, 300, 30)], STOR(30, 5)), null)
})

prova("senza aperture storiche rilevate non si dice niente", () => {
  assert.equal(confrontoConStorico([riga("A", 2000, 400, 40), riga("B", 2000, 300, 30)], STOR(0, 0)), null)
})

prova("finche' le varianti sono sotto soglia non si dice niente", () => {
  assert.equal(confrontoConStorico([riga("A", 100, 20, 2), riga("B", 100, 15, 2)], STOR(4119, 624)), null)
})

prova("dichiara il miglioramento quando la piu' alta supera lo storico", () => {
  // storico 4119/624 = 15,1% ; A 2000/400 = 20%
  const m = confrontoConStorico([riga("A", 2000, 400, 40), riga("B", 2000, 300, 30)], STOR(4119, 624))
  assert.match(m, /supera/)
  assert.match(m, /^La più alta delle due \(A/)
  assert.match(m, /non è un confronto alla pari/)
})

// "Piu' alta", non "migliore", e non e' pignoleria linguistica.
//
// Colto NELLO SCATTO: nel caso di scarto minimo il pannello diceva "le due
// varianti sono equivalenti" e due righe sotto "la MIGLIORE delle due (A)".
// Se non si distinguono, nessuna delle due e' migliore: le due frasi si
// contraddicevano nella stessa schermata. "Piu' alta" dichiara solo il fatto
// misurato, senza sostenere un giudizio che a quello scarto non possiamo dare.
prova("non chiama 'migliore' una variante quando sono equivalenti", () => {
  const m = confrontoConStorico([riga("A", 2000, 310, 30), riga("B", 2000, 280, 28)], STOR(4119, 624))
  assert.match(m, /in linea/, "questo caso deve essere quello dello scarto minimo")
  assert.ok(
    !/migliore/i.test(m),
    `dice "migliore" mentre l'altro riquadro dichiara le varianti equivalenti: "${m}"`,
  )
})

prova("avverte quando ENTRAMBE restano sotto lo storico", () => {
  // storico 15,1% ; A 10% ; B 9% -> la migliore (A) e' comunque sotto
  const m = confrontoConStorico([riga("A", 2000, 200, 20), riga("B", 2000, 180, 18)], STOR(4119, 624))
  assert.match(m, /sotto/)
  assert.match(m, /rimettere in gara l'oggetto precedente/)
})

prova("dice 'in linea' quando lo scarto e' rumore", () => {
  // storico 15,1% ; A 15,5% -> 0,4 punti: sotto la soglia di 1,5
  const m = confrontoConStorico([riga("A", 2000, 310, 30), riga("B", 2000, 280, 28)], STOR(4119, 624))
  assert.match(m, /in linea/)
  assert.match(m, /non ha ancora prodotto un miglioramento/)
})

prova("confronta con la PIU' ALTA delle due, non con la prima", () => {
  // B (20%) apre piu' di A (10%): il testo deve parlare di B.
  const m = confrontoConStorico([riga("A", 2000, 200, 20), riga("B", 2000, 400, 40)], STOR(4119, 624))
  assert.match(m, /^La più alta delle due \(B/)
  assert.match(m, /supera/)
})

prova("ignora una variante ancora sotto soglia invece di farla vincere", () => {
  // A ha 100 invii e 50% di aperture: sembrerebbe la piu' alta, ma e' rumore.
  // Deve valere B, che ha invii sufficienti.
  const m = confrontoConStorico([riga("A", 100, 50, 5), riga("B", 2000, 400, 40)], STOR(4119, 624))
  assert.match(m, /^La più alta delle due \(B/)
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

// La verifica che stava qui ("nessuna proposta e' uguale all'oggetto attuale") e'
// stata rimossa perche' era diventata FALSA per costruzione: il committente ha
// scelto di mettere in gara la proposta 1 contro la 3, quindi l'oggetto A ORA E'
// una delle proposte. Tenerla avrebbe significato tenere una prova che vieta
// esattamente cio' che si e' deciso di fare.
prova("l'oggetto dell'email e' la variante A scelta", () => {
  assert.equal(AIR_MARKET_PRESET.subject, OGGETTO_A)
  assert.equal(OGGETTO_A, OGGETTI_ALTERNATIVI[0], "la variante A non e' la proposta 1")
  assert.equal(OGGETTO_B, OGGETTI_ALTERNATIVI[2], "la variante B non e' la proposta 3")
})

prova("le due varianti sono diverse fra loro e dallo storico", () => {
  assert.notEqual(OGGETTO_A.trim(), OGGETTO_B.trim(), "A e B identici: confronto con se stesso")
  assert.notEqual(OGGETTO_A.trim(), OGGETTO_STORICO.trim())
  assert.notEqual(OGGETTO_B.trim(), OGGETTO_STORICO.trim())
})

// Il vincolo piu' importante del corpo, e nasce dalla prova A/B.
//
// Un solo corpo serve DUE oggetti: se il titolo ricopia l'oggetto A, chi riceve
// il B legge un'email che comincia con una frase diversa da quella che l'ha
// convinto ad aprire. La versione precedente ripeteva parola per parola l'oggetto
// di allora, quindi con la prova accesa sarebbe stata sbagliata per meta' dei
// destinatari.
prova("il corpo non ricopia nessuno dei due oggetti", () => {
  for (const [nome, oggetto] of [
    ["A", OGGETTO_A],
    ["B", OGGETTO_B],
    ["storico", OGGETTO_STORICO],
  ]) {
    const senzaPunto = oggetto.replace(/[?.!]+$/, "").trim().toLowerCase()
    assert.ok(
      !testoVisibile.toLowerCase().includes(senzaPunto),
      `il corpo ripete l'oggetto ${nome} ("${oggetto}"): incoerente per chi ha ricevuto l'altra variante`,
    )
  }
})

prova("l'anteprima non ricopia nessuno dei due oggetti", () => {
  // L'anteprima si legge ACCANTO all'oggetto nella casella: ripeterlo spreca
  // l'unico spazio disponibile per aggiungere un motivo per aprire.
  const sorgente = readFileSync(new URL("../lib/dem/air-market-template.ts", import.meta.url), "utf8")
  const riga = sorgente.split("\n").find((l) => l.trim().startsWith("anteprima:"))
  assert.ok(riga, "riga dell'anteprima non trovata")
  for (const oggetto of [OGGETTO_A, OGGETTO_B]) {
    const senzaPunto = oggetto.replace(/[?.!]+$/, "").trim().toLowerCase()
    assert.ok(!riga.toLowerCase().includes(senzaPunto), `l'anteprima ripete "${oggetto}"`)
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
