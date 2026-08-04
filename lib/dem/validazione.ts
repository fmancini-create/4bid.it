import { promises as dns } from "node:dns"

/**
 * Validazione degli indirizzi di una campagna DEM.
 *
 * PERCHE' ESISTE
 * La lista fredda "aeroporti" ha prodotto il 16,3% di rimbalzi contro una soglia
 * del 5%. Misurando i rimbalzi sono emerse DUE cause indipendenti:
 *
 *  1. DOMINI MORTI. Su 60 domini rimbalzati, 39 (65%) non hanno alcun record MX:
 *     sono attivita' chiuse o domini scaduti. Un dominio senza MX non puo'
 *     ricevere posta, quindi l'indirizzo e' morto con certezza.
 *
 *  2. INDIRIZZI PERSONALI IN AZIENDE. I rimbalzi si concentrano per FREQUENZA
 *     del dominio nella lista, non per dominio nominato (libero.it 3,6%,
 *     tin.it 2,7% - innocui). Un dominio che compare una volta sola e'
 *     tipicamente la casella di una persona: se quella persona ha lasciato
 *     l'azienda, l'indirizzo non esiste piu'. I domini molto frequenti sono
 *     caselle di servizio (info@, booking@) che sopravvivono al ricambio.
 *
 * SOGLIA: misurata sulle 981 email con esito noto, contando la frequenza su
 * TUTTA la lista (28.773 indirizzi) - cioe' con lo stesso criterio che il
 * filtro puo' applicare prima di spedire:
 *       1 indirizzo    -> 19,9%   (544 invii)
 *       2-5            -> 16,6%   (193)
 *       6-11           -> 31,8%   ( 22 invii: campione troppo piccolo, rumore)
 *       12-19          -> 16,7%   ( 30)
 *       20+            ->  4,2%   (192)  <- l'unica fascia sotto il 5%
 *
 * ATTENZIONE, ERRORE DA NON RIPETERE: una stima precedente dava "6+ -> 2,4%"
 * perche' contava la frequenza sulle SOLE email gia' inviate (981) invece che
 * su tutta la lista. Sono due grandezze diverse e la prima NON e' calcolabile
 * prima di spedire: un dominio con 6 indirizzi fra gli inviati ne ha molti di
 * piu' in lista. Verificato: con la soglia a 6 il tasso atteso e' 8,2%, non
 * 2,4%. Una soglia va misurata con lo stesso criterio con cui verra' applicata.
 *
 * NESSUNO DEI DUE FILTRI BASTA DA SOLO: il controllo MX scarta solo il 5,6%
 * della coda (i domini morti sono tanti ma con pochi indirizzi ciascuno) e
 * lascerebbe un tasso atteso intorno all'11%, ancora sopra soglia.
 */

/** Soglia oltre la quale un dominio e' considerato "di servizio".
 *
 *  Vale 20 perche' e' l'unica fascia con tasso misurato sotto il 5% (4,2% su
 *  192 invii). Il margine e' sottile: 8 rimbalzi su 192, e un solo rimbalzo in
 *  piu' porterebbe al 4,7%. Alzare la soglia costa poco in copertura (7.440
 *  email a 20+ contro 8.688 a 6+, cioe' -14%) e vale il rischio evitato. */
export const SOGLIA_DOMINIO_SICURO = 20

export type StatoValidazione =
  /** Dominio senza MX: non puo' ricevere posta. Da non inviare. */
  | "dominio-morto"
  /** Dominio poco frequente in lista (meno di 20 indirizzi): probabile casella
   *  personale, tasso misurato fra il 16,6% e il 19,9%. */
  | "rischio-alto"
  /** Dominio molto frequente (20+): probabile casella di servizio, 4,2%. */
  | "sicuro"
  /** Controllo non riuscito (rete/timeout): non e' un giudizio sull'indirizzo. */
  | "non-verificato"

export function dominioDi(email: string): string | null {
  const parti = email.trim().toLowerCase().split("@")
  if (parti.length !== 2 || !parti[1]) return null
  return parti[1]
}

/**
 * Verifica se un dominio puo' ricevere posta.
 *
 * Distingue TRE esiti, non due: "ha MX", "non ha MX" e "non ho potuto
 * verificare". Confondere il terzo con il secondo scarterebbe indirizzi validi
 * per un problema di rete nostro.
 */
export async function dominioRiceveposta(
  dominio: string,
  timeoutMs = 5000,
): Promise<{ haMx: boolean | null; errore: string | null }> {
  try {
    const record = await Promise.race([
      dns.resolveMx(dominio),
      new Promise<never>((_, rifiuta) => setTimeout(() => rifiuta(new Error("timeout")), timeoutMs)),
    ])
    return { haMx: Array.isArray(record) && record.length > 0, errore: null }
  } catch (e) {
    const codice = (e as NodeJS.ErrnoException).code || (e as Error).message

    // ENOTFOUND/NXDOMAIN = il dominio non esiste. ENODATA = esiste ma non ha MX.
    // Entrambi sono verdetti CERTI: la posta non puo' arrivare.
    if (codice === "ENOTFOUND" || codice === "NXDOMAIN" || codice === "ENODATA") {
      return { haMx: false, errore: null }
    }

    // Qualunque altro errore (timeout, SERVFAIL, rete) NON e' un verdetto
    // sull'indirizzo: restituisce null perche' chi chiama non lo scarti.
    return { haMx: null, errore: String(codice) }
  }
}

/**
 * Classifica gli indirizzi di una campagna.
 *
 * `frequenzaDominio` va calcolata sull'INTERA lista della campagna, non sul
 * lotto in corso: un dominio con 8 indirizzi distribuiti su piu' lotti e' un
 * dominio di servizio anche se nel lotto corrente compare una volta sola.
 */
export function classifica(
  email: string,
  frequenzaDominio: number,
  haMx: boolean | null,
): StatoValidazione {
  if (haMx === false) return "dominio-morto"
  if (haMx === null) return "non-verificato"
  return frequenzaDominio >= SOGLIA_DOMINIO_SICURO ? "sicuro" : "rischio-alto"
}

/** Gli stati che l'invio "solo fascia sicura" accetta. */
export function ammessoConSoloSicuri(stato: StatoValidazione | null): boolean {
  return stato === "sicuro"
}

/** Gli stati che l'invio normale rifiuta SEMPRE, anche senza filtro attivo:
 *  un dominio senza MX e' uno spreco certo e un danno alla reputazione. */
export function sempreDaEscludere(stato: StatoValidazione | null): boolean {
  return stato === "dominio-morto"
}
