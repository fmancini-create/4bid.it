"use client"

import { useState } from "react"
import { Lock, Eye, Download, Send, MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface BusinessPlan {
  id: string
  name: string
  description: string
  client_name: string
  project_type: string
  num_rooms: number
  stars: number
  has_spa: boolean
  has_restaurant: boolean
  has_congress: boolean
  location: string
  opening_days_year: number
  projection_years: number
  start_year: number
  initial_investment: number
  executive_summary: string
  market_analysis: string
  business_model: string
  marketing_strategy: string
  management_team: string
  risk_analysis: string
}

interface Share {
  id: string
  email: string
  can_edit: boolean
  can_download: boolean
  business_plans: BusinessPlan
}

interface BusinessPlanFinancials {
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
  author_email: string
  section: string
  content: string
  created_at: string
}

interface Props {
  share: Share
  token: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value)
}

const formatPercent = (value: number, total: number) => {
  if (total === 0) return "-"
  return `${((value / total) * 100).toFixed(1)}%`
}

export default function SharedBusinessPlanView({ share, token }: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [financials, setFinancials] = useState<BusinessPlanFinancials[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [newComment, setNewComment] = useState({ name: "", email: "", content: "", section: "general" })
  const [submittingComment, setSubmittingComment] = useState(false)

  const plan = share.business_plans

  const handleLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/business-plan/shared/${token}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        setIsAuthenticated(true)
        // Carica i dati finanziari
        const finRes = await fetch(`/api/business-plan/shared/${token}/financials`)
        if (finRes.ok) {
          const data = await finRes.json()
          setFinancials(data)
        }
        // Carica i commenti
        loadComments()
      } else {
        setError("Password non corretta")
      }
    } catch {
      setError("Errore durante l'autenticazione")
    }

    setIsLoading(false)
  }

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/business-plan/shared/${token}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch (e) {
      console.error("Error loading comments:", e)
    }
  }

  const submitComment = async () => {
    if (!newComment.name || !newComment.content) {
      toast.error("Nome e commento sono obbligatori")
      return
    }
    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/business-plan/shared/${token}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: newComment.name,
          author_email: newComment.email || share.email,
          section: newComment.section,
          content: newComment.content,
        }),
      })
      if (res.ok) {
        toast.success("Commento inviato!")
        setNewComment({ name: "", email: "", content: "", section: "general" })
        setShowCommentForm(false)
        loadComments()
      } else {
        toast.error("Errore nell'invio del commento")
      }
    } catch {
      toast.error("Errore nell'invio del commento")
    }
    setSubmittingComment(false)
  }

  const downloadPDF = () => {
    window.open(`/api/business-plan/${plan.id}/pdf`, "_blank")
  }

  // Calcola il conto economico
  const calculatePL = (fin: BusinessPlanFinancials) => {
    const roomNights = plan.num_rooms * plan.opening_days_year * (fin.occupancy_rate / 100)
    const roomRevenue = roomNights * fin.adr
    const fbRevenue = roomRevenue * (fin.fb_revenue_pct / 100)
    const spaRevenue = plan.has_spa ? roomRevenue * (fin.spa_revenue_pct / 100) : 0
    const congressRevenue = plan.has_congress ? roomRevenue * (fin.congress_revenue_pct / 100) : 0
    const otherRevenue = roomRevenue * (fin.other_revenue_pct / 100)
    const totalRevenue = roomRevenue + fbRevenue + spaRevenue + congressRevenue + otherRevenue

    const roomCosts = roomRevenue * (fin.rooms_cost_pct / 100)
    const fbCosts = fbRevenue * (fin.fb_cost_pct / 100)
    const spaCosts = spaRevenue * ((fin.spa_cost_pct || 25) / 100)
    const congressCosts = congressRevenue * ((fin.congress_cost_pct || 45) / 100)
    const totalVariableCosts = roomCosts + fbCosts + spaCosts + congressCosts

    const staffCost =
      (fin.staff_rooms_cost || 0) +
      (fin.staff_fb_cost || 0) +
      (plan.has_spa ? fin.staff_spa_cost || 0 : 0) +
      (plan.has_congress ? fin.staff_congress_cost || 0 : 0) +
      (fin.staff_admin_cost || 0)
    const totalFixedCosts =
      staffCost +
      (fin.rent_cost || 0) +
      (fin.utilities_cost || 0) +
      (fin.marketing_cost || 0) +
      (fin.maintenance_cost || 0) +
      (fin.insurance_cost || 0) +
      (fin.admin_cost || 0) +
      (fin.other_fixed_cost || 0)

    const ebitda = totalRevenue - totalVariableCosts - totalFixedCosts
    const depreciation = fin.depreciation || 150000
    const interest = fin.interest_cost || 80000
    const ebt = ebitda - depreciation - interest
    const taxes = ebt > 0 ? ebt * (fin.tax_rate / 100) : 0
    const netIncome = ebt - taxes
    const revpar = totalRevenue / (plan.num_rooms * plan.opening_days_year)

    return {
      roomNights,
      roomRevenue,
      fbRevenue,
      spaRevenue,
      congressRevenue,
      otherRevenue,
      totalRevenue,
      totalVariableCosts,
      totalFixedCosts,
      ebitda,
      depreciation,
      interest,
      ebt,
      taxes,
      netIncome,
      revpar,
    }
  }

  // Schermata di login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src="https://4bid.it/logo.png" alt="4BID.IT" className="h-12 mx-auto mb-4" />
            <Lock className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <CardTitle>{plan.client_name || plan.name}</CardTitle>
            <CardDescription>Inserisci la password per accedere al business plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Inserisci la password"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600"
              onClick={handleLogin}
              disabled={isLoading || !password}
            >
              <Eye className="h-4 w-4 mr-2" />
              {isLoading ? "Verifica..." : "Accedi"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Vista del business plan
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="https://4bid.it/logo.png" alt="4BID.IT" className="h-8" />
            <div>
              <h1 className="text-xl font-bold">{plan.client_name || plan.name}</h1>
              <p className="text-sm text-muted-foreground">{plan.location}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCommentForm(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Commenta
            </Button>
            {share.can_download && (
              <Button onClick={downloadPDF} className="bg-amber-500 hover:bg-amber-600">
                <Download className="h-4 w-4 mr-2" />
                Scarica PDF
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-8 space-y-6">
        {/* Info generali */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Progetto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{plan.location || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Camere</p>
                <p className="font-medium">{plan.num_rooms}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categoria</p>
                <p className="font-medium">
                  {plan.stars} Stelle{plan.stars === 4 ? " Superior" : ""}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investimento</p>
                <p className="font-medium">{formatCurrency(plan.initial_investment || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Servizi</p>
                <p className="font-medium">
                  {[plan.has_restaurant && "Ristorante", plan.has_spa && "SPA", plan.has_congress && "Congressi"]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Executive Summary</TabsTrigger>
            <TabsTrigger value="financials">Proiezioni</TabsTrigger>
            <TabsTrigger value="details">Dettagli</TabsTrigger>
            <TabsTrigger value="comments">Commenti ({comments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            {plan.executive_summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{plan.executive_summary}</p>
                </CardContent>
              </Card>
            )}

            {plan.market_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Analisi di Mercato</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{plan.market_analysis}</p>
                </CardContent>
              </Card>
            )}

            {plan.business_model && (
              <Card>
                <CardHeader>
                  <CardTitle>Business Model</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{plan.business_model}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="financials" className="space-y-6">
            {financials.length > 0 && (
              <>
                {/* KPI */}
                <div className="grid gap-4 md:grid-cols-3">
                  {financials.map((fin) => {
                    const pl = calculatePL(fin)
                    const year = (plan.start_year || 2025) + fin.year_number - 1
                    return (
                      <Card key={fin.year_number} className="border-amber-200">
                        <CardHeader className="pb-2 bg-amber-50">
                          <CardTitle className="text-lg">Anno {year}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm pt-4">
                          <div className="flex justify-between">
                            <span>Ricavi Totali</span>
                            <span className="font-medium">{formatCurrency(pl.totalRevenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>EBITDA</span>
                            <span className={`font-medium ${pl.ebitda >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(pl.ebitda)} ({formatPercent(pl.ebitda, pl.totalRevenue)})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Utile Netto</span>
                            <span className={`font-medium ${pl.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(pl.netIncome)} ({formatPercent(pl.netIncome, pl.totalRevenue)})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>RevPAR</span>
                            <span className="font-medium">{formatCurrency(pl.revpar)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Tabella riepilogativa */}
                <Card>
                  <CardHeader>
                    <CardTitle>Conto Economico Previsionale</CardTitle>
                    <CardDescription>Tutti i valori sono IVA esclusa</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-amber-50">
                          <th className="text-left py-3 pr-4 font-medium">Voce</th>
                          {financials.map((fin) => {
                            const year = (plan.start_year || 2025) + fin.year_number - 1
                            return (
                              <th key={fin.year_number} className="text-right py-3 px-2 font-medium" colSpan={2}>
                                {year}
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Ricavi */}
                        <tr className="border-b font-semibold bg-gray-50">
                          <td className="py-2" colSpan={financials.length * 2 + 1}>
                            RICAVI
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Room Division</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td key={fin.year_number} className="text-right py-2 px-2" colSpan={2}>
                                {formatCurrency(pl.roomRevenue)}{" "}
                                <span className="text-muted-foreground text-xs">
                                  ({formatPercent(pl.roomRevenue, pl.totalRevenue)})
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Food & Beverage</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td key={fin.year_number} className="text-right py-2 px-2" colSpan={2}>
                                {formatCurrency(pl.fbRevenue)}{" "}
                                <span className="text-muted-foreground text-xs">
                                  ({formatPercent(pl.fbRevenue, pl.totalRevenue)})
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                        {plan.has_spa && (
                          <tr className="border-b">
                            <td className="py-2">SPA & Wellness</td>
                            {financials.map((fin) => {
                              const pl = calculatePL(fin)
                              return (
                                <td key={fin.year_number} className="text-right py-2 px-2" colSpan={2}>
                                  {formatCurrency(pl.spaRevenue)}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    ({formatPercent(pl.spaRevenue, pl.totalRevenue)})
                                  </span>
                                </td>
                              )
                            })}
                          </tr>
                        )}
                        {plan.has_congress && (
                          <tr className="border-b">
                            <td className="py-2">Centro Congressi</td>
                            {financials.map((fin) => {
                              const pl = calculatePL(fin)
                              return (
                                <td key={fin.year_number} className="text-right py-2 px-2" colSpan={2}>
                                  {formatCurrency(pl.congressRevenue)}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    ({formatPercent(pl.congressRevenue, pl.totalRevenue)})
                                  </span>
                                </td>
                              )
                            })}
                          </tr>
                        )}
                        <tr className="border-b font-medium">
                          <td className="py-2">Totale Ricavi</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td key={fin.year_number} className="text-right py-2 px-2" colSpan={2}>
                                <strong>{formatCurrency(pl.totalRevenue)}</strong>
                              </td>
                            )
                          })}
                        </tr>
                        {/* Costi */}
                        <tr className="border-b">
                          <td className="py-2">Costi Variabili</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td key={fin.year_number} className="text-right py-2 px-2 text-red-600" colSpan={2}>
                                -{formatCurrency(pl.totalVariableCosts)}{" "}
                                <span className="text-xs">
                                  ({formatPercent(pl.totalVariableCosts, pl.totalRevenue)})
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Costi Fissi</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td key={fin.year_number} className="text-right py-2 px-2 text-red-600" colSpan={2}>
                                -{formatCurrency(pl.totalFixedCosts)}{" "}
                                <span className="text-xs">({formatPercent(pl.totalFixedCosts, pl.totalRevenue)})</span>
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b bg-green-50 font-semibold">
                          <td className="py-2">EBITDA</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td
                                key={fin.year_number}
                                className={`text-right py-2 px-2 ${pl.ebitda >= 0 ? "text-green-600" : "text-red-600"}`}
                                colSpan={2}
                              >
                                {formatCurrency(pl.ebitda)}{" "}
                                <span className="text-xs">({formatPercent(pl.ebitda, pl.totalRevenue)})</span>
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Ammortamenti</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td key={fin.year_number} className="text-right py-2 px-2 text-red-600" colSpan={2}>
                                -{formatCurrency(pl.depreciation)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Oneri Finanziari</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td key={fin.year_number} className="text-right py-2 px-2 text-red-600" colSpan={2}>
                                -{formatCurrency(pl.interest)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Imposte</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td key={fin.year_number} className="text-right py-2 px-2 text-red-600" colSpan={2}>
                                -{formatCurrency(pl.taxes)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="bg-amber-100 font-bold">
                          <td className="py-3">UTILE NETTO</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td
                                key={fin.year_number}
                                className={`text-right py-3 px-2 ${pl.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
                                colSpan={2}
                              >
                                {formatCurrency(pl.netIncome)}{" "}
                                <span className="text-xs font-normal">
                                  ({formatPercent(pl.netIncome, pl.totalRevenue)})
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {plan.marketing_strategy && (
              <Card>
                <CardHeader>
                  <CardTitle>Strategia Marketing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{plan.marketing_strategy}</p>
                </CardContent>
              </Card>
            )}

            {plan.management_team && (
              <Card>
                <CardHeader>
                  <CardTitle>Team di Gestione</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{plan.management_team}</p>
                </CardContent>
              </Card>
            )}

            {plan.risk_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Analisi dei Rischi</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{plan.risk_analysis}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Commenti e Feedback</CardTitle>
                <Button onClick={() => setShowCommentForm(true)} size="sm" className="bg-amber-500 hover:bg-amber-600">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Nuovo Commento
                </Button>
              </CardHeader>
              <CardContent>
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nessun commento ancora. Sii il primo a lasciare un feedback!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{comment.author_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString("it-IT", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          {comment.section !== "general" && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                              {comment.section}
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="font-medium">4BID S.r.l.</p>
          <p>Via Dalmazia, 51 - 72017 Ostuni (BR) | P.IVA: 02664480745</p>
          <p>Tel: +39 347 968 8586 | Email: info@4bid.it</p>
        </div>
      </footer>

      {/* Comment Form Dialog */}
      {showCommentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lascia un Commento</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowCommentForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={newComment.name}
                  onChange={(e) => setNewComment({ ...newComment, name: e.target.value })}
                  placeholder="Il tuo nome"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newComment.email}
                  onChange={(e) => setNewComment({ ...newComment, email: e.target.value })}
                  placeholder="La tua email (opzionale)"
                />
              </div>
              <div className="space-y-2">
                <Label>Sezione</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={newComment.section}
                  onChange={(e) => setNewComment({ ...newComment, section: e.target.value })}
                >
                  <option value="general">Generale</option>
                  <option value="executive_summary">Executive Summary</option>
                  <option value="market_analysis">Analisi di Mercato</option>
                  <option value="financials">Proiezioni Finanziarie</option>
                  <option value="marketing">Strategia Marketing</option>
                  <option value="risks">Analisi Rischi</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Commento *</Label>
                <Textarea
                  value={newComment.content}
                  onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                  placeholder="Scrivi il tuo feedback..."
                  rows={4}
                />
              </div>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600"
                onClick={submitComment}
                disabled={submittingComment || !newComment.name || !newComment.content}
              >
                <Send className="h-4 w-4 mr-2" />
                {submittingComment ? "Invio..." : "Invia Commento"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
