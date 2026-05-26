import { sendEmail } from "@/lib/email-smtp"
import { createAdminClient } from "@/lib/supabase/server-admin"

const LOGO_URL = "https://www.4bid.it/_next/image?url=%2Flogo.png&w=128&q=75"

const wrap = (title: string, body: string) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;padding:40px;">
    <div style="text-align:center;margin-bottom:30px;"><img src="${LOGO_URL}" alt="4BID" style="height:60px;"></div>
    <h1 style="color:#1f2937;font-size:24px;margin-bottom:20px;">${title}</h1>
    ${body}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;">
    <p style="color:#9ca3af;font-size:12px;text-align:center;">
      4BID S.r.l. - Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)<br>P.IVA: 06241710489
    </p>
  </div>
</body></html>`

// Notifica documenti approvati
export async function notifyDocumentsApproved(customerId: string, structureId: string, _bookingId?: string) {
  const supabase = createAdminClient()
  const [{ data: customer }, { data: structure }] = await Promise.all([
    supabase.from("ecomobility_customers").select("email,first_name").eq("id", customerId).single(),
    supabase.from("ecomobility_structures").select("name").eq("id", structureId).single(),
  ])
  if (!customer?.email) return { success: false, error: "no_email" }

  const body = `
    <p style="color:#4b5563;font-size:16px;line-height:1.6;">
      Ciao ${customer.first_name || ""},<br><br>
      I documenti per il noleggio presso <strong>${structure?.name || ""}</strong> sono stati
      <strong style="color:#16a34a;">verificati e approvati</strong>.
      Puoi presentarti alla reception per il ritiro del veicolo.
    </p>`
  return sendEmail({
    to: customer.email,
    subject: "Documenti approvati - Noleggio Ecomobility",
    html: wrap("Documenti approvati", body),
  })
}

// Notifica documenti rifiutati
export async function notifyDocumentsRejected(
  customerId: string,
  structureId: string,
  reason?: string,
  _bookingId?: string,
) {
  const supabase = createAdminClient()
  const [{ data: customer }, { data: structure }] = await Promise.all([
    supabase.from("ecomobility_customers").select("email,first_name").eq("id", customerId).single(),
    supabase.from("ecomobility_structures").select("name").eq("id", structureId).single(),
  ])
  if (!customer?.email) return { success: false, error: "no_email" }

  const body = `
    <p style="color:#4b5563;font-size:16px;line-height:1.6;">
      Ciao ${customer.first_name || ""},<br><br>
      I documenti per il noleggio presso <strong>${structure?.name || ""}</strong> non sono stati approvati.
    </p>
    ${reason ? `<div style="background-color:#fef2f2;border-left:4px solid #dc2626;padding:12px;margin:16px 0;"><p style="margin:0;color:#991b1b;"><strong>Motivo:</strong> ${reason}</p></div>` : ""}
    <p style="color:#4b5563;font-size:14px;line-height:1.6;">Per maggiori informazioni contatta la struttura.</p>`
  return sendEmail({
    to: customer.email,
    subject: "Documenti non approvati - Noleggio Ecomobility",
    html: wrap("Documenti non approvati", body),
  })
}

// Notifica nuova prenotazione alla struttura (reception)
export async function notifyStructureNewBooking(structureId: string, bookingId: string) {
  const supabase = createAdminClient()
  const { data: structure } = await supabase
    .from("ecomobility_structures")
    .select("name, email, slug, notification_emails")
    .eq("id", structureId)
    .single()
  if (!structure?.email && !structure?.notification_emails?.length) {
    return { success: false, error: "no_recipients" }
  }

  const { data: booking } = await supabase
    .from("ecomobility_bookings")
    .select(
      "booking_code, pickup_datetime, return_datetime, total_amount, estimated_amount, customer:ecomobility_customers(first_name,last_name,email,phone), vehicle:ecomobility_vehicles(brand,model,internal_code)",
    )
    .eq("id", bookingId)
    .single()
  if (!booking) return { success: false, error: "no_booking" }

  const c: any = booking.customer
  const v: any = booking.vehicle
  const pickupFmt = booking.pickup_datetime
    ? new Date(booking.pickup_datetime).toLocaleString("it-IT", { dateStyle: "long", timeStyle: "short" })
    : "n/d"

  const body = `
    <p style="color:#4b5563;font-size:16px;line-height:1.6;">
      Nuova prenotazione confermata e pagata su <strong>${structure.name}</strong>.
    </p>
    <div style="background-color:#f9fafb;border-radius:8px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px 0;"><strong>Codice:</strong> ${booking.booking_code}</p>
      <p style="margin:0 0 8px 0;"><strong>Cliente:</strong> ${c?.first_name || ""} ${c?.last_name || ""}</p>
      <p style="margin:0 0 8px 0;"><strong>Email:</strong> ${c?.email || "-"}</p>
      <p style="margin:0 0 8px 0;"><strong>Telefono:</strong> ${c?.phone || "-"}</p>
      <p style="margin:0 0 8px 0;"><strong>Veicolo:</strong> ${[v?.brand, v?.model, v?.internal_code ? `(${v.internal_code})` : ""].filter(Boolean).join(" ")}</p>
      <p style="margin:0 0 8px 0;"><strong>Ritiro:</strong> ${pickupFmt}</p>
      <p style="margin:0;"><strong>Importo:</strong> &euro;${Number(booking.total_amount || booking.estimated_amount || 0).toFixed(2)}</p>
    </div>
    <p style="color:#4b5563;font-size:14px;line-height:1.6;">
      Apri la dashboard per gestire la prenotazione:
      <a href="https://www.4bid.it/ecomobility/${structure.slug}/admin" style="color:#f97316;">accedi alla dashboard</a>
    </p>`

  const recipients: string[] = []
  if (structure.email) recipients.push(structure.email)
  if (Array.isArray(structure.notification_emails)) {
    for (const e of structure.notification_emails) if (e && !recipients.includes(e)) recipients.push(e)
  }

  const results = await Promise.all(
    recipients.map((to) =>
      sendEmail({
        to,
        subject: `Nuova prenotazione ${booking.booking_code} - ${structure.name}`,
        html: wrap("Nuova prenotazione", body),
      }),
    ),
  )
  return { success: results.every((r) => r.success), results }
}

// Reminder ritiro 24h prima
export async function sendPickupReminder(
  customerEmail: string,
  customerName: string,
  bookingCode: string,
  vehicleName: string,
  pickupDate: string,
  structureName: string,
  structureSlug: string,
) {
  const body = `
    <p style="color:#4b5563;font-size:16px;line-height:1.6;">
      Ciao ${customerName},<br><br>
      ti ricordiamo che domani hai un noleggio prenotato presso <strong>${structureName}</strong>.
    </p>
    <div style="background-color:#f9fafb;border-radius:8px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 10px 0;"><strong>Codice:</strong> ${bookingCode}</p>
      <p style="margin:0 0 10px 0;"><strong>Veicolo:</strong> ${vehicleName}</p>
      <p style="margin:0;"><strong>Ritiro:</strong> ${pickupDate}</p>
    </div>
    <p style="color:#4b5563;font-size:14px;line-height:1.6;">
      Ricordati di portare un documento di identita&apos; valido e (se richiesta) la patente di guida.
    </p>
    <p style="color:#4b5563;font-size:14px;line-height:1.6;">
      <a href="https://www.4bid.it/ecomobility/${structureSlug}/verify/${bookingCode}" style="color:#f97316;">
        Apri il tuo voucher
      </a>
    </p>`
  return sendEmail({
    to: customerEmail,
    subject: `Promemoria ritiro - ${bookingCode}`,
    html: wrap("Promemoria ritiro", body),
  })
}

// Invito o reset password operatore struttura
export async function sendOperatorPasswordEmail(opts: {
  to: string
  operatorName: string
  structureName: string
  structureSlug: string
  token: string
  type: "invite" | "reset"
}) {
  const { to, operatorName, structureName, structureSlug, token, type } = opts
  const link = `https://www.4bid.it/ecomobility/${structureSlug}/admin/reset-password?token=${token}`
  const title = type === "invite" ? "Benvenuto su 4BID Ecomobility" : "Reset password"
  const intro =
    type === "invite"
      ? `Sei stato aggiunto come operatore su <strong>${structureName}</strong>. Imposta la tua password per accedere alla dashboard.`
      : `Hai richiesto il reset della password per la dashboard di <strong>${structureName}</strong>.`

  const body = `
    <p style="color:#4b5563;font-size:16px;line-height:1.6;">
      Ciao ${operatorName},<br><br>${intro}
    </p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${link}" style="background-color:#f97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
        ${type === "invite" ? "Imposta password" : "Reimposta password"}
      </a>
    </div>
    <p style="color:#9ca3af;font-size:12px;line-height:1.6;">
      Il link scadr&agrave; tra 24 ore. Se non hai richiesto questa azione, puoi ignorare l&apos;email.
    </p>`
  return sendEmail({ to, subject: `${title} - ${structureName}`, html: wrap(title, body) })
}

