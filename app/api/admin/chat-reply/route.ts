import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-smtp"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    const body = await request.json()
    const { conversationId, userEmail, message } = body

    if (!conversationId || !userEmail || !message) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 })
    }

    // Save admin message to database
    const { error: msgError } = await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role: "admin",
      content: message,
    })

    if (msgError) {
      console.error("[v0] Error saving admin message:", msgError)
      return NextResponse.json({ error: "Errore nel salvare il messaggio" }, { status: 500 })
    }

    // Update conversation status (if escalated, set back to active)
    await supabase
      .from("chat_conversations")
      .update({
        status: "active",
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId)

    // Send email to user
    try {
      await sendEmail({
        to: userEmail,
        subject: "💬 Nuova risposta dal Team 4BID.IT",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">💬 Risposta del Team</h1>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Ciao,
              </p>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Il nostro team ha risposto alla tua richiesta di supporto:
              </p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; border-left: 4px solid #059669; margin: 25px 0;">
                <p style="color: #374151; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 25px;">
                Puoi continuare la conversazione direttamente dalla tua dashboard.
              </p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://4bid.it/dashboard" style="background: linear-gradient(135deg, #5B9BD5 0%, #4A8BC2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Vai alla Dashboard
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 0;">
                4BID.IT - Via Benedetto Croce, 50, 52025 Montevarchi (AR)<br>
                P.IVA: 02033250518<br>
                <a href="https://4bid.it" style="color: #5B9BD5; text-decoration: none;">www.4bid.it</a>
              </p>
            </div>
          </div>
        `,
      })

      console.log("[v0] Admin reply email sent successfully")
    } catch (emailError) {
      console.error("[v0] Error sending admin reply email:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Admin chat reply error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
