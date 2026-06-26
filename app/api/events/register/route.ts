import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { sendEmail } from "@/lib/email-smtp"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      event_slug,
      first_name,
      last_name,
      email,
      phone,
      company_name,
      role,
      num_guests,
      brings_device,
      dietary_notes,
      notes,
    } = body

    // Validazione
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Nome, cognome e email sono obbligatori" },
        { status: 400 },
      )
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Formato email non valido" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Upsert: se l'email e' gia' registrata per questo evento, aggiorna
    const { data, error } = await supabase
      .from("event_registrations")
      .upsert(
        {
          event_slug: event_slug || "santaddeo-launch-2026",
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          company_name: company_name?.trim() || null,
          role: role?.trim() || null,
          num_guests: Math.min(Math.max(num_guests || 1, 1), 2),
          brings_device: brings_device || false,
          dietary_notes: dietary_notes?.trim() || null,
          notes: notes?.trim() || null,
          status: "confirmed",
        },
        { onConflict: "email,event_slug" },
      )
      .select()
      .single()

    if (error) {
      console.error("Event registration error:", error)
      return NextResponse.json({ error: "Errore nella registrazione" }, { status: 500 })
    }

    // Invio email di conferma al partecipante
    try {
      await sendEmail({
        to: email.trim().toLowerCase(),
        subject: "Conferma registrazione - Evento Santaddeo | Villa I Barronci",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${SITE_URL}/santaddeo-logo.png" alt="Santaddeo" style="max-width: 160px; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;">
                <h1 style="color: #0d9488; font-size: 24px; margin: 0;">Evento Santaddeo</h1>
                <p style="color: #666; font-size: 14px; margin-top: 4px;">La prima ufficiale</p>
              </div>

              <h2 style="color: #1a1a1a; font-size: 20px;">Ciao ${first_name.trim()},</h2>

              <p>La tua registrazione all'evento di presentazione di <strong>Santaddeo</strong> e' stata confermata.</p>

              <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #0d9488; margin-top: 0; font-size: 16px;">Riepilogo</h3>
                <table style="width: 100%; font-size: 14px;">
                  <tr><td style="padding: 6px 0; color: #666;">Luogo:</td><td style="padding: 6px 0;"><strong>Villa I Barronci</strong></td></tr>
                  <tr><td style="padding: 6px 0; color: #666;">Indirizzo:</td><td style="padding: 6px 0;">Via Sorripa, 10 - San Casciano in Val di Pesa (FI)</td></tr>
                  <tr><td style="padding: 6px 0; color: #666;">Orario:</td><td style="padding: 6px 0;">14:30 - 19:00+</td></tr>
                  <tr><td style="padding: 6px 0; color: #666;">Partecipanti:</td><td style="padding: 6px 0;">${Math.min(Math.max(num_guests || 1, 1), 2)}</td></tr>
                  ${company_name ? `<tr><td style="padding: 6px 0; color: #666;">Struttura:</td><td style="padding: 6px 0;">${company_name.trim()}</td></tr>` : ""}
                </table>
              </div>

              <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>Programma:</strong><br>
                  14:30 - 16:30 Presentazione ufficiale di Santaddeo<br>
                  16:30 - 17:00 Pausa<br>
                  17:00 - 19:00 Sessione pratica (porta PC o tablet!)<br>
                  19:00 Aperitivo informale
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://maps.google.com/?q=Villa+I+Barronci+San+Casciano+in+Val+di+Pesa"
                   style="background: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
                  Apri in Google Maps
                </a>
              </div>

              <p>Ti aspettiamo!</p>
              <p style="color: #666;">- Filippo e il Team 4BID</p>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <div style="text-align: center; margin-bottom: 10px;">
                <img src="${SITE_URL}/logo.png" alt="4BID" style="max-width: 48px; opacity: 0.7;">
              </div>
              <p style="font-size: 11px; color: #999; text-align: center;">
                4BID S.R.L. - Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)<br>
                P.IVA: 02641710489 | info@4bid.it
              </p>
            </div>
          </body>
          </html>
        `,
      })
      console.log("[v0] Confirmation email sent to:", email)
    } catch (emailErr) {
      console.error("[v0] Error sending confirmation email:", emailErr)
      // Non blocchiamo la registrazione se l'email fallisce
    }

    // Invio notifica all'admin
    try {
      await sendEmail({
        to: "info@4bid.it",
        subject: `[Evento Santaddeo] Nuova registrazione: ${first_name.trim()} ${last_name.trim()} - ${company_name?.trim() || "N/A"}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #0d9488;">Nuova registrazione evento Santaddeo</h2>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 160px;">Nome:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${first_name.trim()} ${last_name.trim()}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Telefono:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${phone?.trim() || "Non fornito"}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Struttura:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${company_name?.trim() || "Non fornita"}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Ruolo:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${role?.trim() || "Non fornito"}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Partecipanti:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${Math.min(Math.max(num_guests || 1, 1), 2)}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Porta device:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${brings_device ? "Si" : "No"}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Intolleranze:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${dietary_notes?.trim() || "Nessuna"}</td></tr>
                ${notes?.trim() ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Note:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${notes.trim()}</td></tr>` : ""}
              </table>
              <p style="background: #f0fdfa; padding: 12px; border-radius: 8px; border-left: 4px solid #0d9488; font-size: 13px;">
                <a href="https://4bid.it/admin/events" style="color: #0d9488; font-weight: bold;">Vedi tutte le registrazioni nel pannello admin</a>
              </p>
            </div>
          </body>
          </html>
        `,
      })
      console.log("[v0] Admin notification email sent")
    } catch (emailErr) {
      console.error("[v0] Error sending admin notification:", emailErr)
    }

    return NextResponse.json({ success: true, registration: data })
  } catch (err) {
    console.error("Event registration error:", err)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}

// GET: list registrations (admin only, protected by auth in the admin page)
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("event_slug") || "santaddeo-launch-2026"

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_slug", slug)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ registrations: data })
}
