/**
 * Sabotaggi sul supporto video dei post social.
 *
 * A che serve: 30 prove verdi non dimostrano nulla se non sanno diventare rosse.
 * Questo script rompe il codice di proposito, un difetto per volta, e pretende
 * che la suite se ne accorga.
 *
 * Due guardie, imparate sbagliando:
 *
 * 1. GUARDIA DI APPLICAZIONE. Se la riga da sostituire non esiste piu' (l'ho
 *    trascritta male, o il codice e' cambiato), il sabotaggio NON viene applicato
 *    e la suite resta verde: un falso "colto". Qui un sabotaggio non applicato
 *    e' un ERRORE dichiarato, non un successo silenzioso.
 *
 * 2. MUTANTI EQUIVALENTI DICHIARATI. Un sabotaggio che non cambia il
 *    comportamento non puo' essere colto da nessuna prova, e pretenderlo
 *    porterebbe a scrivere prove che affermano il falso. Vanno marcati
 *    `equivalente: true` e verificati: devono lasciare la suite VERDE.
 *
 * Uso: node scripts/sabotaggi-social-video.mjs
 */
import { execSync } from "node:child_process"
import fs from "node:fs"

const VIDEO = "lib/social/video.ts"
const CRON = "app/api/cron/publish-scheduled-posts/route.ts"
const CAMPAGNA = "lib/social/campaign-video.ts"
const RUNNER = "lib/social/campaign-runner.ts"

const originali = Object.fromEntries(
  [VIDEO, CRON, CAMPAGNA, RUNNER].map((f) => [f, fs.readFileSync(f, "utf8")]),
)
const ripristina = () => {
  for (const [f, c] of Object.entries(originali)) fs.writeFileSync(f, c)
}

const sabotaggi = [
  {
    file: VIDEO,
    cerca: 'if (!extOk || (file.type !== "" && !mimeOk))',
    sost: "if (!extOk && !mimeOk)",
    rompe: "un eseguibile con type 'video/mp4' verrebbe accettato e caricato nello spazio pubblico",
  },
  {
    file: VIDEO,
    cerca: 'if (!extOk || (file.type !== "" && !mimeOk))',
    sost: "if (!extOk || !mimeOk)",
    rompe: "un .mp4 legittimo verrebbe rifiutato quando il browser non dichiara alcun tipo",
  },
  {
    file: VIDEO,
    cerca: "if (!/youtube\\.com|youtu\\.be/i.test(url)) return false",
    sost: "",
    rompe: "una parola qualsiasi di 11 lettere passerebbe per un video YouTube",
  },
  {
    file: VIDEO,
    cerca: "export const MAX_VIDEO_BYTES = 200 * 1024 * 1024",
    sost: "export const MAX_VIDEO_BYTES = 200 * 1024 * 1024 * 1024",
    rompe: "il limite di dimensione non fermerebbe piu' nessun file",
  },
  {
    file: VIDEO,
    cerca: 'if (inAttesa) return { stato: "processing", scaduto: false }',
    sost: 'if (inAttesa) return { stato: "failed", scaduto: false }',
    rompe: "un Reel in elaborazione dichiarato fallito: il video caricato su Meta verrebbe abbandonato",
  },
  {
    file: VIDEO,
    cerca: "if (inAttesa && avviato > 0 && adesso - avviato > LIMITE_ATTESA_MS)",
    sost: "if (false && inAttesa && avviato > 0 && adesso - avviato > LIMITE_ATTESA_MS)",
    rompe: "l'attesa non scadrebbe mai: un post resterebbe 'in elaborazione' per sempre",
  },
  {
    file: VIDEO,
    cerca: "return esistente || adesso.toISOString()",
    sost: "return adesso.toISOString()",
    rompe: "l'istante di avvio riscritto a ogni giro del cron azzera il conto alla rovescia",
  },
  {
    file: VIDEO,
    cerca: 'if (kind === "youtube") {\n      return {\n        ok: false',
    sost: 'if (kind === "youtube") {\n      return {\n        ok: true',
    rompe: "Instagram accetterebbe un link YouTube, e la pubblicazione fallirebbe lato Meta",
  },
  {
    file: VIDEO,
    cerca: "if (senzaAccount.has(p)) continue",
    sost: "if (false) continue",
    rompe: "l'avviso nominerebbe un canale senza account collegato, promettendo una pubblicazione impossibile",
  },
  {
    // Questo e' l'errore che avevo scritto davvero: trattare la lista vuota come
    // "nessuna destinazione", mentre la rotta la interpreta come "tutti gli attivi".
    file: VIDEO,
    cerca: "    if (senzaAccount.has(p)) continue",
    sost: "    if (senzaAccount.has(p)) continue\n    if ((input.destinazioniPerPiattaforma[p] ?? []).length === 0) continue",
    rompe: "lista vuota letta come 'nessuno': l'avviso direbbe che un canale non riceve nulla mentre riceve tutto",
  },
  {
    file: VIDEO,
    cerca: 'if (isYoutubeUrl(videoUrl)) return "youtube"',
    sost: 'if (isVideoFileUrl(videoUrl)) return "video"\n    if (isYoutubeUrl(videoUrl)) return "youtube"',
    rompe: "niente: i due riconoscimenti sono mutuamente esclusivi, quindi l'ordine non cambia il risultato",
    equivalente: true,
  },

  // ---- Video a rotazione nelle campagne ----
  {
    file: CAMPAGNA,
    cerca: "    return a.video_id.localeCompare(b.video_id)",
    sost: "    return 0",
    rompe:
      "ordine non univoco: due video con lo stesso sort_order potrebbero scambiarsi di posto, e lo stesso indice darebbe video diversi",
  },
  {
    file: CAMPAGNA,
    cerca: "  const i = ((Math.trunc(input.indiceGlobale) % n) + n) % n",
    sost: "  const i = Math.trunc(input.indiceGlobale) % n",
    rompe: "un contatore negativo darebbe un indice negativo, cioe' undefined: un post senza video",
  },
  {
    file: CAMPAGNA,
    cerca: "  if (ordinati.length === 0) return null",
    sost: "",
    rompe: "raccolta vuota: tornerebbe undefined invece di null, e il post verrebbe dichiarato video senza averne uno",
  },
  {
    file: CAMPAGNA,
    cerca: "    if (isYoutubeUrl(url)) {",
    sost: "    if (true) {",
    rompe: "un id malformato nella libreria produrrebbe un post 'video' che il vincolo del database rifiuta",
  },
  {
    file: CAMPAGNA,
    cerca: "        image_url: youtubeThumbnail(url) ?? imageUrl,",
    sost: "        image_url: null,",
    rompe: "il post video perderebbe la copertina, che e' cio' che si vede nel riquadro prima di partire",
  },
  {
    // L'errore vero che avevo commesso nella #227: leggere le piattaforme
    // spuntate invece di cio' che riceve davvero il video.
    file: CAMPAGNA,
    cerca: '  return (piattaforme ?? []).filter((p) => p === "instagram")',
    sost: "  return []",
    rompe:
      "l'avviso su Instagram sparirebbe: la campagna pubblicherebbe su Instagram niente, in silenzio",
  },
  {
    file: RUNNER,
    cerca: "        indiceGlobale: (rule.posts_generated_count || 0) + i,",
    sost: "        indiceGlobale: i,",
    rompe:
      "la rotazione ripartirebbe da zero a ogni esecuzione: una campagna da 1 post userebbe sempre il primo video",
  },
  {
    file: CAMPAGNA,
    cerca: "  return [...video].sort((a, b) => {",
    sost: "  return video.slice().sort((a, b) => {",
    rompe: "niente: entrambe le forme copiano l'array prima di ordinarlo, quindi il comportamento e' identico",
    equivalente: true,
  },
]

