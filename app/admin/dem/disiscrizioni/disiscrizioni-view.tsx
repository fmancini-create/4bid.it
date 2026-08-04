"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ShieldOff,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

interface Unsubscribe {
  id: string
  email: string
  campaign_id: string | null
  reason: string | null
  // Distingue un indirizzo inesistente da un problema passeggero: senza questo
  // non si sa quali indirizzi rimuovere davvero dalla lista.
  bounce_type: string | null
  bounce_subtype: string | null
  created_at: string
}

interface ApiResponse {
  unsubscribes: Unsubscribe[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("it-IT").format(n)
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

const REASON_LABELS: Record<string, string> = {
  manuale: "Manuale",
  "one-click": "One-click",
  link: "Link email",
  // Erano assenti pur essendo i motivi piu' frequenti: la colonna mostrava il
  // valore tecnico grezzo.
  bounce: "Rimbalzo",
  complaint: "Segnalato come spam",
}

export default function DisiscrizioniView() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [page, setPage] = useState(0)

  const [addInput, setAddInput] = useState("")
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search)
      setPage(0)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (debounced) params.set("search", debounced)
      const res = await fetch(`/api/dem/unsubscribes?${params.toString()}`)
      if (!res.ok) throw new Error("Errore nel caricamento")
      setData(await res.json())
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Errore", error: true })
    } finally {
      setLoading(false)
    }
  }, [page, debounced])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const showMessage = (text: string, error = false) => {
    setMessage({ text, error })
    setTimeout(() => setMessage(null), 5000)
  }

  const addEmails = async () => {
    if (!addInput.trim()) return
    setAdding(true)
    setMessage(null)
    try {
      const res = await fetch("/api/dem/unsubscribes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: addInput }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Errore")
      setAddInput("")
      showMessage(`${formatNumber(json.added)} indirizzo/i aggiunto/i alla lista di disiscrizione.`)
      setPage(0)
      fetchData()
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Errore", true)
    } finally {
      setAdding(false)
    }
  }

  const removeEmail = async (email: string) => {
    if (!confirm(`Rimuovere "${email}" dalla lista di disiscrizione?\n\nTornera' a poter ricevere le email.`)) {
      return
    }
    try {
      const res = await fetch(`/api/dem/unsubscribes?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Errore")
      showMessage(`"${email}" rimosso dalla lista.`)
      fetchData()
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Errore", true)
    }
  }

  const totalPages = data?.totalPages ?? 1
  const startIdx = data ? data.page * data.pageSize : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/dem"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alle campagne
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-balance">
            <ShieldOff className="h-6 w-6 text-orange-500" />
            Disiscrizioni
          </h1>
          <p className="text-sm text-muted-foreground">
            Gli indirizzi in questa lista (suppression list) vengono esclusi automaticamente da ogni
            invio. Vengono aggiunti quando un contatto clicca &quot;disiscriviti&quot; oppure
            manualmente qui sotto.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
              message.error
                ? "border-destructive/20 bg-destructive/10 text-destructive"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
            }`}
          >
            {message.error ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Add form */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Aggiungi disiscrizioni</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              placeholder="Inserisci uno o piu' indirizzi email, separati da virgola, punto e virgola o a capo..."
              rows={3}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Puoi incollare piu&apos; indirizzi insieme: vengono normalizzati e deduplicati.
              </p>
              <Button onClick={addEmails} disabled={adding || !addInput.trim()} size="sm">
                <Plus className="mr-1 h-4 w-4" />
                {adding ? "Aggiunta..." : "Aggiungi"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cerca per email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {data && (
            <Badge variant="secondary" className="whitespace-nowrap">
              {formatNumber(data.total)} disiscritti
            </Badge>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Origine</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && !data ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        Caricamento...
                      </TableCell>
                    </TableRow>
                  ) : data && data.unsubscribes.length > 0 ? (
                    data.unsubscribes.map((u, i) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatNumber(startIdx + i + 1)}
                        </TableCell>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className="font-normal">
                              {REASON_LABELS[u.reason || ""] || u.reason || "—"}
                            </Badge>
                            {u.bounce_type === "Permanent" && (
                              <Badge variant="destructive" className="font-normal" title={u.bounce_subtype || undefined}>
                                Indirizzo inesistente
                              </Badge>
                            )}
                            {u.bounce_type === "Temporary" && (
                              <Badge variant="secondary" className="font-normal" title={u.bounce_subtype || undefined}>
                                Problema temporaneo
                              </Badge>
                            )}
                            {/* I rimbalzi registrati prima del 03/08/2026 non hanno il tipo:
                                dichiararlo evita di leggerli come "verificati". */}
                            {u.reason === "bounce" && !u.bounce_type && (
                              <Badge variant="outline" className="font-normal text-muted-foreground">
                                Tipo non registrato
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(u.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmail(u.email)}
                            className="text-destructive hover:text-destructive"
                            title="Rimuovi dalla lista (re-iscrivi)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        {debounced
                          ? "Nessuna disiscrizione corrisponde alla ricerca."
                          : "Nessuna disiscrizione registrata."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.total > data.pageSize && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Pagina {formatNumber(data.page + 1)} di {formatNumber(totalPages)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data.page <= 0 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Precedente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={data.page >= totalPages - 1 || loading}
              >
                Successiva
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
