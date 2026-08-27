import { createAdminClient } from "@/lib/supabase/server-admin"
import { NextResponse } from "next/server"
import { sanitizeHtml, sanitizeInput, isValidEmail, isValidPhone } from "@/lib/security"
import { sendEmail } from "@/lib/email-resend"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, message } = body

    console.log("[v0] Contact form submission:", { name, email, phone: phone ? "provided" : "not provided" })

    if (!name || !email || !message) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Nome, email e messaggio sono obbligatori" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      console.log("[v0] Invalid email format:", email)
      return NextResponse.json({ error: "Formato email non valido" }, { status: 400 })
    }

    if (phone && !isValidPhone(phone)) {
      console.log("[v0] Invalid phone format")
      return NextResponse.json({ error: "Formato telefono non valido" }, { status: 400 })
    }

    const sanitizedName = sanitizeInput(name, 100)
    const sanitizedEmail = sanitizeInput(email, 255)
    const sanitizedPhone = phone ? sanitizeInput(phone, 20) : null
    const sanitizedMessage = sanitizeInput(message, 5000)

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("contacts")
      .insert([
        {
          name: sanitizedName,
          email: sanitizedEmail,
          phone: sanitizedPhone,
          message: sanitizedMessage,
          read: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Database error saving contact:", error)
      return NextResponse.json({ error: "Errore nel salvare il messaggio: " + error.message }, { status: 500 })
    }

    try {
      const result = await sendEmail({
        transactional: true,
        to: "clienti@4bid.it",
        replyTo: sanitizedEmail,
        listUnsubscribe: false,
        subject: `Nuovo contatto da ${sanitizedName}`,
        html: `
          <h2>Nuovo messaggio di contatto</h2>
          <p><strong>Nome:</strong> ${sanitizeHtml(sanitizedName)}</p>
          <p><strong>Email:</strong> ${sanitizeHtml(sanitizedEmail)}</p>
          <p><strong>Telefono:</strong> ${sanitizedPhone ? sanitizeHtml(sanitizedPhone) : "Non fornito"}</p>
          <p><strong>Messaggio:</strong></p>
          <p>${sanitizeHtml(sanitizedMessage)}</p>
        `,
      })

      if (!result.success) {
        console.error("[v0] Contact notification email failed:", result.error)
      }
    } catch (emailError) {
      console.error("[v0] Email error:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: "Messaggio inviato con successo",
      data,
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Errore nel processare la richiesta" }, { status: 500 })
  }
}
