"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  ArrowLeft,
  Flame,
  Send,
  Users,
  CalendarCheck,
  TrendingUp,
  Loader2,
  Plus,
  Play,
  Pause,
  Square,
  RefreshCw,
  Trash2,
  Settings2,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

const COMMERCIAL_STATUS_LABELS: Record<string, string> = {
  interessato: "Interessato",
  demo_da_prenotare: "Demo da prenotare",
  demo_prenotata: "Demo prenotata",
  demo_effettuata: "Demo effettuata",
  pilot_proposto: "Pilot proposto",
  pilot_attivato: "Pilot attivato",
  cliente: "Cliente",
  non_interessato: "Non interessato",
}

const COMMERCIAL_STATUS_ORDER = [
  "interessato",
  "demo_da_prenotare",
  "demo_prenotata",
  "demo_effettuata",
  "pilot_proposto",
  "pilot_attivato",
  "cliente",
  "non_interessato",
]

const MAX_STEPS = 3

interface Campaign {
  id: string
  name: string
  subject?: string
  sent_count?: number
  click_count?: number
  unique_clicks?: number
}

interface Step {
  id: string
  step_number: number
  enabled: boolean
  subject: string
  preheader: string | null
  html_template: string
  cta_url: string | null
  delay_days: number
  status: string
  send_campaign_id: string | null
}

interface Followup {
  id: string
  original_campaign_id: string
  name: string
  status: string
  audience_config: { min_clicks?: number; recency_days?: number | null }
  warm_priority: boolean
  reallocate_unused: boolean
  scheduled_at: string | null
}

interface WarmData {
  campaign: Campaign
  followup: Followup | null
  steps: Step[]
  summary: {
    clickers: number
    enrolled: number
    eligible: number
    followups_sent: number
    demos: number
    excluded: number
    not_interested: number
  }
  funnel: Array<{ key: string; label: string; value: number }>
  quota: {
    total: number | null
    cold: number | null
    warm: number | null
    reallocate: boolean
    priority: boolean
  }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function fmtDate(value: string | null): string {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return "—"
  }
}

