// Riferimento tariffa per preventivi di GRUPPO (corporate / multi-struttura).
//
// PROBLEMA: i preventivi di gruppo si costruiscono nello stesso builder dei
// singoli, con listini "singola struttura". Su volumi alti (es. Bzar: ~46
// hotel / ~1600 camere) e' facile comporre un totale enorme senza accorgersi
// che il prezzo PER UNITA' (per camera / per struttura) e' pari o superiore a
// quello di un piano piu' piccolo — l'assurdo che l'utente vuole evitare.
//
// SOLUZIONE: dato il canone di riferimento della singola struttura e i driver
// di volume, si calcola un "riferimento gruppo" (= canone singolo x strutture)
// e una TARIFFA MASSIMA CONSIGLIATA sempre sotto quel riferimento, tramite uno
// sconto volume a scaglioni. Il tutto e' solo di supporto alla decisione
// dell'operatore: non blocca nulla e i valori sono modificabili nel builder.
//
// Tutti gli importi sono NORMALIZZATI AL MESE, cosi' il confronto e' omogeneo
// anche se le voci hanno periodi diversi (mensile/trimestrale/annuale).

export interface GroupDrivers {
  /** Numero di strutture / hotel del gruppo. */
  structures: number
  /** Numero totale di camere / asset (unita' vendibili). */
  rooms: number
  /** Numero di utenti / postazioni. */
  users: number
  /** Durata dell'impegno in mesi (leva di sconto: annuale/pluriennale). */
  months: number
}

export interface DiscountTier {
  /** Soglia minima INCLUSIVA a cui scatta lo scaglione. */
  from: number
  /** Punti percentuali di sconto aggiunti da questo scaglione. */
  pct: number
  label: string
}

// Scaglioni SUGGERITI. Non sono policy vincolante: nel builder l'operatore puo'
// sovrascrivere lo sconto proposto. Le strutture sono la leva principale; camere,
// utenti e durata aggiungono punti sopra la base.
export const STRUCTURE_TIERS: DiscountTier[] = [
  { from: 51, pct: 45, label: "51+ strutture" },
  { from: 31, pct: 35, label: "31-50 strutture" },
  { from: 16, pct: 25, label: "16-30 strutture" },
  { from: 6, pct: 15, label: "6-15 strutture" },
  { from: 2, pct: 8, label: "2-5 strutture" },
  { from: 0, pct: 0, label: "Struttura singola" },
]
export const ROOM_TIERS: DiscountTier[] = [
  { from: 2000, pct: 14, label: "2000+ camere" },
  { from: 1000, pct: 10, label: "1000+ camere" },
  { from: 500, pct: 6, label: "500+ camere" },
  { from: 200, pct: 3, label: "200+ camere" },
  { from: 0, pct: 0, label: "" },
]
export const USER_TIERS: DiscountTier[] = [
  { from: 250, pct: 6, label: "250+ utenti" },
  { from: 100, pct: 4, label: "100+ utenti" },
  { from: 25, pct: 2, label: "25+ utenti" },
  { from: 0, pct: 0, label: "" },
]
export const MONTH_TIERS: DiscountTier[] = [
  { from: 36, pct: 9, label: "impegno 36+ mesi" },
  { from: 24, pct: 6, label: "impegno 24+ mesi" },
  { from: 12, pct: 3, label: "impegno 12+ mesi" },
  { from: 0, pct: 0, label: "" },
]
/** Tetto massimo dello sconto volume complessivo. */
export const MAX_VOLUME_DISCOUNT = 60

function pickTier(tiers: DiscountTier[], value: number): DiscountTier {
  const v = Math.max(0, Number(value) || 0)
  // I tier sono ordinati dal piu' alto al piu' basso: il primo raggiunto vince.
  for (const tier of tiers) if (v >= tier.from) return tier
  return tiers[tiers.length - 1]
}

export interface VolumeDiscount {
  /** Sconto volume complessivo suggerito, in percentuale (0-MAX). */
  pct: number
  /** Scaglioni che compongono lo sconto, per spiegarlo a video. */
  breakdown: { label: string; pct: number }[]
}

/** Sconto volume SUGGERITO dai driver. Somma degli scaglioni, con tetto. */
export function suggestVolumeDiscount(drivers: GroupDrivers): VolumeDiscount {
  const structure = pickTier(STRUCTURE_TIERS, drivers.structures)
  const room = pickTier(ROOM_TIERS, drivers.rooms)
  const user = pickTier(USER_TIERS, drivers.users)
  const month = pickTier(MONTH_TIERS, drivers.months)
  const raw = structure.pct + room.pct + user.pct + month.pct
  const pct = Math.min(MAX_VOLUME_DISCOUNT, raw)
  const breakdown = [structure, room, user, month]
    .filter(t => t.pct > 0 && t.label)
    .map(t => ({ label: t.label, pct: t.pct }))
  return { pct, breakdown }
}

