"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Bike,
  Building2,
  Calendar,
  Settings,
  Plus,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  Battery,
  BatteryLow,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  TrendingUp,
  Euro,
  AlertTriangle,
  Search,
  RefreshCw,
  FileText,
  Zap,
  Timer,
  ExternalLink,
  Trash2,
  Tag,
  Wifi,
  CreditCard,
  UserPlus,
} from "lucide-react"

interface Vehicle {
  id: string
  internal_code: string
  brand: string
  model: string
  color: string
  status: string
  battery_level: number | null
  battery_status: "available" | "low_battery" | "charging" | "unavailable"
  estimated_range_km: number | null
  estimated_available_time: string | null
  charge_start_time: string | null
  full_charge_hours: number
  total_rentals: number
  vehicle_type: VehicleType
}

interface Structure {
  id: string
  name: string
  slug: string
  description: string
  city: string
  province: string
  email: string
  phone: string
  is_active: boolean
  primary_color: string
  min_battery_threshold: number
  default_charge_hours: number
}

interface VehicleType {
  id: string
  name: string
  slug: string
  category: string
  requires_license_type: string
  range_km: number
  // Added fields from updates
  description?: string
  icon?: string
  max_speed_kmh?: number
  avg_range_km?: number
}

interface Booking {
  id: string
  booking_code: string
  pickup_date: string
  pickup_time: string
  status: string
  estimated_amount: number
  final_amount: number
  battery_level_pickup: number | null
  battery_level_return: number | null
  created_at: string
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
    documents_status: string
  }
  vehicle: {
    internal_code: string
    vehicle_type: { name: string }
  }
}

interface Pricing {
  id: string
  name: string
  min_price: number
  price_first_hour: number
  max_price_day: number
  deposit_amount: number
  is_active: boolean
  vehicle_type: VehicleType
}