export default function WarmFollowupClient({
  campaignId,
  initialCampaign,
}: {
  campaignId: string
  initialCampaign: Campaign
}) {
  const { data, isLoading, mutate } = useSWR<WarmData>(
    `/api/dem/warm?c=${campaignId}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const campaign = data?.campaign || initialCampaign
  const followup = data?.followup || null
  const summary = data?.summary
  const funnel = data?.funnel || []

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <Link
              href="/admin/dem"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna alle campagne
            </Link>
            <h1 className="flex items-center gap-2 text-pretty text-2xl font-bold text-foreground md:text-3xl">
              <Flame className="h-7 w-7 text-primary" />
              Solleciti caldi
            </h1>
            <p className="text-sm text-muted-foreground">
              Campagna: <span className="font-medium text-foreground">{campaign?.name}</span>
            </p>
          </div>
          {followup ? (
            <FollowupStatusControls followup={followup} onChange={mutate} />
          ) : (
            <CreateFollowupButton campaignId={campaignId} onCreated={mutate} />
          )}
        </div>

        {/* Summary cards */}
        <SummaryCards campaign={campaign} summary={summary} loading={isLoading} />

        {/* No follow-up yet */}
        {!isLoading && !followup && (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Flame className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Nessuna sequenza di solleciti
              </h2>
              <p className="max-w-md text-pretty text-sm text-muted-foreground">
                Crea una sequenza per ricontattare automaticamente i contatti che hanno
                cliccato la campagna originale, con un massimo di {MAX_STEPS} solleciti.
              </p>
              <div className="mt-2">
                <CreateFollowupButton campaignId={campaignId} onCreated={mutate} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        {followup && (
          <Tabs defaultValue="panoramica" className="mt-8">
            <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
              <TabsTrigger value="panoramica">
                <Settings2 className="mr-1.5 h-4 w-4" />
                Panoramica
              </TabsTrigger>
              <TabsTrigger value="caldi">
                <Flame className="mr-1.5 h-4 w-4" />
                Caldi
              </TabsTrigger>
              <TabsTrigger value="funnel">
                <TrendingUp className="mr-1.5 h-4 w-4" />
                Funnel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="panoramica" className="mt-6">
              <OverviewTab data={data!} onChange={mutate} />
            </TabsContent>

            <TabsContent value="caldi" className="mt-6">
              <WarmRecipientsTab followupId={followup.id} onChange={mutate} />
            </TabsContent>

            <TabsContent value="funnel" className="mt-6">
              <FunnelTab funnel={funnel} summary={summary} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Summary cards                                                              */
/* -------------------------------------------------------------------------- */
function SummaryCards({
  campaign,
  summary,
  loading,
}: {
  campaign: Campaign
  summary?: WarmData["summary"]
  loading: boolean
}) {
  const cards = [
    {
      label: "Click campagna",
      value: campaign?.unique_clicks ?? campaign?.click_count ?? 0,
      icon: TrendingUp,
      hint: "Hanno cliccato l'originale",
    },
    {
      label: "Contatti caldi",
      value: summary?.enrolled ?? 0,
      icon: Users,
      hint: "Arruolati nella sequenza",
    },
    {
      label: "Solleciti inviati",
      value: summary?.followups_sent ?? 0,
      icon: Send,
      hint: "Hanno ricevuto ≥1 sollecito",
    },
    {
      label: "Demo prenotate",
      value: summary?.demos ?? 0,
      icon: CalendarCheck,
      hint: "Conversioni a demo+",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <Card key={c.label}>
            <CardContent className="flex flex-col gap-1 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-3xl font-bold text-foreground">
                {loading ? "—" : c.value.toLocaleString("it-IT")}
              </span>
              <span className="text-xs text-muted-foreground">{c.hint}</span>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Create follow-up (wizard)                                                  */
/* -------------------------------------------------------------------------- */
function CreateFollowupButton({
  campaignId,
  onCreated,
}: {
  campaignId: string
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [minClicks, setMinClicks] = useState(1)
  const [recencyDays, setRecencyDays] = useState<string>("0")
  const [ctaUrl, setCtaUrl] = useState("https://calendar.app.google/9dgtQgkiDtMMTJ5d7")
  const [submitting, setSubmitting] = useState(false)

  const recencyParam = recencyDays === "0" ? "" : `&recency_days=${recencyDays}`
  const { data: audience } = useSWR(
    open ? `/api/dem/warm/audience?c=${campaignId}&min_clicks=${minClicks}${recencyParam}` : null,
    fetcher
  )

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/dem/warm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_campaign_id: campaignId,
          cta_url: ctaUrl,
          audience_config: {
            min_clicks: minClicks,
            recency_days: recencyDays === "0" ? null : Number(recencyDays),
          },
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        toast({ title: "Errore", description: payload.error || "Creazione non riuscita", variant: "destructive" })
        return
      }
      toast({
        title: "Sequenza creata",
        description: `${payload.enrolled ?? 0} contatti caldi arruolati.`,
      })
      setOpen(false)
      onCreated()
    } catch {
      toast({ title: "Errore", description: "Errore di rete", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Crea sollecito caldo
      </Button>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crea sequenza di solleciti</DialogTitle>
          <DialogDescription>
            Definisci il pubblico caldo. Verranno creati {MAX_STEPS} step modificabili
            (il 1° immediato, gli altri a distanza di alcuni giorni).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="min-clicks">Click minimi sull&apos;originale</Label>
            <Select value={String(minClicks)} onValueChange={(v) => setMinClicks(Number(v))}>
              <SelectTrigger id="min-clicks">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Almeno 1 click</SelectItem>
                <SelectItem value="2">Almeno 2 click</SelectItem>
                <SelectItem value="3">Almeno 3 click</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="recency">Finestra temporale click</Label>
            <Select value={recencyDays} onValueChange={setRecencyDays}>
              <SelectTrigger id="recency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Qualsiasi data</SelectItem>
                <SelectItem value="7">Ultimi 7 giorni</SelectItem>
                <SelectItem value="14">Ultimi 14 giorni</SelectItem>
                <SelectItem value="30">Ultimi 30 giorni</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cta-url">Link prenotazione (CTA)</Label>
            <Input
              id="cta-url"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://calendar.app.google/..."
            />
            <p className="text-xs text-muted-foreground">
              I click su questo link vengono tracciati come interesse alla demo.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pubblico stimato</span>
              <span className="text-2xl font-bold text-foreground">
                {audience ? (audience.count ?? 0).toLocaleString("it-IT") : "—"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              contatti riceveranno i solleciti
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Annulla
          </Button>
          <Button onClick={handleCreate} disabled={submitting}>
            {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Flame className="mr-1.5 h-4 w-4" />}
            Crea sequenza
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------------------------------------------------------- */
/* Status controls (activate/pause/stop/delete)                               */
/* -------------------------------------------------------------------------- */
function FollowupStatusControls({
  followup,
  onChange,
}: {
  followup: Followup
  onChange: () => void
}) {
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  const patch = async (action: string) => {
    setBusy(true)
    try {
      const res = await fetch("/api/dem/warm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followup_id: followup.id, action }),
      })
      const payload = await res.json()
      if (!res.ok) {
        toast({ title: "Errore", description: payload.error, variant: "destructive" })
        return
      }
      onChange()
    } finally {
      setBusy(false)
    }
  }

  const del = async () => {
    if (!confirm("Eliminare la sequenza di solleciti e le campagne figlie collegate?")) return
    setBusy(true)
    try {
      const res = await fetch(`/api/dem/warm?followup_id=${followup.id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Sequenza eliminata" })
        onChange()
      }
    } finally {
      setBusy(false)
    }
  }

  const statusBadge: Record<string, { label: string; cls: string }> = {
    draft: { label: "Bozza", cls: "bg-muted text-muted-foreground" },
    active: { label: "Attiva", cls: "bg-primary/15 text-primary" },
    paused: { label: "In pausa", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    stopped: { label: "Fermata", cls: "bg-destructive/15 text-destructive" },
    completed: { label: "Completata", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  }
  const sb = statusBadge[followup.status] || statusBadge.draft

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className={`${sb.cls} border-0`}>{sb.label}</Badge>
      {(followup.status === "draft" || followup.status === "stopped") && (
        <Button size="sm" onClick={() => patch("activate")} disabled={busy}>
          <Play className="mr-1.5 h-4 w-4" />
          Attiva
        </Button>
      )}
      {followup.status === "active" && (
        <Button size="sm" variant="outline" onClick={() => patch("pause")} disabled={busy}>
          <Pause className="mr-1.5 h-4 w-4" />
          Pausa
        </Button>
      )}
      {followup.status === "paused" && (
        <Button size="sm" onClick={() => patch("resume")} disabled={busy}>
          <Play className="mr-1.5 h-4 w-4" />
          Riprendi
        </Button>
      )}
      {(followup.status === "active" || followup.status === "paused") && (
        <Button size="sm" variant="outline" onClick={() => patch("stop")} disabled={busy}>
          <Square className="mr-1.5 h-4 w-4" />
          Ferma
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={del} disabled={busy} className="text-destructive hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Overview tab: audience + quota + steps                                     */
/* -------------------------------------------------------------------------- */
function OverviewTab({ data, onChange }: { data: WarmData; onChange: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <AudienceCard data={data} onChange={onChange} />
      <QuotaCard data={data} onChange={onChange} />
      <StepsCard data={data} onChange={onChange} />
    </div>
  )
}

function AudienceCard({ data, onChange }: { data: WarmData; onChange: () => void }) {
  const { toast } = useToast()
  const followup = data.followup!
  const [minClicks, setMinClicks] = useState(String(followup.audience_config?.min_clicks ?? 1))
  const [recencyDays, setRecencyDays] = useState(
    followup.audience_config?.recency_days ? String(followup.audience_config.recency_days) : "0"
  )
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/dem/warm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followup_id: followup.id,
          audience_config: {
            min_clicks: Number(minClicks),
            recency_days: recencyDays === "0" ? null : Number(recencyDays),
          },
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        toast({ title: "Errore", description: payload.error, variant: "destructive" })
        return
      }
      toast({ title: "Pubblico aggiornato", description: `${payload.enrolled ?? 0} contatti arruolati.` })
      onChange()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          Pubblico caldo
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Click minimi</Label>
            <Select value={minClicks} onValueChange={setMinClicks}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Almeno 1 click</SelectItem>
                <SelectItem value="2">Almeno 2 click</SelectItem>
                <SelectItem value="3">Almeno 3 click</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Finestra temporale</Label>
            <Select value={recencyDays} onValueChange={setRecencyDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Qualsiasi data</SelectItem>
                <SelectItem value="7">Ultimi 7 giorni</SelectItem>
                <SelectItem value="14">Ultimi 14 giorni</SelectItem>
                <SelectItem value="30">Ultimi 30 giorni</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Salvando, il pubblico viene ri-arruolato. I contatti esclusi o che hanno gia&apos;
          risposto restano fuori.
        </p>
        <div>
          <Button size="sm" variant="outline" onClick={save} disabled={busy}>
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
            Aggiorna pubblico
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function QuotaCard({ data, onChange }: { data: WarmData; onChange: () => void }) {
  const { toast } = useToast()
  const [total, setTotal] = useState(data.quota.total != null ? String(data.quota.total) : "")
  const [cold, setCold] = useState(data.quota.cold != null ? String(data.quota.cold) : "")
  const [warm, setWarm] = useState(data.quota.warm != null ? String(data.quota.warm) : "")
  const [reallocate, setReallocate] = useState(data.quota.reallocate)
  const [priority, setPriority] = useState(data.quota.priority)
  const [busy, setBusy] = useState(false)

  const num = (s: string) => (s.trim() === "" ? null : Number(s))
  const invalid =
    num(total) != null &&
    num(cold) != null &&
    num(warm) != null &&
    (num(cold) as number) + (num(warm) as number) > (num(total) as number)

  const save = async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/dem/warm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_campaign_id: data.campaign.id,
          quota: { total: num(total), cold: num(cold), warm: num(warm), reallocate, priority },
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        toast({ title: "Errore", description: payload.error, variant: "destructive" })
        return
      }
      toast({ title: "Quota salvata" })
      onChange()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="h-4 w-4 text-primary" />
          Quota giornaliera
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="q-total">Totale / giorno</Label>
            <Input id="q-total" type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} placeholder="es. 2500" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="q-cold">Freddi / giorno</Label>
            <Input id="q-cold" type="number" min={0} value={cold} onChange={(e) => setCold(e.target.value)} placeholder="es. 2000" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="q-warm">Caldi / giorno</Label>
            <Input id="q-warm" type="number" min={0} value={warm} onChange={(e) => setWarm(e.target.value)} placeholder="es. 500" />
          </div>
        </div>
        {invalid && (
          <p className="text-xs font-medium text-destructive">
            La somma di freddi e caldi non puo&apos; superare la quota totale.
          </p>
        )}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Riassegna inutilizzati</span>
              <span className="text-xs text-muted-foreground">
                Se i freddi non saturano la quota, usa il residuo per i caldi.
              </span>
            </div>
            <Switch checked={reallocate} onCheckedChange={setReallocate} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Priorita&apos; ai caldi</span>
              <span className="text-xs text-muted-foreground">
                I solleciti caldi hanno precedenza sulla quota totale.
              </span>
            </div>
            <Switch checked={priority} onCheckedChange={setPriority} />
          </div>
        </div>
        <div>
          <Button size="sm" variant="outline" onClick={save} disabled={busy || invalid}>
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Salva quota
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StepsCard({ data, onChange }: { data: WarmData; onChange: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-primary" />
          Sequenza ({data.steps.length} step)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {data.steps.map((step) => (
          <StepEditor key={step.id} step={step} campaignId={data.campaign.id} onChange={onChange} />
        ))}
      </CardContent>
    </Card>
  )
}

function StepEditor({
  step,
  campaignId,
  onChange,
}: {
  step: Step
  campaignId: string
  onChange: () => void
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [enabled, setEnabled] = useState(step.enabled)
  const [subject, setSubject] = useState(step.subject)
  const [delayDays, setDelayDays] = useState(String(step.delay_days))
  const [ctaUrl, setCtaUrl] = useState(step.cta_url || "")
  const [html, setHtml] = useState(step.html_template)
  const [testEmail, setTestEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [testing, setTesting] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/dem/warm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: {
            id: step.id,
            enabled,
            subject,
            delay_days: Number(delayDays),
            cta_url: ctaUrl,
            html_template: html,
          },
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        toast({ title: "Errore", description: payload.error, variant: "destructive" })
        return
      }
      toast({ title: `Sollecito ${step.step_number} salvato` })
      setOpen(false)
      onChange()
    } finally {
      setBusy(false)
    }
  }

  const regenerate = async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/dem/warm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: { id: step.id, regenerate: true } }),
      })
      const payload = await res.json()
      if (!res.ok) {
        toast({ title: "Errore", description: payload.error, variant: "destructive" })
        return
      }
      toast({
        title: "Grafica rigenerata",
        description: "Template aggiornato con logo e impaginazione piu' recenti.",
      })
      setOpen(false)
      onChange()
    } finally {
      setBusy(false)
    }
  }

  const sendTest = async () => {
    if (!testEmail) return
    setTesting(true)
    try {
      const res = await fetch("/api/dem/warm/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step_id: step.id, email: testEmail }),
      })
      const payload = await res.json()
      if (!res.ok) {
        toast({ title: "Errore", description: payload.error, variant: "destructive" })
        return
      }
      toast({ title: "Email di test inviata", description: testEmail })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {step.step_number}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{step.subject || "(nessun oggetto)"}</span>
            <span className="text-xs text-muted-foreground">
              {step.delay_days === 0 ? "Invio immediato" : `Dopo ${step.delay_days} giorni`}
              {step.status === "sent" ? " · inviato" : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!step.enabled && <Badge variant="outline">Disattivo</Badge>}
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Modifica
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sollecito {step.step_number}</DialogTitle>
            <DialogDescription>
              Modifica oggetto, ritardo, link e contenuto HTML del sollecito.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor={`enabled-${step.id}`} className="cursor-pointer">
                Step attivo
              </Label>
              <Switch id={`enabled-${step.id}`} checked={enabled} onCheckedChange={setEnabled} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`subject-${step.id}`}>Oggetto</Label>
              <Input id={`subject-${step.id}`} value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`delay-${step.id}`}>Ritardo (giorni)</Label>
                <Input
                  id={`delay-${step.id}`}
                  type="number"
                  min={0}
                  value={delayDays}
                  onChange={(e) => setDelayDays(e.target.value)}
                  disabled={step.step_number === 1}
                />
                {step.step_number === 1 && (
                  <p className="text-xs text-muted-foreground">Il 1° sollecito parte subito.</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`cta-${step.id}`}>Link CTA</Label>
                <Input id={`cta-${step.id}`} value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`html-${step.id}`}>Contenuto HTML</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1.5 text-xs"
                  onClick={regenerate}
                  disabled={busy}
                  title="Ri-applica il template grafico di default (logo Santaddeo, tagline, footer 4bid) mantenendo il link CTA"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Rigenera grafica
                </Button>
              </div>
              <Textarea
                id={`html-${step.id}`}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="min-h-[200px] font-mono text-xs"
              />
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <Label htmlFor={`test-${step.id}`}>Invia un&apos;email di test</Label>
              <div className="flex gap-2">
                <Input
                  id={`test-${step.id}`}
                  type="email"
                  placeholder="tua@email.it"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button variant="outline" onClick={sendTest} disabled={testing || !testEmail}>
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Annulla
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Warm recipients tab                                                        */
/* -------------------------------------------------------------------------- */
function WarmRecipientsTab({
  followupId,
  onChange,
}: {
  followupId: string
  onChange: () => void
}) {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(0)
  const [rowBusy, setRowBusy] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(0)
  }, [debounced, status])

  const key = `/api/dem/warm/recipients?followup_id=${followupId}&search=${encodeURIComponent(
    debounced
  )}&status=${status}&page=${page}`
  const { data, isLoading, mutate: mutateRows } = useSWR(key, fetcher, { revalidateOnFocus: false })

  const recipients = data?.recipients || []
  const filteredTotal = data?.filteredTotal || 0
  const pageSize = data?.pageSize || 200
  const lastPage = Math.max(0, Math.ceil(filteredTotal / pageSize) - 1)

  const rowAction = async (id: string, action: string) => {
    setRowBusy(id)
    try {
      const res = await fetch("/api/dem/warm/recipients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      })
      const payload = await res.json()
      if (!res.ok) {
        toast({ title: "Errore", description: payload.error, variant: "destructive" })
        return
      }
      if (action === "send_single") toast({ title: `Sollecito ${payload.step} inviato` })
      mutateRows()
      onChange()
    } finally {
      setRowBusy(null)
    }
  }

  const markStatus = async (id: string, newStatus: string) => {
    setRowBusy(id)
    try {
      const res = await fetch("/api/dem/warm/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })
      const payload = await res.json()
      if (!res.ok) {
        toast({ title: "Errore", description: payload.error, variant: "destructive" })
        return
      }
      toast({
        title: "Stato aggiornato",
        description: payload.stopped ? "Sequenza fermata per questo contatto." : undefined,
      })
      mutateRows()
      onChange()
    } finally {
      setRowBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Cerca per email, nome, azienda…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:max-w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="eligible">Eleggibili</SelectItem>
            <SelectItem value="excluded">Esclusi</SelectItem>
            {COMMERCIAL_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {COMMERCIAL_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground sm:ml-auto">
          {filteredTotal.toLocaleString("it-IT")} contatti
        </span>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contatto</TableHead>
                <TableHead className="hidden md:table-cell">Citta&apos;</TableHead>
                <TableHead className="text-center">Click orig.</TableHead>
                <TableHead className="text-center">Solleciti</TableHead>
                <TableHead className="text-center">Calendario</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && recipients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Nessun contatto.
                  </TableCell>
                </TableRow>
              )}
              {recipients.map((r: Record<string, unknown>) => {
                const id = r.id as string
                const excluded = r.excluded as boolean
                const cs = r.commercial_status as string
                return (
                  <TableRow key={id} className={excluded ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{(r.email as string) || "—"}</span>
                        <span className="text-xs text-muted-foreground">
                          {[r.nome, r.cognome].filter(Boolean).join(" ") || (r.nome_azienda as string) || ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {(r.citta as string) || "—"}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{(r.orig_click_count as number) || 0}</TableCell>
                    <TableCell className="text-center tabular-nums">
                      {(r.followups_sent as number) || 0}/{MAX_STEPS}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{(r.calendar_clicks as number) || 0}</TableCell>
                    <TableCell>
                      <Select
                        value={cs}
                        onValueChange={(v) => markStatus(id, v)}
                        disabled={rowBusy === id}
                      >
                        <SelectTrigger className="h-8 w-[170px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMERCIAL_STATUS_ORDER.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {COMMERCIAL_STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!excluded && (r.responded as boolean) !== true && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Invia prossimo sollecito"
                            onClick={() => rowAction(id, "send_single")}
                            disabled={rowBusy === id}
                          >
                            {rowBusy === id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          </Button>
                        )}
                        {excluded ? (
                          <Button size="sm" variant="ghost" onClick={() => rowAction(id, "restore")} disabled={rowBusy === id}>
                            Ripristina
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            title="Escludi"
                            onClick={() => rowAction(id, "exclude")}
                            disabled={rowBusy === id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {lastPage > 0 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            Precedente
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {page + 1} di {lastPage + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page >= lastPage}
          >
            Successiva
          </Button>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Funnel tab                                                                 */
/* -------------------------------------------------------------------------- */
function FunnelTab({
  funnel,
  summary,
}: {
  funnel: Array<{ key: string; label: string; value: number }>
  summary?: WarmData["summary"]
}) {
  const max = useMemo(() => Math.max(1, ...funnel.map((f) => f.value)), [funnel])
  const base = funnel[0]?.value || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          Funnel di conversione
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {funnel.map((f) => {
          const pct = base > 0 ? Math.round((f.value / base) * 100) : 0
          return (
            <div key={f.key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{f.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {f.value.toLocaleString("it-IT")}
                  {f.key !== "sent" && base > 0 ? ` · ${pct}%` : ""}
                </span>
              </div>
              <Progress value={(f.value / max) * 100} className="h-2" />
            </div>
          )
        })}
        {summary && (
          <div className="mt-2 grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Eleggibili ora</span>
              <span className="text-lg font-bold text-foreground">{summary.eligible}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Esclusi</span>
              <span className="text-lg font-bold text-foreground">{summary.excluded}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Non interessati</span>
              <span className="text-lg font-bold text-foreground">{summary.not_interested}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Demo+</span>
              <span className="text-lg font-bold text-foreground">{summary.demos}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
