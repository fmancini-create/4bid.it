import { ArrowUpRight, Inbox, Lock, Send } from "lucide-react"
import { formatDateTimeNumericIT } from "@/lib/date-utils"

/**
 * Project Room summary for the super admin back office.
 *
 * The Project Room lives behind /area-riservata and had no presence here at all,
 * so an access request could sit unread for days: the only place that showed it
 * was a panel the operator never opened. This section surfaces the pending
 * requests where the day-to-day work happens and links straight to the panel
 * that owns the approve/invite actions, instead of duplicating that logic.
 */

type PendingRequest = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  company: string | null
  message: string | null
  created_at: string
}

export default function AdminProjectRoom({
  pendingRequests,
  pendingInvitations,
  projectCount,
  unavailableReason,
}: {
  pendingRequests: PendingRequest[]
  pendingInvitations: number
  projectCount: number
  /** Set when the data could not be read, so the zero is never passed off as "nothing to do". */
  unavailableReason?: string | null
}) {
  const pendingCount = pendingRequests.length

  return (
    <section aria-labelledby="project-room-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Lock className="h-5 w-5 text-primary shrink-0" />
          <h2 id="project-room-heading" className="text-lg sm:text-2xl font-bold text-foreground truncate">
            Project Room
          </h2>
          {pendingCount > 0 && (
            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {pendingCount} da approvare
            </span>
          )}
        </div>
        <a
          href="/area-riservata/admin"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          Apri il pannello
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      {unavailableReason ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-foreground">Dati non leggibili</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {unavailableReason} Apri il pannello per controllare le richieste: questo riquadro non puo confermare che non
            ce ne siano.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
            <div className="rounded-lg border border-border bg-card p-2 sm:p-4">
              <h3 className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground">
                <Inbox className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Richieste</span>
              </h3>
              <p className="text-base sm:text-2xl font-bold text-foreground">{pendingCount}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-2 sm:p-4">
              <h3 className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground">
                <Send className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Inviti aperti</span>
              </h3>
              <p className="text-base sm:text-2xl font-bold text-foreground">{pendingInvitations}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-2 sm:p-4">
              <h3 className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Progetti</h3>
              <p className="text-base sm:text-2xl font-bold text-foreground">{projectCount}</p>
            </div>
          </div>

          {pendingCount === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nessuna richiesta di accesso in attesa.</p>
          ) : (
            <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              {pendingRequests.map((request) => {
                const name = [request.first_name, request.last_name].filter(Boolean).join(" ") || request.email
                return (
                  <li key={request.id} className="rounded-lg border border-border bg-card p-3 sm:p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTimeNumericIT(request.created_at)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground break-all">{request.email}</p>
                    {request.company && <p className="text-sm text-muted-foreground">{request.company}</p>}
                    {request.message && (
                      <p className="mt-2 rounded-md bg-muted p-2 text-sm text-foreground whitespace-pre-wrap">
                        {request.message}
                      </p>
                    )}
                    <a
                      href="/area-riservata/admin"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      Approva o rifiuta nel pannello
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
