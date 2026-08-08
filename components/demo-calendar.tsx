"use client"

import { useState } from "react"
import { Clock, Video, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { BOOKING_OPTIONS, type BookingOption } from "@/lib/booking-options"

export function DemoCalendar() {
  const [selected, setSelected] = useState<BookingOption | null>(null)

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
        {BOOKING_OPTIONS.map((option) => (
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
