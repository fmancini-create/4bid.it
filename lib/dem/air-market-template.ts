// Modelli DEM condivisi: usati dalla dashboard per precompilare le campagne e
// dagli script di creazione, cosi' esiste UNA sola versione di ogni testo.
// Argomento: il traffico aereo (Air Market Intelligence).
//
// Ce ne sono TRE perche' i pubblici sono tre e il motivo per cui ricevono
// l'email e' diverso:
//   AIR_MARKET_PRESET            -> primo contatto, non ci conoscono
//   AIR_MARKET_CLIENTI_PRESET    -> usano gia' Santaddeo
//   AIR_MARKET_COLLABORATORI_PRESET -> lo vendono / collaborano con noi
// Scrivere a un cliente il testo pensato per uno sconosciuto ("riteniamo
// Santaddeo utile per la tua struttura") gli dice in faccia che non sappiamo chi
// e': oltre a fare una brutta impressione, invita a segnalare il messaggio come
// indesiderato. E una segnalazione peggiora la reputazione del mittente per
// TUTTA la lista, non solo per chi la fa.
//
// Il layout (logo, banda aerea, contatti, pie' di pagina) sta in email-shell.ts:
// una sola fonte, cosi' le tre versioni non possono divergere.
//
// Tutti devono restare CURIOSI e SINTETICI: una sola idea, letta in meno di 20
// secondi. L'obiettivo non e' spiegare il modulo, ma portare sulla pagina delle
// funzionalita' e alla conversazione.
//
// Il testo dice quello che la pagina di atterraggio dichiara davvero ("analisi
// dei voli in arrivo sugli aeroporti vicini: da quali paesi arrivera' la domanda
// e su quali mercati puntare"): promettere altro significherebbe far arrivare il
// lettore su una pagina che lo smentisce.
//
// NESSUN testo usa i segnaposto {{nome}} / {{nome_azienda}}: la sostituzione in
// fase di invio mette stringa vuota quando il dato manca, e fra i destinatari ci
// sono indirizzi di struttura (info@...) senza un nome di persona. "Ciao ," e'
// peggio di nessun saluto.
import { costruisciDem, RIQUADRO_DIFFERENZA } from "./email-shell"

// Pagina di atterraggio del pulsante, in UN SOLO posto.
//
// Pagina dedicata fornita dal committente e VERIFICATA prima di metterla qui:
// risponde 200 con titolo "Air Market Intelligence: su quali mercati investire".
// I primi 4.119 destinatari hanno ricevuto la pagina generica /features; da qui in
// avanti si va sulla pagina dedicata. E' una differenza di contenuto fra i due
// gruppi, ed e' un'altra ragione per cui il dato storico non e' un confronto alla
// pari (vedi OGGETTO_STORICO).
//
// Host con il `www`: `santaddeo.com` risponde con un reindirizzamento a
// `www.santaddeo.com`, e questo link passa GIA' dal reindirizzamento del
// tracciamento clic. Scriverlo gia' in forma finale evita un salto in piu'.
export const PAGINA_AIR_MARKET = "https://www.santaddeo.com/landing/air-market"

// Segnaposto della variante A/B, sostituito in fase di invio (vedi la rotta di
// invio). NON e' un valore fisso per un motivo misurato: la landing ricopia
// `utm_content` tale e quale nei link del proprio modulo, quindi scrivere "A" a
// codice attribuirebbe alla variante A anche i contatti nati dalla B.
export const SEGNAPOSTO_VARIANTE = "{{variante}}"

/**
 * Invito alla pagina, con i parametri di provenienza.
 *
 * Gli `utm` servono perche' li ho misurati sulla pagina vera: la landing li
 * ricopia nei link verso `/request-info`, quindi senza di essi un contatto nato
 * dalla DEM arriva al modulo indistinguibile da uno arrivato da Google. Con essi,
 * il modulo riceve campagna e variante.
 *
 * `utm_campaign` e' DIVERSO per i tre pubblici: lo stesso pulsante e' usato dalla
 * versione per i freddi, da quella per i clienti e da quella per i collaboratori,
 * e un valore unico avrebbe fatto sembrare un solo invio tre campagne distinte.
 *
 * ATTENZIONE a cosa e' VIVO, misurato in banca dati il 19/08/2026: i tre pubblici
 * sono tre CAMPAGNE separate (`dem_recipients` non ha alcuna colonna che distingua
 * il pubblico, e l'invio legge `html_template` dalla campagna), ma ne esiste una
 * sola con questa pagina: "Santaddeo - Traffico aereo (Air Market)", quella dei
 * freddi, con 24.394 destinatari in coda. I corpi per clienti e collaboratori qui
 * sotto sono PRONTI ma DORMIENTI: nessuna campagna li usa. Chi legge "tre
 * pubblici" non deve dedurne tre invii in corso.
 *
 * Le `&` restano nude, NON scritte come `&amp;`: la riscrittura dei link per il
 * tracciamento clic prende l'indirizzo dall'attributo e lo codifica cosi' com'e',
 * quindi un `&amp;` finirebbe nell'indirizzo finale e trasformerebbe
 * `utm_medium` in `amp;utm_medium`, perdendo il parametro.
 */
