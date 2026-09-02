import { NextResponse } from "next/server"
import { generateText } from "ai"
import { buildQuoteChatContext, extractQuoteToken, type QuoteChatContext } from "@/lib/quotes/chat-context"
import { QUOTE_SALES_MODEL } from "@/lib/quotes/digital-sales-agent"
import { saveQuoteSalesIntelligence, type SalesChatMessage } from "@/lib/quotes/sales-intelligence"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { sendEmail } from "@/lib/email-smtp"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"
const GENERAL_MODEL = "openai/gpt-4o-mini"
const QUOTE_HISTORY_LIMIT = 20
const GENERAL_HISTORY_LIMIT = 8
const REQUESTS_PER_MINUTE = 12
const requestWindows = new Map<string, number[]>()

type LeadCollectionState = {
  isCollecting: boolean
  reason: "consulenza" | "contatto" | "non_so_rispondere" | null
  collectedData: { nome?: string; email?: string; telefono?: string; messaggio?: string }
  step: "nome" | "email" | "telefono" | "messaggio" | "conferma" | "completato" | null
  originalQuestion?: string
  pageContext?: string
  prefilledFromQuote?: boolean
  quoteNumber?: string
}

const EXPLICIT_CONTACT_TERMS = [
  "contattatemi", "contattami", "chiamatemi", "chiamami", "richiamatemi", "richiamami",
  "parlare con qualcuno", "parlare con un operatore", "parlare con una persona", "supporto umano",
  "operatore umano", "voglio essere ricontattato", "vorrei essere ricontattato", "fatemi ricontattare",
]

const GENERAL_COMMERCIAL_TERMS = [
  "consulenza", "preventivo", "interessato", "come posso acquistare", "acquistare", "quanto costa",
  "prezzo", "costi", "demo", "appuntamento", "incontro",
]

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const previous = (requestWindows.get(key) || []).filter((ts) => now - ts < 60_000)
  previous.push(now)
  requestWindows.set(key, previous)
  if (requestWindows.size > 5_000) {
    for (const [k, values] of requestWindows) {
      if (!values.some((ts) => now - ts < 60_000)) requestWindows.delete(k)
    }
  }
  return previous.length > REQUESTS_PER_MINUTE
}

function wantsHumanContact(message: string): boolean {
  const text = message.toLowerCase()
  return EXPLICIT_CONTACT_TERMS.some((term) => text.includes(term))
}

function shouldOfferHumanContact(message: string, response: string, quoteContext: QuoteChatContext | null): boolean {
  const lowerResponse = response.toLowerCase()
  const uncertain = [
    "non ho informazioni", "non sono sicuro", "non sono sicura", "deve confermarlo il team",
    "va confermato dal team", "non posso confermare",
  ].some((term) => lowerResponse.includes(term))
  if (uncertain) return true
  if (quoteContext) return false
  const lowerMessage = message.toLowerCase()
  return GENERAL_COMMERCIAL_TERMS.some((term) => lowerMessage.includes(term))
}

function extractEmail(message: string): string | null {
  return message.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || null
}

function leadPrompt(state: LeadCollectionState): string {
  const intro = state.reason === "non_so_rispondere"
    ? "Su questo punto preferisco coinvolgere una persona del team, così ti diamo una risposta precisa."
    : "Perfetto. Organizzo il ricontatto con il team 4BID."

  switch (state.step) {
    case "nome": return `${intro}\n\nQual è il tuo nome?`
    case "email": return `Piacere ${state.collectedData.nome || ""}. Qual è la tua email?`
    case "telefono":
      return state.prefilledFromQuote
        ? `${intro}\n\nUso già nome ed email presenti nel preventivo. Vuoi lasciarmi anche un numero di telefono? È opzionale: scrivi “salta” per proseguire senza.`
        : "Vuoi lasciarmi anche un numero di telefono? È opzionale: scrivi “salta” per proseguire senza."
    case "messaggio":
      return state.originalQuestion
        ? `Ho già annotato la tua richiesta: “${state.originalQuestion}”. Vuoi aggiungere qualcosa? Scrivi “no” per inviarla così com'è.`
        : "Descrivimi in una frase cosa vuoi approfondire."
    case "conferma":
      return `Riepilogo: ${state.collectedData.nome || "—"} · ${state.collectedData.email || "—"}${state.collectedData.telefono ? ` · ${state.collectedData.telefono}` : ""}\n\nRichiesta: ${state.collectedData.messaggio || state.originalQuestion || "—"}\n\nConfermi l'invio?`
    default: return ""
  }
}

