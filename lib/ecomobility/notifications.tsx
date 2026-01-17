import { sendEmail } from "@/lib/email-smtp"

const LOGO_URL = "https://www.4bid.it/_next/image?url=%2Flogo.png&w=128&q=75"

interface BookingEmailData {
  customerName: string
  customerEmail: string
  bookingCode: string
  vehicleName: string
  pickupDate: string
  pickupTime: string
  structureName: string
  structureAddress?: string
  depositAmount: number
  publicUrl: string
}

interface ReturnEmailData {
  customerName: string
  customerEmail: string
  bookingCode: string
  vehicleName: string
  totalHours: number
  totalAmount: number
  depositAmount: number
  refundAmount: number
  structureName: string
}

interface AdminNotificationData {
  adminEmail: string
  bookingCode: string
  customerName: string
  customerEmail: string
  vehicleName: string
  pickupDate: string
  structureName: string
  documentsStatus: string
}

// Template base per email
const getBaseTemplate = (content: string, structureName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px; text-align: center; border-bottom: 3px solid #f97316;">
              <img src="${LOGO_URL}" alt="4BID Ecomobility" style="height: 60px; margin-bottom: 10px;">
              <h2 style="margin: 0; color: #333; font-size: 18px;">Ecomobility</h2>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${structureName}</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f8f8; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #888; font-size: 12px; text-align: center;">
                4BID Ecomobility - Mobilità sostenibile per il turismo<br>
                <a href="https://www.4bid.it" style="color: #f97316; text-decoration: none;">www.4bid.it</a>
              </p>
              <p style="margin: 10px 0 0 0; color: #aaa; font-size: 11px; text-align: center;">
                4BID S.r.l. - Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)<br>
                P.IVA: 06241710489
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

// Email conferma prenotazione al cliente
export async function sendBookingConfirmation(data: BookingEmailData): Promise<boolean> {
  const content = `
    <h1 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">Prenotazione Confermata!</h1>
    
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      Ciao <strong>${data.customerName}</strong>,<br>
      la tua prenotazione è stata confermata. Ecco i dettagli:
    </p>
    
    <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table width="100%" cellpadding="8" cellspacing="0">
        <tr>
          <td style="color: #888; font-size: 14px;">Codice prenotazione:</td>
          <td style="color: #333; font-size: 14px; font-weight: bold;">${data.bookingCode}</td>
        </tr>
        <tr>
          <td style="color: #888; font-size: 14px;">Veicolo:</td>
          <td style="color: #333; font-size: 14px;">${data.vehicleName}</td>
        </tr>
        <tr>
          <td style="color: #888; font-size: 14px;">Data ritiro:</td>
          <td style="color: #333; font-size: 14px;">${data.pickupDate}</td>
        </tr>
        <tr>
          <td style="color: #888; font-size: 14px;">Ora ritiro:</td>
          <td style="color: #333; font-size: 14px;">${data.pickupTime}</td>
        </tr>
        <tr>
          <td style="color: #888; font-size: 14px;">Struttura:</td>
          <td style="color: #333; font-size: 14px;">${data.structureName}</td>
        </tr>
        ${
          data.structureAddress
            ? `
        <tr>
          <td style="color: #888; font-size: 14px;">Indirizzo:</td>
          <td style="color: #333; font-size: 14px;">${data.structureAddress}</td>
        </tr>
        `
            : ""
        }
        <tr>
          <td style="color: #888; font-size: 14px;">Cauzione:</td>
          <td style="color: #333; font-size: 14px; font-weight: bold;">€${data.depositAmount.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #fff7ed; border: 1px solid #f97316; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #c2410c; font-size: 14px;">
        <strong>Ricorda:</strong> Più a lungo utilizzi il veicolo, meno paghi all'ora!<br>
        Porta con te un documento d'identità valido al momento del ritiro.
      </p>
    </div>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      Al momento della riconsegna, ti verrà richiesto di fotografare il veicolo.<br>
      La cauzione ti sarà restituita (al netto del noleggio) dopo la verifica.
    </p>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      A presto!<br>
      <strong>Il team 4BID Ecomobility</strong>
    </p>
  `

  const result = await sendEmail({
    to: data.customerEmail,
    subject: `Prenotazione confermata - ${data.bookingCode}`,
    html: getBaseTemplate(content, data.structureName),
  })

  return result.success
}