// Changed props from the update
// Leads Table Component
function LeadsTable() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    try {
      const res = await fetch("/api/ecomobility/admin/leads")
      const data = await res.json()
      setLeads(data || [])
    } catch (error) {
      console.error("Error loading leads:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch("/api/ecomobility/admin/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      loadLeads()
      toast({ title: "Stato aggiornato" })
    } catch (error) {
      toast({ title: "Errore", variant: "destructive" })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      new: { label: "Nuovo", className: "bg-blue-100 text-blue-800" },
      contacted: { label: "Contattato", className: "bg-yellow-100 text-yellow-800" },
      demo_scheduled: { label: "Demo fissata", className: "bg-purple-100 text-purple-800" },
      negotiating: { label: "In trattativa", className: "bg-orange-100 text-orange-800" },
      won: { label: "Acquisito", className: "bg-green-100 text-green-800" },
      lost: { label: "Perso", className: "bg-gray-100 text-gray-800" },
    }
    const s = statusMap[status] || { label: status, className: "bg-gray-100" }
    return <Badge className={s.className}>{s.label}</Badge>
  }

  if (loading) {
    return <div className="text-center py-8">Caricamento leads...</div>
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">Nessun lead ancora</p>
        <p className="text-sm">Le richieste di demo appariranno qui.</p>
        <p className="text-xs mt-4">
          Condividi il link: <code className="bg-muted px-2 py-1 rounded">4bid.it/ecomobility/registra-struttura</code>
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Struttura</TableHead>
          <TableHead>Contatto</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Piano</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead>Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell className="text-sm">
              {new Date(lead.created_at).toLocaleDateString("it-IT")}
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{lead.structure_name}</p>
                <p className="text-xs text-muted-foreground">{lead.city}, {lead.province}</p>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p className="text-sm">{lead.contact_name}</p>
                <p className="text-xs text-muted-foreground">{lead.email}</p>
                <p className="text-xs text-muted-foreground">{lead.phone}</p>
              </div>
            </TableCell>
            <TableCell className="text-sm">{lead.structure_type}</TableCell>
            <TableCell className="text-sm capitalize">{lead.interested_plan}</TableCell>
            <TableCell>{getStatusBadge(lead.status)}</TableCell>
            <TableCell>
              <Select value={lead.status} onValueChange={(value) => updateStatus(lead.id, value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nuovo</SelectItem>
                  <SelectItem value="contacted">Contattato</SelectItem>
                  <SelectItem value="demo_scheduled">Demo fissata</SelectItem>
                  <SelectItem value="negotiating">In trattativa</SelectItem>
                  <SelectItem value="won">Acquisito</SelectItem>
                  <SelectItem value="lost">Perso</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function EcomobilityAdminDashboard({ structures }: { structures: Structure[] }) {
  const { toast } = useToast()
  // Modified initial state for selectedStructure based on update
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(
    structures.length > 0 ? structures[0] : null,
  )
  const [activeTab, setActiveTab] = useState("overview")
  // Changed isLoading to loading based on update
  const [loading, setLoading] = useState(true)

  // Data states
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  // Added vehicleTypes state from update
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [pricing, setPricing] = useState<Pricing[]>([])
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeRentals: 0,
    totalRevenue: 0,
    availableVehicles: 0,
    chargingVehicles: 0,
    lowBatteryVehicles: 0,
  })

  // Dialog states
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false)
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false)
  const [batteryDialogOpen, setBatteryDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null)
  const [selectedVehicleForBattery, setSelectedVehicleForBattery] = useState<Vehicle | null>(null)
  const [newBatteryLevel, setNewBatteryLevel] = useState<number>(100)
  // Added dialog states from update
  const [showVehicleDialog, setShowVehicleDialog] = useState(false)
  const [showVehicleTypeDialog, setShowVehicleTypeDialog] = useState(false)
  const [editingVehicleType, setEditingVehicleType] = useState<VehicleType | null>(null)

  // Form states
  const [vehicleForm, setVehicleForm] = useState({
    code: "",
    name: "",
    vehicle_type_id: "",
    description: "",
    image_url: "",
    battery_level: 100,
    status: "available",
  })

  const [pricingForm, setPricingForm] = useState({
    name: "",
    vehicle_type_id: "",
    min_price: 10,
    price_first_hour: 15,
    price_second_hour: 12,
    price_third_hour: 10,
    price_per_hour_after: 8,
    max_price_day: 45,
    deposit_amount: 100,
  })

  // Search/filter
  // Changed bookingFilter based on update
  const [bookingFilter, setBookingFilter] = useState("all")
  // Changed searchQuery to searchTerm based on update
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (selectedStructure) {
      loadData()
      // Added loadVehicleTypes call from update
      loadVehicleTypes()
    }
  }, [selectedStructure])

  // Updated loadData function based on update
  const loadData = async () => {
    if (!selectedStructure) return
    setLoading(true)

    try {
      const [vehiclesRes, bookingsRes, pricingRes, vehicleTypesRes] = await Promise.all([
        fetch(`/api/ecomobility/admin/vehicles?structure_id=${selectedStructure.id}`),
        fetch(`/api/ecomobility/admin/bookings?structure_id=${selectedStructure.id}`),
        fetch(`/api/ecomobility/admin/pricing?structure_id=${selectedStructure.id}`),
        fetch(`/api/ecomobility/admin/vehicle-types?structure_id=${selectedStructure.id}`),
      ])

      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json())
      if (bookingsRes.ok) setBookings(await bookingsRes.json())
      if (pricingRes.ok) setPricing(await pricingRes.json())
      if (vehicleTypesRes.ok) setVehicleTypes(await vehicleTypesRes.json())
    } catch (error) {
      console.error("Error loading data:", error)
      toast({ title: "Errore", description: "Errore nel caricamento dei dati", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Added loadVehicleTypes function based on update
  const loadVehicleTypes = async () => {
    if (!selectedStructure) return

    try {
      const res = await fetch(`/api/ecomobility/admin/vehicle-types?structure_id=${selectedStructure.id}`)
      if (res.ok) {
        const data = await res.json()
        setVehicleTypes(data)
      }
    } catch (error) {
      console.error("Error loading vehicle types:", error)
    }
  }

  const getBatteryIcon = (level: number | null, status: string) => {
    if (status === "charging") return <BatteryCharging className="h-4 w-4 text-yellow-500" />
    if (level === null || status === "unavailable") return <Battery className="h-4 w-4 text-gray-400" />
    if (level < 25) return <BatteryLow className="h-4 w-4 text-red-500" />
    if (level < 50) return <BatteryMedium className="h-4 w-4 text-yellow-500" />
    if (level < 75) return <BatteryMedium className="h-4 w-4 text-green-500" />
    return <BatteryFull className="h-4 w-4 text-green-500" />
  }

  const getChargingTimeRemaining = (vehicle: Vehicle) => {
    if (!vehicle.estimated_available_time) return null
    const availableTime = new Date(vehicle.estimated_available_time)
    const now = new Date()
    const diffMs = availableTime.getTime() - now.getTime()
    if (diffMs <= 0) return "Pronto"
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }

  const handleUpdateBatteryLevel = async () => {
    if (!selectedVehicleForBattery) return

    try {
      const response = await fetch("/api/ecomobility/admin/vehicles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedVehicleForBattery.id,
          battery_level: newBatteryLevel,
          battery_update_type: "manual_update",
        }),
      })

      if (!response.ok) throw new Error("Errore aggiornamento")

      toast({ title: "Livello batteria aggiornato" })
      setBatteryDialogOpen(false)
      setSelectedVehicleForBattery(null)
      loadData()
    } catch (error) {
      toast({ title: "Errore aggiornamento batteria", variant: "destructive" })
    }
  }

  const handleSetCharging = async (vehicleId: string) => {
    try {
      const response = await fetch("/api/ecomobility/admin/vehicles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: vehicleId,
          status: "charging",
          battery_status: "charging",
        }),
      })

      if (!response.ok) throw new Error("Errore aggiornamento")

      toast({ title: "Veicolo messo in ricarica" })
      loadData()
    } catch (error) {
      toast({ title: "Errore", variant: "destructive" })
    }
  }

  const handleSetCharged = async (vehicleId: string, batteryLevel = 100) => {
    try {
      const response = await fetch("/api/ecomobility/admin/vehicles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: vehicleId,
          status: "available",
          battery_level: batteryLevel,
          battery_status: "available",
          battery_update_type: "charge_end",
        }),
      })

      if (!response.ok) throw new Error("Errore aggiornamento")

      toast({ title: "Veicolo pronto e disponibile" })
      loadData()
    } catch (error) {
      toast({ title: "Errore", variant: "destructive" })
    }
  }