function invitoPagina(opts: { utmCampaign: string; conVariante?: boolean }): string {
  const parametri = [
    "utm_source=dem",
    "utm_medium=email",
    `utm_campaign=${opts.utmCampaign}`,
    // Solo dove la prova A/B esiste davvero: le versioni per clienti e
    // collaboratori non hanno un oggetto B, quindi un `utm_content` vuoto o finto
    // aggiungerebbe una colonna che non significa niente.
    ...(opts.conVariante ? [`utm_content=${SEGNAPOSTO_VARIANTE}`] : []),
  ].join("&")
  return `          <!-- Invito principale -->
          <tr>
            <td align="center" style="padding:30px 32px 10px;">
              <a href="${PAGINA_AIR_MARKET}?${parametri}" style="display:inline-block;background-color:#2bb3a3;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:15px 38px;border-radius:6px;">Scopri come funziona</a>
            </td>
          </tr>`
}

// Oggetti proposti. Nessuno promette cifre o risultati ("+18% di RevPAR"):
// sarebbero verifiche che non possiamo sostenere e che sulla lista fredda
// attirano segnalazioni di spam, le quali peggiorano la consegna per TUTTA la
// lista, non solo per chi segnala.
export const OGGETTI_ALTERNATIVI = [
  "Sai quanti voli sono già prenotati verso il tuo aeroporto?",
  "I tuoi ospiti di settembre hanno già il biglietto in mano",
  "C'è un dato che il tuo revenue non sta guardando",
  "Il volo è prenotato. La camera no.",
  "Chi arriverà in città lo si sa già oggi",
] as const

// Le due varianti scelte per la prova: la 1 contro la 3.
export const OGGETTO_A = OGGETTI_ALTERNATIVI[0]
export const OGGETTO_B = OGGETTI_ALTERNATIVI[2]

// L'oggetto usato per le prime 4.119 email.
//
// Va conservato per un motivo preciso: apriva al 15,15%, meglio della campagna
// di riferimento sulla stessa lista fredda (14,04%). Siccome la prova mette in
// gara la 1 contro la 3, NESSUNA delle due varianti e' questo oggetto: la prova
// dira' quale delle due apre meglio, ma NON se batte il 15,15%.
//
// Per questo il numero storico resta a schermo nel pannello come terza riga di
// riferimento, con un avvertimento: e' stato misurato in giorni diversi, quindi
// e' un'asticella da tenere d'occhio, non un confronto alla pari. Cancellarlo
// significherebbe perdere l'unico termine di paragone che abbiamo.
export const OGGETTO_STORICO = "Il tuo prossimo ospite ha già prenotato il volo"

export const AIR_MARKET_PRESET = {
  name: "Santaddeo - Traffico aereo (Air Market)",
  // Variante A della prova. La B (OGGETTO_B) non sta qui perche' non e' un
  // secondo modello: il corpo e' lo STESSO per entrambe, cambia solo l'oggetto.
  subject: OGGETTO_A,
  html: costruisciDem({
    titolo: "Santaddeo - Air Market Intelligence",
    // L'anteprima si legge nella casella ACCANTO all'oggetto, quindi partecipa
    // alla decisione di aprire e vale per entrambe le varianti: non ripete
    // nessuno dei due oggetti, ma aggiunge il pezzo che manca a tutti e due.
    anteprima: "I voli già in calendario dicono da quali paesi arriverà la domanda.",
    motivoRicezione: "Ricevi questa email perché riteniamo Santaddeo utile per la tua struttura ricettiva.",
    // TRE righe, non di piu'.
    //
    // La versione precedente ne aveva 152 parole: spiegava il modulo dentro
    // l'email, e chi aveva capito tutto non aveva piu' motivo di cliccare. Il
    // compito dell'email e' incuriosire; a spiegare ci pensa la pagina. Per lo
    // stesso motivo qui NON c'e' piu' il riquadro di confronto con gli altri
    // sistemi (resta nelle altre due versioni, dove il pubblico e' diverso):
    // e' il contenuto tipico di una pagina, non di un invito.
    //
    // Il titolo NON ricopia l'oggetto, e per la prova A/B e' un vincolo, non uno
    // stile: un solo corpo serve DUE oggetti diversi, quindi ripetere l'oggetto A
    // renderebbe l'email incoerente per chi ha ricevuto il B, e viceversa. La
    // versione precedente ripeteva parola per parola l'oggetto di allora: con la
    // prova in corso sarebbe stata sbagliata per meta' dei destinatari.
    righe: `          <!-- Gancio -->
          <tr>
            <td style="padding:34px 32px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
              <p style="margin:0 0 18px;font-size:21px;font-weight:bold;color:#1b2a4a;line-height:1.45;">I voli verso il tuo aeroporto sono già prenotati. Le camere no.</p>
              <p style="margin:0 0 18px;">Da quali paesi arriverà la domanda, e in quali settimane, è già scritto negli aerei in calendario: settimane prima che arrivino le prenotazioni.</p>
              <p style="margin:0 0 6px;">Santaddeo legge quel dato e te lo mette accanto a prezzi e occupazione.</p>
            </td>
          </tr>
${invitoPagina({ utmCampaign: "air-market", conVariante: true })}
          <tr>
            <td align="center" style="padding:0 32px 26px;font-size:15px;color:#5a5a5a;line-height:1.6;">
              Oppure <a href="https://calendar.app.google/S25JdWoLtBnbGw4Q8" style="color:#1b2a4a;font-weight:bold;">prenota una demo gratuita</a>.
            </td>
          </tr>`,
  }),
}

