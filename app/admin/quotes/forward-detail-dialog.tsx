"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Eye, MailOpen, Send } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { SalesChannelQuote } from "@/lib/quotes/types"

type ShareRow = {
  id: string
  recipient_email: string
  forwarded_by_share_id: string | null
  sent_at: string | null
  send_count: number
  last_email_opened_at: string | null
  email_open_count: number
  last_viewed_at: string | null
  view_count: number
  last_error: string | null
}

function formatDate(value: string | null): string {
  if (!value) return "—"
  return new Date(value).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

/** Dettaglio per destinatario degli inoltri di UN preventivo: lo stesso dato
 *  della pagina "Analisi inoltri", ma raggiungibile dalla riga del preventivo. */
export default function ForwardDetailDialog({
  quote,
  open,
  onOpenChange,
}: {
  quote: SalesChannelQuote | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [rows, setRows] = useState<ShareRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !quote) return
    let active = true
    setRows(null)
    setError(null)
    fetch(`/api/quotes/${quote.id}/share-analytics`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || "Lettura degli inoltri non riuscita")
        return data
      })
      .then((data) => { if (active) setRows((data.recipients || []) as ShareRow[]) })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Errore imprevisto") })
    return () => { active = false }
  }, [open, quote])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Inoltri del preventivo</DialogTitle>
          <DialogDescription>
            {quote ? `${quote.client_company || quote.client_name || "Preventivo"}${quote.quote_number ? ` · N. ${quote.quote_number}` : ""}` : ""}
          </DialogDescription>
        </DialogHeader>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!error && rows === null ? <p className="text-sm text-muted-foreground">Caricamento…</p> : null}
        {!error && rows?.length === 0 ? <p className="text-sm text-muted-foreground">Questo preventivo non è ancora stato inoltrato a nessuno.</p> : null}

        {rows && rows.length > 0 ? (
          <ul className="divide-y">
            {rows.map((row) => (
              <li key={row.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{row.recipient_email}</span>
                  <span className="text-xs text-muted-foreground">{row.forwarded_by_share_id ? "Inoltrato da un altro destinatario" : "Inoltrato dal link originale"}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Send className="h-3.5 w-3.5" />{row.send_count || 0} {row.send_count === 1 ? "invio" : "invii"} · {formatDate(row.sent_at)}</span>
                  <span className={`inline-flex items-center gap-1 ${row.email_open_count > 0 ? "text-emerald-700" : ""}`}><MailOpen className="h-3.5 w-3.5" />{row.email_open_count || 0} aperture email{row.last_email_opened_at ? ` · ${formatDate(row.last_email_opened_at)}` : ""}</span>
                  <span className={`inline-flex items-center gap-1 ${row.view_count > 0 ? "text-primary" : ""}`}><Eye className="h-3.5 w-3.5" />{row.view_count || 0} visualizzazioni{row.last_viewed_at ? ` · ${formatDate(row.last_viewed_at)}` : ""}</span>
                  {row.last_error ? <span className="inline-flex items-center gap-1 text-destructive"><AlertTriangle className="h-3.5 w-3.5" />{row.last_error}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="text-xs text-muted-foreground">
          L&apos;apertura dell&apos;email è indicativa (alcuni programmi di posta bloccano le immagini): la visualizzazione della pagina è il segnale affidabile.
        </p>
      </DialogContent>
    </Dialog>
  )
}
