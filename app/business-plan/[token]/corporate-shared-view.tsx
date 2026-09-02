"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  Building2,
  Download,
  Eye,
  Lock,
  MessageSquare,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Share {
  id: string
  email?: string
  can_download?: boolean
  business_plans?: { name?: string; client_name?: string; project_type?: string } | null
}

interface BusinessPlan {
  id: string
  name: string
  description?: string
  client_name?: string
  project_type?: string
  executive_summary?: string
  market_analysis?: string
  business_model?: string
  marketing_strategy?: string
  management_team?: string
  risk_analysis?: string
}

interface Comment {
  id: string
  author_name: string
  content: string
  created_at: string
}

interface Product {
  name: string
  area: string
  tagline: string
  description: string
  pricing: string
}

interface Scenario {
  name: string
  accounts: number[]
  revenue: number[]
  recurring: number[]
  ebitda: number[]
  margin: number[]
}

interface BenchmarkRow {
  suite: string
  competitor: string
  company: string
  price: string
  functionality: number
  priceCompetitiveness: number
  comment: string
}

interface CorporateDossierData {
  dossierVersion?: number
  documentDate?: string
  funding?: {
    amount: number
    graceMonths: number
    amortizationMonths: number
    illustrativeRate: number
    annualDebtService: number
  }
  snapshot?: Array<{ label: string; value: string }>
  products?: Product[]
  scenarios?: Scenario[]
  benchmark?: BenchmarkRow[]
  pricingNotes?: string[]
  exit?: string
  presentationIntro?: string
  videoUrl?: string | null
}

const YEARS = [2027, 2028, 2029, 2030, 2031]

const money = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0)

const compactMoney = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }).format(value || 0)

