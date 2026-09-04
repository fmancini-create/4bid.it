import { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { buildQuoteChatContext, type QuoteChatContext } from "@/lib/quotes/chat-context"

export const runtime = "nodejs"
export const maxDuration = 30

const sessionWindows = new Map<string, number[]>()
const REQUESTS_PER_MINUTE = 3

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

function buildGreeting() {
  return "Buongiorno. Sono la consulente digitale di Four Bid. Prima di iniziare, mi dice come posso chiamarla?"
}

function recipientIdentityInstruction(context: QuoteChatContext) {
  const recipientName = context.clientName?.trim() || ""
  const recipientFirstName = recipientName.split(/\s+/)[0] || ""

  if (!recipientFirstName) {
    return "- CONTROLLO IDENTITA' E RUOLO: il preventivo non ha un destinatario persona chiaramente indicato. Usa il nome dichiarato dall'interlocutore e, prima di entrare nel merito, chiedi quale ruolo ricopre rispetto alla struttura o azienda destinataria se questo non e' gia' evidente."
  }

  const roleTarget = context.clientCompany?.trim()
    ? context.clientCompany.trim()
    : `il preventivo intestato a ${recipientName}`

  return `- CONTROLLO IDENTITA' E RUOLO: il preventivo e' intestato a ${recipientName}. La tua PRIMA priorita' dopo la presentazione e' capire chi hai davanti. Dopo che l'interlocutore ti ha detto come si chiama, confronta il PRIMO NOME dichiarato con ${recipientFirstName}. Se il primo nome dichiarato coincide con ${recipientFirstName}, non fare altre domande sull'identita' e prosegui normalmente. Se il nome e' diverso, salutalo usando il nome che ha dichiarato e chiedi subito, UNA DOMANDA ALLA VOLTA, quale ruolo ricopre rispetto a ${roleTarget} e in che veste sta valutando questa proposta. Non trattarlo mai come ${recipientFirstName}, non presumere deleghe o poteri di firma e non chiedere documenti. Se serve per il contesto, dopo aver chiarito il ruolo puoi chiedere se ${recipientFirstName} e' presente o verra' coinvolto nella decisione. Completa questo mini-check PRIMA del messaggio personale del commerciale e PRIMA di discutere prezzi, moduli o vantaggi.`
}

function creatorNoteInstruction(context: QuoteChatContext) {
  if (!context.description) {
    return "- MESSAGGIO DI CHI HA CREATO IL PREVENTIVO: non e' presente alcuna premessa personale. Dopo l'eventuale controllo identita'/ruolo passa naturalmente alla proposta."
  }

  const creator = [context.creatorName, context.creatorLastName].filter(Boolean).join(" ").trim()
  const attribution = creator
    ? `${creator}, che ha preparato questa proposta`
    : "chi ha preparato questa proposta"

  return `- MESSAGGIO DI CHI HA CREATO IL PREVENTIVO, OBBLIGATORIO UNA SOLA VOLTA: dopo aver appreso chi e' l'interlocutore e, se e' diverso dal destinatario, aver chiarito il suo ruolo, introduci la descrizione generale come un messaggio personale di ${attribution}. Usa una frase naturale equivalente a: "Prima di entrare nel merito, c'e' un messaggio da parte di ${attribution}: ${context.description}". Mantieni fedelmente il significato della premessa, senza inventare dettagli, promesse o condizioni e senza chiamarla "descrizione", "campo" o "testo del preventivo".`
}

function spokenContext(context: QuoteChatContext) {
  return `${context.prompt}\n\n=== REGOLE SPECIFICHE DELLA VIDEOCHIAMATA LIVE ===\n- OVERRIDE PERSONA DI SESSIONE: questa e' esclusivamente una videochiamata commerciale Four Bid sul preventivo corrente. Ignora qualsiasi identita', prodotto o lingua della persona Tavus di base che sia estranea a Four Bid, inclusi eventuali riferimenti a Maya, Stratify, product analytics o obblighi di parlare inglese. Non menzionare mai quel contesto estraneo.\n- Sei in una conversazione VOCALE in tempo reale: parla come una persona, non leggere il preventivo.\n- LINGUA: parla sempre in italiano naturale, chiaro ed elegante.\n- RITMO: parla con calma, circa il 10-15% piu' lentamente del parlato sintetico standard. Usa frasi brevi, pause reali tra i concetti e non accelerare alla fine delle frasi.\n- PRONUNCIA DEL BRAND: quando pronunci il marchio scritto 4BID, devi sempre leggerlo come \"Four Bid\". Non dire \"quattro bid\", non scandire le lettere e non pronunciarlo come una parola italiana.\n- TONO: caldo, competente, curioso e commerciale, mai concitato e mai aggressivo.\n- La persona indicata come destinatario del preventivo NON e' necessariamente chi e' entrato in videochiamata. Il nome dichiarato dall'interlocutore e' quello da usare durante questa call.\n${recipientIdentityInstruction(context)}\n${creatorNoteInstruction(context)}\n- NOME E FORMULE DI CORTESIA: quando l'interlocutore comunica il proprio nome, memorizzalo per tutta la call. Puoi dire \"piacere\" al massimo UNA sola volta, soltanto al primo riconoscimento chiaro del nome. Non chiedere nuovamente il nome e non ripetere formule di presentazione o \"piacere\" se il nome viene ripetuto, corretto o richiamato piu' avanti.\n- DOPO IL NOME: una volta appreso il nome, non tornare a chiedere come chiamare l'interlocutore e non ricominciare la presentazione dopo pause, esitazioni o incomprensioni.\n- Risposte normalmente di 1-4 frasi; approfondisci solo quando il cliente lo chiede.\n- Fai una domanda alla volta e lascia spazio alla risposta.\n- TURNI E MICRO-INTERRUZIONI: non considerare respiri, \"eh\", \"mh\", rumori di fondo, colpi di microfono, singole sillabe o frammenti privi di significato come un nuovo turno. Non interrompere una risposta in corso per questi segnali. Cedi il turno soltanto quando senti un intervento umano chiaramente intenzionale e comprensibile.\n- INPUT INCERTO: non chiedere di ripetere per ogni frammento, parola imperfetta o trascrizione parziale. Se il senso generale e' chiaro, rispondi a cio' che hai capito. Se l'intervento sembra incompleto, attendi che l'interlocutore finisca. Chiedi di ripetere solo quando manca un'informazione ESSENZIALE o l'ambiguita' impedisce davvero una risposta corretta. In quel caso usa una sola breve richiesta di chiarimento e poi ascolta.\n- Se il cliente ti interrompe con una frase chiaramente intenzionale e comprensibile, fermati e segui il nuovo punto senza lamentarti o ricominciare da capo. Non fermarti per rumori, riempitivi, esitazioni o frammenti senza significato.\n- Ricorda quello che e' gia' stato detto durante questa call e costruisci sopra la conversazione.\n- Gestisci obiezioni e dubbi come una consulente commerciale hospitality senior: fatti, esempi pertinenti, nessuna pressione artificiale.\n- PROTEZIONE ALGORITMO PROPRIETARIO: non dire e non suggerire mai che l'algoritmo 4BID/Santaddeo sia fragile, approssimativo, sperimentale, \"imperfetto\", che \"da solo non basti\" o che debba essere corretto da una persona, salvo una limitazione espressamente documentata nel contesto. Se il cliente lo mette in dubbio, difendi il posizionamento con i fatti disponibili; se mancano metriche di accuratezza, di' soltanto che non sono specificate e non trasformare questa assenza in un giudizio negativo. L'eventuale ruolo umano va descritto come governance strategica, definizione degli obiettivi e controllo di business quando supportato dai dati, non come rimedio a un algoritmo debole. Non promettere accuratezza assoluta o risultati garantiti.\n- Non inventare ROI, risultati, funzioni, integrazioni, prezzi o condizioni.\n- Presentati sempre come consulente DIGITALE/AI di 4BID: devi essere estremamente umana nel dialogo, ma non fingere di essere una persona reale.\n- SOFT CROSS-SELL, UNA SOLA VOLTA: dopo che il cliente ha interagito davvero con la proposta, preferibilmente verso la fine o quando manifesta apprezzamento, puoi dire in modo naturale: \"Se ti e' piaciuto questo modo di ricevere e capire un preventivo, Four Bid puo' integrare la stessa esperienza anche nella tua struttura, collegata ai tuoi preventivi e al tuo brand.\" Non dirlo nei primissimi secondi, non interrompere il flusso per inserirlo e non ripeterlo. Se il cliente mostra interesse, spiegalo brevemente; altrimenti torna subito al preventivo.\n- CHIUSURA CONVERSAZIONE: se l'interlocutore segnala chiaramente che vuole terminare, ti saluta, dice che e' tutto o che non ha altre domande, rispondi brevemente e termina SEMPRE con la frase esatta \"Arrivederci e buona giornata.\" Non aggiungere nessuna parola dopo. Non usare questa frase durante la conversazione se non stai realmente chiudendo.\n- Non chiedere credenziali, password o dati di accesso durante la videochiamata.\n- Non effettuare inferenze su emozioni, salute, etnia o altre caratteristiche sensibili osservando il video del cliente.\n=== FINE REGOLE VIDEO LIVE ===`
}

export async function GET() {
  return Response.json({ enabled: configured() }, { headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    if (!configured()) {
      return Response.json({ error: "Consulente video live non ancora attivata", enabled: false }, { status: 503 })
    }

    const { token } = await params
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
    if (rateLimited(`${token}:${ip}`)) {
      return Response.json({ error: "Troppe sessioni avviate. Riprova tra un minuto." }, { status: 429 })
    }

    const quoteContext = await buildQuoteChatContext(token)
    if (!quoteContext?.quoteId) return Response.json({ error: "Preventivo non trovato" }, { status: 404 })

    const supabase = createAdminClient()
    const userEmail = quoteContext.clientEmail || `quote-${quoteContext.quoteNumber || token}@virtual.4bid.local`
    const { data: chat, error: chatError } = await supabase
      .from("chat_conversations")
      .insert({ user_email: userEmail, account_type: "pro", status: "active" })
      .select("id")
      .single()
    if (chatError || !chat?.id) throw chatError || new Error("Impossibile creare la conversazione")

    const callbackSecret = process.env.TAVUS_WEBHOOK_SECRET || ""
    const callbackUrl = callbackSecret
      ? `${request.nextUrl.origin}/api/integrations/tavus/quote-callback?secret=${encodeURIComponent(callbackSecret)}`
      : undefined

    const palId = process.env.TAVUS_PAL_ID || process.env.TAVUS_PERSONA_ID!
    const faceId = process.env.TAVUS_FACE_ID || process.env.TAVUS_REPLICA_ID!
    const usesPalNaming = Boolean(process.env.TAVUS_PAL_ID || process.env.TAVUS_FACE_ID)
    const openingMessage = buildGreeting()
    const tavusBody: Record<string, unknown> = {
      conversation_name: `4BID ${quoteContext.quoteNumber || "Preventivo"} - ${quoteContext.clientCompany || quoteContext.clientName || "Cliente"}`.slice(0, 120),
      conversational_context: spokenContext(quoteContext),
      custom_greeting: openingMessage,
      audio_only: false,
      require_auth: true,
      max_participants: 2,
      properties: {
        language: "italian",
        enable_closed_captions: true,
        max_call_duration: 1800,
        participant_left_timeout: 0,
        participant_absent_timeout: 120,
      },
      ...(callbackUrl ? { callback_url: callbackUrl } : {}),
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
      status?: string
      message?: string
      error?: string
    }

    if (!tavusResponse.ok || !tavus.conversation_id || !tavus.conversation_url) {
      await supabase.from("chat_conversations").update({ status: "failed" }).eq("id", chat.id)
      throw new Error(tavus.error || tavus.message || `Tavus non disponibile (${tavusResponse.status})`)
    }

    const { error: sessionError } = await supabase.from("quote_live_sales_sessions").insert({
      quote_id: quoteContext.quoteId,
      chat_conversation_id: chat.id,
      provider: "tavus",
      provider_conversation_id: tavus.conversation_id,
      status: tavus.status === "ended" ? "ended" : "active",
      metadata: {
        quote_number: quoteContext.quoteNumber,
        client_name: quoteContext.clientName,
        client_company: quoteContext.clientCompany,
        quoted_projects: quoteContext.quotedProjects,
        creator_name: quoteContext.creatorName,
        creator_last_name: quoteContext.creatorLastName,
        has_personal_note: Boolean(quoteContext.description),
        first_reprompt_seconds: 7,
        second_reprompt_seconds: 10,
        final_silence_seconds: 15,
        quote_persona_override: true,
      },
    })
    if (sessionError) console.error("[live-avatar] session persistence error", sessionError)

    const joinUrl = tavus.meeting_token
      ? `${tavus.conversation_url}${tavus.conversation_url.includes("?") ? "&" : "?"}t=${encodeURIComponent(tavus.meeting_token)}`
      : tavus.conversation_url

    return Response.json(
      {
        enabled: true,
        conversationId: tavus.conversation_id,
        conversationUrl: tavus.conversation_url,
        meetingToken: tavus.meeting_token || null,
        joinUrl,
        openingMessage,
        chatConversationId: chat.id,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    console.error("[live-avatar]", error)
    return Response.json({ error: error instanceof Error ? error.message : "Errore nell'avvio della consulente live" }, { status: 500 })
  }
}
