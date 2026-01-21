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
  MessageSquare,
  Mail,
  Upload,
  ImageIcon,
  Camera,
  BedDouble,
  Users,
  Flower2,
  UtensilsCrossed,
  Presentation,
  TreePine,
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// ADDED: Interface for shares
interface BusinessPlanShare {
  id: string
  business_plan_id: string
  email: string
  token: string
  created_at: string
  last_accessed_at?: string
  access_count?: number
  expires_at?: string
}

// ADDED: Interface for comments
interface BusinessPlanComment {
  id: string
  business_plan_id: string
  author_name: string
  author_email?: string
  section: string
  content: string
  created_at: string
}

// ADDED: Interface for photos
interface BusinessPlanPhoto {
  id: string
  business_plan_id: string
  area: string
  image_url: string
  is_ai_generated: boolean
  ai_prompt?: string
  sort_order: number
  created_at: string
}

const PHOTO_AREAS = [
  { key: "building", label: "Edificio", icon: Building },
  { key: "rooms", label: "Camere", icon: BedDouble },
  { key: "common_areas", label: "Aree Comuni", icon: Users },
  { key: "spa", label: "SPA", icon: Flower2 },
  { key: "restaurant", label: "Ristorante", icon: UtensilsCrossed },
  { key: "congress", label: "Centro Congressi", icon: Presentation },
  { key: "garden", label: "Giardino/Esterni", icon: TreePine },
]

interface BusinessPlan {
  id: string
  name: string
  description: string
  client_name: string
  project_type: string
  num_rooms: number
  stars: number
  // Servizi accessori con gestione diretta/affitto
  has_spa: boolean
  spa_management: 'direct' | 'rental'
  spa_rental_fee?: number
  // SPA suddivisa in sottocategorie
  spa_treatments_enabled?: boolean // Trattamenti benessere
  spa_entries_enabled?: boolean // Ingressi benessere
  has_restaurant: boolean
  restaurant_management: 'direct' | 'rental'
  restaurant_rental_fee?: number
  has_congress: boolean
  congress_management: 'direct' | 'rental'
  congress_rental_fee?: number
  // Nuovi centri di ricavo
  has_bar: boolean
  bar_management: 'direct' | 'rental'
  bar_rental_fee?: number
  has_bistrot: boolean
  bistrot_management: 'direct' | 'rental'
  bistrot_rental_fee?: number
  has_gym: boolean
  gym_management: 'direct' | 'rental'
  gym_rental_fee?: number
  has_pool: boolean
  pool_management: 'direct' | 'rental'
  pool_rental_fee?: number
  // Piscina con ingressi esterni
  pool_external_entries_enabled?: boolean
  has_parking: boolean
  parking_management: 'direct' | 'rental'
  parking_rental_fee?: number
  has_laundry: boolean
  laundry_management: 'direct' | 'rental'
  laundry_rental_fee?: number
  // Noleggi (biciclette, auto, ecc)
  has_rentals: boolean
  rentals_management: 'direct' | 'rental'
  rentals_rental_fee?: number
  rentals_types?: string[] // ['bicycles', 'cars', 'scooters', 'ebikes']
  // Servizi NCC
  has_ncc: boolean
  ncc_management: 'direct' | 'rental'
  ncc_rental_fee?: number
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

// Ricavi extra - Modalità: 'pct_rooms' | 'absolute' | 'detailed'
  // F&B
  fb_revenue_mode?: string
  fb_revenue_pct: number
  fb_revenue_absolute?: number
  fb_internal_pct?: number
  fb_internal_avg_spend?: number
  fb_external_covers?: number
  fb_external_avg_spend?: number
  
  // SPA
  spa_revenue_mode?: string
  spa_revenue_pct: number
  spa_treatments_revenue_pct: number
  spa_entries_revenue_pct: number
  spa_revenue_absolute?: number
  spa_treatments_internal_pct?: number
  spa_treatments_internal_avg?: number
  spa_treatments_external_clients?: number
  spa_treatments_external_avg?: number
  spa_entries_internal_pct?: number
  spa_entries_internal_avg?: number
  spa_entries_external_clients?: number
  spa_entries_external_avg?: number
  
  // Congressi
  congress_revenue_mode?: string
  congress_revenue_pct: number
  congress_revenue_absolute?: number
  congress_events_year?: number
  congress_avg_revenue?: number
  
  // Bar
  bar_revenue_mode?: string
  bar_revenue_pct: number
  bar_revenue_absolute?: number
  bar_internal_pct?: number
  bar_internal_avg_spend?: number
  bar_external_clients?: number
  bar_external_avg_spend?: number
  
  // Bistrot
  bistrot_revenue_mode?: string
  bistrot_revenue_pct: number
  bistrot_revenue_absolute?: number
  bistrot_internal_pct?: number
  bistrot_internal_avg_spend?: number
  bistrot_external_clients?: number
  bistrot_external_avg_spend?: number
  
  // Palestra
  gym_revenue_mode?: string
  gym_revenue_pct: number
  gym_revenue_absolute?: number
  gym_internal_pct?: number
  gym_internal_avg?: number
  gym_external_clients?: number
  gym_external_avg?: number
  
  // Piscina
  pool_revenue_mode?: string
  pool_revenue_pct: number
  pool_external_revenue_pct: number
  pool_revenue_absolute?: number
  pool_external_entries?: number
  pool_external_avg?: number
  
  // Parcheggio
  parking_revenue_mode?: string
  parking_revenue_pct: number
  parking_revenue_absolute?: number
  parking_internal_pct?: number
  parking_internal_avg?: number
  parking_external_spaces?: number
  parking_external_days?: number
  parking_external_avg?: number
  
  // Lavanderia
  laundry_revenue_mode?: string
  laundry_revenue_pct: number
  laundry_revenue_absolute?: number
  laundry_internal_pct?: number
  laundry_internal_avg?: number
  
  // Noleggi
  rentals_revenue_mode?: string
  rentals_revenue_pct: number
  rentals_revenue_absolute?: number
  rentals_internal_pct?: number
  rentals_internal_avg?: number
  rentals_external_clients?: number
  rentals_external_avg?: number
  
  // NCC
  ncc_revenue_mode?: string
  ncc_revenue_pct: number
  ncc_revenue_absolute?: number
  ncc_internal_pct?: number
  ncc_internal_avg?: number
  ncc_external_trips?: number
  ncc_external_avg?: number
  
  other_revenue_pct: number
  
  // Canoni da affitti (se servizio in affitto)
  spa_rental_income: number
  restaurant_rental_income: number
  congress_rental_income: number
  bar_rental_income: number
  bistrot_rental_income: number
  gym_rental_income: number
  pool_rental_income: number
  parking_rental_income: number
  laundry_rental_income: number
  rentals_rental_income: number
  ncc_rental_income: number
  
  // Costi variabili (percentuali sui ricavi del reparto)
  rooms_cost_pct: number
  fb_cost_pct: number
  spa_cost_pct: number
  spa_treatments_cost_pct: number
  spa_entries_cost_pct: number
  congress_cost_pct: number
  bar_cost_pct: number
  bistrot_cost_pct: number
  gym_cost_pct: number
  pool_cost_pct: number
  pool_external_cost_pct: number
  parking_cost_pct: number
  laundry_cost_pct: number
  rentals_cost_pct: number
  ncc_cost_pct: number
  other_cost_pct: number
  
