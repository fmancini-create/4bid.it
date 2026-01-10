"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Save, Trash2, Share2, FileText, HelpCircle, Building, ChevronLeft } from "lucide-react"

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
  status: string
  created_at: string
  market_analysis?: string
  business_model?: string
  marketing_strategy?: string
  management_team?: string
  risk_analysis?: string
}

interface BusinessPlanFinancials {
  id?: string
  business_plan_id: string
  year_number: number

  // Parametri operativi
  rooms_available: number
  opening_days: number
  occupancy_rate: number
  adr: number

  // Ricavi extra (percentuali)
  fb_revenue_pct: number
  spa_revenue_pct: number
  other_revenue_pct: number

  // Costi variabili (percentuali)
  rooms_cost_pct: number
  fb_cost_pct: number
  spa_cost_pct: number
  other_cost_pct: number

  // Costi fissi annuali
  staff_cost: number
  rent_cost: number
  utilities_cost: number
  marketing_cost: number
  maintenance_cost: number
  insurance_cost: number
  admin_cost: number
  other_fixed_cost: number

  // Ammortamenti e tasse
  depreciation: number
  interest_cost: number
  tax_rate: number
}

interface Props {
  initialPlans: BusinessPlan[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`
}

const getFinValue = (fin: BusinessPlanFinancials, key: keyof BusinessPlanFinancials, defaultVal = 0): number => {
  const val = fin[key]
  return typeof val === "number" && !isNaN(val) ? val : defaultVal
}

const FIELD_INFO: Record<string, { description: string; benchmark: string }> = {
  // Ricavi
  occupancy_rate: {
    description: "Percentuale di camere vendute sul totale disponibili",
    benchmark: "Hotel 4* Italia: 60-70% | 4* Superior: 65-75% | Città d'arte: 70-80%",
  },
  adr: {
    description: "Average Daily Rate - Prezzo medio di vendita per camera/notte",
    benchmark: "4* Italia: €120-160 | 4* Superior: €160-220 | Lusso: €250-400",
  },
  fb_revenue_pct: {
    description: "Ricavi F&B come percentuale sui ricavi camere",
    benchmark: "Hotel con ristorante: 25-40% | Solo colazione: 10-15% | Resort: 40-60%",
  },
  spa_revenue_pct: {
    description: "Ricavi SPA come percentuale sui ricavi camere",
    benchmark: "Hotel con SPA: 8-15% | Resort benessere: 15-25%",
  },
  other_revenue_pct: {
    description: "Altri ricavi come percentuale sui ricavi camere (parcheggio, lavanderia, minibar, etc.)",
    benchmark: "Media: 3-8% | Business hotel: 5-10%",
  },
  // Costi variabili
  rooms_cost_pct: {
    description: "Costo variabile camere (amenities, lavanderia, pulizie extra) come % ricavi camere",
    benchmark: "Hotel 4*: 20-28% | Lusso: 25-35% | Economy: 15-22%",
  },
  fb_cost_pct: {
    description: "Food cost + beverage cost come percentuale sui ricavi F&B",
    benchmark: "Ristorante hotel: 30-38% | Fine dining: 35-42% | Bar: 25-30%",
  },
  spa_cost_pct: {
    description: "Costi variabili SPA (prodotti, terapisti esterni) come % ricavi SPA",
    benchmark: "SPA hotel: 35-45% | Day SPA: 40-50%",
  },
  // Costi fissi
  staff_cost: {
    description: "Costo totale del personale annuo (stipendi + contributi + TFR)",
    benchmark: "Incidenza su ricavi: 30-40% | 4* Superior 90 camere: €800k-1.2M",
  },
  rent_cost: {
    description: "Affitto o canone leasing annuo dell'immobile",
    benchmark: "Affitto: 8-12% ricavi | Leasing: variabile in base all'investimento",
  },
  utilities_cost: {
    description: "Costi annui per energia elettrica, gas, acqua, internet",
    benchmark: "Incidenza: 4-7% ricavi | 4* con SPA: €100k-180k/anno",
  },
  marketing_cost: {
    description: "Budget annuo marketing, pubblicità, PR, eventi",
    benchmark: "Nuovo hotel: 5-8% ricavi | Hotel affermato: 3-5% ricavi",
  },
  maintenance_cost: {
    description: "Manutenzione ordinaria annua (impianti, arredi, giardino)",
    benchmark: "Standard: 3-5% ricavi | €500-800/camera/anno",
  },
  insurance_cost: {
    description: "Polizze assicurative annue (immobile, RC, personale)",
    benchmark: "€300-500/camera/anno | 0.8-1.5% ricavi",
  },
  admin_cost: {
    description: "Costi amministrativi (commercialista, consulenze, software)",
    benchmark: "1-2% ricavi | €40k-80k/anno per hotel medio",
  },
  other_fixed_cost: {
    description: "Altri costi fissi (licenze, abbonamenti, varie)",
    benchmark: "1-2% ricavi | €20k-50k/anno",
  },
  depreciation: {
    description: "Ammortamento annuo (immobile + arredi + attrezzature)",
    benchmark: "Immobile: 3% valore | Arredi: 10-15% valore | Attrezzature: 20%",
  },
  interest_cost: {
    description: "Interessi passivi annui sui finanziamenti",
    benchmark: "Dipende dal debito - tipicamente 2-5% del fatturato",
  },
  tax_rate: {
    description: "Aliquota fiscale effettiva (IRES + IRAP)",
    benchmark: "Italia: IRES 24% + IRAP ~4% = ~28% effettivo",
  },
}

function LabelWithTooltip({ field, children }: { field: string; children: React.ReactNode }) {
  const info = FIELD_INFO[field]
  if (!info) return <Label>{children}</Label>

  return (
    <div className="flex items-center gap-1">
      <Label>{children}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium mb-1">{info.description}</p>
          <p className="text-xs text-muted-foreground">{info.benchmark}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export default function BusinessPlanDashboard({ initialPlans }: Props) {
  const [plans, setPlans] = useState<BusinessPlan[]>(initialPlans)
  const [selectedPlan, setSelectedPlan] = useState<BusinessPlan | null>(null)
  const [financials, setFinancials] = useState<BusinessPlanFinancials[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareEmail, setShareEmail] = useState("")
  const [sharePassword, setSharePassword] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  const selectedPlanId = selectedPlan?.id

  // Carica i dati finanziari quando si seleziona un piano
  useEffect(() => {
    if (selectedPlanId) {
      loadFinancials(selectedPlanId)
    }
  }, [selectedPlanId])

  const loadFinancials = async (planId: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/business-plan/${planId}/financials`)
      if (res.ok) {
        const data = await res.json()
        // Se non ci sono dati, crea gli anni di default
        if (data.length === 0 && selectedPlan) {
          await createDefaultYears(planId, selectedPlan.projection_years || 3)
        } else {
          setFinancials(data)
        }
      }
    } catch (error) {
      console.error("Error loading financials:", error)
    }
    setIsLoading(false)
  }

  const createDefaultYears = async (planId: string, years: number) => {
    setIsLoading(true)
    try {
      for (let i = 1; i <= years; i++) {
        await fetch(`/api/business-plan/${planId}/financials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year_number: i }),
        })
      }
      // Ricarica i dati
      const res = await fetch(`/api/business-plan/${planId}/financials`)
      if (res.ok) {
        const data = await res.json()
        setFinancials(data)
      }
    } catch (error) {
      console.error("Error creating default years:", error)
    }
    setIsLoading(false)
  }

  const createNewPlan = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/business-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Nuovo Business Plan",
          description: "",
          client_name: "",
          project_type: "hotel",
          status: "draft",
        }),
      })
      if (res.ok) {
        const newPlan = await res.json()
        setPlans([newPlan, ...plans])
        setSelectedPlan(newPlan)
      }
    } catch (error) {
      console.error("Error creating plan:", error)
    }
    setIsLoading(false)
  }

  const savePlan = async () => {
    if (!selectedPlan) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/business-plan/${selectedPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedPlan),
      })
      if (res.ok) {
        const updated = await res.json()
        setPlans(plans.map((p) => (p.id === updated.id ? updated : p)))
        setSelectedPlan(updated)
      }
    } catch (error) {
      console.error("Error saving plan:", error)
    }
    setIsSaving(false)
  }

  const saveFinancials = async (yearFinancials: BusinessPlanFinancials) => {
    if (!selectedPlan) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/business-plan/${selectedPlan.id}/financials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(yearFinancials),
      })
      if (res.ok) {
        const updated = await res.json()
        setFinancials(financials.map((f) => (f.year_number === updated.year_number ? updated : f)))
      }
    } catch (error) {
      console.error("Error saving financials:", error)
    }
    setIsSaving(false)
  }

  const deletePlan = async (planId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo Business Plan?")) return
    try {
      const res = await fetch(`/api/business-plan/${planId}`, { method: "DELETE" })
      if (res.ok) {
        setPlans(plans.filter((p) => p.id !== planId))
        if (selectedPlan?.id === planId) {
          setSelectedPlan(null)
        }
      }
    } catch (error) {
      console.error("Error deleting plan:", error)
    }
  }

  const sharePlan = async () => {
    if (!selectedPlan || !shareEmail || !sharePassword) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/business-plan/${selectedPlan.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: shareEmail, password: sharePassword }),
      })
      if (res.ok) {
        alert("Business Plan condiviso con successo!")
        setShowShareDialog(false)
        setShareEmail("")
        setSharePassword("")
      }
    } catch (error) {
      console.error("Error sharing plan:", error)
    }
    setIsLoading(false)
  }

  const calculatePL = (plan: BusinessPlan, fin: BusinessPlanFinancials) => {
    const numRooms = getFinValue(fin, "rooms_available", plan.num_rooms || 90)
    const openingDays = getFinValue(fin, "opening_days", plan.opening_days_year || 365)
    const occupancy = getFinValue(fin, "occupancy_rate", 65) / 100
    const adr = getFinValue(fin, "adr", 180)

    const roomNights = numRooms * openingDays * occupancy

    // RICAVI
    const roomRevenue = roomNights * adr
    const fbRevenue = roomRevenue * (getFinValue(fin, "fb_revenue_pct", 35) / 100)
    const spaRevenue = roomRevenue * (getFinValue(fin, "spa_revenue_pct", 12) / 100)
    const otherRevenue = roomRevenue * (getFinValue(fin, "other_revenue_pct", 5) / 100)
    const totalRevenue = roomRevenue + fbRevenue + spaRevenue + otherRevenue

    // COSTI VARIABILI
    const roomCosts = roomRevenue * (getFinValue(fin, "rooms_cost_pct", 25) / 100)
    const fbCosts = fbRevenue * (getFinValue(fin, "fb_cost_pct", 35) / 100)
    const spaCosts = spaRevenue * (getFinValue(fin, "spa_cost_pct", 40) / 100)
    const totalVariableCosts = roomCosts + fbCosts + spaCosts

    // MARGINE DI CONTRIBUZIONE
    const contributionMargin = totalRevenue - totalVariableCosts

    // COSTI FISSI
    const staffCosts = getFinValue(fin, "staff_cost", 850000)
    const rentCosts = getFinValue(fin, "rent_cost", 180000)
    const utilitiesCosts = getFinValue(fin, "utilities_cost", 120000)
    const maintenanceCosts = getFinValue(fin, "maintenance_cost", 60000)
    const insuranceCosts = getFinValue(fin, "insurance_cost", 35000)
    const marketingCosts = getFinValue(fin, "marketing_cost", 80000)
    const adminCosts = getFinValue(fin, "admin_cost", 45000)
    const otherFixedCosts = getFinValue(fin, "other_fixed_cost", 30000)
    const totalFixedCosts =
      staffCosts +
      rentCosts +
      utilitiesCosts +
      maintenanceCosts +
      insuranceCosts +
      marketingCosts +
      adminCosts +
      otherFixedCosts

    // EBITDA
    const ebitda = contributionMargin - totalFixedCosts

    // AMMORTAMENTI
    const depreciation = getFinValue(fin, "depreciation", 150000)

    // EBIT
    const ebit = ebitda - depreciation

    // INTERESSI
    const interestExpense = getFinValue(fin, "interest_cost", 80000)

    // EBT (Utile ante imposte)
    const ebt = ebit - interestExpense

    // IMPOSTE
    const taxRate = getFinValue(fin, "tax_rate", 24) / 100
    const taxes = ebt > 0 ? ebt * taxRate : 0

    // UTILE NETTO
    const netIncome = ebt - taxes

    // KPI
    const revpar = numRooms * openingDays > 0 ? roomRevenue / (numRooms * openingDays) : 0
    const goppar = numRooms * openingDays > 0 ? ebitda / (numRooms * openingDays) : 0
    const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0
    const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0

    return {
      roomNights,
      roomRevenue,
      fbRevenue,
      spaRevenue,
      otherRevenue,
      totalRevenue,
      roomCosts,
      fbCosts,
      spaCosts,
      totalVariableCosts,
      contributionMargin,
      staffCosts,
      rentCosts,
      utilitiesCosts,
      maintenanceCosts,
      insuranceCosts,
      marketingCosts,
      adminCosts,
      otherFixedCosts,
      totalFixedCosts,
      ebitda,
      depreciation,
      ebit,
      interestExpense,
      ebt,
      taxes,
      netIncome,
      revpar,
      goppar,
      ebitdaMargin,
      netMargin,
    }
  }

  // Vista lista piani
  if (!selectedPlan) {
    return (
      <div className="container mx-auto p-4 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Business Plan</h1>
            <p className="text-muted-foreground">Gestisci i tuoi business plan e proiezioni finanziarie</p>
          </div>
          <Button onClick={createNewPlan} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Business Plan
          </Button>
        </div>

        {plans.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessun Business Plan</h3>
              <p className="text-muted-foreground text-center mb-4">Crea il tuo primo business plan per iniziare</p>
              <Button onClick={createNewPlan} disabled={isLoading}>
                <Plus className="h-4 w-4 mr-2" />
                Crea Business Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedPlan(plan)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                      {plan.status === "active" ? "Attivo" : plan.status === "archived" ? "Archiviato" : "Bozza"}
                    </Badge>
                  </div>
                  <CardDescription>{plan.client_name || "Nessun cliente"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{plan.location || "Nessuna location"}</p>
                    <p>
                      {plan.num_rooms} camere - {plan.stars} stelle
                    </p>
                    <p className="text-xs">Aggiornato: {new Date(plan.created_at).toLocaleDateString("it-IT")}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPlan(plan)
                      }}
                    >
                      <Building className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        deletePlan(plan.id)
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
    )
  }

  // Vista dettaglio piano
  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedPlan(null)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <Input
                value={selectedPlan.name}
                onChange={(e) => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                className="text-xl sm:text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0"
              />
              <p className="text-muted-foreground text-sm">
                {selectedPlan.client_name || "Clicca per aggiungere cliente"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowShareDialog(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Condividi
            </Button>
            <Button onClick={savePlan} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Generale</TabsTrigger>
            <TabsTrigger value="financials">Parametri</TabsTrigger>
            <TabsTrigger value="projections">Proiezioni</TabsTrigger>
            <TabsTrigger value="content">Contenuto</TabsTrigger>
          </TabsList>

          {/* Tab Generale */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Progetto</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome Cliente</Label>
                  <Input
                    value={selectedPlan.client_name || ""}
                    onChange={(e) => setSelectedPlan({ ...selectedPlan, client_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={selectedPlan.location || ""}
                    onChange={(e) => setSelectedPlan({ ...selectedPlan, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Numero Camere</Label>
                  <Input
                    type="number"
                    value={selectedPlan.num_rooms}
                    onChange={(e) =>
                      setSelectedPlan({ ...selectedPlan, num_rooms: Number.parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stelle</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={selectedPlan.stars}
                    onChange={(e) => setSelectedPlan({ ...selectedPlan, stars: Number.parseInt(e.target.value) || 4 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giorni Apertura/Anno</Label>
                  <Input
                    type="number"
                    value={selectedPlan.opening_days_year}
                    onChange={(e) =>
                      setSelectedPlan({ ...selectedPlan, opening_days_year: Number.parseInt(e.target.value) || 365 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anno Inizio</Label>
                  <Input
                    type="number"
                    value={selectedPlan.start_year}
                    onChange={(e) =>
                      setSelectedPlan({ ...selectedPlan, start_year: Number.parseInt(e.target.value) || 2026 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anni Proiezione</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={selectedPlan.projection_years}
                    onChange={(e) =>
                      setSelectedPlan({ ...selectedPlan, projection_years: Number.parseInt(e.target.value) || 3 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrizione</Label>
                  <Textarea
                    value={selectedPlan.description || ""}
                    onChange={(e) => setSelectedPlan({ ...selectedPlan, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Servizi Inclusi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPlan.has_spa}
                      onChange={(e) => setSelectedPlan({ ...selectedPlan, has_spa: e.target.checked })}
                      className="rounded"
                    />
                    <span>Centro Benessere / SPA</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPlan.has_restaurant}
                      onChange={(e) => setSelectedPlan({ ...selectedPlan, has_restaurant: e.target.checked })}
                      className="rounded"
                    />
                    <span>Ristorante</span>
                  </label>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Stato</CardTitle>
                </CardHeader>
                <CardContent>
                  <select
                    value={selectedPlan.status}
                    onChange={(e) => setSelectedPlan({ ...selectedPlan, status: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="draft">Bozza</option>
                    <option value="active">Attivo</option>
                    <option value="archived">Archiviato</option>
                  </select>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Parametri Finanziari */}
          <TabsContent value="financials" className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">Caricamento parametri...</div>
            ) : financials.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">Nessun parametro finanziario configurato</p>
                  <Button
                    onClick={async () => {
                      // Crea i parametri per ogni anno
                      await createDefaultYears(selectedPlan.id, selectedPlan.projection_years || 3)
                    }}
                  >
                    Inizializza Parametri
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue={String(financials[0].year_number)}>
                <TabsList>
                  {financials.map((fin) => (
                    <TabsTrigger key={fin.year_number} value={String(fin.year_number)}>
                      Anno {fin.year_number}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {financials.map((fin) => (
                  <TabsContent key={fin.year_number} value={String(fin.year_number)} className="space-y-6">
                    {/* PARAMETRI OPERATIVI */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Parametri Operativi - Anno {fin.year_number}</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <LabelWithTooltip field="rooms_available">Camere Disponibili</LabelWithTooltip>
                          <Input
                            type="number"
                            value={getFinValue(fin, "rooms_available", selectedPlan.num_rooms)}
                            onChange={(e) => {
                              const updated = { ...fin, rooms_available: Number.parseInt(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="opening_days">Giorni Apertura</LabelWithTooltip>
                          <Input
                            type="number"
                            value={getFinValue(fin, "opening_days", selectedPlan.opening_days_year)}
                            onChange={(e) => {
                              const updated = { ...fin, opening_days: Number.parseInt(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="occupancy_rate">Occupazione (%)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="0.1"
                            value={getFinValue(fin, "occupancy_rate", 65)}
                            onChange={(e) => {
                              const updated = { ...fin, occupancy_rate: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="adr">ADR - Ricavo Medio Camera (€)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="1"
                            value={getFinValue(fin, "adr", 180)}
                            onChange={(e) => {
                              const updated = { ...fin, adr: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* RICAVI EXTRA (come % sui ricavi camere) */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Ricavi Extra (% sui ricavi camere)</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <LabelWithTooltip field="fb_revenue_pct">F&B (%)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="0.1"
                            value={getFinValue(fin, "fb_revenue_pct", 35)}
                            onChange={(e) => {
                              const updated = { ...fin, fb_revenue_pct: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="spa_revenue_pct">SPA (%)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="0.1"
                            value={getFinValue(fin, "spa_revenue_pct", 12)}
                            onChange={(e) => {
                              const updated = { ...fin, spa_revenue_pct: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="other_revenue_pct">Altri Ricavi (%)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="0.1"
                            value={getFinValue(fin, "other_revenue_pct", 5)}
                            onChange={(e) => {
                              const updated = { ...fin, other_revenue_pct: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* COSTI VARIABILI */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Costi Variabili (% sui ricavi)</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <LabelWithTooltip field="rooms_cost_pct">Costo Camere (%)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="0.1"
                            value={getFinValue(fin, "rooms_cost_pct", 25)}
                            onChange={(e) => {
                              const updated = { ...fin, rooms_cost_pct: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="fb_cost_pct">Food Cost F&B (%)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="0.1"
                            value={getFinValue(fin, "fb_cost_pct", 35)}
                            onChange={(e) => {
                              const updated = { ...fin, fb_cost_pct: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="spa_cost_pct">Costo SPA (%)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="0.1"
                            value={getFinValue(fin, "spa_cost_pct", 40)}
                            onChange={(e) => {
                              const updated = { ...fin, spa_cost_pct: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* COSTI FISSI ANNUALI */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Costi Fissi Annuali (€)</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <LabelWithTooltip field="staff_cost">Personale</LabelWithTooltip>
                          <Input
                            type="number"
                            step="1000"
                            value={getFinValue(fin, "staff_cost", 850000)}
                            onChange={(e) => {
                              const updated = { ...fin, staff_cost: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="rent_cost">Affitto/Leasing</LabelWithTooltip>
                          <Input
                            type="number"
                            step="1000"
                            value={getFinValue(fin, "rent_cost", 180000)}
                            onChange={(e) => {
                              const updated = { ...fin, rent_cost: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="utilities_cost">Utenze</LabelWithTooltip>
                          <Input
                            type="number"
                            step="1000"
                            value={getFinValue(fin, "utilities_cost", 120000)}
                            onChange={(e) => {
                              const updated = { ...fin, utilities_cost: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="maintenance_cost">Manutenzione</LabelWithTooltip>
                          <Input
                            type="number"
                            step="1000"
                            value={getFinValue(fin, "maintenance_cost", 60000)}
                            onChange={(e) => {
                              const updated = {
                                ...fin,
                                maintenance_cost: Number.parseFloat(e.target.value) || 0,
                              }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="insurance_cost">Assicurazioni</LabelWithTooltip>
                          <Input
                            type="number"
                            step="1000"
                            value={getFinValue(fin, "insurance_cost", 35000)}
                            onChange={(e) => {
                              const updated = { ...fin, insurance_cost: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="marketing_cost">Marketing</LabelWithTooltip>
                          <Input
                            type="number"
                            step="1000"
                            value={getFinValue(fin, "marketing_cost", 80000)}
                            onChange={(e) => {
                              const updated = { ...fin, marketing_cost: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="admin_cost">Amministrazione</LabelWithTooltip>
                          <Input
                            type="number"
                            step="1000"
                            value={getFinValue(fin, "admin_cost", 45000)}
                            onChange={(e) => {
                              const updated = { ...fin, admin_cost: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="other_fixed_cost">Altri costi fissi</LabelWithTooltip>
                          <Input
                            type="number"
                            step="1000"
                            value={getFinValue(fin, "other_fixed_cost", 30000)}
                            onChange={(e) => {
                              const updated = { ...fin, other_fixed_cost: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* AMMORTAMENTI E TASSE */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Ammortamenti e Tasse</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <LabelWithTooltip field="depreciation">Ammortamento Annuo (€)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="1000"
                            value={getFinValue(fin, "depreciation", 150000)}
                            onChange={(e) => {
                              const updated = { ...fin, depreciation: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="interest_cost">Interessi Passivi Annuo (€)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="1000"
                            value={getFinValue(fin, "interest_cost", 80000)}
                            onChange={(e) => {
                              const updated = { ...fin, interest_cost: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="tax_rate">Aliquota Fiscale (%)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="0.1"
                            value={getFinValue(fin, "tax_rate", 24)}
                            onChange={(e) => {
                              const updated = { ...fin, tax_rate: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </TabsContent>

          {/* Tab Proiezioni */}
          <TabsContent value="projections" className="space-y-6">
            {financials.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Configura prima i parametri finanziari</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Tabella Conto Economico */}
                <Card>
                  <CardHeader>
                    <CardTitle>Conto Economico Previsionale</CardTitle>
                    <CardDescription>Proiezione a {selectedPlan.projection_years} anni</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4 font-medium">Voce</th>
                          {financials.map((fin) => (
                            <th key={fin.year_number} className="text-right py-2 px-2 font-medium">
                              Anno {fin.year_number}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* RICAVI */}
                        <tr className="bg-muted/30">
                          <td colSpan={financials.length + 1} className="py-2 px-2 font-semibold text-primary">
                            RICAVI
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Room Division</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2">
                                {formatCurrency(pl.roomRevenue)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Food & Beverage</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2">
                                {formatCurrency(pl.fbRevenue)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">SPA & Wellness</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2">
                                {formatCurrency(pl.spaRevenue)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Altri Ricavi</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2">
                                {formatCurrency(pl.otherRevenue)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b bg-muted/50 font-semibold">
                          <td className="py-2">TOTALE RICAVI</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-2 px-2">
                                {formatCurrency(pl.totalRevenue)}
                              </td>
                            )
                          })}
                        </tr>

                        {/* COSTI VARIABILI */}
                        <tr className="bg-muted/30">
                          <td colSpan={financials.length + 1} className="py-2 px-2 font-semibold text-primary">
                            COSTI VARIABILI
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Costi Room Division</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.roomCosts)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Food Cost</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.fbCosts)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Costi SPA</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.spaCosts)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b bg-muted/50 font-semibold">
                          <td className="py-2">MARGINE DI CONTRIBUZIONE</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-2 px-2">
                                {formatCurrency(pl.contributionMargin)}
                              </td>
                            )
                          })}
                        </tr>

                        {/* COSTI FISSI */}
                        <tr className="bg-muted/30">
                          <td colSpan={financials.length + 1} className="py-2 px-2 font-semibold text-primary">
                            COSTI FISSI
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Personale</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.staffCosts)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Affitto/Leasing</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.rentCosts)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Utenze</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.utilitiesCosts)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Manutenzione</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.maintenanceCosts)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Assicurazioni</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.insuranceCosts)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Marketing</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.marketingCosts)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Amministrazione</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.adminCosts)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Altri Costi Fissi</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.otherFixedCosts)}
                              </td>
                            )
                          })}
                        </tr>

                        {/* EBITDA */}
                        <tr className="border-b bg-green-50 dark:bg-green-900/20 font-semibold">
                          <td className="py-2">EBITDA</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td
                                key={fin.year_number}
                                className={`text-right py-2 px-2 ${pl.ebitda >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {formatCurrency(pl.ebitda)}
                              </td>
                            )
                          })}
                        </tr>

                        <tr className="border-b">
                          <td className="py-1 pl-4">Ammortamenti</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.depreciation)}
                              </td>
                            )
                          })}
                        </tr>

                        <tr className="border-b bg-muted/50 font-semibold">
                          <td className="py-2">EBIT</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td
                                key={fin.year_number}
                                className={`text-right py-2 px-2 ${pl.ebit >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {formatCurrency(pl.ebit)}
                              </td>
                            )
                          })}
                        </tr>

                        <tr className="border-b">
                          <td className="py-1 pl-4">Interessi Passivi</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.interestExpense)}
                              </td>
                            )
                          })}
                        </tr>

                        <tr className="border-b bg-muted/50 font-semibold">
                          <td className="py-2">EBT (Utile ante imposte)</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td
                                key={fin.year_number}
                                className={`text-right py-2 px-2 ${pl.ebt >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {formatCurrency(pl.ebt)}
                              </td>
                            )
                          })}
                        </tr>

                        <tr className="border-b">
                          <td className="py-1 pl-4">Imposte (IRES + IRAP)</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year_number} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.taxes)}
                              </td>
                            )
                          })}
                        </tr>

                        <tr className="bg-primary/10 font-bold text-lg">
                          <td className="py-3">UTILE NETTO</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td
                                key={fin.year_number}
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

                {/* KPI */}
                <Card>
                  <CardHeader>
                    <CardTitle>KPI Principali</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                      {financials.map((fin) => {
                        const pl = calculatePL(selectedPlan, fin)
                        return (
                          <Card key={fin.year_number} className="bg-muted/30">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Anno {fin.year_number}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Occupancy</span>
                                <span className="font-medium">{formatPercent(getFinValue(fin, "occupancy_rate"))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>ADR</span>
                                <span className="font-medium">{formatCurrency(getFinValue(fin, "adr"))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>RevPAR</span>
                                <span className="font-medium">{formatCurrency(pl.revpar)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>GOPPAR</span>
                                <span className="font-medium">{formatCurrency(pl.goppar)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>EBITDA %</span>
                                <span
                                  className={`font-medium ${pl.ebitdaMargin >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {formatPercent(pl.ebitdaMargin)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Net Margin %</span>
                                <span
                                  className={`font-medium ${pl.netMargin >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {formatPercent(pl.netMargin)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Tab Contenuto Testuale */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={selectedPlan.description || ""}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, description: e.target.value })}
                  rows={6}
                  placeholder="Descrizione sintetica del progetto, obiettivi principali e punti di forza..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analisi di Mercato</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={selectedPlan.market_analysis || ""}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, market_analysis: e.target.value })}
                  rows={6}
                  placeholder="Analisi del mercato di riferimento, competitor, trend di settore..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Model</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={selectedPlan.business_model || ""}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, business_model: e.target.value })}
                  rows={6}
                  placeholder="Modello di business, fonti di ricavo, proposta di valore..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strategia Marketing</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={selectedPlan.marketing_strategy || ""}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, marketing_strategy: e.target.value })}
                  rows={6}
                  placeholder="Strategia di marketing, canali di acquisizione, posizionamento..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team di Gestione</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={selectedPlan.management_team || ""}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, management_team: e.target.value })}
                  rows={6}
                  placeholder="Composizione del team, competenze chiave, organigramma..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analisi dei Rischi</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={selectedPlan.risk_analysis || ""}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, risk_analysis: e.target.value })}
                  rows={6}
                  placeholder="Principali rischi identificati e strategie di mitigazione..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Condivisione */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Condividi Business Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email destinatario</Label>
                <Input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="email@esempio.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Password di accesso</Label>
                <Input
                  type="text"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  placeholder="Inserisci una password"
                />
                <p className="text-xs text-muted-foreground">
                  Questa password sarà inviata al destinatario per accedere al business plan
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Annulla
              </Button>
              <Button onClick={sharePlan} disabled={!shareEmail || !sharePassword || isLoading}>
                Condividi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
