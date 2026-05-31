"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Plus,
  Send,
  Eye,
  MousePointerClick,
  Users,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  BarChart3,
  UserPlus,
  Trash2,
  FileText,
  Download,
  Pencil,
  Zap,
  Play,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  X,
} from "lucide-react"

const SANTADDEO_PRESET = {
  name: "Comunicato stampa - Lancio Santaddeo",
  subject: "Comunicato stampa: nasce Santaddeo, la piattaforma italiana di revenue management per l'hotellerie",
  html: `<!--ATTACH:/dem/comunicato-stampa-santaddeo.pdf|Comunicato Stampa Santaddeo - 31 Maggio 2026.pdf-->
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Comunicato stampa - Santaddeo</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f2;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border:1px solid #e6e3dd;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1b2a4a;padding:28px 32px;">
              <p style="margin:0;color:#c8a45c;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Comunicato stampa</p>
              <p style="margin:6px 0 0;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:1px;">Santaddeo</p>
              <p style="margin:2px 0 0;color:#aeb7c7;font-size:13px;">Revenue intelligence per l'hotellerie · by 4 Bid</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 32px 8px;font-size:15px;line-height:1.65;color:#2d2d2d;">
              <p style="margin:0 0 16px;">Gentile Redazione di {{nome_azienda}},</p>
              <p style="margin:0 0 16px;">in allegato trovate il <strong>comunicato stampa</strong> relativo al lancio di <strong>Santaddeo</strong>, la nuova piattaforma italiana di revenue management per l'hotellerie nata dall'esperienza di 4 Bid.</p>
              <p style="margin:0 0 16px;">Vi saremmo grati se voleste darne <strong>diffusione e pubblicazione</strong> sulle vostre testate. Restiamo a disposizione per interviste, approfondimenti o materiale aggiuntivo.</p>
              <p style="margin:0;">Cordiali saluti,<br />Ufficio Stampa - 4 Bid s.r.l.</p>
            </td>
          </tr>
          <!-- Attachment note -->
          <tr>
            <td style="padding:8px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf7f0;border:1px solid #ece5d6;border-radius:6px;">
                <tr>
                  <td style="padding:14px 18px;font-size:13px;color:#5a5a5a;">
                    📎 In allegato: <strong style="color:#1b2a4a;">Comunicato Stampa Santaddeo - 31 Maggio 2026 (PDF)</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Contacts -->
          <tr>
            <td style="padding:24px 32px 0;">
              <hr style="border:none;border-top:1px solid #e6e3dd;margin:0 0 16px;" />
              <p style="margin:0;font-size:13px;line-height:1.6;color:#5a5a5a;">
                Ufficio Stampa - 4 Bid s.r.l.<br />
                Sito: <a href="https://www.santaddeo.com" style="color:#1b2a4a;">www.santaddeo.com</a> · <a href="https://www.4bid.it" style="color:#1b2a4a;">www.4bid.it</a><br />
                Email: <a href="mailto:clienti@4bid.it" style="color:#1b2a4a;">clienti@4bid.it</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;">
              <p style="margin:0;font-size:11px;color:#9a9a9a;line-height:1.5;">Ricevi questa email in quanto contatto di redazione.<br />Non vuoi più ricevere i nostri comunicati? <a href="{{unsubscribe}}" style="color:#9a9a9a;text-decoration:underline;">Annulla iscrizione</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
}

const HOTEL_PRESET = {
  name: "Hotel - Presentazione Santaddeo",
  subject: "{{nome_azienda}}: il prezzo giusto delle camere, ogni giorno — con Santaddeo",
  html: `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Santaddeo per il tuo hotel</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f2;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border:1px solid #e6e3dd;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1b2a4a;padding:28px 32px;">
              <p style="margin:0;color:#c8a45c;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Revenue management</p>
              <p style="margin:6px 0 0;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:1px;">Santaddeo</p>
              <p style="margin:2px 0 0;color:#aeb7c7;font-size:13px;">Il prezzo giusto delle tue camere, ogni giorno · by 4 Bid</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 32px 8px;font-size:15px;line-height:1.65;color:#2d2d2d;">
              <p style="margin:0 0 16px;">Gentile {{nome_azienda}},</p>
              <p style="margin:0 0 16px;">decidere ogni giorno il prezzo giusto di vendita di una camera è una delle sfide più complesse per un albergatore: troppe variabili, troppi dati, troppe decisioni da prendere in poco tempo.</p>
              <p style="margin:0 0 16px;"><strong>Santaddeo</strong> è la piattaforma italiana di revenue management nata da 20 anni di lavoro sul campo di <strong>4 Bid</strong> a fianco delle strutture ricettive. Non un algoritmo rigido che decide al posto tuo, ma uno strumento che ti aiuta a costruire una strategia tariffaria chiara, misurabile e su misura per il tuo hotel.</p>
            </td>
          </tr>
          <!-- Bullets -->
          <tr>
            <td style="padding:4px 32px 0;font-size:15px;line-height:1.65;">
              <p style="margin:0 0 10px;font-weight:bold;color:#1b2a4a;">Con Santaddeo puoi:</p>
              <ul style="margin:0;padding-left:20px;color:#2d2d2d;">
                <li style="margin-bottom:6px;">analizzare occupazione, tariffe e performance commerciali in un colpo d'occhio;</li>
                <li style="margin-bottom:6px;">leggere i dati del tuo PMS e individuare sottoprezzi e opportunità di ricavo;</li>
                <li style="margin-bottom:6px;">personalizzare le variabili che incidono sul prezzo (stagionalità, domanda, eventi, anticipo, competitor…);</li>
                <li style="margin-bottom:0;">avere un supporto concreto al lavoro quotidiano del revenue.</li>
              </ul>
            </td>
          </tr>
          <!-- Risk zero -->
          <tr>
            <td style="padding:18px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid #c8a45c;background-color:#faf7f0;border-radius:0 6px 6px 0;">
                <tr>
                  <td style="padding:16px 20px;font-size:15px;line-height:1.6;color:#3a3a3a;">
                    <strong style="color:#1b2a4a;">Rischio iniziale zero:</strong> è disponibile anche un <strong>piano a commissione</strong>, legato ai risultati generati. Se il sistema aiuta davvero a migliorare i tuoi ricavi, allora viene remunerato.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <a href="https://www.santaddeo.com" style="display:inline-block;background-color:#1b2a4a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 32px;border-radius:6px;">Richiedi una demo gratuita</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 8px;font-size:13px;color:#5a5a5a;">
              Oppure rispondi a questa email: ti ricontattiamo noi.
            </td>
          </tr>
          <!-- Contacts -->
          <tr>
            <td style="padding:24px 32px 0;">
              <hr style="border:none;border-top:1px solid #e6e3dd;margin:0 0 16px;" />
              <p style="margin:0;font-size:13px;line-height:1.6;color:#5a5a5a;">
                4 Bid s.r.l.<br />
                Sito: <a href="https://www.santaddeo.com" style="color:#1b2a4a;">www.santaddeo.com</a> · <a href="https://www.4bid.it" style="color:#1b2a4a;">www.4bid.it</a><br />
                Email: <a href="mailto:clienti@4bid.it" style="color:#1b2a4a;">clienti@4bid.it</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;">
              <p style="margin:0;font-size:11px;color:#9a9a9a;line-height:1.5;">Ricevi questa email perché riteniamo Santaddeo utile per la tua struttura ricettiva.<br />Non vuoi più ricevere le nostre comunicazioni? <a href="{{unsubscribe}}" style="color:#9a9a9a;text-decoration:underline;">Annulla iscrizione</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
}

