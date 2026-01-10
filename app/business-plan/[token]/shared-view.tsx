"use client"

import { useState } from "react"
import { Lock, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  location: string
  opening_days_year: number
  projection_years: number
  start_year: number
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
  year: number
  occupancy_rate: number
  adr: number
  fb_revenue_per_room_night: number
  fb_external_covers_day: number
  fb_avg_ticket_external: number
  spa_revenue_per_room_night: number
  spa_external_clients_day: number
  spa_avg_ticket_external: number
  other_revenue_per_room_night: number
  room_cost_pct: number
  fb_cost_pct: number
  spa_cost_pct: number
  staff_cost_monthly: number
  rent_cost_monthly: number
  utilities_cost_monthly: number
  maintenance_cost_monthly: number
  insurance_cost_monthly: number
  marketing_cost_monthly: number
  admin_cost_monthly: number
  ota_commission_pct: number
  ota_share_pct: number
  other_fixed_monthly: number
  initial_investment: number
  depreciation_years: number
  loan_amount: number
  loan_interest_rate: number
  loan_years: number
}

interface Props {
  share: Share
  token: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value)
}

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`
}

export default function SharedBusinessPlanView({ share, token }: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [financials, setFinancials] = useState<BusinessPlanFinancials[]>([])

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
      } else {
        setError("Password non corretta")
      }
    } catch {
      setError("Errore durante l'autenticazione")
    }

    setIsLoading(false)
  }

  // Calcola il conto economico
  const calculatePL = (fin: BusinessPlanFinancials) => {
    const roomNights = plan.num_rooms * plan.opening_days_year * (fin.occupancy_rate / 100)
    const roomRevenue = roomNights * fin.adr
    const fbRevenueInternal = roomNights * fin.fb_revenue_per_room_night
    const fbRevenueExternal = fin.fb_external_covers_day * plan.opening_days_year * fin.fb_avg_ticket_external
    const fbRevenue = fbRevenueInternal + fbRevenueExternal
    const spaRevenueInternal = roomNights * fin.spa_revenue_per_room_night
    const spaRevenueExternal = fin.spa_external_clients_day * plan.opening_days_year * fin.spa_avg_ticket_external
    const spaRevenue = spaRevenueInternal + spaRevenueExternal
    const otherRevenue = roomNights * fin.other_revenue_per_room_night
    const totalRevenue = roomRevenue + fbRevenue + spaRevenue + otherRevenue

    const roomCosts = roomRevenue * (fin.room_cost_pct / 100)
    const fbCosts = fbRevenue * (fin.fb_cost_pct / 100)
    const spaCosts = spaRevenue * (fin.spa_cost_pct / 100)
    const otaCommissions = roomRevenue * (fin.ota_share_pct / 100) * (fin.ota_commission_pct / 100)
    const totalVariableCosts = roomCosts + fbCosts + spaCosts + otaCommissions
    const contributionMargin = totalRevenue - totalVariableCosts

    const staffCosts = fin.staff_cost_monthly * 12
    const rentCosts = fin.rent_cost_monthly * 12
    const utilitiesCosts = fin.utilities_cost_monthly * 12
    const maintenanceCosts = fin.maintenance_cost_monthly * 12
    const insuranceCosts = fin.insurance_cost_monthly * 12
    const marketingCosts = fin.marketing_cost_monthly * 12
    const adminCosts = fin.admin_cost_monthly * 12
    const otherFixedCosts = fin.other_fixed_monthly * 12
    const totalFixedCosts =
      staffCosts +
      rentCosts +
      utilitiesCosts +
      maintenanceCosts +
      insuranceCosts +
      marketingCosts +
      adminCosts +
      otherFixedCosts

    const ebitda = contributionMargin - totalFixedCosts
    const depreciation = fin.initial_investment / fin.depreciation_years
    const ebit = ebitda - depreciation
    const interestExpense = fin.loan_amount * (fin.loan_interest_rate / 100)
    const ebt = ebit - interestExpense
    const taxes = ebt > 0 ? ebt * 0.279 : 0
    const netIncome = ebt - taxes

    return {
      roomNights,
      roomRevenue,
      fbRevenue,
      spaRevenue,
      otherRevenue,
      totalRevenue,
      totalVariableCosts,
      contributionMargin,
      totalFixedCosts,
      ebitda,
      depreciation,
      ebit,
      interestExpense,
      ebt,
      taxes,
      netIncome,
      revpar: roomRevenue / (plan.num_rooms * plan.opening_days_year),
      goppar: ebitda / (plan.num_rooms * plan.opening_days_year),
    }
  }

  // Schermata di login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle>{plan.name}</CardTitle>
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
            <Button className="w-full" onClick={handleLogin} disabled={isLoading || !password}>
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
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{plan.name}</h1>
            <p className="text-sm text-muted-foreground">{plan.client_name}</p>
          </div>
          {share.can_download && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Esporta PDF
            </Button>
          )}
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
                <p className="font-medium">{plan.stars} Stelle Superior</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Servizi</p>
                <p className="font-medium">
                  {[plan.has_spa && "SPA", plan.has_restaurant && "Ristorante"].filter(Boolean).join(", ") || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Executive Summary</TabsTrigger>
            <TabsTrigger value="financials">Proiezioni Finanziarie</TabsTrigger>
            <TabsTrigger value="details">Dettagli</TabsTrigger>
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
                    return (
                      <Card key={fin.year}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Anno {fin.year}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Ricavi Totali</span>
                            <span className="font-medium">{formatCurrency(pl.totalRevenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>EBITDA</span>
                            <span className={`font-medium ${pl.ebitda >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(pl.ebitda)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Utile Netto</span>
                            <span className={`font-medium ${pl.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(pl.netIncome)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>RevPAR</span>
                            <span className="font-medium">{formatCurrency(pl.revpar)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>GOPPAR</span>
                            <span className="font-medium">{formatCurrency(pl.goppar)}</span>
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
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4 font-medium">Voce</th>
                          {financials.map((fin) => (
                            <th key={fin.year} className="text-right py-2 px-2 font-medium">
                              {fin.year}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b font-medium">
                          <td className="py-2">Ricavi Totali</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td key={fin.year} className="text-right py-2 px-2">
                                {formatCurrency(pl.totalRevenue)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Costi Variabili</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td key={fin.year} className="text-right py-2 px-2 text-red-600">
                                -{formatCurrency(pl.totalVariableCosts)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b font-medium">
                          <td className="py-2">Margine di Contribuzione</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td key={fin.year} className="text-right py-2 px-2">
                                {formatCurrency(pl.contributionMargin)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Costi Fissi</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td key={fin.year} className="text-right py-2 px-2 text-red-600">
                                -{formatCurrency(pl.totalFixedCosts)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b bg-green-50 dark:bg-green-900/20 font-semibold">
                          <td className="py-2">EBITDA</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td
                                key={fin.year}
                                className={`text-right py-2 px-2 ${pl.ebitda >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {formatCurrency(pl.ebitda)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Ammortamenti + Interessi</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td key={fin.year} className="text-right py-2 px-2 text-red-600">
                                -{formatCurrency(pl.depreciation + pl.interestExpense)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Imposte</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td key={fin.year} className="text-right py-2 px-2 text-red-600">
                                -{formatCurrency(pl.taxes)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="bg-primary/10 font-bold">
                          <td className="py-3">UTILE NETTO</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(fin)
                            return (
                              <td
                                key={fin.year}
                                className={`text-right py-3 px-2 ${pl.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {formatCurrency(pl.netIncome)}
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
        </Tabs>
      </main>

      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        Business Plan condiviso da 4BID S.r.l.
      </footer>
    </div>
  )
}
