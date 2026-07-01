"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  FileText,
  Plus,
  Send,
  Trash2,
  Copy,
  ExternalLink,
  Pencil,
  X,
  CheckCircle2,
  Clock,
  CreditCard,
  Banknote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  formatQuoteAmount,
  type QuoteLineItem,
  type QuoteRequestedField,
  type SalesChannelQuote,
} from "@/lib/quotes/types"

const FIELD_TYPES: { value: QuoteRequestedField["type"]; label: string }[] = [
  { value: "text", label: "Testo breve" },
  { value: "textarea", label: "Testo lungo" },
  { value: "password", label: "Credenziale/Password" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL / Link" },
]

const STATUS_META: Record<
  SalesChannelQuote["status"],
  { label: string; className: string }
> = {
  draft: { label: "Bozza", className: "bg-muted text-muted-foreground" },
  sent: { label: "Inviato", className: "bg-blue-100 text-blue-800" },
  accepted: { label: "Accettato", className: "bg-amber-100 text-amber-800" },
  paid: { label: "Pagato", className: "bg-green-100 text-green-800" },
}

type EditableQuote = Partial<SalesChannelQuote>

function emptyQuote(): EditableQuote {
  return {
    client_name: "",
    client_company: "",
    client_email: "",
    client_vat: "",
    client_address: "",
    title: "Ottimizzazione Canali di Vendita",
    description: "",
    payment_terms: "",
    line_items: [],
    total_amount: null,
    deposit_amount: null,
    vat_included: true,
    currency: "eur",
    requested_fields: [],
  }
}

function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || `campo_${Date.now()}`
  )
}

