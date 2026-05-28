"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import {
  Bike,
  Calendar,
  Battery,
  BatteryLow,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  User,
  Lock,
  RefreshCw,
  Play,
  Square,
  Plus,
  Edit,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
  Car,
  Euro,
  FileText,
  Phone,
  Mail,
  MapPin,
  LogOut,
} from "lucide-react"

interface Structure {
  id: string
  name: string
  slug: string
  primary_color: string
  min_battery_threshold: number
}

interface VehicleType {
  id: string
  name: string
  description?: string
  icon?: string
  requires_license: boolean
  max_passengers: number
}

interface Vehicle {
  id: string
  code: string
  name: string
  brand?: string
  model?: string
  status: string
  battery_level: number | null
  battery_status: string
  vehicle_type_id: string
  vehicle_type?: VehicleType
  notes?: string
}

interface Booking {
  id: string
  booking_code: string
  pickup_date: string
  pickup_time: string
  return_date?: string
  return_time?: string
  status: string
  estimated_amount: number
  final_amount: number
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  vehicle: Vehicle
  vehicle_type?: VehicleType
}

interface TimeSlot {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

interface Props {
  structure: Structure
  vehicleTypes: VehicleType[]
}

export function TenantDashboard({ structure, vehicleTypes: initialVehicleTypes }: Props) {
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [operatorName, setOperatorName] = useState("")

  // Data states
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(initialVehicleTypes)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [todayBookings, setTodayBookings] = useState<Booking[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Dialog states
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [batteryLevel, setBatteryLevel] = useState(100)
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false)

  // Vehicle dialog
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [vehicleForm, setVehicleForm] = useState({
    code: "",
    name: "",
    brand: "",
    model: "",
    vehicle_type_id: "",
    battery_level: 100,
    status: "available",
    notes: "",
  })

  // Vehicle type dialog
  const [vehicleTypeDialogOpen, setVehicleTypeDialogOpen] = useState(false)
  const [editingVehicleType, setEditingVehicleType] = useState<VehicleType | null>(null)
  const [vehicleTypeForm, setVehicleTypeForm] = useState({
    name: "",
    description: "",
    requires_license: false,
    max_passengers: 1,
  })

  // Time slots dialog
  const [timeSlotsDialogOpen, setTimeSlotsDialogOpen] = useState(false)
  const [blockedSlots, setBlockedSlots] = useState<{ day: number; slots: string[] }[]>([])

  useEffect(() => {
    const auth = sessionStorage.getItem(`ecomobility_auth_${structure.id}`)
    if (auth) {
      const operator = JSON.parse(auth)
      setOperatorName(operator.name || "Operatore")
      setIsAuthenticated(true)
      loadData()
    }
  }, [structure.id])

  const handleLogin = async () => {
    setIsLoading(true)
    setLoginError("")

    try {
      const response = await fetch("/api/ecomobility/tenant/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
          structure_id: structure.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setLoginError(data.error || "Credenziali non valide")
        return
      }

      sessionStorage.setItem(`ecomobility_auth_${structure.id}`, JSON.stringify(data.operator))
      setOperatorName(data.operator.name || "Operatore")
      setIsAuthenticated(true)
      loadData()
    } catch (error) {
      setLoginError("Errore di connessione")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem(`ecomobility_auth_${structure.id}`)
    setIsAuthenticated(false)
    setOperatorName("")
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load vehicles
      const vehiclesRes = await fetch(`/api/ecomobility/admin/vehicles?structureId=${structure.id}`)
      const vehiclesData = await vehiclesRes.json()
      setVehicles(vehiclesData.vehicles || [])

      // Load vehicle types
      const typesRes = await fetch(`/api/ecomobility/admin/vehicle-types?structure_id=${structure.id}`)
      const typesData = await typesRes.json()
      setVehicleTypes(typesData.vehicleTypes || typesData || [])

      // Load bookings
      const bookingsRes = await fetch(`/api/ecomobility/admin/bookings?structureId=${structure.id}`)
      const bookingsData = await bookingsRes.json()
      const allBookings = bookingsData.bookings || []
      setBookings(allBookings)

      // Filter today's bookings
      const today = new Date().toISOString().split("T")[0]
      const todayFiltered = allBookings.filter((b: Booking) => b.pickup_date === today || b.status === "picked_up")
      setTodayBookings(todayFiltered)
    } catch (error) {
      toast({ title: "Errore caricamento dati", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const getBatteryIcon = (level: number | null, status: string) => {
    if (status === "charging") return <BatteryCharging className="h-4 w-4 text-yellow-500" />
    if (level === null) return <Battery className="h-4 w-4 text-gray-400" />
    if (level < 25) return <BatteryLow className="h-4 w-4 text-red-500" />
    if (level < 50) return <BatteryMedium className="h-4 w-4 text-yellow-500" />
    if (level < 75) return <BatteryMedium className="h-4 w-4 text-green-500" />
    return <BatteryFull className="h-4 w-4 text-green-500" />
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: "In attesa", className: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "Confermato", className: "bg-blue-100 text-blue-800" },
      picked_up: { label: "In corso", className: "bg-green-100 text-green-800" },
      returned: { label: "Riconsegnato", className: "bg-purple-100 text-purple-800" },
      completed: { label: "Completato", className: "bg-gray-100 text-gray-800" },
      cancelled: { label: "Annullato", className: "bg-red-100 text-red-800" },
      available: { label: "Disponibile", className: "bg-green-100 text-green-800" },
      rented: { label: "Noleggiato", className: "bg-blue-100 text-blue-800" },
      charging: { label: "In carica", className: "bg-yellow-100 text-yellow-800" },
      maintenance: { label: "Manutenzione", className: "bg-red-100 text-red-800" },
    }
    const c = config[status] || { label: status, className: "bg-gray-100 text-gray-800" }
    return <Badge className={c.className}>{c.label}</Badge>
  }

  // Vehicle CRUD
  const openVehicleDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle)
      setVehicleForm({
        code: vehicle.code,
        name: vehicle.name,
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        vehicle_type_id: vehicle.vehicle_type_id,
        battery_level: vehicle.battery_level || 100,
        status: vehicle.status,
        notes: vehicle.notes || "",
      })
    } else {
      setEditingVehicle(null)
      setVehicleForm({
        code: "",
        name: "",
        brand: "",
        model: "",
        vehicle_type_id: vehicleTypes[0]?.id || "",
        battery_level: 100,
        status: "available",
        notes: "",
      })
    }
    setVehicleDialogOpen(true)
  }

