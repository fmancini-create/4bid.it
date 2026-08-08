export type BookingOption = {
  id: string
  /** Titolo per la pagina pubblica /prenota-demo (fase pre-vendita). */
  title: string
  /**
   * Nome del prodotto, usato nelle email dopo il pagamento. Li' la call non e'
   * una "demo" ma l'avvio della configurazione: chiamarla demo a chi ha gia'
   * acquistato descriverebbe male l'appuntamento.
   */
  productName: string
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
    productName: "Prodotti 4 Bid",
    title: "Call conoscitiva prodotti 4 Bid",
    subtitle: "Per conoscere i prodotti 4 Bid — settore Ho.Re.Ca.",
    durationMin: 30,
    scheduleUrl:
      "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0ntKLdBZAS3eBALslBMWopfl8r2J9lfrBy1DciC71ess4MXnG16GgYF0xtGw6pSdXTcS2jAELs?gv=true",
  },
  {
    id: "santaddeo",
    productName: "Santaddeo RMS",
    title: "Demo di Santaddeo RMS",
    subtitle: "Il revenue management system per il tuo hotel.",
    durationMin: 60,
    scheduleUrl:
      "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1RFQzgy0TK0UScNGWRtIfT9PxQsV9UlXsMB9tszlB6d6Urt0P2oQbDSGsLt4W2PoN7a3YXfO-K?gv=true",
  },
  {
    id: "hotelprofitai",
    productName: "Hotelprofitai",
    title: "Demo di Hotelprofitai",
    subtitle: "Il controllo di gestione per le strutture ricettive.",
    durationMin: 60,
    scheduleUrl:
      "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0WdUtY2joxJlB5xyqzPOQoEFDd-hGbnKDdr3dDyZUuuReExfzVVqZv7WoiSgmVcB8LCQYP7D2K?gv=true",
  },
  {
    id: "hotelaccelerator",
    productName: "Hotelaccelerator",
    title: "Demo di Hotelaccelerator",
    subtitle: "La gestione operativa della tua struttura.",
    durationMin: 60,
    scheduleUrl:
      "https://calendar.google.com/calendar/appointments/schedules/AcZssZ2I-ZUL1DZ2kboYJN-wzPpbXlb4poeyoDqQR8AiGpbp29DXZEn2uNW4ZSgRPDSNi1K9N_jKsUOm?gv=true",
  },
  {
    id: "manubot",
    productName: "Manubot",
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
 * Consulenze, sviluppi su misura e voci scritte a mano non hanno un calendario
 * proprio. Se il preventivo contiene SOLO voci di questo tipo si ricade sulla
 * call generica 4BID: senza quella, un cliente pagante resterebbe senza alcun
 * modo di prenotare, ed e' proprio il caso piu' comune fra le voci manuali.
 *
 * Se invece ci sono gia' call di prodotto, la generica NON viene aggiunta: e'
 * una call conoscitiva pre-vendita, e proporla a chi ha gia' pagato sarebbe
 * fuori luogo. Le voci su misura si trattano nelle call di prodotto o al
 * recapito indicato in fondo all'email.
 */
export function bookingOptionsForProjects(projects: Array<string | null | undefined>): BookingOption[] {
  const byId = new Map(BOOKING_OPTIONS.map(option => [option.id, option]))
  const selected: BookingOption[] = []

  for (const project of projects) {
    const option = project ? byId.get(project) : undefined
    if (option && option.id !== GENERIC_BOOKING_ID && !selected.some(entry => entry.id === option.id)) {
      selected.push(option)
    }
  }

  if (selected.length === 0) {
    const generic = byId.get(GENERIC_BOOKING_ID)
    if (generic) selected.push(generic)
  }
  return selected
}
