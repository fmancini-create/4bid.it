import { createAdminClient } from "@/lib/supabase/server-admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Nome, email e messaggio sono obbligatori" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Save to database
    const { data, error } = await supabase
      .from("contacts")
      .insert([
        {
          name,
          email,
          phone: phone || null,
          message,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Errore nel salvare il messaggio" }, { status: 500 })
    }

    // Send email notification
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
            subject: `Nuovo contatto da ${name}`,
            html: `
              <h2>Nuovo messaggio di contatto</h2>
              <p><strong>Nome:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Telefono:</strong> ${phone || "Non fornito"}</p>
              <p><strong>Messaggio:</strong></p>
              <p>${message}</p>
            `,
          }),
        })

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.error("Email send failed:", errorText)
        }
      }
    } catch (emailError) {
      console.error("Email error:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Messaggio inviato con successo",
      data,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore nel processare la richiesta" }, { status: 500 })
  }
}
