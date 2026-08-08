import { NextResponse } from "next/server"
import { buildQuoteChatContext, extractQuoteToken, type QuoteChatContext } from "@/lib/quotes/chat-context"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-smtp"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

interface LeadCollectionState {
  isCollecting: boolean
  reason: "consulenza" | "contatto" | "non_so_rispondere" | null
  collectedData: {
    nome?: string
    email?: string
    telefono?: string
    messaggio?: string
  }
  step: "nome" | "email" | "telefono" | "messaggio" | "conferma" | "completato" | null
  /**
   * La domanda che ha fatto partire la raccolta dati.
   *
   * Senza questo campo la domanda andava persa: il ticket arrivava al team con
   * il solo testo scritto durante la raccolta, che spesso e' un rimando ("l'ho
   * scritto prima"), e chi apriva il ticket non aveva modo di sapere cosa
   * fosse stato chiesto.
   */
  originalQuestion?: string
  /** Da quale pagina e' partita la richiesta (utile al team che prende in carico). */
  pageContext?: string
  /** Nome ed email arrivano dal preventivo: non li abbiamo chiesti all'utente. */
  prefilledFromQuote?: boolean
  /** Numero del preventivo da cui nasce il ticket. */
  quoteNumber?: string
}

/**
 * Richieste ESPLICITE di parlare con una persona.
 *
 * Solo qui la raccolta dati e' la risposta giusta: l'utente non sta chiedendo
 * un'informazione, sta chiedendo un contatto. In questo caso non interroghiamo
 * nemmeno il modello, perche' la sua risposta verrebbe buttata.
 */
const CONTATTO_ESPLICITO_KEYWORDS = [
  "contattatemi",
  "contattami",
  "contattarvi",
  "chiamatemi",
  "chiamami",
  "richiamatemi",
  "richiamami",
  "parlare con qualcuno",
  "parlare con un operatore",
  "parlare con una persona",
  "supporto umano",
  "operatore umano",
  "voglio essere ricontattato",
  "vorrei essere ricontattato",
  "fatemi ricontattare",
]

/**
 * Argomenti commerciali.
 *
 * ATTENZIONE: queste parole NON devono far scattare la raccolta dati.
 * Prima stavano tutte insieme alle richieste esplicite, e siccome il confronto
 * e' per sottostringa bastava la parola "preventivo" per scavalcare la
 * risposta. Sulla pagina di un preventivo quella parola compare in quasi ogni
 * domanda possibile ("il preventivo include la formazione?", "il preventivo e'
 * IVA esclusa?"): il risultato era che proprio chi aveva gia' un'offerta in
 * mano non riceveva risposta e si vedeva chiedere nome, email e telefono.
 * Qui il contatto si PROPONE in coda alla risposta, non la sostituisce.
 */
const INTERESSE_COMMERCIALE_KEYWORDS = [
  "consulenza",
  "preventivo",
  "informazioni",
  "interessato",
  "vorrei sapere di più",
  "come posso acquistare",
  "acquistare",
  "quanto costa",
  "prezzo",
  "costi",
  "demo",
  "appuntamento",
  "incontro",
  "assistenza",
]

/**
 * Nessun ramo automatico fa partire la raccolta dati: al massimo la PROPONE.
 * L'unico caso in cui parte da sola e' la richiesta esplicita dell'utente,
 * gestita a monte da `wantsHumanContact`.
 */
type LeadDecision = { mode: "offer"; reason: "consulenza" | "non_so_rispondere" } | null

/** L'utente ha chiesto espressamente di essere contattato? */
function wantsHumanContact(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return CONTATTO_ESPLICITO_KEYWORDS.some((kw) => lowerMessage.includes(kw))
}

/**
 * Decide cosa fare DOPO aver generato la risposta.
 *
 * Non restituisce mai "sostituisci la risposta" per un semplice argomento
 * commerciale: al massimo restituisce "offer", cioe' aggiungi una proposta di
 * contatto in coda.
 */
