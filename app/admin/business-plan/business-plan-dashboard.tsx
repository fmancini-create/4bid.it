"use client"

import React from "react"

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
import {
  Plus,
  Save,
  Trash2,
  Share2,
  FileText,
  HelpCircle,
  Building,
  ChevronLeft,
  Sparkles,
  Loader2,
  Copy,
} from "lucide-react"
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
  has_congress: boolean // Aggiunto comparto congressuale
  location: string
  opening_days_year: number
  projection_years: number
  start_year: number
  status: string
  created_at: string
  initial_investment?: number
  // Campi testuali
  executive_summary?: string
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
  congress_revenue_pct: number // Aggiunto ricavi congressuali
  other_revenue_pct: number

  // Costi variabili (percentuali)
  rooms_cost_pct: number
  fb_cost_pct: number
  spa_cost_pct: number
  congress_cost_pct: number // Aggiunto costi congressuali
  other_cost_pct: number

  // Costi fissi annuali - Divisi per reparto
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
  congress_revenue_pct: {
    description: "Ricavi Centro Congressi come percentuale sui ricavi camere",
    benchmark: "Business hotel: 15-30% | Hotel congressuale: 25-45%",
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
  congress_cost_pct: {
    description: "Costi variabili congressi (allestimenti, catering, tecnologia) come % ricavi",
    benchmark: "Centro congressi: 40-55% | Sale meeting: 30-40%",
  },
  // Costi fissi personale per reparto
  staff_rooms_cost: {
    description: "Costo personale Room Division (reception, housekeeping, portineria)",
    benchmark: "Incidenza su ricavi camere: 18-25% | 4* 90 camere: €350k-500k",
  },
  staff_fb_cost: {
    description: "Costo personale F&B (cucina, sala, bar)",
    benchmark: "Incidenza su ricavi F&B: 35-45% | Ristorante hotel 4*: €250k-400k",
  },
  staff_spa_cost: {
    description: "Costo personale SPA (terapisti, reception wellness)",
    benchmark: "Incidenza su ricavi SPA: 40-50% | SPA medio-grande: €120k-200k",
  },
  staff_congress_cost: {
    description: "Costo personale Centro Congressi (tecnici, hostess, coordinatori)",
    benchmark: "Incidenza su ricavi congressi: 25-35% | Centro congressi: €80k-150k",
  },
  staff_admin_cost: {
    description: "Costo personale amministrativo (direzione, HR, contabilità)",
    benchmark: "Incidenza su ricavi totali: 5-8% | Hotel 4* 90 camere: €150k-250k",
  },
  rent_cost: {
    description: "Affitto o leasing immobile annuo",
    benchmark: "Variabile per location | Città d'arte: €150-300k | Periferia: €80-150k",
  },
  utilities_cost: {
    description: "Costi utenze annue (elettricità, gas, acqua)",
    benchmark: "€800-1.500/camera/anno | 90 camere: €70k-135k | Con SPA +30%",
  },
  marketing_cost: {
    description: "Budget marketing e comunicazione annuo",
    benchmark: "3-6% dei ricavi totali | Hotel 4* 90 camere: €60k-150k",
  },
  maintenance_cost: {
    description: "Costi manutenzione ordinaria annua",
    benchmark: "2-4% del valore immobile | Hotel 90 camere: €50k-100k",
  },
  insurance_cost: {
    description: "Premi assicurativi annui (RC, incendio, furto, etc.)",
    benchmark: "0.5-1% del valore immobile | Hotel 4* 90 camere: €30k-60k",
  },
  admin_cost: {
    description: "Costi amministrativi generali (consulenze, software, etc.)",
    benchmark: "1-2% dei ricavi | Hotel 90 camere: €30k-60k",
  },
  other_fixed_cost: {
    description: "Altri costi fissi non classificabili",
    benchmark: "1-2% dei ricavi | €20k-50k",
  },
  depreciation: {
    description: "Ammortamento annuo immobili e attrezzature",
    benchmark: "3-5% del valore investimento | Investimento €8M: €240k-400k",
  },
  interest_cost: {
    description: "Interessi passivi su finanziamenti",
    benchmark: "Tasso 4-6% su mutuo | Mutuo €5M: €200k-300k/anno (primi anni)",
  },
  tax_rate: {
    description: "Aliquota fiscale media (IRES + IRAP)",
    benchmark: "IRES 24% + IRAP ~4% = 27-28% effettivo",
  },
  initial_investment: {
    description: "Investimento iniziale totale per la realizzazione del progetto",
    benchmark: "Variabile | Hotel 4* 90 camere: €6-10M",
  },
}