// Per chi usa GIA' Santaddeo.
//
// Non e' una vendita: e' l'annuncio di una funzione nuova su uno strumento che
// hanno gia' in mano. Per questo non c'e' il richiamo alla demo gratuita (l'hanno
// gia' fatta, e' un invito che li tratta da sconosciuti) e non si spiega cos'e'
// Santaddeo.
//
// NON dice "la trovi nel tuo pannello": da qui non ho modo di sapere se il
// modulo e' attivo sul loro contratto, e mandare qualcuno a cercare una sezione
// che non vede e' il modo piu' rapido per far sembrare il prodotto rotto.
// Percio' l'invito e' a chiedere.
export const AIR_MARKET_CLIENTI_PRESET = {
  name: "Santaddeo - Traffico aereo (clienti)",
  subject: "Da oggi Santaddeo guarda anche il cielo",
  html: costruisciDem({
    titolo: "Santaddeo - Air Market Intelligence",
    anteprima: "I voli in arrivo diventano un dato di revenue. Ecco cosa cambia per te.",
    motivoRicezione: "Ricevi questa email perché la tua struttura utilizza Santaddeo.",
    righe: `          <!-- Gancio -->
          <tr>
            <td style="padding:34px 32px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
              <p style="margin:0 0 18px;font-size:21px;font-weight:bold;color:#1b2a4a;line-height:1.45;">Da oggi Santaddeo guarda anche il cielo.</p>
              <p style="margin:0 0 18px;">Lo usi già per leggere lo storico, l'occupazione e i prezzi dei competitor. <strong>Air Market Intelligence</strong> aggiunge un dato che prima non c'era: i voli già prenotati verso gli aeroporti vicini alla tua struttura.</p>
              <p style="margin:0 0 6px;">Sai <strong>da quali paesi arriverà la domanda</strong> settimane prima che arrivino le prenotazioni, e decidi prima su quali mercati puntare con pricing e marketing.</p>
            </td>
          </tr>
${RIQUADRO_DIFFERENZA}
${invitoPagina({ utmCampaign: "air-market-clienti" })}
          <tr>
            <td align="center" style="padding:0 32px 26px;font-size:15px;color:#5a5a5a;line-height:1.6;">
              Vuoi vederla sui dati della tua struttura?<br />
              <strong style="color:#1b2a4a;">Rispondi a questa email</strong> e ce ne occupiamo noi.
            </td>
          </tr>`,
  }),
}

// Per chi collabora con noi (agenti e partner commerciali).
//
// A loro non serve comprare: serve avere qualcosa in piu' da raccontare quando
// parlano con una struttura. Quindi il taglio e' "te lo diciamo prima", e
// l'invito e' a chiedere materiale, non una demo per se stessi.
export const AIR_MARKET_COLLABORATORI_PRESET = {
  name: "Santaddeo - Traffico aereo (collaboratori)",
  subject: "Santaddeo ora legge i voli in arrivo: un argomento in più per te",
  html: costruisciDem({
    titolo: "Santaddeo - Air Market Intelligence",
    anteprima: "Una funzione nuova da mettere sul tavolo quando parli con una struttura.",
    motivoRicezione: "Ricevi questa email perché collabori con Santaddeo.",
    righe: `          <!-- Gancio -->
          <tr>
            <td style="padding:34px 32px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
              <p style="margin:0 0 18px;font-size:21px;font-weight:bold;color:#1b2a4a;line-height:1.45;">Santaddeo ora legge i voli in arrivo.</p>
              <p style="margin:0 0 18px;">Te lo diciamo prima che lo scopra il mercato: c'è una funzione nuova da mettere sul tavolo quando parli con una struttura.</p>
              <p style="margin:0 0 6px;"><strong>Air Market Intelligence</strong> legge i voli già prenotati verso gli aeroporti vicini all'hotel e dice <strong>da quali paesi arriverà la domanda</strong>, settimane prima delle prenotazioni.</p>
            </td>
          </tr>
${RIQUADRO_DIFFERENZA}
${invitoPagina({ utmCampaign: "air-market-collaboratori" })}
          <tr>
            <td align="center" style="padding:0 32px 26px;font-size:15px;color:#5a5a5a;line-height:1.6;">
              Ti serve una demo da mostrare o materiale da inviare?<br />
              <strong style="color:#1b2a4a;">Rispondi a questa email</strong> e te lo prepariamo.
            </td>
          </tr>`,
  }),
}
