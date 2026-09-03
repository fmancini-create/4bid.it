import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getBusinessPlanShareSession } from "@/lib/business-plan-share-session"

export const runtime = "nodejs"
export const maxDuration = 30

const sessionWindows = new Map<string, number[]>()
const REQUESTS_PER_MINUTE = 3

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

function configured() {
  const explicitlyEnabled = process.env.TAVUS_LIVE_ENABLED === "true"
  const safePreview = process.env.VERCEL_ENV === "preview"
  return Boolean(
    (explicitlyEnabled || safePreview) &&
      process.env.TAVUS_API_KEY &&
      (process.env.TAVUS_PAL_ID || process.env.TAVUS_PERSONA_ID) &&
      (process.env.TAVUS_FACE_ID || process.env.TAVUS_REPLICA_ID),
  )
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

function buildGreeting(name: string) {
  const firstName = name.trim().split(/\s+/)[0]
  return firstName
    ? `Buongiorno ${firstName}, sono la consulente digitale di Four Bid. Ho già letto il dossier. Posso presentarti in breve il core hospitality, gli altri asset digitali e i numeri del piano, oppure rispondere direttamente alle tue domande.`
    : "Buongiorno, sono la consulente digitale di Four Bid. Ho già letto il dossier. Posso presentarti in breve il core hospitality, gli altri asset digitali e i numeri del piano, oppure rispondere direttamente alle tue domande."
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
- Sei una consulente DIGITALE/AI di 4BID in una conversazione video e voce realtime.
- Parla sempre in italiano naturale, elegante e molto chiaro, con ritmo calmo e frasi brevi.
- Quando pronunci 4BID, leggilo sempre "Four Bid".
- Il pubblico è banca, investitore, advisor o partner: privilegia chiarezza economico-finanziaria e sostanza, non slogan.
- Se ti viene chiesto "quante piattaforme ha 4BID?", non rispondere mai semplicemente "quattro": spiega che quattro sono quelle hospitality e che il portafoglio comprende anche altri asset digitali proprietari.
- Presenta MyPetSenseAI, AutoExel, DayNext e RisparmioCompulsivo come portafoglio aggiuntivo/diversificazione, senza confonderli con le quattro piattaforme hospitality.
- Le previsioni sono scenari gestionali, non risultati garantiti. Non trasformare multipli o sensitivity in perizie o valutazioni certe.
- Non inventare ricavi, clienti, contratti, trattative, integrazioni, prezzi, risultati o manifestazioni di interesse.
- Se un dato non è nel dossier, dillo chiaramente.
- Fai una domanda alla volta e lascia spazio all'interlocutore. Se viene interrotta, segui subito il nuovo punto.
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
    const faceId = process.env.TAVUS_FACE_ID || process.env.TAVUS_REPLICA_ID!
    const usesPalNaming = Boolean(process.env.TAVUS_PAL_ID || process.env.TAVUS_FACE_ID)
    const openingMessage = buildGreeting(session.visitorName)

    const tavusBody: Record<string, unknown> = {
      conversation_name: `4BID Dossier - ${session.visitorCompany || session.visitorName || "Visitatore"}`.slice(0, 120),
      conversational_context: buildDossierContext(plan, session),
      custom_greeting: openingMessage,
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

    await supabase.from("business_plan_share_events").insert({
      share_id: share.id,
      business_plan_id: plan.id,
      event_type: "avatar_started",
      recipient_email: session.visitorEmail,
      metadata: {
        visitor_name: session.visitorName,
        visitor_email: session.visitorEmail,
        visitor_company: session.visitorCompany || null,
        mode: "realtime_video",
        scope: "corporate_dossier",
        user_agent: request.headers.get("user-agent"),
      },
    })

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
