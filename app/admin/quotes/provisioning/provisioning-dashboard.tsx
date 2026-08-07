"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, Clock3, Loader2, RefreshCw, ServerCog } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type ProvisioningRow = {
  id: string
  quote_id: string
  project: string
  status: string
  attempts: number
  last_error: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  quote_number: string | null
  client_company: string | null
  client_name: string | null
  payment_status: string | null
}

const projectNames: Record<string, string> = {
  hotelaccelerator: "HotelAccelerator",
  santaddeo: "Santaddeo",
  hotelprofitai: "HotelProfitAI",
  manubot: "ManuBot",
}

function statusMeta(status: string) {
  if (status === "succeeded") return { label: "Attivato", cls: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 }
  if (status === "failed") return { label: "Errore", cls: "bg-red-100 text-red-800", icon: AlertTriangle }
  if (status === "manual_action") return { label: "Azione manuale", cls: "bg-amber-100 text-amber-800", icon: AlertTriangle }
  if (status === "processing") return { label: "In attivazione", cls: "bg-blue-100 text-blue-800", icon: Loader2 }
  return { label: "In attesa", cls: "bg-muted text-muted-foreground", icon: Clock3 }
}

export default function ProvisioningDashboard({ rows }: { rows: ProvisioningRow[] }) {
  const router = useRouter()
  const [retrying, setRetrying] = useState<string | null>(null)

  async function retry(row: ProvisioningRow) {
    setRetrying(row.quote_id)
    try {
      const response = await fetch(`/api/quotes/${row.quote_id}/provision`, { method: "POST" })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || "Retry non riuscito")
      toast.success(`Provisioning rilanciato: ${body.status || "ok"}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Errore nel provisioning")
    } finally {
      setRetrying(null)
    }
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
        <ServerCog className="mx-auto mb-3 h-9 w-9" />
        Nessuna attivazione generata. I job compariranno dopo un pagamento confermato.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const meta = statusMeta(row.status)
        const Icon = meta.icon
        const canRetry = row.status === "failed" || row.status === "manual_action"
        return (
          <article key={row.id} className="rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{row.client_company || row.client_name || "Cliente"}</h2>
                  <Badge variant="outline">{row.quote_number || row.quote_id.slice(0, 8)}</Badge>
                  <Badge className={meta.cls}><Icon className={`mr-1 h-3.5 w-3.5 ${row.status === "processing" ? "animate-spin" : ""}`} />{meta.label}</Badge>
                </div>
                <p className="text-sm font-medium">{projectNames[row.project] || row.project}</p>
                <p className="text-xs text-muted-foreground">
                  Tentativi: {row.attempts} · ultimo aggiornamento {new Date(row.updated_at).toLocaleString("it-IT")}
                </p>
                {row.last_error ? (
                  <div className="max-w-3xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                    {row.last_error}
                  </div>
                ) : null}
              </div>

              {canRetry ? (
                <Button size="sm" variant="outline" onClick={() => retry(row)} disabled={retrying === row.quote_id}>
                  {retrying === row.quote_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Riprova attivazione
                </Button>
              ) : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}
