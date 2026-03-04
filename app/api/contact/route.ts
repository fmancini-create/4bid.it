import { createAdminClient } from "@/lib/supabase/server-admin"
import { NextResponse } from "next/server"
import { sanitizeHtml, sanitizeInput, isValidEmail, isValidPhone } from "@/lib/security"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Nome, email e messaggio sono obbligatori" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Formato email non valido" }, { status: 400 })
    }

    if (phone && !isValidPhone(phone)) {
      return NextResponse.json({ error: "Formato telefono non valido" }, { status: 400 })
    }

    const sanitizedName = sanitizeInput(name, 100)
    const sanitizedEmail = sanitizeInput(email, 255)
    const sanitizedPhone = phone ? sanitizeInput(phone, 20) : null
    const sanitizedMessage = sanitizeInput(message, 5000)

    const supabase = createAdminClient()

    // Save to database with sanitized data
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
      return NextResponse.json({ error: "Errore nel salvare il messaggio: " + error.message }, { status: 500 })
    }

    // Send email notification with sanitized HTML
    try {
      if (process.env.RESEND_API_KEY) {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "delivered@resend.dev",
            to: "filippo@hotelbid.org",
            subject: `Nuovo contatto da ${sanitizeHtml(sanitizedName)}`,
            html: `
              <h2>Nuovo messaggio di contatto</h2>
              <p><strong>Nome:</strong> ${sanitizeHtml(sanitizedName)}</p>
              <p><strong>Email:</strong> ${sanitizeHtml(sanitizedEmail)}</p>
              <p><strong>Telefono:</strong> ${sanitizedPhone ? sanitizeHtml(sanitizedPhone) : "Non fornito"}</p>
              <p><strong>Messaggio:</strong></p>
              <p>${sanitizeHtml(sanitizedMessage)}</p>
            `,
          }),
        })

      }
    } catch {
      // Email notification is non-critical
    }

    return NextResponse.json({ success: true, message: "Messaggio inviato con successo", data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore nel processare la richiesta"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