// Email conferma riconsegna al cliente
export async function sendReturnConfirmation(data: ReturnEmailData): Promise<boolean> {
  const content = `
    <h1 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">Grazie per aver noleggiato con noi!</h1>
    
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      Ciao <strong>${data.customerName}</strong>,<br>
      la riconsegna del veicolo è stata completata. Ecco il riepilogo:
    </p>
    
    <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table width="100%" cellpadding="8" cellspacing="0">
        <tr>
          <td style="color: #888; font-size: 14px;">Codice prenotazione:</td>
          <td style="color: #333; font-size: 14px; font-weight: bold;">${data.bookingCode}</td>
        </tr>
        <tr>
          <td style="color: #888; font-size: 14px;">Veicolo:</td>
          <td style="color: #333; font-size: 14px;">${data.vehicleName}</td>
        </tr>
        <tr>
          <td style="color: #888; font-size: 14px;">Durata noleggio:</td>
          <td style="color: #333; font-size: 14px;">${data.totalHours} ore</td>
        </tr>
        <tr style="border-top: 1px solid #ddd;">
          <td style="color: #888; font-size: 14px; padding-top: 15px;">Importo noleggio:</td>
          <td style="color: #333; font-size: 14px; padding-top: 15px;">€${data.totalAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="color: #888; font-size: 14px;">Cauzione versata:</td>
          <td style="color: #333; font-size: 14px;">€${data.depositAmount.toFixed(2)}</td>
        </tr>
        <tr style="background-color: #ecfdf5;">
          <td style="color: #059669; font-size: 16px; font-weight: bold; padding: 15px 8px;">Rimborso:</td>
          <td style="color: #059669; font-size: 16px; font-weight: bold; padding: 15px 8px;">€${data.refundAmount.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      Il rimborso della cauzione (al netto del costo del noleggio) verrà accreditato entro 5-7 giorni lavorativi sullo stesso metodo di pagamento utilizzato.
    </p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #166534; font-size: 14px;">
        🌱 Grazie per aver scelto la mobilità sostenibile!<br>
        Hai contribuito a ridurre le emissioni di CO2.
      </p>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Speriamo di rivederti presto!<br>
      <strong>Il team 4BID Ecomobility</strong>
    </p>
  `

  const result = await sendEmail({
    to: data.customerEmail,
    subject: `Riconsegna completata - ${data.bookingCode}`,
    html: getBaseTemplate(content, data.structureName),
  })

  return result.success
}

// Email notifica admin nuova prenotazione
export async function sendAdminNewBookingNotification(data: AdminNotificationData): Promise<boolean> {
  const content = `
    <h1 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">Nuova Prenotazione</h1>
    
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      È stata ricevuta una nuova prenotazione:
    </p>
    
    <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table width="100%" cellpadding="8" cellspacing="0">
        <tr>
          <td style="color: #888; font-size: 14px;">Codice:</td>
          <td style="color: #333; font-size: 14px; font-weight: bold;">${data.bookingCode}</td>
        </tr>
        <tr>
          <td style="color: #888; font-size: 14px;">Cliente:</td>
          <td style="color: #333; font-size: 14px;">${data.customerName}</td>
        </tr>
        <tr>
          <td style="color: #888; font-size: 14px;">Email:</td>
          <td style="color: #333; font-size: 14px;">${data.customerEmail}</td>
        </tr>
        <tr>
          <td style="color: #888; font-size: 14px;">Veicolo:</td>
          <td style="color: #333; font-size: 14px;">${data.vehicleName}</td>
        </tr>
        <tr>
          <td style="color: #888; font-size: 14px;">Data ritiro:</td>
          <td style="color: #333; font-size: 14px;">${data.pickupDate}</td>
        </tr>
        <tr>
          <td style="color: #888; font-size: 14px;">Documenti:</td>
          <td style="color: ${data.documentsStatus === "verified" ? "#22c55e" : "#f97316"}; font-size: 14px; font-weight: bold;">
            ${data.documentsStatus === "verified" ? "Verificati" : data.documentsStatus === "pending" ? "Da verificare" : "Non caricati"}
          </td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.4bid.it/admin/ecomobility" 
         style="display: inline-block; background-color: #f97316; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
        Vai alla Dashboard
      </a>
    </div>
  `

  const result = await sendEmail({
    to: data.adminEmail,
    subject: `[Ecomobility] Nuova prenotazione - ${data.bookingCode}`,
    html: getBaseTemplate(content, data.structureName),
  })

  return result.success
}

