"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Building2,
  CheckCircle2,
  CirclePause,
  Download,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Property = {
  scidoo_code: number
  name: string
  email: string | null
  emails: string[]
  phone: string | null
  phones: string[]
  website_url: string | null
  booking_url: string
  address: string | null
  postal_code: string | null
  city: string | null
  province: string | null
  region: string | null
  country: string | null
  facebook_url: string | null
  instagram_url: string | null
  whatsapp_url: string | null
  data_quality: number
  is_active: boolean
  last_checked_at: string
}

type ScanState = {
  next_code: number
  max_code: number
  status: "running" | "paused" | "completed"
  scanned_count: number
  found_count: number
  failed_count: number
  last_batch_started_at: string | null
  last_batch_finished_at: string | null
  last_error: string | null
}

type DirectoryResponse = {
  rows: Property[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  state: ScanState
  stats: { found: number; withEmail: number; withPhone: number; withWebsite: number }
}

const emptyData: DirectoryResponse = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 50,
  totalPages: 1,
  state: {
    next_code: 1,
    max_code: 5000,
    status: "paused",
    scanned_count: 0,
    found_count: 0,
    failed_count: 0,
    last_batch_started_at: null,
    last_batch_finished_at: null,
    last_error: null,
  },
  stats: { found: 0, withEmail: 0, withPhone: 0, withWebsite: 0 },
}

function formatDate(value: string | null) {
  if (!value) return "Mai"
  return new Date(value).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function displayUrl(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "")
  } catch {
    return value
  }
}

function locationLabel(property: Property) {
  const place = [property.city, property.province].filter(Boolean).join(" · ")
  const address = [property.address, property.postal_code].filter(Boolean).join(" · ")
  return [address, place, property.region].filter(Boolean).join(" — ") || "Località non disponibile"
}

function statusLabel(status: ScanState["status"]) {
  if (status === "running") return "Scansione attiva"
  if (status === "completed") return "Scansione completata"
  return "Scansione in pausa"
}

