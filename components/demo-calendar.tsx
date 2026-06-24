"use client"

import { useState } from "react"
import { Clock, Video, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type DemoOption = {
  id: string
  title: string
  subtitle?: string
  durationMin: number
  scheduleUrl: string
}

// Link di prenotazione INDIVIDUALI estratti dalla pagina pubblica Google
// Appointment Scheduling di "CLIENTI 4 BID SRL". Ogni URL apre direttamente il
// selettore data/ora del singolo prodotto (non la lista combinata di Google).
const DEMO_OPTIONS: DemoOption[] = [
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

export function DemoCalendar() {
  const [selected, setSelected] = useState<DemoOption | null>(null)

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
        {DEMO_OPTIONS.map((option) => (
          <li key={option.id} className="flex">
            <button
              type="button"
              onClick={() => setSelected(option)}
              className="group flex w-full flex-col rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-blue hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue"
            >
              <h3 className="text-lg font-semibold leading-snug text-card-foreground text-balance">
                {option.title}
              </h3>
              {option.subtitle && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{option.subtitle}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {option.durationMin} min
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Video className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Google Meet
                </span>
              </div>

              <span className="mt-6 inline-flex items-center gap-2 self-start rounded-lg bg-primary-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-primary-blue/90">
                Prenota
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl gap-0 p-0 overflow-hidden">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="text-balance pr-8">{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <iframe
              src={selected.scheduleUrl}
              title={`Prenota: ${selected.title}`}
              className="h-[600px] w-full"
              style={{ border: 0 }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
