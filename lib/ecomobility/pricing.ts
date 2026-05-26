/**
 * Ecomobility pricing - single source of truth.
 *
 * Schema (matches public.ecomobility_pricing in DB):
 * - hour_1..hour_7, hour_8_plus: cost ADDED for the N-th hour of rental
 * - daily_cap: cap massimo addebitabile per 24h consecutive
 * - minimum_charge: importo minimo che il cliente paga sempre
 * - deposit: cauzione (pre-autorizzata, non incassata)
 *
 * Le ore vengono ARROTONDATE PER ECCESSO (es. 1h 5min = 2 ore).
 * Tutti gli importi sono in EURO (NUMERIC), non in centesimi.
 */

export type EcomobilityPricing = {
  id: string
  structure_id: string
  vehicle_type_id: string
  hour_1: number | null
  hour_2: number | null
  hour_3: number | null
  hour_4: number | null
  hour_5: number | null
  hour_6: number | null
  hour_7: number | null
  hour_8_plus: number | null
  daily_cap: number | null
  minimum_charge: number | null
  deposit: number | null
}

/**
 * Calcola il costo del noleggio in base alle ore effettive.
 * @param pricing  Riga pricing per il vehicle_type
 * @param elapsedMinutes  Minuti trascorsi tra pickup e return (>= 0)
 * @returns importo in EURO arrotondato a 2 decimali
 */
export function calculateRentalAmount(
  pricing: Partial<EcomobilityPricing> | null | undefined,
  elapsedMinutes: number,
): { amount: number; hoursBilled: number; cappedAt: "minimum" | "daily" | null } {
  if (!pricing) return { amount: 0, hoursBilled: 0, cappedAt: null }

  const hoursBilled = Math.max(1, Math.ceil(elapsedMinutes / 60))
  const tiers: Array<number | null | undefined> = [
    pricing.hour_1,
    pricing.hour_2,
    pricing.hour_3,
    pricing.hour_4,
    pricing.hour_5,
    pricing.hour_6,
    pricing.hour_7,
  ]

  // Per ogni 24h ricomincia da hour_1 (se daily_cap non si applica prima)
  const totalHoursIn24h = Math.min(hoursBilled, 24)

  let raw = 0
  for (let h = 1; h <= totalHoursIn24h; h++) {
    if (h <= 7) {
      raw += Number(tiers[h - 1] ?? pricing.hour_8_plus ?? 0)
    } else {
      raw += Number(pricing.hour_8_plus ?? 0)
    }
  }

  // Multi-day: applica daily_cap per ogni giorno completo, poi somma le ore residue
  if (hoursBilled > 24) {
    const fullDays = Math.floor(hoursBilled / 24)
    const remainderHours = hoursBilled % 24
    const dayCost = pricing.daily_cap ? Number(pricing.daily_cap) : raw
    raw = fullDays * dayCost
    for (let h = 1; h <= remainderHours; h++) {
      if (h <= 7) {
        raw += Number(tiers[h - 1] ?? pricing.hour_8_plus ?? 0)
      } else {
        raw += Number(pricing.hour_8_plus ?? 0)
      }
    }
  }

  let amount = raw
  let cappedAt: "minimum" | "daily" | null = null

  // Cap giornaliero (solo se entro 24h)
  if (hoursBilled <= 24 && pricing.daily_cap && amount > Number(pricing.daily_cap)) {
    amount = Number(pricing.daily_cap)
    cappedAt = "daily"
  }

  // Minimo
  if (pricing.minimum_charge && amount < Number(pricing.minimum_charge)) {
    amount = Number(pricing.minimum_charge)
    cappedAt = "minimum"
  }

  return {
    amount: Math.round(amount * 100) / 100,
    hoursBilled,
    cappedAt,
  }
}

/**
 * Stima preventiva (1 ora) - usata in fase di prenotazione per calcolare
 * l'importo da pre-autorizzare (= minimum_charge | hour_1).
 */
export function estimateInitialAmount(
  pricing: Partial<EcomobilityPricing> | null | undefined,
): number {
  if (!pricing) return 0
  const minimum = pricing.minimum_charge ? Number(pricing.minimum_charge) : 0
  const firstHour = pricing.hour_1 ? Number(pricing.hour_1) : 0
  return Math.max(minimum, firstHour)
}