export default function ScidooPropertiesDashboard() {
  const [data, setData] = useState<DirectoryResponse>(emptyData)
  const [queryInput, setQueryInput] = useState("")
  const [query, setQuery] = useState("")
  const [contacts, setContacts] = useState("all")
  const [status, setStatus] = useState("active")
  const [sort, setSort] = useState("code")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(queryInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [queryInput])

  const params = useMemo(() => {
    const value = new URLSearchParams({
      q: query,
      contacts,
      status,
      sort,
      page: String(page),
      pageSize: "50",
    })
    return value.toString()
  }, [contacts, page, query, sort, status])

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const response = await fetch(`/api/admin/scidoo-properties?${params}`, { cache: "no-store" })
        const json = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(json?.error || "Impossibile caricare la directory")
        setData(json)
      } catch (error) {
        if (!silent) toast.error(error instanceof Error ? error.message : "Errore nel caricamento")
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [params],
  )

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const interval = window.setInterval(() => void load(true), data.state.status === "running" ? 10_000 : 30_000)
    return () => window.clearInterval(interval)
  }, [data.state.status, load])

  async function runAction(nextAction: "start" | "pause" | "reset" | "scan") {
    if (
      nextAction === "reset" &&
      !window.confirm("Vuoi ricontrollare tutti i codici da 1? Le strutture già trovate resteranno salvate e saranno aggiornate.")
    ) {
      return
    }

    setAction(nextAction)
    try {
      const response = await fetch("/api/admin/scidoo-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextAction }),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json?.error || "Operazione non riuscita")

      if (nextAction === "pause") toast.success("Scansione messa in pausa")
      if (nextAction === "start") toast.success("Scansione ripresa: proseguirà automaticamente")
      if (nextAction === "reset") toast.success("Nuova scansione avviata dal codice 1")
      if (nextAction === "scan") {
        const found = json?.result?.found || 0
        const processed = json?.result?.processed || 0
        toast.success(processed ? `Controllati ${processed} codici, trovate ${found} strutture` : "Nessun lotto da elaborare")
      }
      await load(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operazione non riuscita")
    } finally {
      setAction(null)
    }
  }

  function exportCsv() {
    const exportParams = new URLSearchParams({ q: query, contacts, status, sort, export: "csv" })
    window.location.href = `/api/admin/scidoo-properties?${exportParams.toString()}`
  }

  const progress = Math.min(100, (data.state.scanned_count / Math.max(1, data.state.max_code)) * 100)
  const metrics = [
    { label: "Strutture trovate", value: data.stats.found, icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Con email", value: data.stats.withEmail, icon: Mail, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Con telefono", value: data.stats.withPhone, icon: Phone, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Con sito web", value: data.stats.withWebsite, icon: Globe2, color: "text-amber-600", bg: "bg-amber-50" },
  ]

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl">
        <CardContent className="p-5 sm:p-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="border border-white/15 bg-white/10 text-white hover:bg-white/10">
                  <span className={`mr-2 h-2 w-2 rounded-full ${data.state.status === "running" ? "animate-pulse bg-emerald-400" : "bg-slate-400"}`} />
                  {statusLabel(data.state.status)}
                </Badge>
                <span className="text-xs text-slate-300">Ultimo lotto: {formatDate(data.state.last_batch_finished_at)}</span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mappa dei clienti Scidoo</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Controllo progressivo dei booking engine pubblici, dal codice 1 al 5000. I risultati restano salvati e si aggiornano automaticamente anche quando chiudi questa pagina.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.state.status === "running" ? (
                <Button
                  variant="outline"
                  onClick={() => runAction("pause")}
                  disabled={Boolean(action)}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <CirclePause className="h-4 w-4" /> Pausa
                </Button>
              ) : data.state.status !== "completed" ? (
                <Button onClick={() => runAction("start")} disabled={Boolean(action)} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                  <Play className="h-4 w-4" /> Riprendi
                </Button>
              ) : null}
              <Button
                variant="outline"
                onClick={() => runAction("scan")}
                disabled={Boolean(action) || data.state.status !== "running"}
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${action === "scan" ? "animate-spin" : ""}`} /> Scansiona ora
              </Button>
              <Button
                variant="outline"
                onClick={() => runAction("reset")}
                disabled={Boolean(action)}
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" /> Ricontrolla da 1
              </Button>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{data.state.scanned_count.toLocaleString("it-IT")} di {data.state.max_code.toLocaleString("it-IT")} codici controllati</span>
              <span className="text-slate-300">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/10" />
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-400">
              <span>Prossimo codice: {Math.min(data.state.next_code, data.state.max_code)}</span>
              <span>Errori temporanei: {data.state.failed_count}</span>
            </div>
            {data.state.last_error && <p className="mt-2 truncate text-xs text-amber-300">Ultimo errore: {data.state.last_error}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="border-slate-200 shadow-sm">
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <div className={`rounded-xl p-2.5 ${metric.bg}`}><Icon className={`h-5 w-5 ${metric.color}`} /></div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">{metric.label}</p>
                  <p className="text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">{metric.value.toLocaleString("it-IT")}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="Cerca struttura, email, telefono, città o sito…"
                aria-label="Cerca nella directory Scidoo"
                className="h-11 border-slate-200 bg-white pl-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex">
              <Select value={contacts} onValueChange={(value) => { setContacts(value); setPage(1) }}>
                <SelectTrigger aria-label="Filtra per recapiti disponibili" className="h-11 min-w-36 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i recapiti</SelectItem>
                  <SelectItem value="email">Con email</SelectItem>
                  <SelectItem value="phone">Con telefono</SelectItem>
                  <SelectItem value="website">Con sito web</SelectItem>
                  <SelectItem value="complete">Recapiti completi</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1) }}>
                <SelectTrigger aria-label="Filtra per stato della struttura" className="h-11 min-w-32 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Solo attive</SelectItem>
                  <SelectItem value="inactive">Non più attive</SelectItem>
                  <SelectItem value="all">Tutte</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(value) => { setSort(value); setPage(1) }}>
                <SelectTrigger aria-label="Ordina risultati" className="col-span-2 h-11 min-w-36 bg-white sm:col-span-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="code">Ordina per codice</SelectItem>
                  <SelectItem value="name">Ordina per nome</SelectItem>
                  <SelectItem value="quality">Dati più completi</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportCsv} className="col-span-2 h-11 bg-white sm:col-span-3 xl:col-span-1">
                <Download className="h-4 w-4" /> Esporta CSV
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{data.total.toLocaleString("it-IT")} risultati con i filtri attuali</span>
            <Button variant="ghost" size="sm" onClick={() => load()} disabled={loading} className="h-8">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Aggiorna
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1050px] border-collapse text-sm">
            <thead className="bg-slate-100/80 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Cod.</th>
                <th className="px-4 py-3 font-semibold">Struttura</th>
                <th className="px-4 py-3 font-semibold">Località</th>
                <th className="px-4 py-3 font-semibold">Recapiti</th>
                <th className="px-4 py-3 font-semibold">Sito</th>
                <th className="px-4 py-3 text-center font-semibold">Dati</th>
                <th className="px-4 py-3 text-right font-semibold">Booking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.rows.map((property) => (
                <tr key={property.scidoo_code} className="align-top transition-colors hover:bg-slate-50">
                  <td className="px-4 py-4 font-mono text-xs font-semibold text-indigo-600">#{property.scidoo_code}</td>
                  <td className="px-4 py-4">
                    <p className="max-w-xs font-semibold text-slate-900">{property.name}</p>
                    <p className="mt-1 text-xs text-slate-400">Controllo {formatDate(property.last_checked_at)}</p>
                  </td>
                  <td className="max-w-xs px-4 py-4 text-slate-600">
                    <span className="inline-flex items-start gap-1.5"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />{locationLabel(property)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1.5">
                      {property.email ? <a href={`mailto:${property.email}`} className="flex items-center gap-1.5 text-slate-700 hover:text-indigo-600"><Mail className="h-3.5 w-3.5 text-slate-400" />{property.email}</a> : <span className="text-xs text-slate-400">Email non disponibile</span>}
                      {property.phone ? <a href={`tel:${property.phone}`} className="flex items-center gap-1.5 text-slate-700 hover:text-indigo-600"><Phone className="h-3.5 w-3.5 text-slate-400" />{property.phone}</a> : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {property.website_url ? <a href={property.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-indigo-600 hover:underline"><Globe2 className="h-3.5 w-3.5" />{displayUrl(property.website_url)}</a> : <span className="text-xs text-slate-400">Non disponibile</span>}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Badge variant="outline" className={property.data_quality >= 60 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{property.data_quality}%</Badge>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button asChild variant="ghost" size="sm"><a href={property.booking_url} target="_blank" rel="noopener noreferrer" aria-label={`Apri booking engine di ${property.name}`}><ExternalLink className="h-4 w-4" /></a></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 bg-white lg:hidden">
          {data.rows.map((property) => (
            <article key={property.scidoo_code} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-indigo-600">#{property.scidoo_code}</p>
                  <h3 className="mt-0.5 font-semibold text-slate-900">{property.name}</h3>
                </div>
                <Badge variant="outline" className="shrink-0">{property.data_quality}% dati</Badge>
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{locationLabel(property)}</p>
              <div className="mt-3 space-y-2 text-sm">
                {property.email && <a href={`mailto:${property.email}`} className="flex items-center gap-2 text-slate-700"><Mail className="h-4 w-4 text-slate-400" />{property.email}</a>}
                {property.phone && <a href={`tel:${property.phone}`} className="flex items-center gap-2 text-slate-700"><Phone className="h-4 w-4 text-slate-400" />{property.phone}</a>}
                {property.website_url && <a href={property.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600"><Globe2 className="h-4 w-4" />{displayUrl(property.website_url)}</a>}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span>{formatDate(property.last_checked_at)}</span>
                <a href={property.booking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-indigo-600">Apri booking <ExternalLink className="h-3.5 w-3.5" /></a>
              </div>
            </article>
          ))}
        </div>

        {!loading && data.rows.length === 0 && (
          <div className="bg-white px-6 py-16 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">Nessuna struttura con questi filtri</p>
            <p className="mt-1 text-sm text-slate-500">Modifica la ricerca oppure attendi l’avanzamento della scansione.</p>
          </div>
        )}

        {loading && data.rows.length === 0 && (
          <div className="bg-white px-6 py-16 text-center text-sm text-slate-500">
            <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin text-indigo-500" /> Caricamento directory…
          </div>
        )}
      </Card>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-xs text-slate-500">Pagina {data.page} di {data.totalPages}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} className="bg-white">Precedente</Button>
          <Button variant="outline" onClick={() => setPage((value) => Math.min(data.totalPages, value + 1))} disabled={page >= data.totalPages || loading} className="bg-white">Successiva</Button>
        </div>
      </div>
    </div>
  )
}