export default function QuotesDashboard({ initialQuotes }: { initialQuotes: SalesChannelQuote[] }) {
  const [quotes, setQuotes] = useState<SalesChannelQuote[]>(initialQuotes)
  const [editing, setEditing] = useState<EditableQuote | null>(null)
  const [saving, setSaving] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)

  const isNew = editing != null && !editing.id

  function openNew() {
    setEditing(emptyQuote())
  }

  function openEdit(q: SalesChannelQuote) {
    setEditing({ ...q })
  }

  async function refresh() {
    const res = await fetch("/api/quotes")
    if (res.ok) setQuotes(await res.json())
  }

  async function handleSave() {
    if (!editing) return
    if (!editing.client_name?.trim() && !editing.client_company?.trim()) {
      toast.error("Inserisci almeno nome o azienda dell'intestatario")
      return
    }
    setSaving(true)
    try {
      const url = isNew ? "/api/quotes" : `/api/quotes/${editing.id}`
      const method = isNew ? "POST" : "PATCH"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Errore salvataggio")
      }
      toast.success(isNew ? "Preventivo creato" : "Preventivo aggiornato")
      setEditing(null)
      await refresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSend(q: SalesChannelQuote) {
    if (!q.client_email) {
      toast.error("Imposta l'email del cliente prima di inviare")
      return
    }
    setSendingId(q.id)
    try {
      const res = await fetch(`/api/quotes/${q.id}/send`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Invio fallito")
      toast.success(`Preventivo inviato a ${q.client_email}`)
      await refresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSendingId(null)
    }
  }

  async function handleDelete(q: SalesChannelQuote) {
    if (!confirm(`Eliminare il preventivo di ${q.client_company || q.client_name}?`)) return
    try {
      const res = await fetch(`/api/quotes/${q.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Eliminazione fallita")
      toast.success("Preventivo eliminato")
      setQuotes((prev) => prev.filter((x) => x.id !== q.id))
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  function copyLink(q: SalesChannelQuote) {
    if (!q.token) {
      toast.error("Link non disponibile: salva di nuovo il preventivo")
      return
    }
    const link = `${window.location.origin}/preventivo/${q.token}`
    navigator.clipboard.writeText(link)
    toast.success("Link copiato negli appunti")
  }

  function openPreview(q: SalesChannelQuote) {
    if (!q.token) {
      toast.error("Link non disponibile: salva di nuovo il preventivo")
      return
    }
    window.open(`/preventivo/${q.token}`, "_blank", "noopener,noreferrer")
  }

  // ---- editor helpers ----
  function update(patch: EditableQuote) {
    setEditing((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const lineItems = (editing?.line_items as QuoteLineItem[]) || []
  const requestedFields = (editing?.requested_fields as QuoteRequestedField[]) || []

  function setLineItem(index: number, patch: Partial<QuoteLineItem>) {
    const next = lineItems.map((li, i) => (i === index ? { ...li, ...patch } : li))
    update({ line_items: next, total_amount: next.reduce((s, li) => s + (Number(li.amount) || 0), 0) })
  }
  function addLineItem() {
    update({ line_items: [...lineItems, { description: "", amount: 0 }] })
  }
  function removeLineItem(index: number) {
    const next = lineItems.filter((_, i) => i !== index)
    update({ line_items: next, total_amount: next.reduce((s, li) => s + (Number(li.amount) || 0), 0) })
  }

  function setField(index: number, patch: Partial<QuoteRequestedField>) {
    update({
      requested_fields: requestedFields.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    })
  }
  function addField() {
    update({
      requested_fields: [
        ...requestedFields,
        { key: `campo_${requestedFields.length + 1}`, label: "", type: "text", required: true },
      ],
    })
  }
  function removeField(index: number) {
    update({ requested_fields: requestedFields.filter((_, i) => i !== index) })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-balance">Preventivi</h1>
            <p className="text-sm text-muted-foreground">Ottimizzazione canali di vendita</p>
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo preventivo
        </Button>
      </header>

      {quotes.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nessun preventivo. Creane uno per iniziare.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {quotes.map((q) => {
            const meta = STATUS_META[q.status]
            return (
              <div
                key={q.id}
                className="bg-card border border-border rounded-lg p-4 sm:p-5 flex flex-col gap-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold truncate">
                        {q.client_company || q.client_name || "Senza intestatario"}
                      </h2>
                      <Badge className={meta.className}>{meta.label}</Badge>
                      {q.payment_method && (
                        <Badge variant="outline" className="gap-1">
                          {q.payment_method === "card" ? (
                            <CreditCard className="h-3 w-3" />
                          ) : (
                            <Banknote className="h-3 w-3" />
                          )}
                          {q.payment_method === "card" ? "Carta" : "Bonifico"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{q.title}</p>
                    {q.client_email && (
                      <p className="text-xs text-muted-foreground mt-1">{q.client_email}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{formatQuoteAmount(q.total_amount, q.currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.vat_included ? "IVA inclusa" : "IVA esclusa"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {q.accepted_at && (
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Accettato da {q.acceptance_name}
                    </span>
                  )}
                  {q.status === "paid" && q.paid_at && (
                    <span className="inline-flex items-center gap-1 text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Pagato
                    </span>
                  )}
                  {q.status === "sent" && !q.accepted_at && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> In attesa di accettazione
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(q)}>
                    <Pencil className="h-4 w-4 mr-1.5" /> Modifica
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSend(q)}
                    disabled={sendingId === q.id || !q.client_email}
                  >
                    <Send className="h-4 w-4 mr-1.5" />
                    {q.status === "draft" ? "Invia" : "Reinvia"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openPreview(q)}>
                    <ExternalLink className="h-4 w-4 mr-1.5" /> Apri
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copyLink(q)}>
                    <Copy className="h-4 w-4 mr-1.5" /> Copia link
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(q)}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" /> Elimina
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={editing != null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Nuovo preventivo" : "Modifica preventivo"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-6">
              {/* Intestatario */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Intestatario
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Nome referente</Label>
                    <Input
                      value={editing.client_name || ""}
                      onChange={(e) => update({ client_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Azienda</Label>
                    <Input
                      value={editing.client_company || ""}
                      onChange={(e) => update({ client_company: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editing.client_email || ""}
                      onChange={(e) => update({ client_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>P.IVA / CF</Label>
                    <Input
                      value={editing.client_vat || ""}
                      onChange={(e) => update({ client_vat: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Indirizzo</Label>
                    <Input
                      value={editing.client_address || ""}
                      onChange={(e) => update({ client_address: e.target.value })}
                    />
                  </div>
                </div>
              </section>

              {/* Contenuto */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Contenuto del preventivo
                </h3>
                <div className="space-y-1.5">
                  <Label>Titolo</Label>
                  <Input
                    value={editing.title || ""}
                    onChange={(e) => update({ title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Descrizione attività</Label>
                  <Textarea
                    rows={5}
                    value={editing.description || ""}
                    onChange={(e) => update({ description: e.target.value })}
                    placeholder="Descrivi le attività di ottimizzazione dei canali di vendita..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Condizioni di pagamento</Label>
                  <Textarea
                    rows={3}
                    value={editing.payment_terms || ""}
                    onChange={(e) => update({ payment_terms: e.target.value })}
                    placeholder="Es. 50% all'accettazione, saldo a fine attività..."
                  />
                </div>
              </section>

              {/* Importi */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Importi
                  </h3>
                  <Button size="sm" variant="outline" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-1.5" /> Voce
                  </Button>
                </div>
                {lineItems.length > 0 && (
                  <div className="space-y-2">
                    {lineItems.map((li, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <Input
                          className="flex-1"
                          placeholder="Descrizione voce"
                          value={li.description}
                          onChange={(e) => setLineItem(i, { description: e.target.value })}
                        />
                        <Input
                          type="number"
                          className="w-32"
                          placeholder="0.00"
                          value={li.amount ?? ""}
                          onChange={(e) => setLineItem(i, { amount: Number(e.target.value) })}
                        />
                        <Button size="icon" variant="ghost" onClick={() => removeLineItem(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Totale</Label>
                    <Input
                      type="number"
                      value={editing.total_amount ?? ""}
                      onChange={(e) =>
                        update({ total_amount: e.target.value === "" ? null : Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Acconto (carta)</Label>
                    <Input
                      type="number"
                      value={editing.deposit_amount ?? ""}
                      onChange={(e) =>
                        update({ deposit_amount: e.target.value === "" ? null : Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Valuta</Label>
                    <Input
                      value={editing.currency || "eur"}
                      onChange={(e) => update({ currency: e.target.value.toLowerCase() })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editing.vat_included ?? true}
                    onCheckedChange={(v) => update({ vat_included: v })}
                  />
                  <Label className="cursor-pointer">Importi IVA inclusa</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  L&apos;acconto (se impostato) è l&apos;importo addebitato con carta; altrimenti viene usato il
                  totale.
                </p>
              </section>

              {/* Campi richiesti al cliente */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Dati richiesti al cliente
                  </h3>
                  <Button size="sm" variant="outline" onClick={addField}>
                    <Plus className="h-4 w-4 mr-1.5" /> Campo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Definisci i dati che il cliente dovrà compilare (es. codici accesso Booking, Expedia, dati di
                  fatturazione).
                </p>
                {requestedFields.map((f, i) => (
                  <div key={i} className="border border-border rounded-md p-3 space-y-2">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs">Etichetta campo</Label>
                        <Input
                          placeholder="Es. Codice accesso Booking.com"
                          value={f.label}
                          onChange={(e) =>
                            setField(i, {
                              label: e.target.value,
                              key: f.key?.startsWith("campo_") ? slugify(e.target.value) : f.key,
                            })
                          }
                        />
                      </div>
                      <div className="w-40 space-y-1.5">
                        <Label className="text-xs">Tipo</Label>
                        <Select
                          value={f.type}
                          onValueChange={(v) => setField(i, { type: v as QuoteRequestedField["type"] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="mt-6"
                        onClick={() => removeField(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={f.required}
                        onCheckedChange={(v) => setField(i, { required: v })}
                      />
                      <Label className="text-xs cursor-pointer">Obbligatorio</Label>
                    </div>
                  </div>
                ))}
              </section>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
