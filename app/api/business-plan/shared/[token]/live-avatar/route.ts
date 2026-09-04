import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getBusinessPlanShareSession } from "@/lib/business-plan-share-session"

export const runtime = "nodejs"
export const maxDuration = 30

const sessionWindows = new Map<string, number[]>()
const REQUESTS_PER_MINUTE = 3
let palNoiseGuardPromise: Promise<void> | null = null

interface DossierProduct {
  name?: string
  area?: string
  tagline?: string
  description?: string
  pricing?: string
  category?: string
}

interface DossierScenario {
  name?: string
  revenue?: number[]
  ebitda?: number[]
  recurring?: number[]
}

interface DossierData {
  presentationIntro?: string
  products?: DossierProduct[]
  otherProducts?: DossierProduct[]
  scenarios?: DossierScenario[]
  snapshot?: Array<{ label?: string; value?: string }>
  funding?: {
    amount?: number
    graceMonths?: number
    amortizationMonths?: number
    illustrativeRate?: number
    annualDebtService?: number
  }
  exit?: string
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function bankFaceId() {
  return process.env.TAVUS_FACE_BANK_ID || ""
}

function configured() {
  const explicitlyEnabled = process.env.TAVUS_LIVE_ENABLED === "true"
  const safePreview = process.env.VERCEL_ENV === "preview"
  return Boolean(
    (explicitlyEnabled || safePreview) &&
      process.env.TAVUS_API_KEY &&
      (process.env.TAVUS_PAL_ID || process.env.TAVUS_PERSONA_ID) &&
      bankFaceId(),
  )
}

async function configureBankPalNoiseGuard() {
  const palId = process.env.TAVUS_PAL_ID
  const apiKey = process.env.TAVUS_API_KEY
  if (!palId || !apiKey) return

  // Tavus recommends voice_isolation="near" when the PAL reacts to background
  // sounds. We also make turn-taking patient and disable autonomous idle chatter.
  const palResponse = await fetch(`https://tavusapi.com/v2/pals/${encodeURIComponent(palId)}?source=draft`, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  })

  if (!palResponse.ok) {
    console.warn("[dossier-live-avatar] unable to inspect Tavus PAL noise settings", palResponse.status)
    return
  }

  const pal = (await palResponse.json().catch(() => ({}))) as UnknownRecord

  // Never wipe or auto-publish edits someone is still making in PAL Maker.
  if (pal.is_draft_view === true && pal.has_unpublished_changes === true) {
    console.warn("[dossier-live-avatar] Tavus PAL has unpublished draft changes; automatic noise guard skipped")
    return
  }

  const layers = isRecord(pal.layers) ? pal.layers : {}
  const existingFlow = isRecord(layers.conversational_flow) ? layers.conversational_flow : {}
  const nextFlow: UnknownRecord = {
    ...existingFlow,
    turn_detection_model: "sparrow-1",
    turn_taking_patience: "high",
    voice_isolation: "near",
    idle_engagement: "off",
  }

  if (
    existingFlow.turn_detection_model === nextFlow.turn_detection_model &&
    existingFlow.turn_taking_patience === nextFlow.turn_taking_patience &&
    existingFlow.voice_isolation === nextFlow.voice_isolation &&
    existingFlow.idle_engagement === nextFlow.idle_engagement
  ) {
    return
  }

  const operation = Object.prototype.hasOwnProperty.call(layers, "conversational_flow")
    ? { op: "replace", path: "/layers/conversational_flow", value: nextFlow }
    : Object.keys(layers).length
      ? { op: "add", path: "/layers/conversational_flow", value: nextFlow }
      : { op: "add", path: "/layers", value: { conversational_flow: nextFlow } }

  const patchResponse = await fetch(`https://tavusapi.com/v2/pals/${encodeURIComponent(palId)}?target=live`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify([operation]),
    cache: "no-store",
  })

  if (!patchResponse.ok && patchResponse.status !== 304) {
    const payload = await patchResponse.json().catch(() => ({}))
    console.warn("[dossier-live-avatar] Tavus PAL noise guard patch failed", patchResponse.status, payload)
  }
}

