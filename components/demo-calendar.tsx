"use client"

import { useEffect, useRef, useState } from "react"

// Google Calendar appointment scheduling page. The embeddable version is the
// public booking URL with `?gv=true` appended.
const CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/appointments/AcZssZ21kvY7_bf0xG1VfiCFPhGrlWCHAutf0aA6doc=?gv=true"

export function DemoCalendar() {
  const [isLoaded, setIsLoaded] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Fallback: hide the spinner even if the iframe's onLoad doesn't fire
    // (Google's embed doesn't always trigger it reliably).
    timeoutRef.current = setTimeout(() => setIsLoaded(true), 4000)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-card shadow-md">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary-blue" />
          <p className="text-sm text-muted-foreground">Caricamento del calendario in corso...</p>
        </div>
      )}
      <iframe
        src={CALENDAR_EMBED_URL}
        title="Calendario per prenotare una demo gratuita con 4BID.IT"
        className="h-[700px] w-full"
        style={{ border: 0 }}
        frameBorder={0}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  )
}