function decideLeadAfterAnswer(message: string, aiResponse: string): LeadDecision {
  const lowerMessage = message.toLowerCase()
  const lowerResponse = aiResponse.toLowerCase()

  // Il modello ha dichiarato di non saper rispondere.
  //
  // Anche qui il contatto si PROPONE. Far partire la raccolta dati da sola
  // sembrava sensato, ma la base di conoscenza non copre i dettagli dei
  // preventivi: su domande normali ("include la formazione?", "e' IVA
  // esclusa?") il modello dice "non ho informazioni" e l'utente si ritrovava
  // comunque a farsi chiedere nome, email e telefono. Stesso fastidio di
  // prima, causa diversa.
  if (
    lowerResponse.includes("non sono in grado") ||
    lowerResponse.includes("non posso aiutarti") ||
    lowerResponse.includes("non ho informazioni") ||
    lowerResponse.includes("non sono sicuro") ||
    lowerResponse.includes("ti consiglio di contattare") ||
    lowerResponse.includes("contatta il team")
  ) {
    return { mode: "offer", reason: "non_so_rispondere" }
  }

  if (INTERESSE_COMMERCIALE_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    return { mode: "offer", reason: "consulenza" }
  }

  return null
}

function extractDataFromMessage(message: string, step: string): string | null {
  const trimmed = message.trim()

  if (step === "email") {
    // Simple email validation
    const emailMatch = trimmed.match(/[\w.-]+@[\w.-]+\.\w+/)
    return emailMatch ? emailMatch[0] : null
  }

  if (step === "telefono") {
    // Extract phone number (digits, spaces, +, -)
    const phoneMatch = trimmed.match(/[\d\s+\-()]{6,}/)
    return phoneMatch ? phoneMatch[0].trim() : null
  }

  // For nome and messaggio, just return the trimmed message
  return trimmed || null
}

function getLeadCollectionPrompt(state: LeadCollectionState): string {
  const reason =
    state.reason === "consulenza"
      ? "🎯 Ottimo! Sarò felice di aiutarti a metterti in contatto con il nostro team."
      : "🤔 Mi dispiace di non poterti aiutare direttamente su questo. Ti metto in contatto con il nostro team che potrà risponderti."

  switch (state.step) {
    case "nome":
      return `${reason}\n\n📝 Per poterti ricontattare, ho bisogno di alcune informazioni.\n\n**Qual è il tuo nome?**`
    case "email":
      return `👋 Piacere di conoscerti, **${state.collectedData.nome}**!\n\n📧 **Qual è la tua email?**`
    case "telefono":
      // Se nome ed email arrivano dal preventivo, questo e' il PRIMO messaggio
      // della raccolta: va detto quali dati stiamo gia' usando, altrimenti
      // sembra che la chat parta a meta' e chieda il telefono dal nulla.
      if (state.prefilledFromQuote) {
        return `${reason}\n\n📝 Uso i dati del tuo preventivo:\n\n👤 **${state.collectedData.nome}**\n📧 ${state.collectedData.email}\n\n📱 **Vuoi lasciare anche un numero di telefono?**\n_(opzionale, scrivi "salta" per saltare)_`
      }
      return `✅ Perfetto!\n\n📱 **Qual è il tuo numero di telefono?**\n_(opzionale, scrivi "salta" per saltare)_`
    case "messaggio":
      // Se la domanda di partenza c'e' gia', non la richiediamo: chiedere di
      // nuovo "descrivi la tua richiesta" a chi l'ha appena scritta e' il
      // motivo per cui si finiva con ticket tipo "l'ho scritto prima".
      if (state.originalQuestion) {
        return `👍 Ottimo!\n\n💬 Ho già annotato la tua domanda:\n\n_"${state.originalQuestion}"_\n\n**Vuoi aggiungere altro?** _(scrivi "no" per inviarla così com'è)_`
      }
      return `👍 Ottimo!\n\n💬 **Descrivi brevemente la tua richiesta o domanda:**`
    case "conferma":
      const data = state.collectedData
      return `📋 **Riepilogo dei tuoi dati:**\n\n👤 **Nome:** ${data.nome}\n📧 **Email:** ${data.email}\n📱 **Telefono:** ${data.telefono || "Non fornito"}\n💬 **Messaggio:** ${data.messaggio}\n\n✅ **Confermi l'invio?** _(rispondi "sì" o "no")_`
    default:
      return ""
  }
}

