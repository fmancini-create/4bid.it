import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      structureName,
      structureType,
      contactName,
      email,
      phone,
      city,
      province,
      vehicleCount,
      message,
    } = body

    // Validate required fields
    if (!structureName || !structureType || !contactName || !email || !phone || !city || !province) {
      return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Save to database
    const { data: lead, error } = await supabase
      .from("ecomobility_leads")
      .insert({
        structure_name: structureName,
        structure_type: structureType,
        contact_name: contactName,
        email,
        phone,
        city,
        province,
        vehicle_count: vehicleCount || null,
        message: message || null,
        status: "new",
        source: "website",
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving lead:", error)
      // Continue anyway to send email
    }

    // Send notification email to 4BID
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Email to 4BID team
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: "info@4bid.it",
      subject: `[Ecomobility] Nuova richiesta demo da ${structureName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://4bid.it/ecomobility-logo.png" alt="4BID Ecomobility" style="max-width: 200px;">
            </div>
            
            <h2 style="color: #f97316;">Nuova Richiesta Demo Ecomobility</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Struttura:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${structureName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Tipologia:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${structureType}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Contatto:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${contactName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Telefono:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="tel:${phone}">${phone}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Località:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${city} (${province})</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Veicoli richiesti:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${vehicleCount || "Non specificato"}</td>
              </tr>
              ${message ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Note:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${message}</td>
              </tr>
              ` : ""}
            </table>
            
            <p style="background: #fff7ed; padding: 15px; border-radius: 8px; border-left: 4px solid #f97316;">
              <strong>Azione richiesta:</strong> Contattare entro 24 ore per fissare una demo.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              4BID S.R.L. - Via Brodolini, 27 - 50063 Figline e Incisa Valdarno (FI)<br>
              P.IVA: 07telefonoXXXXXX | info@4bid.it
            </p>
          </div>
        </body>
        </html>
      `,
    })

    // Confirmation email to the lead
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Grazie per il tuo interesse in 4BID Ecomobility!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://4bid.it/ecomobility-logo.png" alt="4BID Ecomobility" style="max-width: 200px;">
            </div>
            
            <h2 style="color: #f97316;">Grazie ${contactName}!</h2>
            
            <p>Abbiamo ricevuto la tua richiesta di demo per <strong>${structureName}</strong>.</p>
            
            <p>Un nostro consulente ti contatterà entro <strong>24 ore lavorative</strong> per:</p>
            
            <ul style="background: #f9fafb; padding: 20px 40px; border-radius: 8px;">
              <li>Mostrarti la piattaforma in azione</li>
              <li>Rispondere alle tue domande</li>
              <li>Proporti il piano più adatto alle tue esigenze</li>
            </ul>
            
            <p>Nel frattempo, puoi scoprire di più su come funziona Ecomobility:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://4bid.it/ecomobility/come-funziona" 
                 style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Scopri Come Funziona
              </a>
            </div>
            
            <p style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
              <strong>Hai urgenza?</strong> Chiamaci direttamente al <a href="tel:+390559103068">055 910 3068</a>
            </p>
            
            <p>A presto,<br><strong>Il Team 4BID Ecomobility</strong></p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              4BID S.R.L. - Via Brodolini, 27 - 50063 Figline e Incisa Valdarno (FI)<br>
              P.IVA: 07telefonoXXXXXX | info@4bid.it
            </p>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ 
      success: true, 
      message: "Richiesta registrata con successo",
      lead_id: lead?.id 
    })

  } catch (error) {
    console.error("Error processing registration:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
