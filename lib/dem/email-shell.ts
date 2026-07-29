// Guscio condiviso delle DEM Santaddeo: intestazione con logo, banda decorativa
// con la rotta aerea, contatti e pie' di pagina.
//
// PERCHE' ESISTE: le DEM sono piu' di una (primo contatto, clienti,
// collaboratori) e cambiano solo nel TESTO. Tenere il layout in un unico posto
// evita che le versioni divergano: una correzione alla banda o al pie' di
// pagina vale per tutte. Il testo, invece, DEVE essere diverso per ciascun
// pubblico: il motivo per cui si riceve l'email cambia, e scrivere a un cliente
// come si scrive a uno sconosciuto e' il modo piu' rapido per farsi segnalare
// come indesiderati.
//
// Il collegamento usa www.santaddeo.com: senza "www" il sito risponde 301 e ogni
// redirect e' un'occasione in piu' di perdere il clic e di far storcere il naso
// ai filtri antispam.

export type CorpoDem = {
  /** Contenuto del <title>. Non si vede nella posta, ma alcuni client lo usano. */
  titolo: string
  /**
   * Testo di anteprima mostrato nella casella accanto all'oggetto. Se manca,
   * i client pescano la prima riga del codice: qui sarebbe il logo.
   */
  anteprima: string
  /** Le righe <tr> del contenuto, fra la banda aerea e i contatti. */
  righe: string
  /**
   * Perche' il destinatario riceve questa email. Cambia per ogni pubblico ed e'
   * la riga che rende la comunicazione onesta: un cliente non "riceve perche'
   * riteniamo Santaddeo utile", lo usa gia'.
   */
  motivoRicezione: string
}

export function costruisciDem(c: CorpoDem): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${c.titolo}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
  <!-- Testo di anteprima nella casella di posta -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f4f2;">
    ${c.anteprima}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f2;padding:24px 0;">
    <tr>
      <td align="center">
        <!-- La larghezza deve essere ELASTICA: con "width:600px" fisso su un
             telefono da 390px l'email sfora di 210px e il testo esce dallo
             schermo (misurato). "width:100%" con "max-width:600px" tiene i 600px
             sul desktop e si adatta sul telefono. -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e6e3dd;border-radius:8px;overflow:hidden;">
          <!-- Intestazione -->
          <tr>
            <td align="center" style="background-color:#ffffff;padding:32px 32px 24px;border-bottom:3px solid #2bb3a3;">
              <img src="https://www.4bid.it/santaddeo-logo.png" alt="Santaddeo" width="300" style="display:block;width:300px;max-width:78%;height:auto;border:0;margin:0 auto;" />
            </td>
          </tr>
          <!-- Rotta aerea: immagine PURAMENTE DECORATIVA.
               - PNG e non SVG: Gmail e Outlook scartano l'SVG nelle email.
               - alt="" (vuoto): molti client bloccano le immagini per
                 impostazione predefinita, e un testo alternativo qui
                 mostrerebbe una scritta di ripiego senza aggiungere nulla al
                 messaggio. Vuoto = i lettori di schermo la ignorano e, se
                 l'immagine non carica, la riga si richiude senza lasciare
                 buchi ne' icone di errore.
               - Nessun attributo height: se l'immagine e' bloccata la riga
                 collassa invece di riservare spazio vuoto.
               - Il file e' 1013x266 ma mostrato a 600 di larghezza (158 di
                 altezza): resta nitido anche sugli schermi a doppia densita'.
                 Ritagliato a banda larga di proposito: quadrato sarebbe alto
                 600px e spingerebbe il gancio fuori dalla prima schermata. -->
          <tr>
            <td align="center" style="padding:0;line-height:0;font-size:0;">
              <img src="https://www.4bid.it/dem/aereo-rotta.png" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;margin:0;" />
            </td>
          </tr>
${c.righe}
          <!-- Contatti -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #e6e3dd;margin:0 0 16px;" />
              <p style="margin:0;font-size:13px;line-height:1.6;color:#5a5a5a;">
                4 Bid s.r.l.<br />
                <a href="https://www.santaddeo.com" style="color:#1b2a4a;">www.santaddeo.com</a> · <a href="https://www.4bid.it" style="color:#1b2a4a;">www.4bid.it</a> · <a href="mailto:clienti@4bid.it" style="color:#1b2a4a;">clienti@4bid.it</a>
              </p>
            </td>
          </tr>
          <!-- Pie' di pagina -->
          <tr>
            <td style="padding:20px 32px 28px;">
              <p style="margin:0;font-size:11px;color:#9a9a9a;line-height:1.5;">${c.motivoRicezione}<br />Non vuoi più ricevere le nostre comunicazioni? <a href="{{unsubscribe}}" style="color:#9a9a9a;text-decoration:underline;">Annulla iscrizione</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Riquadro con il bordo dorato che spiega la differenza rispetto agli altri
 * sistemi. Identico in tutte le versioni: e' il concetto centrale.
 */
export const RIQUADRO_DIFFERENZA = `          <!-- La differenza -->
          <tr>
            <td style="padding:22px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid #c8a45c;background-color:#faf7f0;border-radius:0 6px 6px 0;">
                <tr>
                  <td style="padding:18px 20px;font-size:15px;line-height:1.65;color:#3a3a3a;">
                    Gli altri sistemi di revenue management guardano <strong>il passato</strong>: il tuo storico e i prezzi dei competitor.<br />
                    <strong style="color:#1b2a4a;">Air Market Intelligence guarda il cielo</strong>, settimane prima che arrivi la prenotazione.
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