// Function to build dynamic knowledge base from database
async function buildDynamicKnowledgeBase(
  supabase: any,
  userQuery?: string,
): Promise<{ knowledgeBase: string; sources: string[] }> {
  // Use smart retrieval if query provided
  const { items: knowledgeItems, sources } = userQuery
    ? await smartRetrieveKnowledge(supabase, userQuery)
    : { items: [], sources: [] }

  // Fallback to old behavior if no query
  if (!userQuery || knowledgeItems.length === 0) {
    const { data } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .limit(50)

    const defaultSources = (data || []).map((d: any) => d.source_url).filter(Boolean)

    if (!data || data.length === 0) {
      return {
        knowledgeBase: `Sei un assistente AI per 4BID.IT, azienda italiana specializzata in soluzioni tecnologiche innovative e Revenue Management per hotel.

SERVIZI PRINCIPALI:
- Consulenza Revenue Management per Hotel
- Sviluppo Software Personalizzato
- Applicazioni AI (SantAddeo, Manubot, MyPetSenseAI, ecc.)
- Formazione e Coaching

CONTATTI:
- Email: info@4bid.it
- Sito: https://4bid.it

REGOLE IMPORTANTI:
- Rispondi SEMPRE in italiano
- Se l'utente chiede consulenza, preventivo, demo, contatto, o vuole essere richiamato → NON rimandare al form, ma raccogli i dati direttamente in chat
- Se non sai rispondere a una domanda specifica → raccogli i dati per creare un ticket`,
        sources: [],
      }
    }

    // Old concatenation logic
    const byCategory = data.reduce((acc: any, item: any) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    }, {})

    let kb = `Sei un assistente AI per 4BID.IT, azienda italiana specializzata in soluzioni tecnologiche innovative.

INFORMAZIONI DALLA KNOWLEDGE BASE:\n\n`

    for (const [category, items] of Object.entries(byCategory)) {
      kb += `\n=== ${category.toUpperCase()} ===\n`
      for (const item of items as any[]) {
        kb += `\n${item.title}:\n${item.content}\n`
        if (item.source_url) {
          kb += `Link: ${item.source_url}\n`
        }
      }
    }

    kb += `\n\nREGOLE IMPORTANTI:
- Rispondi SEMPRE in italiano in modo cortese e professionale
- Usa le informazioni della knowledge base sopra
- Se l'utente chiede consulenza, preventivo, demo, contatto, o vuole essere richiamato → NON rimandare al form, ma rispondi che raccoglierai i dati in chat
- Se non conosci la risposta → rispondi che non hai le informazioni e che creerai un ticket
- NON dire mai "compila il form" o "contatta via email" - raccogli sempre i dati in chat`

    return { knowledgeBase: kb, sources: defaultSources }
  }

  let knowledgeBase = `Sei un assistente AI per 4BID.IT, azienda italiana specializzata in Revenue Management per hotel.

CONTESTO DALLA KNOWLEDGE BASE (usa SOLO queste informazioni per rispondere):

`

  for (const item of knowledgeItems) {
    knowledgeBase += `---
[TITOLO] ${item.title}
[URL] ${item.source_url || "N/A"}
[CONTENUTO]
${item.content}
---

`
  }

  knowledgeBase += `
REGOLE IMPORTANTI:
- Rispondi SEMPRE in italiano in modo cortese e professionale
- Usa SOLO le informazioni del contesto sopra. Se non trovi la risposta, dì chiaramente che non hai informazioni a riguardo.
- Alla fine della risposta, se hai usato informazioni specifiche, aggiungi una sezione "Fonti:" con gli URL delle pagine consultate.
- Se l'utente chiede consulenza, preventivo, demo, contatto → rispondi che raccoglierai i dati in chat
- NON inventare informazioni non presenti nel contesto`

  return { knowledgeBase, sources }
}

