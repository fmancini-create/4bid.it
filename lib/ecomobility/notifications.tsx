import { sendEmail } from "@/lib/email-smtp"

// Notifica documenti approvati
export async function notifyDocumentsApproved(customerId: string, structureId: string, bookingId?: string) {
  // Per ora solo log - implementare con dati reali
  console.log("[v0] Documents approved notification:", { customerId, structureId, bookingId })
  return { success: true }
}

// Notifica documenti rifiutati
export async function notifyDocumentsRejected(
  customerId: string,
  structureId: string,
  reason?: string,
  bookingId?: string,
) {
  console.log("[v0] Documents rejected notification:", { customerId, structureId, reason, bookingId })
  return { success: true }
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