const handleSaveVehicle = async () => {
  if (!vehicleForm.code || !vehicleForm.name || !vehicleForm.vehicle_type_id) {
    toast({ title: "Errore", description: "Compila i campi obbligatori: Codice, Nome e Tipo veicolo", variant: "destructive" })
    return
  }

    try {
      const method = editingVehicle ? "PUT" : "POST"
      const body = editingVehicle
        ? { id: editingVehicle.id, ...vehicleForm }
        : { ...vehicleForm, structure_id: selectedStructure?.id }

      const res = await fetch("/api/ecomobility/admin/vehicles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Errore nel salvataggio")
      }

      toast({ title: "Successo", description: editingVehicle ? "Veicolo aggiornato" : "Veicolo aggiunto" })
      setVehicleDialogOpen(false)
      setVehicleForm({
        code: "",
        name: "",
        vehicle_type_id: "",
        description: "",
        image_url: "",
        battery_level: 100,
        status: "available",
      })
      loadData()
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" })
    }
  }

  const handleSavePricing = async () => {
    if (!selectedStructure) return

    try {
      const response = await fetch("/api/ecomobility/admin/pricing", {
        method: editingPricing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pricingForm,
          id: editingPricing?.id,
          structure_id: selectedStructure.id,
        }),
      })

      if (!response.ok) throw new Error("Errore salvataggio")

      toast({ title: editingPricing ? "Tariffa aggiornata" : "Tariffa aggiunta" })
      setPricingDialogOpen(false)
      setEditingPricing(null)
      setPricingForm({
        name: "",
        vehicle_type_id: "",
        min_price: 10,
        price_first_hour: 15,
        price_second_hour: 12,
        price_third_hour: 10,
        price_per_hour_after: 8,
        max_price_day: 45,
        deposit_amount: 100,
      })
      loadData()
    } catch (error) {
      toast({ title: "Errore salvataggio tariffa", variant: "destructive" })
    }
  }

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/ecomobility/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, status: newStatus }),
      })

      if (!response.ok) throw new Error("Errore aggiornamento")

      toast({ title: "Stato aggiornato" })
      loadData()
    } catch (error) {
      toast({ title: "Errore aggiornamento stato", variant: "destructive" })
    }
  }

  const handleUpdateVehicleStatus = async (vehicleId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/ecomobility/admin/vehicles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vehicleId, status: newStatus }),
      })

      if (!response.ok) throw new Error("Errore aggiornamento")

      toast({ title: "Stato veicolo aggiornato" })
      loadData()
    } catch (error) {
      toast({ title: "Errore aggiornamento stato", variant: "destructive" })
    }
  }

  // Added CRUD functions for vehicle types from update
  const saveVehicleType = async () => {
    if (!selectedStructure || !editingVehicleType) return

    try {
      const method = editingVehicleType.id ? "PUT" : "POST"
      const res = await fetch("/api/ecomobility/admin/vehicle-types", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingVehicleType,
          structure_id: selectedStructure.id,
        }),
      })

      if (res.ok) {
        toast({
          title: "Successo",
          description: editingVehicleType.id ? "Tipo veicolo aggiornato" : "Tipo veicolo creato",
        })
        setShowVehicleTypeDialog(false)
        setEditingVehicleType(null)
        loadData()
      } else {
        const error = await res.json()
        toast({ title: "Errore", description: error.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Errore", description: "Errore nel salvataggio", variant: "destructive" })
    }
  }

  const deleteVehicleType = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo tipo di veicolo?")) return

    try {
      const res = await fetch(`/api/ecomobility/admin/vehicle-types?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Successo", description: "Tipo veicolo eliminato" })
        loadData()
      } else {
        const error = await res.json()
        toast({ title: "Errore", description: error.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Errore", description: "Errore nell'eliminazione", variant: "destructive" })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      pending: { label: "In attesa", variant: "secondary" },
      confirmed: { label: "Confermato", variant: "default" },
      ready: { label: "Pronto ritiro", variant: "default" },
      picked_up: { label: "In corso", variant: "default" },
      returned: { label: "Riconsegnato", variant: "outline" },
      completed: { label: "Completato", variant: "outline" },
      cancelled: { label: "Annullato", variant: "destructive" },
      available: { label: "Disponibile", variant: "default" },
      rented: { label: "Noleggiato", variant: "secondary" },
      maintenance: { label: "Manutenzione", variant: "destructive" },
      charging: { label: "In carica", variant: "secondary" },
    }
    const config = statusConfig[status] || { label: status, variant: "outline" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getBatteryStatusBadge = (vehicle: Vehicle) => {
    const level = vehicle.battery_level
    const status = vehicle.battery_status
    const minThreshold = selectedStructure?.min_battery_threshold || 40

    if (status === "charging") {
      const timeRemaining = getChargingTimeRemaining(vehicle)
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
          <BatteryCharging className="h-3 w-3 mr-1" />
          In carica {timeRemaining && `(${timeRemaining})`}
        </Badge>
      )
    }

    if (status === "low_battery" || (level !== null && level < minThreshold)) {
      return (
        <Badge variant="destructive">
          <BatteryLow className="h-3 w-3 mr-1" />
          {level}% - Scarico
        </Badge>
      )
    }

    if (status === "unavailable" || level === null) {
      return (
        <Badge variant="outline">
          <Battery className="h-3 w-3 mr-1" />
          N/D
        </Badge>
      )
    }

    return (
      <Badge variant="default" className="bg-green-100 text-green-700">
        {getBatteryIcon(level, status)}
        <span className="ml-1">{level}%</span>
      </Badge>
    )
  }

  // Modified filter function based on update
  const filteredBookings = bookings.filter((booking) => {
    if (bookingFilter !== "all" && booking.status !== bookingFilter) return false
    if (searchTerm) {
      const query = searchTerm.toLowerCase()
      return (
        booking.booking_code.toLowerCase().includes(query) ||
        booking.customer?.first_name?.toLowerCase().includes(query) ||
        booking.customer?.last_name?.toLowerCase().includes(query) ||
        booking.customer?.email?.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bike className="h-6 w-6 text-orange-500" />
              <h1 className="text-xl font-bold">Ecomobility Admin</h1>
            </div>

            {structures.length > 1 && (
              <Select
                value={selectedStructure?.id}
                onValueChange={(id) => setSelectedStructure(structures.find((s) => s.id === id) || null)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Seleziona struttura" />
                </SelectTrigger>
                <SelectContent>
                  {structures.map((structure) => (
                    <SelectItem key={structure.id} value={structure.id}>
                      {structure.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Aggiorna
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/admin">Torna a 4BID Admin</a>
            </Button>
          </div>
        </div>
      </header>

      {selectedStructure ? (
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-8 w-full max-w-5xl mb-6">
              <TabsTrigger value="overview">
                <TrendingUp className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="bookings">
                <Calendar className="h-4 w-4 mr-2" />
                Prenotazioni
              </TabsTrigger>
              <TabsTrigger value="vehicles">
                <Bike className="h-4 w-4 mr-2" />
                Flotta
              </TabsTrigger>
              {/* Added TabsTrigger for vehicle types based on update */}
              <TabsTrigger value="vehicle-types">
                <Tag className="h-4 w-4 mr-2" />
                Tipi Veicolo
              </TabsTrigger>
              <TabsTrigger value="pricing">
                <Euro className="h-4 w-4 mr-2" />
                Tariffe
              </TabsTrigger>
<TabsTrigger value="devices">
  <Wifi className="h-4 w-4 mr-2" />
  Dispositivi
  </TabsTrigger>
  <TabsTrigger value="billing">
  <CreditCard className="h-4 w-4 mr-2" />
  Fatturazione
  </TabsTrigger>
  <TabsTrigger value="leads">
  <UserPlus className="h-4 w-4 mr-2" />
  Leads
  </TabsTrigger>
  <TabsTrigger value="settings">
  <Settings className="h-4 w-4 mr-2" />
  Impostazioni
  </TabsTrigger>
  </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards - includes battery stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Prenotazioni</p>
                        <p className="text-2xl font-bold">{stats.totalBookings}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-orange-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Noleggi attivi</p>
                        <p className="text-2xl font-bold">{stats.activeRentals}</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Ricavi</p>
                        <p className="text-2xl font-bold">€{stats.totalRevenue.toFixed(0)}</p>
                      </div>
                      <Euro className="h-8 w-8 text-green-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-700">Disponibili</p>
                        <p className="text-2xl font-bold text-green-700">{stats.availableVehicles}</p>
                      </div>
                      <BatteryFull className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-yellow-700">In carica</p>
                        <p className="text-2xl font-bold text-yellow-700">{stats.chargingVehicles}</p>
                      </div>
                      <BatteryCharging className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-red-700">Batteria bassa</p>
                        <p className="text-2xl font-bold text-red-700">{stats.lowBatteryVehicles}</p>
                      </div>
                      <BatteryLow className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fleet Status with Battery Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Battery className="h-5 w-5" />
                    Stato flotta e batterie
                  </CardTitle>
                  <CardDescription>
                    Soglia minima batteria: {selectedStructure.min_battery_threshold || 40}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {vehicles.map((vehicle) => {
                      const minThreshold = selectedStructure.min_battery_threshold || 40
                      const isBookable =
                        vehicle.status === "available" &&
                        vehicle.battery_status === "available" &&
                        vehicle.battery_level !== null &&
                        vehicle.battery_level >= minThreshold

                      return (
                        <div
                          key={vehicle.id}
                          className={`p-4 rounded-lg border transition-colors ${
                            isBookable
                              ? "border-green-200 bg-green-50"
                              : vehicle.battery_status === "charging"
                                ? "border-yellow-200 bg-yellow-50"
                                : vehicle.status === "rented"
                                  ? "border-blue-200 bg-blue-50"
                                  : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm font-medium">{vehicle.internal_code}</span>
                            {getBatteryStatusBadge(vehicle)}
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">{vehicle.vehicle_type?.name}</p>

                          {/* Battery level bar */}
                          {vehicle.battery_level !== null && (
                            <div className="mb-2">
                              <Progress
                                value={vehicle.battery_level}
                                className={`h-2 ${
                                  vehicle.battery_level < 25
                                    ? "[&>div]:bg-red-500"
                                    : vehicle.battery_level < 50
                                      ? "[&>div]:bg-yellow-500"
                                      : "[&>div]:bg-green-500"
                                }`}
                              />
                            </div>
                          )}

                          {/* Estimated range */}
                          {vehicle.estimated_range_km && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                              <Zap className="h-3 w-3" />~{vehicle.estimated_range_km} km autonomia
                            </p>
                          )}

                          {/* Charging time remaining */}
                          {vehicle.battery_status === "charging" && (
                            <p className="text-xs text-yellow-700 flex items-center gap-1 mb-2">
                              <Timer className="h-3 w-3" />
                              {getChargingTimeRemaining(vehicle) || "Tempo stimato N/D"}
                            </p>
                          )}

                          {/* Quick actions */}
                          <div className="flex gap-1 mt-2">
                            {vehicle.battery_status === "charging" && (
                              <Button size="sm" variant="outline" onClick={() => handleSetCharged(vehicle.id, 100)}>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Carico
                              </Button>
                            )}
                            {vehicle.battery_status === "low_battery" && (
                              <Button size="sm" variant="outline" onClick={() => handleSetCharging(vehicle.id)}>
                                <BatteryCharging className="h-3 w-3 mr-1" />
                                Ricarica
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedVehicleForBattery(vehicle)
                                setNewBatteryLevel(vehicle.battery_level || 50)
                                setBatteryDialogOpen(true)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle>Prenotazioni recenti</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codice</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Veicolo</TableHead>
                        <TableHead>Data ritiro</TableHead>
                        <TableHead>Batteria</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Importo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.slice(0, 5).map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono text-sm">{booking.booking_code}</TableCell>
                          <TableCell>
                            {booking.customer?.first_name} {booking.customer?.last_name}
                          </TableCell>
                          <TableCell>{booking.vehicle?.vehicle_type?.name}</TableCell>
                          <TableCell>{booking.pickup_date}</TableCell>
                          <TableCell>
                            {booking.battery_level_pickup !== null && (
                              <span className="text-xs">
                                {booking.battery_level_pickup}%
                                {booking.battery_level_return !== null && ` → ${booking.battery_level_return}%`}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>€{booking.final_amount || booking.estimated_amount || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca prenotazione..."
                      value={searchTerm} // Changed from searchQuery
                      onChange={(e) => setSearchTerm(e.target.value)} // Changed from setSearchQuery
                      className="pl-9 w-[300px]"
                    />
                  </div>
                  <Select value={bookingFilter} onValueChange={setBookingFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtra per stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli stati</SelectItem>
                      <SelectItem value="pending">In attesa</SelectItem>
                      <SelectItem value="confirmed">Confermati</SelectItem>
                      <SelectItem value="picked_up">In corso</SelectItem>
                      <SelectItem value="returned">Riconsegnati</SelectItem>
                      <SelectItem value="completed">Completati</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" asChild>
                  <a href="/admin/ecomobility/documents">
                    <FileText className="h-4 w-4 mr-2" />
                    Verifica documenti
                  </a>
                </Button>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codice</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contatto</TableHead>
                      <TableHead>Veicolo</TableHead>
                      <TableHead>Data ritiro</TableHead>
                      <TableHead>Documenti</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Importo</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-sm">{booking.booking_code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {booking.customer?.first_name} {booking.customer?.last_name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{booking.customer?.email}</p>
                            <p className="text-muted-foreground">{booking.customer?.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{booking.vehicle?.vehicle_type?.name}</p>
                            <p className="text-sm text-muted-foreground">{booking.vehicle?.internal_code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{booking.pickup_date}</p>
                            <p className="text-sm text-muted-foreground">{booking.pickup_time}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.customer?.documents_status === "verified" ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verificati
                            </Badge>
                          ) : booking.customer?.documents_status === "submitted" ? (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              Da verificare
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Mancanti
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>€{booking.final_amount || booking.estimated_amount || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {booking.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateBookingStatus(booking.id, "picked_up")}
                              >
                                Ritiro
                              </Button>
                            )}
                            {booking.status === "returned" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateBookingStatus(booking.id, "completed")}
                              >
                                Completa
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="vehicles" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Gestione Flotta</h2>
                <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingVehicle(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi veicolo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingVehicle ? "Modifica veicolo" : "Nuovo veicolo"}</DialogTitle>
                      <DialogDescription>Inserisci i dati del veicolo</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Codice interno *</Label>
                          <Input
                            value={vehicleForm.code}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, code: e.target.value })}
                            placeholder="es. EBIKE-001"
                          />
                        </div>
                        <div>
                          <Label>Tipo veicolo *</Label>
                          <Select
                            value={vehicleForm.vehicle_type_id}
                            onValueChange={(v) => setVehicleForm({ ...vehicleForm, vehicle_type_id: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicleTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Nome veicolo *</Label>
                        <Input
                          value={vehicleForm.name}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                          placeholder="es. E-Bike City Blu"
                        />
                      </div>
                      <div>
                        <Label>Descrizione</Label>
                        <Input
                          value={vehicleForm.description}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, description: e.target.value })}
                          placeholder="Descrizione opzionale"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Livello batteria (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={vehicleForm.battery_level}
                            onChange={(e) =>
                              setVehicleForm({ ...vehicleForm, battery_level: Number.parseInt(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div>
                          <Label>Stato</Label>
                          <Select
                            value={vehicleForm.status}
                            onValueChange={(v) => setVehicleForm({ ...vehicleForm, status: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Disponibile</SelectItem>
                              <SelectItem value="charging">In carica</SelectItem>
                              <SelectItem value="maintenance">Manutenzione</SelectItem>
                              <SelectItem value="unavailable">Non disponibile</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setVehicleDialogOpen(false)}>
                          Annulla
                        </Button>
                        <Button onClick={handleSaveVehicle}>
                          {editingVehicle ? "Salva modifiche" : "Aggiungi veicolo"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map((vehicle) => (
                  <Card key={vehicle.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono font-bold">{vehicle.internal_code}</p>
                          <p className="text-sm text-muted-foreground">{vehicle.vehicle_type?.name}</p>
                        </div>
                        {getStatusBadge(vehicle.status)}
                      </div>
                      <div className="space-y-1 text-sm mb-3">
                        <p>
                          <span className="text-muted-foreground">Marca:</span> {vehicle.brand || "-"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Modello:</span> {vehicle.model || "-"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Colore:</span> {vehicle.color || "-"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Noleggi:</span> {vehicle.total_rentals || 0}
                        </p>
                      </div>
                      {vehicle.battery_level !== null && (
                        <div className="flex items-center gap-2 mb-3">
                          <Battery className="h-4 w-4" />
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                vehicle.battery_level > 50
                                  ? "bg-green-500"
                                  : vehicle.battery_level > 20
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${vehicle.battery_level}%` }}
                            />
                          </div>
                          <span className="text-xs">{vehicle.battery_level}%</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Select value={vehicle.status} onValueChange={(v) => handleUpdateVehicleStatus(vehicle.id, v)}>
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Disponibile</SelectItem>
                            <SelectItem value="maintenance">Manutenzione</SelectItem>
                            <SelectItem value="charging">In carica</SelectItem>
                            <SelectItem value="damaged">Danneggiato</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            setEditingVehicle(vehicle)
                            setVehicleForm({
                              code: vehicle.internal_code,
                              name: `${vehicle.brand} ${vehicle.model}`,
                              vehicle_type_id: vehicle.vehicle_type?.id || "",
                              description: "", // Assuming description might be new field
                              image_url: "", // Assuming image_url might be new field
                              battery_level: vehicle.battery_level || 100,
                              status: vehicle.status,
                            })
                            setVehicleDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Added TabsContent for vehicle types management based on update */}
            <TabsContent value="vehicle-types" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Tipi di Veicolo</CardTitle>
                    <CardDescription>Gestisci le categorie di veicoli disponibili</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingVehicleType({
                        id: "",
                        name: "",
                        slug: "",
                        category: "",
                        requires_license_type: "",
                        range_km: 50,
                        description: "",
                        icon: "bike",
                        max_speed_kmh: 25,
                        avg_range_km: 50,
                      } as any)
                      setShowVehicleTypeDialog(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Tipo
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrizione</TableHead>
                        <TableHead>Velocità Max</TableHead>
                        <TableHead>Autonomia Media</TableHead>
                        <TableHead>Veicoli</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicleTypes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nessun tipo di veicolo configurato
                          </TableCell>
                        </TableRow>
                      ) : (
                        vehicleTypes.map((vt: any) => {
                          const vehicleCount = vehicles.filter((v) => v.vehicle_type?.id === vt.id).length
                          return (
                            <TableRow key={vt.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Bike className="h-4 w-4 text-muted-foreground" />
                                  {vt.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{vt.description || "-"}</TableCell>
                              <TableCell>{vt.max_speed_kmh} km/h</TableCell>
                              <TableCell>{vt.avg_range_km} km</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{vehicleCount} veicoli</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingVehicleType(vt)
                                      setShowVehicleTypeDialog(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteVehicleType(vt.id)}
                                    disabled={vehicleCount > 0}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Gestione Tariffe</h2>
                <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingPricing(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuova tariffa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{editingPricing ? "Modifica tariffa" : "Nuova tariffa"}</DialogTitle>
                      <DialogDescription>
                        Configura il pricing decrescente: più il cliente usa, meno paga all'ora.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nome tariffa *</Label>
                          <Input
                            value={pricingForm.name}
                            onChange={(e) => setPricingForm({ ...pricingForm, name: e.target.value })}
                            placeholder="es. Tariffa Standard"
                          />
                        </div>
                        <div>
                          <Label>Tipo veicolo *</Label>
                          <Select
                            value={pricingForm.vehicle_type_id}
                            onValueChange={(v) => setPricingForm({ ...pricingForm, vehicle_type_id: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicleTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 space-y-3">
                        <p className="font-medium text-sm">Pricing decrescente</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">1ª ora (€)</Label>
                            <Input
                              type="number"
                              value={pricingForm.price_first_hour}
                              onChange={(e) =>
                                setPricingForm({ ...pricingForm, price_first_hour: Number(e.target.value) })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">2ª ora (€)</Label>
                            <Input
                              type="number"
                              value={pricingForm.price_second_hour}
                              onChange={(e) =>
                                setPricingForm({ ...pricingForm, price_second_hour: Number(e.target.value) })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">3ª ora (€)</Label>
                            <Input
                              type="number"
                              value={pricingForm.price_third_hour}
                              onChange={(e) =>
                                setPricingForm({ ...pricingForm, price_third_hour: Number(e.target.value) })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Ore successive (€)</Label>
                            <Input
                              type="number"
                              value={pricingForm.price_per_hour_after}
                              onChange={(e) =>
                                setPricingForm({ ...pricingForm, price_per_hour_after: Number(e.target.value) })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs">Minimo (€)</Label>
                          <Input
                            type="number"
                            value={pricingForm.min_price}
                            onChange={(e) => setPricingForm({ ...pricingForm, min_price: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max giorno (€)</Label>
                          <Input
                            type="number"
                            value={pricingForm.max_price_day}
                            onChange={(e) => setPricingForm({ ...pricingForm, max_price_day: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Cauzione (€)</Label>
                          <Input
                            type="number"
                            value={pricingForm.deposit_amount}
                            onChange={(e) => setPricingForm({ ...pricingForm, deposit_amount: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      <Button onClick={handleSavePricing} className="w-full">
                        {editingPricing ? "Salva modifiche" : "Crea tariffa"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pricing.map((p) => (
                  <Card key={p.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{p.name}</CardTitle>
                          <CardDescription>{p.vehicle_type?.name}</CardDescription>
                        </div>
                        <Badge variant={p.is_active ? "default" : "secondary"}>
                          {p.is_active ? "Attiva" : "Inattiva"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">1ª ora</span>
                          <span className="font-medium">€{p.price_first_hour}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Max giorno</span>
                          <span className="font-medium">€{p.max_price_day}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cauzione</span>
                          <span>€{p.deposit_amount}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => {
                            setEditingPricing(p)
                            setPricingForm({
                              name: p.name,
                              vehicle_type_id: p.vehicle_type?.id || "",
                              min_price: p.min_price,
                              price_first_hour: p.price_first_hour,
                              price_second_hour: 0,
                              price_third_hour: 0,
                              price_per_hour_after: 0,
                              max_price_day: p.max_price_day,
                              deposit_amount: p.deposit_amount,
                            })
                            setPricingDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifica
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

{/* Devices Tab */}
  <TabsContent value="devices" className="space-y-6">
  <Card>
  <CardHeader>
  <div className="flex items-center justify-between">
  <div>
  <CardTitle>Dispositivi Hardware</CardTitle>
  <CardDescription>Gestisci GPS tracker e lucchetti smart associati ai veicoli</CardDescription>
  </div>
  <Button onClick={() => toast({ title: "Coming soon", description: "Funzionalità in sviluppo" })}>
  <Plus className="h-4 w-4 mr-2" />
  Aggiungi dispositivo
  </Button>
  </div>
  </CardHeader>
  <CardContent>
  <div className="text-center py-12 text-muted-foreground">
  <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
  <p className="text-lg font-medium mb-2">Nessun dispositivo configurato</p>
  <p className="text-sm">Aggiungi GPS tracker e lucchetti smart per monitorare i tuoi veicoli.</p>
  <p className="text-xs mt-4 text-orange-600">Contatta 4BID per acquistare i dispositivi hardware.</p>
  </div>
  </CardContent>
  </Card>
  </TabsContent>
  
  {/* Billing Tab */}
  <TabsContent value="billing" className="space-y-6">
  {/* Admin 4BID Banner */}
  <Card className="bg-orange-50 border-orange-200">
  <CardContent className="p-4">
  <div className="flex items-center justify-between">
  <div>
  <p className="font-medium">Pannello Amministrativo 4BID</p>
  <p className="text-sm text-muted-foreground">Gestisci piani, abbonamenti e fatture di tutte le strutture</p>
  </div>
  <Link href="/admin/ecomobility/billing">
  <Button className="bg-orange-500 hover:bg-orange-600">
  <CreditCard className="h-4 w-4 mr-2" />
  Gestione Fatturazione
  </Button>
  </Link>
  </div>
  </CardContent>
  </Card>
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card>
  <CardContent className="p-4">
  <div className="flex items-center justify-between">
  <div>
  <p className="text-xs text-muted-foreground">Piano attuale</p>
  <p className="text-xl font-bold">Starter</p>
  </div>
  <CreditCard className="h-8 w-8 text-orange-500 opacity-50" />
  </div>
  </CardContent>
  </Card>
  <Card>
  <CardContent className="p-4">
  <div className="flex items-center justify-between">
  <div>
  <p className="text-xs text-muted-foreground">Canone mensile</p>
  <p className="text-xl font-bold">€49,00</p>
  </div>
  <Euro className="h-8 w-8 text-green-500 opacity-50" />
  </div>
  </CardContent>
  </Card>
  <Card>
  <CardContent className="p-4">
  <div className="flex items-center justify-between">
  <div>
  <p className="text-xs text-muted-foreground">Prossima fattura</p>
  <p className="text-xl font-bold">01/02/2026</p>
  </div>
  <FileText className="h-8 w-8 text-blue-500 opacity-50" />
  </div>
  </CardContent>
  </Card>
  </div>
  
  <Card>
  <CardHeader>
  <CardTitle>Piani disponibili</CardTitle>
  <CardDescription>Scegli il piano più adatto alle tue esigenze</CardDescription>
  </CardHeader>
  <CardContent>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="border rounded-lg p-6 bg-orange-50 border-orange-200">
  <h3 className="font-bold text-lg mb-2">Starter</h3>
  <p className="text-3xl font-bold mb-1">€49<span className="text-sm font-normal">/mese</span></p>
  <p className="text-sm text-muted-foreground mb-4">Fino a 5 veicoli</p>
  <ul className="space-y-2 text-sm mb-6">
  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Dashboard completa</li>
  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Prenotazioni online</li>
  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Report base</li>
  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> €5/mese per dispositivo</li>
  </ul>
  <Badge>Piano attuale</Badge>
  </div>
  <div className="border rounded-lg p-6">
  <h3 className="font-bold text-lg mb-2">Professional</h3>
  <p className="text-3xl font-bold mb-1">€99<span className="text-sm font-normal">/mese</span></p>
  <p className="text-sm text-muted-foreground mb-4">Fino a 15 veicoli</p>
  <ul className="space-y-2 text-sm mb-6">
  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Tutto Starter +</li>
  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Report avanzati</li>
  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Multi-operatore</li>
  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> €4/mese per dispositivo</li>
  </ul>
  <Button variant="outline" className="w-full bg-transparent">Upgrade</Button>
  </div>
  <div className="border rounded-lg p-6">
  <h3 className="font-bold text-lg mb-2">Enterprise</h3>
  <p className="text-3xl font-bold mb-1">€199<span className="text-sm font-normal">/mese</span></p>
  <p className="text-sm text-muted-foreground mb-4">Veicoli illimitati</p>
  <ul className="space-y-2 text-sm mb-6">
  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Tutto Professional +</li>
  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> White label</li>
  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Supporto prioritario</li>
  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> €3/mese per dispositivo</li>
  </ul>
  <Button variant="outline" className="w-full bg-transparent">Contattaci</Button>
  </div>
  </div>
  </CardContent>
  </Card>
  
  <Card>
  <CardHeader>
  <CardTitle>Storico fatture</CardTitle>
  </CardHeader>
  <CardContent>
  <div className="text-center py-8 text-muted-foreground">
  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
  <p>Nessuna fattura disponibile</p>
  </div>
  </CardContent>
  </Card>
  </TabsContent>
  
  {/* Leads Tab */}
  <TabsContent value="leads" className="space-y-6">
  <Card>
  <CardHeader>
  <div className="flex items-center justify-between">
  <div>
  <CardTitle>Richieste Demo & Leads</CardTitle>
  <CardDescription>Gestisci le richieste delle strutture interessate a 4BID Ecomobility</CardDescription>
  </div>
  <Link href="/ecomobility/registra-struttura" target="_blank">
  <Button variant="outline">
  <ExternalLink className="h-4 w-4 mr-2" />
  Vedi Landing Page
  </Button>
  </Link>
  </div>
  </CardHeader>
  <CardContent>
  <div className="text-center py-12 text-muted-foreground">
  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
  <p className="text-lg font-medium mb-2">Nessun lead disponibile</p>
  <p className="text-sm">Le richieste demo e contatti dalle landing page appariranno qui.</p>
  </div>
  </CardContent>
  </Card>
  </TabsContent>
  
  {/* Settings Tab */}
  <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Impostazioni struttura</CardTitle>
                  <CardDescription>Configura i dettagli della tua struttura</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome struttura</Label>
                      <Input value={selectedStructure.name} readOnly />
                    </div>
                    <div>
                      <Label>Slug URL</Label>
                      <Input value={selectedStructure.slug} readOnly />
                    </div>
                  </div>
                  <div>
                    <Label>Descrizione</Label>
                    <Textarea value={selectedStructure.description || ""} rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input value={selectedStructure.email || ""} />
                    </div>
                    <div>
                      <Label>Telefono</Label>
                      <Input value={selectedStructure.phone || ""} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Città</Label>
                      <Input value={selectedStructure.city || ""} />
                    </div>
                    <div>
                      <Label>Provincia</Label>
                      <Input value={selectedStructure.province || ""} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Colore primario</Label>
                      <div className="flex gap-2">
                        <Input value={selectedStructure.primary_color || "#f97316"} className="flex-1" />
                        <div
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: selectedStructure.primary_color || "#f97316" }}
                        />
                      </div>
                    </div>
                  </div>
                  <Button>Salva impostazioni</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Link pubblico</CardTitle>
                  <CardDescription>Condividi questo link con i tuoi clienti</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      value={`https://4bid.it/ecomobility/${selectedStructure.slug}`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://4bid.it/ecomobility/${selectedStructure.slug}`)
                        toast({ title: "Link copiato!" })
                      }}
                    >
                      Copia
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Accesso Gestore Struttura</CardTitle>
                  <CardDescription>
                    Link per il gestore della struttura per accedere alla propria dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={`https://4bid.it/ecomobility/${selectedStructure.slug}/admin`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://4bid.it/ecomobility/${selectedStructure.slug}/admin`)
                        toast({ title: "Link copiato!" })
                      }}
                    >
                      Copia
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open(`/ecomobility/${selectedStructure.slug}/admin`, "_blank")}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Apri Dashboard Gestore
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stripe Connect Configuration */}
              <Card className="border-2 border-orange-200">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-orange-500" />
                    <CardTitle>Configurazione Pagamenti (Stripe)</CardTitle>
                  </div>
                  <CardDescription>
                    Collega l'account Stripe della struttura per ricevere i pagamenti dai clienti
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedStructure.stripe_account_id && selectedStructure.stripe_onboarding_complete ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Account Stripe collegato e attivo</span>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg space-y-2">
                        <p className="text-sm"><strong>Account ID:</strong> {selectedStructure.stripe_account_id}</p>
                        <p className="text-sm text-muted-foreground">
                          I pagamenti dei clienti andranno direttamente su questo account.
                          4BID trattiene una commissione del 5% su ogni transazione.
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                        onClick={async () => {
                          if (confirm("Sei sicuro di voler scollegare l'account Stripe? La struttura non potrà più ricevere pagamenti.")) {
                            await fetch(`/api/ecomobility/stripe-connect?structure_id=${selectedStructure.id}`, { method: "DELETE" })
                            loadData()
                            toast({ title: "Account Stripe scollegato" })
                          }
                        }}
                      >
                        Scollega Account Stripe
                      </Button>
                    </div>
                  ) : selectedStructure.stripe_account_id && !selectedStructure.stripe_onboarding_complete ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">Onboarding Stripe incompleto</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        La struttura ha iniziato la configurazione di Stripe ma non l'ha completata.
                      </p>
                      <Button 
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={async () => {
                          const res = await fetch("/api/ecomobility/stripe-connect", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ 
                              structure_id: selectedStructure.id,
                              structure_name: selectedStructure.name,
                              structure_email: selectedStructure.email,
                            }),
                          })
                          const data = await res.json()
                          if (data.onboarding_url) {
                            window.open(data.onboarding_url, "_blank")
                          }
                        }}
                      >
                        Completa Configurazione Stripe
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="h-5 w-5" />
                        <span>Nessun account Stripe collegato</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Per ricevere pagamenti, la struttura deve collegare il proprio account Stripe.
                        Verrà guidata attraverso il processo di onboarding di Stripe Express.
                      </p>
                      <Button 
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={async () => {
                          const res = await fetch("/api/ecomobility/stripe-connect", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ 
                              structure_id: selectedStructure.id,
                              structure_name: selectedStructure.name,
                              structure_email: selectedStructure.email,
                            }),
                          })
                          const data = await res.json()
                          if (data.onboarding_url) {
                            window.open(data.onboarding_url, "_blank")
                          }
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Configura Stripe per questa struttura
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Battery Update Dialog */}
          <Dialog open={batteryDialogOpen} onOpenChange={setBatteryDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Aggiorna livello batteria</DialogTitle>
                <DialogDescription>
                  Veicolo: {selectedVehicleForBattery?.internal_code} - {selectedVehicleForBattery?.vehicle_type?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">0%</span>
                  <div className="flex items-center gap-2">
                    {getBatteryIcon(newBatteryLevel, "available")}
                    <span className="text-2xl font-bold">{newBatteryLevel}%</span>
                  </div>
                  <span className="text-sm">100%</span>
                </div>
                <Slider
                  value={[newBatteryLevel]}
                  onValueChange={(value) => setNewBatteryLevel(value[0])}
                  max={100}
                  step={5}
                />
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((level) => (
                    <Button
                      key={level}
                      variant="outline"
                      size="sm"
                      onClick={() => setNewBatteryLevel(level)}
                      className={newBatteryLevel === level ? "border-orange-500" : ""}
                    >
                      {level}%
                    </Button>
                  ))}
                </div>
                {newBatteryLevel < (selectedStructure?.min_battery_threshold || 40) && (
                  <p className="text-sm text-yellow-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Sotto la soglia minima - il veicolo non sarà prenotabile
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBatteryDialogOpen(false)}>
                  Annulla
                </Button>
                <Button onClick={handleUpdateBatteryLevel}>Aggiorna</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Added Dialog for vehicle type editing based on update */}
          <Dialog open={showVehicleTypeDialog} onOpenChange={setShowVehicleTypeDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingVehicleType?.id ? "Modifica Tipo Veicolo" : "Nuovo Tipo Veicolo"}</DialogTitle>
                <DialogDescription>Configura le caratteristiche del tipo di veicolo</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="vt-name">Nome *</Label>
                  <Input
                    id="vt-name"
                    value={editingVehicleType?.name || ""}
                    onChange={(e) => setEditingVehicleType((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                    placeholder="es. E-Bike City"
                  />
                </div>
                <div>
                  <Label htmlFor="vt-description">Descrizione</Label>
                  <Textarea
                    id="vt-description"
                    value={(editingVehicleType as any)?.description || ""}
                    onChange={(e) =>
                      setEditingVehicleType((prev) => (prev ? ({ ...prev, description: e.target.value } as any) : null))
                    }
                    placeholder="Descrizione del tipo di veicolo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vt-speed">Velocità Max (km/h)</Label>
                    <Input
                      id="vt-speed"
                      type="number"
                      value={(editingVehicleType as any)?.max_speed_kmh || 25}
                      onChange={(e) =>
                        setEditingVehicleType((prev) =>
                          prev ? ({ ...prev, max_speed_kmh: Number.parseInt(e.target.value) } as any) : null,
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="vt-range">Autonomia Media (km)</Label>
                    <Input
                      id="vt-range"
                      type="number"
                      value={(editingVehicleType as any)?.avg_range_km || 50}
                      onChange={(e) =>
                        setEditingVehicleType((prev) =>
                          prev ? ({ ...prev, avg_range_km: Number.parseInt(e.target.value) } as any) : null,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowVehicleTypeDialog(false)
                      setEditingVehicleType(null)
                    }}
                  >
                    Annulla
                  </Button>
                  <Button onClick={saveVehicleType}>{editingVehicleType?.id ? "Salva" : "Crea"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 py-12">
          <Card className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nessuna struttura configurata</h2>
            <p className="text-muted-foreground">Configura una struttura per iniziare a gestire i noleggi.</p>
          </Card>
        </main>
      )}
    </div>
  )
}
