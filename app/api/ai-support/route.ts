import { NextResponse } from "next/server"
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
}

const CONSULENZA_KEYWORDS = [
  "consulenza",
  "contattare",
  "contattatemi",
  "chiamatemi",
  "richiamatemi",
  "preventivo",
  "informazioni",
  "interessato",
  "vorrei sapere di più",
  "come posso acquistare",
  "quanto costa",
  "prezzo",
  "demo",
  "appuntamento",
  "incontro",
  "parlare con qualcuno",
  "assistenza",
  "supporto umano",
]

function shouldCollectLead(
  message: string,
  aiResponse: string,
): "consulenza" | "contatto" | "non_so_rispondere" | null {
  const lowerMessage = message.toLowerCase()
  const lowerResponse = aiResponse.toLowerCase()

  // Check if user wants consultation/contact
  if (CONSULENZA_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    return "consulenza"
  }

  // Check if AI doesn't know the answer
  if (
    lowerResponse.includes("non sono in grado") ||
    lowerResponse.includes("non posso aiutarti") ||
    lowerResponse.includes("non ho informazioni") ||
    lowerResponse.includes("non sono sicuro") ||
    lowerResponse.includes("ti consiglio di contattare") ||
    lowerResponse.includes("contatta il team")
  ) {
    return "non_so_rispondere"
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
      ? "Ottimo! Sarò felice di aiutarti a metterti in contatto con il nostro team."
      : "Mi dispiace di non poterti aiutare direttamente su questo. Ti metto in contatto con il nostro team che potrà risponderti."

  switch (state.step) {
    case "nome":
      return `${reason}\n\nPer poterti ricontattare, ho bisogno di alcune informazioni.\n\n**Qual è il tuo nome?**`
    case "email":
      return `Perfetto, ${state.collectedData.nome}! 👋\n\n**Qual è la tua email?**`
    case "telefono":
      return `Grazie! **Qual è il tuo numero di telefono?** (opzionale, scrivi "salta" per saltare)`
    case "messaggio":
      return `Ottimo! **Descrivi brevemente la tua richiesta o domanda:**`
    case "conferma":
      const data = state.collectedData
      return `Perfetto! Ecco un riepilogo dei tuoi dati:\n\n📛 **Nome:** ${data.nome}\n📧 **Email:** ${data.email}\n📱 **Telefono:** ${data.telefono || "Non fornito"}\n💬 **Messaggio:** ${data.messaggio}\n\n**Confermi l'invio?** (rispondi "sì" o "no")`
    default:
      return ""
  }
}

// Function to build dynamic knowledge base from database
async function buildDynamicKnowledgeBase(supabase: any): Promise<string> {
  // Fetch active knowledge from database
  const { data: knowledgeItems } = await supabase
    .from("knowledge_base")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .limit(50)

  if (!knowledgeItems || knowledgeItems.length === 0) {
    return `Sei un assistente AI per 4BID.IT, azienda italiana specializzata in soluzioni tecnologiche innovative e Revenue Management per hotel.

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
- Se non sai rispondere a una domanda specifica → raccogli i dati per creare un ticket`
  }

  // Group knowledge by category
  const byCategory = knowledgeItems.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  let knowledgeBase = `Sei un assistente AI per 4BID.IT, azienda italiana specializzata in soluzioni tecnologiche innovative.

INFORMAZIONI DALLA KNOWLEDGE BASE:\n\n`

  for (const [category, items] of Object.entries(byCategory)) {
    knowledgeBase += `\n=== ${category.toUpperCase()} ===\n`
    for (const item of items as any[]) {
      knowledgeBase += `\n${item.title}:\n${item.content}\n`
      if (item.source_url) {
        knowledgeBase += `Link: ${item.source_url}\n`
      }
    }
  }

  knowledgeBase += `\n\nREGOLE IMPORTANTI:
- Rispondi SEMPRE in italiano in modo cortese e professionale
- Usa le informazioni della knowledge base sopra
- Se l'utente chiede consulenza, preventivo, demo, contatto, o vuole essere richiamato → NON rimandare al form, ma rispondi che raccoglierai i dati in chat
- Se non conosci la risposta → rispondi che non hai le informazioni e che creerai un ticket
- NON dire mai "compila il form" o "contatta via email" - raccogli sempre i dati in chat`

  return knowledgeBase
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const body = await request.json()
    const { message, conversationId, userEmail, accountType, leadState } = body

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

    let currentLeadState: LeadCollectionState =
      leadState && leadState.isCollecting
        ? leadState
        : {
            isCollecting: false,
            reason: null,
            collectedData: {},
            step: null,
          }

    console.log("[v0] Current lead state:", currentLeadState)

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
          const { error: contactError } = await supabase.from("contacts").insert({
            name: currentLeadState.collectedData.nome,
            email: currentLeadState.collectedData.email,
            phone: currentLeadState.collectedData.telefono || null,
            message: `[Ticket da Chat AI - ${currentLeadState.reason}]\n\n${currentLeadState.collectedData.messaggio}`,
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
                  </div>
                  
                  <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
                    <h3 style="margin-top: 0; color: #1e40af;">💬 Messaggio:</h3>
                    <p style="color: #1e40af;">${currentLeadState.collectedData.messaggio}</p>
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

      if (currentLeadState.step === "nome") {
        currentLeadState.collectedData.nome = message.trim()
        nextStep = "email"
        console.log("[v0] Collected nome:", currentLeadState.collectedData.nome)
      } else if (currentLeadState.step === "email") {
        const email = extractDataFromMessage(message, "email")
        if (!email) {
          const retryMessage = "Per favore, inserisci un indirizzo email valido (es: mario@esempio.it):"

          await supabase.from("chat_messages").insert({
            conversation_id: currentConversationId,
            role: "assistant",
            content: retryMessage,
          })

          return NextResponse.json({
            response: retryMessage,
            conversationId: currentConversationId,
            leadState: currentLeadState,
          })
        }
        currentLeadState.collectedData.email = email
        nextStep = "telefono"
        console.log("[v0] Collected email:", currentLeadState.collectedData.email)
      } else if (currentLeadState.step === "telefono") {
        if (lowerMessage === "salta" || lowerMessage === "skip" || lowerMessage === "no") {
          currentLeadState.collectedData.telefono = undefined
        } else {
          currentLeadState.collectedData.telefono = message.trim()
        }
        nextStep = "messaggio"
        console.log("[v0] Collected telefono:", currentLeadState.collectedData.telefono)
      } else if (currentLeadState.step === "messaggio") {
        currentLeadState.collectedData.messaggio = message.trim()
        nextStep = "conferma"
        console.log("[v0] Collected messaggio:", currentLeadState.collectedData.messaggio)
      }

      currentLeadState.step = nextStep as any

      const nextPrompt = getLeadCollectionPrompt(currentLeadState)
      console.log("[v0] Next prompt for step", nextStep, ":", nextPrompt.substring(0, 50))

      await supabase.from("chat_messages").insert({
        conversation_id: currentConversationId,
        role: "assistant",
        content: nextPrompt,
      })

      return NextResponse.json({
        response: nextPrompt,
        conversationId: currentConversationId,
        leadState: currentLeadState,
      })
    }

    console.log("[v0] Not in lead collection, generating AI response")

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

    const knowledgeBase = await buildDynamicKnowledgeBase(supabase)

    // Generate AI response
    const { text: aiResponse } = await generateText({
      model: "openai/gpt-4o-mini",
      temperature: 0.3,
      maxTokens: 500,
      system: knowledgeBase,
      prompt: `Cronologia conversazione:\n${conversationHistory}\n\nNuova domanda utente: ${message}\n\nRispondi in italiano, in modo conciso e utile.`,
    })

    const leadTrigger = shouldCollectLead(message, aiResponse)

    if (leadTrigger) {
      // Start lead collection flow
      currentLeadState = {
        isCollecting: true,
        reason: leadTrigger,
        collectedData: {},
        step: "nome",
      }

      const leadPrompt = getLeadCollectionPrompt(currentLeadState)

      await supabase.from("chat_messages").insert({
        conversation_id: currentConversationId,
        role: "assistant",
        content: leadPrompt,
      })

      return NextResponse.json({
        response: leadPrompt,
        conversationId: currentConversationId,
        leadState: currentLeadState,
      })
    }

    // Save normal AI response
    const { data: assistantMessage } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: currentConversationId,
        role: "assistant",
        content: aiResponse,
      })
      .select()
      .single()

    return NextResponse.json({
      response: aiResponse,
      conversationId: currentConversationId,
      messageId: assistantMessage?.id,
      leadState: currentLeadState,
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
