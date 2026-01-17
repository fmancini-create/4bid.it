"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lock, Calculator, FileText } from "lucide-react"
import Image from "next/image"

interface BusinessPlanViewerProps {
  planId: string
  token: string
}

export default function BusinessPlanViewer({ planId, token }: BusinessPlanViewerProps) {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<any>(null)
  const [params, setParams] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])

  const verifyPassword = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/business-plan/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      if (response.ok) {
        const data = await response.json()
        setPlan(data.plan)
        setParams(data.params)
        setSections(data.sections)
        setAuthenticated(true)
      } else {
        setError("Password non valida")
      }
    } catch (err) {
      setError("Errore di connessione")
    }

    setLoading(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  const calculateFinancials = (yearParams: any) => {
    const roomNights = yearParams.rooms_count * yearParams.days_open * (yearParams.occupancy_rate / 100)

    const revenueRooms = roomNights * yearParams.adr
    const revenueFbInternal = roomNights * yearParams.fb_revenue_per_room
    const revenueFbExternal = yearParams.fb_external_covers * yearParams.days_open * yearParams.fb_external_avg_ticket
    const revenueFb = revenueFbInternal + revenueFbExternal
    const revenueSpaInternal = roomNights * yearParams.spa_revenue_per_room
    const revenueSpaExternal = yearParams.spa_external_daily * yearParams.days_open * yearParams.spa_external_avg_ticket
    const revenueSpa = revenueSpaInternal + revenueSpaExternal
    const revenueOther = roomNights * yearParams.other_revenue_per_room
    const totalRevenue = revenueRooms + revenueFb + revenueSpa + revenueOther

    const costRooms = revenueRooms * (yearParams.cost_rooms_pct / 100)
    const costFb = revenueFb * (yearParams.cost_fb_pct / 100)
    const costSpa = revenueSpa * (yearParams.cost_spa_pct / 100)
    const costOtherVar = revenueOther * (yearParams.cost_other_pct / 100)
    const totalVariableCosts = costRooms + costFb + costSpa + costOtherVar

    const grossProfit = totalRevenue - totalVariableCosts
    const grossMargin = (grossProfit / totalRevenue) * 100

    const totalFixedCosts =
      yearParams.cost_personnel +
      yearParams.cost_rent +
      yearParams.cost_utilities +
      yearParams.cost_maintenance +
      yearParams.cost_insurance +
      yearParams.cost_marketing +
      yearParams.cost_admin +
      yearParams.cost_technology +
      yearParams.cost_other_fixed

    const ebitda = grossProfit - totalFixedCosts
    const ebitdaMargin = (ebitda / totalRevenue) * 100
    const ebit = ebitda - yearParams.depreciation
    const ebt = ebit - yearParams.interest_expense
    const taxes = ebt > 0 ? ebt * (yearParams.tax_rate / 100) : 0
    const netIncome = ebt - taxes
    const netMargin = (netIncome / totalRevenue) * 100
    const revpar = revenueRooms / (yearParams.rooms_count * yearParams.days_open)
    const trevpar = totalRevenue / (yearParams.rooms_count * yearParams.days_open)

    return {
      roomNights,
      revenueRooms,
      revenueFb,
      revenueSpa,
      revenueOther,
      totalRevenue,
      costRooms,
      costFb,
      costSpa,
      costOtherVar,
      totalVariableCosts,
      grossProfit,
      grossMargin,
      totalFixedCosts,
      ebitda,
      ebitdaMargin,
      ebit,
      ebt,
      taxes,
      netIncome,
      netMargin,
      revpar,
      trevpar,
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Image src="/4bid-logo.png" alt="4BID" width={120} height={40} />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              Accesso Protetto
            </CardTitle>
            <CardDescription>Inserisci la password per visualizzare il Business Plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
                  placeholder="Inserisci la password"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={verifyPassword} disabled={loading || !password}>
                {loading ? "Verifica..." : "Accedi"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Image src="/4bid-logo.png" alt="4BID" width={100} height={32} />
          <div className="text-right">
            <h1 className="font-bold">{plan?.name}</h1>
            <p className="text-sm text-muted-foreground">
              {plan?.client_name} - {plan?.location}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="financials" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="financials" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Conto Economico
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descrizione
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financials">
            <Card>
              <CardHeader>
                <CardTitle>Conto Economico Previsionale</CardTitle>
                <CardDescription>Proiezione a {plan?.years} anni</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Voce</TableHead>
                      {params.map((p) => (
                        <TableHead key={p.year} className="text-right min-w-[120px]">
                          Anno {p.year}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>RICAVI TOTALI</TableCell>
                      {params.map((p) => (
                        <TableCell key={p.year} className="text-right">
                          {formatCurrency(calculateFinancials(p).totalRevenue)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="bg-green-50 font-semibold">
                      <TableCell>MARGINE LORDO</TableCell>
                      {params.map((p) => {
                        const fin = calculateFinancials(p)
                        return (
                          <TableCell key={p.year} className="text-right text-green-700">
                            {formatCurrency(fin.grossProfit)} ({formatPercent(fin.grossMargin)})
                          </TableCell>
                        )
                      })}
                    </TableRow>
                    <TableRow className="bg-blue-50 font-bold">
                      <TableCell>EBITDA</TableCell>
                      {params.map((p) => {
                        const fin = calculateFinancials(p)
                        return (
                          <TableCell
                            key={p.year}
                            className={`text-right ${fin.ebitda >= 0 ? "text-blue-700" : "text-red-700"}`}
                          >
                            {formatCurrency(fin.ebitda)} ({formatPercent(fin.ebitdaMargin)})
                          </TableCell>
                        )
                      })}
                    </TableRow>
                    <TableRow className="bg-primary/10 font-bold text-lg">
                      <TableCell>UTILE NETTO</TableCell>
                      {params.map((p) => {
                        const fin = calculateFinancials(p)
                        return (
                          <TableCell
                            key={p.year}
                            className={`text-right ${fin.netIncome >= 0 ? "text-green-700" : "text-red-700"}`}
                          >
                            {formatCurrency(fin.netIncome)}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="text">
            <div className="space-y-6">
              {sections
                .filter((s) => s.content)
                .map((section) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap">{section.content}</div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        <p>Business Plan generato da 4BID S.r.l.</p>
      </footer>
    </div>
  )
}
