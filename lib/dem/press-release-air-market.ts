// Comunicato stampa: Air Market Intelligence.
//
// PERCHE' IL TESTO STA QUI E NON DENTRO L'HTML: il comunicato esce in due
// formati, l'email leggibile e il PDF allegato. Se il testo fosse scritto due
// volte, alla prima correzione le due versioni divergerebbero e una testata
// citerebbe una frase che nell'altro formato non esiste. Il contenuto e' dato
// strutturato, i due formati sono solo rappresentazioni.
//
// NOTA SUGLI ACCENTI: nei testi destinati ai giornalisti si usano i caratteri
// accentati veri (e', a', u' scritti come è, à, ù). Nei commenti si resta in
// ASCII, come nel resto del progetto. Un comunicato che arriva ad ANSA con
// "capacita'" al posto di "capacità" viene letto come materiale sciatto prima
// ancora del contenuto.
//
// ---------------------------------------------------------------------------
// COSA NON SI PUO' SCRIVERE, E PERCHE'
// ---------------------------------------------------------------------------
// La richiesta iniziale era di annunciare "funzionalita' inesistenti sul
// mercato". La verifica dice che e' FALSO, e va lasciato scritto qui perche'
// nessuno lo riscriva per distrazione:
//
//   - Amadeus (Demand360 / Navigator360) identifica i mercati di provenienza e
//     monitora capacita' posti e rotte, con previsione a 12 mesi.
//   - Lighthouse (ex OTA Insight) usa segnali di ricerca voli per anticipare la
//     domanda ED E' VENDUTO ANCHE AGLI INDIPENDENTI da circa 99 EUR/mese: cade
//     anche il ripiego "esiste solo per le catene con budget enterprise".
//   - ForwardKeys (gruppo Amadeus) vende dati di prenotazione aerea, ma non e'
//     un RMS: i dati si innestano in strumenti terzi.
//
// In rubrica ci sono ANSA, Adnkronos e Forbes Italia: una rivendicazione
// smentibile con una ricerca non fa solo cestinare il pezzo, brucia la
// credibilita' presso le 8 testate che ci hanno gia' pubblicato.
//
// Cosa resta vero, ed e' il perno del comunicato: nessuno usa la capacita'
// aerea per dire SU QUALI MERCATI INVESTIRE. Gli altri la usano per correggere
// il prezzo. Questo e' un uso diverso dello stesso dato, ed e' difendibile.
//
// Non si dichiara NESSUN dato di diffusione (hotel attivi, aeroporti coperti,
// voli in archivio): il modulo e' giovane e un numero basso in un comunicato
// diventa il titolo dell'articolo.

/**
 * Nome confermato dall'utente il 29/07/2026, coerente con l'unico riferimento
 * presente nel progetto (l'indirizzo f.mancini@4bid.it). Prima era un
 * segnaposto: in un testo diretto a 54 redazioni un nome di persona non si
 * deduce, si fa confermare.
 */
export const NOME_FONDATORE = "Filippo Mancini"

export const DATA_COMUNICATO = "29 luglio 2026"

