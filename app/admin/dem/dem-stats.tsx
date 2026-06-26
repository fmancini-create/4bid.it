"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Eye, MousePointer, XCircle, RefreshCw, ChevronRight, ExternalLink } from "lucide-react"

interface Recipient {
  id: string
  email: string
  nome: string
  cognome: string
  nome_azienda: string
  tipo_contatto: string
  send_status: string
  sent_at: string | null
  open_count: number
  click_count: number
  first_open_at: string | null
  last_open_at: string | null
  first_click_at: string | null
}

interface TrackingEvent {
  id: string
  event_type: string
  email: string
  url: string | null
  created_at: string
}

interface Campaign {
  sent_count: number
  failed_count: number
  open_count: number
  click_count: number
  unique_opens: number
  unique_clicks: number
}

interface StatsData {
  campaign: Campaign
  recipients: Recipient[]
  events: TrackingEvent[]
  topLinks: { url: string; count: number }[]
}

interface DemStatsProps {
  campaignId: string
}

const TIPO_LABELS: Record<string, string> = {
  cliente: "Cliente",
  ex_cliente: "Ex Cliente",
  potenziale: "Potenziale",
}

function fmt(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function pct(a: number, b: number) {
  if (!b) return "0%"
  return Math.round((a / b) * 100) + "%"
}

export default function DemStats({ campaignId }: DemStatsProps) {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"overview" | "recipients" | "clicks">("overview")

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/dem/stats?c=${campaignId}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [campaignId])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm gap-2">
      <RefreshCw className="h-4 w-4 animate-spin" /> Caricamento statistiche...
    </div>
  )

  if (!data?.campaign) return (
    <p className="text-sm text-muted-foreground text-center py-8">Nessuna statistica disponibile. Invia prima la campagna.</p>
  )

  const { campaign, recipients, events, topLinks } = data
  const sent = campaign.sent_count || 0
  const failed = campaign.failed_count || 0
  const total = sent + failed

  return (
    <div className="space-y-4">
      {/* Barra refresh */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["overview", "recipients", "clicks"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "overview" ? "Panoramica" : t === "recipients" ? "Destinatari" : "Link cliccati"}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={load} className="h-7 text-xs gap-1">
          <RefreshCw className="h-3 w-3" /> Aggiorna
        </Button>
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Inviate</span>
                </div>
                <p className="text-2xl font-bold">{sent}</p>
                {failed > 0 && <p className="text-xs text-red-500 mt-1">{failed} fallite</p>}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Aperture</span>
                </div>
                <p className="text-2xl font-bold">{campaign.unique_opens || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pct(campaign.unique_opens || 0, sent)} tasso apertura
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MousePointer className="h-4 w-4 text-orange-500" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Click</span>
                </div>
                <p className="text-2xl font-bold">{campaign.unique_clicks || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pct(campaign.unique_clicks || 0, campaign.unique_opens || 1)} CTOR
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Non aperte</span>
                </div>
                <p className="text-2xl font-bold">{sent - (campaign.unique_opens || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pct(sent - (campaign.unique_opens || 0), sent)} del totale
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Barre progress */}
          <Card>
            <CardContent className="p-5 space-y-4">
              {[
                { label: "Consegnate", value: sent, total, color: "bg-blue-500" },
                { label: "Aperte (uniche)", value: campaign.unique_opens || 0, total: sent, color: "bg-emerald-500" },
                { label: "Click (unici)", value: campaign.unique_clicks || 0, total: sent, color: "bg-orange-500" },
              ].map(({ label, value, total: t, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{value} <span className="text-muted-foreground font-normal">/ {t} ({pct(value, t)})</span></span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: pct(value, t) }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Ultimi eventi */}
          {events && events.length > 0 && (
            <Card>
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-semibold">Attivita' recente</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 space-y-2">
                {events.slice(0, 8).map((e) => (
                  <div key={e.id} className="flex items-start gap-3 text-sm">
                    <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                      e.event_type === "open" ? "bg-emerald-100" : "bg-orange-100"
                    }`}>
                      {e.event_type === "open"
                        ? <Eye className="h-3 w-3 text-emerald-600" />
                        : <MousePointer className="h-3 w-3 text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{e.email}</span>
                      {e.url && (
                        <span className="text-xs text-muted-foreground truncate block">{e.url}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{fmt(e.created_at)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* DESTINATARI */}
      {tab === "recipients" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Destinatario</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Stato</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Aperture</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Click</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Prima apertura</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients?.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.nome} {r.cognome}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                        {r.nome_azienda && <p className="text-xs text-muted-foreground">{r.nome_azienda}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs">{TIPO_LABELS[r.tipo_contatto] || r.tipo_contatto}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={
                          r.send_status === "sent" ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                          : r.send_status === "failed" ? "border-red-300 text-red-700 bg-red-50"
                          : "border-gray-200 text-gray-600"
                        }>
                          {r.send_status === "sent" ? "Inviata" : r.send_status === "failed" ? "Fallita" : "In attesa"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.open_count > 0
                          ? <span className="font-semibold text-emerald-600">{r.open_count}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.click_count > 0
                          ? <span className="font-semibold text-orange-600">{r.click_count}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(r.first_open_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CLICK */}
      {tab === "clicks" && (
        <Card>
          <CardContent className="p-0">
            {topLinks?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nessun click registrato ancora.</p>
            ) : (
              <div className="divide-y">
                {topLinks?.map(({ url, count }, i) => (
                  <div key={url} className="flex items-center gap-4 px-5 py-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{url}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: pct(count, topLinks[0].count) }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
