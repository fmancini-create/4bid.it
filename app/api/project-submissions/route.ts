import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { sendEmail } from "@/lib/email-smtp"

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

    const supabase = createAdminClient()

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

    console.log("[v0] Project submission inserted successfully:", data.id)

    try {
      // Email 1: Conferma all'utente
      await sendEmail({
        to: email,
        subject: "✅ Proposta progetto ricevuta - 4BID.IT",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #5B9BD5 0%, #4A8BC2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Proposta Ricevuta!</h1>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Ciao <strong>${name}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Abbiamo ricevuto la tua proposta di progetto "<strong>${project_title}</strong>".<br>
                Il nostro team la valuterà e ti risponderà entro <strong>24 ore</strong> con:
              </p>
              
              <ul style="color: #374151; line-height: 1.8; padding-left: 20px; margin: 20px 0;">
                <li>✅ Analisi di fattibilità</li>
                <li>💰 Stima dei costi</li>
                <li>📅 Tempi di realizzazione</li>
                ${interested_in_revenue_share ? "<li>🤝 Proposta revenue share personalizzata</li>" : ""}
              </ul>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Riepilogo della tua richiesta:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;"><strong>Progetto:</strong></td>
                    <td style="padding: 8px 0; color: #374151;">${project_title}</td>
                  </tr>
                  ${
                    budget_range
                      ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;"><strong>Budget:</strong></td>
                    <td style="padding: 8px 0; color: #374151;">${budget_range}</td>
                  </tr>
                  `
                      : ""
                  }
                  ${
                    timeline
                      ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;"><strong>Timeline:</strong></td>
                    <td style="padding: 8px 0; color: #374151;">${timeline}</td>
                  </tr>
                  `
                      : ""
                  }
                  ${
                    interested_in_revenue_share
                      ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;"><strong>Revenue Share:</strong></td>
                    <td style="padding: 8px 0; color: #059669;">✅ Interessato</td>
                  </tr>
                  `
                      : ""
                  }
                </table>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://4bid.it" style="background: linear-gradient(135deg, #5B9BD5 0%, #4A8BC2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Visita il nostro sito
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

      // Email 2: Notifica all'admin
      await sendEmail({
        to: "f.mancini@4bid.it",
        subject: `🚀 Nuova Proposta Progetto: ${project_title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #F4B942 0%, #E5A82E 100%); padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Nuova Proposta Progetto</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">${project_title}</p>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #5B9BD5; padding-bottom: 10px;">
                📋 Dati Cliente
              </h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;"><strong>Nome:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #374151;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;"><strong>Email:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <a href="mailto:${email}" style="color: #5B9BD5; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                ${
                  phone
                    ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;"><strong>Telefono:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <a href="tel:${phone}" style="color: #5B9BD5; text-decoration: none;">${phone}</a>
                  </td>
                </tr>
                `
                    : ""
                }
                ${
                  company
                    ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;"><strong>Azienda:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #374151;">${company}</td>
                </tr>
                `
                    : ""
                }
              </table>

              <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #F4B942; padding-bottom: 10px;">
                💡 Dettagli Progetto
              </h2>
              
              <div style="margin-bottom: 20px;">
                <h3 style="color: #1f2937; margin-bottom: 10px; font-size: 18px;">Titolo:</h3>
                <p style="color: #374151; margin: 0; font-size: 16px; font-weight: 600;">${project_title}</p>
              </div>
              
              <div style="margin-bottom: 20px;">
                <h3 style="color: #1f2937; margin-bottom: 10px; font-size: 18px;">Descrizione:</h3>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; border-left: 4px solid #5B9BD5;">
                  <p style="color: #374151; line-height: 1.6; margin: 0; white-space: pre-wrap;">${project_description}</p>
                </div>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                ${
                  budget_range
                    ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;"><strong>Budget:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #374151;">${budget_range}</td>
                </tr>
                `
                    : ""
                }
                ${
                  timeline
                    ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;"><strong>Timeline:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #374151;">${timeline}</td>
                </tr>
                `
                    : ""
                }
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;"><strong>Revenue Share:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    ${
                      interested_in_revenue_share
                        ? '<span style="background: #d1fae5; color: #059669; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">✅ SÌ - Interessato</span>'
                        : '<span style="background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">❌ No</span>'
                    }
                  </td>
                </tr>
              </table>

              <div style="text-align: center; margin-top: 30px;">
                <a href="https://4bid.it/admin" style="background: linear-gradient(135deg, #5B9BD5 0%, #4A8BC2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Visualizza in Dashboard
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                Data invio: ${new Date().toLocaleString("it-IT")}<br>
                ID Submission: ${data.id}
              </p>
            </div>
          </div>
        `,
      })

      console.log("[v0] Both emails sent successfully via SMTP for project submission:", data.id)
    } catch (emailError) {
      console.error("[v0] SMTP email error:", emailError)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating project submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