export const COMUNICATO = {
  etichetta: "COMUNICATO STAMPA",
  luogoData: `San Casciano in Val di Pesa (FI), ${DATA_COMUNICATO}`,

  titolo:
    "Santaddeo porta i voli in arrivo dentro il revenue management: l'albergatore sa da quali paesi arriverà la domanda",

  sottotitolo:
    "Con Air Market Intelligence il sistema legge la capacità aerea sugli aeroporti scelti dalla struttura e la traduce in mercati da sviluppare. Non per correggere il prezzo: per decidere dove investire in promozione.",

  /** Paragrafi del corpo. Il primo e' l'attacco e contiene il fatto. */
  paragrafi: [
    "4 bid srl annuncia Air Market Intelligence, il nuovo modulo di Santaddeo, il sistema di revenue management per strutture ricettive sviluppato in Italia. Il modulo analizza i collegamenti aerei in arrivo negli aeroporti di riferimento della struttura e restituisce un'indicazione operativa: quali mercati esteri stanno crescendo, quali sono già presidiati e quali vale la pena iniziare a lavorare.",

    "Il punto di partenza è un dato che l'albergatore non ha mai avuto sotto mano: quanti posti sono programmati sulle rotte che portano ospiti nella sua zona, e da dove partono. La struttura sceglie fino a cinque aeroporti e assegna a ciascuno un peso, perché un aeroporto a venti minuti e uno a due ore non contano lo stesso. Su quella base il sistema calcola l'andamento della capacità per paese di provenienza e classifica ogni mercato come attivo, da sviluppare o da osservare.",

    "La differenza rispetto agli strumenti oggi in circolazione non sta nel dato, ma nell'uso che se ne fa. I sistemi che incorporano informazioni sul traffico aereo le impiegano per affinare la previsione della domanda e quindi il prezzo. Air Market Intelligence risponde a un'altra domanda, che nessun sistema di revenue management affronta: su quali mercati conviene spendere il budget di promozione. È la prima volta che questa lettura entra in un sistema italiano di revenue management, alla portata di una struttura indipendente e collegata al gestionale che l'albergo usa ogni giorno.",

    "Il ragionamento è rovesciato rispetto alla pratica corrente. Lo storico dice da dove sono arrivati gli ospiti l'anno passato e i prezzi dei concorrenti dicono cosa sta facendo il mercato adesso: entrambi guardano indietro. I voli si programmano mesi prima che si apra la prima prenotazione, e un aumento di posti da un paese è un segnale che precede la domanda invece di seguirla. Chi lo legge in tempo può preparare la comunicazione nella lingua giusta, rivedere le condizioni per quel mercato e presentarsi quando la ricerca comincia, non quando è finita.",
  ],

  citazione: {
    testo:
      "Un albergatore indipendente ha sempre saputo da dove sono arrivati i suoi ospiti. Non aveva modo di sapere da dove stanno per arrivare. La capacità aerea è un'informazione pubblica, ma nessuno la traduceva in una decisione commerciale alla sua scala: la si trovava in strumenti pensati per le grandi catene, e comunque per aggiustare il prezzo. Noi la usiamo per rispondere a una domanda diversa e più concreta: su quale mercato conviene lavorare nei prossimi mesi.",
    attribuzione: `${NOME_FONDATORE}, fondatore di 4 bid srl`,
  },

  chiusura:
    "Air Market Intelligence è disponibile come modulo di Santaddeo per le strutture già attive sulla piattaforma. Dettagli, condizioni e attivazione su www.santaddeo.com.",

  /** Scheda finale. In un comunicato serve a chi non conosce l'azienda. */
  scheda: {
    titolo: "Su Santaddeo e 4 bid srl",
    testo:
      "Santaddeo è il sistema di revenue management per strutture ricettive sviluppato da 4 bid srl, società con sede a San Casciano in Val di Pesa (Firenze). La piattaforma raccoglie i dati dal gestionale della struttura e ne ricava prezzi consigliati, analisi della concorrenza, gestione delle recensioni e lettura della domanda. È pensata per alberghi e strutture indipendenti che non hanno un reparto revenue interno.",
  },

  contatti: {
    titolo: "Contatti per la stampa",
    righe: [
      "4 bid srl - Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)",
      "P.IVA 06241710489",
      "info@4bid.it - www.santaddeo.com - www.4bid.it",
    ],
  },
}

// ---------------------------------------------------------------------------
// Versione email
// ---------------------------------------------------------------------------

import { costruisciDem, type CorpoDem } from "./email-shell"

const BLU = "#1b2a4a"
const VERDE = "#2bb3a3"

function paragrafoHtml(testo: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#3a3a3a;">${testo}</p>`
}

/**
 * Corpo dell'email per la rubrica stampa.
 *
 * Il testo del comunicato e' LEGGIBILE nel corpo, non solo allegato: il
 * comunicato precedente stava dentro un PDF e l'email era solo
 * accompagnamento. Un giornalista che apre la posta dal telefono, davanti a un
 * allegato da scaricare, nella maggior parte dei casi passa oltre. Il PDF resta
 * per chi archivia o inoltra.
 *
 * Nessun segnaposto {{nome}}: 30 dei 54 indirizzi in rubrica sono redazioni
 * generiche (redazione@, info@) senza nome di persona, e la sostituzione
 * lascerebbe "Gentile ,".
 */
