import { NextResponse } from "next/server"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-smtp"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

// Knowledge base for AI
const KNOWLEDGE_BASE = `
Sei un assistente AI per 4BID.IT, azienda italiana specializzata in soluzioni tecnologiche innovative.

INFORMAZIONI AZIENDALI:
- Sede: Via Benedetto Croce, 50, 52025 Montevarchi (AR)
- P.IVA: 02033250518
- Email: info@4bid.it
- Sito web: https://4bid.it

PROGETTI PRINCIPALI:

1. SANTADDEO - Revenue Management per Hotel
   - Sistema avanzato di gestione tariffe alberghiere
   - Ottimizzazione ADR e RevPAR
   - Dynamic pricing automatico
   - Analytics e reporting avanzati

2. MANUBOT - Maintenance Assistant
   - Bot intelligente per gestione manutenzioni
   - Pianificazione interventi automatica
   - Tracciamento storico manutenzioni

3. RISPARMIO COMPULSIVO - Savings App
   - App per gestione risparmi personali
   - Obiettivi finanziari personalizzati
   - Analytics spese e budget

4. AUTOEXEL - Smart Excel
   - Automazione fogli di calcolo Excel
   - Intelligenza artificiale per data analysis

PIANI ACCOUNT:
- FREE: Accesso limitato, progetti demo
- PRO: Accesso completo a 2 progetti, supporto email
- BUSINESS: Tutti i progetti, supporto prioritario, personalizzazioni

SERVIZI:
- Sviluppo software personalizzato
- Consulenza tecnologica
- Revenue management per hotel
- Integrazione sistemi gestionali
- Formazione e supporto tecnico

COME AIUTARE:
1. Rispondi alle domande sui progetti e servizi
2. Fornisci informazioni su piani e prezzi
3. Guida gli utenti verso le soluzioni giuste
4. Per richieste complesse o commerciali, ESCALATION: rispondi "ticket" o "Non sono sicuro"

REGOLE IMPORTANTI:
- Sii cortese e professionale
- Usa un linguaggio chiaro e diretto
- Se non conosci la risposta, ammettilo e suggerisci l'escalation
- Per preventivi, contratti, dati sensibili → ESCALATION
- Fornisci sempre link a https://4bid.it per approfondimenti
`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const body = await request.json()
    const { message, conversationId, userEmail, accountType } = body

    console.log("[v0] AI Support request:", { userEmail, accountType, hasConversationId: !!conversationId })

    if (!message) {
      return NextResponse.json({ error: "Messaggio mancante" }, { status: 400 })
    }

    const effectiveEmail = userEmail || "anonymous@4bid.it"
    const effectiveAccountType = accountType || "pro"

    // Check account type (only pro/business)
    if (effectiveAccountType === "free") {
      return NextResponse.json({ error: "Chat AI disponibile solo per account Pro e Business" }, { status: 403 })
    }

    let currentConversationId = conversationId

    // Create new conversation if first message
    if (!currentConversationId) {
      console.log("[v0] Creating new conversation for:", effectiveEmail)

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
      console.log("[v0] Created conversation:", currentConversationId)
    }

    // Save user message
    console.log("[v0] Saving user message to conversation:", currentConversationId)

    const { error: userMsgError } = await supabase.from("chat_messages").insert({
      conversation_id: currentConversationId,
      role: "user",
      content: message,
    })

    if (userMsgError) {
      console.error("[v0] Error saving user message:", userMsgError)
      return NextResponse.json({ error: "Errore nel salvare il messaggio: " + userMsgError.message }, { status: 500 })
    }

    // Get conversation history (last 5 messages)
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

    // Generate AI response
    console.log("[v0] Generating AI response...")

    const { text: aiResponse } = await generateText({
      model: "openai/gpt-4o-mini",
      temperature: 0.3,
      maxTokens: 500,
      system: KNOWLEDGE_BASE,
      prompt: `Cronologia conversazione:\n${conversationHistory}\n\nNuova domanda utente: ${message}\n\nRispondi in italiano, in modo conciso e utile.`,
    })

    console.log("[v0] AI response generated, length:", aiResponse.length)

    // Check for escalation keywords
    const needsEscalation =
      aiResponse.toLowerCase().includes("non sono sicuro") ||
      aiResponse.toLowerCase().includes("ticket") ||
      message.toLowerCase().includes("preventivo") ||
      message.toLowerCase().includes("contratto")

    if (needsEscalation) {
      // Create escalation system message
      const escalationMsg =
        "🎫 La tua richiesta è stata inoltrata al team. Riceverai una risposta via email entro 24 ore."

      // Save system message
      await supabase.from("chat_messages").insert({
        conversation_id: currentConversationId,
        role: "system",
        content: escalationMsg,
      })

      // Update conversation status to escalated
      await supabase.from("chat_conversations").update({ status: "escalated" }).eq("id", currentConversationId)

      // Send email to admin
      try {
        await sendEmail({
          to: SUPER_ADMIN_EMAIL,
          subject: `🎫 Supporto AI Escalation - ${effectiveEmail}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
              <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">🎫 Ticket Supporto Escalation</h1>
              </div>
              
              <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
                <p><strong>Utente:</strong> ${effectiveEmail}</p>
                <p><strong>Account:</strong> ${effectiveAccountType.toUpperCase()}</p>
                <p><strong>Conversation ID:</strong> ${currentConversationId}</p>
                
                <h3>Ultima domanda utente:</h3>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
                  ${message}
                </div>
                
                <h3>Risposta AI:</h3>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px;">
                  ${aiResponse}
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://4bid.it/admin/chat-conversations/${currentConversationId}" 
                     style="background: linear-gradient(135deg, #5B9BD5 0%, #4A8BC2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Visualizza Conversazione
                  </a>
                </div>
              </div>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("[v0] Error sending escalation email:", emailError)
      }

      return NextResponse.json({
        response: escalationMsg,
        conversationId: currentConversationId,
        role: "system",
      })
    }

    // Save AI response
    const { data: assistantMessage, error: assistantError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: currentConversationId,
        role: "assistant",
        content: aiResponse,
      })
      .select()
      .single()

    if (assistantError) {
      console.error("[v0] Error saving assistant message:", assistantError)
    }

    console.log("[v0] Response complete for conversation:", currentConversationId)

    return NextResponse.json({
      response: aiResponse,
      conversationId: currentConversationId,
      messageId: assistantMessage?.id,
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
