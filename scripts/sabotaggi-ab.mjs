// Sabotaggi: verificano che le prove sappiano ARROSSIRE.
//
// Una suite verde non dimostra nulla se nessuno ha mai controllato che possa
// fallire. Qui si guasta il codice di proposito, un guasto per volta, e si
// pretende che `check:ab` diventi rosso. Se resta verde, la prova non protegge
// quel comportamento.
//
// Ogni giro: impronta del file -> guasto -> conferma che il guasto e' DAVVERO nel
// file -> esecuzione -> ripristino -> confronto dell'impronta.
//
//   node scripts/sabotaggi-ab.mjs

import { readFileSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { execSync } from "node:child_process"

const AB = "lib/dem/ab-oggetto.ts"
const TPL = "lib/dem/air-market-template.ts"

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex")

const sabotaggi = [
  {
    nome: "1. Variante casuale invece di hash stabile",
    file: AB,
    da: "  return h >>> 0\n}",
    a: "  return Math.floor(Math.random() * 4294967295)\n}",
    attesa: /stessa la stessa variante|la variante cambia|STESSO destinatario/i,
  },
  {
    nome: "2. provaAttiva accetta due oggetti identici",
    file: AB,
    da: "  return a !== b",
    a: "  return true",
    attesa: /IDENTICI|identici a meno di spazi/i,
  },
  {
    nome: "3. Prova spenta marcata 'A' invece di null",
    file: AB,
    da: 'return { oggetto: oggettoA, variante: null }',
    a: 'return { oggetto: oggettoA, variante: "A" }',
    attesa: /prova spenta/i,
  },
  {
    nome: "4. Soglia minima di invii azzerata",
    file: AB,
    da: "export const INVII_MINIMI_PER_VARIANTE = 400",
    a: "export const INVII_MINIMI_PER_VARIANTE = 0",
    attesa: /sotto la soglia|troppo presto|soglia dichiarata/i,
  },
  {
    nome: "5. percentuale restituisce 0 invece di null",
    file: AB,
    da: "  if (!denominatore || denominatore <= 0) return null",
    a: "  if (!denominatore || denominatore <= 0) return 0",
    attesa: /zero invii/i,
  },
  {
    nome: "6. Scarto minimo dichiarato vincente (soglia rumore a zero)",
    file: AB,
    da: "  if (scarto < 1.5) {",
    a: "  if (scarto < 0) {",
    attesa: /equivalenti/i,
  },
  {
    nome: "7. Email riallungata con un quarto paragrafo",
    file: TPL,
    da: `<p style="margin:0 0 6px;">Santaddeo legge quel dato`,
    a: `<p style="margin:0 0 18px;">Testo aggiunto che riporta l'email alla lunghezza di prima, spiegando per filo e per segno tutto il funzionamento del modulo, i mercati coperti, la frequenza di aggiornamento dei dati, le integrazioni disponibili e ogni altro dettaglio che rende inutile aprire la pagina di destinazione perche' chi legge ha gia' capito tutto e non ha piu' alcun motivo di cliccare sul pulsante.</p>
              <p style="margin:0 0 6px;">Santaddeo legge quel dato`,
    attesa: /corpo email breve|tre paragrafi/i,
  },
  {
    nome: "8. Indirizzo della pagina scritto a mano nel pulsante",
    file: TPL,
    da: 'href="${PAGINA_AIR_MARKET}"',
    a: 'href="https://www.santaddeo.com/features"',
    attesa: /nel sorgente il pulsante usa la costante/i,
  },
  {
    nome: "9. Proposta con promessa numerica non sostenibile",
    file: TPL,
    da: '"Il volo è prenotato. La camera no.",',
    a: '"Aumenta il RevPAR del +18% con i dati dei voli",',
    attesa: /promette numeri|percentuali/i,
  },
  {
    // Era "proposta identica all'oggetto attuale", verifica rimossa quando il
    // committente ha scelto di mettere in gara la proposta 1: ora l'oggetto A E'
    // una proposta, quindi quella regola era diventata falsa per costruzione.
    // Al suo posto si guasta il vincolo che conta con la prova accesa.
    nome: "10. Il corpo ricopia l'oggetto della variante A",
    file: TPL,
    da: "I voli verso il tuo aeroporto sono già prenotati. Le camere no.",
    a: "Sai quanti voli sono già prenotati verso il tuo aeroporto?",
    attesa: /non ricopia nessuno dei due oggetti|ripete l'oggetto/i,
  },
  {
    nome: "11. L'anteprima ricopia l'oggetto della variante B",
    file: TPL,
    da: 'anteprima: "I voli già in calendario dicono da quali paesi arriverà la domanda."',
    a: 'anteprima: "C\'è un dato che il tuo revenue non sta guardando."',
    attesa: /anteprima non ricopia/i,
  },
  {
    nome: "12. Confronto con lo storico anche con pochi invii storici",
    file: AB,
    da: "  if (storico.inviate < INVII_MINIMI_PER_VARIANTE) return null",
    a: "  if (storico.inviate < 0) return null",
    attesa: /senza abbastanza invii storici/i,
  },
  {
    nome: "13. Confronto con la PRIMA variante invece della migliore",
    file: AB,
    da: "  const migliore = pronte.reduce((x, y) => (y.aperturePct > x.aperturePct ? y : x))",
    a: "  const migliore = pronte[0]",
    attesa: /MIGLIORE delle due/i,
  },
  {
    nome: "14. Nel confronto con lo storico entra anche una variante sotto soglia",
    file: AB,
    da: "      v.inviate >= INVII_MINIMI_PER_VARIANTE && v.aperturePct !== null,",
    a: "      v.aperturePct !== null,",
    attesa: /sotto soglia|varianti sono sotto soglia/i,
  },
  {
    nome: "15. Il confronto con lo storico non avverte piu' che non e' alla pari",
    file: AB,
    da: " Attenzione, non è un confronto alla pari — lo storico è stato spedito in giorni diversi e con un altro testo.`\n  }\n  return `Entrambe restano sotto il ${asticella}",
    a: "`\n  }\n  return `Entrambe restano sotto il ${asticella}",
    attesa: /confronto alla pari/i,
  },
]

const esegui = () => {
  try {
    const out = execSync(
      "node --experimental-strip-types --import ./scripts/registra-hook-ts.mjs scripts/check-ab-oggetto.mjs 2>&1",
      { encoding: "utf8" },
    )
    return { uscita: 0, out }
  } catch (e) {
    return { uscita: e.status ?? 1, out: (e.stdout || "") + (e.stderr || "") }
  }
}

console.log("=== CONTROLLO: le prove sono verdi sul codice CORRETTO ===")
const partenza = esegui()
const rosseInizio = (partenza.out.match(/ROSSA/g) || []).length
console.log(`uscita ${partenza.uscita}, rosse ${rosseInizio}`)
if (partenza.uscita !== 0 || rosseInizio > 0) {
  console.log("Le prove sono gia' rosse: inutile sabotare. Interrompo.")
  process.exit(1)
}

let colti = 0
for (const s of sabotaggi) {
  console.log(`\n--- ${s.nome}`)
  const impronta = sha(s.file)
  const originale = readFileSync(s.file, "utf8")

  if (!originale.includes(s.da)) {
    console.log(`  SALTATO: testo da sostituire non trovato in ${s.file}`)
    continue
  }
  writeFileSync(s.file, originale.replace(s.da, s.a))

  // Conferma che il guasto e' davvero nel file: senza questo, un sabotaggio non
  // applicato passerebbe per "prova che non arrossisce" o viceversa.
  //
  // Si verifica che il testo nuovo sia presente E che il file sia cambiato. NON
  // si pretende la scomparsa del testo originale: in alcuni sabotaggi la
  // sostituzione lo contiene di proposito (il numero 7 aggiunge un paragrafo
  // PRIMA di quello esistente), e la versione precedente di questo controllo
  // dichiarava "NO" su un guasto in realta' applicato - una conferma che mentiva.
  const dopo = readFileSync(s.file, "utf8")
  const applicato = dopo.includes(s.a) && sha(s.file) !== impronta
  console.log(`  guasto applicato: ${applicato ? "SI" : "NO"}`)
  if (!applicato) {
    console.log("  ATTENZIONE: guasto non applicato, l'esito che segue non vale.")
  }

  const r = esegui()
  const rosse = (r.out.match(/ROSSA/g) || []).length
  const schianto = /Error|Cannot|SyntaxError/i.test(r.out) && rosse === 0
  const coltoDallaProva = r.uscita !== 0 && rosse > 0 && s.attesa.test(r.out)

  console.log(`  uscita ${r.uscita}, prove rosse ${rosse}${schianto ? " (SCHIANTO, non un rosso da controllo)" : ""}`)
  if (coltoDallaProva) {
    const quali = r.out
      .split("\n")
      .filter((l) => l.includes("ROSSA"))
      .map((l) => l.replace(/\s+ROSSA\s+/, "").trim())
    console.log(`  COLTO dalla prova attesa. Rosse: ${quali.join(" | ")}`)
    colti++
  } else {
    console.log("  NON COLTO dalla prova attesa: la verifica non protegge questo comportamento.")
    if (rosse > 0) console.log(`  (rosse presenti ma non quella attesa)`)
  }

  writeFileSync(s.file, originale)
  const ripristinata = sha(s.file)
  console.log(`  ripristino: ${ripristinata === impronta ? "impronta identica" : "DIVERSA - ATTENZIONE"}`)
}

console.log(`\n=== SABOTAGGI COLTI: ${colti} su ${sabotaggi.length} ===`)

const finale = esegui()
console.log(`controllo finale sul codice ripristinato: uscita ${finale.uscita}, rosse ${(finale.out.match(/ROSSA/g) || []).length}`)
if (colti < sabotaggi.length || finale.uscita !== 0) process.exit(1)