// Notifica conferma prenotazione
export async function sendBookingConfirmation(
  customerEmail: string,
  customerName: string,
  bookingCode: string,
  vehicleName: string,
  pickupDate: string,
  structureName: string,
) {
  const logoUrl = "https://www.4bid.it/_next/image?url=%2Flogo.png&w=128&q=75"

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${logoUrl}" alt="4BID" style="height: 60px;">
        </div>
        
        <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Prenotazione Confermata</h1>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Ciao ${customerName},<br><br>
          La tua prenotazione presso <strong>${structureName}</strong> è stata confermata.
        </p>
        
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Codice Prenotazione:</strong> ${bookingCode}</p>
          <p style="margin: 0 0 10px 0;"><strong>Veicolo:</strong> ${vehicleName}</p>
          <p style="margin: 0;"><strong>Data Ritiro:</strong> ${pickupDate}</p>
        </div>
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          Presenta questo codice al momento del ritiro del veicolo.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          4BID S.r.l. - Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)<br>
          P.IVA: 06241710489
        </p>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: customerEmail,
    subject: `Prenotazione Confermata - ${bookingCode}`,
    html,
  })
}

// Notifica riconsegna completata
export async function sendReturnConfirmation(
  customerEmail: string,
  customerName: string,
  bookingCode: string,
  vehicleName: string,
  totalAmount: number,
  structureName: string,
) {
  const logoUrl = "https://www.4bid.it/_next/image?url=%2Flogo.png&w=128&q=75"

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${logoUrl}" alt="4BID" style="height: 60px;">
        </div>
        
        <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Riconsegna Completata</h1>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Ciao ${customerName},<br><br>
          Grazie per aver utilizzato il servizio di mobilità elettrica di <strong>${structureName}</strong>.
        </p>
        
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Codice Prenotazione:</strong> ${bookingCode}</p>
          <p style="margin: 0 0 10px 0;"><strong>Veicolo:</strong> ${vehicleName}</p>
          <p style="margin: 0; font-size: 18px; color: #f97316;"><strong>Totale: €${totalAmount.toFixed(2)}</strong></p>
        </div>
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          Speriamo che tu abbia avuto un'esperienza piacevole. A presto!
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          4BID S.r.l. - Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)<br>
          P.IVA: 06241710489
        </p>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: customerEmail,
    subject: `Riconsegna Completata - ${bookingCode}`,
    html,
  })
}
