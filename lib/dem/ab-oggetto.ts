// Prova A/B sull'oggetto di una DEM.
//
// PERCHE' ESISTE: l'oggetto della campagna "Traffico aereo (Air Market)" apre al
// 15,15%, cioe' MEGLIO della campagna di riferimento sulla stessa lista fredda
// (Invito Demo, 14,04%). Sostituirlo con un oggetto nuovo "perche' sembra piu'
// invogliante" e' una scommessa: se apre peggio lo si scopre a campagna finita,
// quando le email non si richiamano piu' indietro. Qui invece i due oggetti
// viaggiano in parallelo sulla stessa coda, nello stesso giorno, alla stessa ora:
// l'unica differenza fra i due gruppi e' l'oggetto, quindi la differenza fra le
// aperture e' attribuibile all'oggetto e non al momento dell'invio.
//
// COSA NON FA: non decide il vincente e non cambia nulla da sola. Serve a
// MISURARE. La scelta finale resta di chi gestisce la campagna, sui numeri che
// il pannello mostra.
//
// La suddivisione e' 50/50 e non regolabile: con una coda utile di ~4.000
// indirizzi (la campagna invia solo alla fascia sicura) meta' per parte da' circa
// 2.000 invii per variante, abbastanza perche' una differenza vera si veda. Una
// percentuale piu' bassa sulla B allungherebbe i tempi senza aggiungere
// informazione.

/** Variante dell'oggetto realmente spedita a un destinatario. */
export type VarianteOggetto = "A" | "B"

/**
 * Hash stabile di una stringa (FNV-1a a 32 bit).
 *
 * DEVE essere deterministico: la variante si ricava dall'identificativo del
 * destinatario, non da un numero casuale o dalla posizione nel lotto. Con
 * `Math.random()` o con l'indice del ciclo, un destinatario rimesso in coda (per
 * un errore di rete, un nuovo tentativo, un lotto ripetuto) potrebbe ricevere la
 * PRIMA volta l'oggetto A e la seconda l'oggetto B: due email diverse alla stessa
 * persona, e una misura sporca in cui non si sa piu' quale oggetto ha aperto.
 */
