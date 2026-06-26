"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Trash2,
  Send,
  Eye,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Save,
  FolderOpen,
  Cloud,
  BarChart2,
  Users,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import DemStats from "./dem-stats"

type TipoContatto = "cliente" | "ex_cliente" | "potenziale" | "fornitore" | "rappresentante"

interface Recipient {
  id: string
  email: string
  nome: string
  cognome: string
  nomeAzienda: string
  tipoContatto: TipoContatto
}

const TAB_TOKENS = [
  { label: "TABCAMPO<cognome>", description: "Sostituisce col cognome", example: "Rossi" },
  { label: "TABCAMPO<nome>", description: "Sostituisce col nome", example: "Mario" },
  { label: "TABCAMPO<nome azienda>", description: "Sostituisce col nome azienda", example: "Hotel Bellavista" },
]

const DEM_TEMPLATE_SANTADDEO = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;">

    <!-- Header -->
    <div style="background:#0d9488;padding:32px 40px;text-align:center;">
      <img src="https://4bid.it/santaddeo-logo.png" alt="Santaddeo" width="160" style="max-width:160px;margin:0 auto 16px;display:block;border:0;" />
      <p style="color:#ccfbf1;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Presentazione riservata clienti 4BID</p>
      <h1 style="color:#ffffff;font-size:32px;font-weight:800;margin:0;letter-spacing:-0.5px;">SANTADDEO</h1>
      <p style="color:#ccfbf1;font-size:14px;margin:8px 0 0;">The Human Revenue Manager</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <p style="font-size:16px;color:#1a1a1a;margin:0 0 16px;">Gentile TABCAMPO&lt;cognome&gt;,</p>

      <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 20px;">
        Siamo lieti di invitarti alla <strong>prima ufficiale di Santaddeo</strong>, il nuovo modello web-based per il pricing dinamico sviluppato da 4BID.
      </p>

      <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 28px;">
        Un evento esclusivo riservato ai nostri clienti e collaboratori piu' fidati — tra cui TABCAMPO&lt;nome azienda&gt;.
      </p>

      <!-- Event box -->
      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:24px;margin:0 0 28px;">
        <p style="font-size:13px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Programma</p>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #ccfbf1;color:#666;width:110px;">14:30 – 16:30</td>
            <td style="padding:8px 0;border-bottom:1px solid #ccfbf1;color:#1a1a1a;font-weight:600;">Presentazione ufficiale di Santaddeo</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #ccfbf1;color:#666;">16:30 – 17:00</td>
            <td style="padding:8px 0;border-bottom:1px solid #ccfbf1;color:#1a1a1a;">Pausa</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #ccfbf1;color:#666;">17:00 – 19:00</td>
            <td style="padding:8px 0;border-bottom:1px solid #ccfbf1;color:#1a1a1a;font-weight:600;">Sessione pratica di configurazione <span style="color:#0d9488;">(porta PC o tablet!)</span></td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#666;">19:00</td>
            <td style="padding:8px 0;color:#1a1a1a;font-weight:600;">Aperitivo informale</td>
          </tr>
        </table>
      </div>

      <!-- Venue -->
      <div style="display:flex;align-items:flex-start;gap:12px;background:#fafafa;border:1px solid #eee;border-radius:10px;padding:16px;margin:0 0 28px;">
        <div style="background:#0d9488;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;shrink:0;">
          <span style="color:white;font-size:16px;">📍</span>
        </div>
        <div>
          <p style="margin:0;font-weight:700;color:#1a1a1a;">Villa I Barronci</p>
          <p style="margin:4px 0 0;font-size:13px;color:#666;">Via Sorripa, 10 · San Casciano in Val di Pesa (FI)</p>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0;">
        <a href="https://4bid.it/eventi/santaddeo-launch"
           style="background:#0d9488;color:white;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;">
          Conferma la tua presenza
        </a>
        <p style="font-size:12px;color:#e11d48;margin:12px 0 0;font-weight:600;">Posti limitati — Conferma richiesta entro il 14 Marzo</p>
      </div>

      <p style="font-size:14px;color:#444;line-height:1.7;margin:24px 0 0;">
        A presto,<br>
        <strong>Filippo e il Team 4BID</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f5f5f5;padding:24px 40px;border-top:1px solid #eee;text-align:center;">
      <img src="https://4bid.it/logo.png" alt="4BID" width="44" style="max-width:44px;opacity:0.65;margin:0 auto 10px;display:block;border:0;" />
      <p style="font-size:11px;color:#999;margin:0;line-height:1.8;">
        4BID S.R.L. · Via Sorripa, 10 · 50026 San Casciano in Val di Pesa (FI)<br>
        P.IVA: 02641710489 · <a href="mailto:info@4bid.it" style="color:#0d9488;">info@4bid.it</a>
      </p>
    </div>

  </div>
