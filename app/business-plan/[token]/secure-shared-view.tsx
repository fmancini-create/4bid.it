"use client"

import { useState } from "react"
import { Download, Eye, Lock, MessageSquare, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface BusinessPlan {
  id: string
  name: string
  description?: string
  client_name?: string
  project_type?: string
  num_rooms?: number
  stars?: number
  has_spa?: boolean
  has_restaurant?: boolean
  has_congress?: boolean
  location?: string
  opening_days_year?: number
  projection_years?: number
  start_year?: number
  initial_investment?: number
  executive_summary?: string
  market_analysis?: string
  business_model?: string
  marketing_strategy?: string
  management_team?: string
  risk_analysis?: string
}

interface Share {
  id: string
  email?: string
  can_edit?: boolean
  can_download?: boolean
  business_plans?: { name?: string; client_name?: string } | null
}

interface Financial {
  year_number: number
  occupancy_rate: number
  adr: number
  fb_revenue_pct: number
  spa_revenue_pct: number
  congress_revenue_pct: number
  other_revenue_pct: number
  rooms_cost_pct: number
  fb_cost_pct: number
  spa_cost_pct: number
  congress_cost_pct: number
  staff_rooms_cost: number
  staff_fb_cost: number
  staff_spa_cost: number
  staff_congress_cost: number
  staff_admin_cost: number
  rent_cost: number
  utilities_cost: number
  marketing_cost: number
  maintenance_cost: number
  insurance_cost: number
  admin_cost: number
  other_fixed_cost: number
  depreciation: number
  interest_cost: number
  tax_rate: number
}

interface Comment {
  id: string
  author_name: string
  author_email?: string
  section?: string
  content: string
  created_at: string
}

const euro = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0)