// Email documenti da verificare
export async function sendDocumentsPendingNotification(
  adminEmail: string,
  bookingCode: string,
  customerName: string,
  structureName: string,
): Promise<boolean> {
  const content = `
    <h1 style="margin: 0 0 20px 0; color: #f97316; font-size: 24px;">Documenti da Verificare</h1>
    
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      Il cliente <strong>${customerName}</strong> ha caricato i documenti per la prenotazione <strong>${bookingCode}</strong>.
    </p>
    
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      È necessaria la verifica prima del ritiro del veicolo.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.4bid.it/admin/ecomobility/documents" 
         style="display: inline-block; background-color: #f97316; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
        Verifica Documenti
      </a>
    </div>
  `

  const result = await sendEmail({
    to: adminEmail,
    subject: `[Ecomobility] Documenti da verificare - ${bookingCode}`,
    html: getBaseTemplate(content, structureName),
  })

  return result.success
}

// Email documenti verificati al cliente
export async function sendDocumentsVerifiedNotification(
  customerEmail: string,
  customerName: string,
  bookingCode: string,
  structureName: string,
): Promise<boolean> {
  const content = `
    <h1 style="margin: 0 0 20px 0; color: #22c55e; font-size: 24px;">Documenti Verificati</h1>
    
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      Ciao <strong>${customerName}</strong>,<br>
      i tuoi documenti per la prenotazione <strong>${bookingCode}</strong> sono stati verificati e approvati.
    </p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #166534; font-size: 16px; font-weight: bold;">
        Sei pronto per ritirare il veicolo!
      </p>
    </div>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      Presentati alla reception con il tuo codice prenotazione all'orario concordato.
    </p>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      A presto!<br>
      <strong>Il team 4BID Ecomobility</strong>
    </p>
  `

  const result = await sendEmail({
    to: customerEmail,
    subject: `Documenti verificati - ${bookingCode}`,
    html: getBaseTemplate(content, structureName),
  })

  return result.success
}

// Email documenti rifiutati al cliente
export async function sendDocumentsRejectedNotification(
  customerEmail: string,
  customerName: string,
  bookingCode: string,
  structureName: string,
  reason: string,
): Promise<boolean> {
  const content = `
    <h1 style="margin: 0 0 20px 0; color: #ef4444; font-size: 24px;">Documenti Non Validi</h1>
    
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      Ciao <strong>${customerName}</strong>,<br>
      purtroppo i documenti caricati per la prenotazione <strong>${bookingCode}</strong> non sono stati approvati.
    </p>
    
    <div style="background-color: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #991b1b; font-size: 14px;">
        <strong>Motivo:</strong> ${reason}
      </p>
    </div>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      Ti chiediamo di caricare nuovamente i documenti corretti per procedere con il noleggio.<br>
      In alternativa, potrai presentare i documenti direttamente alla reception.
    </p>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Per qualsiasi domanda, contatta la struttura.<br>
      <strong>Il team 4BID Ecomobility</strong>
    </p>
  `

  const result = await sendEmail({
    to: customerEmail,
    subject: `Documenti non validi - ${bookingCode}`,
    html: getBaseTemplate(content, structureName),
  })

  return result.success
}
