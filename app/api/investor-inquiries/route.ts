import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-smtp"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, company, inquiryType, interestedProjects, investmentAmount, message } = body

    if (!name || !email || !inquiryType || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("investor_inquiries")
      .insert([
        {
          name,
          email,
          phone: phone || null,
          company: company || null,
          inquiry_type: inquiryType,
          interested_projects: interestedProjects || [],
          investment_amount: investmentAmount || null,
          message,
          status: "pending",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    const inquiryTypeLabels: Record<string, string> = {
      investment: "Investimento",
      collaboration: "Collaborazione",
      partnership: "Partnership",
      other: "Altro",
    }

    const projectNames: Record<string, string> = {
      santaddeo: "SANTADDEO - Revenue Management",
      manubot: "MANUBOT - Maintenance Assistant",
      "risparmio-compulsivo": "RISPARMIO COMPULSIVO - Savings App",
      autoexel: "AUTOEXEL - Smart Excel",
    }

    try {
      // Email 1: Conferma all'utente
      await sendEmail({
        to: email,
        subject: "Richiesta Ricevuta - 4BID.IT",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #5B9BD5 0%, #4A8BC2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Richiesta Ricevuta!</h1>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Ciao <strong>${name}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Grazie per il tuo interesse nei nostri progetti! Abbiamo ricevuto la tua richiesta di <strong>${inquiryTypeLabels[inquiryType]}</strong> e ti ricontatteremo entro <strong>24 ore</strong>.
              </p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Riepilogo della tua richiesta:</h3>
                <ul style="color: #4b5563; line-height: 1.8; padding-left: 20px;">
                  <li><strong>Tipo:</strong> ${inquiryTypeLabels[inquiryType]}</li>
                  ${company ? `<li><strong>Azienda:</strong> ${company}</li>` : ""}
                  ${
                    interestedProjects && interestedProjects.length > 0
                      ? `<li><strong>Progetti di interesse:</strong> ${interestedProjects.map((p: string) => projectNames[p] || p).join(", ")}</li>`
                      : ""
                  }
                  ${investmentAmount ? `<li><strong>Importo indicativo:</strong> ${investmentAmount}</li>` : ""}
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://4bid.it" style="background: linear-gradient(135deg, #5B9BD5 0%, #4A8BC2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Visita 4BID.IT
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
        subject: `🚀 Nuova Richiesta ${inquiryTypeLabels[inquiryType]} - ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Nuova Richiesta Ricevuta</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                ${inquiryTypeLabels[inquiryType]}
              </p>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Dettagli Contatto</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><strong>Nome:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <a href="mailto:${email}" style="color: #5B9BD5; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                ${
                  phone
                    ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><strong>Telefono:</strong></td>
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
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><strong>Azienda:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${company}</td>
                </tr>
                `
                    : ""
                }
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><strong>Tipo Richiesta:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                      ${inquiryTypeLabels[inquiryType]}
                    </span>
                  </td>
                </tr>
                ${
                  interestedProjects && interestedProjects.length > 0
                    ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top;"><strong>Progetti:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    ${interestedProjects.map((p: string) => `<div style="margin: 4px 0;">• ${projectNames[p] || p}</div>`).join("")}
                  </td>
                </tr>
                `
                    : ""
                }
                ${
                  investmentAmount
                    ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><strong>Importo:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${investmentAmount}</td>
                </tr>
                `
                    : ""
                }
              </table>
              
              <div style="margin-top: 30px;">
                <h3 style="color: #1f2937; margin-bottom: 10px;">Messaggio:</h3>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; border-left: 4px solid #5B9BD5;">
                  <p style="color: #374151; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://4bid.it/admin" style="background: linear-gradient(135deg, #5B9BD5 0%, #4A8BC2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Visualizza in Dashboard
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                Richiesta ricevuta il ${new Date().toLocaleString("it-IT")}
              </p>
            </div>
          </div>
        `,
      })

      console.log("[v0] Both emails sent successfully via SMTP for investor inquiry")
    } catch (emailError) {
      console.error("[v0] SMTP email error:", emailError)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error processing investor inquiry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
