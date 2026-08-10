// One-off: riallinea le descrizioni (lato cliente) dei preventivi ancora in
// BOZZA al copy curato 4BID. Tocca solo status="draft" e solo le voci il cui
// nome corrisponde a una chiave curata; le altre restano invariate.
// Uso: node --env-file=/vercel/share/.env.project scripts/realign-quote-descriptions.mjs [--apply]

const APPLY = process.argv.includes("--apply")
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const SALES_COPY = {
  hotelaccelerator: {
    "HotelAccelerator Suite": "Il cuore digitale del tuo hotel: attiva la piattaforma e porta sito, contatti, conversazioni e dati in un unico posto, pronto a crescere con te.",
    "CMS": "Un sito che lavora per te: pagine modulari e SEO-ready che trasformano i visitatori in prenotazioni dirette, senza commissioni.",
    "Inbox": "Tutte le conversazioni — email, chat e messaggi — in un'unica casella: nessuna richiesta persa, ogni ospite seguito in tempo.",
    "CRM": "Conosci davvero i tuoi ospiti: contatti, segmenti e relazioni organizzati per far tornare chi ha già scelto te.",
    "AI": "Rispondi in un attimo anche quando il team è sotto pressione: l'AI suggerisce e automatizza le risposte, tu mantieni il controllo.",
    "Tracking & Eventi": "Sai esattamente cosa funziona: eventi e tracciamento indipendenti dal sito per decidere con i dati, non a intuito.",
    "Sito pubblico": "La vetrina pubblica della tua struttura, veloce e curata, che regala subito una prima impressione da ricordare.",
    "Revenue (Santaddeo)": "Il revenue management dentro la tua suite: leggi la domanda e ottimizza i prezzi senza saltare da uno strumento all'altro.",
    "Operations (Manubot)": "Task, manutenzioni e housekeeping sotto controllo con i bot: meno cose dimenticate, un team più sereno.",
    "HotelProfitAI": "Finalmente sai quanto guadagni davvero: analisi di profittabilità per proteggere il margine su ogni camera.",
    "White Label": "Il tuo brand protagonista assoluto: togli la firma 4BID e presenta ai clienti una piattaforma tutta tua.",
  },
  santaddeo: {
    "Santaddeo RMS": "Basta prezzi decisi a intuito: Santaddeo legge domanda e mercato e ti guida a proteggere ADR, occupazione e ricavi ogni giorno dell'anno.",
    "Premium Expert": "Non sei mai solo davanti alle scelte difficili: un consulente Revenue dedicato prende in carico le tue conversazioni e ti guida con strategie su misura.",
    "Booking Pace": "Anticipa l'andamento delle prenotazioni: confronta l'on-the-books con lo stesso momento dell'anno scorso e agisci prima che sia tardi.",
    "Rate Shopper": "Non perdere mai di vista i competitor: confronta i tuoi prezzi con il tuo set competitivo giorno per giorno e posizionati sempre al punto giusto.",
    "Traffico Web": "Trasforma l'interesse in segnale di prezzo: misura la domanda diretta sul tuo sito, in forma anonima, e usala per vendere meglio.",
    "Air Market Intelligence": "Scopri da dove arriveranno i tuoi ospiti: analizza i voli in arrivo e punta marketing e prezzi sui mercati che stanno crescendo.",
    "Bilancio Commerciale": "Vedi ogni giorno se stai raggiungendo gli obiettivi: prenotazioni, cancellazioni e saldo netto sotto controllo, senza sorprese a fine mese.",
  },
  hotelprofitai: {
    "Entry": "Prova HotelProfitAI per 30 giorni, senza impegno e senza rischi: scopri quanto puoi guadagnare vedendo davvero i tuoi numeri.",
    "Base": "Il primo passo verso il controllo di gestione: budget, insight AI ed export pensati per chi vuole iniziare a decidere con i numeri.",
    "Pro": "Analisi avanzate e integrazioni complete per chi vuole spingere il margine: forecast, benchmark e AI al servizio dei tuoi risultati.",
    "Enterprise": "Il controllo totale per catene e gruppi: multi-struttura, SLA e report su misura per governare la redditività ovunque.",
    "Costo Camera Dettagliato": "Sai quanto ti costa davvero ogni camera occupata: lavanderia, amenities, pulizia e utenze al centesimo, per difendere il margine netto.",
    "Gestione Fornitori": "Metti ordine tra i fornitori: rating, storico spesa e alert scadenze per non pagare mai più del necessario.",
    "Integrazione PMS Diretta": "Basta inserimenti manuali: occupazione, tariffe e revenue arrivano in automatico dal tuo PMS, sempre aggiornati.",
    "Integrazione Santaddeo": "Pricing e profittabilità che si parlano: dati e alert di Santaddeo dentro HotelProfitAI per decisioni ancora più precise.",
    "Metriche e analisi aziende": "Lavora solo con partner affidabili: verifica clienti e fornitori negli archivi ufficiali e confronta i tuoi numeri con il tuo settore.",
    "Report PDF Automatici": "Report pronti ogni mese senza muovere un dito: KPI, costi e margini brandizzati, dritti a te e al commercialista.",
    "AI Chat Consulenza": "L'AI analizza, il tuo commercialista conferma: risposte affidabili sui tuoi conti, con la sicurezza di un professionista.",
    "AI Chat Pro": "Fai domande sui tuoi conti come parlassi a un esperto: fatture, costi, budget e KPI, con risposte in tempo reale sui dati veri.",
    "AI Insights Avanzati": "Guarda avanti, non solo indietro: forecast, previsione dell'occupazione e alert automatici che ti avvisano prima dei problemi.",
    "Benchmark KPI": "Scopri come vai davvero rispetto al mercato: confronta i tuoi KPI con il settore e trova subito dove puoi migliorare.",
    "Budget Avanzato": "Pianifica con sicurezza: budget per centro di costo, scenari what-if e alert sugli sforamenti prima che pesino sul risultato.",
  },
  manubot: {
    "Starter": "Metti ordine da subito: interventi, utenti e manutenzioni essenziali organizzati, per chi gestisce una singola struttura.",
    "Professional": "Il team operativo che gira da solo: automazioni, bot Telegram e report avanzati per chiudere prima ogni attività.",
    "Business": "Governa più strutture senza stress: WhatsApp, API, supporto prioritario e onboarding su misura per il tuo facility management.",
    "Corporate": "La soluzione su misura per catene e grandi gruppi: dimensionata su utenti, volumi, AI e SLA, per tenere davvero tutto sotto controllo.",
    "SuperGovernante AI": "La qualità delle camere non si discute più: l'AI confronta le foto di fine pulizia con il tuo standard e segnala subito cosa manca.",
    "Housekeeping": "Il piano pulizie che si aggiorna da solo: biancheria e addebiti frigobar registrati dal bot in 7 lingue, con notifica immediata.",
  },
}