const DEMO_SANTADDEO_PRESET = {
  name: "Hotel - Invito Demo Santaddeo",
  subject: "Stai vendendo le camere al prezzo giusto?",
  html: `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Demo gratuita Santaddeo</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f4f2;">
    In 15 minuti ti mostriamo dove puoi migliorare prezzi, occupazione e ricavi.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f2;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border:1px solid #e6e3dd;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#ffffff;padding:32px 32px 24px;border-bottom:3px solid #2bb3a3;">
              <img src="https://www.4bid.it/santaddeo-logo.png" alt="Santaddeo - Hotel Accelerator" width="320" style="display:block;width:320px;max-width:80%;height:auto;border:0;margin:0 auto;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 8px;font-size:16px;line-height:1.7;color:#2d2d2d;">
              <p style="margin:0 0 18px;">Buongiorno,</p>
              <p style="margin:0 0 18px;font-size:18px;font-weight:bold;color:#1b2a4a;line-height:1.5;">stai vendendo le camere al prezzo giusto o stai lasciando ricavi sul tavolo?</p>
              <p style="margin:0 0 18px;">Con Santaddeo ti mostriamo in 15 minuti dove puoi migliorare prezzi, occupazione e ricavi, con un sistema personalizzabile nato dall'esperienza di 4 Bid con tante strutture ricettive.</p>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td align="center" style="padding:14px 32px 10px;">
              <a href="https://www.santaddeo.com" style="display:inline-block;background-color:#2bb3a3;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:15px 40px;border-radius:6px;">Prenota la demo gratuita</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 24px;font-size:15px;color:#5a5a5a;line-height:1.6;">
              Oppure rispondi a questa email e ti richiamiamo noi.
            </td>
          </tr>
          <!-- Contacts -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #e6e3dd;margin:0 0 16px;" />
              <p style="margin:0;font-size:13px;line-height:1.6;color:#5a5a5a;">
                4 Bid s.r.l.<br />
                <a href="https://www.santaddeo.com" style="color:#1b2a4a;">www.santaddeo.com</a> · <a href="https://www.4bid.it" style="color:#1b2a4a;">www.4bid.it</a> · <a href="mailto:clienti@4bid.it" style="color:#1b2a4a;">clienti@4bid.it</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;">
              <p style="margin:0;font-size:11px;color:#9a9a9a;line-height:1.5;">Ricevi questa email perché riteniamo Santaddeo utile per la tua struttura ricettiva.<br />Non vuoi più ricevere le nostre comunicazioni? <a href="{{unsubscribe}}" style="color:#9a9a9a;text-decoration:underline;">Annulla iscrizione</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
}

interface Campaign {
  id: string
  name: string
  subject: string
  html_template: string
  status: string
  sent_count: number
  failed_count: number
  open_count: number
  click_count: number
  unique_opens: number
  unique_clicks: number
  sent_at: string | null
  created_at: string
  updated_at: string
  auto_send?: boolean
  auto_started_on?: string | null
}

interface Recipient {
  id: string
  campaign_id: string
  email: string
  nome: string | null
  cognome: string | null
  nome_azienda: string | null
  tipo_contatto: string | null
  send_status: string
  error_message: string | null
  sent_at: string | null
  open_count: number
  click_count: number
  first_open_at: string | null
  last_open_at: string | null
  first_click_at: string | null
  created_at: string
}

interface TrackingEvent {
  id: string
  campaign_id: string
  recipient_id: string
  email: string
  event_type: string
  url: string | null
  created_at: string
}

interface CampaignStats {
  campaign: Campaign
  recipients: Recipient[]
  recipientsPage?: number
  recipientsPageSize?: number
  recipientsFilteredTotal?: number
  events: TrackingEvent[]
  summary: {
    total: number
    sent: number
    failed: number
    pending: number
    paused?: number
    opens: number
    unique_opens: number
    clicks: number
    unique_clicks: number
  }
}

// Map a clicked URL to a short, human-friendly label (e.g. "santaddeo.com")
function siteLabelFromUrl(rawUrl: string): string {
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./, "")
    return host
  } catch {
    return rawUrl
  }
}

export default function DemDashboard({
  initialCampaigns,
}: {
  initialCampaigns: Campaign[]
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [togglingAuto, setTogglingAuto] = useState(false)
  const [resuming, setResuming] = useState(false)
  const [recipientsPage, setRecipientsPage] = useState(0)
  // Filtri/ordinamento lista destinatari (applicati lato server)
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortColumn, setSortColumn] = useState("created_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  // Fonte di verita' dei parametri di query (evita closure stale in fetchStats)
  const queryRef = useRef({ page: 0, search: "", status: "all", sort: "created_at", dir: "asc" as "asc" | "desc" })
  const [showTestSend, setShowTestSend] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [sendingTest, setSendingTest] = useState(false)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [showAddRecipients, setShowAddRecipients] = useState(false)
  const [showAddManual, setShowAddManual] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // New campaign form
  const [newName, setNewName] = useState("")
  const [newSubject, setNewSubject] = useState("")
  const [newTemplate, setNewTemplate] = useState("")

  // Manual recipient form
  const [manualEmail, setManualEmail] = useState("")
  const [manualNome, setManualNome] = useState("")
  const [manualCognome, setManualCognome] = useState("")
  const [manualAzienda, setManualAzienda] = useState("")

  // Edit recipient form
  const [editRecipient, setEditRecipient] = useState<Recipient | null>(null)
  const [editEmail, setEditEmail] = useState("")
  const [editNome, setEditNome] = useState("")
  const [editCognome, setEditCognome] = useState("")
  const [editAzienda, setEditAzienda] = useState("")

  // Build a map: recipientId -> [{ label, count }] of the sites they clicked
  const clicksByRecipient = useMemo(() => {
    const map = new Map<string, { label: string; count: number }[]>()
    if (!stats?.events) return map
    for (const ev of stats.events) {
      if (ev.event_type !== "click" || !ev.url) continue
      const label = siteLabelFromUrl(ev.url)
      const list = map.get(ev.recipient_id) || []
      const existing = list.find((x) => x.label === label)
      if (existing) {
        existing.count += 1
      } else {
        list.push({ label, count: 1 })
      }
      map.set(ev.recipient_id, list)
    }
    return map
  }, [stats?.events])

  const showMessage = useCallback((msg: string, isError = false) => {
    if (isError) {
      setError(msg)
      setSuccessMsg(null)
    } else {
      setSuccessMsg(msg)
      setError(null)
    }
    setTimeout(() => {
      setError(null)
      setSuccessMsg(null)
    }, 5000)
  }, [])

  const fetchStats = useCallback(
    async (
      campaignId: string,
      opts?: Partial<{ page: number; search: string; status: string; sort: string; dir: "asc" | "desc" }>
    ) => {
      const q = { ...queryRef.current, ...opts }
      queryRef.current = q
      setLoading(true)
      try {
        const params = new URLSearchParams({
          c: campaignId,
          page: String(q.page),
          sort: q.sort,
          dir: q.dir,
        })
        if (q.search) params.set("search", q.search)
        if (q.status && q.status !== "all") params.set("status", q.status)
        const res = await fetch(`/api/dem/stats?${params.toString()}`)
        if (!res.ok) throw new Error("Errore nel caricamento statistiche")
        const data = await res.json()
        setStats(data)
        setRecipientsPage(data.recipientsPage ?? q.page)
        setSelectedCampaign(data.campaign)
      } catch (err) {
        showMessage(err instanceof Error ? err.message : "Errore", true)
      } finally {
        setLoading(false)
      }
    },
    [showMessage]
  )

  // Applica la ricerca testuale (resetta alla prima pagina)
  const applySearch = () => {
    if (!selectedCampaign) return
    fetchStats(selectedCampaign.id, { search: searchInput.trim(), page: 0 })
  }

  // Cambia il filtro di stato
  const changeStatusFilter = (value: string) => {
    setStatusFilter(value)
    if (selectedCampaign) fetchStats(selectedCampaign.id, { status: value, page: 0 })
  }

  // Ordina per colonna: stesso click inverte la direzione
  const toggleSort = (column: string) => {
    if (!selectedCampaign) return
    const nextDir: "asc" | "desc" = sortColumn === column && sortDir === "asc" ? "desc" : "asc"
    setSortColumn(column)
    setSortDir(nextDir)
    fetchStats(selectedCampaign.id, { sort: column, dir: nextDir, page: 0 })
  }

  // Azzera tutti i filtri/ordinamento
  const clearFilters = () => {
    setSearchInput("")
    setStatusFilter("all")
    setSortColumn("created_at")
    setSortDir("asc")
    if (selectedCampaign)
      fetchStats(selectedCampaign.id, { search: "", status: "all", sort: "created_at", dir: "asc", page: 0 })
  }

  // Intestazione di colonna ordinabile
  const SortHeader = ({
    column,
    label,
    align = "left",
    className = "",
  }: {
    column: string
    label: string
    align?: "left" | "center" | "right"
    className?: string
  }) => {
    const active = sortColumn === column
    const justify = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"
    return (
      <th className={`py-2 px-3 text-muted-foreground font-medium ${className}`}>
        <button
          type="button"
          onClick={() => toggleSort(column)}
          className={`flex items-center gap-1 w-full ${justify} hover:text-foreground transition-colors ${active ? "text-foreground" : ""}`}
          title={`Ordina per ${label}`}
        >
          <span>{label}</span>
          {active ? (
            sortDir === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
          )}
        </button>
      </th>
    )
  }

  const loadSantaddeoPreset = () => {
    setNewName(SANTADDEO_PRESET.name)
    setNewSubject(SANTADDEO_PRESET.subject)
    setNewTemplate(SANTADDEO_PRESET.html)
    setShowNewCampaign(true)
  }

  const loadHotelPreset = () => {
    setNewName(HOTEL_PRESET.name)
    setNewSubject(HOTEL_PRESET.subject)
    setNewTemplate(HOTEL_PRESET.html)
    setShowNewCampaign(true)
  }

  const loadDemoPreset = () => {
    setNewName(DEMO_SANTADDEO_PRESET.name)
    setNewSubject(DEMO_SANTADDEO_PRESET.subject)
    setNewTemplate(DEMO_SANTADDEO_PRESET.html)
    setShowNewCampaign(true)
  }

  const createCampaign = async () => {
    if (!newName || !newSubject || !newTemplate) {
      showMessage("Compila tutti i campi", true)
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/dem/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          subject: newSubject,
          html_template: newTemplate,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Errore nella creazione")
      }
      const data = await res.json()
      setCampaigns((prev) => [data.campaign, ...prev])
      setShowNewCampaign(false)
      setNewName("")
      setNewSubject("")
      setNewTemplate("")
      showMessage("Campagna creata con successo")
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Errore", true)
    } finally {
      setLoading(false)
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa campagna?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/dem/campaigns?id=${campaignId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Errore nella cancellazione")
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId))
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign(null)
        setStats(null)
      }
      showMessage("Campagna eliminata")
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Errore", true)
    } finally {
      setLoading(false)
    }
  }

  const addManualRecipient = async () => {
    if (!manualEmail || !selectedCampaign) {
      showMessage("Inserisci almeno l'email", true)
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/dem/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: selectedCampaign.id,
          recipients: [
            {
              email: manualEmail,
              nome: manualNome || null,
              cognome: manualCognome || null,
              nome_azienda: manualAzienda || null,
            },
          ],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `Errore HTTP ${res.status}: il salvataggio e' fallito`)
      }
      setManualEmail("")
      setManualNome("")
      setManualCognome("")
      setManualAzienda("")
      setShowAddManual(false)
      showMessage(`Destinatario aggiunto con successo (${data.added} nuovo/i)`)
      fetchStats(selectedCampaign.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore sconosciuto"
      showMessage(`ERRORE nel salvataggio: ${msg}`, true)
    } finally {
      setLoading(false)
    }
  }

  const startEditRecipient = (r: Recipient) => {
    setEditRecipient(r)
    setEditEmail(r.email)
    setEditNome(r.nome || "")
    setEditCognome(r.cognome || "")
    setEditAzienda(r.nome_azienda || "")
  }

  const saveEditRecipient = async () => {
    if (!editRecipient || !selectedCampaign) return
    if (!editEmail || !editEmail.includes("@")) {
      showMessage("Inserisci un'email valida", true)
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/dem/recipients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editRecipient.id,
          email: editEmail,
          nome: editNome || null,
          cognome: editCognome || null,
          nome_azienda: editAzienda || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `Errore HTTP ${res.status}`)
      }
      setEditRecipient(null)
      showMessage("Contatto aggiornato con successo")
      fetchStats(selectedCampaign.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore sconosciuto"
      showMessage(`ERRORE nella modifica: ${msg}`, true)
    } finally {
      setLoading(false)
    }
  }

  const deleteRecipient = async (r: Recipient) => {
    if (!selectedCampaign) return
    if (!confirm(`Eliminare il contatto ${r.email}?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/dem/recipients?id=${encodeURIComponent(r.id)}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `Errore HTTP ${res.status}`)
      }
      showMessage("Contatto eliminato")
      fetchStats(selectedCampaign.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore sconosciuto"
      showMessage(`ERRORE nell'eliminazione: ${msg}`, true)
    } finally {
      setLoading(false)
    }
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedCampaign) return

    setLoading(true)
    try {
      const text = await file.text()
      const lines = text.split("\n").filter((l) => l.trim())

      if (lines.length < 2) {
        showMessage("Il file CSV deve avere almeno un'intestazione e una riga", true)
        return
      }

      const header = lines[0].toLowerCase().split(/[,;]/).map((h) => h.trim().replace(/"/g, ""))
      const emailIdx = header.findIndex((h) => h === "email" || h === "e-mail")
      const nomeIdx = header.findIndex((h) => h === "nome" || h === "name" || h === "first_name")
      const cognomeIdx = header.findIndex((h) => h === "cognome" || h === "surname" || h === "last_name")
      const aziendaIdx = header.findIndex((h) => h === "azienda" || h === "company" || h === "nome_azienda")

      if (emailIdx === -1) {
        showMessage("Colonna 'email' non trovata nel CSV", true)
        return
      }

      const recipients = lines
        .slice(1)
        .map((line) => {
          const cols = line.split(/[,;]/).map((c) => c.trim().replace(/"/g, ""))
          return {
            email: cols[emailIdx] || "",
            nome: nomeIdx >= 0 ? cols[nomeIdx] || null : null,
            cognome: cognomeIdx >= 0 ? cols[cognomeIdx] || null : null,
            nome_azienda: aziendaIdx >= 0 ? cols[aziendaIdx] || null : null,
          }
        })
        .filter((r) => r.email && r.email.includes("@"))

      if (recipients.length === 0) {
        showMessage("Nessun destinatario valido trovato nel CSV", true)
        return
      }

      const res = await fetch("/api/dem/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: selectedCampaign.id,
          recipients,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `Errore HTTP ${res.status}: il salvataggio CSV e' fallito`)
      }
      showMessage(`${data.added} destinatari aggiunti con successo (${data.duplicates || 0} duplicati ignorati)`)
      setShowAddRecipients(false)
      fetchStats(selectedCampaign.id)
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Errore", true)
    } finally {
      setLoading(false)
      e.target.value = ""
    }
  }

  const sendCampaign = async () => {
    if (!selectedCampaign) return
    if (
      !confirm(
        `Stai per inviare la campagna "${selectedCampaign.name}". L'invio avviene a lotti (max 250 email per volta) per non superare i limiti del server email: se i destinatari sono di piu', dovrai premere "Invia" piu' volte. Continuare?`
      )
    )
      return

    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/dem/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: selectedCampaign.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Errore nell'invio")
      if (data.done) {
        showMessage(`Invio completato. Totale inviate: ${data.sent}, fallite: ${data.failed}.`)
      } else {
        showMessage(
          `Lotto inviato (${data.batch} email). Restano ${data.remaining} destinatari in attesa: premi di nuovo "Invia" per il prossimo lotto (rispetta i limiti giornalieri del tuo provider email).`
        )
      }
      fetchStats(selectedCampaign.id)
      // Refresh campaigns list
      const campaignsRes = await fetch("/api/dem/campaigns")
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json()
        setCampaigns(campaignsData.campaigns || [])
      }
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Errore", true)
    } finally {
      setSending(false)
    }
  }

  const toggleAutoSend = async () => {
    if (!selectedCampaign) return
    const enabling = !selectedCampaign.auto_send
    if (enabling) {
      if (
        !confirm(
          `Attivare l'invio automatico per "${selectedCampaign.name}"?\n\nLa campagna verra' inviata da sola a scaglioni, ogni giorno dalle 9:00 alle 18:00, con volume crescente per proteggere la reputazione del mittente (giorno 1: 200, giorno 2: 400, giorno 3: 800, giorno 4: 1500, poi 2500/giorno) finche' la lista non e' esaurita. Non dovrai premere "Invia".`
        )
      )
        return
    }
    setTogglingAuto(true)
    setError(null)
    try {
      const res = await fetch(`/api/dem/campaigns?id=${selectedCampaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_send: enabling }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Errore aggiornamento")
      setSelectedCampaign((prev) => (prev ? { ...prev, ...data.campaign } : prev))
      setCampaigns((prev) => prev.map((c) => (c.id === data.campaign.id ? { ...c, ...data.campaign } : c)))
      showMessage(
        enabling
          ? "Invio automatico attivato: la campagna partira' a scaglioni nella prossima finestra (9:00-18:00)."
          : "Invio automatico disattivato."
      )
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Errore", true)
    } finally {
      setTogglingAuto(false)
    }
  }

  const resumeQueue = async () => {
    if (!selectedCampaign || !stats) return
    const pausedCount = stats.summary.paused || 0
    if (pausedCount === 0) return
    if (
      !confirm(
        `Riprendere l'invio di "${selectedCampaign.name}"?\n\n${pausedCount.toLocaleString("it-IT")} contatti in pausa torneranno in coda e l'invio automatico a scaglioni (warm-up, ogni giorno 9:00-18:00) riprendera' da solo. Non dovrai premere "Invia".`
      )
    )
      return
    setResuming(true)
    setError(null)
    try {
      // 1) Riporta i contatti in pausa -> in coda (pending)
      const resumeRes = await fetch(`/api/dem/campaigns?id=${selectedCampaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queue_action: "resume" }),
      })
      const resumeData = await resumeRes.json()
      if (!resumeRes.ok) throw new Error(resumeData.error || "Errore nella ripresa")

      // 2) Riattiva l'invio automatico a scaglioni cosi prosegue da solo
      const autoRes = await fetch(`/api/dem/campaigns?id=${selectedCampaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_send: true }),
      })
      const autoData = await autoRes.json()
      if (!autoRes.ok) throw new Error(autoData.error || "Errore nell'attivazione automatica")

      setSelectedCampaign((prev) => (prev ? { ...prev, ...autoData.campaign } : prev))
      setCampaigns((prev) =>
        prev.map((c) => (c.id === autoData.campaign.id ? { ...c, ...autoData.campaign } : c))
      )
      showMessage(
        `Invio ripreso: ${(resumeData.queueMoved || pausedCount).toLocaleString("it-IT")} contatti di nuovo in coda. Il warm-up automatico partira' nella prossima finestra (9:00-18:00).`
      )
      fetchStats(selectedCampaign.id)
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Errore", true)
    } finally {
      setResuming(false)
    }
  }

  const sendTestEmail = async () => {
    if (!selectedCampaign) return
    if (!testEmail || !testEmail.includes("@")) {
      showMessage("Inserisci un'email valida per la prova", true)
      return
    }
    setSendingTest(true)
    try {
      const res = await fetch("/api/dem/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: selectedCampaign.id, email: testEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Errore nell'invio di prova")
      showMessage(`Email di prova (tracciata) inviata a ${data.to}. Apri la mail e clicca un link, poi premi Aggiorna.`)
      setShowTestSend(false)
      fetchStats(selectedCampaign.id)
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Errore", true)
    } finally {
      setSendingTest(false)
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Bozza</Badge>
      case "sending":
        return <Badge className="bg-amber-500 text-foreground">In invio...</Badge>
      case "sent":
        return <Badge className="bg-emerald-600 text-foreground">Inviata</Badge>
      case "failed":
        return <Badge variant="destructive">Fallita</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const sendStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />
      default:
        return null
    }
  }

  // Detail view
  if (selectedCampaign) {
    const canEditRecipients =
      selectedCampaign.status === "draft" || selectedCampaign.status === "failed"
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="text-sm">{successMsg}</p>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSelectedCampaign(null)
                  setStats(null)
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{selectedCampaign.name}</h1>
                <p className="text-sm text-muted-foreground">{selectedCampaign.subject}</p>
              </div>
              {statusBadge(selectedCampaign.status)}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchStats(selectedCampaign.id)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Aggiorna
              </Button>

              <Dialog open={showTestSend} onOpenChange={setShowTestSend}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Invia prova
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invia email di prova</DialogTitle>
                    <DialogDescription>
                      Invia il comunicato (allegato compreso) a un indirizzo di prova, con
                      tracciamento attivo. Viene creato un contatto di prova (etichettato
                      &quot;test&quot;) cos&igrave; puoi verificare apertura e click nelle statistiche.
                      L&apos;oggetto avr&agrave; il prefisso [PROVA]. Potrai eliminare il contatto di
                      prova al termine.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-2">
                    <Label htmlFor="test-email">Email destinatario di prova</Label>
                    <Input
                      id="test-email"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="tua.email@esempio.it"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowTestSend(false)} disabled={sendingTest}>
                      Annulla
                    </Button>
                    <Button onClick={sendTestEmail} disabled={sendingTest}>
                      {sendingTest ? "Invio..." : "Invia prova"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {(selectedCampaign.status === "draft" || selectedCampaign.status === "failed") && (
                <>
                  <Dialog open={showAddManual} onOpenChange={setShowAddManual}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Aggiungi
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Aggiungi Destinatario</DialogTitle>
                        <DialogDescription>Inserisci i dati del destinatario da aggiungere alla campagna.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-4">
                        <div>
                          <Label htmlFor="manual-email">Email *</Label>
                          <Input
                            id="manual-email"
                            type="email"
                            value={manualEmail}
                            onChange={(e) => setManualEmail(e.target.value)}
                            placeholder="email@esempio.it"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="manual-nome">Nome</Label>
                            <Input
                              id="manual-nome"
                              value={manualNome}
                              onChange={(e) => setManualNome(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="manual-cognome">Cognome</Label>
                            <Input
                              id="manual-cognome"
                              value={manualCognome}
                              onChange={(e) => setManualCognome(e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="manual-azienda">Azienda</Label>
                          <Input
                            id="manual-azienda"
                            value={manualAzienda}
                            onChange={(e) => setManualAzienda(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={addManualRecipient} disabled={loading}>
                          {loading ? "Aggiunta..." : "Aggiungi"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showAddRecipients} onOpenChange={setShowAddRecipients}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Importa Destinatari da CSV</DialogTitle>
                        <DialogDescription>
                          Il file deve avere una colonna &quot;email&quot;. Colonne opzionali: nome, cognome, azienda.
                          Separatore: virgola o punto e virgola.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleCsvUpload}
                          disabled={loading}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>

                  {stats && (stats.summary.paused || 0) > 0 && (
                    <Button
                      size="sm"
                      onClick={resumeQueue}
                      disabled={resuming}
                      className="bg-emerald-600 hover:bg-emerald-700 text-foreground"
                      title="Rimette in coda i contatti in pausa e riprende l'invio automatico a scaglioni"
                    >
                      <Play className={`h-4 w-4 mr-2 ${resuming ? "animate-pulse" : ""}`} />
                      {resuming
                        ? "Ripresa in corso..."
                        : `Riprendi (${(stats.summary.paused || 0).toLocaleString("it-IT")})`}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant={selectedCampaign.auto_send ? "default" : "outline"}
                    onClick={toggleAutoSend}
                    disabled={togglingAuto || (!selectedCampaign.auto_send && (!stats || stats.summary.pending === 0))}
                    className={selectedCampaign.auto_send ? "bg-emerald-600 hover:bg-emerald-700 text-foreground" : ""}
                    title="Invia da solo a scaglioni, ogni giorno 9:00-18:00, con volume crescente (warm-up)"
                  >
                    <Zap className={`h-4 w-4 mr-2 ${togglingAuto ? "animate-pulse" : ""}`} />
                    {selectedCampaign.auto_send ? "Auto attivo" : "Invio automatico"}
                  </Button>

                  <Button
                    size="sm"
                    onClick={sendCampaign}
                    disabled={sending || !stats || stats.summary.pending === 0}
                  >
                    <Send className={`h-4 w-4 mr-2 ${sending ? "animate-pulse" : ""}`} />
                    {sending ? "Invio in corso..." : "Invia"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Destinatari</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.summary.total.toLocaleString("it-IT")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.summary.sent.toLocaleString("it-IT")} inviati,{" "}
                    {stats.summary.pending.toLocaleString("it-IT")} in attesa
                    {(stats.summary.paused || 0) > 0 && (
                      <>, {(stats.summary.paused || 0).toLocaleString("it-IT")} in pausa</>
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Aperture</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.summary.opens}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.summary.unique_opens} uniche
                    {stats.summary.sent > 0 &&
                      ` (${Math.round(
                        (stats.summary.unique_opens / stats.summary.sent) * 100
                      )}%)`}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Click</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.summary.clicks}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.summary.unique_clicks} unici
                    {stats.summary.sent > 0 &&
                      ` (${Math.round(
                        (stats.summary.unique_clicks / stats.summary.sent) * 100
                      )}%)`}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Falliti</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.summary.failed}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.summary.total > 0 &&
                      `${Math.round(
                        (stats.summary.failed / stats.summary.total) * 100
                      )}% del totale`}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recipients table */}
          {stats && (
            <Card>
              <CardHeader>
                {(() => {
                  const filteredTotal = stats.recipientsFilteredTotal ?? stats.summary.total
                  const filtersActive = statusFilter !== "all" || queryRef.current.search.length > 0
                  const pageSize = stats.recipientsPageSize ?? 500
                  const start = recipientsPage * pageSize
                  return (
                    <>
                      <CardTitle className="text-lg">
                        Destinatari ({filteredTotal.toLocaleString("it-IT")}
                        {filtersActive ? ` di ${stats.summary.total.toLocaleString("it-IT")}` : ""})
                      </CardTitle>
                      {stats.recipients.length > 0 && filteredTotal > stats.recipients.length && (
                        <p className="text-xs text-muted-foreground">
                          {(start + 1).toLocaleString("it-IT")}–
                          {(start + stats.recipients.length).toLocaleString("it-IT")} di{" "}
                          {filteredTotal.toLocaleString("it-IT")}
                        </p>
                      )}
                    </>
                  )
                })()}

                {/* Filtro: ricerca + stato */}
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applySearch()}
                        placeholder="Cerca per email, nome o azienda..."
                        className="pl-9"
                      />
                    </div>
                    <Button variant="default" size="sm" onClick={applySearch} disabled={loading}>
                      <Search className="h-4 w-4 mr-1" />
                      Cerca
                    </Button>
                    {(statusFilter !== "all" || queryRef.current.search.length > 0) && (
                      <Button variant="outline" size="sm" onClick={clearFilters} disabled={loading}>
                        <X className="h-4 w-4 mr-1" />
                        Azzera
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "Tutti", count: stats.summary.total },
                      { value: "pending", label: "In attesa", count: stats.summary.pending },
                      { value: "sent", label: "Inviati", count: stats.summary.sent },
                      { value: "failed", label: "Falliti", count: stats.summary.failed },
                      { value: "paused", label: "In pausa", count: stats.summary.paused || 0 },
                    ].map((opt) => (
                      <Button
                        key={opt.value}
                        variant={statusFilter === opt.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => changeStatusFilter(opt.value)}
                        disabled={loading}
                      >
                        {opt.label} ({opt.count.toLocaleString("it-IT")})
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <SortHeader column="send_status" label="Stato" />
                        <SortHeader column="email" label="Email" />
                        <SortHeader column="nome" label="Nome" className="hidden sm:table-cell" />
                        <SortHeader column="nome_azienda" label="Azienda" className="hidden md:table-cell" />
                        <SortHeader column="open_count" label="Aperture" align="center" />
                        <SortHeader column="click_count" label="Click" align="center" />
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium hidden md:table-cell">Link cliccato</th>
                        <SortHeader
                          column="error_message"
                          label="Errore"
                          className="hidden lg:table-cell"
                        />
                        {canEditRecipients && (
                          <th className="text-right py-2 px-3 text-muted-foreground font-medium">Azioni</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recipients.map((r) => (
                        <tr key={r.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-2 px-3">{sendStatusIcon(r.send_status)}</td>
                          <td className="py-2 px-3 text-foreground">{r.email}</td>
                          <td className="py-2 px-3 text-foreground hidden sm:table-cell">
                            {[r.nome, r.cognome].filter(Boolean).join(" ") || "-"}
                          </td>
                          <td className="py-2 px-3 text-foreground hidden md:table-cell">{r.nome_azienda || "-"}</td>
                          <td className="py-2 px-3 text-center text-foreground">{r.open_count || 0}</td>
                          <td className="py-2 px-3 text-center text-foreground">{r.click_count || 0}</td>
                          <td className="py-2 px-3 hidden md:table-cell">
                            {(() => {
                              const clicks = clicksByRecipient.get(r.id)
                              if (!clicks || clicks.length === 0) {
                                return <span className="text-muted-foreground">-</span>
                              }
                              return (
                                <div className="flex flex-wrap gap-1">
                                  {clicks.map((c) => (
                                    <span
                                      key={c.label}
                                      className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-foreground"
                                    >
                                      {c.label}
                                      {c.count > 1 ? ` ×${c.count}` : ""}
                                    </span>
                                  ))}
                                </div>
                              )
                            })()}
                          </td>
                          <td className="py-2 px-3 text-destructive text-xs hidden lg:table-cell max-w-48 truncate">
                            {r.error_message || "-"}
                          </td>
                          {canEditRecipients && (
                            <td className="py-2 px-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => startEditRecipient(r)}
                                  aria-label={`Modifica ${r.email}`}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => deleteRecipient(r)}
                                  aria-label={`Elimina ${r.email}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                      {stats.recipients.length === 0 && (
                        <tr>
                          <td
                            colSpan={canEditRecipients ? 9 : 8}
                            className="py-8 text-center text-muted-foreground"
                          >
                            Nessun destinatario corrisponde ai filtri selezionati.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {(() => {
                  const pageSize = stats.recipientsPageSize ?? 500
                  const filteredTotal = stats.recipientsFilteredTotal ?? stats.summary.total
                  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize))
                  if (totalPages <= 1) return null
                  return (
                    <div className="flex items-center justify-between gap-3 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={recipientsPage <= 0 || loading}
                        onClick={() =>
                          selectedCampaign && fetchStats(selectedCampaign.id, { page: recipientsPage - 1 })
                        }
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Precedente
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Pagina {recipientsPage + 1} di {totalPages.toLocaleString("it-IT")}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={recipientsPage >= totalPages - 1 || loading}
                        onClick={() =>
                          selectedCampaign && fetchStats(selectedCampaign.id, { page: recipientsPage + 1 })
                        }
                      >
                        Successiva
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Edit recipient dialog */}
          <Dialog open={editRecipient !== null} onOpenChange={(open) => !open && setEditRecipient(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifica Contatto</DialogTitle>
                <DialogDescription>Aggiorna i dati del destinatario.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="email@esempio.it"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-nome">Nome</Label>
                    <Input id="edit-nome" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="edit-cognome">Cognome</Label>
                    <Input
                      id="edit-cognome"
                      value={editCognome}
                      onChange={(e) => setEditCognome(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-azienda">Azienda</Label>
                  <Input
                    id="edit-azienda"
                    value={editAzienda}
                    onChange={(e) => setEditAzienda(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditRecipient(null)} disabled={loading}>
                  Annulla
                </Button>
                <Button onClick={saveEditRecipient} disabled={loading}>
                  {loading ? "Salvataggio..." : "Salva"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* No stats yet */}
          {!stats && !loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Caricamento statistiche...
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => fetchStats(selectedCampaign.id)}
                >
                  Carica Statistiche
                </Button>
              </CardContent>
            </Card>
          )}

          {loading && (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Campaign list view
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p className="text-sm">{successMsg}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild>
              <a href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </a>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Campagne DEM</h1>
              <p className="text-sm text-muted-foreground">
                {campaigns.length} campagn{campaigns.length === 1 ? "a" : "e"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href="/admin/dem/contatti">
                <FileText className="h-4 w-4 mr-2" />
                Contatti Hotel
              </a>
            </Button>
            <Button size="sm" variant="outline" onClick={loadSantaddeoPreset}>
              <FileText className="h-4 w-4 mr-2" />
              Comunicato Santaddeo
            </Button>
            <Button size="sm" variant="outline" onClick={loadHotelPreset}>
              <FileText className="h-4 w-4 mr-2" />
              Messaggio Hotel
            </Button>
            <Button size="sm" variant="outline" onClick={loadDemoPreset}>
              <FileText className="h-4 w-4 mr-2" />
              Invito Demo
            </Button>
            <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuova Campagna DEM</DialogTitle>
                <DialogDescription>Crea una nuova campagna email. Potrai aggiungere i destinatari dopo la creazione.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="campaign-name">Nome campagna</Label>
                  <Input
                    id="campaign-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="es. Newsletter Marzo 2026"
                  />
                </div>
                <div>
                  <Label htmlFor="campaign-subject">Oggetto email</Label>
                  <Input
                    id="campaign-subject"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="es. Le ultime novita' da 4BID"
                  />
                </div>
                <div>
                  <Label htmlFor="campaign-template">Template HTML</Label>
                  <Textarea
                    id="campaign-template"
                    value={newTemplate}
                    onChange={(e) => setNewTemplate(e.target.value)}
                    placeholder={"<html>\n<body>\n  <h1>Ciao {{nome}}</h1>\n  <p>Il tuo contenuto qui...</p>\n</body>\n</html>"}
                    className="min-h-[200px] font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {"Variabili disponibili: {{nome}}, {{cognome}}, {{nome_azienda}}, {{email}}"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {"Allegato: aggiungi nel template un marker <!--ATTACH:/percorso/file.pdf|Nome visualizzato.pdf--> (verra' rimosso dal corpo e allegato all'email)."}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewCampaign(false)}>
                  Annulla
                </Button>
                <Button onClick={createCampaign} disabled={loading}>
                  {loading ? "Creazione..." : "Crea Campagna"}
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Add CSV download hint */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Download className="h-3.5 w-3.5" />
          <span>Lista testate pronta da importare:</span>
          <a
            href="/dem/comunicato-stampa-testate.csv"
            download
            className="underline hover:text-foreground"
          >
            comunicato-stampa-testate.csv
          </a>
        </div>

        {/* Campaigns list */}
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nessuna campagna</h3>
              <p className="text-muted-foreground mb-4">
                Crea la tua prima campagna DEM per iniziare a inviare email.
              </p>
              <Button onClick={() => setShowNewCampaign(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crea Campagna
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => {
                        setSelectedCampaign(campaign)
                        setSearchInput("")
                        setStatusFilter("all")
                        setSortColumn("created_at")
                        setSortDir("asc")
                        fetchStats(campaign.id, {
                          search: "",
                          status: "all",
                          sort: "created_at",
                          dir: "asc",
                          page: 0,
                        })
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground truncate">{campaign.name}</h3>
                        {statusBadge(campaign.status)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{campaign.subject}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.sent_count || 0} inviati
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {campaign.unique_opens || 0} aperture
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" />
                          {campaign.unique_clicks || 0} click
                        </span>
                        <span className="hidden sm:inline">
                          {new Date(campaign.created_at).toLocaleDateString("it-IT")}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCampaign(campaign.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