export function corpoComunicatoStampa(urlPdf: string): CorpoDem {
  const righe = `          <!-- Etichetta e data -->
          <tr>
            <td style="padding:28px 32px 0;">
              <p style="margin:0 0 4px;font-size:12px;letter-spacing:1.5px;font-weight:bold;color:${VERDE};">${COMUNICATO.etichetta}</p>
              <p style="margin:0 0 18px;font-size:13px;color:#7a7a7a;">${COMUNICATO.luogoData}</p>
              <h1 style="margin:0 0 10px;font-size:23px;line-height:1.35;color:${BLU};font-weight:bold;">${COMUNICATO.titolo}</h1>
              <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#5a5a5a;">${COMUNICATO.sottotitolo}</p>
            </td>
          </tr>
          <!-- Corpo -->
          <tr>
            <td style="padding:0 32px;">
              ${COMUNICATO.paragrafi.map(paragrafoHtml).join("\n              ")}
            </td>
          </tr>
          <!-- Citazione -->
          <tr>
            <td style="padding:8px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid #c8a45c;background-color:#faf7f0;border-radius:0 6px 6px 0;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#3a3a3a;font-style:italic;">&ldquo;${COMUNICATO.citazione.testo}&rdquo;</p>
                    <p style="margin:0;font-size:13px;color:#7a7a7a;">${COMUNICATO.citazione.attribuzione}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Chiusura -->
          <tr>
            <td style="padding:22px 32px 0;">
              ${paragrafoHtml(COMUNICATO.chiusura)}
            </td>
          </tr>
          <!-- Comunicato in PDF -->
          <tr>
            <td style="padding:6px 32px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#f4f4f2;border:1px solid #e6e3dd;border-radius:6px;">
                <tr>
                  <td style="padding:14px 18px;font-size:14px;line-height:1.6;color:#3a3a3a;">
                    Il comunicato in formato PDF: <a href="${urlPdf}" style="color:${BLU};font-weight:bold;">scarica la versione stampabile</a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Scheda azienda -->
          <tr>
            <td style="padding:24px 32px 0;">
              <hr style="border:none;border-top:1px solid #e6e3dd;margin:0 0 16px;" />
              <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:${BLU};">${COMUNICATO.scheda.titolo}</p>
              <p style="margin:0 0 18px;font-size:13px;line-height:1.65;color:#5a5a5a;">${COMUNICATO.scheda.testo}</p>
              <p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:${BLU};">${COMUNICATO.contatti.titolo}</p>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.65;color:#5a5a5a;">${COMUNICATO.contatti.righe.join("<br />")}</p>
            </td>
          </tr>`

  return {
    titolo: "Comunicato stampa - Air Market Intelligence | Santaddeo",
    anteprima:
      "Santaddeo legge la capacità aerea in arrivo e indica su quali mercati esteri conviene investire. Comunicato stampa, testo integrale e PDF.",
    righe,
    // Il motivo della ricezione deve essere VERO per questo pubblico: sono
    // redazioni in rubrica stampa, non potenziali clienti.
    motivoRicezione:
      "Ricevi questa comunicazione perché il tuo indirizzo è nella nostra rubrica stampa. Restiamo a disposizione per approfondimenti, dati aggiuntivi o interviste.",
  }
}

/** HTML completo dell'email del comunicato. */
export function htmlComunicatoStampa(urlPdf: string): string {
  return costruisciDem(corpoComunicatoStampa(urlPdf))
}

/**
 * Oggetto tenuto sotto i 75 caratteri: la prima stesura era di 116 e Gmail ne
 * mostra circa 70 sul desktop e meno di 40 sul telefono, quindi la notizia
 * finiva tagliata e restava visibile solo l'etichetta. "Comunicato stampa"
 * apre perche' e' il criterio con cui una redazione smista la posta.
 */
export const OGGETTO_COMUNICATO =
  "Comunicato stampa | Santaddeo: i voli dicono quali mercati sviluppare"
