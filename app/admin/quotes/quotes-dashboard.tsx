"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle, Banknote, CheckCircle2, Clock, Copy, CreditCard, ExternalLink, Eye, EyeOff, FileText, Pencil, Plus, RotateCcw, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatQuoteAmount, type SalesChannelQuote } from "@/lib/quotes/types"
import QuoteSendDialog from "@/components/admin/quote-send-dialog"

const STATUS_META: Record<SalesChannelQuote["status"], { label: string; className: string }> = {
  draft: { label: "Bozza", className: "bg-muted text-muted-foreground" },
  sent: { label: "Inviato", className: "bg-blue-100 text-blue-800" },
  accepted: { label: "Accettato", className: "bg-amber-100 text-amber-800" },
  paid: { label: "Pagato", className: "bg-green-100 text-green-800" },
}

/** Accettato ma non ancora incassato: e' qui che serve un sollecito o una conferma. */
function isUnpaid(q: SalesChannelQuote): boolean {
  return !!q.accepted_at && q.payment_status !== "paid" && !q.paid_at
}

export default function QuotesDashboard({ initialQuotes }: { initialQuotes: SalesChannelQuote[] }) {
  const router = useRouter()
  const [quotes, setQuotes] = useState(initialQuotes)
  const [sendQuote, setSendQuote] = useState<SalesChannelQuote | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  // Dialoghi React (non bloccanti). I nativi confirm()/prompt() bloccano il
  // main thread finche' restano aperti: quel tempo viene conteggiato come durata
  // dell'handler del click e faceva scattare l'avviso INP (UI bloccata ~2.5s).
  const [deleteQuote, setDeleteQuote] = useState<SalesChannelQuote | null>(null)
  const [transferQuote, setTransferQuote] = useState<SalesChannelQuote | null>(null)
  const [reopenQuote, setReopenQuote] = useState<SalesChannelQuote | null>(null)
  const [reopenDate, setReopenDate] = useState("")
  const [resetQuote, setResetQuote] = useState<SalesChannelQuote | null>(null)

  // Tornando dall'editor con router.refresh() il server rimanda i preventivi
  // aggiornati come nuovo prop: senza risincronizzare lo stato locale la lista
  // resterebbe ferma ai dati vecchi e le modifiche non si vedrebbero.
  useEffect(() => { setQuotes(initialQuotes) }, [initialQuotes])

  async function refresh() {
    const res = await fetch("/api/quotes", { cache: "no-store" })
    if (res.ok) setQuotes(await res.json())
  }

  /** L'invio passa dalla finestra, dove si scelgono i destinatari in copia. */
  function handleSend(q: SalesChannelQuote) {
    if (!q.client_email) return toast.error("Imposta l'email del cliente prima di inviare")
    setSendQuote(q)
  }

  async function runDelete(q: SalesChannelQuote) {
    setDeleteQuote(null)
    const res = await fetch(`/api/quotes/${q.id}`, { method: "DELETE" })
    if (!res.ok) return toast.error("Eliminazione fallita")
    setQuotes(prev => prev.filter(x => x.id !== q.id))
    toast.success("Preventivo eliminato")
  }

  /** Un bonifico incassato non arriva da Stripe: va confermato a mano. */
  async function runConfirmTransfer(q: SalesChannelQuote) {
    setTransferQuote(null)
    setActingId(q.id)
    try {
      const res = await fetch(`/api/quotes/${q.id}/payment`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "confirm_transfer" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Conferma non riuscita")
      toast.success(data.client_notified ? "Pagamento confermato, cliente avvisato" : "Pagamento confermato (email al cliente non inviata)")
      await refresh()
    } catch (e: any) { toast.error(e.message) } finally { setActingId(null) }
  }

  /** Apre il dialogo per scegliere la nuova scadenza di un'offerta decaduta. */
  function handleReopen(q: SalesChannelQuote) {
    setReopenDate(new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10))
    setReopenQuote(q)
  }

  /** Riapre un'offerta decaduta con la nuova scadenza scelta nel dialogo. */
  async function runReopen() {
    const q = reopenQuote
    if (!q || !reopenDate) return
    setReopenQuote(null)
    setActingId(q.id)
    try {
      const res = await fetch(`/api/quotes/${q.id}/payment`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "reopen", expires_at: new Date(`${reopenDate}T23:59:59`).toISOString() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Riapertura non riuscita")
      toast.success("Offerta riaperta")
      await refresh()
    } catch (e: any) { toast.error(e.message) } finally { setActingId(null) }
  }

  /** Azzera il contatore visite: la lista torna a mostrare "Non ancora aperto". */
  async function runResetViews(q: SalesChannelQuote) {
    setResetQuote(null)
    setActingId(q.id)
    try {
      const res = await fetch(`/api/quotes/${q.id}/reset-views`, { method: "POST" })
      if (!res.ok) throw new Error("Azzeramento non riuscito")
      setQuotes(prev => prev.map(x => x.id === q.id ? { ...x, view_count: 0, first_viewed_at: null, last_viewed_at: null } : x))
      toast.success("Visite azzerate")
    } catch (e: any) { toast.error(e.message) } finally { setActingId(null) }
  }

  function openPreview(q: SalesChannelQuote) {
    if (!q.token) return toast.error("Link non disponibile")
    window.open(`/preventivo/${q.token}?preview=1`, "_blank", "noopener,noreferrer")
  }

  function copyLink(q: SalesChannelQuote) {
    if (!q.token) return toast.error("Link non disponibile")
    navigator.clipboard.writeText(`${window.location.origin}/preventivo/${q.token}`)
    toast.success("Link copiato")
  }

  const sent = quotes.filter(q => q.sent_at).length
  const viewed = quotes.filter(q => q.first_viewed_at).length
  const accepted = quotes.filter(q => q.accepted_at).length
  const paid = quotes.filter(q => q.status === "paid" || q.paid_at).length
  const pct = (n: number) => sent > 0 ? Math.round((n / sent) * 100) : 0

  return <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
    <header className="flex flex-wrap items-center justify-between gap-4 py-6">
      <div className="flex items-center gap-3"><FileText className="h-7 w-7 text-primary" /><div><h1 className="text-2xl font-bold">Preventivi</h1><p className="text-sm text-muted-foreground">Quote-to-cash e catalogo prodotti 4BID</p></div></div>
      <Button onClick={() => router.push("/admin/quotes/commerce")}><Plus className="h-4 w-4 mr-2" />Nuovo preventivo</Button>
    </header>

    {quotes.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: "Inviati", value: sent, sub: null, icon: Send },
        { label: "Aperti", value: viewed, sub: `${pct(viewed)}%`, icon: Eye },
        { label: "Accettati", value: accepted, sub: `${pct(accepted)}%`, icon: CheckCircle2 },
        { label: "Pagati", value: paid, sub: `${pct(paid)}%`, icon: CreditCard },
      ].map(c => <div key={c.label} className="bg-card border rounded-lg p-4"><div className="flex items-center gap-2 text-muted-foreground mb-1"><c.icon className="h-4 w-4" /><span className="text-xs font-medium uppercase">{c.label}</span></div><div className="flex items-baseline gap-2"><span className="text-2xl font-bold">{c.value}</span>{c.sub && <span className="text-xs text-muted-foreground">{c.sub}</span>}</div></div>)}
    </div>}

    {quotes.length === 0 ? <div className="border border-dashed rounded-lg p-12 text-center"><FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">Nessun preventivo.</p></div> : <div className="grid gap-4">
      {quotes.map(q => {
        const meta = STATUS_META[q.status] || STATUS_META.draft
        return <div key={q.id} className="bg-card border rounded-lg p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><h2 className="font-semibold truncate">{q.client_company || q.client_name || "Senza intestatario"}</h2><Badge className={meta.className}>{meta.label}</Badge>{q.payment_method && <Badge variant="outline" className="gap-1">{q.payment_method === "card" ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}{q.payment_method === "card" ? "Carta" : "Bonifico"}</Badge>}</div><p className="text-sm text-muted-foreground truncate">{q.title}</p><div className="flex items-center gap-2 mt-1 flex-wrap">{q.quote_number && <span className="text-xs font-mono font-medium">{q.quote_number}</span>}{q.client_email && <span className="text-xs text-muted-foreground">{q.client_email}</span>}</div></div>
            <div className="text-right"><p className="font-semibold">{formatQuoteAmount(q.total_amount, q.currency)}</p><p className="text-xs text-muted-foreground">{q.vat_included ? "IVA inclusa" : "IVA esclusa"}</p></div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {q.first_viewed_at ? <span className="inline-flex items-center gap-1 text-primary"><Eye className="h-3.5 w-3.5" />Aperto {new Date(q.last_viewed_at || q.first_viewed_at).toLocaleString("it-IT")}{q.view_count > 1 ? ` · ${q.view_count} volte` : ""}</span> : q.sent_at ? <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5 opacity-50" />Non ancora aperto</span> : null}
            {q.accepted_at && <span className="inline-flex items-center gap-1 text-amber-700"><CheckCircle2 className="h-3.5 w-3.5" />Accettato da {q.acceptance_name}</span>}
            {q.status === "sent" && !q.accepted_at && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />In attesa di accettazione</span>}
            {q.paid_at && <span className="inline-flex items-center gap-1 text-green-800"><CheckCircle2 className="h-3.5 w-3.5" />Pagato {new Date(q.paid_at).toLocaleDateString("it-IT")}</span>}
            {isUnpaid(q) && !q.expired_at && <span className="inline-flex items-center gap-1 text-orange-800"><Clock className="h-3.5 w-3.5" />Accettato ma non pagato{(q.payment_reminder_count || 0) > 0 ? ` · ${q.payment_reminder_count} solleciti` : ""}{q.expires_at ? ` · scade ${new Date(q.expires_at).toLocaleDateString("it-IT")}` : ""}</span>}
            {q.expired_at && <span className="inline-flex items-center gap-1 text-destructive"><AlertTriangle className="h-3.5 w-3.5" />Decaduta per mancato pagamento</span>}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => router.push(`/admin/quotes/edit/${q.id}`)} disabled={q.status === "paid"}><Pencil className="h-4 w-4 mr-1.5" />Modifica</Button>
            <Button size="sm" onClick={() => handleSend(q)} disabled={!q.client_email}><Send className="h-4 w-4 mr-1.5" />{q.status === "draft" ? "Invia" : "Reinvia"}</Button>
            {isUnpaid(q) && q.payment_method === "bonifico" && <Button size="sm" variant="outline" onClick={() => setTransferQuote(q)} disabled={actingId === q.id}><Banknote className="h-4 w-4 mr-1.5" />Bonifico ricevuto</Button>}
            {q.expired_at && <Button size="sm" variant="outline" onClick={() => handleReopen(q)} disabled={actingId === q.id}><RotateCcw className="h-4 w-4 mr-1.5" />Riapri offerta</Button>}
            <Button size="sm" variant="outline" onClick={() => openPreview(q)}><ExternalLink className="h-4 w-4 mr-1.5" />Apri</Button>
            <Button size="sm" variant="outline" onClick={() => copyLink(q)}><Copy className="h-4 w-4 mr-1.5" />Copia link</Button>
            {q.first_viewed_at && <Button size="sm" variant="outline" onClick={() => setResetQuote(q)} disabled={actingId === q.id}><EyeOff className="h-4 w-4 mr-1.5" />Azzera visite</Button>}
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteQuote(q)} disabled={q.status === "paid"}><Trash2 className="h-4 w-4 mr-1.5" />Elimina</Button>
          </div>
        </div>
      })}
    </div>}

    <AlertDialog open={!!deleteQuote} onOpenChange={(open) => { if (!open) setDeleteQuote(null) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare il preventivo?</AlertDialogTitle>
          <AlertDialogDescription>{deleteQuote ? `Il preventivo di ${deleteQuote.client_company || deleteQuote.client_name || "questo intestatario"} verrà eliminato definitivamente.` : ""}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteQuote && runDelete(deleteQuote)}>Elimina</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={!!transferQuote} onOpenChange={(open) => { if (!open) setTransferQuote(null) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confermare il pagamento ricevuto?</AlertDialogTitle>
          <AlertDialogDescription>{transferQuote ? `Confermi di aver ricevuto il pagamento di ${transferQuote.client_company || transferQuote.client_name || "questo cliente"}? Il cliente riceverà la conferma con i link per prenotare le call di avvio.` : ""}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={() => transferQuote && runConfirmTransfer(transferQuote)}>Conferma</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog open={!!reopenQuote} onOpenChange={(open) => { if (!open) setReopenQuote(null) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Riapri offerta</DialogTitle>
          <DialogDescription>{reopenQuote ? `Imposta la nuova scadenza per l'offerta di ${reopenQuote.client_company || reopenQuote.client_name || "questo cliente"}.` : ""}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reopen-date">Nuova scadenza</Label>
          <Input id="reopen-date" type="date" value={reopenDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setReopenDate(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setReopenQuote(null)}>Annulla</Button>
          <Button onClick={runReopen} disabled={!reopenDate}>Riapri</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!resetQuote} onOpenChange={(open) => { if (!open) setResetQuote(null) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Azzerare le visite?</AlertDialogTitle>
          <AlertDialogDescription>{resetQuote ? `Il conteggio delle aperture del preventivo di ${resetQuote.client_company || resetQuote.client_name || "questo intestatario"} tornerà a zero e risulterà "Non ancora aperto". Non modifica il preventivo né avvisa il cliente.` : ""}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={() => resetQuote && runResetViews(resetQuote)}>Azzera</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <QuoteSendDialog
      quote={sendQuote}
      open={!!sendQuote}
      onOpenChange={(open) => { if (!open) setSendQuote(null) }}
      onSent={async (message, gravita) => {
        // Un avviso di errore resta a lungo: elenca i colleghi da riavvisare a
        // mano, e sparire dopo pochi secondi ne farebbe perdere i nomi.
        if (gravita === "errore") toast.error(message, { duration: 15000 })
        else toast.success(message)
        await refresh()
      }}
    />
  </div>
}