async function smartRetrieveKnowledge(supabase: any, query: string): Promise<{ items: any[]; sources: string[] }> {
  // Extract search terms from query (remove common Italian words)
  const stopWords = [
    "il",
    "lo",
    "la",
    "i",
    "gli",
    "le",
    "un",
    "uno",
    "una",
    "di",
    "a",
    "da",
    "in",
    "con",
    "su",
    "per",
    "tra",
    "fra",
    "come",
    "cosa",
    "che",
    "chi",
    "quale",
    "quanto",
    "quando",
    "dove",
    "perché",
    "perche",
    "è",
    "e",
    "sono",
    "ho",
    "ha",
    "hai",
    "hanno",
    "mi",
    "ti",
    "ci",
    "vi",
    "si",
    "me",
    "te",
    "ce",
    "ve",
    "se",
    "ne",
    "lo",
    "la",
    "li",
    "le",
    "gli",
    "questo",
    "questa",
    "questi",
    "queste",
    "quello",
    "quella",
    "quelli",
    "quelle",
    "mio",
    "mia",
    "miei",
    "mie",
    "tuo",
    "tua",
    "tuoi",
    "tue",
    "suo",
    "sua",
    "suoi",
    "sue",
    "nostro",
    "nostra",
    "nostri",
    "nostre",
    "vostro",
    "vostra",
    "vostri",
    "vostre",
    "loro",
  ]

  const terms = query
    .toLowerCase()
    .replace(/[.,!?;:'"()[\]{}]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopWords.includes(t))
    .slice(0, 5) // Max 5 search terms

  console.log("[AI-Support] Search terms extracted:", terms)

  if (terms.length === 0) {
    // Fallback: get top priority items
    const { data } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .limit(8)

    return {
      items: data || [],
      sources: (data || []).map((d: any) => d.source_url).filter(Boolean),
    }
  }

  // Build ILIKE conditions for each term
  // Search in title and content
  const searchConditions = terms.map((term) => `title.ilike.%${term}%,content.ilike.%${term}%`).join(",")

  // First try: search with all terms (OR logic)
  const { data: matchedItems, error } = await supabase
    .from("knowledge_base")
    .select("*")
    .eq("is_active", true)
    .or(searchConditions)
    .order("priority", { ascending: false })
    .order("last_scraped_at", { ascending: false })
    .limit(12)

  if (error) {
    console.error("[AI-Support] Search error:", error)
    // Fallback to simple query
    const { data } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .limit(8)
    return {
      items: data || [],
      sources: (data || []).map((d: any) => d.source_url).filter(Boolean),
    }
  }

  if (matchedItems && matchedItems.length > 0) {
    console.log("[AI-Support] Found", matchedItems.length, "matching items")
    return {
      items: matchedItems,
      sources: matchedItems.map((d: any) => d.source_url).filter(Boolean),
    }
  }

  // Fallback: get top priority items if no matches
  console.log("[AI-Support] No matches, using fallback")
  const { data: fallbackItems } = await supabase
    .from("knowledge_base")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .limit(8)

  return {
    items: fallbackItems || [],
    sources: (fallbackItems || []).map((d: any) => d.source_url).filter(Boolean),
  }
}

/**
 * Freno allo spam.
 *
 * La chat scrive in `contacts`, la stessa tabella dei contatti veri, e finora
 * non aveva alcun filtro: fra i ticket ricevuti ce ne sono di palesemente
 * automatici. Qui il limite e' per indirizzo di rete e vale su una finestra
 * mobile, tenuto in memoria del processo: non regge un attacco distribuito,
 * ma ferma il caso reale osservato (uno script che ripete invii).
 */
const RICHIESTE_PER_MINUTO = 12
const finestraRichieste = new Map<string, number[]>()

function troppeRichieste(chiave: string): boolean {
  const ora = Date.now()
  const precedenti = (finestraRichieste.get(chiave) || []).filter((t) => ora - t < 60_000)
  precedenti.push(ora)
  finestraRichieste.set(chiave, precedenti)

  // Evita che la mappa cresca senza fine su un processo di lunga durata.
  if (finestraRichieste.size > 5_000) {
    for (const [k, v] of finestraRichieste) {
      if (!v.some((t) => ora - t < 60_000)) finestraRichieste.delete(k)
    }
  }

  return precedenti.length > RICHIESTE_PER_MINUTO
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const body = await request.json()
    const { message, conversationId, userEmail, accountType, leadState, pageContext, originalQuestion } = body

    const indirizzo =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "sconosciuto"

    if (troppeRichieste(indirizzo)) {
      console.log("[v0] Rate limit chat AI per:", indirizzo)
      return NextResponse.json(
        { error: "Troppi messaggi in poco tempo. Attendi un minuto e riprova." },
        { status: 429 },
      )
    }

    console.log("[v0] AI Support - Received:", {
      message,
      conversationId,
      hasLeadState: !!leadState,
      leadStateStep: leadState?.step,
      leadStateIsCollecting: leadState?.isCollecting,
    })

    if (!message) {
      return NextResponse.json({ error: "Messaggio mancante" }, { status: 400 })
    }

    const effectiveEmail = userEmail || "anonymous@4bid.it"
    const effectiveAccountType = accountType || "pro"

    if (effectiveAccountType === "free") {
      return NextResponse.json({ error: "Chat AI disponibile solo per account Pro e Business" }, { status: 403 })
    }

    let currentConversationId = conversationId

    // Create new conversation if first message
    if (!currentConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from("chat_conversations")
        .insert({
          user_email: effectiveEmail,
          account_type: effectiveAccountType,
          status: "active",
        })
        .select()
        .single()

      if (convError) {
        console.error("[v0] Error creating conversation:", convError)
        return NextResponse.json({ error: "Errore nel creare la conversazione: " + convError.message }, { status: 500 })
      }

      currentConversationId = newConversation.id
    }

    // Save user message
    const { error: userMsgError } = await supabase.from("chat_messages").insert({
      conversation_id: currentConversationId,
      role: "user",
      content: message,
    })

    if (userMsgError) {
      console.error("[v0] Error saving user message:", userMsgError)
      return NextResponse.json({ error: "Errore nel salvare il messaggio: " + userMsgError.message }, { status: 500 })
    }

    // Il preventivo aperto dall'utente. Serve a due cose: rispondere nel merito
    // invece di dire "non ho informazioni", e non richiedere nome ed email che
    // il preventivo contiene gia'.
    const quoteToken = extractQuoteToken(pageContext)
    const quoteContext: QuoteChatContext | null = quoteToken ? await buildQuoteChatContext(quoteToken) : null

    if (quoteToken) {
      console.log("[v0] Contesto preventivo:", quoteContext ? quoteContext.quoteNumber || "trovato" : "non trovato")
    }

    let currentLeadState: LeadCollectionState = {
      isCollecting: false,
      reason: null,
      collectedData: {},
      step: null,
    }

    // Only use incoming leadState if it's valid and isCollecting is true
    if (leadState && leadState.isCollecting === true && leadState.step) {
      currentLeadState = {
        isCollecting: true,
        reason: leadState.reason || null,
        collectedData: leadState.collectedData || {},
        step: leadState.step,
        // Questi due campi attraversano il client a ogni passaggio: se non
        // vengono ricopiati qui (e in OGNI punto di ritorno) la domanda di
        // partenza sparisce al giro successivo, che e' esattamente il difetto
        // che stiamo correggendo.
        originalQuestion: leadState.originalQuestion,
        pageContext: leadState.pageContext || pageContext || undefined,
        prefilledFromQuote: leadState.prefilledFromQuote,
        quoteNumber: leadState.quoteNumber,
      }
      console.log("[v0] Restored lead state from client:", currentLeadState)
    }

    if (currentLeadState.isCollecting && currentLeadState.step) {
      console.log("[v0] Processing lead collection step:", currentLeadState.step)

      const lowerMessage = message.toLowerCase().trim()

      // Handle confirmation step
      if (currentLeadState.step === "conferma") {
        if (
          lowerMessage === "sì" ||
          lowerMessage === "si" ||
          lowerMessage === "yes" ||
          lowerMessage === "ok" ||
          lowerMessage === "confermo"
        ) {
          // Save to contacts table
          const provenienza = [
            currentLeadState.quoteNumber ? `Preventivo: ${currentLeadState.quoteNumber}` : null,
            currentLeadState.pageContext ? `Pagina: ${currentLeadState.pageContext}` : null,
          ]
            .filter(Boolean)
            .map((r) => `\n${r}`)
            .join("")

          const { error: contactError } = await supabase.from("contacts").insert({
            name: currentLeadState.collectedData.nome,
            email: currentLeadState.collectedData.email,
            phone: currentLeadState.collectedData.telefono || null,
            message: `[Ticket da Chat AI - ${currentLeadState.reason}]${provenienza}\n\n${currentLeadState.collectedData.messaggio}`,
            read: false,
          })

          if (contactError) {
            console.error("[v0] Error saving contact:", contactError)
          }

          // Update conversation status
          await supabase.from("chat_conversations").update({ status: "escalated" }).eq("id", currentConversationId)

          // Send email notification to admin
          const emailResult = await sendEmail({
            to: SUPER_ADMIN_EMAIL,
            subject: `🎫 Nuovo Ticket Chat AI - ${currentLeadState.collectedData.nome}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">🎫 Nuovo Ticket dalla Chat AI</h1>
                </div>
                
                <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
                  <p style="color: #6b7280; margin-bottom: 20px;">
                    <strong>Motivo:</strong> ${currentLeadState.reason === "consulenza" ? "Richiesta consulenza/contatto" : "AI non ha saputo rispondere"}
                  </p>
                  
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #374151;">Dati del contatto:</h3>
                    <p><strong>📛 Nome:</strong> ${currentLeadState.collectedData.nome}</p>
                    <p><strong>📧 Email:</strong> ${currentLeadState.collectedData.email}</p>
                    <p><strong>📱 Telefono:</strong> ${currentLeadState.collectedData.telefono || "Non fornito"}</p>
                    ${currentLeadState.quoteNumber ? `<p><strong>🧾 Preventivo:</strong> ${currentLeadState.quoteNumber}</p>` : ""}
                    ${currentLeadState.pageContext ? `<p><strong>📄 Pagina di provenienza:</strong> ${currentLeadState.pageContext}</p>` : ""}
                  </div>
                  
                  <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
                    <h3 style="margin-top: 0; color: #1e40af;">💬 Messaggio:</h3>
                    <p style="color: #1e40af; white-space: pre-wrap;">${currentLeadState.collectedData.messaggio}</p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="https://4bid.it/admin/chat-conversations/${currentConversationId}" 
                       style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                      Visualizza Conversazione
                    </a>
                  </div>
                </div>
              </div>
            `,
          })

          console.log("[v0] Email notification result:", emailResult)

          if (!emailResult.success) {
            console.error("[v0] Failed to send email notification:", emailResult.error)
            // Try to save email failure in database for later retry
            await supabase.from("chat_messages").insert({
              conversation_id: currentConversationId,
              role: "system",
              content: `[ERRORE INVIO EMAIL] ${emailResult.error}`,
            })
          }

          const successMessage = `✅ **Perfetto!** Ho creato un ticket con i tuoi dati.\n\nIl nostro team ti contatterà al più presto all'indirizzo ${currentLeadState.collectedData.email}.\n\nGrazie per averci contattato! 🙏`

          await supabase.from("chat_messages").insert({
            conversation_id: currentConversationId,
            role: "assistant",
            content: successMessage,
          })

          return NextResponse.json({
            response: successMessage,
            conversationId: currentConversationId,
            leadState: { isCollecting: false, reason: null, collectedData: {}, step: null },
          })
        } else if (lowerMessage === "no" || lowerMessage === "annulla" || lowerMessage === "cancella") {
          const cancelMessage = "Ok, ho annullato la richiesta. Come posso aiutarti altrimenti?"

          await supabase.from("chat_messages").insert({
            conversation_id: currentConversationId,
            role: "assistant",
            content: cancelMessage,
          })

          return NextResponse.json({
            response: cancelMessage,
            conversationId: currentConversationId,
            leadState: { isCollecting: false, reason: null, collectedData: {}, step: null },
          })
        }
      }

      let nextStep = currentLeadState.step
      let responseMessage = ""

      switch (currentLeadState.step) {
        case "nome":
          currentLeadState.collectedData.nome = message.trim()
          nextStep = "email"
          console.log("[v0] Collected nome:", currentLeadState.collectedData.nome)
          break

        case "email":
          const email = extractDataFromMessage(message, "email")
          if (!email) {
            responseMessage = "⚠️ Per favore, inserisci un indirizzo email valido (es: mario@esempio.it):"

            await supabase.from("chat_messages").insert({
              conversation_id: currentConversationId,
              role: "assistant",
              content: responseMessage,
            })

            return NextResponse.json({
              response: responseMessage,
              conversationId: currentConversationId,
              leadState: currentLeadState,
            })
          }
          currentLeadState.collectedData.email = email
          nextStep = "telefono"
          console.log("[v0] Collected email:", currentLeadState.collectedData.email)
          break

        case "telefono":
          if (lowerMessage === "salta" || lowerMessage === "skip" || lowerMessage === "no") {
            currentLeadState.collectedData.telefono = undefined
          } else {
            currentLeadState.collectedData.telefono = message.trim()
          }
          nextStep = "messaggio"
          console.log("[v0] Collected telefono:", currentLeadState.collectedData.telefono)
          break

        case "messaggio": {
          const aggiunta = message.trim()
          const rifiuta = ["no", "niente", "nulla", "va bene", "va bene così", "così va bene", "ok"].includes(
            aggiunta.toLowerCase(),
          )

          if (currentLeadState.originalQuestion) {
            // La domanda di partenza fa SEMPRE parte del ticket: se l'utente
            // aggiunge qualcosa la accodiamo, non la sostituiamo.
            currentLeadState.collectedData.messaggio = rifiuta
              ? currentLeadState.originalQuestion
              : `${currentLeadState.originalQuestion}\n\nAggiunta dell'utente: ${aggiunta}`
          } else {
            currentLeadState.collectedData.messaggio = aggiunta
          }

          nextStep = "conferma"
          console.log("[v0] Collected messaggio:", currentLeadState.collectedData.messaggio)
          break
        }
      }

      // Update state with next step
      currentLeadState.step = nextStep as any

      const nextPrompt = getLeadCollectionPrompt(currentLeadState)
      console.log("[v0] Next step:", nextStep, "- Prompt:", nextPrompt.substring(0, 50))

      await supabase.from("chat_messages").insert({
        conversation_id: currentConversationId,
        role: "assistant",
        content: nextPrompt,
      })

      return NextResponse.json({
        response: nextPrompt,
        conversationId: currentConversationId,
        leadState: {
          isCollecting: true,
          reason: currentLeadState.reason,
          collectedData: currentLeadState.collectedData,
          step: currentLeadState.step,
          originalQuestion: currentLeadState.originalQuestion,
          pageContext: currentLeadState.pageContext,
          prefilledFromQuote: currentLeadState.prefilledFromQuote,
          quoteNumber: currentLeadState.quoteNumber,
        },
      })
    }

    console.log("[v0] Not in lead collection, generating AI response")

    // Richiesta esplicita di parlare con una persona: qui la raccolta dati e'
    // la risposta corretta. Usciamo PRIMA di interrogare il modello, perche'
    // in questo ramo la sua risposta verrebbe comunque scartata: prima veniva
    // generata (e pagata) per poi essere buttata via senza mai mostrarla.
    if (wantsHumanContact(message)) {
      // Se la richiesta arriva dal pulsante "Fatemi ricontattare", il messaggio
      // e' solo "contattatemi": la domanda vera e' quella precedente e la manda
      // il client. Senza questo la domanda si perderebbe di nuovo, proprio nel
      // percorso pensato per non perderla.
      const domandaVera =
        typeof originalQuestion === "string" && originalQuestion.trim() ? originalQuestion.trim() : message.trim()

      // Chi guarda un preventivo ci ha gia' dato nome ed email: richiederli
      // significa trattare un cliente come uno sconosciuto.
      const daPreventivo = Boolean(quoteContext?.clientName && quoteContext?.clientEmail)

      const newLeadState: LeadCollectionState = {
        isCollecting: true,
        reason: "consulenza",
        collectedData: daPreventivo
          ? { nome: quoteContext!.clientName!, email: quoteContext!.clientEmail! }
          : {},
        step: daPreventivo ? "telefono" : "nome",
        originalQuestion: domandaVera,
        pageContext: typeof pageContext === "string" ? pageContext : undefined,
        prefilledFromQuote: daPreventivo,
        quoteNumber: quoteContext?.quoteNumber || undefined,
      }

      const leadPrompt = getLeadCollectionPrompt(newLeadState)
      console.log("[v0] Explicit contact request, skipping model call")

      await supabase.from("chat_messages").insert({
        conversation_id: currentConversationId,
        role: "assistant",
        content: leadPrompt,
      })

      return NextResponse.json({
        response: leadPrompt,
        conversationId: currentConversationId,
        leadState: newLeadState,
      })
    }

    // Get conversation history
    const { data: historyMessages } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", currentConversationId)
      .order("created_at", { ascending: false })
      .limit(5)

    const conversationHistory = (historyMessages || [])
      .reverse()
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")

    const { knowledgeBase, sources } = await buildDynamicKnowledgeBase(supabase, message)

    // Il preventivo va DOPO la knowledge base: quest'ultima impone "usa solo le
    // informazioni qui sopra", regola che senza questa aggiunta faceva
    // rispondere "non ho informazioni" proprio sulle domande del preventivo.
    const systemPrompt = quoteContext ? `${knowledgeBase}\n\n${quoteContext.prompt}` : knowledgeBase

    // Generate AI response
    const { text: aiResponse } = await generateText({
      model: "openai/gpt-4o-mini",
      temperature: 0.3,
      // AI SDK 5: l'opzione si chiama maxOutputTokens. Con "maxTokens" il
      // limite veniva silenziosamente ignorato e la risposta non aveva tetto.
      maxOutputTokens: 500,
      system: systemPrompt,
      prompt: `Cronologia conversazione:\n${conversationHistory}\n\nNuova domanda utente: ${message}\n\nRispondi in italiano, in modo conciso e utile. Se usi informazioni specifiche dalla knowledge base, includi le fonti alla fine.`,
    })

    const decision = decideLeadAfterAnswer(message, aiResponse)

    // La risposta si legge SEMPRE. Il contatto e' una proposta in coda: la
    // raccolta dati parte solo se l'utente la chiede (pulsante o messaggio).
    const invito =
      decision?.reason === "non_so_rispondere"
        ? "💬 Su questo punto ti risponde meglio una persona del team: usa il pulsante qui sotto o scrivi **contattatemi**."
        : "💬 Se preferisci parlarne con una persona del team, usa il pulsante qui sotto o scrivi **contattatemi**."

    const finalResponse = decision ? `${aiResponse}\n\n---\n\n${invito}` : aiResponse

    // Save normal AI response
    const { data: assistantMessage } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: currentConversationId,
        role: "assistant",
        content: finalResponse,
      })
      .select()
      .single()

    return NextResponse.json({
      response: finalResponse,
      conversationId: currentConversationId,
      messageId: assistantMessage?.id,
      leadState: currentLeadState,
      offerContact: Boolean(decision),
    })
  } catch (error) {
    console.error("[v0] AI Support error:", error)
    return NextResponse.json(
      {
        error: "Errore del server: " + (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    )
  }
}