const suiteVerde = () => {
  try {
    execSync("pnpm exec vitest run", { stdio: "pipe", encoding: "utf8" })
    return true
  } catch {
    return false
  }
}

console.log(`sabotaggi dichiarati: ${sabotaggi.length}\n`)

let applicati = 0
let colti = 0
let equivalentiOk = 0
const problemi = []

for (const [i, s] of sabotaggi.entries()) {
  ripristina()
  const testo = fs.readFileSync(s.file, "utf8")
  const n = testo.split(s.cerca).length - 1

  if (n === 0) {
    problemi.push(`#${i + 1} NON APPLICATO: la riga cercata non esiste in ${s.file}`)
    console.log(`${i + 1}. NON APPLICATO (riga inesistente) -> ${s.rompe}`)
    continue
  }

  fs.writeFileSync(s.file, testo.replace(s.cerca, s.sost))
  applicati++
  const verde = suiteVerde()

  if (s.equivalente) {
    // Un mutante equivalente DEVE lasciare la suite verde. Se diventa rossa,
    // significa che non era equivalente e la mia analisi era sbagliata.
    if (verde) {
      equivalentiOk++
      console.log(`${i + 1}. EQUIVALENTE (verde, come atteso) -> ${s.rompe}`)
    } else {
      problemi.push(`#${i + 1} dichiarato equivalente ma la suite diventa rossa: l'analisi era sbagliata`)
      console.log(`${i + 1}. INATTESO: dichiarato equivalente ma la suite e' rossa`)
    }
    continue
  }

  if (verde) {
    problemi.push(`#${i + 1} SFUGGITO: ${s.rompe}`)
    console.log(`${i + 1}. SFUGGITO -> ${s.rompe}`)
  } else {
    colti++
    console.log(`${i + 1}. COLTO    -> ${s.rompe}`)
  }
}

ripristina()

// Il ripristino va PROVATO, non supposto.
for (const [f, c] of Object.entries(originali)) {
  if (fs.readFileSync(f, "utf8") !== c) {
    console.error(`\nERRORE: ripristino fallito su ${f}`)
    process.exit(1)
  }
}

const veri = sabotaggi.filter((s) => !s.equivalente).length
const equivalenti = sabotaggi.length - veri
console.log(
  `\ndichiarati ${sabotaggi.length} (${veri} veri + ${equivalenti} equivalenti) | applicati ${applicati} | colti ${colti}/${veri} | equivalenti confermati ${equivalentiOk}/${equivalenti}`,
)
console.log("file ripristinati identici all'originale: OK")

if (!suiteVerde()) {
  console.error("ERRORE: dopo il ripristino la suite non e' verde")
  process.exit(1)
}
console.log("suite verde dopo il ripristino: OK")

if (problemi.length > 0) {
  console.error(`\n${problemi.length} problemi:`)
  for (const p of problemi) console.error(`  - ${p}`)
  process.exit(1)
}
console.log("\nnessun sabotaggio sfuggito.")
