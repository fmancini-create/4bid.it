import { createAdminClient } from "@/lib/supabase/server-admin"
import { EventRegistrationsTable } from "./event-registrations-table"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Registrazioni Evento | Admin 4BID",
}

export default async function AdminEventsPage() {
  const supabase = createAdminClient()

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_slug", "santaddeo-launch-2026")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Registrazioni Evento Santaddeo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Villa I Barronci - Lancio Santaddeo
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-bold text-foreground">
                {registrations?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Registrazioni</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-foreground">
                {registrations?.reduce((sum, r) => sum + (r.num_guests || 1), 0) || 0}
              </p>
              <p className="text-xs text-muted-foreground">Partecipanti totali</p>
            </div>
          </div>
        </div>

        <EventRegistrationsTable registrations={registrations || []} />
      </div>
    </div>
  )
}