</body>
</html>`

function applyTabs(template: string, recipient: Recipient): string {
  return template
    .replace(/TABCAMPO&lt;cognome&gt;/gi, recipient.cognome || "[Cognome]")
    .replace(/TABCAMPO&lt;nome azienda&gt;/gi, recipient.nomeAzienda || "[Nome Azienda]")
    .replace(/TABCAMPO&lt;nome&gt;/gi, recipient.nome || "[Nome]")
    .replace(/TABCAMPO<cognome>/gi, recipient.cognome || "[Cognome]")
    .replace(/TABCAMPO<nome azienda>/gi, recipient.nomeAzienda || "[Nome Azienda]")
    .replace(/TABCAMPO<nome>/gi, recipient.nome || "[Nome]")
    .replace(/<cognome>/gi, recipient.cognome || "[Cognome]")
    .replace(/<nome azienda>/gi, recipient.nomeAzienda || "[Nome Azienda]")
    .replace(/<nome>/gi, recipient.nome || "[Nome]")
}

interface Campaign {
  id: string
  name: string
  subject: string
  html_template: string
  status: string
  sent_at: string | null
  sent_count: number
  dem_recipients: Array<{ email: string; nome: string; cognome: string; nome_azienda: string; send_status: string }>
}

export default function DemComposer() {
  const [subject, setSubject] = useState("Sei invitato alla Prima Ufficiale di Santaddeo — Villa I Barronci")
  const [htmlTemplate, setHtmlTemplate] = useState(DEM_TEMPLATE_SANTADDEO)
  const [campaignName, setCampaignName] = useState("Campagna Santaddeo Launch")
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showCampaigns, setShowCampaigns] = useState(false)
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "1", email: "", nome: "", cognome: "", nomeAzienda: "", tipoContatto: "cliente" },
  ])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [sendResults, setSendResults] = useState<{ email: string; success: boolean; error?: string }[] | null>(null)
  const [showTemplate, setShowTemplate] = useState(false)
  const [showGroupImport, setShowGroupImport] = useState(false)
  const [groupFilter, setGroupFilter] = useState<string>("tutti")
  const [groupRecipients, setGroupRecipients] = useState<Array<{ email: string; nome: string; cognome: string; nome_azienda: string; tipo_contatto: string; selected: boolean }>>([])
  const [isLoadingGroup, setIsLoadingGroup] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carica campagne salvate all'avvio — e aggiorna i destinatari della campagna attiva
  const loadCampaigns = useCallback(async () => {
    const res = await fetch("/api/dem/send")
    if (!res.ok) return
    const data = await res.json()
    const list: Campaign[] = data.campaigns || []
    setCampaigns(list)

    // Se c'è una campagna attiva, aggiorna i destinatari dal DB (evita perdita dati dopo save)
    if (campaignId) {
      const active = list.find((c) => c.id === campaignId)
      if (active?.dem_recipients?.length) {
        setRecipients(active.dem_recipients.map((r: any, i: number) => ({
          id: r.id || i.toString(),
          email: r.email,
          nome: r.nome || "",
          cognome: r.cognome || "",
          nomeAzienda: r.nome_azienda || "",
          tipoContatto: (r.tipo_contatto as TipoContatto) || "potenziale",
        })))
      }
    }
  }, [campaignId])

  useEffect(() => { loadCampaigns() }, [loadCampaigns])

  // Salva campagna nel DB
  const saveCampaign = async (silent = false) => {
    setIsSaving(true)
    try {
      // Salva TUTTI i destinatari che hanno almeno un campo compilato (non solo quelli con @)
      const allR = recipients.filter((r) => r.email || r.nome || r.cognome || r.nomeAzienda)
      const res = await fetch("/api/dem/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          name: campaignName,
          subject,
          htmlTemplate,
          recipients: allR,
          saveOnly: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (!campaignId) setCampaignId(data.campaignId)
      setLastSaved(new Date())
      if (!silent) toast.success("Campagna salvata")
      await loadCampaigns()
    } catch (err) {
      if (!silent) toast.error("Errore salvataggio")
    } finally {
      setIsSaving(false)
    }
  }

  // Elimina una campagna
  const deleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Eliminare la campagna "${name}" e tutti i suoi destinatari? L'operazione non e' reversibile.`)) return
    try {
      const res = await fetch("/api/dem/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Campagna "${name}" eliminata`)
      if (campaignId === id) {
        setCampaignId(null)
        setCampaignName("Nuova campagna")
        setSubject("")
        setHtmlTemplate(DEM_TEMPLATE_SANTADDEO)
        setRecipients([{ id: "1", email: "", nome: "", cognome: "", nomeAzienda: "", tipoContatto: "cliente" }])
      }
      await loadCampaigns()
    } catch {
      toast.error("Errore durante l'eliminazione")
    }
  }

  // Controlla se il template ha i loghi aggiornati
  const templateHasLogos = (tpl: string) =>
    tpl.includes("santaddeo-logo.png") && tpl.includes("logo.png")

  // Carica una campagna esistente nell'editor
  const loadCampaign = (c: Campaign) => {
    setCampaignId(c.id)
    setCampaignName(c.name)
    setSubject(c.subject)
    // Se il template salvato non ha i loghi, usa quello aggiornato
    const tpl = templateHasLogos(c.html_template) ? c.html_template : DEM_TEMPLATE_SANTADDEO
    setHtmlTemplate(tpl)
    if (!templateHasLogos(c.html_template)) {
      toast.info("Template aggiornato con i loghi piu' recenti")
    }
    if (c.dem_recipients?.length) {
      setRecipients(c.dem_recipients.map((r, i) => ({
        id: i.toString(),
        email: r.email,
        nome: r.nome,
        cognome: r.cognome,
        nomeAzienda: r.nome_azienda,
        tipoContatto: (r as any).tipo_contatto as TipoContatto || "potenziale",
      })))
    }
    setShowCampaigns(false)
    toast.success(`Campagna "${c.name}" caricata`)
  }

  const newCampaign = () => {
    setCampaignId(null)
    setCampaignName("Nuova campagna")
    setSubject("")
    setHtmlTemplate(DEM_TEMPLATE_SANTADDEO)
    setRecipients([{ id: "1", email: "", nome: "", cognome: "", nomeAzienda: "", tipoContatto: "cliente" }])
    setSendResults(null)
    toast.info("Nuova campagna creata")
  }

  // Carica destinatari per gruppo dal DB
  const loadGroup = async (tipo: string) => {
    setIsLoadingGroup(true)
    setGroupFilter(tipo)
    try {
      const res = await fetch(`/api/dem/recipients-by-group?tipo=${tipo}`)
      const data = await res.json()
      setGroupRecipients((data.recipients || []).map((r: any) => ({ ...r, selected: true })))
    } catch {
      toast.error("Errore caricamento gruppo")
    } finally {
      setIsLoadingGroup(false)
    }
  }

  // Importa i selezionati nella lista destinatari (senza duplicati)
  const importSelectedGroup = () => {
    const existingEmails = new Set(recipients.map((r) => r.email.toLowerCase()))
    const toAdd = groupRecipients
      .filter((r) => r.selected && !existingEmails.has(r.email.toLowerCase()))
      .map((r) => ({
        id: Date.now().toString() + Math.random(),
        email: r.email,
        nome: r.nome,
        cognome: r.cognome,
        nomeAzienda: r.nome_azienda,
        tipoContatto: (r.tipo_contatto as TipoContatto) || "cliente",
      }))
    const cleanCurrent = recipients.filter((r) => r.email.trim() !== "")
    setRecipients([...cleanCurrent, ...toAdd])
    setShowGroupImport(false)
    toast.success(`${toAdd.length} destinatari importati${toAdd.length < groupRecipients.filter(r => r.selected).length ? ` (${groupRecipients.filter(r => r.selected).length - toAdd.length} duplicati ignorati)` : ""}`)
  }

  // Recipient helpers
  const addRecipient = () => {
    setRecipients((prev) => [
      ...prev,
      { id: Date.now().toString(), email: "", nome: "", cognome: "", nomeAzienda: "", tipoContatto: "cliente" },
    ])
  }

  const removeRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id))
  }

  const updateRecipient = (id: string, field: keyof Omit<Recipient, "id">, value: string) => {
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  // CSV import: email,nome,cognome,nome_azienda
  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split("\n").filter((l) => l.trim())
      const parsed: Recipient[] = []
      lines.forEach((line, i) => {
        if (i === 0 && line.toLowerCase().includes("email")) return // skip header
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
        if (cols[0]) {
          const tipo = cols[4]?.trim().toLowerCase()
          parsed.push({
            id: Date.now().toString() + i,
            email: cols[0] || "",
            nome: cols[1] || "",
            cognome: cols[2] || "",
            nomeAzienda: cols[3] || "",
            tipoContatto: (["cliente", "ex_cliente", "potenziale", "fornitore", "rappresentante"].includes(tipo) ? tipo : "potenziale") as TipoContatto,
          })
        }
      })
      if (parsed.length) {
        setRecipients(parsed)
        toast.success(`${parsed.length} destinatari importati`)
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const downloadCsvTemplate = () => {
    const csv = "email,nome,cognome,nome_azienda,tipo_contatto\nfilippo@example.com,Filippo,Rossi,Hotel Bellavista,cliente"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "destinatari-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const insertToken = (token: string) => {
    const textarea = document.getElementById("html-template") as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = htmlTemplate.substring(0, start) + token + htmlTemplate.substring(end)
      setHtmlTemplate(newValue)
      setTimeout(() => {
        textarea.selectionStart = start + token.length
        textarea.selectionEnd = start + token.length
        textarea.focus()
      }, 0)
    } else {
      setHtmlTemplate((prev) => prev + token)
    }
  }

  const validRecipients = recipients.filter((r) => r.email.includes("@"))

  const handleSend = async (testMode = false) => {
    if (!subject.trim()) { toast.error("Inserisci l'oggetto della mail"); return }
    if (!htmlTemplate.trim()) { toast.error("Inserisci il corpo della mail"); return }
    if (!validRecipients.length) { toast.error("Aggiungi almeno un destinatario valido"); return }

    setIsSending(true)
    setSendResults(null)
    try {
      const res = await fetch("/api/dem/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, name: campaignName, subject, htmlTemplate, recipients: validRecipients, testMode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Errore HTTP ${res.status}`)
      if (data.campaignId && !campaignId) setCampaignId(data.campaignId)
      setSendResults(data.results)
      setLastSaved(new Date())
      await loadCampaigns()
      toast.success(testMode ? `Test inviato a f.mancini@4bid.it` : `Inviate ${data.sent} email su ${data.sent + data.failed}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore invio")
    } finally {
      setIsSending(false)
    }
  }

  const previewRecipient = validRecipients[previewIndex] || recipients[0]

  return (
    <div className="space-y-5">

      {/* Barra campagna */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[160px]">
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Nome campagna"
                className="h-8 text-sm font-medium"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {lastSaved && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Cloud className="h-3 w-3" />
                  Salvato {lastSaved.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={() => saveCampaign()} disabled={isSaving} className="h-8 text-xs gap-1">
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Salva
              </Button>
              <Button variant="outline" size="sm" onClick={newCampaign} className="h-8 text-xs gap-1">
                <Plus className="h-3 w-3" /> Nuova
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCampaigns((v) => !v)}
                className="h-8 text-xs gap-1"
              >
                <FolderOpen className="h-3 w-3" />
                Campagne ({campaigns.length})
              </Button>
            </div>
          </div>

          {/* Lista campagne salvate */}
          {showCampaigns && campaigns.length > 0 && (
            <div className="mt-3 border-t pt-3 space-y-1.5 max-h-48 overflow-y-auto">
              {campaigns.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <span className="font-medium truncate">{c.name}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${c.status === "sent" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {c.status === "sent" ? `Inviata (${c.sent_count})` : "Bozza"}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">{c.dem_recipients?.length || 0} dest.</span>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => loadCampaign(c)} className="h-6 text-xs">
                      Carica
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCampaign(c.id, c.name)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Elimina campagna"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showCampaigns && campaigns.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground border-t pt-3">Nessuna campagna salvata ancora.</p>
          )}
        </CardContent>
      </Card>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* COLONNA SINISTRA: Composizione */}
      <div className="space-y-5">

        {/* Oggetto */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Oggetto email</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Es: Invito esclusivo per TABCAMPO<cognome>"
            />
            <p className="text-xs text-muted-foreground mt-1.5">Puoi usare i tab anche nell{"'"}oggetto.</p>
          </CardContent>
        </Card>

        {/* Tab tokens */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tab di sostituzione</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Clicca un tab per inserirlo nel punto in cui si trova il cursore nel template.
            </p>
            <div className="flex flex-wrap gap-2">
              {TAB_TOKENS.map((token) => (
                <button
                  key={token.label}
                  onClick={() => insertToken(token.label)}
                  title={`${token.description} — es: "${token.example}"`}
                  className="group flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 text-xs font-mono font-semibold hover:bg-teal-100 hover:border-teal-400 transition-all"
                >
                  {token.label}
                  <span className="text-teal-400 group-hover:text-teal-600 text-[10px] normal-case font-sans">→ {token.example}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template HTML */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
            <CardTitle className="text-base">Template HTML</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setHtmlTemplate(DEM_TEMPLATE_SANTADDEO); toast.info("Template ripristinato") }}
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  title="Ripristina template originale con loghi"
                >
                  <RefreshCw className="h-3 w-3" /> Reset
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowTemplate((v) => !v)} className="h-7 text-xs gap-1">
                  {showTemplate ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {showTemplate ? "Comprimi" : "Espandi"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showTemplate ? (
              <Textarea
                id="html-template"
                value={htmlTemplate}
                onChange={(e) => setHtmlTemplate(e.target.value)}
                className="font-mono text-xs min-h-[400px] resize-y"
                spellCheck={false}
              />
            ) : (
              <div
                className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => setShowTemplate(true)}
              >
                <span className="font-mono">{htmlTemplate.substring(0, 120)}...</span>
                <p className="mt-1 text-teal-600 font-medium">Clicca per modificare</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* COLONNA DESTRA: Destinatari + Preview + Invio */}
      <div className="space-y-5">
        <Tabs defaultValue="recipients">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="recipients" className="flex items-center gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              Destinatari
              {validRecipients.length > 0 && (
                <Badge className="h-4 text-[10px] px-1">{validRecipients.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1.5 text-xs">
              <Eye className="h-3.5 w-3.5" />
              Anteprima
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1.5 text-xs">
              <BarChart2 className="h-3.5 w-3.5" />
              Statistiche
              {campaignId && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />}
            </TabsTrigger>
          </TabsList>

          {/* TAB: DESTINATARI */}
          <TabsContent value="recipients" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">Lista destinatari</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={showGroupImport ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setShowGroupImport((v) => !v); if (!showGroupImport) loadGroup("tutti") }}
                      className="h-7 text-xs gap-1"
                    >
                      <Users className="h-3 w-3" /> Importa gruppo
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadCsvTemplate} className="h-7 text-xs gap-1">
                      <Download className="h-3 w-3" /> Modello CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-7 text-xs gap-1">
                      <Upload className="h-3 w-3" /> Importa CSV
                    </Button>
                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
                  </div>
                </div>

                {/* Pannello importa per gruppo */}
                {showGroupImport && (
                  <div className="mt-3 border border-border rounded-lg p-3 bg-muted/40 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium">Filtra per tipo:</span>
                      {[
                        { value: "tutti", label: "Tutti" },
                        { value: "cliente", label: "Clienti" },
                        { value: "ex_cliente", label: "Ex Clienti" },
                        { value: "potenziale", label: "Potenziali" },
                        { value: "fornitore", label: "Fornitori" },
                        { value: "rappresentante", label: "Rappresentanti" },
                      ].map((g) => (
                        <button
                          key={g.value}
                          onClick={() => loadGroup(g.value)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            groupFilter === g.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:bg-muted"
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>

                    {isLoadingGroup ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Caricamento...
                      </div>
                    ) : groupRecipients.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">Nessun destinatario trovato per questo gruppo.</p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{groupRecipients.filter(r => r.selected).length} di {groupRecipients.length} selezionati</span>
                          <div className="flex gap-2">
                            <button onClick={() => setGroupRecipients(g => g.map(r => ({ ...r, selected: true })))} className="text-primary hover:underline">Tutti</button>
                            <button onClick={() => setGroupRecipients(g => g.map(r => ({ ...r, selected: false })))} className="text-muted-foreground hover:underline">Nessuno</button>
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {groupRecipients.map((r, i) => (
                            <label key={i} className="flex items-center gap-2.5 text-xs py-1 px-1.5 rounded hover:bg-muted cursor-pointer">
                              <input
                                type="checkbox"
                                checked={r.selected}
                                onChange={(e) => setGroupRecipients(g => g.map((gr, gi) => gi === i ? { ...gr, selected: e.target.checked } : gr))}
                                className="rounded"
                              />
                              <span className="font-medium">{r.cognome} {r.nome}</span>
                              <span className="text-muted-foreground truncate">{r.email}</span>
                              {r.nome_azienda && <span className="text-muted-foreground italic truncate">{r.nome_azienda}</span>}
                              <span className={`ml-auto shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border ${
                                r.tipo_contatto === "cliente" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                r.tipo_contatto === "ex_cliente" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                r.tipo_contatto === "fornitore" ? "bg-purple-100 text-purple-700 border-purple-200" :
                                r.tipo_contatto === "rappresentante" ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
                                "bg-blue-100 text-blue-700 border-blue-200"
                              }`}>
                                {r.tipo_contatto?.replace("_", " ")}
                              </span>
                            </label>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          onClick={importSelectedGroup}
                          disabled={groupRecipients.filter(r => r.selected).length === 0}
                          className="w-full h-8 text-xs gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Aggiungi {groupRecipients.filter(r => r.selected).length} destinatari alla lista
                        </Button>
                      </>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-1">CSV: email, nome, cognome, nome_azienda, tipo_contatto</p>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {recipients.map((r, i) => (
                  <div key={r.id} className="border border-border rounded-lg p-3 space-y-2 bg-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                      <button
                        onClick={() => removeRecipient(r.id)}
                        disabled={recipients.length === 1}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Input
                      placeholder="email@struttura.com"
                      value={r.email}
                      onChange={(e) => updateRecipient(r.id, "email", e.target.value)}
                      className={`h-8 text-sm ${r.email && !r.email.includes("@") ? "border-red-300" : ""}`}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Nome"
                        value={r.nome}
                        onChange={(e) => updateRecipient(r.id, "nome", e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="Cognome"
                        value={r.cognome}
                        onChange={(e) => updateRecipient(r.id, "cognome", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <Input
                      placeholder="Nome struttura / azienda"
                      value={r.nomeAzienda}
                      onChange={(e) => updateRecipient(r.id, "nomeAzienda", e.target.value)}
                      className="h-8 text-sm"
                    />
                    <select
                      value={r.tipoContatto}
                      onChange={(e) => updateRecipient(r.id, "tipoContatto", e.target.value)}
                      className="h-8 w-full text-xs rounded-md border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="cliente">Cliente</option>
                      <option value="ex_cliente">Ex Cliente</option>
                      <option value="potenziale">Potenziale</option>
                      <option value="fornitore">Fornitore</option>
                      <option value="rappresentante">Rappresentante</option>
                    </select>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addRecipient} className="w-full h-8 text-xs gap-1 border-dashed">
                  <Plus className="h-3.5 w-3.5" /> Aggiungi destinatario
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: PREVIEW */}
          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">Anteprima personalizzata</CardTitle>
                  {validRecipients.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs">Destinatario:</Label>
                      <select
                        className="text-xs border border-border rounded px-2 py-1 bg-background"
                        value={previewIndex}
                        onChange={(e) => setPreviewIndex(Number(e.target.value))}
                      >
                        {validRecipients.map((r, i) => (
                          <option key={r.id} value={i}>{r.email || `#${i + 1}`}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {previewRecipient && (
                  <div className="bg-muted/50 rounded-lg p-2 mt-1">
                    <p className="text-xs text-muted-foreground font-mono">
                      Oggetto: <span className="text-foreground">{applyTabs(subject, previewRecipient)}</span>
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div
                    className="w-full h-[480px] overflow-y-auto bg-[#f5f5f5]"
                    dangerouslySetInnerHTML={{ __html: previewRecipient ? applyTabs(htmlTemplate, previewRecipient) : htmlTemplate }}
                    title="Anteprima email"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: STATISTICHE */}
          <TabsContent value="stats" className="mt-4">
            {campaignId
              ? <DemStats campaignId={campaignId} />
              : <p className="text-sm text-muted-foreground text-center py-8">Salva prima la campagna per vedere le statistiche.</p>
            }
          </TabsContent>
        </Tabs>

        {/* Risultati invio */}
        {sendResults && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Risultati invio</CardTitle>
            </CardHeader>
            <CardContent className="max-h-48 overflow-y-auto space-y-1.5">
              {sendResults.map((r) => (
                <div key={r.email} className={`flex items-center gap-2 text-xs p-2 rounded-lg ${r.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                  {r.success
                    ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                  <span className="font-medium">{r.email}</span>
                  {r.error && <span className="text-red-600 ml-auto">{r.error}</span>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Azioni invio */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Destinatari validi:</span>
              <Badge variant={validRecipients.length ? "default" : "secondary"}>
                {validRecipients.length} / {recipients.length}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSend(true)}
                disabled={isSending || !validRecipients.length}
                className="gap-2"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                Test (1 mail)
              </Button>
              <Button
                onClick={() => handleSend(false)}
                disabled={isSending || !validRecipients.length}
                className="gap-2 bg-teal-700 hover:bg-teal-800"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Invia a tutti
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Il Test invia solo al primo destinatario per verificare la resa prima dell{"'"}invio definitivo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  )
}
