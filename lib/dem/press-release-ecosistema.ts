// Comunicato stampa: l'ecosistema 4 BID (Santaddeo, Hotel Accelerator, ManuBot,
// Hotel Profit AI).
//
// PERCHE' IL TESTO STA QUI E NON DENTRO L'HTML: il comunicato esce in due
// formati, l'email leggibile e il PDF allegato. Se il testo fosse scritto due
// volte, alla prima correzione le due versioni divergerebbero e una testata
// citerebbe una frase che nell'altro formato non esiste. Il contenuto e' dato
// strutturato, i due formati sono solo rappresentazioni.
//
// IL TESTO E' QUELLO DELL'AUTORE, NON RISCRITTO. Richiesta esplicita del
// 17/08/2026: mantenere le sue parole, i suoi titoli e il suo taglio narrativo.
// Non e' quindi un comunicato in forma classica (nessun virgolettato, nessun
// annuncio di lancio): e' un pezzo di approfondimento pronto da pubblicare.
// Chi lo modifica in futuro modifichi il TESTO qui, non la resa.
//
// NOTA SUGLI ACCENTI: nei testi per i giornalisti si usano i caratteri
// accentati veri (è, à, ù). Nei commenti si resta in ASCII, come nel resto del
// progetto. Un comunicato che arriva ad ANSA con "capacita'" viene letto come
// materiale sciatto prima ancora del contenuto.
//
// ---------------------------------------------------------------------------
// COSA NON C'E' DENTRO, E PERCHE'
// ---------------------------------------------------------------------------
//   - NESSUN virgolettato: il testo dell'autore non ne contiene, e un
//     virgolettato attribuito a una persona reale non si inventa.
//   - NESSUN numero di adozione (hotel attivi, strutture configurate): in
//     `press_mentions` ci sono 8 pubblicazioni sul lancio Santaddeo, quindi le
//     testate seguono il progetto; un numero di diffusione basso diventerebbe
//     il titolo dell'articolo al posto della notizia.
//   - NESSUN prezzo: un comunicato con il listino dentro si legge come
//     pubblicita'.
//   - Il riferimento a HotelBid (2012) e' un dato storico dell'autore: NON e'
//     verificabile dentro questo progetto, dove non compare in nessuna pagina.
//     Resta scritto qui perche' chi rilegge sappia che quella riga risponde
//     all'azienda, non al codice.
//
// La notizia e' nuova per la rubrica stampa: le 8 pubblicazioni esistenti (giugno
// 2026) parlano TUTTE del solo lancio di Santaddeo, e i quattro software come
// ecosistema collegato non sono mai stati raccontati alle redazioni.

/**
 * Data unica del comunicato: da qui derivano la riga "luogo, data" del testo e
 * il piede di pagina del PDF. Tenerla in un solo punto evita che l'email
 * dichiari una data e il PDF allegato un'altra.
 */
export const DATA_COMUNICATO_ECOSISTEMA = "17 agosto 2026"

/** Nome del file PDF allegato, uguale nell'email e su disco. */
export const PERCORSO_PDF_ECOSISTEMA = "/comunicati/4bid-ecosistema-hotel-ai.pdf"

type Sezione = {
  /** Titolo di paragrafo. `null` per l'attacco, che nel testo non ne ha. */
  titolo: string | null
  paragrafi: string[]
}

/**
 * Il testo integrale. L'enfasi e' segnata con **doppi asterischi**, come
 * nell'originale dell'autore: e' l'unica marcatura ammessa e viene interpretata
 * da `spezzaEnfasi()`, cosi' email e PDF applicano lo stesso grassetto negli
 * stessi punti.
 */