async function saveContactAndNotify(supabase: any, state: LeadCollectionState, conversationId: string) {
  const provenance = [
    state.quoteNumber ? `Preventivo: ${state.quoteNumber}` : null,
    state.pageContext ? `Pagina: ${state.pageContext}` : null,
  ].filter(Boolean).join("\n")
  const message = state.collectedData.messaggio || state.originalQuestion || "Richiesta di ricontatto"

  const { error } = await supabase.from("contacts").insert({
    name: state.collectedData.nome,
    email: state.collectedData.email,
    phone: state.collectedData.telefono || null,
    message: `[Ticket da consulente digitale 4BID - ${state.reason}]\n${provenance}\n\n${message}`,
    read: false,
  })
  if (error) throw error

  await supabase.from("chat_conversations").update({ status: "escalated" }).eq("id", conversationId)

  const emailResult = await sendEmail({
    to: SUPER_ADMIN_EMAIL,
    subject: `Nuovo contatto dal consulente digitale 4BID - ${state.collectedData.nome || "Cliente"}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto"><h2>Nuovo contatto dal preventivo/chat 4BID</h2><p><b>Nome:</b> ${state.collectedData.nome || "—"}</p><p><b>Email:</b> ${state.collectedData.email || "—"}</p><p><b>Telefono:</b> ${state.collectedData.telefono || "—"}</p><p><b>Preventivo:</b> ${state.quoteNumber || "—"}</p><p><b>Richiesta:</b><br>${message}</p><p><a href="https://4bid.it/admin/chat-conversations/${conversationId}">Apri conversazione</a></p></div>`,
  })
  if (!emailResult.success) console.error("[ai-support] contact notification failed", emailResult.error)
}