function parseCorporateData(raw?: string): CorporateDossierData {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export default function CorporateSharedBusinessPlanView({ share, token }: { share: Share; token: string }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [visitorName, setVisitorName] = useState("")
  const [visitorEmail, setVisitorEmail] = useState("")
  const [visitorCompany, setVisitorCompany] = useState("")
  const [error, setError] = useState("")
  const [plan, setPlan] = useState<BusinessPlan | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [comment, setComment] = useState("")
  const [commentSection, setCommentSection] = useState("general")
  const [playing, setPlaying] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)

  const title = share.business_plans?.client_name || share.business_plans?.name || "4BID — Dossier riservato"
  const dossier = useMemo(() => parseCorporateData(plan?.description), [plan?.description])

  const track = async (eventType: string, metadata: Record<string, unknown> = {}) => {
    try {
      await fetch(`/api/business-plan/shared/${token}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, metadata }),
      })
    } catch {
      // Analytics must never block the dossier experience.
    }
  }

  const loadProtectedData = async () => {
    const [contentRes, commentsRes] = await Promise.all([
      fetch(`/api/business-plan/shared/${token}/content`, { cache: "no-store" }),
      fetch(`/api/business-plan/shared/${token}/comments`, { cache: "no-store" }),
    ])
    if (!contentRes.ok) throw new Error("Impossibile caricare il dossier")
    setPlan(await contentRes.json())
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

  const slides = useMemo(() => {
    const intro = {
      title: "4BID: quattro verticali, un unico ecosistema",
      subtitle: "Hospitality technology made in Italy",
      body:
        dossier.presentationIntro ||
        "Revenue management, controllo di gestione, operations e commerciale condividono lo stesso cliente e generano opportunità di cross-selling ricorrente.",
    }
    return [
      intro,
      ...(dossier.products || []).map((product) => ({
        title: product.name,
        subtitle: product.tagline || product.area,
        body: `${product.description} ${product.pricing ? `Posizionamento: ${product.pricing}.` : ""}`,
      })),
      {
        title: "La tesi industriale",
        subtitle: "Ricavi ricorrenti, verticalità e integrazione",
        body:
          "Il valore non è nella somma di quattro feature isolate, ma nella capacità di presidiare quattro budget dello stesso cliente con un ecosistema integrato e un costo marginale di cross-selling decrescente.",
      },
    ]
  }, [dossier.presentationIntro, dossier.products])

  useEffect(() => {
    if (!playing || !slides.length) return
    const slide = slides[slideIndex]
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(`${slide.title}. ${slide.subtitle}. ${slide.body}`)
      utterance.lang = "it-IT"
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    }
    track("presentation_slide_viewed", { slide_index: slideIndex, slide_title: slide.title })
    const timer = window.setTimeout(() => {
      if (slideIndex >= slides.length - 1) {
        setPlaying(false)
        track("presentation_completed", { slides: slides.length })
      } else {
        setSlideIndex((index) => index + 1)
      }
    }, 10500)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, slideIndex, slides.length])

  const startPresentation = () => {
    setSlideIndex(0)
    setPlaying(true)
    track("presentation_started", { slides: slides.length })
  }

  const stopPresentation = () => {
    setPlaying(false)
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel()
  }

  const handleTab = (value: string) => {
    if (value === "products") track("products_viewed")
    if (value === "scenarios") track("scenarios_viewed")
    if (value === "benchmark") track("benchmark_viewed")
  }

  if (!authenticated || !plan) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 flex items-center justify-center">
        <Card className="w-full max-w-lg border-slate-800 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <img src="https://4bid.it/logo.png" alt="4BID" className="h-10 mx-auto" />
            <div className="mx-auto rounded-full bg-amber-500/10 p-3"><Lock className="h-8 w-8 text-amber-500" /></div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>Dossier economico-finanziario riservato. Identificati e inserisci la password ricevuta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Nome e cognome</Label><Input autoComplete="name" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Azienda / Istituto</Label><Input value={visitorCompany} onChange={(e) => setVisitorCompany(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" autoComplete="email" value={visitorEmail} onChange={(e) => setVisitorEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label>Password</Label><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} /></div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full bg-amber-500 hover:bg-amber-600" disabled={loading || !password || !visitorName || !visitorEmail} onClick={login}>
              <Eye className="mr-2 h-4 w-4" />{loading ? "Accesso..." : "Accedi al dossier"}
            </Button>
            <div className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" /><span>L'accesso è personale e viene registrato per sicurezza e tracciabilità del documento.</span></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const funding = dossier.funding
  const realistic = dossier.scenarios?.find((scenario) => scenario.name.toLowerCase().includes("real"))

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <img src="https://4bid.it/logo.png" alt="4BID" className="h-8 shrink-0" />
            <div className="min-w-0"><h1 className="truncate font-semibold">{plan.client_name || plan.name}</h1><p className="truncate text-xs text-muted-foreground">Riservato · {visitorName}{visitorCompany ? ` · ${visitorCompany}` : ""}</p></div>
          </div>
          {share.can_download && (
            <Button asChild className="shrink-0 bg-amber-500 hover:bg-amber-600">
              <a href={`/api/business-plan/shared/${token}/corporate-report`} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" /><span className="hidden sm:inline">Stampa / salva dossier</span><span className="sm:hidden">Dossier</span></a>
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 px-4 py-8">
        <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl">
          <div className="grid gap-8 p-6 md:grid-cols-[1.2fr_.8fr] md:p-10">
            <div className="space-y-5">
              <Badge className="bg-amber-500 text-slate-950 hover:bg-amber-500">Business Plan 2027–2031</Badge>
              <div><h2 className="text-3xl font-bold tracking-tight md:text-4xl">4BID S.r.l. — dalla tecnologia proprietaria alla scala SaaS</h2><p className="mt-3 max-w-3xl text-slate-300">{plan.executive_summary || "Dossier economico-finanziario e competitivo a supporto della fase di scale-up."}</p></div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Finanziamento</p><p className="mt-1 text-2xl font-semibold">{funding ? money(funding.amount) : "€120.000"}</p></div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Piattaforme</p><p className="mt-1 text-2xl font-semibold">{dossier.products?.length || 4}</p></div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Ricavi 2031 realistico</p><p className="mt-1 text-2xl font-semibold">{realistic?.revenue?.[4] ? compactMoney(realistic.revenue[4] * 1000) : "€1,15 mln"}</p></div>
              </div>
            </div>

            <Card className="border-white/10 bg-white text-slate-950 shadow-2xl">
              <CardHeader><CardTitle className="flex items-center gap-2"><Play className="h-5 w-5 text-amber-500" />Presentazione prodotti</CardTitle><CardDescription>Una presentazione guidata, in stile preventivo, per capire l'ecosistema 4BID in pochi minuti.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {dossier.videoUrl ? (
                  <video className="w-full rounded-lg bg-black" controls src={dossier.videoUrl} onPlay={() => track("presentation_started", { source: "video" })} onEnded={() => track("presentation_completed", { source: "video" })} />
                ) : (
                  <>
                    <div className="min-h-52 rounded-xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white flex flex-col justify-between">
                      <div><p className="text-xs uppercase tracking-[.2em] text-amber-400">{slideIndex + 1} / {slides.length}</p><h3 className="mt-3 text-2xl font-semibold">{slides[slideIndex]?.title}</h3><p className="mt-1 text-sm text-slate-300">{slides[slideIndex]?.subtitle}</p></div>
                      <p className="mt-6 text-sm leading-6 text-slate-200">{slides[slideIndex]?.body}</p>
                    </div>
                    <div className="flex gap-2">
                      {!playing ? <Button onClick={startPresentation} className="flex-1 bg-amber-500 hover:bg-amber-600"><Play className="mr-2 h-4 w-4" />Avvia presentazione</Button> : <Button onClick={stopPresentation} variant="outline" className="flex-1"><Pause className="mr-2 h-4 w-4" />Pausa</Button>}
                      <Button variant="outline" onClick={() => setSlideIndex((index) => Math.min(index + 1, slides.length - 1))}>Avanti</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">La presentazione usa la voce disponibile sul dispositivo. Il player è già predisposto anche per un video MP4/Vimeo dedicato.</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {(dossier.snapshot || []).slice(0, 8).map((item) => <Card key={item.label}><CardContent className="p-5"><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-1 text-xl font-semibold">{item.value}</p></CardContent></Card>)}
        </section>

        <Tabs defaultValue="overview" onValueChange={handleTab}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-6">
            <TabsTrigger value="overview">Sintesi</TabsTrigger>
            <TabsTrigger value="products">Prodotti</TabsTrigger>
            <TabsTrigger value="scenarios">Scenari</TabsTrigger>
            <TabsTrigger value="benchmark">Competitor</TabsTrigger>
            <TabsTrigger value="strategy">Strategia</TabsTrigger>
            <TabsTrigger value="comments">Q&A</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-amber-500" />Tesi industriale</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap leading-7">{plan.business_model || "—"}</CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-amber-500" />Posizionamento</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap leading-7">{plan.market_analysis || "—"}</CardContent></Card>
            </div>
            {funding && <Card><CardHeader><CardTitle>Struttura del finanziamento richiesto</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><div><p className="text-xs text-muted-foreground">Capitale</p><p className="font-semibold">{money(funding.amount)}</p></div><div><p className="text-xs text-muted-foreground">Preammortamento</p><p className="font-semibold">{funding.graceMonths} mesi</p></div><div><p className="text-xs text-muted-foreground">Ammortamento</p><p className="font-semibold">{funding.amortizationMonths} mesi</p></div><div><p className="text-xs text-muted-foreground">Tasso illustrativo</p><p className="font-semibold">{funding.illustrativeRate.toFixed(1)}%</p></div><div><p className="text-xs text-muted-foreground">Debt service annuo</p><p className="font-semibold">{money(funding.annualDebtService)}</p></div></CardContent></Card>}
          </TabsContent>

          <TabsContent value="products" className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              {(dossier.products || []).map((product) => <Card key={product.name} className="overflow-hidden"><div className="h-1 bg-amber-500" /><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{product.name}</CardTitle><CardDescription>{product.area}</CardDescription></div><Sparkles className="h-5 w-5 text-amber-500" /></div></CardHeader><CardContent className="space-y-3"><p className="font-medium">{product.tagline}</p><p className="text-sm leading-6 text-muted-foreground">{product.description}</p><Badge variant="secondary">{product.pricing}</Badge></CardContent></Card>)}
            </div>
            {dossier.pricingNotes?.length ? <Card><CardHeader><CardTitle>Calibrazione listini 2026</CardTitle></CardHeader><CardContent className="space-y-2">{dossier.pricingNotes.map((note) => <div key={note} className="rounded-lg border bg-slate-50 p-3 text-sm">{note}</div>)}</CardContent></Card> : null}
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-5">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-amber-500" />Business Plan 2027–2031</CardTitle><CardDescription>Tre scenari gestionali; valori di ricavi ed EBITDA in migliaia di euro.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b bg-slate-50"><th className="p-3 text-left">Scenario / KPI</th>{YEARS.map((year) => <th key={year} className="p-3 text-right">{year}</th>)}</tr></thead><tbody>{(dossier.scenarios || []).flatMap((scenario) => [<tr key={`${scenario.name}-head`} className="border-b bg-amber-50/60"><td colSpan={6} className="p-3 font-semibold">{scenario.name}</td></tr>,<tr key={`${scenario.name}-revenue`} className="border-b"><td className="p-3">Ricavi (k€)</td>{scenario.revenue.map((value, index) => <td key={index} className="p-3 text-right font-medium">{value}</td>)}</tr>,<tr key={`${scenario.name}-ebitda`} className="border-b"><td className="p-3">EBITDA (k€)</td>{scenario.ebitda.map((value, index) => <td key={index} className="p-3 text-right">{value}</td>)}</tr>,<tr key={`${scenario.name}-accounts`} className="border-b"><td className="p-3">Account/property</td>{scenario.accounts.map((value, index) => <td key={index} className="p-3 text-right">{value}</td>)}</tr>,<tr key={`${scenario.name}-recurring`} className="border-b"><td className="p-3">Ricavi ricorrenti</td>{scenario.recurring.map((value, index) => <td key={index} className="p-3 text-right">{value}%</td>)}</tr>])}</tbody></table></CardContent></Card>
          </TabsContent>

          <TabsContent value="benchmark" className="space-y-5">
            <Card><CardHeader><CardTitle>Benchmark competitivo 2026</CardTitle><CardDescription>Valutazioni 4BID 0–5 su funzionalità e competitività economica. Non sono recensioni utenti.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[1050px] text-sm"><thead><tr className="border-b bg-slate-950 text-white"><th className="p-3 text-left">Area</th><th className="p-3 text-left">Prodotto</th><th className="p-3 text-left">Azienda</th><th className="p-3 text-left">Prezzo indicativo</th><th className="p-3 text-center">Funz.</th><th className="p-3 text-center">Prezzo</th><th className="p-3 text-left">Lettura 4BID</th></tr></thead><tbody>{(dossier.benchmark || []).map((row, index) => <tr key={`${row.suite}-${row.competitor}-${index}`} className="border-b align-top"><td className="p-3 font-medium">{row.suite}</td><td className="p-3">{row.competitor}</td><td className="p-3 text-muted-foreground">{row.company}</td><td className="p-3 whitespace-nowrap">{row.price}</td><td className="p-3 text-center font-semibold">{row.functionality.toFixed(1)}/5</td><td className="p-3 text-center font-semibold">{row.priceCompetitiveness.toFixed(1)}/5</td><td className="p-3 text-muted-foreground">{row.comment}</td></tr>)}</tbody></table></CardContent></Card>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>Impiego e strategia di scale-up</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap leading-7">{plan.marketing_strategy || "—"}</CardContent></Card><Card><CardHeader><CardTitle>Solidità e capacità di rimborso</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap leading-7">{plan.management_team || "—"}</CardContent></Card></div>
            <Card><CardHeader><CardTitle>Rischi e mitigazioni</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap leading-7">{plan.risk_analysis || "—"}</CardContent></Card>
            {dossier.exit && <Card className="border-amber-200 bg-amber-50/40"><CardHeader><CardTitle>Opzione strategica di exit</CardTitle></CardHeader><CardContent className="leading-7">{dossier.exit}</CardContent></Card>}
          </TabsContent>

          <TabsContent value="comments" className="space-y-5">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Q&A sul dossier</CardTitle><CardDescription>Domande e commenti restano associati all'identità usata per l'accesso.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="space-y-3">{comments.length === 0 && <p className="text-sm text-muted-foreground">Nessun commento ancora.</p>}{comments.map((item) => <div key={item.id} className="rounded-lg border bg-white p-4"><div className="font-medium">{item.author_name}</div><div className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("it-IT")}</div><p className="mt-2 whitespace-pre-wrap text-sm">{item.content}</p></div>)}</div><div className="grid gap-3"><select className="h-10 rounded-md border bg-background px-3 text-sm" value={commentSection} onChange={(e) => setCommentSection(e.target.value)}><option value="general">Generale</option><option value="financials">Numeri e scenari</option><option value="benchmark">Benchmark</option><option value="products">Prodotti</option></select><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Scrivi una domanda o un commento..." rows={4} /><Button onClick={submitComment} disabled={!comment.trim()} className="w-fit bg-amber-500 hover:bg-amber-600">Invia commento</Button></div></CardContent></Card>
          </TabsContent>
        </Tabs>

        <p className="pb-6 text-center text-xs text-muted-foreground">Documento riservato. Le proiezioni sono scenari gestionali e non costituiscono garanzia di risultati futuri. I prezzi competitor sono indicativi e soggetti alle condizioni dei rispettivi vendor.</p>
      </main>
    </div>
  )
}
