import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("project_submissions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching project submissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      company,
      project_title,
      project_description,
      budget_range,
      timeline,
      interested_in_revenue_share,
    } = body

    if (!name || !email || !project_title || !project_description) {
      return NextResponse.json(
        { error: "Nome, email, titolo progetto e descrizione sono obbligatori" },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("project_submissions")
      .insert([
        {
          name,
          email,
          phone,
          company,
          project_title,
          project_description,
          budget_range,
          timeline,
          interested_in_revenue_share: interested_in_revenue_share || false,
          status: "pending",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error inserting project submission:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    try {
      if (process.env.RESEND_API_KEY) {
        // Email 1: Conferma all'utente
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "4BID.IT <delivered@resend.dev>",
            to: email,
            subject: "✅ Proposta progetto ricevuta - 4BID.IT",
            html: `
              <h2>Grazie per la tua proposta!</h2>
              <p>Ciao <strong>${name}</strong>,</p>
              <p>Abbiamo ricevuto la tua proposta di progetto "<strong>${project_title}</strong>".</p>
              <p>Il nostro team la valuterà e ti risponderà entro <strong>24 ore</strong> con:</p>
              <ul>
                <li>✅ Analisi di fattibilità</li>
                <li>💰 Stima dei costi</li>
                <li>📅 Tempi di realizzazione</li>
                ${interested_in_revenue_share ? "<li>🤝 Proposta revenue share personalizzata</li>" : ""}
              </ul>
              <p><strong>Riepilogo della tua richiesta:</strong></p>
              <ul>
                <li><strong>Progetto:</strong> ${project_title}</li>
                ${budget_range ? `<li><strong>Budget:</strong> ${budget_range}</li>` : ""}
                ${timeline ? `<li><strong>Timeline:</strong> ${timeline}</li>` : ""}
                ${interested_in_revenue_share ? "<li><strong>Revenue Share:</strong> Interessato</li>" : ""}
              </ul>
              <p>A presto,<br/>Il Team 4BID.IT</p>
              <hr>
              <p style="font-size: 12px; color: #666;">
                4BID.IT - Via Benedetto Croce, 50, 52025 Montevarchi (AR)<br/>
                P.IVA: 02033250518
              </p>
            `,
          }),
        })

        // Email 2: Notifica all'admin
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "4BID.IT <delivered@resend.dev>",
            to: "f.mancini@4bid.it",
            subject: `🚀 Nuova Proposta Progetto: ${project_title}`,
            html: `
              <h2>Nuova Proposta di Progetto Ricevuta</h2>
              
              <h3>📋 Dati Cliente</h3>
              <ul>
                <li><strong>Nome:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Telefono:</strong> ${phone || "Non fornito"}</li>
                <li><strong>Azienda:</strong> ${company || "Non fornita"}</li>
              </ul>

              <h3>💡 Dettagli Progetto</h3>
              <ul>
                <li><strong>Titolo:</strong> ${project_title}</li>
                <li><strong>Descrizione:</strong><br/><pre style="white-space: pre-wrap; background: #f5f5f5; padding: 10px; border-radius: 5px;">${project_description}</pre></li>
                <li><strong>Budget:</strong> ${budget_range || "Non specificato"}</li>
                <li><strong>Timeline:</strong> ${timeline || "Non specificata"}</li>
                <li><strong>Interessato a Revenue Share:</strong> ${interested_in_revenue_share ? "✅ SÌ" : "❌ No"}</li>
              </ul>

              <p><a href="https://4bid.it/admin" style="display: inline-block; background: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Vai al Pannello Admin</a></p>

              <hr>
              <p style="font-size: 12px; color: #666;">
                Data invio: ${new Date().toLocaleString("it-IT")}<br/>
                ID Submission: ${data.id}
              </p>
            `,
          }),
        })
      }
    } catch (emailError) {
      console.error("[v0] Email error:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating project submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