const LabelWithTooltip = ({ field, children }: { field: string; children: React.ReactNode }) => {
  const info = FIELD_INFO[field]
  if (!info) return <Label>{children}</Label>

  return (
    <div className="flex items-center gap-1">
      <Label>{children}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
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
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareEmail, setShareEmail] = useState("")
  const [sharePassword, setSharePassword] = useState("")
  const [generatingSection, setGeneratingSection] = useState<string | null>(null)

  const selectedPlanId = selectedPlan?.id
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

  const createDefaultYears = async (planId: string, numYears: number) => {
    setIsLoading(true)
    try {
      for (let year = 1; year <= numYears; year++) {
        const defaultData: Partial<BusinessPlanFinancials> = {
          business_plan_id: planId,
          year_number: year,
          rooms_available: selectedPlan?.num_rooms || 90,
          opening_days: selectedPlan?.opening_days_year || 365,
          occupancy_rate: 55 + year * 5, // Crescita graduale
          adr: 170 + year * 10,
          fb_revenue_pct: 35,
          spa_revenue_pct: selectedPlan?.has_spa ? 12 : 0,
          congress_revenue_pct: selectedPlan?.has_congress ? 20 : 0,
          other_revenue_pct: 5,
          rooms_cost_pct: 25,
          fb_cost_pct: 35,
          spa_cost_pct: 40,
          congress_cost_pct: 45,
          other_cost_pct: 20,
          staff_rooms_cost: 400000,
          staff_fb_cost: selectedPlan?.has_restaurant ? 300000 : 0,
          staff_spa_cost: selectedPlan?.has_spa ? 150000 : 0,
          staff_congress_cost: selectedPlan?.has_congress ? 100000 : 0,
          staff_admin_cost: 180000,
          rent_cost: 180000,
          utilities_cost: 120000,
          marketing_cost: 80000,
          maintenance_cost: 60000,
          insurance_cost: 35000,
          admin_cost: 45000,
          other_fixed_cost: 30000,
          depreciation: 150000,
          interest_cost: 80000,
          tax_rate: 24,
        }
        await fetch(`/api/business-plan/${planId}/financials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(defaultData),
        })
      }
      await loadFinancials(planId)
      toast.success("Parametri inizializzati con successo!")
    } catch (error) {
      console.error("Error creating default years:", error)
      toast.error("Errore nell'inizializzazione dei parametri")
    }
    setIsLoading(false)
  }

  const copyFromPreviousYear = (currentYear: number) => {
    const prevYear = financials.find((f) => f.year_number === currentYear - 1)
    if (!prevYear) {
      toast.error("Anno precedente non trovato")
      return
    }

    const currentFin = financials.find((f) => f.year_number === currentYear)
    if (!currentFin) return

    // Copia tutti i valori dall'anno precedente
    const updated = { ...currentFin }
    Object.keys(prevYear).forEach((key) => {
      if (key !== "id" && key !== "year_number" && key !== "business_plan_id") {
        ;(updated as any)[key] = (prevYear as any)[key]
      }
    })

    setFinancials(financials.map((f) => (f.year_number === currentYear ? updated : f)))
    saveFinancials(updated)
    toast.success(`Parametri copiati dall'Anno ${currentYear - 1}`)
  }

  const addNewYear = async () => {
    if (!selectedPlan) return
    const maxYear = Math.max(...financials.map((f) => f.year_number), 0)
    const newYear = maxYear + 1
    const prevYear = financials.find((f) => f.year_number === maxYear)

    // Crea nuovo anno copiando dall'ultimo
    const newData: Partial<BusinessPlanFinancials> = prevYear
      ? {
          ...prevYear,
          id: undefined,
          year_number: newYear,
          // Incrementi automatici per nuovo anno
          occupancy_rate: Math.min((prevYear.occupancy_rate || 65) + 3, 85),
          adr: (prevYear.adr || 180) * 1.03,
        }
      : {
          business_plan_id: selectedPlan.id,
          year_number: newYear,
          rooms_available: selectedPlan.num_rooms || 90,
          opening_days: selectedPlan.opening_days_year || 365,
          occupancy_rate: 65,
          adr: 180,
          fb_revenue_pct: 35,
          spa_revenue_pct: 12,
          congress_revenue_pct: 20,
          other_revenue_pct: 5,
          rooms_cost_pct: 25,
          fb_cost_pct: 35,
          spa_cost_pct: 40,
          congress_cost_pct: 45,
          other_cost_pct: 20,
          staff_rooms_cost: 400000,
          staff_fb_cost: 300000,
          staff_spa_cost: 150000,
          staff_congress_cost: 100000,
          staff_admin_cost: 180000,
          rent_cost: 180000,
          utilities_cost: 120000,
          marketing_cost: 80000,
          maintenance_cost: 60000,
          insurance_cost: 35000,
          admin_cost: 45000,
          other_fixed_cost: 30000,
          depreciation: 150000,
          interest_cost: 80000,
          tax_rate: 24,
        }

    try {
      const res = await fetch(`/api/business-plan/${selectedPlan.id}/financials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      })
      if (res.ok) {
        await loadFinancials(selectedPlan.id)
        // Aggiorna anche projection_years nel piano
        setSelectedPlan({ ...selectedPlan, projection_years: newYear })
        toast.success(`Anno ${newYear} aggiunto con successo!`)
      }
    } catch (error) {
      console.error("Error adding new year:", error)
      toast.error("Errore nell'aggiunta del nuovo anno")
    }
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
        toast.success("Business Plan salvato con successo!")
      } else {
        toast.error("Errore nel salvataggio del Business Plan")
      }
    } catch (error) {
      console.error("Error saving plan:", error)
      toast.error("Errore nel salvataggio del Business Plan")
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
        toast.success(`Parametri Anno ${updated.year_number} salvati con successo!`)
      } else {
        toast.error(`Errore nel salvataggio dei parametri dell'Anno ${yearFinancials.year_number}`)
      }
    } catch (error) {
      console.error("Error saving financials:", error)
      toast.error(`Errore nel salvataggio dei parametri dell'Anno ${yearFinancials.year_number}`)
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
        toast.success("Business Plan eliminato con successo!")
      } else {
        toast.error("Errore nell'eliminazione del Business Plan")
      }
    } catch (error) {
      console.error("Error deleting plan:", error)
      toast.error("Errore nell'eliminazione del Business Plan")
    }
  }

  const sharePlan = async () => {
    if (!selectedPlan || !shareEmail || !sharePassword) {
      toast.error("Compila email e password")
      return
    }
    try {
      const res = await fetch(`/api/business-plan/${selectedPlan.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: shareEmail, password: sharePassword }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Link di condivisione inviato a ${shareEmail}`)
        setShowShareDialog(false)
        setShareEmail("")
        setSharePassword("")
      } else {
        toast.error("Errore nella condivisione")
      }
    } catch (error) {
      console.error("Error sharing plan:", error)
      toast.error("Errore nella condivisione")
    }
  }

  const generateContent = async (section: string) => {
    if (!selectedPlan) return
    setGeneratingSection(section)
    try {
      const res = await fetch(`/api/business-plan/${selectedPlan.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, financials }),
      })
      if (res.ok) {
        const { content } = await res.json()
        setSelectedPlan({ ...selectedPlan, [section]: content })
        toast.success("Contenuto generato con successo!")
      } else {
        toast.error("Errore nella generazione del contenuto")
      }
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error("Errore nella generazione del contenuto")
    }
    setGeneratingSection(null)
  }

  const createNewPlan = async () => {
    try {
      const res = await fetch("/api/business-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Nuovo Business Plan",
          description: "",
          client_name: "",
          project_type: "hotel",
          num_rooms: 90,
          stars: 4,
          has_spa: true,
          has_restaurant: true,
          has_congress: false, // Default false per congress
          location: "",
          opening_days_year: 365,
          projection_years: 3,
          start_year: new Date().getFullYear() + 1,
          initial_investment: 8000000,
          status: "draft",
        }),
      })
      if (res.ok) {
        const newPlan = await res.json()
        setPlans([newPlan, ...plans])
        setSelectedPlan(newPlan)
        toast.success("Nuovo Business Plan creato!")
      } else {
        toast.error("Errore nella creazione del Business Plan")
      }
    } catch (error) {
      console.error("Error creating plan:", error)
      toast.error("Errore nella creazione del Business Plan")
    }
  }

  const calculatePL = (plan: BusinessPlan, fin: BusinessPlanFinancials) => {
    const numRooms = getFinValue(fin, "rooms_available", plan.num_rooms || 90)
    const openingDays = getFinValue(fin, "opening_days", plan.opening_days_year || 365)
    const occupancy = getFinValue(fin, "occupancy_rate", 65) / 100
    const adr = getFinValue(fin, "adr", 180)

    const roomNights = numRooms * openingDays * occupancy

    // RICAVI
    const roomRevenue = roomNights * adr
    const fbRevenue = plan.has_restaurant ? roomRevenue * (getFinValue(fin, "fb_revenue_pct", 35) / 100) : 0
    const spaRevenue = plan.has_spa ? roomRevenue * (getFinValue(fin, "spa_revenue_pct", 12) / 100) : 0
    const congressRevenue = plan.has_congress ? roomRevenue * (getFinValue(fin, "congress_revenue_pct", 20) / 100) : 0
    const otherRevenue = roomRevenue * (getFinValue(fin, "other_revenue_pct", 5) / 100)
    const totalRevenue = roomRevenue + fbRevenue + spaRevenue + congressRevenue + otherRevenue

    // COSTI VARIABILI
    const roomCosts = roomRevenue * (getFinValue(fin, "rooms_cost_pct", 25) / 100)
    const fbCosts = fbRevenue * (getFinValue(fin, "fb_cost_pct", 35) / 100)
    const spaCosts = spaRevenue * (getFinValue(fin, "spa_cost_pct", 40) / 100)
    const congressCosts = congressRevenue * (getFinValue(fin, "congress_cost_pct", 45) / 100)
    const totalVariableCosts = roomCosts + fbCosts + spaCosts + congressCosts

    // MARGINE DI CONTRIBUZIONE
    const contributionMargin = totalRevenue - totalVariableCosts

    // COSTI FISSI - Personale diviso per reparto
    const staffRoomsCost = getFinValue(fin, "staff_rooms_cost", 400000)
    const staffFbCost = plan.has_restaurant ? getFinValue(fin, "staff_fb_cost", 300000) : 0
    const staffSpaCost = plan.has_spa ? getFinValue(fin, "staff_spa_cost", 150000) : 0
    const staffCongressCost = plan.has_congress ? getFinValue(fin, "staff_congress_cost", 100000) : 0
    const staffAdminCost = getFinValue(fin, "staff_admin_cost", 180000)
    const totalStaffCosts = staffRoomsCost + staffFbCost + staffSpaCost + staffCongressCost + staffAdminCost

    const rentCosts = getFinValue(fin, "rent_cost", 180000)
    const utilitiesCosts = getFinValue(fin, "utilities_cost", 120000)
    const maintenanceCosts = getFinValue(fin, "maintenance_cost", 60000)
    const insuranceCosts = getFinValue(fin, "insurance_cost", 35000)
    const marketingCosts = getFinValue(fin, "marketing_cost", 80000)
    const adminCosts = getFinValue(fin, "admin_cost", 45000)
    const otherFixedCosts = getFinValue(fin, "other_fixed_cost", 30000)
    const totalFixedCosts =
      totalStaffCosts +
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
    const interestCost = getFinValue(fin, "interest_cost", 80000)

    // EBT
    const ebt = ebit - interestCost

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
      roomRevenue,
      fbRevenue,
      spaRevenue,
      congressRevenue,
      otherRevenue,
      totalRevenue,
      roomCosts,
      fbCosts,
      spaCosts,
      congressCosts,
      totalVariableCosts,
      contributionMargin,
      staffRoomsCost,
      staffFbCost,
      staffSpaCost,
      staffCongressCost,
      staffAdminCost,
      totalStaffCosts,
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
      interestCost,
      ebt,
      taxes,
      netIncome,
      revpar,
      goppar,
      ebitdaMargin,
      netMargin,
    }
  }

  // Lista piani
  if (!selectedPlan) {
    return (
      <div className="container mx-auto p-4 sm:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Business Plan</h1>
            <p className="text-muted-foreground">Gestisci i tuoi business plan</p>
          </div>
          <Button onClick={createNewPlan}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Plan
          </Button>
        </div>

        {plans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Nessun Business Plan</h3>
              <p className="text-muted-foreground mb-4">Crea il tuo primo business plan per iniziare</p>
              <Button onClick={createNewPlan}>
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
                    <Badge variant={plan.status === "active" ? "default" : "secondary"}>{plan.status}</Badge>
                  </div>
                  <CardDescription>{plan.client_name || "Nessun cliente"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-4 w-4" />
                    <span>
                      {plan.num_rooms} camere • {plan.stars} stelle
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
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
                {/* NUOVO CAMPO: Investimento Iniziale */}
                <div className="space-y-2">
                  <LabelWithTooltip field="initial_investment">Investimento Iniziale (€)</LabelWithTooltip>
                  <Input
                    type="number"
                    value={selectedPlan.initial_investment || 0}
                    onChange={(e) =>
                      setSelectedPlan({ ...selectedPlan, initial_investment: Number.parseFloat(e.target.value) || 0 })
                    }
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
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPlan.has_congress || false}
                      onChange={(e) => setSelectedPlan({ ...selectedPlan, has_congress: e.target.checked })}
                      className="rounded"
                    />
                    <span>Centro Congressi</span>
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
                      await createDefaultYears(selectedPlan.id, selectedPlan.projection_years || 3)
                    }}
                  >
                    Inizializza Parametri
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue={String(financials[0]?.year_number || 1)}>
                <div className="flex items-center gap-2 mb-4">
                  <TabsList>
                    {financials.map((fin) => (
                      <TabsTrigger key={fin.year_number} value={String(fin.year_number)}>
                        Anno {fin.year_number}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <Button variant="outline" size="sm" onClick={addNewYear}>
                    <Plus className="h-4 w-4 mr-1" />
                    Aggiungi Anno
                  </Button>
                </div>

                {financials.map((fin) => (
                  <TabsContent key={fin.year_number} value={String(fin.year_number)} className="space-y-6">
                    {fin.year_number > 1 && (
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => copyFromPreviousYear(fin.year_number)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copia da Anno {fin.year_number - 1}
                        </Button>
                      </div>
                    )}

                    {/* PARAMETRI OPERATIVI */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Parametri Operativi - Anno {fin.year_number}</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                          <LabelWithTooltip field="adr">ADR (€)</LabelWithTooltip>
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

                    {/* RICAVI EXTRA */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Ricavi Extra (% sui ricavi camere)</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {selectedPlan.has_restaurant && (
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
                        )}
                        {selectedPlan.has_spa && (
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
                        )}
                        {selectedPlan.has_congress && (
                          <div className="space-y-2">
                            <LabelWithTooltip field="congress_revenue_pct">Congressi (%)</LabelWithTooltip>
                            <Input
                              type="number"
                              step="0.1"
                              value={getFinValue(fin, "congress_revenue_pct", 20)}
                              onChange={(e) => {
                                const updated = { ...fin, congress_revenue_pct: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <LabelWithTooltip field="other_revenue_pct">Altri (%)</LabelWithTooltip>
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
                        <CardTitle>Costi Variabili (% sui rispettivi ricavi)</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <LabelWithTooltip field="rooms_cost_pct">Camere (%)</LabelWithTooltip>
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
                        {selectedPlan.has_restaurant && (
                          <div className="space-y-2">
                            <LabelWithTooltip field="fb_cost_pct">F&B (%)</LabelWithTooltip>
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
                        )}
                        {selectedPlan.has_spa && (
                          <div className="space-y-2">
                            <LabelWithTooltip field="spa_cost_pct">SPA (%)</LabelWithTooltip>
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
                        )}
                        {selectedPlan.has_congress && (
                          <div className="space-y-2">
                            <LabelWithTooltip field="congress_cost_pct">Congressi (%)</LabelWithTooltip>
                            <Input
                              type="number"
                              step="0.1"
                              value={getFinValue(fin, "congress_cost_pct", 45)}
                              onChange={(e) => {
                                const updated = { ...fin, congress_cost_pct: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Costi Personale per Reparto (€/anno)</CardTitle>
                        <CardDescription>
                          Inserisci i costi del personale suddivisi per i reparti attivi
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <LabelWithTooltip field="staff_rooms_cost">Room Division (€)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="1000"
                            value={getFinValue(fin, "staff_rooms_cost", 400000)}
                            onChange={(e) => {
                              const updated = { ...fin, staff_rooms_cost: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        {selectedPlan.has_restaurant && (
                          <div className="space-y-2">
                            <LabelWithTooltip field="staff_fb_cost">F&B (€)</LabelWithTooltip>
                            <Input
                              type="number"
                              step="1000"
                              value={getFinValue(fin, "staff_fb_cost", 300000)}
                              onChange={(e) => {
                                const updated = { ...fin, staff_fb_cost: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_spa && (
                          <div className="space-y-2">
                            <LabelWithTooltip field="staff_spa_cost">SPA (€)</LabelWithTooltip>
                            <Input
                              type="number"
                              step="1000"
                              value={getFinValue(fin, "staff_spa_cost", 150000)}
                              onChange={(e) => {
                                const updated = { ...fin, staff_spa_cost: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_congress && (
                          <div className="space-y-2">
                            <LabelWithTooltip field="staff_congress_cost">Congressi (€)</LabelWithTooltip>
                            <Input
                              type="number"
                              step="1000"
                              value={getFinValue(fin, "staff_congress_cost", 100000)}
                              onChange={(e) => {
                                const updated = { ...fin, staff_congress_cost: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <LabelWithTooltip field="staff_admin_cost">Amministrazione (€)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="1000"
                            value={getFinValue(fin, "staff_admin_cost", 180000)}
                            onChange={(e) => {
                              const updated = { ...fin, staff_admin_cost: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* ALTRI COSTI FISSI */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Altri Costi Fissi (€/anno)</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <LabelWithTooltip field="rent_cost">Affitto/Leasing (€)</LabelWithTooltip>
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
                          <LabelWithTooltip field="utilities_cost">Utenze (€)</LabelWithTooltip>
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
                          <LabelWithTooltip field="marketing_cost">Marketing (€)</LabelWithTooltip>
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
                          <LabelWithTooltip field="maintenance_cost">Manutenzione (€)</LabelWithTooltip>
                          <Input
                            type="number"
                            step="1000"
                            value={getFinValue(fin, "maintenance_cost", 60000)}
                            onChange={(e) => {
                              const updated = { ...fin, maintenance_cost: Number.parseFloat(e.target.value) || 0 }
                              setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                            }}
                            onBlur={() => saveFinancials(fin)}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip field="insurance_cost">Assicurazioni (€)</LabelWithTooltip>
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
                          <LabelWithTooltip field="admin_cost">Amministrazione (€)</LabelWithTooltip>
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
                          <LabelWithTooltip field="other_fixed_cost">Altri Costi Fissi (€)</LabelWithTooltip>
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
                        <CardTitle>Ammortamenti e Imposte</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <LabelWithTooltip field="depreciation">Ammortamenti Annui (€)</LabelWithTooltip>
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

          {/* Tab Proiezioni - Aggiunto % sui ricavi per ogni costo */}
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
                            <th key={fin.year_number} className="text-right py-2 px-2 font-medium" colSpan={2}>
                              Anno {fin.year_number}
                            </th>
                          ))}
                        </tr>
                        <tr className="border-b text-xs text-muted-foreground">
                          <th></th>
                          {financials.map((fin) => (
                            <>
                              <th key={`${fin.year_number}-val`} className="text-right py-1 px-2">
                                Valore
                              </th>
                              <th key={`${fin.year_number}-pct`} className="text-right py-1 px-2">
                                % Ricavi
                              </th>
                            </>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* RICAVI */}
                        <tr className="bg-muted/30">
                          <td colSpan={financials.length * 2 + 1} className="py-2 px-2 font-semibold text-primary">
                            RICAVI
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Room Division</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`room-${fin.year_number}`}>
                                <td className="text-right py-1 px-2">{formatCurrency(pl.roomRevenue)}</td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.roomRevenue / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>
                        {selectedPlan.has_restaurant && (
                          <tr className="border-b">
                            <td className="py-1 pl-4">Food & Beverage</td>
                            {financials.map((fin) => {
                              const pl = calculatePL(selectedPlan, fin)
                              return (
                                <React.Fragment key={`fb-${fin.year_number}`}>
                                  <td className="text-right py-1 px-2">{formatCurrency(pl.fbRevenue)}</td>
                                  <td className="text-right py-1 px-2 text-muted-foreground">
                                    {formatPercent((pl.fbRevenue / pl.totalRevenue) * 100)}
                                  </td>
                                </React.Fragment>
                              )
                            })}
                          </tr>
                        )}
                        {selectedPlan.has_spa && (
                          <tr className="border-b">
                            <td className="py-1 pl-4">SPA & Wellness</td>
                            {financials.map((fin) => {
                              const pl = calculatePL(selectedPlan, fin)
                              return (
                                <React.Fragment key={`spa-${fin.year_number}`}>
                                  <td className="text-right py-1 px-2">{formatCurrency(pl.spaRevenue)}</td>
                                  <td className="text-right py-1 px-2 text-muted-foreground">
                                    {formatPercent((pl.spaRevenue / pl.totalRevenue) * 100)}
                                  </td>
                                </React.Fragment>
                              )
                            })}
                          </tr>
                        )}
                        {selectedPlan.has_congress && (
                          <tr className="border-b">
                            <td className="py-1 pl-4">Centro Congressi</td>
                            {financials.map((fin) => {
                              const pl = calculatePL(selectedPlan, fin)
                              return (
                                <React.Fragment key={`congress-${fin.year_number}`}>
                                  <td className="text-right py-1 px-2">{formatCurrency(pl.congressRevenue)}</td>
                                  <td className="text-right py-1 px-2 text-muted-foreground">
                                    {formatPercent((pl.congressRevenue / pl.totalRevenue) * 100)}
                                  </td>
                                </React.Fragment>
                              )
                            })}
                          </tr>
                        )}
                        <tr className="border-b">
                          <td className="py-1 pl-4">Altri Ricavi</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`other-rev-${fin.year_number}`}>
                                <td className="text-right py-1 px-2">{formatCurrency(pl.otherRevenue)}</td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.otherRevenue / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>
                        <tr className="border-b bg-muted/50 font-semibold">
                          <td className="py-2">TOTALE RICAVI</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`total-rev-${fin.year_number}`}>
                                <td className="text-right py-2 px-2">{formatCurrency(pl.totalRevenue)}</td>
                                <td className="text-right py-2 px-2">100%</td>
                              </React.Fragment>
                            )
                          })}
                        </tr>

                        {/* COSTI VARIABILI */}
                        <tr className="bg-muted/30">
                          <td colSpan={financials.length * 2 + 1} className="py-2 px-2 font-semibold text-primary">
                            COSTI VARIABILI
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Costi Room Division</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`room-cost-${fin.year_number}`}>
                                <td className="text-right py-1 px-2 text-red-600">-{formatCurrency(pl.roomCosts)}</td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.roomCosts / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>
                        {selectedPlan.has_restaurant && (
                          <tr className="border-b">
                            <td className="py-1 pl-4">Food Cost</td>
                            {financials.map((fin) => {
                              const pl = calculatePL(selectedPlan, fin)
                              return (
                                <React.Fragment key={`fb-cost-${fin.year_number}`}>
                                  <td className="text-right py-1 px-2 text-red-600">-{formatCurrency(pl.fbCosts)}</td>
                                  <td className="text-right py-1 px-2 text-muted-foreground">
                                    {formatPercent((pl.fbCosts / pl.totalRevenue) * 100)}
                                  </td>
                                </React.Fragment>
                              )
                            })}
                          </tr>
                        )}
                        {selectedPlan.has_spa && (
                          <tr className="border-b">
                            <td className="py-1 pl-4">Costi SPA</td>
                            {financials.map((fin) => {
                              const pl = calculatePL(selectedPlan, fin)
                              return (
                                <React.Fragment key={`spa-cost-${fin.year_number}`}>
                                  <td className="text-right py-1 px-2 text-red-600">-{formatCurrency(pl.spaCosts)}</td>
                                  <td className="text-right py-1 px-2 text-muted-foreground">
                                    {formatPercent((pl.spaCosts / pl.totalRevenue) * 100)}
                                  </td>
                                </React.Fragment>
                              )
                            })}
                          </tr>
                        )}
                        {selectedPlan.has_congress && (
                          <tr className="border-b">
                            <td className="py-1 pl-4">Costi Congressi</td>
                            {financials.map((fin) => {
                              const pl = calculatePL(selectedPlan, fin)
                              return (
                                <React.Fragment key={`congress-cost-${fin.year_number}`}>
                                  <td className="text-right py-1 px-2 text-red-600">
                                    -{formatCurrency(pl.congressCosts)}
                                  </td>
                                  <td className="text-right py-1 px-2 text-muted-foreground">
                                    {formatPercent((pl.congressCosts / pl.totalRevenue) * 100)}
                                  </td>
                                </React.Fragment>
                              )
                            })}
                          </tr>
                        )}
                        <tr className="border-b bg-muted/50 font-semibold">
                          <td className="py-2">MARGINE DI CONTRIBUZIONE</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`margin-${fin.year_number}`}>
                                <td className="text-right py-2 px-2">{formatCurrency(pl.contributionMargin)}</td>
                                <td className="text-right py-2 px-2">
                                  {formatPercent((pl.contributionMargin / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>

                        {/* COSTI FISSI */}
                        <tr className="bg-muted/30">
                          <td colSpan={financials.length * 2 + 1} className="py-2 px-2 font-semibold text-primary">
                            COSTI FISSI
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Personale Totale</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`staff-${fin.year_number}`}>
                                <td className="text-right py-1 px-2 text-red-600">
                                  -{formatCurrency(pl.totalStaffCosts)}
                                </td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.totalStaffCosts / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Affitto/Leasing</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`rent-${fin.year_number}`}>
                                <td className="text-right py-1 px-2 text-red-600">-{formatCurrency(pl.rentCosts)}</td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.rentCosts / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Utenze</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`utilities-${fin.year_number}`}>
                                <td className="text-right py-1 px-2 text-red-600">
                                  -{formatCurrency(pl.utilitiesCosts)}
                                </td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.utilitiesCosts / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Manutenzione</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`maintenance-${fin.year_number}`}>
                                <td className="text-right py-1 px-2 text-red-600">
                                  -{formatCurrency(pl.maintenanceCosts)}
                                </td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.maintenanceCosts / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Assicurazioni</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`insurance-${fin.year_number}`}>
                                <td className="text-right py-1 px-2 text-red-600">
                                  -{formatCurrency(pl.insuranceCosts)}
                                </td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.insuranceCosts / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Marketing</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`marketing-${fin.year_number}`}>
                                <td className="text-right py-1 px-2 text-red-600">
                                  -{formatCurrency(pl.marketingCosts)}
                                </td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.marketingCosts / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Amministrazione</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`admin-${fin.year_number}`}>
                                <td className="text-right py-1 px-2 text-red-600">-{formatCurrency(pl.adminCosts)}</td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.adminCosts / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Altri Costi Fissi</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`other-fixed-${fin.year_number}`}>
                                <td className="text-right py-1 px-2 text-red-600">
                                  -{formatCurrency(pl.otherFixedCosts)}
                                </td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.otherFixedCosts / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>

                        {/* EBITDA */}
                        <tr className="border-b bg-green-50 dark:bg-green-900/20 font-semibold">
                          <td className="py-2">EBITDA</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`ebitda-${fin.year_number}`}>
                                <td
                                  className={`text-right py-2 px-2 ${pl.ebitda >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {formatCurrency(pl.ebitda)}
                                </td>
                                <td className="text-right py-2 px-2">{formatPercent(pl.ebitdaMargin)}</td>
                              </React.Fragment>
                            )
                          })}
                        </tr>

                        <tr className="border-b">
                          <td className="py-1 pl-4">Ammortamenti</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`depreciation-${fin.year_number}`}>
                                <td className="text-right py-1 px-2 text-red-600">
                                  -{formatCurrency(pl.depreciation)}
                                </td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.depreciation / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>

                        <tr className="border-b bg-muted/50 font-semibold">
                          <td className="py-2">EBIT</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`ebit-${fin.year_number}`}>
                                <td
                                  className={`text-right py-2 px-2 ${pl.ebit >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {formatCurrency(pl.ebit)}
                                </td>
                                <td className="text-right py-2 px-2">
                                  {formatPercent((pl.ebit / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>

                        <tr className="border-b">
                          <td className="py-1 pl-4">Interessi Passivi</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`interest-${fin.year_number}`}>
                                <td className="text-right py-1 px-2 text-red-600">
                                  -{formatCurrency(pl.interestCost)}
                                </td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.interestCost / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>

                        <tr className="border-b bg-muted/50 font-semibold">
                          <td className="py-2">EBT (Utile Ante Imposte)</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`ebt-${fin.year_number}`}>
                                <td
                                  className={`text-right py-2 px-2 ${pl.ebt >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {formatCurrency(pl.ebt)}
                                </td>
                                <td className="text-right py-2 px-2">
                                  {formatPercent((pl.ebt / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>

                        <tr className="border-b">
                          <td className="py-1 pl-4">Imposte</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`taxes-${fin.year_number}`}>
                                <td className="text-right py-1 px-2 text-red-600">-{formatCurrency(pl.taxes)}</td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.taxes / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>

                        <tr className="bg-primary/10 font-bold">
                          <td className="py-3">UTILE NETTO</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`net-income-${fin.year_number}`}>
                                <td
                                  className={`text-right py-3 px-2 ${pl.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {formatCurrency(pl.netIncome)}
                                </td>
                                <td className="text-right py-3 px-2">{formatPercent(pl.netMargin)}</td>
                              </React.Fragment>
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
                    <div className="grid gap-4 md:grid-cols-4">
                      {financials.map((fin) => {
                        const pl = calculatePL(selectedPlan, fin)
                        return (
                          <Card key={fin.year_number}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Anno {fin.year_number}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">RevPAR</span>
                                <span className="font-medium">{formatCurrency(pl.revpar)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">GOPPAR</span>
                                <span className="font-medium">{formatCurrency(pl.goppar)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">EBITDA Margin</span>
                                <span className="font-medium">{formatPercent(pl.ebitdaMargin)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Net Margin</span>
                                <span className="font-medium">{formatPercent(pl.netMargin)}</span>
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

          {/* Tab Contenuto */}
          <TabsContent value="content" className="space-y-6">
            {[
              { key: "executive_summary", title: "Executive Summary" }, // Aggiunto Executive Summary
              { key: "market_analysis", title: "Analisi di Mercato" },
              { key: "business_model", title: "Business Model" },
              { key: "marketing_strategy", title: "Strategia Marketing" },
              { key: "management_team", title: "Team di Gestione" },
              { key: "risk_analysis", title: "Analisi dei Rischi" },
            ].map((section) => (
              <Card key={section.key}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{section.title}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateContent(section.key)}
                      disabled={generatingSection === section.key}
                    >
                      {generatingSection === section.key ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generazione...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Genera con AI
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={(selectedPlan as any)[section.key] || ""}
                    onChange={(e) => setSelectedPlan({ ...selectedPlan, [section.key]: e.target.value })}
                    rows={8}
                    placeholder={`Scrivi qui ${section.title.toLowerCase()} o genera con AI...`}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Dialog Condivisione */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Condividi Business Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                  type="password"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  placeholder="Inserisci una password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Annulla
              </Button>
              <Button onClick={sharePlan}>
                <Share2 className="h-4 w-4 mr-2" />
                Condividi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
