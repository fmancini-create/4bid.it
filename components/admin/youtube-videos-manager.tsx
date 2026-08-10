"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Star, Eye, EyeOff, Trash2, RefreshCw, Plus, ExternalLink, Tag, Check, X } from "lucide-react"

export type YoutubeVideo = {
  id: string
  video_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  published_at: string | null
  source: "youtube" | "manual"
  hidden: boolean
  featured: boolean
  sort_order: number
  tags: string[]
}

function formatDate(value: string | null) {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return "—"
  }
}

export function YoutubeVideosManager({ initialVideos }: { initialVideos: YoutubeVideo[] }) {
  const [videos, setVideos] = useState(initialVideos)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [savingManual, setSavingManual] = useState(false)
  const [manual, setManual] = useState({ url: "", title: "", tags: "" })
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null)
  const [tagDraft, setTagDraft] = useState("")

  const visibleCount = videos.filter((v) => !v.hidden).length
  const featuredCount = videos.filter((v) => v.featured && !v.hidden).length

  function patchLocal(id: string, patch: Partial<YoutubeVideo>) {
    setVideos((list) => list.map((v) => (v.id === id ? { ...v, ...patch } : v)))
  }

  async function update(id: string, updates: Partial<Pick<YoutubeVideo, "hidden" | "featured" | "sort_order" | "tags">>) {
    setBusyId(id)
    try {
      const res = await fetch("/api/admin/youtube-videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Errore")
      patchLocal(id, updates)
      return true
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante l'aggiornamento")
      return false
    } finally {
      setBusyId(null)
    }
  }

  async function toggleHidden(v: YoutubeVideo) {
    const ok = await update(v.id, { hidden: !v.hidden })
    if (ok) toast.success(v.hidden ? "Video ripristinato sul sito" : "Video nascosto dal sito")
  }

  async function toggleFeatured(v: YoutubeVideo) {
    const ok = await update(v.id, { featured: !v.featured })
    if (ok) toast.success(v.featured ? "Rimosso dalle evidenze" : "Messo in evidenza (homepage)")
  }

  async function remove(v: YoutubeVideo) {
    if (!confirm(`Eliminare definitivamente "${v.title}"? Verrà reimportato al prossimo sync se ancora sul canale.`)) return
    setBusyId(v.id)
    try {
      const res = await fetch("/api/admin/youtube-videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: v.id, action: "delete" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Errore")
      setVideos((list) => list.filter((x) => x.id !== v.id))
      toast.success("Video eliminato")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante l'eliminazione")
    } finally {
      setBusyId(null)
    }
  }

  async function saveTags(v: YoutubeVideo) {
    const tags = tagDraft
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
    const ok = await update(v.id, { tags })
    if (ok) {
      toast.success("Tag aggiornati")
      setEditingTagsId(null)
    }
  }

  async function syncNow() {
    setSyncing(true)
    try {
      const res = await fetch("/api/admin/youtube-videos", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Errore")
      toast.success(`Sincronizzazione completata: ${data.inserted ?? 0} nuovi video importati`)
      if ((data.inserted ?? 0) > 0) setTimeout(() => window.location.reload(), 800)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante la sincronizzazione")
    } finally {
      setSyncing(false)
    }
  }

  async function saveManual() {
    if (!manual.url.trim()) {
      toast.error("Inserisci l'URL o l'ID del video")
      return
    }
    setSavingManual(true)
    try {
      const res = await fetch("/api/admin/youtube-videos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: manual.url,
          title: manual.title,
          tags: manual.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Errore")
      toast.success("Video aggiunto")
      setManual({ url: "", title: "", tags: "" })
      setShowManual(false)
      setTimeout(() => window.location.reload(), 600)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante il salvataggio")
    } finally {
      setSavingManual(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          I video del canale vengono importati automaticamente ogni giorno e mostrati su{" "}
          <span className="font-mono text-xs">/video-guide</span>. Metti in <strong>evidenza</strong> quelli da portare
          in homepage, <strong>nascondi</strong> quelli che non vuoi pubblicare e assegna <strong>tag</strong> per
          mostrarli nelle landing a tema.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button onClick={() => setShowManual((s) => !s)} variant="outline" className="bg-transparent">
            <Plus className="h-4 w-4" />
            <span className="ml-2">Aggiungi video</span>
          </Button>
          <Button onClick={syncNow} disabled={syncing} variant="outline" className="bg-transparent">
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            <span className="ml-2">Sincronizza ora</span>
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-600">
        <span>
          Totale: <strong>{videos.length}</strong>
        </span>
        <span>
          Visibili sul sito: <strong>{visibleCount}</strong>
        </span>
        <span>
          In evidenza (homepage): <strong>{featuredCount}</strong>
        </span>
      </div>

      {showManual && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-1 text-sm font-semibold text-[#2C3E50]">Aggiungi un video manualmente</h3>
          <p className="mb-3 text-xs text-gray-500">
            Incolla l&apos;URL YouTube (o l&apos;ID) di un video da un altro canale o non ancora rilevato dal sync.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="URL o ID YouTube *"
              value={manual.url}
              onChange={(e) => setManual((m) => ({ ...m, url: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#5B9BD5] focus:outline-none md:col-span-2"
            />
            <input
              type="text"
              placeholder="Titolo (opzionale)"
              value={manual.title}
              onChange={(e) => setManual((m) => ({ ...m, title: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#5B9BD5] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Tag separati da virgola (es. revpar, pricing)"
              value={manual.tags}
              onChange={(e) => setManual((m) => ({ ...m, tags: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#5B9BD5] focus:outline-none"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowManual(false)} disabled={savingManual}>
              Annulla
            </Button>
            <Button size="sm" onClick={saveManual} disabled={savingManual} className="bg-[#5B9BD5] hover:bg-[#4A8AC4]">
              {savingManual ? "Salvataggio..." : "Aggiungi"}
            </Button>
          </div>
        </div>
      )}

      {videos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
          Nessun video importato. Premi &quot;Sincronizza ora&quot; per importare i video del canale.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => {
            const busy = busyId === v.id
            return (
              <div
                key={v.id}
                className={`flex flex-col overflow-hidden rounded-lg border bg-white transition-opacity ${
                  v.hidden ? "border-gray-200 opacity-60" : "border-gray-200"
                }`}
              >
                <div className="relative aspect-video bg-gray-100">
                  {v.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnail_url || "/placeholder.svg"}
                      alt={v.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  <div className="absolute left-2 top-2 flex gap-1.5">
                    {v.featured && !v.hidden && (
                      <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                        <Star className="mr-1 h-3 w-3 fill-current" /> Evidenza
                      </Badge>
                    )}
                    {v.hidden && <Badge variant="secondary">Nascosto</Badge>}
                    {v.source === "manual" && (
                      <Badge variant="outline" className="bg-white/90">
                        Manuale
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <a
                    href={`https://www.youtube.com/watch?v=${v.video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-start gap-1.5 text-sm font-semibold text-[#2C3E50] hover:text-[#5B9BD5]"
                    title={v.title}
                  >
                    <span className="line-clamp-2">{v.title}</span>
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100" />
                  </a>
                  <span className="mt-1 text-xs text-gray-400">{formatDate(v.published_at)}</span>

                  {/* Tag */}
                  <div className="mt-2">
                    {editingTagsId === v.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tagDraft}
                          autoFocus
                          onChange={(e) => setTagDraft(e.target.value)}
                          placeholder="tag1, tag2"
                          className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-[#5B9BD5] focus:outline-none"
                        />
                        <button
                          onClick={() => saveTags(v)}
                          disabled={busy}
                          className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                          title="Salva tag"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingTagsId(null)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100"
                          title="Annulla"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingTagsId(v.id)
                          setTagDraft(v.tags.join(", "))
                        }}
                        className="flex flex-wrap items-center gap-1 text-xs text-gray-500 hover:text-[#5B9BD5]"
                        title="Modifica i tag (per le landing a tema)"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        {v.tags.length > 0 ? (
                          v.tags.map((t) => (
                            <span key={t} className="rounded bg-[#5B9BD5]/10 px-1.5 py-0.5 text-[#1B3A5B]">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="italic">aggiungi tag</span>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-1 border-t border-gray-100 pt-3">
                    <Button
                      size="sm"
                      variant={v.featured ? "default" : "outline"}
                      onClick={() => toggleFeatured(v)}
                      disabled={busy || v.hidden}
                      className={v.featured ? "bg-amber-500 hover:bg-amber-600" : "bg-transparent"}
                      title={v.featured ? "Rimuovi dalle evidenze" : "Metti in evidenza (homepage)"}
                    >
                      <Star className={`h-4 w-4 ${v.featured ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleHidden(v)}
                      disabled={busy}
                      className="bg-transparent"
                      title={v.hidden ? "Mostra sul sito" : "Nascondi dal sito"}
                    >
                      {v.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(v)}
                      disabled={busy}
                      className="ml-auto text-red-600 hover:bg-red-50 hover:text-red-700"
                      title="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