function displayName(name) {
  return String(name || "").replace(/\s*[—–-]\s*annuale\s*$/i, "").trim()
}
function overrideFor(project, name) {
  const map = SALES_COPY[project]
  if (!map) return undefined
  const key = displayName(name)
  return map[key] || (key.toLowerCase().startsWith("housekeeping") ? map["Housekeeping"] : undefined)
}

async function main() {
  const res = await fetch(url + "/rest/v1/sales_channel_quotes?select=id,status,line_items&status=eq.draft", {
    headers: { apikey: key, Authorization: "Bearer " + key },
  })
  const quotes = await res.json()
  console.log(`Bozze trovate: ${quotes.length} | modalità: ${APPLY ? "APPLY" : "DRY-RUN"}\n`)

  let quotesChanged = 0
  let linesChanged = 0
  for (const q of quotes) {
    const items = Array.isArray(q.line_items) ? q.line_items : []
    let changed = false
    const next = items.map((it) => {
      const ov = overrideFor(it.project, it.name)
      if (ov && ov !== it.description) {
        console.log(`  [${q.id.slice(0, 8)}] "${it.name}" (${it.project})`)
        console.log(`     - da: ${String(it.description || "").slice(0, 70)}`)
        console.log(`     + a:  ${ov.slice(0, 70)}`)
        changed = true
        linesChanged++
        return { ...it, description: ov }
      }
      return it
    })
    if (!changed) continue
    quotesChanged++
    if (APPLY) {
      const up = await fetch(url + `/rest/v1/sales_channel_quotes?id=eq.${q.id}`, {
        method: "PATCH",
        headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ line_items: next }),
      })
      if (!up.ok) console.log(`     !! update fallito: ${up.status} ${await up.text()}`)
    }
  }
  console.log(`\nRiepilogo: ${linesChanged} voci in ${quotesChanged} bozze ${APPLY ? "aggiornate" : "da aggiornare"}.`)
}
main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1) })
