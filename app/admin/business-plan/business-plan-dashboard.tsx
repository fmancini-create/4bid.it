"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, FileSpreadsheet, Edit, Trash2, Share2, ChevronLeft, Save, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatRomeDate } from "@/lib/date-utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BusinessPlan {
  id: string
  name: string
  description: string
  client_name: string
  project_type: string
  status: string
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
  created_at: string
  updated_at: string
}

interface BusinessPlanFinancials {
  id?: string
  business_plan_id: string
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
  initialPlans: BusinessPlan[]
}

// Funzione per formattare numeri come valuta
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value)
}

// Funzione per formattare percentuali
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
  fb_revenue_per_room_night: {
    description: "Ricavo F&B medio per ogni camera venduta (colazione, ristorante, bar, room service)",
    benchmark: "4* con ristorante: €35-50 | 4* Superior: €45-65 | Resort: €60-90",
  },
  fb_external_covers_day: {
    description: "Numero medio di clienti esterni al giorno che mangiano al ristorante",
    benchmark: "Hotel urbano: 10-30 | Resort: 20-50 | Location esclusiva: 30-60",
  },
  fb_avg_ticket_external: {
    description: "Scontrino medio per cliente esterno al ristorante",
    benchmark: "Pranzo: €25-40 | Cena casual: €40-60 | Fine dining: €70-120",
  },
  spa_revenue_per_room_night: {
    description: "Ricavo SPA medio per camera venduta (trattamenti, accessi, prodotti)",
    benchmark: "SPA base: €15-25 | SPA premium: €25-40 | Wellness resort: €50-80",
  },
  spa_external_clients_day: {
    description: "Numero medio di clienti esterni che usano la SPA ogni giorno",
    benchmark: "SPA piccola: 5-15 | SPA media: 10-25 | Day SPA: 20-40",
  },
  spa_avg_ticket_external: {
    description: "Scontrino medio per cliente esterno SPA",
    benchmark: "Trattamento singolo: €50-80 | Pacchetto: €100-150 | Premium: €150-250",
  },
  other_revenue_per_room_night: {
    description: "Altri ricavi per camera (parcheggio, lavanderia, minibar, transfer, ecc.)",
    benchmark: "Hotel base: €5-10 | 4* Superior: €10-20 | Luxury: €20-40",
  },
  // Costi variabili
  room_cost_pct: {
    description: "Costi diretti camere in % sui ricavi rooms (pulizia, amenities, lavanderia)",
    benchmark: "Efficiente: 12-18% | Media: 18-22% | Alto servizio: 22-28%",
  },
  fb_cost_pct: {
    description: "Food Cost - Costo materie prime F&B in % sui ricavi F&B",
    benchmark: "Ottimo: 28-32% | Buono: 32-38% | Da migliorare: >38%",
  },
  spa_cost_pct: {
    description: "Costi diretti SPA in % sui ricavi SPA (prodotti, materiali, commissioni)",
    benchmark: "Efficiente: 20-28% | Media: 28-35% | Alto: >35%",
  },
  ota_commission_pct: {
    description: "Commissione media pagata alle OTA (Booking, Expedia, ecc.)",
    benchmark: "Booking.com: 15-18% | Expedia: 18-22% | Media ponderata: 16-20%",
  },
  ota_share_pct: {
    description: "Percentuale delle prenotazioni che arrivano tramite OTA",
    benchmark: "Hotel nuovo: 60-80% | Consolidato: 40-60% | Brand forte: 30-45%",
  },
  // Costi fissi
  staff_cost_monthly: {
    description: "Costo totale del personale (stipendi, contributi, TFR)",
    benchmark: "4* 90 camere: €70-100k/mese | Costo per camera: €800-1.100/mese",
  },
  rent_cost_monthly: {
    description: "Affitto o canone di leasing della struttura",
    benchmark: "Varia molto per location. Media: 8-12% dei ricavi totali",
  },
  utilities_cost_monthly: {
    description: "Utenze (elettricità, gas, acqua, internet, telefono)",
    benchmark: "4* con SPA: €12-20k/mese | Per camera: €130-220/mese",
  },
  maintenance_cost_monthly: {
    description: "Manutenzione ordinaria e piccole riparazioni",
    benchmark: "2-4% dei ricavi | Per camera: €60-100/mese",
  },
  insurance_cost_monthly: {
    description: "Assicurazioni (RC, incendio, furto, infortuni)",
    benchmark: "0.5-1% dei ricavi | Per camera: €40-70/mese",
  },
  marketing_cost_monthly: {
    description: "Marketing, pubblicità, fiere, PR, sito web",
    benchmark: "3-5% dei ricavi | Hotel nuovo: 5-8% | Per camera: €80-150/mese",
  },
  admin_cost_monthly: {
    description: "Costi amministrativi (commercialista, software, consulenze)",
    benchmark: "1-2% dei ricavi | Per camera: €40-80/mese",
  },
  other_fixed_monthly: {
    description: "Altri costi fissi (licenze, abbonamenti, varie)",
    benchmark: "1-2% dei ricavi | Per camera: €30-60/mese",
  },
  // Investimenti
  initial_investment: {
    description: "Investimento totale per costruzione/ristrutturazione",
    benchmark: "4* nuovo: €80-120k/camera | Ristrutturazione: €40-70k/camera",
  },
  depreciation_years: {
    description: "Anni di ammortamento dell'investimento",
    benchmark: "Immobili: 30-40 anni | Impianti: 10-15 anni | Arredi: 8-10 anni",
  },
  loan_amount: {
    description: "Importo del finanziamento bancario",
    benchmark: "Tipicamente 50-70% dell'investimento totale",
  },
  loan_interest_rate: {
    description: "Tasso di interesse annuo sul finanziamento",
    benchmark: "2024: 4-6% | Mutuo fondiario: 3.5-5% | Leasing: 5-7%",
  },
  loan_years: {
    description: "Durata del finanziamento in anni",
    benchmark: "Mutuo hotel: 15-25 anni | Leasing: 10-15 anni",
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
        setFinancials(data)
      }
    } catch (error) {
      console.error("Error loading financials:", error)
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
        setFinancials(financials.map((f) => (f.year === updated.year ? updated : f)))
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
        alert(`Business Plan condiviso con ${shareEmail}`)
        setShowShareDialog(false)
        setShareEmail("")
        setSharePassword("")
      }
    } catch (error) {
      console.error("Error sharing plan:", error)
    }
    setIsLoading(false)
  }

  // Calcola il conto economico per un anno
  const calculatePL = (plan: BusinessPlan, fin: BusinessPlanFinancials) => {
    const roomNights = plan.num_rooms * plan.opening_days_year * (getFinValue(fin, "occupancy_rate") / 100)

    // RICAVI
    const roomRevenue = roomNights * getFinValue(fin, "adr")
    const fbRevenueInternal = roomNights * getFinValue(fin, "fb_revenue_per_room_night")
    const fbRevenueExternal =
      getFinValue(fin, "fb_external_covers_day") * plan.opening_days_year * getFinValue(fin, "fb_avg_ticket_external")
    const fbRevenue = fbRevenueInternal + fbRevenueExternal
    const spaRevenueInternal = roomNights * getFinValue(fin, "spa_revenue_per_room_night")
    const spaRevenueExternal =
      getFinValue(fin, "spa_external_clients_day") *
      plan.opening_days_year *
      getFinValue(fin, "spa_avg_ticket_external")
    const spaRevenue = spaRevenueInternal + spaRevenueExternal
    const otherRevenue = roomNights * getFinValue(fin, "other_revenue_per_room_night")
    const totalRevenue = roomRevenue + fbRevenue + spaRevenue + otherRevenue

    // COSTI VARIABILI
    const roomCosts = roomRevenue * (getFinValue(fin, "room_cost_pct") / 100)
    const fbCosts = fbRevenue * (getFinValue(fin, "fb_cost_pct") / 100)
    const spaCosts = spaRevenue * (getFinValue(fin, "spa_cost_pct") / 100)
    const otaCommissions =
      roomRevenue * (getFinValue(fin, "ota_share_pct") / 100) * (getFinValue(fin, "ota_commission_pct") / 100)
    const totalVariableCosts = roomCosts + fbCosts + spaCosts + otaCommissions

    // MARGINE DI CONTRIBUZIONE
    const contributionMargin = totalRevenue - totalVariableCosts

    // COSTI FISSI
    const staffCosts = getFinValue(fin, "staff_cost_monthly") * 12
    const rentCosts = getFinValue(fin, "rent_cost_monthly") * 12
    const utilitiesCosts = getFinValue(fin, "utilities_cost_monthly") * 12
    const maintenanceCosts = getFinValue(fin, "maintenance_cost_monthly") * 12
    const insuranceCosts = getFinValue(fin, "insurance_cost_monthly") * 12
    const marketingCosts = getFinValue(fin, "marketing_cost_monthly") * 12
    const adminCosts = getFinValue(fin, "admin_cost_monthly") * 12
    const otherFixedCosts = getFinValue(fin, "other_fixed_monthly") * 12
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
    const depreciation = getFinValue(fin, "initial_investment") / getFinValue(fin, "depreciation_years", 20)

    // EBIT
    const ebit = ebitda - depreciation

    // INTERESSI
    const interestExpense = getFinValue(fin, "loan_amount") * (getFinValue(fin, "loan_interest_rate") / 100)

    // EBT (Utile ante imposte)
    const ebt = ebit - interestExpense

    // IMPOSTE (stima 27.9% IRES + IRAP)
    const taxes = ebt > 0 ? ebt * 0.279 : 0

    // UTILE NETTO
    const netIncome = ebt - taxes

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
      otaCommissions,
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
      revpar: plan.num_rooms * plan.opening_days_year > 0 ? roomRevenue / (plan.num_rooms * plan.opening_days_year) : 0,
      goppar: plan.num_rooms * plan.opening_days_year > 0 ? ebitda / (plan.num_rooms * plan.opening_days_year) : 0,
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
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
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
                    <p className="text-xs">Aggiornato: {formatRomeDate(plan.updated_at)}</p>
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
                      <Edit className="h-4 w-4" />
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
                      for (let i = 0; i < selectedPlan.projection_years; i++) {
                        await fetch(`/api/business-plan/${selectedPlan.id}/financials`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ year: selectedPlan.start_year + i }),
                        })
                      }
                      loadFinancials(selectedPlan.id)
                    }}
                  >
                    Inizializza Parametri
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue={String(selectedPlan.start_year)}>
                <TabsList>
                  {financials.map((fin) => (
                    <TabsTrigger key={fin.year} value={String(fin.year)}>
                      Anno {fin.year}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {financials.map((fin) => (
                  <TabsContent key={fin.year} value={String(fin.year)} className="space-y-6">
                    {/* RICAVI */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Parametri Ricavi - Anno {fin.year}</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <LabelWithTooltip field="occupancy_rate">Occupazione (%)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="0.1"
                            value={getFinValue(fin, "occupancy_rate", 65)}
                            onChange={(e) => {
                              const updated = { ...fin, occupancy_rate: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
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
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="fb_revenue_per_room_night">
                            F&B per camera occupata (€)
                          </LabelWithTooltip>
                          <Input
                            type="number"
                            step="1"
                            value={getFinValue(fin, "fb_revenue_per_room_night", 45)}
                            onChange={(e) => {
                              const updated = {
                                ...fin,
                                fb_revenue_per_room_night: Number.parseFloat(e.target.value) || 0,
                              }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="fb_external_covers_day">Coperti esterni/giorno</LabelWithTooltip>
                          <Input
                            type="number"
                            value={getFinValue(fin, "fb_external_covers_day", 30)}
                            onChange={(e) => {
                              const updated = { ...fin, fb_external_covers_day: Number.parseInt(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="fb_avg_ticket_external">
                            Scontrino medio esterno F&B (€)
                          </LabelWithTooltip>
                          <Input
                            type="number"
                            step="1"
                            value={getFinValue(fin, "fb_avg_ticket_external", 55)}
                            onChange={(e) => {
                              const updated = { ...fin, fb_avg_ticket_external: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="spa_revenue_per_room_night">
                            SPA per camera occupata (€)
                          </LabelWithTooltip>
                          <Input
                            type="number"
                            step="1"
                            value={getFinValue(fin, "spa_revenue_per_room_night", 25)}
                            onChange={(e) => {
                              const updated = {
                                ...fin,
                                spa_revenue_per_room_night: Number.parseFloat(e.target.value) || 0,
                              }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="spa_external_clients_day">
                            Clienti esterni SPA/giorno
                          </LabelWithTooltip>
                          <Input
                            type="number"
                            value={getFinValue(fin, "spa_external_clients_day", 10)}
                            onChange={(e) => {
                              const updated = { ...fin, spa_external_clients_day: Number.parseInt(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="spa_avg_ticket_external">
                            Scontrino medio SPA esterno (€)
                          </LabelWithTooltip>
                          <Input
                            type="number"
                            step="1"
                            value={getFinValue(fin, "spa_avg_ticket_external", 80)}
                            onChange={(e) => {
                              const updated = {
                                ...fin,
                                spa_avg_ticket_external: Number.parseFloat(e.target.value) || 0,
                              }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="other_revenue_per_room_night">
                            Altri ricavi per camera (€)
                          </LabelWithTooltip>
                          <Input
                            type="number"
                            step="1"
                            value={getFinValue(fin, "other_revenue_per_room_night", 10)}
                            onChange={(e) => {
                              const updated = {
                                ...fin,
                                other_revenue_per_room_night: Number.parseFloat(e.target.value) || 0,
                              }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
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
                          <LabelWithTooltip field="room_cost_pct">Costo Camere (%)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="0.1"
                            value={getFinValue(fin, "room_cost_pct", 15)}
                            onChange={(e) => {
                              const updated = { ...fin, room_cost_pct: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
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
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="spa_cost_pct">Costo SPA (%)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="0.1"
                            value={getFinValue(fin, "spa_cost_pct", 25)}
                            onChange={(e) => {
                              const updated = { ...fin, spa_cost_pct: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="ota_commission_pct">Commissioni OTA (%)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="0.1"
                            value={getFinValue(fin, "ota_commission_pct", 18)}
                            onChange={(e) => {
                              const updated = { ...fin, ota_commission_pct: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="ota_share_pct">% Prenotazioni OTA</LabelWithTooltip>
                          <Input
                            type="number"
                            step="0.1"
                            value={getFinValue(fin, "ota_share_pct", 70)}
                            onChange={(e) => {
                              const updated = { ...fin, ota_share_pct: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* COSTI FISSI */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Costi Fissi Mensili (€)</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <LabelWithTooltip field="staff_cost_monthly">Personale</LabelWithTooltip>
                          <Input
                            type="number"
                            step="100"
                            value={getFinValue(fin, "staff_cost_monthly", 30000)}
                            onChange={(e) => {
                              const updated = { ...fin, staff_cost_monthly: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="rent_cost_monthly">Affitto/Leasing</LabelWithTooltip>
                          <Input
                            type="number"
                            step="100"
                            value={getFinValue(fin, "rent_cost_monthly", 20000)}
                            onChange={(e) => {
                              const updated = { ...fin, rent_cost_monthly: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="utilities_cost_monthly">Utenze</LabelWithTooltip>
                          <Input
                            type="number"
                            step="100"
                            value={getFinValue(fin, "utilities_cost_monthly", 5000)}
                            onChange={(e) => {
                              const updated = { ...fin, utilities_cost_monthly: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="maintenance_cost_monthly">Manutenzione</LabelWithTooltip>
                          <Input
                            type="number"
                            step="100"
                            value={getFinValue(fin, "maintenance_cost_monthly", 3000)}
                            onChange={(e) => {
                              const updated = {
                                ...fin,
                                maintenance_cost_monthly: Number.parseFloat(e.target.value) || 0,
                              }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="insurance_cost_monthly">Assicurazioni</LabelWithTooltip>
                          <Input
                            type="number"
                            step="100"
                            value={getFinValue(fin, "insurance_cost_monthly", 1500)}
                            onChange={(e) => {
                              const updated = { ...fin, insurance_cost_monthly: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="marketing_cost_monthly">Marketing</LabelWithTooltip>
                          <Input
                            type="number"
                            step="100"
                            value={getFinValue(fin, "marketing_cost_monthly", 2000)}
                            onChange={(e) => {
                              const updated = { ...fin, marketing_cost_monthly: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="admin_cost_monthly">Amministrazione</LabelWithTooltip>
                          <Input
                            type="number"
                            step="100"
                            value={getFinValue(fin, "admin_cost_monthly", 1000)}
                            onChange={(e) => {
                              const updated = { ...fin, admin_cost_monthly: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="other_fixed_monthly">Altri costi fissi</LabelWithTooltip>
                          <Input
                            type="number"
                            step="100"
                            value={getFinValue(fin, "other_fixed_monthly", 1000)}
                            onChange={(e) => {
                              const updated = { ...fin, other_fixed_monthly: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* INVESTIMENTI E FINANZIAMENTI */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Investimenti e Finanziamenti</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <LabelWithTooltip field="initial_investment">Investimento Iniziale (€)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="10000"
                            value={getFinValue(fin, "initial_investment", 8000000)}
                            onChange={(e) => {
                              const updated = { ...fin, initial_investment: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="depreciation_years">Anni Ammortamento</LabelWithTooltip>
                          <Input
                            type="number"
                            value={getFinValue(fin, "depreciation_years", 20)}
                            onChange={(e) => {
                              const updated = { ...fin, depreciation_years: Number.parseInt(e.target.value) || 20 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="loan_amount">Finanziamento (€)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="10000"
                            value={getFinValue(fin, "loan_amount", 5000000)}
                            onChange={(e) => {
                              const updated = { ...fin, loan_amount: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="loan_interest_rate">Tasso Interesse (%)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="0.1"
                            value={getFinValue(fin, "loan_interest_rate", 4.5)}
                            onChange={(e) => {
                              const updated = { ...fin, loan_interest_rate: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="loan_years">Durata Finanziamento (anni)</LabelWithTooltip>
                          <Input
                            type="number"
                            value={getFinValue(fin, "loan_years", 15)}
                            onChange={(e) => {
                              const updated = { ...fin, loan_years: Number.parseInt(e.target.value) || 15 }
                              setFinancials(financials.map((f) => (f.year === fin.year ? updated : f)))
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
                            <th key={fin.year} className="text-right py-2 px-2 font-medium">
                              {fin.year}
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
                              <td key={fin.year} className="text-right py-1 px-2">
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
                              <td key={fin.year} className="text-right py-1 px-2">
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
                              <td key={fin.year} className="text-right py-1 px-2">
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
                              <td key={fin.year} className="text-right py-1 px-2">
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
                              <td key={fin.year} className="text-right py-2 px-2">
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
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
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
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
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
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.spaCosts)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Commissioni OTA</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
                                -{formatCurrency(pl.otaCommissions)}
                              </td>
                            )
                          })}
                        </tr>
                        <tr className="border-b bg-muted/50 font-semibold">
                          <td className="py-2">MARGINE DI CONTRIBUZIONE</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <td key={fin.year} className="text-right py-2 px-2">
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
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
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
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
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
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
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
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
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
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
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
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
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
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
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
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
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
                                key={fin.year}
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
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
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
                                key={fin.year}
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
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
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
                                key={fin.year}
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
                              <td key={fin.year} className="text-right py-1 px-2 text-red-600">
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
                          <Card key={fin.year} className="bg-muted/30">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">{fin.year}</CardTitle>
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
                                <span className={`font-medium ${pl.ebitda >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {pl.totalRevenue > 0 ? formatPercent((pl.ebitda / pl.totalRevenue) * 100) : "0.0%"}
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
                  value={selectedPlan.executive_summary || ""}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, executive_summary: e.target.value })}
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