  const saveVehicle = async () => {
    try {
      const payload = {
        ...vehicleForm,
        structure_id: structure.id,
      }

      if (editingVehicle) {
        await fetch("/api/ecomobility/admin/vehicles", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingVehicle.id, ...payload }),
        })
        toast({ title: "Veicolo aggiornato" })
      } else {
        await fetch("/api/ecomobility/admin/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        toast({ title: "Veicolo creato" })
      }

      setVehicleDialogOpen(false)
      loadData()
    } catch (error) {
      toast({ title: "Errore", variant: "destructive" })
    }
  }

  const deleteVehicle = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo veicolo?")) return
    try {
      await fetch(`/api/ecomobility/admin/vehicles?id=${id}`, { method: "DELETE" })
      toast({ title: "Veicolo eliminato" })
      loadData()
    } catch (error) {
      toast({ title: "Errore", variant: "destructive" })
    }
  }

  // Vehicle Type CRUD
  const openVehicleTypeDialog = (type?: VehicleType) => {
    if (type) {
      setEditingVehicleType(type)
      setVehicleTypeForm({
        name: type.name,
        description: type.description || "",
        requires_license: type.requires_license,
        max_passengers: type.max_passengers,
      })
    } else {
      setEditingVehicleType(null)
      setVehicleTypeForm({
        name: "",
        description: "",
        requires_license: false,
        max_passengers: 1,
      })
    }
    setVehicleTypeDialogOpen(true)
  }

  const saveVehicleType = async () => {
    try {
      const payload = {
        ...vehicleTypeForm,
        structure_id: structure.id,
      }

      if (editingVehicleType) {
        await fetch("/api/ecomobility/admin/vehicle-types", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingVehicleType.id, ...payload }),
        })
        toast({ title: "Tipologia aggiornata" })
      } else {
        await fetch("/api/ecomobility/admin/vehicle-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        toast({ title: "Tipologia creata" })
      }

      setVehicleTypeDialogOpen(false)
      loadData()
    } catch (error) {
      toast({ title: "Errore", variant: "destructive" })
    }
  }

  const deleteVehicleType = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa tipologia?")) return
    try {
      await fetch(`/api/ecomobility/admin/vehicle-types?id=${id}`, { method: "DELETE" })
      toast({ title: "Tipologia eliminata" })
      loadData()
    } catch (error) {
      toast({ title: "Errore eliminazione", description: "Potrebbero esserci veicoli associati", variant: "destructive" })
    }
  }

  // Pickup/Return handlers
  const handlePickup = async () => {
    if (!selectedBooking) return

    try {
      const response = await fetch("/api/ecomobility/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBooking.id,
          status: "picked_up",
          battery_level_pickup: batteryLevel,
        }),
      })

      if (!response.ok) throw new Error("Errore")

      toast({ title: "Ritiro registrato" })
      setPickupDialogOpen(false)
      setSelectedBooking(null)
      loadData()
    } catch (error) {
      toast({ title: "Errore", variant: "destructive" })
    }
  }

  const handleReturn = async () => {
    if (!selectedBooking) return

    try {
      const response = await fetch("/api/ecomobility/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBooking.id,
          status: "returned",
          battery_level_return: batteryLevel,
        }),
      })

      if (!response.ok) throw new Error("Errore")

      toast({ title: "Riconsegna registrata" })
      setReturnDialogOpen(false)
      setSelectedBooking(null)
      loadData()
    } catch (error) {
      toast({ title: "Errore", variant: "destructive" })
    }
  }

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []

    // Add days from previous month to fill the first week
    const startDayOfWeek = firstDay.getDay() || 7
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      days.push(new Date(year, month, 1 - i))
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    // Add days from next month to complete the grid
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i))
    }

    return days
  }, [calendarDate])

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return bookings.filter((b) => b.pickup_date === dateStr)
  }

  const openBookingDetail = (booking: Booking) => {
    setSelectedBooking(booking)
    setBookingDetailOpen(true)
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: structure.primary_color + "10" }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Image src="/ecomobility-logo.png" alt="4BID Ecomobility" width={80} height={80} />
            </div>
            <CardTitle>{structure.name}</CardTitle>
            <CardDescription>Accedi alla dashboard di gestione</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loginError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {loginError}
              </div>
            )}
            <div>
              <Label>Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="operatore@esempio.it"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="********"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="pl-10"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={isLoading}
              style={{ backgroundColor: structure.primary_color }}
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
              Accedi
            </Button>
            <a
              href={`/ecomobility/${structure.slug}/admin/forgot-password`}
              className="block text-center text-sm text-muted-foreground hover:text-foreground mt-2"
            >
              Password dimenticata?
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white p-4" style={{ backgroundColor: structure.primary_color }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1.5 shadow-sm shrink-0">
              <Image
                src="/ecomobility-logo.png"
                alt="4BID Ecomobility"
                width={56}
                height={56}
                className="h-14 w-14 object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold">{structure.name}</h1>
              <p className="text-sm opacity-80">Dashboard Gestore</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80">Ciao, {operatorName}</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              asChild
            >
              <a href={`/ecomobility/${structure.slug}/admin/devices`} title="Tracker GPS">
                <MapPin className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{todayBookings.length}</p>
              <p className="text-xs text-muted-foreground">Prenotazioni oggi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{bookings.filter((b) => b.status === "picked_up").length}</p>
              <p className="text-xs text-muted-foreground">Noleggi attivi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Bike className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{vehicles.filter((v) => v.status === "available").length}</p>
              <p className="text-xs text-muted-foreground">Veicoli disponibili</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Car className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{vehicles.length}</p>
              <p className="text-xs text-muted-foreground">Flotta totale</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="today">Oggi</TabsTrigger>
            <TabsTrigger value="calendar">Calendario</TabsTrigger>
            <TabsTrigger value="fleet">Flotta</TabsTrigger>
            <TabsTrigger value="types">Tipologie</TabsTrigger>
            <TabsTrigger value="settings">Impostazioni</TabsTrigger>
          </TabsList>

          {/* TODAY TAB */}
          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prenotazioni di oggi</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayBookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nessuna prenotazione per oggi</p>
                ) : (
                  <div className="space-y-3">
                    {todayBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => openBookingDetail(booking)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {booking.customer?.first_name} {booking.customer?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking.vehicle?.vehicle_type?.name || booking.vehicle_type?.name} - Ore {booking.pickup_time}
                            </p>
                            <p className="text-xs font-mono mt-1">{booking.booking_code}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(booking.status)}
                            {booking.status === "confirmed" && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedBooking(booking)
                                  setBatteryLevel(booking.vehicle?.battery_level || 100)
                                  setPickupDialogOpen(true)
                                }}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Ritiro
                              </Button>
                            )}
                            {booking.status === "picked_up" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedBooking(booking)
                                  setBatteryLevel(50)
                                  setReturnDialogOpen(true)
                                }}
                              >
                                <Square className="h-4 w-4 mr-1" />
                                Riconsegna
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CALENDAR TAB */}
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Calendario Prenotazioni</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-medium min-w-[140px] text-center">
                      {calendarDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    const dayBookings = getBookingsForDate(day)
                    const isCurrentMonth = day.getMonth() === calendarDate.getMonth()
                    const isToday = day.toDateString() === new Date().toDateString()
                    const dateStr = day.toISOString().split("T")[0]

                    return (
                      <div
                        key={index}
                        className={`min-h-[80px] p-1 border rounded cursor-pointer transition-colors ${
                          isCurrentMonth ? "bg-white" : "bg-gray-50"
                        } ${isToday ? "border-orange-500 border-2" : ""} ${
                          selectedDate === dateStr ? "ring-2 ring-orange-300" : ""
                        } hover:bg-orange-50`}
                        onClick={() => setSelectedDate(dateStr)}
                      >
                        <div className={`text-sm font-medium ${isCurrentMonth ? "" : "text-gray-400"}`}>
                          {day.getDate()}
                        </div>
                        {dayBookings.slice(0, 2).map((booking) => (
                          <div
                            key={booking.id}
                            className="text-xs bg-orange-100 text-orange-800 rounded px-1 py-0.5 mt-1 truncate cursor-pointer hover:bg-orange-200"
                            onClick={(e) => {
                              e.stopPropagation()
                              openBookingDetail(booking)
                            }}
                          >
                            {booking.pickup_time} - {booking.customer?.last_name}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-xs text-muted-foreground mt-1">+{dayBookings.length - 2} altre</div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Selected date bookings */}
                {selectedDate && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium mb-3">
                      Prenotazioni del {new Date(selectedDate).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
                    </h4>
                    {getBookingsForDate(new Date(selectedDate)).length === 0 ? (
                      <p className="text-muted-foreground text-sm">Nessuna prenotazione</p>
                    ) : (
                      <div className="space-y-2">
                        {getBookingsForDate(new Date(selectedDate)).map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => openBookingDetail(booking)}
                          >
                            <div>
                              <p className="font-medium">
                                {booking.customer?.first_name} {booking.customer?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Ore {booking.pickup_time} - {booking.vehicle?.vehicle_type?.name}
                              </p>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FLEET TAB */}
          <TabsContent value="fleet" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Gestione Flotta</CardTitle>
                    <CardDescription>Aggiungi, modifica o rimuovi veicoli</CardDescription>
                  </div>
                  <Button onClick={() => openVehicleDialog()} style={{ backgroundColor: structure.primary_color }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Veicolo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {vehicles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bike className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nessun veicolo configurato</p>
                    <p className="text-sm">Aggiungi il tuo primo veicolo per iniziare</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codice</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipologia</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Batteria</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-mono font-medium">{vehicle.code}</TableCell>
                          <TableCell>
                            {vehicle.name}
                            {vehicle.brand && <span className="text-muted-foreground text-sm ml-1">({vehicle.brand} {vehicle.model})</span>}
                          </TableCell>
                          <TableCell>{vehicle.vehicle_type?.name}</TableCell>
                          <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getBatteryIcon(vehicle.battery_level, vehicle.battery_status)}
                              <span className="text-sm">{vehicle.battery_level ?? "-"}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => openVehicleDialog(vehicle)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteVehicle(vehicle.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TYPES TAB */}
          <TabsContent value="types" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Tipologie Veicoli</CardTitle>
                    <CardDescription>Configura le tipologie di veicoli disponibili</CardDescription>
                  </div>
                  <Button onClick={() => openVehicleTypeDialog()} style={{ backgroundColor: structure.primary_color }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Tipologia
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {vehicleTypes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nessuna tipologia configurata</p>
                    <p className="text-sm">Crea la prima tipologia (es. E-Bike, Scooter, etc.)</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicleTypes.map((type) => (
                      <Card key={type.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold">{type.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{type.description || "Nessuna descrizione"}</p>
                              <div className="flex gap-2 mt-3">
                                {type.requires_license && (
                                  <Badge variant="outline" className="text-xs">Patente richiesta</Badge>
                                )}
                                <Badge variant="outline" className="text-xs">Max {type.max_passengers} passeggeri</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {vehicles.filter((v) => v.vehicle_type_id === type.id).length} veicoli assegnati
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openVehicleTypeDialog(type)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteVehicleType(type.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Orari di Disponibilita</CardTitle>
                <CardDescription>Configura gli orari in cui i veicoli sono disponibili per il noleggio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato", "Domenica"].map((day, index) => (
                    <div key={day} className="flex items-center justify-between border-b pb-3">
                      <span className="font-medium w-28">{day}</span>
                      <div className="flex items-center gap-2">
                        <Input type="time" defaultValue="08:00" className="w-28" />
                        <span>-</span>
                        <Input type="time" defaultValue="20:00" className="w-28" />
                        <Switch defaultChecked />
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-4" style={{ backgroundColor: structure.primary_color }}>
                  Salva Orari
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Blocco Fasce Orarie</CardTitle>
                <CardDescription>Escludi date o fasce orarie specifiche dal noleggio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input type="date" className="flex-1" />
                    <Input type="time" className="w-28" placeholder="Da" />
                    <Input type="time" className="w-28" placeholder="A" />
                    <Button variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aggiungi periodi di chiusura o manutenzione in cui non sara possibile prenotare.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Link Prenotazione Pubblica</CardTitle>
                <CardDescription>Condividi questo link con i tuoi ospiti</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={`https://4bid.it/ecomobility/${structure.slug}`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://4bid.it/ecomobility/${structure.slug}`)
                      toast({ title: "Link copiato!" })
                    }}
                  >
                    Copia
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Vehicle Dialog */}
      <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? "Modifica Veicolo" : "Nuovo Veicolo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Codice *</Label>
                <Input
                  value={vehicleForm.code}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, code: e.target.value })}
                  placeholder="EB-001"
                />
              </div>
              <div>
                <Label>Nome *</Label>
                <Input
                  value={vehicleForm.name}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                  placeholder="E-Bike City"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Marca</Label>
                <Input
                  value={vehicleForm.brand}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                  placeholder="Giant"
                />
              </div>
              <div>
                <Label>Modello</Label>
                <Input
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  placeholder="Explore E+"
                />
              </div>
            </div>
            <div>
              <Label>Tipologia *</Label>
              <Select
                value={vehicleForm.vehicle_type_id}
                onValueChange={(value) => setVehicleForm({ ...vehicleForm, vehicle_type_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipologia" />
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stato</Label>
                <Select
                  value={vehicleForm.status}
                  onValueChange={(value) => setVehicleForm({ ...vehicleForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponibile</SelectItem>
                    <SelectItem value="rented">Noleggiato</SelectItem>
                    <SelectItem value="charging">In carica</SelectItem>
                    <SelectItem value="maintenance">Manutenzione</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Batteria (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={vehicleForm.battery_level}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, battery_level: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Note</Label>
              <Textarea
                value={vehicleForm.notes}
                onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })}
                placeholder="Note aggiuntive..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVehicleDialogOpen(false)}>Annulla</Button>
            <Button onClick={saveVehicle} style={{ backgroundColor: structure.primary_color }}>
              {editingVehicle ? "Aggiorna" : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vehicle Type Dialog */}
      <Dialog open={vehicleTypeDialogOpen} onOpenChange={setVehicleTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVehicleType ? "Modifica Tipologia" : "Nuova Tipologia"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={vehicleTypeForm.name}
                onChange={(e) => setVehicleTypeForm({ ...vehicleTypeForm, name: e.target.value })}
                placeholder="E-Bike"
              />
            </div>
            <div>
              <Label>Descrizione</Label>
              <Textarea
                value={vehicleTypeForm.description}
                onChange={(e) => setVehicleTypeForm({ ...vehicleTypeForm, description: e.target.value })}
                placeholder="Bicicletta elettrica con pedalata assistita..."
              />
            </div>
            <div>
              <Label>Max Passeggeri</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={vehicleTypeForm.max_passengers}
                onChange={(e) => setVehicleTypeForm({ ...vehicleTypeForm, max_passengers: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Richiede patente</Label>
              <Switch
                checked={vehicleTypeForm.requires_license}
                onCheckedChange={(checked) => setVehicleTypeForm({ ...vehicleTypeForm, requires_license: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVehicleTypeDialogOpen(false)}>Annulla</Button>
            <Button onClick={saveVehicleType} style={{ backgroundColor: structure.primary_color }}>
              {editingVehicleType ? "Aggiorna" : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pickup Dialog */}
      <Dialog open={pickupDialogOpen} onOpenChange={setPickupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registra Ritiro</DialogTitle>
            <DialogDescription>
              Cliente: {selectedBooking?.customer?.first_name} {selectedBooking?.customer?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Livello batteria al ritiro (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={batteryLevel}
                onChange={(e) => setBatteryLevel(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Veicolo: {selectedBooking?.vehicle?.code}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickupDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handlePickup} style={{ backgroundColor: structure.primary_color }}>Conferma Ritiro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registra Riconsegna</DialogTitle>
            <DialogDescription>
              Cliente: {selectedBooking?.customer?.first_name} {selectedBooking?.customer?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Livello batteria alla riconsegna (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={batteryLevel}
                onChange={(e) => setBatteryLevel(Number(e.target.value))}
              />
            </div>
            {batteryLevel < (structure.min_battery_threshold || 40) && (
              <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Batteria sotto la soglia - il veicolo verra messo in ricarica
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleReturn} style={{ backgroundColor: structure.primary_color }}>Conferma Riconsegna</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Detail Dialog */}
      <Dialog open={bookingDetailOpen} onOpenChange={setBookingDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dettaglio Prenotazione</DialogTitle>
            <DialogDescription>Codice: {selectedBooking?.booking_code}</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Stato</span>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" /> Cliente
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p>{selectedBooking.customer?.first_name} {selectedBooking.customer?.last_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Telefono:</span>
                    <p>{selectedBooking.customer?.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Email:</span>
                    <p>{selectedBooking.customer?.email}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Bike className="h-4 w-4" /> Noleggio
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Veicolo:</span>
                    <p>{selectedBooking.vehicle?.code} - {selectedBooking.vehicle?.vehicle_type?.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Importo:</span>
                    <p className="font-medium">{selectedBooking.estimated_amount?.toFixed(2)} EUR</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data ritiro:</span>
                    <p>{selectedBooking.pickup_date} ore {selectedBooking.pickup_time}</p>
                  </div>
                  {selectedBooking.return_date && (
                    <div>
                      <span className="text-muted-foreground">Data riconsegna:</span>
                      <p>{selectedBooking.return_date} ore {selectedBooking.return_time}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 flex gap-2 justify-end">
                {selectedBooking.status === "confirmed" && (
                  <Button
                    onClick={() => {
                      setBookingDetailOpen(false)
                      setBatteryLevel(selectedBooking.vehicle?.battery_level || 100)
                      setPickupDialogOpen(true)
                    }}
                    style={{ backgroundColor: structure.primary_color }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Registra Ritiro
                  </Button>
                )}
                {selectedBooking.status === "picked_up" && (
                  <Button
                    onClick={() => {
                      setBookingDetailOpen(false)
                      setBatteryLevel(50)
                      setReturnDialogOpen(true)
                    }}
                    style={{ backgroundColor: structure.primary_color }}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Registra Riconsegna
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
