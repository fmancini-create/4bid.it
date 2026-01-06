import { createAdminClient } from "@/lib/supabase/server-admin"
import { NextResponse } from "next/server"
import { sanitizeHtml, sanitizeInput, isValidEmail, isValidPhone } from "@/lib/security"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, message } = body

    console.log("[v0] Contact form submission:", { name, email, phone: phone ? "provided" : "not provided" })

    if (!name || !email || !message) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Nome, email e messaggio sono obbligatori" }, { status: 400 })
    }

    // Validate email format
    if (!isValidEmail(email)) {
      console.log("[v0] Invalid email format:", email)
      return NextResponse.json({ error: "Formato email non valido" }, { status: 400 })
    }

    // Validate phone if provided
    if (phone && !isValidPhone(phone)) {
      console.log("[v0] Invalid phone format:", phone)
      return NextResponse.json({ error: "Formato telefono non valido" }, { status: 400 })
    }

    const sanitizedName = sanitizeInput(name, 100)
    const sanitizedEmail = sanitizeInput(email, 255)
    const sanitizedPhone = phone ? sanitizeInput(phone, 20) : null
    const sanitizedMessage = sanitizeInput(message, 5000)

    const supabase = createAdminClient()

    console.log("[v0] Attempting to save contact to database...")

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
      console.error("[v0] Database error saving contact:", error)
      return NextResponse.json({ error: "Errore nel salvare il messaggio: " + error.message }, { status: 500 })
    }

    console.log("[v0] Contact saved successfully:", data?.id)

    // Send email notification with sanitized HTML
    try {
      if (process.env.RESEND_API_KEY) {
        console.log("[v0] Sending email notification...")
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

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.error("[v0] Email send failed:", errorText)
        } else {
          console.log("[v0] Email notification sent successfully")
        }
      } else {
        console.log("[v0] RESEND_API_KEY not configured, skipping email")
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