  // Costi fissi annuali - Divisi per reparto
  staff_rooms_cost: number
  staff_fb_cost: number
  staff_spa_cost: number
  staff_congress_cost: number
  staff_bar_cost: number
  staff_bistrot_cost: number
  staff_gym_cost: number
  staff_pool_cost: number
  staff_parking_cost: number
  staff_laundry_cost: number
  staff_rentals_cost: number
  staff_ncc_cost: number
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

const formatNumber = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 0 })
const formatCurrency = (n: number) => `€ ${formatNumber(n)}`
const formatPercent = (n: number) => `${n.toFixed(1)}%`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getFinValueAny = (fin: BusinessPlanFinancials, key: string, defaultVal: any): any => {
  const val = (fin as Record<string, unknown>)[key]
  return val !== undefined && val !== null ? val : defaultVal
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

// Componente per la gestione dei servizi con flag diretta/affitto
interface ServiceRowProps {
  label: string
  hasService: boolean
  management: 'direct' | 'rental'
  rentalFee: number
  onToggle: (checked: boolean) => void
  onManagementChange: (management: 'direct' | 'rental') => void
  onRentalFeeChange: (fee: number) => void
}

const ServiceRow = ({ 
  label, 
  hasService, 
  management, 
  rentalFee, 
  onToggle, 
  onManagementChange, 
  onRentalFeeChange 
}: ServiceRowProps) => {
  return (
    <div className="border rounded-lg p-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasService}
            onChange={(e) => onToggle(e.target.checked)}
            className="rounded"
          />
          <span className="font-medium">{label}</span>
        </label>
        
        {hasService && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`${label}-management`}
                  checked={management === 'direct'}
                  onChange={() => onManagementChange('direct')}
                  className="text-primary"
                />
                <span>Gestione diretta</span>
              </label>
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`${label}-management`}
                  checked={management === 'rental'}
                  onChange={() => onManagementChange('rental')}
                  className="text-primary"
                />
                <span>In affitto</span>
              </label>
            </div>
          </div>
        )}
      </div>
      
      {hasService && management === 'rental' && (
        <div className="mt-3 pl-6">
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Canone annuo (€):</Label>
            <Input
              type="number"
              value={rentalFee}
              onChange={(e) => onRentalFeeChange(Number.parseFloat(e.target.value) || 0)}
              className="w-32"
              placeholder="0"
            />
            <span className="text-xs text-muted-foreground">/anno</span>
          </div>
        </div>
      )}
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
  // CHANGE: Replace sharePassword state with auto-generated password and shareLink
  const [shareEmail, setShareEmail] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [shareLink, setShareLink] = useState("")
  const [shareStep, setShareStep] = useState<"form" | "result">("form")
  const [generatingSection, setGeneratingSection] = useState<string | null>(null)
  const [needsInit, setNeedsInit] = useState(false)
  const [shares, setShares] = useState<BusinessPlanShare[]>([])
  const [loadingShares, setLoadingShares] = useState(false)
  // ADDED: State for comments
  const [comments, setComments] = useState<BusinessPlanComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [commentAuthorName, setCommentAuthorName] = useState("")
  const [commentAuthorEmail, setCommentAuthorEmail] = useState("")
  const [commentContent, setCommentContent] = useState("")
  const [commentSection, setCommentSection] = useState<string>("")
  // ADDED: States for photos
  const [photos, setPhotos] = useState<BusinessPlanPhoto[]>([])
  const [generatingArea, setGeneratingArea] = useState<string | null>(null)
  const [uploadingArea, setUploadingArea] = useState<string | null>(null)

  const selectedPlanId = selectedPlan?.id
  useEffect(() => {
    if (selectedPlanId) {
      loadFinancials(selectedPlanId)
      // Load shares when a plan is selected
      loadShares(selectedPlanId)
      // Load comments when a plan is selected
      loadComments(selectedPlanId)
      // ADDED: Load photos when a plan is selected
      loadPhotos(selectedPlanId)
    }
  }, [selectedPlanId])

  useEffect(() => {
    if (needsInit && selectedPlan && financials.length === 0 && !isLoading) {
      console.log("[v0] Auto-initializing financials for plan:", selectedPlan.id)
      createDefaultYears(selectedPlan.id, selectedPlan.projection_years || 3)
      setNeedsInit(false)
    }
  }, [needsInit, selectedPlan, financials.length, isLoading])

  const loadFinancials = async (planId: string) => {
    setIsLoading(true)
    console.log("[v0] Loading financials for plan:", planId)
    try {
      const res = await fetch(`/api/business-plan/${planId}/financials`)
      console.log("[v0] Financials response status:", res.status)
      if (res.ok) {
        const data = await res.json()
        console.log("[v0] Financials data received:", data.length, "records")
        setFinancials(data)
        if (data.length === 0) {
          console.log("[v0] No financials found, will auto-init")
          setNeedsInit(true)
        }
      } else {
        const errorText = await res.text()
        console.error("[v0] Error loading financials:", res.status, errorText)
      }
    } catch (error) {
      console.error("[v0] Error loading financials:", error)
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
          // Parametri operativi
          occupancy_rate: 55 + year * 5, // Crescita graduale
          adr: 170 + year * 10,
          // F&B
          fb_revenue_mode: 'detailed',
          fb_internal_pct: 50,
          fb_internal_avg_spend: 45,
          fb_external_covers: 30,
          fb_external_avg_spend: 55,
          fb_cost_pct: 35,
          // SPA Treatments
          spa_revenue_mode: 'detailed',
          spa_treatments_internal_pct: selectedPlan?.has_spa ? 15 : 0,
          spa_treatments_internal_avg: 80,
          spa_treatments_external_clients: selectedPlan?.has_spa ? 10 : 0,
          spa_treatments_external_avg: 100,
          spa_treatments_cost_pct: 30,
          // SPA Entries
          spa_entries_internal_pct: selectedPlan?.has_spa ? 20 : 0,
          spa_entries_internal_avg: 25,
          spa_entries_external_clients: selectedPlan?.has_spa ? 15 : 0,
          spa_entries_external_avg: 35,
          spa_entries_cost_pct: 15,
          // Congress
          congress_revenue_mode: 'detailed',
          congress_events_year: selectedPlan?.has_congress ? 20 : 0,
          congress_avg_revenue: 5000,
          // Bar
          bar_revenue_mode: 'detailed',
          bar_internal_pct: selectedPlan?.has_bar ? 40 : 0,
          bar_internal_avg_spend: 15,
          bar_external_clients: selectedPlan?.has_bar ? 20 : 0,
          bar_external_avg_spend: 20,
          bar_cost_pct: 30,
          // Bistrot
          bistrot_revenue_mode: 'detailed',
          bistrot_internal_pct: selectedPlan?.has_bistrot ? 30 : 0,
          bistrot_internal_avg_spend: 25,
          bistrot_external_clients: selectedPlan?.has_bistrot ? 40 : 0,
          bistrot_external_avg_spend: 30,
          bistrot_cost_pct: 35,
          // Gym
          gym_revenue_mode: 'detailed',
          gym_internal_pct: selectedPlan?.has_gym ? 25 : 0,
          gym_internal_avg: 10,
          gym_external_clients: selectedPlan?.has_gym ? 15 : 0,
          gym_external_avg: 15,
          gym_cost_pct: 20,
          // Pool
          pool_revenue_mode: 'detailed',
          pool_external_entries: selectedPlan?.has_pool ? 30 : 0,
          pool_external_avg: 20,
          pool_cost_pct: 25,
          pool_external_cost_pct: 15,
          // Parking
          parking_revenue_mode: 'detailed',
          parking_internal_pct: selectedPlan?.has_parking ? 60 : 0,
          parking_internal_avg: 15,
          parking_external_spaces: selectedPlan?.has_parking ? 10 : 0,
          parking_external_days: 200,
          parking_external_avg: 20,
          parking_cost_pct: 10,
          // Laundry
          laundry_revenue_mode: 'detailed',
          laundry_internal_pct: selectedPlan?.has_laundry ? 20 : 0,
          laundry_internal_avg: 12,
          laundry_cost_pct: 40,
          // Rentals
          rentals_revenue_mode: 'detailed',
          rentals_internal_pct: selectedPlan?.has_rentals ? 15 : 0,
          rentals_internal_avg: 30,
          rentals_external_clients: selectedPlan?.has_rentals ? 10 : 0,
          rentals_external_avg: 40,
          rentals_cost_pct: 25,
          // NCC
          ncc_revenue_mode: 'detailed',
          ncc_internal_pct: selectedPlan?.has_ncc ? 10 : 0,
          ncc_internal_avg: 50,
          ncc_external_trips: selectedPlan?.has_ncc ? 100 : 0,
          ncc_external_avg: 80,
          ncc_cost_pct: 45,
          // Rental income (affitti) - usa i valori dal piano come default
          restaurant_rental_income: selectedPlan?.restaurant_management === 'rental' ? (selectedPlan?.restaurant_rental_fee || 0) : 0,
          spa_rental_income: selectedPlan?.spa_management === 'rental' ? (selectedPlan?.spa_rental_fee || 0) : 0,
          congress_rental_income: selectedPlan?.congress_management === 'rental' ? (selectedPlan?.congress_rental_fee || 0) : 0,
          bar_rental_income: selectedPlan?.bar_management === 'rental' ? (selectedPlan?.bar_rental_fee || 0) : 0,
          bistrot_rental_income: selectedPlan?.bistrot_management === 'rental' ? (selectedPlan?.bistrot_rental_fee || 0) : 0,
          gym_rental_income: selectedPlan?.gym_management === 'rental' ? (selectedPlan?.gym_rental_fee || 0) : 0,
          pool_rental_income: selectedPlan?.pool_management === 'rental' ? (selectedPlan?.pool_rental_fee || 0) : 0,
          parking_rental_income: selectedPlan?.parking_management === 'rental' ? (selectedPlan?.parking_rental_fee || 0) : 0,
          laundry_rental_income: selectedPlan?.laundry_management === 'rental' ? (selectedPlan?.laundry_rental_fee || 0) : 0,
          rentals_rental_income: selectedPlan?.rentals_management === 'rental' ? (selectedPlan?.rentals_rental_fee || 0) : 0,
          ncc_rental_income: selectedPlan?.ncc_management === 'rental' ? (selectedPlan?.ncc_rental_fee || 0) : 0,
          // Fixed costs
          rent_cost_monthly: 15000,
          utilities_cost_monthly: 10000,
          maintenance_cost_monthly: 5000,
          insurance_cost_monthly: 3000,
          marketing_cost_monthly: 7000,
          admin_cost_monthly: 4000,
          other_fixed_monthly: 2500,
          // OTA
          ota_commission_pct: 15,
          ota_share_pct: 40,
          // Investment
          depreciation_years: 20,
          loan_interest_rate: 4,
          loan_years: 15,
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

  // CHANGE: Generate random password function
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
    let password = ""
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // CHANGE: Open share dialog with auto-generated password
  const openShareDialog = () => {
    setShareEmail("")
    setGeneratedPassword(generatePassword())
    setShareLink("")
    setShareStep("form")
    setShowShareDialog(true)
  }

  // CHANGE: Updated sharePlan to use generatedPassword
  const sharePlan = async () => {
    if (!selectedPlan || !shareEmail || !generatedPassword) {
      toast.error("Compila l'email del destinatario")
      return
    }
    try {
      const res = await fetch(`/api/business-plan/${selectedPlan.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: shareEmail, password: generatedPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setShareLink(data.link)
        setShareStep("result")
        toast.success("Link di condivisione generato!")
      } else {
        toast.error(`Errore: ${data.error || "Condivisione fallita"}`)
      }
    } catch (error) {
      console.error("Error sharing plan:", error)
      toast.error("Errore nella condivisione")
    }
  }

  // CHANGE: Copy to clipboard function
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiato!`)
  }

  const loadShares = async (planId: string) => {
    setLoadingShares(true)
    try {
      const res = await fetch(`/api/business-plan/${planId}/shares`)
      if (res.ok) {
        const data = await res.json()
        setShares(data)
      }
    } catch (error) {
      console.error("Error loading shares:", error)
    }
    setLoadingShares(false)
  }

  const resendShare = async (shareId: string, email: string) => {
    if (!selectedPlan) return

    try {
      setLoadingShares(true)
      const response = await fetch(`/api/business-plan/${selectedPlan.id}/share/${shareId}/resend`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Errore durante il reinvio dell'email")
      }

      toast.success(`Email reinviata a ${email}`)
    } catch (error) {
      console.error("[v0] Error resending share:", error)
      toast.error("Impossibile reinviare l'email. Riprova.")
    } finally {
      setLoadingShares(false)
    }
  }

  const deleteShare = async (shareId: string) => {
    if (!selectedPlan || !confirm("Vuoi eliminare questa condivisione?")) return
    try {
      const res = await fetch(`/api/business-plan/${selectedPlan.id}/share?shareId=${shareId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setShares(shares.filter((s) => s.id !== shareId))
        toast.success("Condivisione eliminata")
      }
    } catch (error) {
      console.error("Error deleting share:", error)
      toast.error("Errore nell'eliminazione")
    }
  }

  // ADDED: Function to load photos
  const loadPhotos = async (planId: string) => {
    try {
      const res = await fetch(`/api/business-plan/${planId}/photos`)
      if (res.ok) {
        const data = await res.json()
        setPhotos(data)
      }
    } catch (error) {
      console.error("[v0] Error loading photos:", error)
    }
  }

  // ADDED: Function to generate photo
  const generatePhoto = async (area: string) => {
    if (!selectedPlan) return
    setGeneratingArea(area)
    try {
      const res = await fetch(`/api/business-plan/${selectedPlan.id}/photos/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area }),
      })
      const data = await res.json()
      if (res.ok && data.photo) {
        setPhotos([...photos, data.photo])
      } else {
        alert(data.error || "Errore nella generazione")
      }
    } catch (error) {
      console.error("[v0] Error generating photo:", error)
      alert("Errore nella generazione dell'immagine")
    } finally {
      setGeneratingArea(null)
    }
  }

  // ADDED: Function to upload photo
  const uploadPhoto = async (area: string, file: File) => {
    if (!selectedPlan) return
    setUploadingArea(area)
    try {
      // Upload to Vercel Blob or use base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        // Per ora salviamo come base64, in produzione usare Vercel Blob
        const res = await fetch(`/api/business-plan/${selectedPlan.id}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            area,
            image_url: base64, // Changed from photo_url to image_url
            is_ai_generated: false,
          }),
        })
        const data = await res.json()
        if (res.ok) {
          setPhotos([...photos, data])
        } else {
          alert(data.error || "Errore nel caricamento")
        }
        setUploadingArea(null)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("[v0] Error uploading photo:", error)
      alert("Errore nel caricamento dell'immagine")
      setUploadingArea(null)
    }
  }

  // ADDED: Function to delete photo
  const deletePhoto = async (photoId: string) => {
    if (!selectedPlan || !confirm("Eliminare questa foto?")) return
    try {
      const res = await fetch(`/api/business-plan/${selectedPlan.id}/photos?photoId=${photoId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setPhotos(photos.filter((p) => p.id !== photoId))
      }
    } catch (error) {
      console.error("[v0] Error deleting photo:", error)
    }
  }

  const downloadPDF = () => {
    if (!selectedPlan) return
    const url = `/api/business-plan/${selectedPlan.id}/pdf`
    window.open(url, "_blank")
  }

  const generateContent = async (section: string) => {
    if (!selectedPlan) return
    setGeneratingSection(section)
    try {
      console.log("[v0] Generating content for section:", section)
      const res = await fetch(`/api/business-plan/${selectedPlan.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, financials }),
      })
      if (res.ok) {
        const { content } = await res.json()
        console.log("[v0] Content generated, length:", content?.length || 0)
        const updatedPlan = { ...selectedPlan, [section]: content }
        setSelectedPlan(updatedPlan)

        // Salva automaticamente nel database
        console.log("[v0] Auto-saving content to database for section:", section)
        const saveRes = await fetch(`/api/business-plan/${selectedPlan.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPlan),
        })
        if (saveRes.ok) {
          console.log("[v0] Content saved successfully for section:", section)
          toast.success("Contenuto generato e salvato!")
        } else {
          const errorText = await saveRes.text()
          console.error("[v0] Failed to save content:", saveRes.status, errorText)
          toast.success("Contenuto generato (clicca Salva per confermare)")
        }
      } else {
        const errorText = await res.text()
        console.error("[v0] Failed to generate content:", res.status, errorText)
        toast.error("Errore nella generazione del contenuto")
      }
    } catch (error) {
      console.error("[v0] Error generating content:", error)
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

    // RICAVI - Gestione diretta vs affitto con 3 modalità calcolo
    const roomRevenue = roomNights * adr
    
    // Helper per calcolo ricavi in base alla modalità
    const calcServiceRevenue = (
      mode: string,
      pctValue: number,
      absoluteValue: number,
      internalPct: number,
      internalAvg: number,
      externalCount: number,
      externalAvg: number
    ) => {
      if (mode === 'absolute') return absoluteValue
      if (mode === 'detailed') {
        const internalRev = roomNights * (internalPct / 100) * internalAvg
        const externalRev = externalCount * externalAvg
        return internalRev + externalRev
      }
      // default: pct_rooms
      return roomRevenue * (pctValue / 100)
    }
    
    // Ristorante
    let fbRevenue = 0
    if (plan.has_restaurant && plan.restaurant_management === 'direct') {
      const mode = getFinValueAny(fin, "fb_revenue_mode", 'pct_rooms')
      fbRevenue = calcServiceRevenue(
        mode,
        getFinValue(fin, "fb_revenue_pct", 35),
        getFinValueAny(fin, "fb_revenue_absolute", 0),
        getFinValueAny(fin, "fb_internal_pct", 60),
        getFinValueAny(fin, "fb_internal_avg_spend", 45),
        getFinValueAny(fin, "fb_external_covers", 2000),
        getFinValueAny(fin, "fb_external_avg_spend", 55)
      )
    }
    const fbRentalIncome = plan.has_restaurant && plan.restaurant_management === 'rental'
      ? getFinValue(fin, "restaurant_rental_income", plan.restaurant_rental_fee || 0) : 0
    
    // SPA - con sottocategorie
    let spaRevenue = 0
    let spaTreatmentsRevenue = 0
    let spaEntriesRevenue = 0
    if (plan.has_spa && plan.spa_management === 'direct') {
      const mode = getFinValueAny(fin, "spa_revenue_mode", 'pct_rooms')
      if (mode === 'absolute') {
        spaRevenue = getFinValueAny(fin, "spa_revenue_absolute", 0)
      } else if (mode === 'detailed') {
        if (plan.spa_treatments_enabled !== false) {
          const treatInternal = roomNights * (getFinValueAny(fin, "spa_treatments_internal_pct", 15) / 100) * getFinValueAny(fin, "spa_treatments_internal_avg", 80)
          const treatExternal = getFinValueAny(fin, "spa_treatments_external_clients", 500) * getFinValueAny(fin, "spa_treatments_external_avg", 90)
          spaTreatmentsRevenue = treatInternal + treatExternal
        }
        if (plan.spa_entries_enabled !== false) {
          const entryInternal = roomNights * (getFinValueAny(fin, "spa_entries_internal_pct", 25) / 100) * getFinValueAny(fin, "spa_entries_internal_avg", 25)
          const entryExternal = getFinValueAny(fin, "spa_entries_external_clients", 1000) * getFinValueAny(fin, "spa_entries_external_avg", 30)
          spaEntriesRevenue = entryInternal + entryExternal
        }
        spaRevenue = spaTreatmentsRevenue + spaEntriesRevenue
      } else {
        if (plan.spa_treatments_enabled !== false) {
          spaTreatmentsRevenue = roomRevenue * (getFinValue(fin, "spa_treatments_revenue_pct", 8) / 100)
        }
        if (plan.spa_entries_enabled !== false) {
          spaEntriesRevenue = roomRevenue * (getFinValue(fin, "spa_entries_revenue_pct", 4) / 100)
        }
        spaRevenue = spaTreatmentsRevenue + spaEntriesRevenue
      }
    }
    const spaRentalIncome = plan.has_spa && plan.spa_management === 'rental'
      ? getFinValue(fin, "spa_rental_income", plan.spa_rental_fee || 0) : 0
    
    // Centro Congressi
    let congressRevenue = 0
    if (plan.has_congress && plan.congress_management === 'direct') {
      const mode = getFinValueAny(fin, "congress_revenue_mode", 'pct_rooms')
      if (mode === 'absolute') {
        congressRevenue = getFinValueAny(fin, "congress_revenue_absolute", 0)
      } else if (mode === 'detailed') {
        congressRevenue = getFinValueAny(fin, "congress_events_year", 50) * getFinValueAny(fin, "congress_avg_revenue", 3000)
      } else {
        congressRevenue = roomRevenue * (getFinValue(fin, "congress_revenue_pct", 20) / 100)
      }
    }
    const congressRentalIncome = plan.has_congress && plan.congress_management === 'rental'
      ? getFinValue(fin, "congress_rental_income", plan.congress_rental_fee || 0) : 0
    
    // Bar
    let barRevenue = 0
    if (plan.has_bar && plan.bar_management === 'direct') {
      const mode = getFinValueAny(fin, "bar_revenue_mode", 'pct_rooms')
      barRevenue = calcServiceRevenue(
        mode,
        getFinValue(fin, "bar_revenue_pct", 8),
        getFinValueAny(fin, "bar_revenue_absolute", 0),
        getFinValueAny(fin, "bar_internal_pct", 40),
        getFinValueAny(fin, "bar_internal_avg_spend", 15),
        getFinValueAny(fin, "bar_external_clients", 3000),
        getFinValueAny(fin, "bar_external_avg_spend", 18)
      )
    }
    const barRentalIncome = plan.has_bar && plan.bar_management === 'rental'
      ? getFinValue(fin, "bar_rental_income", plan.bar_rental_fee || 0) : 0
    
    // Bistrot
    let bistrotRevenue = 0
    if (plan.has_bistrot && plan.bistrot_management === 'direct') {
      const mode = getFinValueAny(fin, "bistrot_revenue_mode", 'pct_rooms')
      bistrotRevenue = calcServiceRevenue(
        mode,
        getFinValue(fin, "bistrot_revenue_pct", 5),
        getFinValueAny(fin, "bistrot_revenue_absolute", 0),
        getFinValueAny(fin, "bistrot_internal_pct", 20),
        getFinValueAny(fin, "bistrot_internal_avg_spend", 25),
        getFinValueAny(fin, "bistrot_external_clients", 1500),
        getFinValueAny(fin, "bistrot_external_avg_spend", 30)
      )
    }
    const bistrotRentalIncome = plan.has_bistrot && plan.bistrot_management === 'rental'
      ? getFinValue(fin, "bistrot_rental_income", plan.bistrot_rental_fee || 0) : 0
    
    // Palestra
    let gymRevenue = 0
    if (plan.has_gym && plan.gym_management === 'direct') {
      const mode = getFinValueAny(fin, "gym_revenue_mode", 'pct_rooms')
      gymRevenue = calcServiceRevenue(
        mode,
        getFinValue(fin, "gym_revenue_pct", 3),
        getFinValueAny(fin, "gym_revenue_absolute", 0),
        getFinValueAny(fin, "gym_internal_pct", 10),
        getFinValueAny(fin, "gym_internal_avg", 10),
        getFinValueAny(fin, "gym_external_clients", 500),
        getFinValueAny(fin, "gym_external_avg", 15)
      )
    }
    const gymRentalIncome = plan.has_gym && plan.gym_management === 'rental'
      ? getFinValue(fin, "gym_rental_income", plan.gym_rental_fee || 0) : 0
    
    // Piscina (con ingressi esterni)
    let poolRevenue = 0
    let poolExternalRevenue = 0
    if (plan.has_pool && plan.pool_management === 'direct') {
      const mode = getFinValueAny(fin, "pool_revenue_mode", 'pct_rooms')
      if (mode === 'absolute') {
        poolRevenue = getFinValueAny(fin, "pool_revenue_absolute", 0)
      } else if (mode === 'detailed') {
        if (plan.pool_external_entries_enabled) {
          poolExternalRevenue = getFinValueAny(fin, "pool_external_entries", 2000) * getFinValueAny(fin, "pool_external_avg", 20)
        }
        poolRevenue = poolExternalRevenue
      } else {
        poolRevenue = roomRevenue * (getFinValue(fin, "pool_revenue_pct", 2) / 100)
        if (plan.pool_external_entries_enabled) {
          poolExternalRevenue = roomRevenue * (getFinValue(fin, "pool_external_revenue_pct", 3) / 100)
        }
      }
    }
    const poolRentalIncome = plan.has_pool && plan.pool_management === 'rental'
      ? getFinValue(fin, "pool_rental_income", plan.pool_rental_fee || 0) : 0
    
    // Parcheggio
    let parkingRevenue = 0
    if (plan.has_parking && plan.parking_management === 'direct') {
      const mode = getFinValueAny(fin, "parking_revenue_mode", 'pct_rooms')
      if (mode === 'absolute') {
        parkingRevenue = getFinValueAny(fin, "parking_revenue_absolute", 0)
      } else if (mode === 'detailed') {
        const internalRev = roomNights * (getFinValueAny(fin, "parking_internal_pct", 30) / 100) * getFinValueAny(fin, "parking_internal_avg", 15)
        const externalRev = getFinValueAny(fin, "parking_external_spaces", 20) * getFinValueAny(fin, "parking_external_days", 200) * getFinValueAny(fin, "parking_external_avg", 10)
        parkingRevenue = internalRev + externalRev
      } else {
        parkingRevenue = roomRevenue * (getFinValue(fin, "parking_revenue_pct", 4) / 100)
      }
    }
    const parkingRentalIncome = plan.has_parking && plan.parking_management === 'rental'
      ? getFinValue(fin, "parking_rental_income", plan.parking_rental_fee || 0) : 0
    
    // Lavanderia
    let laundryRevenue = 0
    if (plan.has_laundry && plan.laundry_management === 'direct') {
      const mode = getFinValueAny(fin, "laundry_revenue_mode", 'pct_rooms')
      if (mode === 'absolute') {
        laundryRevenue = getFinValueAny(fin, "laundry_revenue_absolute", 0)
      } else if (mode === 'detailed') {
        laundryRevenue = roomNights * (getFinValueAny(fin, "laundry_internal_pct", 8) / 100) * getFinValueAny(fin, "laundry_internal_avg", 20)
      } else {
        laundryRevenue = roomRevenue * (getFinValue(fin, "laundry_revenue_pct", 2) / 100)
      }
    }
    const laundryRentalIncome = plan.has_laundry && plan.laundry_management === 'rental'
      ? getFinValue(fin, "laundry_rental_income", plan.laundry_rental_fee || 0) : 0
    
    // Noleggi
    let rentalsRevenue = 0
    if (plan.has_rentals && plan.rentals_management === 'direct') {
      const mode = getFinValueAny(fin, "rentals_revenue_mode", 'pct_rooms')
      rentalsRevenue = calcServiceRevenue(
        mode,
        getFinValue(fin, "rentals_revenue_pct", 5),
        getFinValueAny(fin, "rentals_revenue_absolute", 0),
        getFinValueAny(fin, "rentals_internal_pct", 15),
        getFinValueAny(fin, "rentals_internal_avg", 35),
        getFinValueAny(fin, "rentals_external_clients", 800),
        getFinValueAny(fin, "rentals_external_avg", 40)
      )
    }
    const rentalsRentalIncome = plan.has_rentals && plan.rentals_management === 'rental'
      ? getFinValue(fin, "rentals_rental_income", plan.rentals_rental_fee || 0) : 0
    
    // NCC
    let nccRevenue = 0
    if (plan.has_ncc && plan.ncc_management === 'direct') {
      const mode = getFinValueAny(fin, "ncc_revenue_mode", 'pct_rooms')
      if (mode === 'absolute') {
        nccRevenue = getFinValueAny(fin, "ncc_revenue_absolute", 0)
      } else if (mode === 'detailed') {
        const internalRev = roomNights * (getFinValueAny(fin, "ncc_internal_pct", 5) / 100) * getFinValueAny(fin, "ncc_internal_avg", 80)
        const externalRev = getFinValueAny(fin, "ncc_external_trips", 300) * getFinValueAny(fin, "ncc_external_avg", 100)
        nccRevenue = internalRev + externalRev
      } else {
        nccRevenue = roomRevenue * (getFinValue(fin, "ncc_revenue_pct", 4) / 100)
      }
    }
    const nccRentalIncome = plan.has_ncc && plan.ncc_management === 'rental'
      ? getFinValue(fin, "ncc_rental_income", plan.ncc_rental_fee || 0) : 0
    
    // Altri ricavi
    const otherRevenue = roomRevenue * (getFinValue(fin, "other_revenue_pct", 5) / 100)
    
    // Totale canoni da affitto
    const totalRentalIncome = fbRentalIncome + spaRentalIncome + congressRentalIncome + barRentalIncome +
      bistrotRentalIncome + gymRentalIncome + poolRentalIncome + parkingRentalIncome + 
      laundryRentalIncome + rentalsRentalIncome + nccRentalIncome
    
    // Totale ricavi operativi
    const totalOperatingRevenue = roomRevenue + fbRevenue + spaRevenue + congressRevenue + barRevenue +
      bistrotRevenue + gymRevenue + poolRevenue + poolExternalRevenue + parkingRevenue + laundryRevenue +
      rentalsRevenue + nccRevenue + otherRevenue
    
    const totalRevenue = totalOperatingRevenue + totalRentalIncome

    // COSTI VARIABILI
    const roomCosts = roomRevenue * (getFinValue(fin, "rooms_cost_pct", 25) / 100)
    const fbCosts = fbRevenue * (getFinValue(fin, "fb_cost_pct", 35) / 100)
    const spaTreatmentsCosts = spaTreatmentsRevenue * (getFinValue(fin, "spa_treatments_cost_pct", 45) / 100)
    const spaEntriesCosts = spaEntriesRevenue * (getFinValue(fin, "spa_entries_cost_pct", 25) / 100)
    const spaCosts = spaTreatmentsCosts + spaEntriesCosts
    const congressCosts = congressRevenue * (getFinValue(fin, "congress_cost_pct", 45) / 100)
    const barCosts = barRevenue * (getFinValue(fin, "bar_cost_pct", 30) / 100)
    const bistrotCosts = bistrotRevenue * (getFinValue(fin, "bistrot_cost_pct", 35) / 100)
    const gymCosts = gymRevenue * (getFinValue(fin, "gym_cost_pct", 20) / 100)
    const poolCosts = (poolRevenue + poolExternalRevenue) * (getFinValue(fin, "pool_cost_pct", 25) / 100)
    const parkingCosts = parkingRevenue * (getFinValue(fin, "parking_cost_pct", 15) / 100)
    const laundryCosts = laundryRevenue * (getFinValue(fin, "laundry_cost_pct", 40) / 100)
    const rentalsCosts = rentalsRevenue * (getFinValue(fin, "rentals_cost_pct", 25) / 100)
    const nccCosts = nccRevenue * (getFinValue(fin, "ncc_cost_pct", 55) / 100)
    
    const totalVariableCosts = roomCosts + fbCosts + spaCosts + congressCosts + barCosts + bistrotCosts +
      gymCosts + poolCosts + parkingCosts + laundryCosts + rentalsCosts + nccCosts

    // MARGINE DI CONTRIBUZIONE
    const contributionMargin = totalRevenue - totalVariableCosts

    // COSTI FISSI - Personale diviso per reparto (valori annuali o mensili * 12)
    const staffRoomsCost = getFinValue(fin, "staff_rooms_cost", 0) || getFinValue(fin, "staff_rooms_cost_monthly", 33333) * 12
    const staffFbCost = plan.has_restaurant && plan.restaurant_management === 'direct' 
      ? (getFinValue(fin, "staff_fb_cost", 0) || getFinValue(fin, "staff_fb_cost_monthly", 25000) * 12) : 0
    const staffSpaCost = plan.has_spa && plan.spa_management === 'direct' 
      ? (getFinValue(fin, "staff_spa_cost", 0) || getFinValue(fin, "staff_spa_cost_monthly", 12500) * 12) : 0
    const staffCongressCost = plan.has_congress && plan.congress_management === 'direct' 
      ? (getFinValue(fin, "staff_congress_cost", 0) || getFinValue(fin, "staff_congress_cost_monthly", 8333) * 12) : 0
    const staffBarCost = plan.has_bar && plan.bar_management === 'direct' 
      ? getFinValue(fin, "staff_bar_cost", 50000) : 0
    const staffBistrotCost = plan.has_bistrot && plan.bistrot_management === 'direct' 
      ? getFinValue(fin, "staff_bistrot_cost", 40000) : 0
    const staffGymCost = plan.has_gym && plan.gym_management === 'direct' 
      ? getFinValue(fin, "staff_gym_cost", 30000) : 0
    const staffPoolCost = plan.has_pool && plan.pool_management === 'direct' 
      ? getFinValue(fin, "staff_pool_cost", 25000) : 0
    const staffParkingCost = plan.has_parking && plan.parking_management === 'direct' 
      ? getFinValue(fin, "staff_parking_cost", 20000) : 0
    const staffLaundryCost = plan.has_laundry && plan.laundry_management === 'direct' 
      ? getFinValue(fin, "staff_laundry_cost", 35000) : 0
    const staffRentalsCost = plan.has_rentals && plan.rentals_management === 'direct' 
      ? getFinValue(fin, "staff_rentals_cost", 40000) : 0
    const staffNccCost = plan.has_ncc && plan.ncc_management === 'direct' 
      ? getFinValue(fin, "staff_ncc_cost", 60000) : 0
    const staffAdminCost = getFinValue(fin, "staff_admin_cost", 0) || getFinValue(fin, "staff_admin_cost_monthly", 15000) * 12
    
    const totalStaffCosts = staffRoomsCost + staffFbCost + staffSpaCost + staffCongressCost + staffBarCost +
      staffBistrotCost + staffGymCost + staffPoolCost + staffParkingCost + staffLaundryCost + 
      staffRentalsCost + staffNccCost + staffAdminCost

    // Costi fissi mensili * 12 per annuale
    const rentCosts = getFinValue(fin, "rent_cost", 0) || getFinValue(fin, "rent_cost_monthly", 15000) * 12
    const utilitiesCosts = getFinValue(fin, "utilities_cost", 0) || getFinValue(fin, "utilities_cost_monthly", 10000) * 12
    const maintenanceCosts = getFinValue(fin, "maintenance_cost", 0) || getFinValue(fin, "maintenance_cost_monthly", 5000) * 12
    const insuranceCosts = getFinValue(fin, "insurance_cost", 0) || getFinValue(fin, "insurance_cost_monthly", 3000) * 12
    const marketingCosts = getFinValue(fin, "marketing_cost", 0) || getFinValue(fin, "marketing_cost_monthly", 7000) * 12
    const adminCosts = getFinValue(fin, "admin_cost", 0) || getFinValue(fin, "admin_cost_monthly", 4000) * 12
    const otherFixedCosts = getFinValue(fin, "other_fixed_cost", 0) || getFinValue(fin, "other_fixed_monthly", 2500) * 12
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

    // AMMORTAMENTI - Calcolato da investimento iniziale / anni ammortamento
    const initialInvestment = getFinValue(fin, "initial_investment", plan.initial_investment || 0)
    const depreciationYears = getFinValue(fin, "depreciation_years", 20)
    const depreciation = depreciationYears > 0 ? initialInvestment / depreciationYears : getFinValue(fin, "depreciation", 150000)

    // EBIT
    const ebit = ebitda - depreciation

    // INTERESSI - Calcolato da prestito * tasso interesse
    const loanAmount = getFinValue(fin, "loan_amount", 0)
    const loanInterestRate = getFinValue(fin, "loan_interest_rate", 4) / 100
    const interestCost = loanAmount > 0 ? loanAmount * loanInterestRate : getFinValue(fin, "interest_cost", 0)

    // EBT
    const ebt = ebit - interestCost

    // IMPOSTE - Aliquota dal piano o default 24%
    const taxRate = (plan.tax_rate || 24) / 100
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
      fbRentalIncome,
      spaRevenue,
      spaTreatmentsRevenue,
      spaEntriesRevenue,
      spaRentalIncome,
      congressRevenue,
      congressRentalIncome,
      barRevenue,
      barRentalIncome,
      bistrotRevenue,
      bistrotRentalIncome,
      gymRevenue,
      gymRentalIncome,
      poolRevenue,
      poolExternalRevenue,
      poolRentalIncome,
      parkingRevenue,
      parkingRentalIncome,
      laundryRevenue,
      laundryRentalIncome,
      rentalsRevenue,
      rentalsRentalIncome,
      nccRevenue,
      nccRentalIncome,
      otherRevenue,
      totalRentalIncome,
      totalOperatingRevenue,
      totalRevenue,
      roomCosts,
      fbCosts,
      spaCosts,
      spaTreatmentsCosts,
      spaEntriesCosts,
      congressCosts,
      barCosts,
      bistrotCosts,
      gymCosts,
      poolCosts,
      parkingCosts,
      laundryCosts,
      rentalsCosts,
      nccCosts,
      totalVariableCosts,
      contributionMargin,
      staffRoomsCost,
      staffFbCost,
      staffSpaCost,
      staffCongressCost,
      staffBarCost,
      staffBistrotCost,
      staffGymCost,
      staffPoolCost,
      staffParkingCost,
      staffLaundryCost,
      staffRentalsCost,
      staffNccCost,
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

  // Dentro la sezione delle proiezioni (dopo calculatePL), creo un helper per tooltip ricavi
  const getRevenueTooltip = (
    type: "rooms" | "fb" | "spa" | "congress" | "other",
    fin: BusinessPlanFinancials,
    plan: BusinessPlan,
  ) => {
    const roomNights =
      (plan.num_rooms || 90) * (plan.opening_days_year || 365) * (getFinValue(fin, "occupancy_rate", 65) / 100)
    const roomRevenue = roomNights * getFinValue(fin, "adr", 180)

    switch (type) {
      case "rooms":
        return `${formatNumber(Math.round(roomNights))} room nights × ${formatCurrency(getFinValue(fin, "adr", 180))} ADR`
      case "fb":
        const fbPct = getFinValue(fin, "fb_revenue_pct", 35)
        return `${formatCurrency(roomRevenue)} (ricavi camere) × ${fbPct}%`
      case "spa":
        const spaPct = getFinValue(fin, "spa_revenue_pct", 12)
        return `${formatCurrency(roomRevenue)} (ricavi camere) × ${spaPct}%`
      case "congress":
        const congressPct = getFinValue(fin, "congress_revenue_pct", 20)
        return `${formatCurrency(roomRevenue)} (ricavi camere) × ${congressPct}%`
      case "other":
        const otherPct = getFinValue(fin, "other_revenue_pct", 5)
        return `${formatCurrency(roomRevenue)} (ricavi camere) × ${otherPct}%`
      default:
        return ""
    }
  }

  // ADDED: Function to load comments
  const loadComments = async (planId: string) => {
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/business-plan/${planId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Error loading comments:", error)
    }
    setLoadingComments(false)
  }

  // ADDED: Function to add a comment
  const addComment = async () => {
    if (!selectedPlan || !commentContent || !commentSection) {
      toast.error("Inserisci un commento e seleziona una sezione.")
      return
    }
    try {
      const res = await fetch(`/api/business-plan/${selectedPlan.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: commentAuthorName || "Utente",
          author_email: commentAuthorEmail || undefined,
          section: commentSection,
          content: commentContent,
        }),
      })
      if (res.ok) {
        const newComment = await res.json()
        setComments([newComment, ...comments])
        toast.success("Commento aggiunto con successo!")
        // Clear form
        setCommentContent("")
        setCommentSection("")
        setShowCommentDialog(false)
      } else {
        toast.error("Errore nell'aggiunta del commento")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Errore nell'aggiunta del commento")
    }
  }

  // ADDED: Function to delete a comment
  const deleteComment = async (commentId: string) => {
    if (!confirm("Vuoi eliminare questo commento?")) return
    try {
      const res = await fetch(`/api/business-plan/${selectedPlan?.id}/comments?commentId=${commentId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId))
        toast.success("Commento eliminato")
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Errore nell'eliminazione")
    }
  }

  // ADDED: Function to open comment dialog
  const openCommentDialog = (section: string) => {
    setCommentSection(section)
    setCommentContent("")
    setShowCommentDialog(true)
  }

  // ADDED: Function to format comment author
  const formatCommentAuthor = (comment: BusinessPlanComment) => {
    if (comment.author_email) {
      return `${comment.author_name} (${comment.author_email})`
    }
    return comment.author_name
  }

  // Helper component for service rows
  const ServiceRow = ({
    label,
    hasService,
    management,
    rentalFee,
    onToggle,
    onManagementChange,
    onRentalFeeChange,
  }: {
    label: string
    hasService: boolean
    management: 'direct' | 'rental'
    rentalFee: number
    onToggle: (checked: boolean) => void
    onManagementChange: (mgmt: 'direct' | 'rental') => void
    onRentalFeeChange: (fee: number) => void
  }) => {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-medium">{label}</Label>
          <input
            type="checkbox"
            checked={hasService}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4"
          />
        </div>
        {hasService && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-2">
              <Label className="text-sm">Modalità gestione</Label>
              <select
                value={management}
                onChange={(e) => onManagementChange(e.target.value as 'direct' | 'rental')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="direct">Gestione diretta</option>
                <option value="rental">Affitto</option>
              </select>
            </div>
            {management === 'rental' && (
              <div className="space-y-2">
                <Label className="text-sm">Canone annuo (€)</Label>
                <Input
                  type="number"
                  value={rentalFee}
                  onChange={(e) => onRentalFeeChange(Number.parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Helper component for service rows with subcategories
  const ServiceRowWithSubcategories = ({
    label,
    hasService,
    management,
    rentalFee,
    onToggle,
    onManagementChange,
    onRentalFeeChange,
    subcategories,
    onSubcategoryChange,
  }: {
    label: string
    hasService: boolean
    management: 'direct' | 'rental'
    rentalFee: number
    onToggle: (checked: boolean) => void
    onManagementChange: (mgmt: 'direct' | 'rental') => void
    onRentalFeeChange: (fee: number) => void
    subcategories: Array<{ key: string; label: string; enabled: boolean }>
    onSubcategoryChange: (key: string, enabled: boolean) => void
  }) => {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-medium">{label}</Label>
          <input
            type="checkbox"
            checked={hasService}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4"
          />
        </div>
        {hasService && (
          <>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label className="text-sm">Modalità gestione</Label>
                <select
                  value={management}
                  onChange={(e) => onManagementChange(e.target.value as 'direct' | 'rental')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="direct">Gestione diretta</option>
                  <option value="rental">Affitto</option>
                </select>
              </div>
              {management === 'rental' && (
                <div className="space-y-2">
                  <Label className="text-sm">Canone annuo (€)</Label>
                  <Input
                    type="number"
                    value={rentalFee}
                    onChange={(e) => onRentalFeeChange(Number.parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              )}
            </div>
            {subcategories && subcategories.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-sm font-medium">Servizi disponibili:</Label>
                {subcategories.map((sub) => (
                  <label key={sub.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sub.enabled}
                      onChange={(e) => onSubcategoryChange(sub.key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">{sub.label}</span>
                  </label>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // Helper component for service rows with rental types
  const ServiceRowWithRentalTypes = ({
    label,
    hasService,
    management,
    rentalFee,
    onToggle,
    onManagementChange,
    onRentalFeeChange,
    rentalTypes,
    onRentalTypesChange,
    availableTypes,
  }: {
    label: string
    hasService: boolean
    management: 'direct' | 'rental'
    rentalFee: number
    onToggle: (checked: boolean) => void
    onManagementChange: (mgmt: 'direct' | 'rental') => void
    onRentalFeeChange: (fee: number) => void
    rentalTypes: string[]
    onRentalTypesChange: (types: string[]) => void
    availableTypes: Array<{ key: string; label: string }>
  }) => {
    const toggleRentalType = (typeKey: string) => {
      if (rentalTypes.includes(typeKey)) {
        onRentalTypesChange(rentalTypes.filter((t) => t !== typeKey))
      } else {
        onRentalTypesChange([...rentalTypes, typeKey])
      }
    }

    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-medium">{label}</Label>
          <input
            type="checkbox"
            checked={hasService}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4"
          />
        </div>
        {hasService && (
          <>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label className="text-sm">Modalità gestione</Label>
                <select
                  value={management}
                  onChange={(e) => onManagementChange(e.target.value as 'direct' | 'rental')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="direct">Gestione diretta</option>
                  <option value="rental">Affitto</option>
                </select>
              </div>
              {management === 'rental' && (
                <div className="space-y-2">
                  <Label className="text-sm">Canone annuo (€)</Label>
                  <Input
                    type="number"
                    value={rentalFee}
                    onChange={(e) => onRentalFeeChange(Number.parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              )}
            </div>
            {availableTypes && availableTypes.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-sm font-medium">Tipologie di noleggio disponibili:</Label>
                {availableTypes.map((type) => (
                  <label key={type.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rentalTypes.includes(type.key)}
                      onChange={() => toggleRentalType(type.key)}
                      className="rounded"
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
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
            {/* CHANGE: Update header to use openShareDialog */}
            {selectedPlan && (
              <>
                <Button variant="outline" onClick={openShareDialog}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Condividi
                </Button>
                <Button onClick={savePlan} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Salvataggio..." : "Salva"}
                </Button>
                {/* CHANGE: Add downloadPDF button */}
                <Button variant="outline" onClick={downloadPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Scarica PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Generale</TabsTrigger>
            <TabsTrigger value="financials">Parametri</TabsTrigger>
            <TabsTrigger value="projections">Proiezioni</TabsTrigger>
            <TabsTrigger value="content">Contenuto</TabsTrigger>
            <TabsTrigger value="photos">Foto</TabsTrigger>
            <TabsTrigger value="shares">Condivisioni</TabsTrigger>
            <TabsTrigger value="comments">Commenti</TabsTrigger>
          </TabsList>

          {/* Tab Generale */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Progetto</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Progetto</Label>
                    <Input
                      id="name"
                      value={selectedPlan.name || ""}
                      onChange={(e) => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                      placeholder="Es: Hotel Le Mura - Business Plan 2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_name">Nome Cliente</Label>
                    <Input
                      id="client_name"
                      value={selectedPlan.client_name || ""}
                      onChange={(e) => setSelectedPlan({ ...selectedPlan, client_name: e.target.value })}
                      placeholder="Es: Hotel Le Mura S.r.l."
                    />
                  </div>
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Servizi e Centri di Ricavo</CardTitle>
                <CardDescription>Seleziona i servizi disponibili e indica se gestiti direttamente o in affitto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Ristorante */}
                <ServiceRow
                  label="Ristorante"
                  hasService={selectedPlan.has_restaurant}
                  management={selectedPlan.restaurant_management || 'direct'}
                  rentalFee={selectedPlan.restaurant_rental_fee || 0}
                  onToggle={(checked) => setSelectedPlan({ ...selectedPlan, has_restaurant: checked })}
                  onManagementChange={(mgmt) => setSelectedPlan({ ...selectedPlan, restaurant_management: mgmt })}
                  onRentalFeeChange={(fee) => setSelectedPlan({ ...selectedPlan, restaurant_rental_fee: fee })}
                />
                {/* Centro Benessere / SPA con sottocategorie */}
                <ServiceRowWithSubcategories
                  label="Centro Benessere / SPA"
                  hasService={selectedPlan.has_spa}
                  management={selectedPlan.spa_management || 'direct'}
                  rentalFee={selectedPlan.spa_rental_fee || 0}
                  onToggle={(checked) => setSelectedPlan({ ...selectedPlan, has_spa: checked })}
                  onManagementChange={(mgmt) => setSelectedPlan({ ...selectedPlan, spa_management: mgmt })}
                  onRentalFeeChange={(fee) => setSelectedPlan({ ...selectedPlan, spa_rental_fee: fee })}
                  subcategories={[
                    { key: 'treatments', label: 'Trattamenti benessere', enabled: selectedPlan.spa_treatments_enabled ?? true },
                    { key: 'entries', label: 'Ingressi benessere', enabled: selectedPlan.spa_entries_enabled ?? true },
                  ]}
                  onSubcategoryChange={(key, enabled) => {
                    if (key === 'treatments') setSelectedPlan({ ...selectedPlan, spa_treatments_enabled: enabled })
                    if (key === 'entries') setSelectedPlan({ ...selectedPlan, spa_entries_enabled: enabled })
                  }}
                />
                {/* Centro Congressi */}
                <ServiceRow
                  label="Centro Congressi"
                  hasService={selectedPlan.has_congress || false}
                  management={selectedPlan.congress_management || 'direct'}
                  rentalFee={selectedPlan.congress_rental_fee || 0}
                  onToggle={(checked) => setSelectedPlan({ ...selectedPlan, has_congress: checked })}
                  onManagementChange={(mgmt) => setSelectedPlan({ ...selectedPlan, congress_management: mgmt })}
                  onRentalFeeChange={(fee) => setSelectedPlan({ ...selectedPlan, congress_rental_fee: fee })}
                />
                {/* Bar */}
                <ServiceRow
                  label="Bar"
                  hasService={selectedPlan.has_bar || false}
                  management={selectedPlan.bar_management || 'direct'}
                  rentalFee={selectedPlan.bar_rental_fee || 0}
                  onToggle={(checked) => setSelectedPlan({ ...selectedPlan, has_bar: checked })}
                  onManagementChange={(mgmt) => setSelectedPlan({ ...selectedPlan, bar_management: mgmt })}
                  onRentalFeeChange={(fee) => setSelectedPlan({ ...selectedPlan, bar_rental_fee: fee })}
                />
                {/* Bistrot */}
                <ServiceRow
                  label="Bistrot / Caffetteria"
                  hasService={selectedPlan.has_bistrot || false}
                  management={selectedPlan.bistrot_management || 'direct'}
                  rentalFee={selectedPlan.bistrot_rental_fee || 0}
                  onToggle={(checked) => setSelectedPlan({ ...selectedPlan, has_bistrot: checked })}
                  onManagementChange={(mgmt) => setSelectedPlan({ ...selectedPlan, bistrot_management: mgmt })}
                  onRentalFeeChange={(fee) => setSelectedPlan({ ...selectedPlan, bistrot_rental_fee: fee })}
                />
                {/* Palestra */}
                <ServiceRow
                  label="Palestra / Fitness"
                  hasService={selectedPlan.has_gym || false}
                  management={selectedPlan.gym_management || 'direct'}
                  rentalFee={selectedPlan.gym_rental_fee || 0}
                  onToggle={(checked) => setSelectedPlan({ ...selectedPlan, has_gym: checked })}
                  onManagementChange={(mgmt) => setSelectedPlan({ ...selectedPlan, gym_management: mgmt })}
                  onRentalFeeChange={(fee) => setSelectedPlan({ ...selectedPlan, gym_rental_fee: fee })}
                />
                {/* Piscina con ingressi esterni */}
                <ServiceRowWithSubcategories
                  label="Piscina"
                  hasService={selectedPlan.has_pool || false}
                  management={selectedPlan.pool_management || 'direct'}
                  rentalFee={selectedPlan.pool_rental_fee || 0}
                  onToggle={(checked) => setSelectedPlan({ ...selectedPlan, has_pool: checked })}
                  onManagementChange={(mgmt) => setSelectedPlan({ ...selectedPlan, pool_management: mgmt })}
                  onRentalFeeChange={(fee) => setSelectedPlan({ ...selectedPlan, pool_rental_fee: fee })}
                  subcategories={[
                    { key: 'external_entries', label: 'Ingressi esterni', enabled: selectedPlan.pool_external_entries_enabled ?? false },
                  ]}
                  onSubcategoryChange={(key, enabled) => {
                    if (key === 'external_entries') setSelectedPlan({ ...selectedPlan, pool_external_entries_enabled: enabled })
                  }}
                />
                {/* Parcheggio */}
                <ServiceRow
                  label="Parcheggio"
                  hasService={selectedPlan.has_parking || false}
                  management={selectedPlan.parking_management || 'direct'}
                  rentalFee={selectedPlan.parking_rental_fee || 0}
                  onToggle={(checked) => setSelectedPlan({ ...selectedPlan, has_parking: checked })}
                  onManagementChange={(mgmt) => setSelectedPlan({ ...selectedPlan, parking_management: mgmt })}
                  onRentalFeeChange={(fee) => setSelectedPlan({ ...selectedPlan, parking_rental_fee: fee })}
                />
                {/* Lavanderia */}
                <ServiceRow
                  label="Lavanderia"
                  hasService={selectedPlan.has_laundry || false}
                  management={selectedPlan.laundry_management || 'direct'}
                  rentalFee={selectedPlan.laundry_rental_fee || 0}
                  onToggle={(checked) => setSelectedPlan({ ...selectedPlan, has_laundry: checked })}
                  onManagementChange={(mgmt) => setSelectedPlan({ ...selectedPlan, laundry_management: mgmt })}
                  onRentalFeeChange={(fee) => setSelectedPlan({ ...selectedPlan, laundry_rental_fee: fee })}
                />
                {/* Noleggi */}
                <ServiceRowWithRentalTypes
                  label="Noleggi"
                  hasService={selectedPlan.has_rentals || false}
                  management={selectedPlan.rentals_management || 'direct'}
                  rentalFee={selectedPlan.rentals_rental_fee || 0}
                  onToggle={(checked) => setSelectedPlan({ ...selectedPlan, has_rentals: checked })}
                  onManagementChange={(mgmt) => setSelectedPlan({ ...selectedPlan, rentals_management: mgmt })}
                  onRentalFeeChange={(fee) => setSelectedPlan({ ...selectedPlan, rentals_rental_fee: fee })}
                  rentalTypes={selectedPlan.rentals_types || []}
                  onRentalTypesChange={(types) => setSelectedPlan({ ...selectedPlan, rentals_types: types })}
                  availableTypes={[
                    { key: 'bicycles', label: 'Biciclette' },
                    { key: 'ebikes', label: 'E-bike' },
                    { key: 'scooters', label: 'Scooter' },
                    { key: 'cars', label: 'Auto' },
                    { key: 'golf_carts', label: 'Golf cart' },
                    { key: 'boats', label: 'Barche/Gommoni' },
                  ]}
                />
                {/* Servizi NCC */}
                <ServiceRow
                  label="Servizi NCC (Noleggio Con Conducente)"
                  hasService={selectedPlan.has_ncc || false}
                  management={selectedPlan.ncc_management || 'direct'}
                  rentalFee={selectedPlan.ncc_rental_fee || 0}
                  onToggle={(checked) => setSelectedPlan({ ...selectedPlan, has_ncc: checked })}
                  onManagementChange={(mgmt) => setSelectedPlan({ ...selectedPlan, ncc_management: mgmt })}
                  onRentalFeeChange={(fee) => setSelectedPlan({ ...selectedPlan, ncc_rental_fee: fee })}
                />
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
          </TabsContent>

          {/* Tab Parametri Finanziari */}
          <TabsContent value="financials" className="space-y-6">
            {/* Aggiungo banner IVA esclusa */}
            {/* Banner IVA esclusa */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>Nota:</strong> Tutti i valori (ricavi e costi) sono espressi al <strong>netto IVA</strong>. L'IVA
              viene gestita separatamente nel cash flow.
            </div>

            {isLoading ? (
              <div className="text-center py-12">Caricamento parametri...</div>
            ) : financials.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">Nessun parametro finanziario configurato</p>
                  <Button
                    onClick={async () => {
                      // Removed direct call to createDefaultYears, relying on the useEffect for auto-init
                      setNeedsInit(true) // Manually trigger the useEffect
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

                    {/* RICAVI EXTRA - Solo per servizi in gestione diretta - Con 3 modalità */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Parametri Ricavi Servizi</CardTitle>
                        <CardDescription>
                          Per ogni servizio puoi scegliere la modalità di calcolo: % sui ricavi camere, valore assoluto annuo, o parametri dettagliati (% clientela interna/esterna e prezzo medio)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* F&B / Ristorante */}
                        {selectedPlan.has_restaurant && selectedPlan.restaurant_management === 'direct' && (
                          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-medium">Ristorante / F&B</span>
                              <div className="flex gap-1">
                                <Button size="sm" variant={getFinValueAny(fin, "fb_revenue_mode", 'pct_rooms') === 'pct_rooms' ? 'default' : 'outline'} className="text-xs"
                                  onClick={() => { const updated = { ...fin, fb_revenue_mode: 'pct_rooms' }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))); saveFinancials(updated) }}>% Ricavi</Button>
                                <Button size="sm" variant={getFinValueAny(fin, "fb_revenue_mode", 'pct_rooms') === 'absolute' ? 'default' : 'outline'} className="text-xs"
                                  onClick={() => { const updated = { ...fin, fb_revenue_mode: 'absolute' }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))); saveFinancials(updated) }}>Assoluto</Button>
                                <Button size="sm" variant={getFinValueAny(fin, "fb_revenue_mode", 'pct_rooms') === 'detailed' ? 'default' : 'outline'} className="text-xs"
                                  onClick={() => { const updated = { ...fin, fb_revenue_mode: 'detailed' }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))); saveFinancials(updated) }}>Dettagliato</Button>
                              </div>
                            </div>
                            {getFinValueAny(fin, "fb_revenue_mode", 'pct_rooms') === 'pct_rooms' && (
                              <div className="flex items-center gap-2">
                                <Label className="text-sm w-40">% su ricavi camere:</Label>
                                <Input type="number" step="0.1" className="w-24" value={getFinValue(fin, "fb_revenue_pct", 35)}
                                  onChange={(e) => { const updated = { ...fin, fb_revenue_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                  onBlur={() => saveFinancials(fin)} />
                                <span className="text-sm">%</span>
                              </div>
                            )}
                            {getFinValueAny(fin, "fb_revenue_mode", 'pct_rooms') === 'absolute' && (
                              <div className="flex items-center gap-2">
                                <Label className="text-sm w-40">Valore annuo:</Label>
                                <Input type="number" step="1000" className="w-32" value={getFinValueAny(fin, "fb_revenue_absolute", 0)}
                                  onChange={(e) => { const updated = { ...fin, fb_revenue_absolute: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                  onBlur={() => saveFinancials(fin)} />
                                <span className="text-sm">€</span>
                              </div>
                            )}
                            {getFinValueAny(fin, "fb_revenue_mode", 'pct_rooms') === 'detailed' && (
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 p-3 bg-background rounded border">
                                  <span className="font-medium text-sm">Clientela Interna (Ospiti)</span>
                                  <div className="grid gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs w-28">% ospiti che usano:</Label>
                                      <Input type="number" step="1" className="w-20 h-8" value={getFinValueAny(fin, "fb_internal_pct", 60)}
                                        onChange={(e) => { const updated = { ...fin, fb_internal_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                        onBlur={() => saveFinancials(fin)} />
                                      <span className="text-xs">%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs w-28">Spesa media:</Label>
                                      <Input type="number" step="5" className="w-20 h-8" value={getFinValueAny(fin, "fb_internal_avg_spend", 45)}
                                        onChange={(e) => { const updated = { ...fin, fb_internal_avg_spend: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                        onBlur={() => saveFinancials(fin)} />
                                      <span className="text-xs">€</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2 p-3 bg-background rounded border">
                                  <span className="font-medium text-sm">Clientela Esterna</span>
                                  <div className="grid gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs w-28">Coperti/anno:</Label>
                                      <Input type="number" step="100" className="w-20 h-8" value={getFinValueAny(fin, "fb_external_covers", 2000)}
                                        onChange={(e) => { const updated = { ...fin, fb_external_covers: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                        onBlur={() => saveFinancials(fin)} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs w-28">Spesa media:</Label>
                                      <Input type="number" step="5" className="w-20 h-8" value={getFinValueAny(fin, "fb_external_avg_spend", 55)}
                                        onChange={(e) => { const updated = { ...fin, fb_external_avg_spend: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                        onBlur={() => saveFinancials(fin)} />
                                      <span className="text-xs">€</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* SPA */}
                        {selectedPlan.has_spa && selectedPlan.spa_management === 'direct' && (
                          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-medium">Centro Benessere / SPA</span>
                              <div className="flex gap-1">
                                <Button size="sm" variant={getFinValueAny(fin, "spa_revenue_mode", 'pct_rooms') === 'pct_rooms' ? 'default' : 'outline'} className="text-xs"
                                  onClick={() => { const updated = { ...fin, spa_revenue_mode: 'pct_rooms' }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))); saveFinancials(updated) }}>% Ricavi</Button>
                                <Button size="sm" variant={getFinValueAny(fin, "spa_revenue_mode", 'pct_rooms') === 'absolute' ? 'default' : 'outline'} className="text-xs"
                                  onClick={() => { const updated = { ...fin, spa_revenue_mode: 'absolute' }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))); saveFinancials(updated) }}>Assoluto</Button>
                                <Button size="sm" variant={getFinValueAny(fin, "spa_revenue_mode", 'pct_rooms') === 'detailed' ? 'default' : 'outline'} className="text-xs"
                                  onClick={() => { const updated = { ...fin, spa_revenue_mode: 'detailed' }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))); saveFinancials(updated) }}>Dettagliato</Button>
                              </div>
                            </div>
                            {getFinValueAny(fin, "spa_revenue_mode", 'pct_rooms') === 'pct_rooms' && (
                              <div className="grid gap-4 md:grid-cols-2">
                                {selectedPlan.spa_treatments_enabled !== false && (
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm w-40">Trattamenti (%):</Label>
                                    <Input type="number" step="0.1" className="w-24" value={getFinValue(fin, "spa_treatments_revenue_pct", 8)}
                                      onChange={(e) => { const updated = { ...fin, spa_treatments_revenue_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                      onBlur={() => saveFinancials(fin)} />
                                    <span className="text-sm">%</span>
                                  </div>
                                )}
                                {selectedPlan.spa_entries_enabled !== false && (
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm w-40">Ingressi (%):</Label>
                                    <Input type="number" step="0.1" className="w-24" value={getFinValue(fin, "spa_entries_revenue_pct", 4)}
                                      onChange={(e) => { const updated = { ...fin, spa_entries_revenue_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                      onBlur={() => saveFinancials(fin)} />
                                    <span className="text-sm">%</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {getFinValueAny(fin, "spa_revenue_mode", 'pct_rooms') === 'absolute' && (
                              <div className="flex items-center gap-2">
                                <Label className="text-sm w-40">Valore annuo totale:</Label>
                                <Input type="number" step="1000" className="w-32" value={getFinValueAny(fin, "spa_revenue_absolute", 0)}
                                  onChange={(e) => { const updated = { ...fin, spa_revenue_absolute: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                  onBlur={() => saveFinancials(fin)} />
                                <span className="text-sm">€</span>
                              </div>
                            )}
                            {getFinValueAny(fin, "spa_revenue_mode", 'pct_rooms') === 'detailed' && (
                              <div className="grid gap-4 md:grid-cols-2">
                                {selectedPlan.spa_treatments_enabled !== false && (
                                  <div className="space-y-2 p-3 bg-background rounded border">
                                    <span className="font-medium text-sm">Trattamenti Benessere</span>
                                    <div className="grid gap-2 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Label className="text-xs w-28">% ospiti:</Label>
                                        <Input type="number" step="1" className="w-20 h-8" value={getFinValueAny(fin, "spa_treatments_internal_pct", 15)}
                                          onChange={(e) => { const updated = { ...fin, spa_treatments_internal_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                          onBlur={() => saveFinancials(fin)} />
                                        <span className="text-xs">%</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Label className="text-xs w-28">Prezzo medio:</Label>
                                        <Input type="number" step="5" className="w-20 h-8" value={getFinValueAny(fin, "spa_treatments_internal_avg", 80)}
                                          onChange={(e) => { const updated = { ...fin, spa_treatments_internal_avg: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                          onBlur={() => saveFinancials(fin)} />
                                        <span className="text-xs">€</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Label className="text-xs w-28">Esterni/anno:</Label>
                                        <Input type="number" step="50" className="w-20 h-8" value={getFinValueAny(fin, "spa_treatments_external_clients", 500)}
                                          onChange={(e) => { const updated = { ...fin, spa_treatments_external_clients: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                          onBlur={() => saveFinancials(fin)} />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Label className="text-xs w-28">Prezzo esterni:</Label>
                                        <Input type="number" step="5" className="w-20 h-8" value={getFinValueAny(fin, "spa_treatments_external_avg", 90)}
                                          onChange={(e) => { const updated = { ...fin, spa_treatments_external_avg: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                          onBlur={() => saveFinancials(fin)} />
                                        <span className="text-xs">€</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {selectedPlan.spa_entries_enabled !== false && (
                                  <div className="space-y-2 p-3 bg-background rounded border">
                                    <span className="font-medium text-sm">Ingressi Benessere</span>
                                    <div className="grid gap-2 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Label className="text-xs w-28">% ospiti:</Label>
                                        <Input type="number" step="1" className="w-20 h-8" value={getFinValueAny(fin, "spa_entries_internal_pct", 25)}
                                          onChange={(e) => { const updated = { ...fin, spa_entries_internal_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                          onBlur={() => saveFinancials(fin)} />
                                        <span className="text-xs">%</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Label className="text-xs w-28">Prezzo medio:</Label>
                                        <Input type="number" step="5" className="w-20 h-8" value={getFinValueAny(fin, "spa_entries_internal_avg", 25)}
                                          onChange={(e) => { const updated = { ...fin, spa_entries_internal_avg: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                          onBlur={() => saveFinancials(fin)} />
                                        <span className="text-xs">€</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Label className="text-xs w-28">Esterni/anno:</Label>
                                        <Input type="number" step="50" className="w-20 h-8" value={getFinValueAny(fin, "spa_entries_external_clients", 1000)}
                                          onChange={(e) => { const updated = { ...fin, spa_entries_external_clients: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                          onBlur={() => saveFinancials(fin)} />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Label className="text-xs w-28">Prezzo esterni:</Label>
                                        <Input type="number" step="5" className="w-20 h-8" value={getFinValueAny(fin, "spa_entries_external_avg", 30)}
                                          onChange={(e) => { const updated = { ...fin, spa_entries_external_avg: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                          onBlur={() => saveFinancials(fin)} />
                                        <span className="text-xs">€</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Congressi */}
                        {selectedPlan.has_congress && selectedPlan.congress_management === 'direct' && (
                          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-medium">Centro Congressi</span>
                              <div className="flex gap-1">
                                <Button size="sm" variant={getFinValueAny(fin, "congress_revenue_mode", 'pct_rooms') === 'pct_rooms' ? 'default' : 'outline'} className="text-xs"
                                  onClick={() => { const updated = { ...fin, congress_revenue_mode: 'pct_rooms' }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))); saveFinancials(updated) }}>% Ricavi</Button>
                                <Button size="sm" variant={getFinValueAny(fin, "congress_revenue_mode", 'pct_rooms') === 'absolute' ? 'default' : 'outline'} className="text-xs"
                                  onClick={() => { const updated = { ...fin, congress_revenue_mode: 'absolute' }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))); saveFinancials(updated) }}>Assoluto</Button>
                                <Button size="sm" variant={getFinValueAny(fin, "congress_revenue_mode", 'pct_rooms') === 'detailed' ? 'default' : 'outline'} className="text-xs"
                                  onClick={() => { const updated = { ...fin, congress_revenue_mode: 'detailed' }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))); saveFinancials(updated) }}>Dettagliato</Button>
                              </div>
                            </div>
                            {getFinValueAny(fin, "congress_revenue_mode", 'pct_rooms') === 'pct_rooms' && (
                              <div className="flex items-center gap-2">
                                <Label className="text-sm w-40">% su ricavi camere:</Label>
                                <Input type="number" step="0.1" className="w-24" value={getFinValue(fin, "congress_revenue_pct", 20)}
                                  onChange={(e) => { const updated = { ...fin, congress_revenue_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                  onBlur={() => saveFinancials(fin)} />
                                <span className="text-sm">%</span>
                              </div>
                            )}
                            {getFinValueAny(fin, "congress_revenue_mode", 'pct_rooms') === 'absolute' && (
                              <div className="flex items-center gap-2">
                                <Label className="text-sm w-40">Valore annuo:</Label>
                                <Input type="number" step="1000" className="w-32" value={getFinValueAny(fin, "congress_revenue_absolute", 0)}
                                  onChange={(e) => { const updated = { ...fin, congress_revenue_absolute: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                  onBlur={() => saveFinancials(fin)} />
                                <span className="text-sm">€</span>
                              </div>
                            )}
                            {getFinValueAny(fin, "congress_revenue_mode", 'pct_rooms') === 'detailed' && (
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm w-40">Eventi/anno:</Label>
                                  <Input type="number" step="1" className="w-24" value={getFinValueAny(fin, "congress_events_year", 50)}
                                    onChange={(e) => { const updated = { ...fin, congress_events_year: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                    onBlur={() => saveFinancials(fin)} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm w-40">Ricavo medio/evento:</Label>
                                  <Input type="number" step="100" className="w-28" value={getFinValueAny(fin, "congress_avg_revenue", 3000)}
                                    onChange={(e) => { const updated = { ...fin, congress_avg_revenue: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                    onBlur={() => saveFinancials(fin)} />
                                  <span className="text-sm">€</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bar */}
                        {selectedPlan.has_bar && selectedPlan.bar_management === 'direct' && (
                          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-medium">Bar</span>
                              <div className="flex gap-1">
                                <Button size="sm" variant={getFinValueAny(fin, "bar_revenue_mode", 'pct_rooms') === 'pct_rooms' ? 'default' : 'outline'} className="text-xs"
                                  onClick={() => { const updated = { ...fin, bar_revenue_mode: 'pct_rooms' }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))); saveFinancials(updated) }}>% Ricavi</Button>
                                <Button size="sm" variant={getFinValueAny(fin, "bar_revenue_mode", 'pct_rooms') === 'absolute' ? 'default' : 'outline'} className="text-xs"
                                  onClick={() => { const updated = { ...fin, bar_revenue_mode: 'absolute' }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))); saveFinancials(updated) }}>Assoluto</Button>
                                <Button size="sm" variant={getFinValueAny(fin, "bar_revenue_mode", 'pct_rooms') === 'detailed' ? 'default' : 'outline'} className="text-xs"
                                  onClick={() => { const updated = { ...fin, bar_revenue_mode: 'detailed' }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))); saveFinancials(updated) }}>Dettagliato</Button>
                              </div>
                            </div>
                            {getFinValueAny(fin, "bar_revenue_mode", 'pct_rooms') === 'pct_rooms' && (
                              <div className="flex items-center gap-2">
                                <Label className="text-sm w-40">% su ricavi camere:</Label>
                                <Input type="number" step="0.1" className="w-24" value={getFinValue(fin, "bar_revenue_pct", 8)}
                                  onChange={(e) => { const updated = { ...fin, bar_revenue_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                  onBlur={() => saveFinancials(fin)} />
                                <span className="text-sm">%</span>
                              </div>
                            )}
                            {getFinValueAny(fin, "bar_revenue_mode", 'pct_rooms') === 'absolute' && (
                              <div className="flex items-center gap-2">
                                <Label className="text-sm w-40">Valore annuo:</Label>
                                <Input type="number" step="1000" className="w-32" value={getFinValueAny(fin, "bar_revenue_absolute", 0)}
                                  onChange={(e) => { const updated = { ...fin, bar_revenue_absolute: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                  onBlur={() => saveFinancials(fin)} />
                                <span className="text-sm">€</span>
                              </div>
                            )}
                            {getFinValueAny(fin, "bar_revenue_mode", 'pct_rooms') === 'detailed' && (
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 p-3 bg-background rounded border">
                                  <span className="font-medium text-sm">Clientela Interna</span>
                                  <div className="grid gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs w-28">% ospiti:</Label>
                                      <Input type="number" step="1" className="w-20 h-8" value={getFinValueAny(fin, "bar_internal_pct", 40)}
                                        onChange={(e) => { const updated = { ...fin, bar_internal_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                        onBlur={() => saveFinancials(fin)} />
                                      <span className="text-xs">%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs w-28">Spesa media:</Label>
                                      <Input type="number" step="1" className="w-20 h-8" value={getFinValueAny(fin, "bar_internal_avg_spend", 15)}
                                        onChange={(e) => { const updated = { ...fin, bar_internal_avg_spend: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                        onBlur={() => saveFinancials(fin)} />
                                      <span className="text-xs">€</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2 p-3 bg-background rounded border">
                                  <span className="font-medium text-sm">Clientela Esterna</span>
                                  <div className="grid gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs w-28">Clienti/anno:</Label>
                                      <Input type="number" step="100" className="w-20 h-8" value={getFinValueAny(fin, "bar_external_clients", 3000)}
                                        onChange={(e) => { const updated = { ...fin, bar_external_clients: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                        onBlur={() => saveFinancials(fin)} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs w-28">Spesa media:</Label>
                                      <Input type="number" step="1" className="w-20 h-8" value={getFinValueAny(fin, "bar_external_avg_spend", 18)}
                                        onChange={(e) => { const updated = { ...fin, bar_external_avg_spend: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                        onBlur={() => saveFinancials(fin)} />
                                      <span className="text-xs">€</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Altri servizi con layout semplificato */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {selectedPlan.has_bistrot && selectedPlan.bistrot_management === 'direct' && (
                            <div className="space-y-2 p-3 border rounded bg-muted/30">
                              <Label className="font-medium">Bistrot (%)</Label>
                              <Input type="number" step="0.1" value={getFinValue(fin, "bistrot_revenue_pct", 5)}
                                onChange={(e) => { const updated = { ...fin, bistrot_revenue_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)} />
                            </div>
                          )}
                          {selectedPlan.has_gym && selectedPlan.gym_management === 'direct' && (
                            <div className="space-y-2 p-3 border rounded bg-muted/30">
                              <Label className="font-medium">Palestra (%)</Label>
                              <Input type="number" step="0.1" value={getFinValue(fin, "gym_revenue_pct", 3)}
                                onChange={(e) => { const updated = { ...fin, gym_revenue_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)} />
                            </div>
                          )}
                          {selectedPlan.has_pool && selectedPlan.pool_management === 'direct' && (
                            <>
                              <div className="space-y-2 p-3 border rounded bg-muted/30">
                                <Label className="font-medium">Piscina (%)</Label>
                                <Input type="number" step="0.1" value={getFinValue(fin, "pool_revenue_pct", 2)}
                                  onChange={(e) => { const updated = { ...fin, pool_revenue_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                  onBlur={() => saveFinancials(fin)} />
                              </div>
                              {selectedPlan.pool_external_entries_enabled && (
                                <div className="space-y-2 p-3 border rounded bg-muted/30">
                                  <Label className="font-medium">Piscina Esterni (%)</Label>
                                  <Input type="number" step="0.1" value={getFinValue(fin, "pool_external_revenue_pct", 3)}
                                    onChange={(e) => { const updated = { ...fin, pool_external_revenue_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                    onBlur={() => saveFinancials(fin)} />
                                </div>
                              )}
                            </>
                          )}
                          {selectedPlan.has_parking && selectedPlan.parking_management === 'direct' && (
                            <div className="space-y-2 p-3 border rounded bg-muted/30">
                              <Label className="font-medium">Parcheggio (%)</Label>
                              <Input type="number" step="0.1" value={getFinValue(fin, "parking_revenue_pct", 4)}
                                onChange={(e) => { const updated = { ...fin, parking_revenue_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)} />
                            </div>
                          )}
                          {selectedPlan.has_laundry && selectedPlan.laundry_management === 'direct' && (
                            <div className="space-y-2 p-3 border rounded bg-muted/30">
                              <Label className="font-medium">Lavanderia (%)</Label>
                              <Input type="number" step="0.1" value={getFinValue(fin, "laundry_revenue_pct", 2)}
                                onChange={(e) => { const updated = { ...fin, laundry_revenue_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)} />
                            </div>
                          )}
                          {selectedPlan.has_rentals && selectedPlan.rentals_management === 'direct' && (
                            <div className="space-y-2 p-3 border rounded bg-muted/30">
                              <Label className="font-medium">Noleggi (%)</Label>
                              <Input type="number" step="0.1" value={getFinValue(fin, "rentals_revenue_pct", 5)}
                                onChange={(e) => { const updated = { ...fin, rentals_revenue_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)} />
                            </div>
                          )}
                          {selectedPlan.has_ncc && selectedPlan.ncc_management === 'direct' && (
                            <div className="space-y-2 p-3 border rounded bg-muted/30">
                              <Label className="font-medium">NCC (%)</Label>
                              <Input type="number" step="0.1" value={getFinValue(fin, "ncc_revenue_pct", 4)}
                                onChange={(e) => { const updated = { ...fin, ncc_revenue_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)} />
                            </div>
                          )}
                          <div className="space-y-2 p-3 border rounded bg-muted/30">
                            <Label className="font-medium">Altri Ricavi (%)</Label>
                            <Input type="number" step="0.1" value={getFinValue(fin, "other_revenue_pct", 5)}
                              onChange={(e) => { const updated = { ...fin, other_revenue_pct: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                              onBlur={() => saveFinancials(fin)} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* CANONI DA AFFITTO - Solo per servizi in affitto - PER ANNO */}
                    {(
                      (selectedPlan.has_restaurant && selectedPlan.restaurant_management === 'rental') ||
                      (selectedPlan.has_spa && selectedPlan.spa_management === 'rental') ||
                      (selectedPlan.has_congress && selectedPlan.congress_management === 'rental') ||
                      (selectedPlan.has_bar && selectedPlan.bar_management === 'rental') ||
                      (selectedPlan.has_bistrot && selectedPlan.bistrot_management === 'rental') ||
                      (selectedPlan.has_gym && selectedPlan.gym_management === 'rental') ||
                      (selectedPlan.has_pool && selectedPlan.pool_management === 'rental') ||
                      (selectedPlan.has_parking && selectedPlan.parking_management === 'rental') ||
                      (selectedPlan.has_laundry && selectedPlan.laundry_management === 'rental') ||
                      (selectedPlan.has_rentals && selectedPlan.rentals_management === 'rental') ||
                      (selectedPlan.has_ncc && selectedPlan.ncc_management === 'rental')
                    ) && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Canoni da Affitto - Anno {fin.year_number} (€/anno)</CardTitle>
                          <CardDescription>Ricavi da servizi dati in gestione esterna per questo anno specifico</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                          {selectedPlan.has_restaurant && selectedPlan.restaurant_management === 'rental' && (
                            <div className="space-y-2">
                              <Label>Ristorante (€)</Label>
                              <Input
                                type="number"
                                step="1000"
                                value={getFinValue(fin, "restaurant_rental_income", selectedPlan.restaurant_rental_fee || 0)}
                                onChange={(e) => { const updated = { ...fin, restaurant_rental_income: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)}
                              />
                            </div>
                          )}
                          {selectedPlan.has_spa && selectedPlan.spa_management === 'rental' && (
                            <div className="space-y-2">
                              <Label>SPA (€)</Label>
                              <Input
                                type="number"
                                step="1000"
                                value={getFinValue(fin, "spa_rental_income", selectedPlan.spa_rental_fee || 0)}
                                onChange={(e) => { const updated = { ...fin, spa_rental_income: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)}
                              />
                            </div>
                          )}
                          {selectedPlan.has_congress && selectedPlan.congress_management === 'rental' && (
                            <div className="space-y-2">
                              <Label>Congressi (€)</Label>
                              <Input
                                type="number"
                                step="1000"
                                value={getFinValue(fin, "congress_rental_income", selectedPlan.congress_rental_fee || 0)}
                                onChange={(e) => { const updated = { ...fin, congress_rental_income: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)}
                              />
                            </div>
                          )}
                          {selectedPlan.has_bar && selectedPlan.bar_management === 'rental' && (
                            <div className="space-y-2">
                              <Label>Bar (€)</Label>
                              <Input
                                type="number"
                                step="1000"
                                value={getFinValue(fin, "bar_rental_income", selectedPlan.bar_rental_fee || 0)}
                                onChange={(e) => { const updated = { ...fin, bar_rental_income: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)}
                              />
                            </div>
                          )}
                          {selectedPlan.has_bistrot && selectedPlan.bistrot_management === 'rental' && (
                            <div className="space-y-2">
                              <Label>Bistrot (€)</Label>
                              <Input
                                type="number"
                                step="1000"
                                value={getFinValue(fin, "bistrot_rental_income", selectedPlan.bistrot_rental_fee || 0)}
                                onChange={(e) => { const updated = { ...fin, bistrot_rental_income: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)}
                              />
                            </div>
                          )}
                          {selectedPlan.has_gym && selectedPlan.gym_management === 'rental' && (
                            <div className="space-y-2">
                              <Label>Palestra (€)</Label>
                              <Input
                                type="number"
                                step="1000"
                                value={getFinValue(fin, "gym_rental_income", selectedPlan.gym_rental_fee || 0)}
                                onChange={(e) => { const updated = { ...fin, gym_rental_income: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)}
                              />
                            </div>
                          )}
                          {selectedPlan.has_pool && selectedPlan.pool_management === 'rental' && (
                            <div className="space-y-2">
                              <Label>Piscina (€)</Label>
                              <Input
                                type="number"
                                step="1000"
                                value={getFinValue(fin, "pool_rental_income", selectedPlan.pool_rental_fee || 0)}
                                onChange={(e) => { const updated = { ...fin, pool_rental_income: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)}
                              />
                            </div>
                          )}
                          {selectedPlan.has_parking && selectedPlan.parking_management === 'rental' && (
                            <div className="space-y-2">
                              <Label>Parcheggio (€)</Label>
                              <Input
                                type="number"
                                step="1000"
                                value={getFinValue(fin, "parking_rental_income", selectedPlan.parking_rental_fee || 0)}
                                onChange={(e) => { const updated = { ...fin, parking_rental_income: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)}
                              />
                            </div>
                          )}
                          {selectedPlan.has_laundry && selectedPlan.laundry_management === 'rental' && (
                            <div className="space-y-2">
                              <Label>Lavanderia (€)</Label>
                              <Input
                                type="number"
                                step="1000"
                                value={getFinValue(fin, "laundry_rental_income", selectedPlan.laundry_rental_fee || 0)}
                                onChange={(e) => { const updated = { ...fin, laundry_rental_income: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)}
                              />
                            </div>
                          )}
                          {selectedPlan.has_rentals && selectedPlan.rentals_management === 'rental' && (
                            <div className="space-y-2">
                              <Label>Noleggi (€)</Label>
                              <Input
                                type="number"
                                step="1000"
                                value={getFinValue(fin, "rentals_rental_income", selectedPlan.rentals_rental_fee || 0)}
                                onChange={(e) => { const updated = { ...fin, rentals_rental_income: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)}
                              />
                            </div>
                          )}
                          {selectedPlan.has_ncc && selectedPlan.ncc_management === 'rental' && (
                            <div className="space-y-2">
                              <Label>NCC (€)</Label>
                              <Input
                                type="number"
                                step="1000"
                                value={getFinValue(fin, "ncc_rental_income", selectedPlan.ncc_rental_fee || 0)}
                                onChange={(e) => { const updated = { ...fin, ncc_rental_income: Number.parseFloat(e.target.value) || 0 }; setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f))) }}
                                onBlur={() => saveFinancials(fin)}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* COSTI VARIABILI - Solo per servizi in gestione diretta */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Costi Variabili (% sui rispettivi ricavi)</CardTitle>
                        <CardDescription>Parametri per i servizi in gestione diretta</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <Label>Camere (%)</Label>
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
                        {selectedPlan.has_restaurant && selectedPlan.restaurant_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>F&B (%)</Label>
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
                        {selectedPlan.has_spa && selectedPlan.spa_management === 'direct' && (
                          <>
                            {selectedPlan.spa_treatments_enabled !== false && (
                              <div className="space-y-2">
                                <Label>SPA Trattamenti (%)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={getFinValue(fin, "spa_treatments_cost_pct", 45)}
                                  onChange={(e) => {
                                    const updated = { ...fin, spa_treatments_cost_pct: Number.parseFloat(e.target.value) || 0 }
                                    setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                                  }}
                                  onBlur={() => saveFinancials(fin)}
                                />
                              </div>
                            )}
                            {selectedPlan.spa_entries_enabled !== false && (
                              <div className="space-y-2">
                                <Label>SPA Ingressi (%)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={getFinValue(fin, "spa_entries_cost_pct", 25)}
                                  onChange={(e) => {
                                    const updated = { ...fin, spa_entries_cost_pct: Number.parseFloat(e.target.value) || 0 }
                                    setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                                  }}
                                  onBlur={() => saveFinancials(fin)}
                                />
                              </div>
                            )}
                          </>
                        )}
                        {selectedPlan.has_congress && selectedPlan.congress_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Congressi (%)</Label>
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
                        {selectedPlan.has_bar && selectedPlan.bar_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Bar (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={getFinValue(fin, "bar_cost_pct", 30)}
                              onChange={(e) => {
                                const updated = { ...fin, bar_cost_pct: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_bistrot && selectedPlan.bistrot_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Bistrot (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={getFinValue(fin, "bistrot_cost_pct", 35)}
                              onChange={(e) => {
                                const updated = { ...fin, bistrot_cost_pct: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_gym && selectedPlan.gym_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Palestra (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={getFinValue(fin, "gym_cost_pct", 20)}
                              onChange={(e) => {
                                const updated = { ...fin, gym_cost_pct: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_pool && selectedPlan.pool_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Piscina (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={getFinValue(fin, "pool_cost_pct", 25)}
                              onChange={(e) => {
                                const updated = { ...fin, pool_cost_pct: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_parking && selectedPlan.parking_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Parcheggio (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={getFinValue(fin, "parking_cost_pct", 15)}
                              onChange={(e) => {
                                const updated = { ...fin, parking_cost_pct: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_laundry && selectedPlan.laundry_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Lavanderia (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={getFinValue(fin, "laundry_cost_pct", 40)}
                              onChange={(e) => {
                                const updated = { ...fin, laundry_cost_pct: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_rentals && selectedPlan.rentals_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Noleggi (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={getFinValue(fin, "rentals_cost_pct", 25)}
                              onChange={(e) => {
                                const updated = { ...fin, rentals_cost_pct: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_ncc && selectedPlan.ncc_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>NCC (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={getFinValue(fin, "ncc_cost_pct", 55)}
                              onChange={(e) => {
                                const updated = { ...fin, ncc_cost_pct: Number.parseFloat(e.target.value) || 0 }
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
                          Costi personale per i reparti in gestione diretta
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Room Division (€)</Label>
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
                        {selectedPlan.has_restaurant && selectedPlan.restaurant_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>F&B (€)</Label>
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
                        {selectedPlan.has_spa && selectedPlan.spa_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>SPA (€)</Label>
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
                        {selectedPlan.has_congress && selectedPlan.congress_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Congressi (€)</Label>
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
                        {selectedPlan.has_bar && selectedPlan.bar_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Bar (€)</Label>
                            <Input
                              type="number"
                              step="1000"
                              value={getFinValue(fin, "staff_bar_cost", 50000)}
                              onChange={(e) => {
                                const updated = { ...fin, staff_bar_cost: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_bistrot && selectedPlan.bistrot_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Bistrot (€)</Label>
                            <Input
                              type="number"
                              step="1000"
                              value={getFinValue(fin, "staff_bistrot_cost", 40000)}
                              onChange={(e) => {
                                const updated = { ...fin, staff_bistrot_cost: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_gym && selectedPlan.gym_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Palestra (€)</Label>
                            <Input
                              type="number"
                              step="1000"
                              value={getFinValue(fin, "staff_gym_cost", 30000)}
                              onChange={(e) => {
                                const updated = { ...fin, staff_gym_cost: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_pool && selectedPlan.pool_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Piscina (€)</Label>
                            <Input
                              type="number"
                              step="1000"
                              value={getFinValue(fin, "staff_pool_cost", 25000)}
                              onChange={(e) => {
                                const updated = { ...fin, staff_pool_cost: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_parking && selectedPlan.parking_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Parcheggio (€)</Label>
                            <Input
                              type="number"
                              step="1000"
                              value={getFinValue(fin, "staff_parking_cost", 20000)}
                              onChange={(e) => {
                                const updated = { ...fin, staff_parking_cost: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_laundry && selectedPlan.laundry_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Lavanderia (€)</Label>
                            <Input
                              type="number"
                              step="1000"
                              value={getFinValue(fin, "staff_laundry_cost", 35000)}
                              onChange={(e) => {
                                const updated = { ...fin, staff_laundry_cost: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_rentals && selectedPlan.rentals_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>Noleggi (€)</Label>
                            <Input
                              type="number"
                              step="1000"
                              value={getFinValue(fin, "staff_rentals_cost", 40000)}
                              onChange={(e) => {
                                const updated = { ...fin, staff_rentals_cost: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        {selectedPlan.has_ncc && selectedPlan.ncc_management === 'direct' && (
                          <div className="space-y-2">
                            <Label>NCC (€)</Label>
                            <Input
                              type="number"
                              step="1000"
                              value={getFinValue(fin, "staff_ncc_cost", 60000)}
                              onChange={(e) => {
                                const updated = { ...fin, staff_ncc_cost: Number.parseFloat(e.target.value) || 0 }
                                setFinancials(financials.map((f) => (f.year_number === fin.year_number ? updated : f)))
                              }}
                              onBlur={() => saveFinancials(fin)}
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Amministrazione (€)</Label>
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
                          <LabelWithTooltip field="admin_cost">Costi Amministrativi (€)</LabelWithTooltip>
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
                          <td className="py-1 pl-4">
                            <Tooltip>
                              <TooltipTrigger>Room Division</TooltipTrigger>
                              <TooltipContent>{getRevenueTooltip("rooms", financials[0], selectedPlan)}</TooltipContent>
                            </Tooltip>
                          </td>
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
                            <td className="py-1 pl-4">
                              <Tooltip>
                                <TooltipTrigger>Food & Beverage</TooltipTrigger>
                                <TooltipContent>{getRevenueTooltip("fb", financials[0], selectedPlan)}</TooltipContent>
                              </Tooltip>
                            </td>
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
                            <td className="py-1 pl-4">
                              <Tooltip>
                                <TooltipTrigger>SPA & Wellness</TooltipTrigger>
                                <TooltipContent>{getRevenueTooltip("spa", financials[0], selectedPlan)}</TooltipContent>
                              </Tooltip>
                            </td>
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
                            <td className="py-1 pl-4">
                              <Tooltip>
                                <TooltipTrigger>Centro Congressi</TooltipTrigger>
                                <TooltipContent>
                                  {getRevenueTooltip("congress", financials[0], selectedPlan)}
                                </TooltipContent>
                              </Tooltip>
                            </td>
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
                          <td className="py-1 pl-4">
                            <Tooltip>
                              <TooltipTrigger>Altri Ricavi</TooltipTrigger>
                              <TooltipContent>{getRevenueTooltip("other", financials[0], selectedPlan)}</TooltipContent>
                            </Tooltip>
                          </td>
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
                        <tr className="border-b bg-muted/50 font-semibold">
                          <td className="py-2">COSTI PERSONALE</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`total-staff-${fin.year_number}`}>
                                <td className="text-right py-2 px-2 text-red-600">
                                  -{formatCurrency(pl.totalStaffCosts)}
                                </td>
                                <td className="text-right py-2 px-2 text-muted-foreground">
                                  {formatPercent((pl.totalStaffCosts / pl.totalRevenue) * 100)}
                                </td>
                              </React.Fragment>
                            )
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Personale Amministrativo</td>
                          {financials.map((fin) => {
                            const pl = calculatePL(selectedPlan, fin)
                            return (
                              <React.Fragment key={`staff-admin-${fin.year_number}`}>
                                <td className="text-right py-1 px-2 text-red-600">
                                  -{formatCurrency(pl.staffAdminCost)}
                                </td>
                                <td className="text-right py-1 px-2 text-muted-foreground">
                                  {formatPercent((pl.staffAdminCost / pl.totalRevenue) * 100)}
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
                          <td className="py-1 pl-4">Costi Amministrativi</td>
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
                                  {formatPercent((pl.ebit / pl.totalRevenue) * 100)}
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

          {/* Tab Foto */}
          <TabsContent value="photos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Galleria Fotografica
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Carica fino a 3 foto per ogni area oppure generale con AI basandoti sui dati del progetto
                </p>
              </CardHeader>
              <CardContent className="space-y-8">
                {PHOTO_AREAS.map((area) => {
                  // Filtra per area e mostra solo se il servizio è attivo
                  if (area.key === "spa" && !selectedPlan?.has_spa) return null
                  if (area.key === "restaurant" && !selectedPlan?.has_restaurant) return null
                  if (area.key === "congress" && !selectedPlan?.has_congress) return null

                  const areaPhotos = photos.filter((p) => p.area === area.key)
                  const canAddMore = areaPhotos.length < 3
                  const AreaIcon = area.icon

                  return (
                    <div key={area.key} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                          <AreaIcon className="h-5 w-5 text-primary" />
                          {area.label}
                          <span className="text-sm font-normal text-muted-foreground">({areaPhotos.length}/3)</span>
                        </h3>
                        {canAddMore && (
                          <div className="flex gap-2">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) uploadPhoto(area.key, file)
                                }}
                                disabled={uploadingArea === area.key}
                              />
                              <Button variant="outline" size="sm" disabled={uploadingArea === area.key} asChild>
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  {uploadingArea === area.key ? "Caricamento..." : "Carica"}
                                </span>
                              </Button>
                            </label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generatePhoto(area.key)}
                              disabled={generatingArea === area.key}
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              {generatingArea === area.key ? "Generazione..." : "Genera con AI"}
                            </Button>
                          </div>
                        )}
                      </div>

                      {areaPhotos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {areaPhotos.map((photo) => (
                            <div key={photo.id} className="relative group">
                              <img
                                src={photo.image_url || "/placeholder.svg"} // Changed from photo_url to image_url
                                alt={`${area.label} ${photo.sort_order + 1}`}
                                className="w-full h-48 object-cover rounded-lg border"
                              />
                              {photo.is_ai_generated && (
                                <span className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded flex items-center gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  AI
                                </span>
                              )}
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                onClick={() => deletePhoto(photo.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Nessuna foto per questa area</p>
                          <p className="text-sm">Carica una foto o generala con AI</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shares" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Condivisioni</CardTitle>
                <CardDescription>Lista delle condivisioni attive per questo business plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      selectedPlan && loadShares(selectedPlan.id)
                    }}
                    variant="outline"
                    size="sm"
                    disabled={loadingShares}
                  >
                    {loadingShares ? "Caricamento..." : "Aggiorna Lista"}
                  </Button>

                  {shares.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">Nessuna condivisione attiva</p>
                  ) : (
                    <div className="space-y-2">
                      {shares.map((share) => (
                        <div key={share.id} className="border rounded-lg p-4 flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{share.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Condiviso il {new Date(share.created_at).toLocaleDateString("it-IT")}
                            </p>
                            {share.last_accessed_at && (
                              <p className="text-xs text-muted-foreground">
                                Ultimo accesso: {new Date(share.last_accessed_at).toLocaleDateString("it-IT")} (
                                {share.access_count || 0} visualizzazioni)
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resendShare(share.id, share.email)}
                              disabled={loadingShares}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Reinvia
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = `${process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"}/business-plan/${share.token}`
                                copyToClipboard(link, "Link")
                              }}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copia Link
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteShare(share.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADDED: Tab for Comments */}
          <TabsContent value="comments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Commenti</CardTitle>
                <CardDescription>Commenti e note aggiunte a questo business plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <Button
                    onClick={() => {
                      selectedPlan && loadComments(selectedPlan.id)
                    }}
                    variant="outline"
                    size="sm"
                    disabled={loadingComments}
                  >
                    {loadingComments ? "Caricamento..." : "Aggiorna Lista"}
                  </Button>
                  <Button onClick={() => openCommentDialog("general")}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Aggiungi Commento
                  </Button>
                </div>

                {comments.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">Nessun commento ancora</p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{comment.author_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{formatCommentAuthor(comment)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(comment.created_at).toLocaleString("it-IT")}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {/* Aggiungere logica di editing se necessario */}
                            <Button variant="ghost" size="icon" onClick={() => deleteComment(comment.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        <Badge variant="outline" className="mt-2">
                          Sezione: {comment.section}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dialog Condivisione */}
          <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Condividi Business Plan</DialogTitle>
              </DialogHeader>

              {shareStep === "form" ? (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="shareEmail">Email destinatario</Label>
                      <Input
                        id="shareEmail"
                        type="email"
                        placeholder="cliente@esempio.it"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password di accesso</Label>
                      <div className="flex gap-2">
                        <Input type="text" value={generatedPassword} readOnly className="font-mono" />
                        <Button variant="outline" size="icon" onClick={() => setGeneratedPassword(generatePassword())}>
                          <Sparkles className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Password generata automaticamente</p>
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
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                      <p className="font-medium text-green-900">Condivisione creata con successo!</p>
                      <p className="text-sm text-green-700">
                        L'email è stata inviata al destinatario con link e password di accesso.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Link di condivisione</Label>
                      <div className="flex gap-2">
                        <Input type="text" value={shareLink} readOnly className="font-mono text-sm" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(shareLink, "Link")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="flex gap-2">
                        <Input type="text" value={generatedPassword} readOnly className="font-mono text-lg font-bold" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(generatedPassword, "Password")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setShowShareDialog(false)}>Chiudi</Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* ADDED: Dialog for Comments */}
          <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Aggiungi Commento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commentAuthorName">Il tuo Nome</Label>
                    <Input
                      id="commentAuthorName"
                      value={commentAuthorName}
                      onChange={(e) => setCommentAuthorName(e.target.value)}
                      placeholder="Il tuo nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commentAuthorEmail">La tua Email (Opzionale)</Label>
                    <Input
                      id="commentAuthorEmail"
                      type="email"
                      value={commentAuthorEmail}
                      onChange={(e) => setCommentAuthorEmail(e.target.value)}
                      placeholder="tua@email.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sezione di riferimento</Label>
                  <select
                    value={commentSection}
                    onChange={(e) => setCommentSection(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">Seleziona una sezione</option>
                    <option value="overview">Generale</option>
                    <option value="financials">Parametri</option>
                    <option value="projections">Proiezioni</option>
                    <option value="content">Contenuto</option>
                    <option value="shares">Condivisioni</option>
                    <option value="comments">Commenti</option>
                    <option value="general">Generale (senza tab)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commentContent">Commento</Label>
                  <Textarea
                    id="commentContent"
                    rows={5}
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Scrivi qui il tuo commento..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
                  Annulla
                </Button>
                <Button onClick={addComment}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Salva Commento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