async function retrieveKnowledge(supabase: any, query: string): Promise<string> {
  const stopWords = new Set(["che", "cosa", "come", "perche", "perché", "quanto", "quale", "dove", "sono", "della", "delle", "degli", "questo", "questa", "anche", "con", "per", "una", "uno", "gli", "del", "nel", "sul"])
  const terms = query.toLowerCase().replace(/[.,!?;:'"()[\]{}]/g, " ").split(/\s+/)
    .filter((term) => term.length > 2 && !stopWords.has(term)).slice(0, 6)

  let items: any[] = []
  if (terms.length) {
    const conditions = terms.map((term) => `title.ilike.%${term}%,content.ilike.%${term}%`).join(",")
    const { data } = await supabase.from("knowledge_base").select("title,content,source_url,category,priority")
      .eq("is_active", true).or(conditions).order("priority", { ascending: false }).limit(14)
    items = data || []
  }
  if (!items.length) {
    const { data } = await supabase.from("knowledge_base").select("title,content,source_url,category,priority")
      .eq("is_active", true).order("priority", { ascending: false }).limit(10)
    items = data || []
  }

  if (!items.length) return "Non sono disponibili contenuti aggiuntivi nella knowledge base. Non inventare dettagli di prodotto."
  return items.map((item) => `---\n[TITOLO] ${item.title}\n[URL] ${item.source_url || "N/A"}\n[CONTENUTO]\n${item.content}\n---`).join("\n\n")
}

async function generateResponse(args: {
  quoteContext: QuoteChatContext | null
  knowledgeBase: string
  conversationHistory: string
}) {
  const { quoteContext, knowledgeBase, conversationHistory } = args
  const system = quoteContext
    ? `CONTESTO DALLA KNOWLEDGE BASE 4BID:\n${knowledgeBase}\n\n${quoteContext.prompt}`
    : `Sei l'assistente 4BID. Rispondi in italiano in modo professionale, utile e concreto. Usa solo i fatti presenti nella knowledge base; se un dettaglio manca dichiaralo.\n\nKNOWLEDGE BASE:\n${knowledgeBase}`

  const prompt = quoteContext
    ? `CRONOLOGIA DELLA CONVERSAZIONE (usala come memoria reale: ricorda dubbi, obiezioni, preferenze e spiegazioni già date):\n${conversationHistory}\n\nRispondi all'ULTIMO messaggio dell'utente come consulente commerciale digitale senior 4BID. Non ripartire da zero. Rispondi prima alla domanda; poi collega il valore alla struttura e, solo se naturale, proponi una singola micro-azione successiva. Se citi fonti web della knowledge base, mettile alla fine.`
    : `Cronologia conversazione:\n${conversationHistory}\n\nRispondi all'ultimo messaggio in italiano, in modo conciso e utile. Se usi informazioni specifiche dalla knowledge base, includi le fonti alla fine.`

  if (!quoteContext) {
    return generateText({ model: GENERAL_MODEL, temperature: 0.3, maxOutputTokens: 500, system, prompt })
  }

  try {
    return await generateText({ model: QUOTE_SALES_MODEL, temperature: 0.45, maxOutputTokens: 850, system, prompt })
  } catch (error) {
    console.error("[ai-support] premium quote model failed, fallback", error)
    return generateText({ model: GENERAL_MODEL, temperature: 0.35, maxOutputTokens: 650, system, prompt })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json().catch(() => ({}))
    const { message, conversationId, userEmail, accountType, leadState, pageContext, originalQuestion } = body

    if (typeof message !== "string" || !message.trim()) return NextResponse.json({ error: "Messaggio mancante" }, { status: 400 })
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
    if (isRateLimited(ip)) return NextResponse.json({ error: "Troppi messaggi in poco tempo. Attendi un minuto e riprova." }, { status: 429 })

    const effectiveEmail = typeof userEmail === "string" && userEmail ? userEmail : "anonymous@4bid.it"
    const effectiveAccountType = typeof accountType === "string" && accountType ? accountType : "pro"
    if (effectiveAccountType === "free") return NextResponse.json({ error: "Chat AI disponibile solo per account Pro e Business" }, { status: 403 })

    let currentConversationId = typeof conversationId === "string" && conversationId ? conversationId : null
    if (!currentConversationId) {
      const { data, error } = await supabase.from("chat_conversations").insert({
        user_email: effectiveEmail,
        account_type: effectiveAccountType,
        status: "active",
      }).select("id").single()
      if (error || !data) throw error || new Error("Impossibile creare la conversazione")
      currentConversationId = data.id
    }

    const { error: userError } = await supabase.from("chat_messages").insert({
      conversation_id: currentConversationId,
      role: "user",
      content: message.trim(),
    })
    if (userError) throw userError

    const quoteToken = extractQuoteToken(typeof pageContext === "string" ? pageContext : null)
    const quoteContext = quoteToken ? await buildQuoteChatContext(quoteToken) : null

    let state: LeadCollectionState = {
      isCollecting: false,
      reason: null,
      collectedData: {},
      step: null,
    }
    if (leadState?.isCollecting && leadState?.step) {
      state = {
        isCollecting: true,
        reason: leadState.reason || null,
        collectedData: leadState.collectedData || {},
        step: leadState.step,
        originalQuestion: leadState.originalQuestion,
        pageContext: leadState.pageContext || pageContext || undefined,
        prefilledFromQuote: Boolean(leadState.prefilledFromQuote),
        quoteNumber: leadState.quoteNumber,
      }
    }

    if (state.isCollecting && state.step) {
      const lower = message.toLowerCase().trim()
      if (state.step === "conferma") {
        if (["si", "sì", "yes", "ok", "confermo", "conferma"].includes(lower)) {
          await saveContactAndNotify(supabase, state, currentConversationId)
          const answer = "Perfetto, richiesta inviata. Il team 4BID ha già il contesto della conversazione e del preventivo, quindi non dovrai rispiegare tutto da capo."
          await supabase.from("chat_messages").insert({ conversation_id: currentConversationId, role: "assistant", content: answer })
          return NextResponse.json({ response: answer, conversationId: currentConversationId, leadState: { isCollecting: false, reason: null, collectedData: {}, step: null } })
        }
        if (["no", "annulla", "cancella"].includes(lower)) {
          const answer = "Va bene, non invio nulla. Continuiamo qui: cosa vuoi approfondire?"
          await supabase.from("chat_messages").insert({ conversation_id: currentConversationId, role: "assistant", content: answer })
          return NextResponse.json({ response: answer, conversationId: currentConversationId, leadState: { isCollecting: false, reason: null, collectedData: {}, step: null } })
        }
      }

      if (state.step === "nome") {
        state.collectedData.nome = message.trim(); state.step = "email"
      } else if (state.step === "email") {
        const email = extractEmail(message)
        if (!email) {
          const answer = "Indicami un indirizzo email valido, per esempio nome@azienda.it."
          await supabase.from("chat_messages").insert({ conversation_id: currentConversationId, role: "assistant", content: answer })
          return NextResponse.json({ response: answer, conversationId: currentConversationId, leadState: state })
        }
        state.collectedData.email = email; state.step = "telefono"
      } else if (state.step === "telefono") {
        state.collectedData.telefono = ["salta", "skip", "no"].includes(lower) ? undefined : message.trim(); state.step = "messaggio"
      } else if (state.step === "messaggio") {
        const noAddition = ["no", "niente", "nulla", "va bene", "va bene così", "così va bene", "ok"].includes(lower)
        state.collectedData.messaggio = state.originalQuestion
          ? (noAddition ? state.originalQuestion : `${state.originalQuestion}\n\nAggiunta dell'utente: ${message.trim()}`)
          : message.trim()
        state.step = "conferma"
      }

      const answer = leadPrompt(state)
      await supabase.from("chat_messages").insert({ conversation_id: currentConversationId, role: "assistant", content: answer })
      return NextResponse.json({ response: answer, conversationId: currentConversationId, leadState: state })
    }

    if (wantsHumanContact(message)) {
      const prefilled = Boolean(quoteContext?.clientName && quoteContext?.clientEmail)
      const contactState: LeadCollectionState = {
        isCollecting: true,
        reason: "consulenza",
        collectedData: prefilled ? { nome: quoteContext!.clientName!, email: quoteContext!.clientEmail! } : {},
        step: prefilled ? "telefono" : "nome",
        originalQuestion: typeof originalQuestion === "string" && originalQuestion.trim() ? originalQuestion.trim() : message.trim(),
        pageContext: typeof pageContext === "string" ? pageContext : undefined,
        prefilledFromQuote: prefilled,
        quoteNumber: quoteContext?.quoteNumber || undefined,
      }
      const answer = leadPrompt(contactState)
      await supabase.from("chat_messages").insert({ conversation_id: currentConversationId, role: "assistant", content: answer })
      return NextResponse.json({ response: answer, conversationId: currentConversationId, leadState: contactState })
    }

    const historyLimit = quoteContext ? QUOTE_HISTORY_LIMIT : GENERAL_HISTORY_LIMIT
    const { data: historyMessages } = await supabase.from("chat_messages")
      .select("role,content,created_at").eq("conversation_id", currentConversationId)
      .order("created_at", { ascending: false }).limit(historyLimit)

    const orderedHistory = (historyMessages || []).reverse() as SalesChatMessage[]
    const conversationHistory = orderedHistory.map((item) => `${item.role}: ${item.content}`).join("\n")
    const knowledgeBase = await retrieveKnowledge(supabase, message)
    const { text } = await generateResponse({ quoteContext, knowledgeBase, conversationHistory })
    const aiResponse = text.trim() || "Non riesco a formulare una risposta utile in questo momento."

    const offerContact = shouldOfferHumanContact(message, aiResponse, quoteContext)
    const finalResponse = offerContact
      ? `${aiResponse}\n\n---\n\nSe vuoi, posso passare tutto il contesto a una persona del team: scrivi **contattatemi**.`
      : aiResponse

    const { data: assistantMessage, error: assistantError } = await supabase.from("chat_messages").insert({
      conversation_id: currentConversationId,
      role: "assistant",
      content: finalResponse,
    }).select("id").single()
    if (assistantError) throw assistantError

    if (quoteContext) {
      try {
        const admin = createAdminClient()
        await saveQuoteSalesIntelligence(admin, currentConversationId, {
          quoteId: quoteContext.quoteId,
          quoteNumber: quoteContext.quoteNumber,
          recipientEmail: quoteContext.clientEmail,
          quotedProjects: quoteContext.quotedProjects,
        }, orderedHistory)
      } catch (error) {
        console.error("[ai-support] sales intelligence save failed", error)
      }
    }

    return NextResponse.json({
      response: finalResponse,
      conversationId: currentConversationId,
      messageId: assistantMessage?.id,
      leadState: state,
      offerContact,
    })
  } catch (error) {
    console.error("[ai-support] error", error)
    return NextResponse.json({ error: "Errore del server: " + (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