export const COMUNICATO_ECOSISTEMA = {
  etichetta: "COMUNICATO STAMPA",
  luogoData: `San Casciano in Val di Pesa (FI), ${DATA_COMUNICATO_ECOSISTEMA}`,

  titolo:
    "L'hotel che impara da solo: quattro software italiani provano a cambiare il modo di gestire l'ospitalità",

  sommario:
    "Una telefonata può cambiare il prezzo di una camera. Un messaggio vocale può diventare automaticamente un intervento di manutenzione. Una fattura può aggiornare in tempo reale la redditività dell'hotel. È l'idea alla base dell'ecosistema tecnologico sviluppato da 4 BID: far dialogare vendite, prezzi, operatività e contabilità attraverso l'intelligenza artificiale.",

  sezioni: [
    {
      titolo: null,
      paragrafi: [
        "Tutto nasce da una domanda molto concreta: **quante informazioni preziose produce ogni giorno un hotel senza riuscire realmente a utilizzarle?**",
        "Telefonate, email, WhatsApp, richieste sui social, prenotazioni, cancellazioni, interventi tecnici, camere da controllare, fatture, costi.",
        "Informazioni che normalmente vivono in sistemi diversi e che raramente comunicano tra loro.",
        "4 BID, società italiana che già nel 2012 aveva lanciato HotelBid, uno dei primi sistemi di prenotazione alberghiera basati sull'offerta del cliente, sta provando a collegare questi mondi attraverso quattro piattaforme: **Santaddeo, Hotel Accelerator, ManuBot e Hotel Profit AI.**",
      ],
    },
    {
      titolo: 'Un prezzo che non è più una "scatola nera"',
      paragrafi: [
        "**Santaddeo** è un RMS, Revenue Management System, che calcola e suggerisce il prezzo delle camere.",
        "Ma parte da un principio particolare: **il direttore deve poter capire perché l'algoritmo propone proprio quel prezzo.**",
        "Il sistema mostra la logica che ha portato alla tariffa suggerita e permette alla struttura di personalizzare l'algoritmo, attribuendo pesi differenti alle variabili che concorrono alla formazione del prezzo.",
        "E questi pesi possono cambiare anche in funzione del periodo o del singolo giorno.",
        "Meteo, occupazione, andamento delle prenotazioni, anticipo, domanda, eventi, storico e altre variabili possono quindi incidere diversamente sulla decisione finale.",
        'L\'idea è superare la "scatola nera" dell\'intelligenza artificiale: **non soltanto "questo è il prezzo", ma "questo è il prezzo e ti spiego perché".**',
      ],
    },
    {
      titolo: "Trasformare ogni conversazione in un dato commerciale",
      paragrafi: [
        "**Hotel Accelerator** parte invece da un patrimonio che molti hotel possiedono senza rendersene conto: le conversazioni con i clienti.",
        "Telefonate del centralino, WhatsApp, email, social e altri canali vengono analizzati e organizzati in un unico ambiente.",
        "Lo scopo non è semplicemente creare una inbox multicanale, ma **capire come l'hotel sta vendendo**.",
        "La dashboard dedicata a manager e direttori permette di monitorare l'attività commerciale, verificare come vengono gestite le richieste e misurare l'efficienza degli operatori, creando anche sistemi per riconoscere e premiare le performance migliori.",
        "Ma c'è un secondo passaggio interessante.",
        "Hotel Accelerator può individuare **per quali date stanno arrivando le richieste**, comprese quelle che non diventano immediatamente prenotazioni.",
        "Queste informazioni alimentano un vero e proprio **calendario della domanda**.",
        "Collegato a Santaddeo, significa che una richiesta ricevuta oggi per una determinata data futura può diventare un ulteriore segnale utilizzato dall'RMS per capire quanto interesse esiste realmente per quel giorno e contribuire alla determinazione del prezzo.",
        "**La conversazione di un cliente diventa così una variabile di revenue management.**",
      ],
    },
    {
      titolo: "Un vocale su WhatsApp può diventare un intervento",
      paragrafi: [
        "**ManuBot** affronta invece il lato operativo dell'hotel con una scelta precisa: **non obbligare gli operatori a imparare un altro software.**",
        "Chi lavora nella struttura può utilizzare strumenti che conosce già, come **WhatsApp o Telegram**, senza dover scaricare una nuova applicazione.",
        "Un manutentore, una cameriera ai piani o un altro collaboratore può semplicemente inviare un vocale, un testo o una segnalazione.",
        "Il sistema interpreta la richiesta e **la instrada automaticamente alla persona che deve occuparsene**, trasformandola in un'attività organizzata e tracciabile.",
        "Dietro questa semplicità per l'operatore esiste però una piattaforma molto più articolata per l'Hotel Manager, con reportistica avanzata, configurazioni e moduli specifici.",
        "Tra questi **Housekeeping e Camera Pronta**, che permettono di gestire le attività di pulizia e verificare che una camera sia effettivamente conforme agli standard definiti dalla struttura prima di considerarla pronta per l'ospite.",
        "L'idea è quasi paradossale: **più tecnologia dietro le quinte, meno tecnologia da imparare per chi deve lavorare.**",
      ],
    },
    {
      titolo: "Sapere oggi quanto sta realmente guadagnando l'hotel",
      paragrafi: [
        "Il quarto tassello è **Hotel Profit AI**, dedicato al controllo economico e alle performance.",
        "Collegandosi ai software contabili della struttura, il sistema può acquisire e registrare autonomamente voci, documenti e fatture, con l'obiettivo di mantenere **la situazione economica e contabile costantemente aggiornata**, senza aspettare report prodotti settimane o mesi dopo.",
        "Ma il dato contabile, da solo, racconta soltanto una parte della storia.",
        "Attraverso l'integrazione con Santaddeo, Hotel Profit AI può mettere in relazione i numeri economici con gli indicatori operativi e commerciali dell'hotel, monitorandone le performance.",
        'La domanda cambia quindi da **"Quanto abbiamo guadagnato il mese scorso?"** a **"Come sta andando economicamente la struttura adesso, e perché?"**',
      ],
    },
    {
      titolo: "Il vero progetto è farli parlare",
      paragrafi: [
        "La parte forse più interessante non è quindi nessuno dei quattro software preso singolarmente.",
        "È quello che succede **quando iniziano a comunicare tra loro**.",
        "Una telefonata analizzata da Hotel Accelerator può segnalare un aumento della domanda per una determinata data.",
        "Quel segnale può arrivare a Santaddeo e contribuire alla determinazione del prezzo.",
        "Le performance dell'hotel possono essere incrociate con Hotel Profit AI per comprenderne l'effetto economico.",
        "E ManuBot può controllare ciò che accade fisicamente nella struttura, dalle manutenzioni alla preparazione delle camere.",
        "**Conversazioni, operatività, prezzi e numeri economici smettono così di essere quattro mondi separati.**",
        "Ed è probabilmente qui che si trova l'aspetto più originale del progetto di 4 BID.",
        "Questi software non sono nati in laboratorio cercando successivamente un settore nel quale applicarli. Sono nati **dentro un hotel, dai problemi quotidiani di chi un hotel lo gestisce realmente**.",
        "L'intelligenza artificiale sta rendendo possibile qualcosa che fino a pochi anni fa sarebbe stato molto più difficile: trasformare la conoscenza profonda di un mestiere direttamente in tecnologia.",
        "Forse la prossima rivoluzione del software non arriverà soltanto dalle grandi aziende tecnologiche.",
        "**Potrebbe arrivare anche da chi, prima ancora di conoscere la soluzione, conosce molto bene il problema.**",
      ],
    },
  ] satisfies Sezione[],

  /** Scheda finale: serve alla redazione che non conosce l'azienda. */
  scheda: {
    titolo: "Su 4 bid srl",
    testo:
      "4 bid srl è una società italiana con sede a San Casciano in Val di Pesa (Firenze). Sviluppa quattro piattaforme per le strutture ricettive: Santaddeo (revenue management), Hotel Accelerator (gestione e analisi delle conversazioni commerciali), ManuBot (operatività, manutenzioni e housekeeping) e Hotel Profit AI (controllo economico e performance). I prodotti nascono dall'esperienza diretta di gestione alberghiera e sono pensati anche per le strutture indipendenti, che non hanno reparti specializzati interni.",
  },

  contatti: {
    titolo: "Contatti per la stampa",
    righe: [
      "4 bid srl - Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)",
      "P.IVA 06241710489",
      "info@4bid.it - www.4bid.it - www.santaddeo.com",
    ],
  },
}