function hashStabile(testo: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < testo.length; i++) {
    h ^= testo.charCodeAt(i)
    // Moltiplicazione FNV con troncamento a 32 bit senza segno.
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/**
 * Una prova e' attiva solo se esiste un secondo oggetto DAVVERO diverso.
 *
 * I due casi respinti non sono teorici:
 * - `subject_b` vuoto o solo spazi: e' il valore che resta in banca dati quando
 *   si svuota il campo nel pannello. Trattarlo come "prova attiva" spedirebbe
 *   email con oggetto vuoto, che i filtri antispam puniscono.
 * - `subject_b` identico a `subject`: sarebbe un confronto fra un oggetto e se
 *   stesso. Darebbe due percentuali quasi uguali e l'apparenza di una misura
 *   riuscita, mentre non misura niente. Un controllo che non puo' distinguere
 *   nulla e' peggio di nessun controllo, perche' viene creduto.
 */
export function provaAttiva(oggettoA: string | null | undefined, oggettoB: string | null | undefined): boolean {
  const a = (oggettoA || "").trim()
  const b = (oggettoB || "").trim()
  if (a.length === 0 || b.length === 0) return false
  return a !== b
}

/**
 * Decide quale oggetto spedire a un destinatario.
 *
 * Se la prova non e' attiva restituisce l'oggetto A e variante `null`: `null`
 * significa "spedita fuori dalla prova" ed e' il valore che tiene onesto il
 * confronto. Le 4.119 email partite PRIMA che la prova esistesse hanno variante
 * `null`: contarle come A le sommerebbe a un gruppo spedito in giorni diversi,
 * con reputazione del mittente diversa, gonfiando o affossando A per motivi che
 * non c'entrano con l'oggetto.
 */
export function oggettoPerDestinatario(params: {
  oggettoA: string
  oggettoB: string | null | undefined
  idDestinatario: string
}): { oggetto: string; variante: VarianteOggetto | null } {
  const { oggettoA, oggettoB, idDestinatario } = params

  if (!provaAttiva(oggettoA, oggettoB)) {
    return { oggetto: oggettoA, variante: null }
  }

  // Bit meno significativo dell'hash: suddivisione 50/50 stabile.
  const variante: VarianteOggetto = hashStabile(idDestinatario) % 2 === 0 ? "A" : "B"
  return { oggetto: variante === "A" ? oggettoA : (oggettoB as string), variante }
}

/**
 * Numero in formato italiano: virgola per i decimali, punto per le migliaia.
 *
 * Non si usa `toLocaleString` senza indicare la lingua: prende quella
 * dell'ambiente, e nel server di questo progetto vale "en-US" - a schermo si
 * leggeva `15.1%` e `4119` invece di `15,1%` e `4.119`. Un numero che si legge
 * male fa dubitare del numero, non del formato.
 */
export function numero(valore: number, decimali = 0): string {
  return valore.toLocaleString("it-IT", {
    minimumFractionDigits: decimali,
    maximumFractionDigits: decimali,
  })
}

/** Numeri di una singola variante, come li mostra il pannello. */
export type RigaConfrontoAb = {
  variante: VarianteOggetto
  oggetto: string
  inviate: number
  aperte: number
  clic: number
  aperturePct: number | null
  clicSuApertePct: number | null
}

/**
 * Percentuale con un decimale, oppure `null` quando il denominatore e' zero.
 *
 * `null` e non `0`: con zero invii "0%" si leggerebbe come "questo oggetto non
 * apre mai", che e' un giudizio, mentre il dato semplicemente non c'e' ancora.
 */
export function percentuale(numeratore: number, denominatore: number): number | null {
  if (!denominatore || denominatore <= 0) return null
  return Math.round((numeratore / denominatore) * 1000) / 10
}

/**
 * Soglia minima di invii per variante prima di dichiarare un vincente.
 *
 * Sotto questo numero le due percentuali oscillano per caso: a 100 invii e 15%
 * di apertura bastano tre aperture in piu' per spostare la variante di 3 punti.
 * Il pannello mostra comunque i numeri, ma senza indicare un vincente.
 */
export const INVII_MINIMI_PER_VARIANTE = 400

/**
 * Confronta le due varianti e dice se si puo' concludere qualcosa.
 *
 * Restituisce `vincente: null` quando i dati sono insufficienti O quando lo
 * scarto e' troppo piccolo per distinguersi dal rumore. Dichiarare un vincente
 * per uno scarto di mezzo punto porterebbe a sostituire un oggetto che
 * funziona sulla base di nulla, che e' esattamente il rischio che questa prova
 * esiste per evitare.
 */
/**
 * Scarto minimo, in punti percentuali, per dire che due percentuali si
 * distinguono.
 *
 * Era scritto come `1.5` in due punti diversi del file, con due confronti
 * scritti in modo diverso (`scarto < 1.5` fra le varianti, `Math.abs(scarto) <
 * 1.5` contro lo storico). Due copie della stessa regola sono due regole che
 * possono divergere: bastava cambiarne una per avere un pannello che dichiara un
 * vincente in un riquadro e "nessun miglioramento" in quello sotto, sugli stessi
 * numeri. Ora la soglia e' UNA e la decisione passa da `distinguibili()`.
 */
export const SCARTO_MINIMO_PUNTI = 1.5

/**
 * `true` quando due percentuali sono abbastanza distanti da non essere rumore.
 *
 * Il confronto e' `>=`: a scarto esattamente pari alla soglia si decide, perche'
 * la soglia e' il minimo ACCETTABILE, non il primo valore rifiutato.
 */
export function distinguibili(unaPct: number, altraPct: number): boolean {
  return Math.abs(unaPct - altraPct) >= SCARTO_MINIMO_PUNTI
}

export function esitoConfronto(a: RigaConfrontoAb, b: RigaConfrontoAb): {
  vincente: VarianteOggetto | null
  motivo: string
} {
  if (a.inviate < INVII_MINIMI_PER_VARIANTE || b.inviate < INVII_MINIMI_PER_VARIANTE) {
    const mancanti = Math.max(
      INVII_MINIMI_PER_VARIANTE - a.inviate,
      INVII_MINIMI_PER_VARIANTE - b.inviate,
    )
    return {
      vincente: null,
      motivo: `Ancora troppo presto: servono almeno ${numero(INVII_MINIMI_PER_VARIANTE)} invii per variante (ne mancano ${numero(mancanti)}).`,
    }
  }

  if (a.aperturePct === null || b.aperturePct === null) {
    return { vincente: null, motivo: "Aperture non ancora rilevate." }
  }

  // Le due percentuali si estraggono qui, dove la guardia sopra ha appena
  // escluso `null`: leggerle piu' avanti attraverso `vincente`/`perdente` fa
  // perdere a TypeScript quella certezza, perche' sono riferimenti a oggetti il
  // cui campo resta dichiarato `number | null`.
  const aperturaA: number = a.aperturePct
  const aperturaB: number = b.aperturePct

  const scarto = Math.abs(aperturaA - aperturaB)
  // Soglia unica, la stessa usata nel confronto con lo storico: con qualche
  // migliaio di invii per parte, sotto questa distanza le due varianti non sono
  // distinguibili in modo utile a una decisione.
  if (!distinguibili(aperturaA, aperturaB)) {
    return {
      vincente: null,
      motivo: `Le due varianti sono equivalenti (scarto ${numero(scarto, 1)} punti): l'oggetto non è la leva che cambia le aperture.`,
    }
  }

  const aVince = aperturaA > aperturaB
  const vincente = aVince ? a : b
  const aperturaVincente = aVince ? aperturaA : aperturaB
  const aperturaPerdente = aVince ? aperturaB : aperturaA
  return {
    vincente: vincente.variante,
    motivo: `La variante ${vincente.variante} apre ${numero(scarto, 1)} punti in più (${numero(aperturaVincente, 1)}% contro ${numero(aperturaPerdente, 1)}%).`,
  }
}

/**
 * Confronta la migliore delle due varianti con l'oggetto usato PRIMA della prova.
 *
 * Serve perche' la prova in corso mette in gara due oggetti nuovi: dice quale dei
 * due apre meglio, ma non se battono quello di prima. Senza questa riga il
 * pannello risponderebbe a "quale delle due?" lasciando senza risposta la domanda
 * che conta, che e' "abbiamo migliorato?".
 *
 * Restituisce `null` quando il paragone non si puo' fare: senza storico, senza
 * abbastanza invii storici, o prima che le varianti abbiano raggiunto la soglia.
 * Un paragone con 30 invii storici sarebbe un numero preciso e insensato.
 *
 * IMPORTANTE - non e' un confronto alla pari, ed e' dichiarato nel testo: lo
 * storico e' stato spedito in giorni diversi, con un corpo diverso e una
 * reputazione del mittente diversa. E' un'asticella, non un avversario.
 */
export function confrontoConStorico(
  varianti: readonly RigaConfrontoAb[],
  storico: { inviate: number; aperturePct: number | null },
): string | null {
  if (storico.inviate < INVII_MINIMI_PER_VARIANTE) return null
  const aperturaStorico = storico.aperturePct
  if (aperturaStorico === null) return null

  const pronte = varianti.filter(
    (v): v is RigaConfrontoAb & { aperturePct: number } =>
      v.inviate >= INVII_MINIMI_PER_VARIANTE && v.aperturePct !== null,
  )
  if (pronte.length === 0) return null

  const migliore = pronte.reduce((x, y) => (y.aperturePct > x.aperturePct ? y : x))
  const scarto = migliore.aperturePct - aperturaStorico
  const asticella = `${numero(aperturaStorico, 1)}% dell'oggetto precedente`

  // "La piu' alta", non "la migliore".
  //
  // Quando le due varianti sono equivalenti, `esitoConfronto` scrive nella stessa
  // schermata "le due varianti sono equivalenti": chiamarne una "la migliore" due
  // righe sotto si contraddiceva da solo. "Piu' alta" dichiara solo il fatto
  // misurato (quale percentuale e' maggiore) senza sostenere che sia meglio, cosa
  // che a quello scarto non sappiamo. Colto guardando la schermata, non le prove.
  const etichetta = `La più alta delle due (${migliore.variante}, ${numero(migliore.aperturePct, 1)}%)`

  // La stessa soglia usata fra le due varianti, dalla stessa funzione: usarne una
  // piu' generosa qui vorrebbe dire dichiarare un miglioramento con meno prove di
  // quante ne chiediamo per dichiarare un vincente.
  if (!distinguibili(migliore.aperturePct, aperturaStorico)) {
    return `${etichetta} è in linea con il ${asticella}: la prova non ha ancora prodotto un miglioramento. Attenzione, non è un confronto alla pari — lo storico è stato spedito in giorni diversi e con un altro testo.`
  }
  if (scarto > 0) {
    return `${etichetta} supera di ${numero(scarto, 1)} punti il ${asticella}. Attenzione, non è un confronto alla pari — lo storico è stato spedito in giorni diversi e con un altro testo.`
  }
  return `Entrambe restano sotto il ${asticella}: ${etichetta} apre ${numero(Math.abs(scarto), 1)} punti in meno. Vale la pena rimettere in gara l'oggetto precedente. Attenzione, non è un confronto alla pari — lo storico è stato spedito in giorni diversi e con un altro testo.`
}