export default function SecureSharedBusinessPlanView({ share, token }: { share: Share; token: string }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [visitorName, setVisitorName] = useState("")
  const [visitorEmail, setVisitorEmail] = useState("")
  const [visitorCompany, setVisitorCompany] = useState("")
  const [error, setError] = useState("")
  const [plan, setPlan] = useState<BusinessPlan | null>(null)
  const [financials, setFinancials] = useState<Financial[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [comment, setComment] = useState("")
  const [commentSection, setCommentSection] = useState("general")

  const title = share.business_plans?.client_name || share.business_plans?.name || "Dossier riservato 4BID"

  const loadProtectedData = async () => {
    const [contentRes, financialsRes, commentsRes] = await Promise.all([
      fetch(`/api/business-plan/shared/${token}/content`, { cache: "no-store" }),
      fetch(`/api/business-plan/shared/${token}/financials`, { cache: "no-store" }),
      fetch(`/api/business-plan/shared/${token}/comments`, { cache: "no-store" }),
    ])
    if (!contentRes.ok) throw new Error("Impossibile caricare il dossier")
    setPlan(await contentRes.json())
    if (financialsRes.ok) setFinancials(await financialsRes.json())
    if (commentsRes.ok) setComments(await commentsRes.json())
  }

  const login = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/business-plan/shared/${token}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, visitorName, visitorEmail, visitorCompany }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Accesso non autorizzato")
        return
      }
      await loadProtectedData()
      setAuthenticated(true)
    } catch {
      setError("Errore durante l'accesso al dossier")
    } finally {
      setLoading(false)
    }
  }

  const submitComment = async () => {
    if (!comment.trim()) return
    const res = await fetch(`/api/business-plan/shared/${token}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment, section: commentSection }),
    })
    if (!res.ok) {
      toast.error("Impossibile inviare il commento")
      return
    }
    const saved = await res.json()
    setComments((items) => [...items, saved])
    setComment("")
    toast.success("Commento registrato")
  }

  const calculate = (fin: Financial) => {
    if (!plan) return { revenue: 0, ebitda: 0, netIncome: 0, revpar: 0 }
    const rooms = plan.num_rooms || 0
    const days = plan.opening_days_year || 365
    const roomNights = rooms * days * ((fin.occupancy_rate || 0) / 100)
    const roomRevenue = roomNights * (fin.adr || 0)
    const fb = roomRevenue * ((fin.fb_revenue_pct || 0) / 100)
    const spa = plan.has_spa ? roomRevenue * ((fin.spa_revenue_pct || 0) / 100) : 0
    const congress = plan.has_congress ? roomRevenue * ((fin.congress_revenue_pct || 0) / 100) : 0
    const other = roomRevenue * ((fin.other_revenue_pct || 0) / 100)
    const revenue = roomRevenue + fb + spa + congress + other
    const variable =
      roomRevenue * ((fin.rooms_cost_pct || 0) / 100) +
      fb * ((fin.fb_cost_pct || 0) / 100) +
      spa * ((fin.spa_cost_pct || 0) / 100) +
      congress * ((fin.congress_cost_pct || 0) / 100)
    const fixed =
      (fin.staff_rooms_cost || 0) + (fin.staff_fb_cost || 0) + (fin.staff_spa_cost || 0) +
      (fin.staff_congress_cost || 0) + (fin.staff_admin_cost || 0) + (fin.rent_cost || 0) +
      (fin.utilities_cost || 0) + (fin.marketing_cost || 0) + (fin.maintenance_cost || 0) +
      (fin.insurance_cost || 0) + (fin.admin_cost || 0) + (fin.other_fixed_cost || 0)
    const ebitda = revenue - variable - fixed
    const ebt = ebitda - (fin.depreciation || 0) - (fin.interest_cost || 0)
    const taxes = ebt > 0 ? ebt * ((fin.tax_rate || 0) / 100) : 0
    return { revenue, ebitda, netIncome: ebt - taxes, revpar: rooms && days ? revenue / (rooms * days) : 0 }
  }

  if (!authenticated || !plan) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 flex items-center justify-center">
        <Card className="w-full max-w-lg border-slate-800 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <img src="https://4bid.it/logo.png" alt="4BID" className="h-10 mx-auto" />
            <div className="mx-auto rounded-full bg-amber-500/10 p-3"><Lock className="h-8 w-8 text-amber-500" /></div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>Dossier riservato. Identificati e inserisci la password ricevuta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Nome e cognome</Label><Input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Azienda / Istituto</Label><Input value={visitorCompany} onChange={(e) => setVisitorCompany(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={visitorEmail} onChange={(e) => setVisitorEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} /></div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full bg-amber-500 hover:bg-amber-600" disabled={loading || !password || !visitorName || !visitorEmail} onClick={login}>
              <Eye className="mr-2 h-4 w-4" />{loading ? "Accesso..." : "Accedi al dossier"}
            </Button>
            <div className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" /><span>L'accesso è personale e viene registrato per finalità di sicurezza e tracciabilità del documento.</span></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-4"><img src="https://4bid.it/logo.png" alt="4BID" className="h-8" /><div><h1 className="font-semibold">{plan.client_name || plan.name}</h1><p className="text-xs text-muted-foreground">Dossier riservato · {visitorName}{visitorCompany ? ` · ${visitorCompany}` : ""}</p></div></div>
          {share.can_download && <Button asChild className="bg-amber-500 hover:bg-amber-600"><a href={`/api/business-plan/shared/${token}/download`} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" />Scarica PDF</a></Button>}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <Card><CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-5">
          <div><p className="text-xs text-muted-foreground">Località</p><p className="font-medium">{plan.location || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Camere</p><p className="font-medium">{plan.num_rooms || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Categoria</p><p className="font-medium">{plan.stars ? `${plan.stars} stelle` : "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Investimento</p><p className="font-medium">{euro(plan.initial_investment || 0)}</p></div>
          <div><p className="text-xs text-muted-foreground">Orizzonte</p><p className="font-medium">{plan.projection_years ? `${plan.projection_years} anni` : "—"}</p></div>
        </CardContent></Card>

        <Tabs defaultValue="summary">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-5">
            <TabsTrigger value="summary">Executive</TabsTrigger><TabsTrigger value="market">Mercato</TabsTrigger><TabsTrigger value="financials">Numeri</TabsTrigger><TabsTrigger value="strategy">Strategia</TabsTrigger><TabsTrigger value="comments">Commenti</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="space-y-4"><Card><CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap leading-7">{plan.executive_summary || plan.description || "—"}</CardContent></Card><Card><CardHeader><CardTitle>Business Model</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap leading-7">{plan.business_model || "—"}</CardContent></Card></TabsContent>
          <TabsContent value="market"><Card><CardHeader><CardTitle>Analisi di mercato</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap leading-7">{plan.market_analysis || "—"}</CardContent></Card></TabsContent>
          <TabsContent value="financials" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">{financials.map((fin) => { const kpi = calculate(fin); const year = (plan.start_year || new Date().getFullYear()) + fin.year_number - 1; return <Card key={fin.year_number}><CardHeader><CardTitle>{year}</CardTitle><CardDescription>Scenario previsionale</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><div className="flex justify-between"><span>Ricavi</span><strong>{euro(kpi.revenue)}</strong></div><div className="flex justify-between"><span>EBITDA</span><strong>{euro(kpi.ebitda)}</strong></div><div className="flex justify-between"><span>Utile netto</span><strong>{euro(kpi.netIncome)}</strong></div><div className="flex justify-between"><span>RevPAR</span><strong>{euro(kpi.revpar)}</strong></div><div className="flex justify-between"><span>Occupazione</span><strong>{fin.occupancy_rate || 0}%</strong></div><div className="flex justify-between"><span>ADR</span><strong>{euro(fin.adr || 0)}</strong></div></CardContent></Card> })}</div>
            {financials.length === 0 && <Card><CardContent className="p-6 text-muted-foreground">Nessuna proiezione finanziaria disponibile.</CardContent></Card>}
          </TabsContent>
          <TabsContent value="strategy" className="space-y-4"><Card><CardHeader><CardTitle>Strategia commerciale e marketing</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap leading-7">{plan.marketing_strategy || "—"}</CardContent></Card><Card><CardHeader><CardTitle>Management</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap leading-7">{plan.management_team || "—"}</CardContent></Card><Card><CardHeader><CardTitle>Rischi e mitigazioni</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap leading-7">{plan.risk_analysis || "—"}</CardContent></Card></TabsContent>
          <TabsContent value="comments" className="space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Q&A sul dossier</CardTitle><CardDescription>I commenti sono associati all'identità usata per l'accesso.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-3">{comments.map((item) => <div key={item.id} className="rounded-lg border bg-white p-4"><div className="mb-1 text-sm font-medium">{item.author_name}</div><div className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("it-IT")}</div><p className="mt-2 whitespace-pre-wrap text-sm">{item.content}</p></div>)}</div><div className="grid gap-3"><select className="h-10 rounded-md border bg-background px-3 text-sm" value={commentSection} onChange={(e) => setCommentSection(e.target.value)}><option value="general">Generale</option><option value="financials">Dati finanziari</option><option value="market">Mercato</option><option value="strategy">Strategia</option></select><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Scrivi una domanda o un commento..." /><Button onClick={submitComment} disabled={!comment.trim()}>Invia commento</Button></div></CardContent></Card></TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