// ---------------------------------------------------------------------------
// Enfasi: una sola regola per i due formati
// ---------------------------------------------------------------------------

export type Frammento = { testo: string; grassetto: boolean }

/**
 * Divide un paragrafo nei suoi frammenti in tondo e in grassetto seguendo i
 * **doppi asterischi**.
 *
 * Sta qui, e non in ciascun formato, perche' l'email e il PDF devono mettere il
 * grassetto NEGLI STESSI PUNTI: due interpretazioni separate della stessa
 * marcatura divergerebbero al primo caso limite. Un asterisco doppio spaiato
 * resta testo, non apre un grassetto infinito.
 */
export function spezzaEnfasi(testo: string): Frammento[] {
  const frammenti: Frammento[] = []
  const parti = testo.split("**")
  // Con un numero PARI di separatori (cioe' dispari di parti) l'ultimo marcatore
  // e' spaiato: in quel caso l'ultima parte resta in tondo.
  const spaiato = parti.length % 2 === 0
  parti.forEach((parte, i) => {
    if (parte === "") return
    const ultimo = i === parti.length - 1
    frammenti.push({ testo: parte, grassetto: i % 2 === 1 && !(spaiato && ultimo) })
  })
  return frammenti
}

/** Testo senza marcatori, per i metadati e i controlli. */
export function senzaEnfasi(testo: string): string {
  return spezzaEnfasi(testo)
    .map((f) => f.testo)
    .join("")
}

