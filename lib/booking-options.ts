export type BookingOption = {
  id: string
  title: string
  subtitle?: string
  durationMin: number
  scheduleUrl: string
}

/**
 * Link di prenotazione INDIVIDUALI della pagina pubblica Google Appointment
 * Scheduling di "CLIENTI 4 BID SRL". Ogni URL apre direttamente il selettore
 * data/ora del singolo prodotto (non la lista combinata di Google).
 *
 * Sorgente unica: la usano sia la pagina /prenota-demo sia le email inviate
 * dopo il pagamento. Duplicare gli URL significherebbe, prima o poi, mandare
 * ai clienti paganti un calendario diverso da quello pubblicato.
 *
 * Gli id coincidono con i valori `project` delle voci di preventivo, cosi'
 * ogni modulo acquistato trova la propria call. "4bid" e' la call generica,
 * usata per consulenze e voci fuori dai prodotti SaaS.
 */
export const BOOKING_OPTIONS: BookingOption[] = [
  {
    id: "4bid",
    title: "Call conoscitiva prodotti 4 Bid",
    subtitle: "Per conoscere i prodotti 4 Bid — settore Ho.Re.Ca.",
    durationMin: 30,
    scheduleUrl:
      "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0ntKLdBZAS3eBALslBMWopfl8r2J9lfrBy1DciC71ess4MXnG16GgYF0xtGw6pSdXTcS2jAELs?gv=true",
  },
  {
    id: "santaddeo",
    title: "Demo di Santaddeo RMS",
    subtitle: "Il revenue management system per il tuo hotel.",
    durationMin: 60,
    scheduleUrl:
      "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1RFQzgy0TK0UScNGWRtIfT9PxQsV9UlXsMB9tszlB6d6Urt0P2oQbDSGsLt4W2PoN7a3YXfO-K?gv=true",
  },
  {
    id: "hotelprofitai",
    title: "Demo di Hotelprofitai",
    subtitle: "Il controllo di gestione per le strutture ricettive.",
    durationMin: 60,
    scheduleUrl:
      "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0WdUtY2joxJlB5xyqzPOQoEFDd-hGbnKDdr3dDyZUuuReExfzVVqZv7WoiSgmVcB8LCQYP7D2K?gv=true",
  },
  {
    id: "hotelaccelerator",
    title: "Demo di Hotelaccelerator",
    subtitle: "La gestione operativa della tua struttura.",
    durationMin: 60,
    scheduleUrl:
      "https://calendar.google.com/calendar/appointments/schedules/AcZssZ2I-ZUL1DZ2kboYJN-wzPpbXlb4poeyoDqQR8AiGpbp29DXZEn2uNW4ZSgRPDSNi1K9N_jKsUOm?gv=true",
  },
  {
    id: "manubot",
    title: "Demo di Manubot",
    subtitle: "L'assistente per task, manutenzioni e housekeeping.",
    durationMin: 60,
    scheduleUrl:
      "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0OSHEnXPY1e2bx3DWy5sq1I7-RXrHJJ-s2ZBr328wXOIy_g7z1cMBcyczfm0U1Z2678emQYKq0?gv=true",
  },
]

export const GENERIC_BOOKING_ID = "4bid"

/**
 * Call di avvio per i moduli effettivamente acquistati, nell'ordine in cui
 * compaiono nel preventivo.
 *
 * Una voce senza calendario proprio (consulenze, sviluppi su misura, voci
 * scritte a mano) NON viene ignorata: ricade sulla call generica 4BID.
 * Ignorarla lascerebbe un cliente pagante senza alcun modo di prenotare —
 * ed e' proprio il caso piu' comune fra le voci manuali.
 */
export function bookingOptionsForProjects(projects: Array<string | null | undefined>): BookingOption[] {
  const byId = new Map(BOOKING_OPTIONS.map(option => [option.id, option]))
  const selected: BookingOption[] = []
  let needsGeneric = false

  for (const project of projects) {
    const option = project ? byId.get(project) : undefined
    if (option && option.id !== GENERIC_BOOKING_ID) {
      if (!selected.some(entry => entry.id === option.id)) selected.push(option)
    } else {
      needsGeneric = true
    }
  }

  if (needsGeneric) {
    const generic = byId.get(GENERIC_BOOKING_ID)
    if (generic && !selected.some(entry => entry.id === generic.id)) selected.push(generic)
  }
  return selected
}
