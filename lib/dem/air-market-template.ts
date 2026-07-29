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
// Il testo dice quello che la pagina /features dichiara davvero ("analisi dei
// voli in arrivo sugli aeroporti vicini: da quali paesi arrivera' la domanda e
// su quali mercati puntare"): promettere altro significherebbe far arrivare il
// lettore su una pagina che lo smentisce.
//
// NESSUN testo usa i segnaposto {{nome}} / {{nome_azienda}}: la sostituzione in
// fase di invio mette stringa vuota quando il dato manca, e fra i destinatari ci
// sono indirizzi di struttura (info@...) senza un nome di persona. "Ciao ," e'
// peggio di nessun saluto.
import { costruisciDem, RIQUADRO_DIFFERENZA } from "./email-shell"

// Invito alla pagina delle funzionalita': identico per tutti, cambia solo la
// riga che segue.
const BOTTONE_FUNZIONALITA = `          <!-- Invito principale -->
          <tr>
            <td align="center" style="padding:30px 32px 10px;">
              <a href="https://www.santaddeo.com/features" style="display:inline-block;background-color:#2bb3a3;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:15px 38px;border-radius:6px;">Scopri tutte le funzionalità</a>
            </td>
          </tr>`

export const AIR_MARKET_PRESET = {
  name: "Santaddeo - Traffico aereo (Air Market)",
  subject: "Il tuo prossimo ospite ha già prenotato il volo",
  html: costruisciDem({
    titolo: "Santaddeo - Air Market Intelligence",
    anteprima: "Lui non sa ancora dove dormirà. Il suo volo, però, è già prenotato.",
    motivoRicezione: "Ricevi questa email perché riteniamo Santaddeo utile per la tua struttura ricettiva.",
    righe: `          <!-- Gancio -->
          <tr>
            <td style="padding:34px 32px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
              <p style="margin:0 0 18px;font-size:21px;font-weight:bold;color:#1b2a4a;line-height:1.45;">Il tuo prossimo ospite ha già prenotato il volo.</p>
              <p style="margin:0 0 18px;">Non sa ancora dove dormirà. Ma il suo aereo, verso l'aeroporto vicino a te, è già in calendario.</p>
              <p style="margin:0 0 6px;">Santaddeo legge quei voli e ti dice <strong>da quali paesi arriverà la domanda</strong>, così scegli prima su quali mercati puntare con pricing e marketing.</p>
            </td>
          </tr>
${RIQUADRO_DIFFERENZA}
${BOTTONE_FUNZIONALITA}
          <tr>
            <td align="center" style="padding:0 32px 26px;font-size:15px;color:#5a5a5a;line-height:1.6;">
              Ti interessa vederlo sui dati del tuo hotel?<br />
              <a href="https://calendar.app.google/S25JdWoLtBnbGw4Q8" style="color:#1b2a4a;font-weight:bold;">Prenota una demo gratuita</a> o rispondi a questa email.
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
${BOTTONE_FUNZIONALITA}
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
${BOTTONE_FUNZIONALITA}
          <tr>
            <td align="center" style="padding:0 32px 26px;font-size:15px;color:#5a5a5a;line-height:1.6;">
              Ti serve una demo da mostrare o materiale da inviare?<br />
              <strong style="color:#1b2a4a;">Rispondi a questa email</strong> e te lo prepariamo.
            </td>
          </tr>`,
  }),
}