// ---------------------------------------------------------------------------
// Versione email
// ---------------------------------------------------------------------------

const BLU = "#1b2a4a"
const ARANCIO = "#e08a2e"
const ORO = "#c8a45c"

function esc(testo: string): string {
  return testo.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/** Applica l'enfasi in HTML. L'escape avviene sul frammento, mai sul markup. */
function enfasiHtml(testo: string): string {
  return spezzaEnfasi(testo)
    .map((f) =>
      f.grassetto
        ? `<strong style="color:${BLU};">${esc(f.testo)}</strong>`
        : esc(f.testo),
    )
    .join("")
}

function paragrafoHtml(testo: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#3a3a3a;">${enfasiHtml(testo)}</p>`
}

function sezioneHtml(s: Sezione): string {
  const titolo = s.titolo
    ? `<h2 style="margin:26px 0 12px;font-size:18px;line-height:1.4;color:${BLU};font-weight:bold;">${esc(s.titolo)}</h2>`
    : ""
  return `${titolo}
              ${s.paragrafi.map(paragrafoHtml).join("\n              ")}`
}

/**
 * Email per la rubrica stampa.
 *
 * Il comunicato e' LEGGIBILE nel corpo, non solo allegato: davanti a un PDF da
 * scaricare, un giornalista che apre la posta dal telefono nella maggior parte
 * dei casi passa oltre. Il PDF resta per chi archivia o inoltra.
 *
 * Il marcatore ATTACH in cima e' letto da /api/dem/send: allega il file e
 * aggiunge da se' il riquadro con il collegamento per scaricarlo, quindi qui NON
 * si aggiunge un secondo link, che risulterebbe doppio.
 *
 * Nessun segnaposto {{nome}}: 30 dei 54 indirizzi in rubrica sono redazioni
 * generiche (redazione@, info@) senza nome di persona, e la sostituzione
 * lascerebbe "Gentile ,".
 *
 * Il guscio NON e' quello di lib/dem/email-shell.ts: quello ha in testa il logo
 * Santaddeo e la banda con la rotta aerea, cioe' l'identita' di UN prodotto.
 * Questo comunicato parla dei quattro software insieme e viene dall'azienda,
 * quindi porta il marchio 4 bid.
 */
export function htmlComunicatoEcosistema(): string {
  const c = COMUNICATO_ECOSISTEMA
  return `<!--ATTACH:${PERCORSO_PDF_ECOSISTEMA}|Comunicato Stampa 4 BID - Ecosistema Hotel AI - ${DATA_COMUNICATO_ECOSISTEMA}.pdf-->
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Comunicato stampa - L'ecosistema 4 BID per l'ospitalità</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
  <!-- Testo di anteprima nella casella di posta -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f4f2;">
    Quattro software italiani che si parlano: prezzi, conversazioni, operatività e conti dell'hotel in un unico ecosistema. Testo integrale e PDF.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f2;padding:24px 0;">
    <tr>
      <td align="center">
        <!-- Larghezza ELASTICA: con 600px fissi su un telefono da 390 il testo
             esce dallo schermo. -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e6e3dd;border-radius:8px;overflow:hidden;">
          <!-- Intestazione: marchio dell'AZIENDA, non di un prodotto.
               Il file e' servito come .jpg perche' i suoi byte sono JPEG:
               public/4bid-logo-email.png ha estensione .png ma contenuto JPEG, e
               dichiarare un tipo che non corrisponde e' un rischio inutile in
               posta. -->
          <tr>
            <td align="center" style="background-color:#ffffff;padding:30px 32px 22px;border-bottom:3px solid ${ARANCIO};">
              <img src="https://www.4bid.it/dem/4bid-logo.jpg" alt="4 bid" width="150" style="display:block;width:150px;max-width:45%;height:auto;border:0;margin:0 auto;" />
            </td>
          </tr>
          <!-- Etichetta, data, titolo -->
          <tr>
            <td style="padding:28px 32px 0;">
              <p style="margin:0 0 4px;font-size:12px;letter-spacing:1.5px;font-weight:bold;color:${ARANCIO};">${c.etichetta}</p>
              <p style="margin:0 0 18px;font-size:13px;color:#7a7a7a;">${esc(c.luogoData)}</p>
              <h1 style="margin:0 0 14px;font-size:23px;line-height:1.35;color:${BLU};font-weight:bold;">${esc(c.titolo)}</h1>
            </td>
          </tr>
          <!-- Sommario -->
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid ${ORO};background-color:#faf7f0;border-radius:0 6px 6px 0;">
                <tr>
                  <td style="padding:16px 20px;font-size:15px;line-height:1.65;color:#3a3a3a;font-weight:bold;">
                    ${esc(c.sommario)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Corpo -->
          <tr>
            <td style="padding:22px 32px 0;">
              ${c.sezioni.map(sezioneHtml).join("\n              ")}
            </td>
          </tr>
          <!-- Scheda azienda e contatti -->
          <tr>
            <td style="padding:26px 32px 0;">
              <hr style="border:none;border-top:1px solid #e6e3dd;margin:0 0 16px;" />
              <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:${BLU};">${esc(c.scheda.titolo)}</p>
              <p style="margin:0 0 18px;font-size:13px;line-height:1.65;color:#5a5a5a;">${esc(c.scheda.testo)}</p>
              <p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:${BLU};">${esc(c.contatti.titolo)}</p>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.65;color:#5a5a5a;">${c.contatti.righe.map(esc).join("<br />")}</p>
            </td>
          </tr>
          <!-- Contatti azienda -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #e6e3dd;margin:0 0 16px;" />
              <p style="margin:0;font-size:13px;line-height:1.6;color:#5a5a5a;">
                <a href="https://www.4bid.it" style="color:${BLU};">www.4bid.it</a> · <a href="https://www.santaddeo.com" style="color:${BLU};">www.santaddeo.com</a> · <a href="mailto:info@4bid.it" style="color:${BLU};">info@4bid.it</a>
              </p>
            </td>
          </tr>
          <!-- Pie' di pagina -->
          <tr>
            <td style="padding:20px 32px 28px;">
              <p style="margin:0;font-size:11px;color:#9a9a9a;line-height:1.5;">Ricevi questa comunicazione perché il tuo indirizzo è nella nostra rubrica stampa. Restiamo a disposizione per approfondimenti, dati aggiuntivi o interviste.<br />Non vuoi più ricevere i nostri comunicati? <a href="{{unsubscribe}}" style="color:#9a9a9a;text-decoration:underline;">Annulla iscrizione</a>.</p>
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
 * Oggetto sotto i 70 caratteri: Gmail ne mostra circa 70 sul desktop e meno di
 * 40 sul telefono. "Comunicato stampa" apre perche' e' il criterio con cui una
 * redazione smista la posta.
 */
export const OGGETTO_COMUNICATO_ECOSISTEMA =
  "Comunicato stampa | L'hotel che impara da solo: 4 software italiani"

/** Nome della campagna DEM: unico, cosi' la bozza si ritrova e non si duplica. */
export const NOME_CAMPAGNA_ECOSISTEMA = `Comunicato stampa - Ecosistema 4 BID (${DATA_COMUNICATO_ECOSISTEMA})`

/** Preset per la dashboard DEM: stesso testo della campagna creata da script. */
export const ECOSISTEMA_PRESET = {
  name: NOME_CAMPAGNA_ECOSISTEMA,
  subject: OGGETTO_COMUNICATO_ECOSISTEMA,
  get html() {
    return htmlComunicatoEcosistema()
  },
}