async function ensureBankPalNoiseGuard() {
  if (!process.env.TAVUS_PAL_ID) return
  if (!palNoiseGuardPromise) {
    palNoiseGuardPromise = configureBankPalNoiseGuard().catch((error) => {
      palNoiseGuardPromise = null
      console.warn("[dossier-live-avatar] Tavus PAL noise guard failed", error)
    })
  }
  await palNoiseGuardPromise
}

function rateLimited(key: string) {
  const now = Date.now()
  const recent = (sessionWindows.get(key) || []).filter((timestamp) => now - timestamp < 60_000)
  recent.push(now)
  sessionWindows.set(key, recent)
  return recent.length > REQUESTS_PER_MINUTE
}

function parseDossier(raw: string | null | undefined): DossierData {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function formatProducts(items: DossierProduct[]) {
  return items
    .filter((item) => item?.name)
    .map((item) => {
      const parts = [item.name, item.area, item.tagline, item.description, item.pricing].filter(Boolean)
      return `- ${parts.join(" | ")}`
    })
    .join("\n")
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function buildGreeting(name: string) {
  const normalized = normalizeName(name)
  const firstName = name.trim().split(/\s+/)[0] || ""

  if (normalized.includes("giovanni") && (normalized.includes("salvadori") || normalized === "giovanni")) {
    return "Buongiorno Giovanni, sono Anna, la consulente digitale di Four Bid. Ho già letto il dossier preparato per UniCredit e posso accompagnarti tra struttura del finanziamento, scenari e capacità di rimborso. Prima di iniziare, Filippo mi ha lasciato una nota rigorosamente fuori bilancio: se l'operazione andrà in porto, sostiene che ti presenterà la mia controfigura vera, in carne e ossa, e giura che sia perfino molto più sexy di me. Naturalmente non è una garanzia del finanziamento. Ora torniamo alle cose serie."
  }

  if (normalized.includes("michele") && (normalized.includes("gheri") || normalized === "michele")) {
    return "Buongiorno Michele, sono Anna, la consulente digitale di Four Bid. Ho già letto il dossier preparato per ChiantiBanca e posso accompagnarti tra struttura del finanziamento, scenari e capacità di rimborso. Prima dei numeri, Filippo mi ha lasciato una nota decisamente fuori bilancio: se l'operazione andrà in porto, dice che ti farà conoscere la mia controfigura vera, in carne e ossa, che a suo dire dal vivo è perfino più affascinante di me. Io non la metterei tra le garanzie, quindi torniamo al piano."
  }

  return firstName
    ? `Buongiorno ${firstName}, sono Anna, la consulente digitale di Four Bid. Ho già letto il dossier. Posso presentarti in breve il core hospitality, gli altri asset digitali e i numeri del piano, oppure rispondere direttamente alle tue domande.`
    : "Buongiorno, sono Anna, la consulente digitale di Four Bid. Ho già letto il dossier. Posso presentarti in breve il core hospitality, gli altri asset digitali e i numeri del piano, oppure rispondere direttamente alle tue domande."
}

function buildDossierContext(
  plan: {
    name: string | null
    executive_summary: string | null
    market_analysis: string | null
    business_model: string | null
    marketing_strategy: string | null
    management_team: string | null
    risk_analysis: string | null
    description: string | null
  },
  visitor: { visitorName: string; visitorEmail: string; visitorCompany?: string },
) {
  const dossier = parseDossier(plan.description)
  const allProducts = [...(dossier.products || []), ...(dossier.otherProducts || [])]
  const hospitality = allProducts.filter((item) => item.category === "hospitality_core")
  const diversified = allProducts.filter((item) => item.category === "diversification")
  const fallbackHospitality = hospitality.length
    ? hospitality
    : allProducts.filter((item) =>
        ["Santaddeo", "HotelAccelerator", "HotelProfitAI", "ManuBot"].some((name) => item.name?.includes(name)),
      )
  const fallbackDiversified = diversified.length
    ? diversified
    : allProducts.filter(
        (item) => !fallbackHospitality.some((coreItem) => coreItem.name && coreItem.name === item.name),
      )

  const scenarioText = (dossier.scenarios || [])
    .map((scenario) => {
      const lastRevenue = scenario.revenue?.at(-1)
      const lastEbitda = scenario.ebitda?.at(-1)
      return `- ${scenario.name || "Scenario"}: ricavi 2031 ${lastRevenue != null ? `€${lastRevenue} mila` : "n/d"}; EBITDA 2031 ${lastEbitda != null ? `€${lastEbitda} mila` : "n/d"}.`
    })
    .join("\n")

  const snapshotText = (dossier.snapshot || [])
    .filter((item) => item.label && item.value)
    .map((item) => `- ${item.label}: ${item.value}`)
    .join("\n")

  return `
=== DOSSIER 4BID — CONTESTO AUTOREVOLE ===
Visitatrice/visitatore: ${visitor.visitorName}${visitor.visitorCompany ? ` — ${visitor.visitorCompany}` : ""}.
Titolo dossier: ${plan.name || "4BID Business Plan 2027-2031"}.

MESSAGGIO INDUSTRIALE DA NON SBAGLIARE:
4BID NON ha soltanto quattro piattaforme. Le quattro piattaforme sono il CORE verticale turismo/hospitality: Santaddeo, HotelAccelerator, HotelProfitAI e ManuBot. A queste si affiancano altri asset digitali proprietari in settori differenti e attività SaaS conto terzi. Quando presenti la società, distingui sempre chiaramente il core hospitality dal portafoglio digitale più ampio.

CORE HOSPITALITY — 4 PIATTAFORME:
${formatProducts(fallbackHospitality) || "- Santaddeo\n- HotelAccelerator\n- HotelProfitAI\n- ManuBot"}

ALTRI ASSET DIGITALI / DIVERSIFICAZIONE:
${formatProducts(fallbackDiversified) || "- MyPetSenseAI\n- AutoExel\n- DayNext\n- RisparmioCompulsivo"}

EXECUTIVE SUMMARY:
${plan.executive_summary || "Non disponibile."}

POSIZIONAMENTO E MERCATO:
${plan.market_analysis || "Non disponibile."}

MODELLO DI BUSINESS:
${plan.business_model || "Non disponibile."}

GO-TO-MARKET / IMPIEGO RISORSE:
${plan.marketing_strategy || "Non disponibile."}

DATI CHIAVE:
${snapshotText || "Vedi il dossier condiviso."}

SCENARI 2027-2031:
${scenarioText || "Vedi il dossier condiviso."}

FINANZIAMENTO:
${dossier.funding ? `Richiesta €${dossier.funding.amount || 120000}; preammortamento ${dossier.funding.graceMonths || 12} mesi; ammortamento ${dossier.funding.amortizationMonths || 108} mesi; tasso illustrativo ${dossier.funding.illustrativeRate || 5}%.` : "Richiesta indicativa €120.000."}

RISCHI:
${plan.risk_analysis || "Non disponibile."}

EXIT / OPZIONALITÀ STRATEGICA:
${dossier.exit || "L'exit è un'opzione strategica e non una condizione necessaria per il rimborso del finanziamento."}

=== REGOLE DELLA CONVERSAZIONE LIVE ===
- Sei Anna, una consulente DIGITALE/AI di 4BID in una conversazione video e voce realtime.
- Parla sempre in italiano naturale, elegante e molto chiaro, con frasi brevi.
- Mantieni un ritmo appena più lento del parlato normale, circa il 5-8% più lento: deve risultare più comprensibile ma mai artificiosamente rallentato. Inserisci micro-pause tra i concetti e scandisci bene numeri e nomi propri.
- Il nome dell'azienda si scrive 4BID ma si pronuncia sempre esattamente "Four Bid", in due parole distinte. Non pronunciarlo mai "quattro bid", "fourbid" tutto attaccato o semplicemente "Bid".
- Il pubblico è banca, investitore, advisor o partner: privilegia chiarezza economico-finanziaria e sostanza, non slogan.
- Se ti viene chiesto "quante piattaforme ha 4BID?", non rispondere mai semplicemente "quattro": spiega che quattro sono quelle hospitality e che il portafoglio comprende anche altri asset digitali proprietari.
- Presenta MyPetSenseAI, AutoExel, DayNext e RisparmioCompulsivo come portafoglio aggiuntivo/diversificazione, senza confonderli con le quattro piattaforme hospitality.
- Le previsioni sono scenari gestionali, non risultati garantiti. Non trasformare multipli o sensitivity in perizie o valutazioni certe.
- Non inventare ricavi, clienti, contratti, trattative, integrazioni, prezzi, risultati o manifestazioni di interesse.
- Se un dato non è nel dossier, dillo chiaramente.
- Fai una domanda alla volta e lascia spazio all'interlocutore. Se viene interrotta, segui subito il nuovo punto.
- Non riempire i silenzi: dopo una tua risposta attendi sempre un nuovo intervento dell'interlocutore. Non riaprire spontaneamente argomenti e non fare follow-up solo perché l'utente tace.
- I rumori di fondo, colpi, fruscii, respiri, sillabe isolate o frammenti senza una frase intelligibile NON sono domande. In questi casi resta in silenzio: non dire "scusa", "non ho capito" o formule simili. Rispondi soltanto quando l'interlocutore ha pronunciato parole comprensibili con un intento conversazionale chiaro.
- Se l'interlocutore dice ciao, arrivederci, a presto, buona giornata, buona serata, "possiamo chiudere", "chiudiamo qui" o un equivalente inequivocabile, rispondi con UN solo saluto breve e conclusivo. Non fare domande, non introdurre nuovi temi e non continuare a parlare dopo il saluto.
- Le eventuali battute personali contenute nel saluto iniziale vanno pronunciate una sola volta e non vanno ripetute spontaneamente durante la conversazione.
- Puoi offrire tre percorsi: sintesi in 60-90 secondi, presentazione portafoglio, oppure Q&A libero sul dossier.
- Non chiedere password, credenziali o dati di accesso.
- Non effettuare inferenze su emozioni, salute o altre caratteristiche sensibili osservando il video.
=== FINE CONTESTO ===
`.trim()
}

async function loadCorporatePlan(token: string, shareId: string) {
  const supabase = createAdminClient()
  const { data: share, error: shareError } = await supabase
    .from("business_plan_shares")
    .select("id, business_plan_id, expires_at")
    .eq("token", token)
    .eq("id", shareId)
    .single()

  if (shareError || !share) return { supabase, error: "Condivisione non valida" as const, status: 404 }
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return { supabase, error: "Link scaduto" as const, status: 410 }
  }

  const { data: plan, error: planError } = await supabase
    .from("business_plans")
    .select("id, name, project_type, description, executive_summary, market_analysis, business_model, marketing_strategy, management_team, risk_analysis")
    .eq("id", share.business_plan_id)
    .single()

  if (planError || !plan || plan.project_type !== "corporate_saas") {
    return { supabase, error: "Dossier corporate non trovato" as const, status: 404 }
  }

  return { supabase, share, plan }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const session = getBusinessPlanShareSession(request, token)
  if (!session) return NextResponse.json({ enabled: false, authenticated: false }, { status: 401 })

  const loaded = await loadCorporatePlan(token, session.shareId)
  if ("error" in loaded) return NextResponse.json({ enabled: false, error: loaded.error }, { status: loaded.status })

  return NextResponse.json(
    { enabled: configured(), authenticated: true },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    if (!configured()) {
      return NextResponse.json({ error: "Consulente video live non ancora attivata", enabled: false }, { status: 503 })
    }

    const { token } = await params
    const session = getBusinessPlanShareSession(request, token)
    if (!session) return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 })

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
    if (rateLimited(`${token}:${ip}`)) {
      return NextResponse.json({ error: "Troppe sessioni avviate. Riprova tra un minuto." }, { status: 429 })
    }

    const loaded = await loadCorporatePlan(token, session.shareId)
    if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: loaded.status })

    const { supabase, share, plan } = loaded
    const palId = process.env.TAVUS_PAL_ID || process.env.TAVUS_PERSONA_ID!
    const faceId = bankFaceId()
    const usesPalNaming = Boolean(process.env.TAVUS_PAL_ID || process.env.TAVUS_FACE_BANK_ID)
    const openingMessage = buildGreeting(session.visitorName)
    const callbackUrl = new URL("/api/business-plan/tavus-callback", request.url).toString()

    await ensureBankPalNoiseGuard()

    const tavusBody: Record<string, unknown> = {
      conversation_name: `4BID Dossier - ${session.visitorCompany || session.visitorName || "Visitatore"}`.slice(0, 120),
      conversational_context: buildDossierContext(plan, session),
      custom_greeting: openingMessage,
      callback_url: callbackUrl,
      audio_only: false,
      require_auth: true,
      max_participants: 2,
      properties: {
        language: "italian",
        enable_closed_captions: false,
        max_call_duration: 900,
        participant_left_timeout: 0,
        participant_absent_timeout: 120,
      },
      ...(usesPalNaming ? { pal_id: palId, face_id: faceId } : { persona_id: palId, replica_id: faceId }),
    }

    const tavusResponse = await fetch("https://tavusapi.com/v2/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.TAVUS_API_KEY!,
      },
      body: JSON.stringify(tavusBody),
      cache: "no-store",
    })

    const tavus = (await tavusResponse.json().catch(() => ({}))) as {
      conversation_id?: string
      conversation_url?: string
      meeting_token?: string
      message?: string
      error?: string
    }

    if (!tavusResponse.ok || !tavus.conversation_id || !tavus.conversation_url) {
      throw new Error(tavus.error || tavus.message || `Consulente live non disponibile (${tavusResponse.status})`)
    }

    const { error: eventError } = await supabase.from("business_plan_share_events").insert({
      share_id: share.id,
      business_plan_id: plan.id,
      event_type: "avatar_started",
      recipient_email: session.visitorEmail,
      metadata: {
        conversation_id: tavus.conversation_id,
        visitor_name: session.visitorName,
        visitor_email: session.visitorEmail,
        visitor_company: session.visitorCompany || null,
        mode: "realtime_video",
        scope: "corporate_dossier",
        face_scope: "bank",
        noise_policy: "voice_isolation_near_patient",
        user_agent: request.headers.get("user-agent"),
      },
    })

    if (eventError) console.error("[dossier-live-avatar] avatar_started tracking failed", eventError)

    return NextResponse.json(
      {
        enabled: true,
        conversationId: tavus.conversation_id,
        conversationUrl: tavus.conversation_url,
        meetingToken: tavus.meeting_token || null,
        openingMessage,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    console.error("[dossier-live-avatar]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore nell'avvio della consulente live" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const session = getBusinessPlanShareSession(request, token)
    if (!session) return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const conversationId = typeof body.conversationId === "string" ? body.conversationId.trim() : ""
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 80) : "client_end"
    if (!conversationId) return NextResponse.json({ error: "Conversation ID mancante" }, { status: 400 })

    const loaded = await loadCorporatePlan(token, session.shareId)
    if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: loaded.status })

    const { supabase, share, plan } = loaded
    const { data: startedEvent } = await supabase
      .from("business_plan_share_events")
      .select("id")
      .eq("share_id", share.id)
      .eq("event_type", "avatar_started")
      .eq("metadata->>conversation_id", conversationId)
      .limit(1)
      .maybeSingle()

    if (!startedEvent) return NextResponse.json({ error: "Conversazione non associata a questo dossier" }, { status: 403 })

    const tavusResponse = await fetch(
      `https://tavusapi.com/v2/conversations/${encodeURIComponent(conversationId)}/end`,
      {
        method: "POST",
        headers: { "x-api-key": process.env.TAVUS_API_KEY! },
        cache: "no-store",
      },
    )

    if (!tavusResponse.ok && tavusResponse.status !== 400) {
      const data = await tavusResponse.json().catch(() => ({}))
      return NextResponse.json(
        { error: String(data?.error || data?.message || "Impossibile terminare la conversazione") },
        { status: tavusResponse.status },
      )
    }

    await supabase.from("business_plan_share_events").insert({
      share_id: share.id,
      business_plan_id: plan.id,
      event_type: "avatar_ended",
      recipient_email: session.visitorEmail,
      metadata: {
        conversation_id: conversationId,
        reason,
        visitor_name: session.visitorName,
        visitor_email: session.visitorEmail,
        visitor_company: session.visitorCompany || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[dossier-live-avatar:end]", error)
    return NextResponse.json({ error: "Errore durante la chiusura della conversazione" }, { status: 500 })
  }
}
