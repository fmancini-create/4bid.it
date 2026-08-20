"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Play, Pencil, Trash2, Calendar, Clock, ImageIcon, Sparkles, Video } from "lucide-react"
import { piattaformeSenzaVideoLibreria } from "@/lib/social/campaign-video"

type TopicRule = {
  id: string
  topic_name: string
  is_active: boolean
  frequency_days: number
  batch_size: number
  start_date: string | null
  end_date: string | null
  exclude_weekdays: number[] | null
  time_windows: Array<{ start: string; end: string }> | null
  platforms: string[] | null
  target_accounts: string[] | null
  tone: string | null
  default_hashtags: string[] | null
  link_url: string | null
  image_style_prompt: string | null
  auto_publish: boolean
  notes: string | null
  last_generated_at: string | null
  posts_generated_count: number
  include_hashtags: boolean | null
  use_library_video: boolean | null
  /** Lista VUOTA = tutti i video visibili della libreria, non "nessuno". */
  video_ids: string[] | null
}

type VideoLibreria = {
  video_id: string
  title: string | null
  thumbnail_url: string | null
  sort_order: number | null
}

type SocialAccount = {
  id: string
  platform: "facebook" | "instagram" | "linkedin"
  account_name: string
  account_id: string | null
  page_id?: string | null
  is_active: boolean
}

const WEEKDAYS = [
  { v: 1, l: "Lun" },
  { v: 2, l: "Mar" },
  { v: 3, l: "Mer" },
  { v: 4, l: "Gio" },
  { v: 5, l: "Ven" },
  { v: 6, l: "Sab" },
  { v: 0, l: "Dom" },
]

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
}

function emptyForm(): Partial<TopicRule> {
  return {
    topic_name: "",
    is_active: true,
    frequency_days: 3,
    batch_size: 1,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: null,
    exclude_weekdays: [],
    time_windows: [{ start: "09:30", end: "12:00" }],
    platforms: ["facebook", "linkedin"],
    target_accounts: [],
    tone: "professional",
    default_hashtags: [],
    link_url: "",
    image_style_prompt: "",
    auto_publish: true,
    notes: "",
    include_hashtags: true,
    // Spento di default: accendere i video cambia cio' che esce sui canali, e
    // non deve succedere per una campagna appena creata senza che sia scelto.
    use_library_video: false,
    video_ids: [],
  }
}