/** Normalizza un canone al mese in base al periodo di fatturazione. */
export function toMonthly(amount: number, period: "monthly" | "quarterly" | "yearly"): number {
  const a = Number(amount) || 0
  if (period === "yearly") return a / 12
  if (period === "quarterly") return a / 3
  return a
}

export type GroupPricingStatus = "ok" | "warn" | "danger" | "idle"

export interface GroupPricingInput {
  /** Canone MENSILE di riferimento per UNA struttura (il "miglior piano precedente"). */
  referencePerStructureMonthly: number
  /** Totale ricorrente MENSILE effettivamente configurato per l'INTERO gruppo. */
  configuredMonthlyTotal: number
  drivers: GroupDrivers
  /** Sconto volume da applicare (0-100). Di norma quello suggerito, ma editabile. */
  discountPct: number
}

export interface GroupPricingResult {
  status: GroupPricingStatus
  /** Riferimento gruppo = canone singolo x strutture (mensile). */
  referenceMonthlyTotal: number
  /** Tariffa massima consigliata (mensile) = riferimento x (1 - sconto). */
  recommendedMaxMonthly: number
  /** Totale mensile effettivamente configurato (input, ripetuto per comodita'). */
  configuredMonthlyTotal: number
  referencePerStructureMonthly: number
  /** Per-struttura effettivo del preventivo configurato (mensile). */
  effectivePerStructureMonthly: number
  referencePerRoomMonthly: number
  /** Per-camera effettivo del preventivo configurato (mensile). */
  effectivePerRoomMonthly: number
  /** Quanto il configurato sfora (>0) o sta sotto (<0) il tetto consigliato. */
  overCapMonthly: number
  discountPct: number
  /** Sconto effettivo del configurato rispetto al riferimento gruppo (%). */
  effectiveDiscountPct: number
  message: string
}

/**
 * Valuta il preventivo di gruppo contro il riferimento della singola struttura.
 *
 * REGOLA CARDINE: il per-unita' del gruppo deve restare SOTTO il per-unita' del
 * piano singolo. Poiche' recommendedMax = riferimento x (1 - sconto) e lo sconto
 * suggerito e' > 0 per qualsiasi gruppo (>= 2 strutture), il tetto consigliato e'
 * strettamente inferiore al listino singolo: rispettarlo garantisce la regola.
 *
 * Semaforo:
 *  - ok      configurato <= tetto consigliato
 *  - warn    tetto < configurato < riferimento singolo (accettabile ma sopra il consigliato)
 *  - danger  configurato >= riferimento singolo (si sta quotando il gruppo come/piu' dei singoli!)
 */
export function evaluateGroupPricing(input: GroupPricingInput): GroupPricingResult {
  const structures = Math.max(0, Math.floor(Number(input.drivers.structures) || 0))
  const rooms = Math.max(0, Math.floor(Number(input.drivers.rooms) || 0))
  const refPerStructure = Math.max(0, Number(input.referencePerStructureMonthly) || 0)
  const configured = Math.max(0, Number(input.configuredMonthlyTotal) || 0)
  const discountPct = Math.min(100, Math.max(0, Number(input.discountPct) || 0))

  const referenceMonthlyTotal = refPerStructure * structures
  const recommendedMaxMonthly = referenceMonthlyTotal * (1 - discountPct / 100)

  const effectivePerStructureMonthly = structures > 0 ? configured / structures : 0
  const referencePerRoomMonthly = rooms > 0 ? referenceMonthlyTotal / rooms : 0
  const effectivePerRoomMonthly = rooms > 0 ? configured / rooms : 0
  const overCapMonthly = configured - recommendedMaxMonthly
  const effectiveDiscountPct = referenceMonthlyTotal > 0
    ? Math.round((1 - configured / referenceMonthlyTotal) * 1000) / 10
    : 0

  let status: GroupPricingStatus = "idle"
  let message = "Inserisci strutture e canone di riferimento per calcolare il tetto consigliato."
  if (referenceMonthlyTotal > 0 && configured > 0) {
    if (configured >= referenceMonthlyTotal) {
      status = "danger"
      message = "Attenzione: il gruppo e' quotato a un prezzo pari o superiore al listino singola struttura. Il volume dovrebbe costare MENO, non di piu'."
    } else if (configured > recommendedMaxMonthly) {
      status = "warn"
      message = "Sopra il tetto consigliato ma ancora sotto il listino singolo. Valuta di ridurre per allinearti allo sconto volume."
    } else {
      status = "ok"
      message = "Sotto il tetto consigliato: il per-unita' del gruppo e' piu' conveniente del piano singolo."
    }
  } else if (referenceMonthlyTotal > 0 && configured === 0) {
    status = "idle"
    message = "Configura le voci ricorrenti per confrontarle con il tetto consigliato."
  }

  return {
    status,
    referenceMonthlyTotal,
    recommendedMaxMonthly,
    configuredMonthlyTotal: configured,
    referencePerStructureMonthly: refPerStructure,
    effectivePerStructureMonthly,
    referencePerRoomMonthly,
    effectivePerRoomMonthly,
    overCapMonthly,
    discountPct,
    effectiveDiscountPct,
    message,
  }
}
