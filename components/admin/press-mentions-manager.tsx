"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Check, X, Trash2, ExternalLink, RefreshCw, Eye, EyeOff, Plus } from "lucide-react"

export type PressMention = {
  id: string
  title: string
  url: string
  source: string | null
  snippet: string | null
  keyword: string | null
  status: "pending" | "approved" | "rejected"
  published_at: string | null
  created_at: string
}

type Props = {
  initialPending: PressMention[]
  initialApproved: PressMention[]
  initialRejected: PressMention[]
}

function formatDate(value: string | null) {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return "—"
  }
}

export function PressMentionsManager({ initialPending, initialApproved, initialRejected }: Props) {
  const [pending, setPending] = useState(initialPending)
  const [approved, setApproved] = useState(initialApproved)
  const [rejected, setRejected] = useState(initialRejected)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [savingManual, setSavingManual] = useState(false)
  const [manual, setManual] = useState({ title: "", url: "", source: "" })

  function removeFromAll(id: string): PressMention | undefined {
    let found: PressMention | undefined
    setPending((p) => {
      const hit = p.find((m) => m.id === id)
      if (hit) found = hit
      return p.filter((m) => m.id !== id)
    })
    setApproved((p) => {
      const hit = p.find((m) => m.id === id)
      if (hit) found = hit
      return p.filter((m) => m.id !== id)
    })
    setRejected((p) => {
      const hit = p.find((m) => m.id === id)
      if (hit) found = hit
      return p.filter((m) => m.id !== id)
    })
    return found
  }

  async function moderate(id: string, action: "approve" | "reject" | "delete") {
    setBusyId(id)
    try {
      const res = await fetch("/api/admin/press-mentions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Errore")

      const item = removeFromAll(id)
      if (item && action === "approve") {
        setApproved((p) => [{ ...item, status: "approved" }, ...p])
        toast.success("Notizia approvata e pubblicata")
      } else if (item && action === "reject") {
        setRejected((p) => [{ ...item, status: "rejected" }, ...p])
        toast.success("Notizia rifiutata")
      } else if (action === "delete") {
        toast.success("Notizia eliminata")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante la moderazione")
    } finally {
      setBusyId(null)
    }
  }

  async function runFetchNow() {
    setRefreshing(true)
    try {
      const res = await fetch("/api/admin/press-mentions", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Errore")
      toast.success(`Ricerca completata: ${data.inserted ?? 0} nuove notizie trovate`)
      if (data.inserted > 0) {
        // ricarica per mostrare i nuovi pending
        setTimeout(() => window.location.reload(), 800)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante la ricerca")
    } finally {
      setRefreshing(false)
    }
  }

  async function saveManual() {
    if (!manual.title.trim() || !manual.url.trim()) {
      toast.error("Titolo e URL sono obbligatori")
      return
    }
    setSavingManual(true)
    try {
      const res = await fetch("/api/admin/press-mentions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manual),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Errore")
      toast.success("Notizia aggiunta e pubblicata")
      setManual({ title: "", url: "", source: "" })
      setShowManual(false)
      setTimeout(() => window.location.reload(), 600)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante il salvataggio")
    } finally {
      setSavingManual(false)
    }
  }

  function Row({ item, context }: { item: PressMention; context: "pending" | "approved" | "rejected" }) {
    const busy = busyId === item.id
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {item.keyword && (
              <Badge variant="secondary" className="text-xs">
                {item.keyword}
              </Badge>
            )}
            {item.source && <span className="text-xs text-gray-500">{item.source}</span>}
            <span className="text-xs text-gray-400">· {formatDate(item.published_at || item.created_at)}</span>
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-start gap-1.5 font-medium text-[#2C3E50] hover:text-[#5B9BD5]"
            title={item.title}
          >
            <span className="break-words">{item.title}</span>
            <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100" />
          </a>
          {item.snippet && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.snippet}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {context !== "approved" && (
            <Button
              size="sm"
              onClick={() => moderate(item.id, "approve")}
              disabled={busy}
              className="bg-emerald-600 hover:bg-emerald-700"
              title="Approva e pubblica"
            >
              <Check className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Approva</span>
            </Button>
          )}
          {context === "approved" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => moderate(item.id, "reject")}
              disabled={busy}
              title="Nascondi dal sito"
            >
              <EyeOff className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Nascondi</span>
            </Button>
          )}
          {context !== "rejected" && context !== "approved" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => moderate(item.id, "reject")}
              disabled={busy}
              title="Rifiuta"
            >
              <X className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Rifiuta</span>
            </Button>
          )}
          {context === "rejected" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => moderate(item.id, "approve")}
              disabled={busy}
              title="Approva e pubblica"
            >
              <Eye className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Pubblica</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => moderate(item.id, "delete")}
            disabled={busy}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            title="Elimina definitivamente"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  function EmptyState({ label }: { label: string }) {
    return <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">{label}</p>
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Le notizie trovate dal cron giornaliero appaiono in <strong>In attesa</strong>. Approva quelle pertinenti per
          pubblicarle su <span className="font-mono text-xs">/parlano-di-noi</span>.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button onClick={() => setShowManual((v) => !v)} variant="outline" className="bg-transparent">
            <Plus className="h-4 w-4" />
            <span className="ml-2">Aggiungi manualmente</span>
          </Button>
          <Button onClick={runFetchNow} disabled={refreshing} variant="outline" className="bg-transparent">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="ml-2">Cerca ora</span>
          </Button>
        </div>
      </div>

      {showManual && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-1 text-sm font-semibold text-[#2C3E50]">Aggiungi una menzione manualmente</h3>
          <p className="mb-3 text-xs text-gray-500">
            Per fonti che il monitoraggio automatico non trova (Capterra, Facebook, LinkedIn, recensioni). Viene
            pubblicata subito.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Titolo della notizia *"
              value={manual.title}
              onChange={(e) => setManual((m) => ({ ...m, title: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#5B9BD5] focus:outline-none md:col-span-2"
            />
            <input
              type="url"
              placeholder="URL (https://...) *"
              value={manual.url}
              onChange={(e) => setManual((m) => ({ ...m, url: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#5B9BD5] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Fonte (es. Capterra)"
              value={manual.source}
              onChange={(e) => setManual((m) => ({ ...m, source: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#5B9BD5] focus:outline-none"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowManual(false)} disabled={savingManual}>
              Annulla
            </Button>
            <Button size="sm" onClick={saveManual} disabled={savingManual} className="bg-[#5B9BD5] hover:bg-[#4A8AC4]">
              {savingManual ? "Salvataggio..." : "Aggiungi e pubblica"}
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">In attesa ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Pubblicate ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rifiutate ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pending.length === 0 ? (
            <EmptyState label="Nessuna notizia in attesa di moderazione." />
          ) : (
            pending.map((item) => <Row key={item.id} item={item} context="pending" />)
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-3">
          {approved.length === 0 ? (
            <EmptyState label="Nessuna notizia pubblicata." />
          ) : (
            approved.map((item) => <Row key={item.id} item={item} context="approved" />)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4 space-y-3">
          {rejected.length === 0 ? (
            <EmptyState label="Nessuna notizia rifiutata." />
          ) : (
            rejected.map((item) => <Row key={item.id} item={item} context="rejected" />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