export function CampaignsManager({ accounts = [] }: { accounts?: SocialAccount[] }) {
  const { toast } = useToast()
  const [rules, setRules] = useState<TopicRule[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<TopicRule>>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [hashtagsRaw, setHashtagsRaw] = useState("")
  const [videoLibreria, setVideoLibreria] = useState<VideoLibreria[]>([])
  // Distinguo "libreria vuota" da "libreria non caricata": senza questo, un
  // errore di rete mostrerebbe "nessun video" come se fosse un dato vero.
  const [erroreLibreria, setErroreLibreria] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/social/topic-rules", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "errore")
      setRules(json.rules || [])
    } catch (e) {
      toast({ title: "Errore", description: e instanceof Error ? e.message : "errore", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function caricaLibreria() {
    try {
      const res = await fetch("/api/social/library-videos", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "errore")
      setVideoLibreria(json.videos || [])
      setErroreLibreria(null)
    } catch (e) {
      // Non un toast: l'errore va mostrato DOVE serve la scelta, altrimenti
      // l'operatore vede un elenco vuoto e conclude di non avere video.
      setErroreLibreria(e instanceof Error ? e.message : "errore")
      setVideoLibreria([])
    }
  }

  useEffect(() => {
    load()
    caricaLibreria()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setHashtagsRaw("")
    setDialogOpen(true)
  }

  function openEdit(r: TopicRule) {
    setEditingId(r.id)
    setForm({
      ...r,
      start_date: r.start_date || new Date().toISOString().slice(0, 10),
      time_windows: r.time_windows?.length ? r.time_windows : [{ start: "09:30", end: "12:00" }],
      exclude_weekdays: r.exclude_weekdays || [],
      platforms: r.platforms || ["facebook", "linkedin"],
      target_accounts: r.target_accounts || [],
      default_hashtags: r.default_hashtags || [],
      // `video_ids` e' NOT NULL nel database: inoltrare il null di una campagna
      // creata prima di questa funzione farebbe fallire il salvataggio con un
      // errore incomprensibile su un campo che l'operatore non ha toccato.
      use_library_video: Boolean(r.use_library_video),
      video_ids: r.video_ids || [],
    })
    setHashtagsRaw((r.default_hashtags || []).join(" "))
    setDialogOpen(true)
  }

  async function save() {
    if (!form.topic_name?.trim()) {
      toast({ title: "Topic richiesto", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const default_hashtags = hashtagsRaw
        .split(/\s+/)
        .map((h) => h.trim())
        .filter(Boolean)
        .map((h) => (h.startsWith("#") ? h : `#${h}`))
      const payload = { ...form, default_hashtags }
      const url = editingId ? `/api/social/topic-rules/${editingId}` : "/api/social/topic-rules"
      const method = editingId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "errore")
      toast({ title: editingId ? "Campagna aggiornata" : "Campagna creata" })
      setDialogOpen(false)
      load()
    } catch (e) {
      toast({ title: "Errore", description: e instanceof Error ? e.message : "errore", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm("Eliminare la campagna? I post gia' generati restano in archivio.")) return
    try {
      const res = await fetch(`/api/social/topic-rules/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || "errore")
      }
      toast({ title: "Campagna eliminata" })
      load()
    } catch (e) {
      toast({ title: "Errore", description: e instanceof Error ? e.message : "errore", variant: "destructive" })
    }
  }

  async function runNow(id: string) {
    setRunning(id)
    try {
      const res = await fetch(`/api/social/topic-rules/${id}/run-now`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "errore")
      toast({
        title: "Generati " + (json.created || 0) + " post",
        description:
          (json.errors?.length ? `Errori: ${json.errors.length}. ` : "") +
          "Vai nella tab Programmati per vederli.",
      })
      load()
    } catch (e) {
      toast({ title: "Errore", description: e instanceof Error ? e.message : "errore", variant: "destructive" })
    } finally {
      setRunning(null)
    }
  }

  function toggleWeekday(d: number) {
    const cur = new Set(form.exclude_weekdays || [])
    if (cur.has(d)) cur.delete(d)
    else cur.add(d)
    setForm({ ...form, exclude_weekdays: Array.from(cur).sort() })
  }

  function togglePlatform(p: string) {
    const cur = new Set(form.platforms || [])
    if (cur.has(p)) cur.delete(p)
    else cur.add(p)
    const nextPlatforms = Array.from(cur)
    // Rimuovi dalle pagine selezionate quelle di piattaforme non piu' attive.
    const validIds = new Set(accounts.filter((a) => nextPlatforms.includes(a.platform)).map((a) => a.id))
    const nextTargets = (form.target_accounts || []).filter((id) => validIds.has(id))
    setForm({ ...form, platforms: nextPlatforms, target_accounts: nextTargets })
  }

  function toggleAccount(id: string) {
    const cur = new Set(form.target_accounts || [])
    if (cur.has(id)) cur.delete(id)
    else cur.add(id)
    setForm({ ...form, target_accounts: Array.from(cur) })
  }

  function updateWindow(i: number, key: "start" | "end", val: string) {
    const wins = [...(form.time_windows || [])]
    wins[i] = { ...wins[i], [key]: val }
    setForm({ ...form, time_windows: wins })
  }

  function addWindow() {
    setForm({ ...form, time_windows: [...(form.time_windows || []), { start: "15:00", end: "18:00" }] })
  }

  function removeWindow(i: number) {
    const wins = [...(form.time_windows || [])]
    wins.splice(i, 1)
    setForm({ ...form, time_windows: wins.length ? wins : [{ start: "09:30", end: "12:00" }] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Campagne automatiche</h3>
          <p className="text-xs text-muted-foreground">
            Definisci un argomento, una cadenza e degli orari: il sistema genera testo + immagine + scheduling.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nuova campagna
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 mx-auto animate-spin" />
          </CardContent>
        </Card>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nessuna campagna ancora. Creane una per iniziare a generare post in automatico.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rules.map((r) => {
            const lastGen = r.last_generated_at ? new Date(r.last_generated_at) : null
            const due = !lastGen || (Date.now() - lastGen.getTime()) / 86400000 >= r.frequency_days
            return (
              <Card key={r.id} className={r.is_active ? "" : "opacity-60"}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
                        <span className="truncate">{r.topic_name}</span>
                        {!r.is_active && (
                          <Badge variant="outline" className="text-[10px]">
                            disattiva
                          </Badge>
                        )}
                        {r.is_active && due && (
                          <Badge variant="default" className="text-[10px]">
                            pronta
                          </Badge>
                        )}
                        {!r.auto_publish && (
                          <Badge variant="secondary" className="text-[10px]">
                            richiede approvazione
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs flex items-center gap-3 flex-wrap mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> ogni {r.frequency_days}g · {r.batch_size} post/run
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {r.time_windows?.map((w) => `${w.start}-${w.end}`).join(", ") || "—"}
                        </span>
                        {r.use_library_video ? (
                          // Il video vince sull'immagine, come nel generatore: mostrare
                          // "con immagine" per una campagna che pubblica video sarebbe
                          // un'etichetta che contraddice cio' che esce davvero.
                          <span className="flex items-center gap-1">
                            <Video className="h-3 w-3" /> video a rotazione
                            {(r.video_ids || []).length > 0 ? ` (${(r.video_ids || []).length})` : ""}
                          </span>
                        ) : (
                          r.image_style_prompt && (
                            <span className="flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" /> con immagine
                            </span>
                          )
                        )}
                        <span>· {r.posts_generated_count} generati</span>
                        {(() => {
                          const names = accounts
                            .filter((a) => (r.target_accounts || []).includes(a.id))
                            .map((a) => a.account_name)
                          return (
                            <span className="flex items-center gap-1">
                              ·{" "}
                              {names.length > 0
                                ? `pagine: ${names.join(", ")}`
                                : "tutte le pagine collegate"}
                            </span>
                          )
                        })()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => runNow(r.id)}
                        disabled={running === r.id}
                      >
                        {running === r.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                        <span className="ml-1 hidden sm:inline">Esegui</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifica campagna" : "Nuova campagna"}</DialogTitle>
            <DialogDescription>
              Compila tema, cadenza e orari. Il cron giornaliero alle 9:00 UTC genera i post in automatico.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="topic">Argomento / tema</Label>
              <Input
                id="topic"
                value={form.topic_name || ""}
                onChange={(e) => setForm({ ...form, topic_name: e.target.value })}
                placeholder="Es. Santaddeo: novita' sul Revenue Management"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="notes">Note / istruzioni aggiuntive (opzionale)</Label>
              <Textarea
                id="notes"
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Es. Cita sempre case study reali. Tono entusiasta. Massimo 200 caratteri."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="freq">Cadenza (giorni)</Label>
                <Input
                  id="freq"
                  type="number"
                  min={1}
                  max={30}
                  value={form.frequency_days || 3}
                  onChange={(e) => setForm({ ...form, frequency_days: Math.max(1, Number(e.target.value) || 1) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="batch">Post per esecuzione</Label>
                <Input
                  id="batch"
                  type="number"
                  min={1}
                  max={10}
                  value={form.batch_size || 1}
                  onChange={(e) => setForm({ ...form, batch_size: Math.max(1, Number(e.target.value) || 1) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="start">Inizio</Label>
                <Input
                  id="start"
                  type="date"
                  value={form.start_date || ""}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="end">Fine (opzionale)</Label>
                <Input
                  id="end"
                  type="date"
                  value={form.end_date || ""}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value || null })}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Slot orari preferiti</Label>
              <div className="space-y-2">
                {(form.time_windows || []).map((w, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={w.start}
                      onChange={(e) => updateWindow(i, "start", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground text-xs">→</span>
                    <Input
                      type="time"
                      value={w.end}
                      onChange={(e) => updateWindow(i, "end", e.target.value)}
                      className="w-32"
                    />
                    <Button size="sm" variant="ghost" onClick={() => removeWindow(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addWindow}>
                  <Plus className="h-3 w-3 mr-1" />
                  aggiungi slot
                </Button>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Giorni da escludere</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => {
                  const excluded = (form.exclude_weekdays || []).includes(d.v)
                  return (
                    <Button
                      key={d.v}
                      type="button"
                      size="sm"
                      variant={excluded ? "default" : "outline"}
                      onClick={() => toggleWeekday(d.v)}
                      className="text-xs h-7 px-3"
                    >
                      {d.l}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Piattaforme</Label>
              <div className="flex flex-wrap gap-2">
                {["facebook", "instagram", "linkedin"].map((p) => {
                  const on = (form.platforms || []).includes(p)
                  return (
                    <Button
                      key={p}
                      type="button"
                      size="sm"
                      variant={on ? "default" : "outline"}
                      onClick={() => togglePlatform(p)}
                      className="text-xs h-7 capitalize"
                    >
                      {p}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Pagine / account di destinazione</Label>
              <p className="text-xs text-muted-foreground">
                Scegli su quali pagine pubblicare. Se non selezioni nulla, la campagna usa tutti gli account attivi
                delle piattaforme scelte.
              </p>
              {(() => {
                const selectablePlatforms = form.platforms || []
                const visibleAccounts = accounts.filter(
                  (a) => a.is_active && selectablePlatforms.includes(a.platform),
                )
                if (selectablePlatforms.length === 0) {
                  return (
                    <p className="text-xs text-muted-foreground italic">Seleziona prima almeno una piattaforma.</p>
                  )
                }
                if (visibleAccounts.length === 0) {
                  return (
                    <p className="text-xs text-muted-foreground italic">
                      Nessuna pagina collegata per le piattaforme selezionate.
                    </p>
                  )
                }
                return (
                  <div className="space-y-3">
                    {selectablePlatforms.map((platform) => {
                      const platformAccounts = visibleAccounts.filter((a) => a.platform === platform)
                      if (platformAccounts.length === 0) return null
                      return (
                        <div key={platform} className="space-y-1.5">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {PLATFORM_LABELS[platform] || platform}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {platformAccounts.map((a) => {
                              const on = (form.target_accounts || []).includes(a.id)
                              return (
                                <Button
                                  key={a.id}
                                  type="button"
                                  size="sm"
                                  variant={on ? "default" : "outline"}
                                  onClick={() => toggleAccount(a.id)}
                                  className="h-7 text-xs"
                                >
                                  {a.account_name}
                                </Button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                    {(form.target_accounts || []).length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs text-muted-foreground"
                        onClick={() => setForm({ ...form, target_accounts: [] })}
                      >
                        Deseleziona tutte (usa tutti gli account)
                      </Button>
                    )}
                  </div>
                )
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="tone">Tono</Label>
                <Select value={form.tone || "professional"} onValueChange={(v) => setForm({ ...form, tone: v })}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professionale</SelectItem>
                    <SelectItem value="casual">Amichevole</SelectItem>
                    <SelectItem value="inspirational">Ispirante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="link">Link (CTA)</Label>
                <Input
                  id="link"
                  value={form.link_url || ""}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="hashtags">Hashtag (separati da spazi, anche senza #)</Label>
              <Input
                id="hashtags"
                value={hashtagsRaw}
                onChange={(e) => setHashtagsRaw(e.target.value)}
                placeholder="RevenueManagement Hospitality 4BID"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="img">Stile immagine (vuoto = nessuna immagine)</Label>
              <Textarea
                id="img"
                rows={2}
                value={form.image_style_prompt || ""}
                onChange={(e) => setForm({ ...form, image_style_prompt: e.target.value })}
                  placeholder="Modern hotel dashboard, professional photography, blue accents"
                />
              </div>

              <div className="rounded-md border p-3 grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label htmlFor="usavideo" className="text-sm flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5" /> Usa video dalla libreria
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      I post generati usano un video a rotazione invece dell&apos;immagine.
                    </p>
                  </div>
                  <Switch
                    id="usavideo"
                    checked={Boolean(form.use_library_video)}
                    onCheckedChange={(v) => setForm({ ...form, use_library_video: v })}
                  />
                </div>

                {form.use_library_video && (
                  <div className="grid gap-2 border-t pt-3">
                    {erroreLibreria ? (
                      // Un elenco vuoto per un errore direbbe "non hai video":
                      // e' falso, e porterebbe a spegnere una funzione che va.
                      <p className="text-xs text-destructive">
                        Libreria video non leggibile ({erroreLibreria}). Riprova: finché non si carica,
                        questa campagna non userà video.
                      </p>
                    ) : videoLibreria.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Nessun video visibile nella libreria. Senza video i post restano con
                        l&apos;immagine, come prima.
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-xs">
                            Video in rotazione ({(form.video_ids || []).length || videoLibreria.length} di{" "}
                            {videoLibreria.length})
                          </Label>
                          {(form.video_ids || []).length > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => setForm({ ...form, video_ids: [] })}
                            >
                              Usa tutti
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Nessuna spunta = tutti i video visibili, a rotazione nell&apos;ordine della
                          libreria.
                        </p>
                        <div className="max-h-44 overflow-y-auto grid gap-1">
                          {videoLibreria.map((v) => {
                            const scelti = form.video_ids || []
                            const spuntato = scelti.includes(v.video_id)
                            return (
                              <label
                                key={v.video_id}
                                className="flex items-center gap-2 text-xs rounded px-1.5 py-1 hover:bg-muted cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 shrink-0"
                                  checked={spuntato}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      video_ids: e.target.checked
                                        ? [...scelti, v.video_id]
                                        : scelti.filter((x) => x !== v.video_id),
                                    })
                                  }
                                />
                                {v.thumbnail_url && (
                                  <img
                                    src={v.thumbnail_url || "/placeholder.svg"}
                                    alt=""
                                    className="h-6 w-10 object-cover rounded shrink-0"
                                  />
                                )}
                                <span className="truncate">{v.title || v.video_id}</span>
                              </label>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {/* I video della libreria sono link YouTube, e Instagram non li
                        accetta: per un Reel serve il file video. Dirlo qui, mentre si
                        configura, invece di lasciarlo scoprire da un canale che non
                        pubblica niente. */}
                    {piattaformeSenzaVideoLibreria(form.platforms || []).length > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        Instagram non accetta i link YouTube: con i video accesi questa campagna
                        pubblicherà su{" "}
                        {(form.platforms || [])
                          .filter((p) => p !== "instagram")
                          .map((p) => PLATFORM_LABELS[p] || p)
                          .join(" e ") || "nessun altro canale"}
                        , e su Instagram niente.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="auto" className="text-sm">
                  Pubblicazione automatica
                </Label>
                <p className="text-xs text-muted-foreground">
                  Se off, i post creati vanno in &ldquo;Bozze&rdquo; per la tua approvazione.
                </p>
              </div>
              <Switch
                id="auto"
                checked={!!form.auto_publish}
                onCheckedChange={(c) => setForm({ ...form, auto_publish: c })}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="active" className="text-sm">
                  Campagna attiva
                </Label>
                <p className="text-xs text-muted-foreground">Se off, il cron salta questa campagna.</p>
              </div>
              <Switch
                id="active"
                checked={!!form.is_active}
                onCheckedChange={(c) => setForm({ ...form, is_active: c })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annulla
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {editingId ? "Salva" : "Crea campagna"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
