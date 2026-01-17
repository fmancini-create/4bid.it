"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
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
}

interface Vehicle {
  id: string
  code: string
  name: string
  status: string
  battery_level: number | null
  battery_status: string
  vehicle_type: VehicleType
}

interface Booking {
  id: string
  booking_code: string
  pickup_date: string
  pickup_time: string
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
}

interface Props {
  structure: Structure
  vehicleTypes: VehicleType[]
}

export function TenantDashboard({ structure, vehicleTypes }: Props) {
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")

  // Data states
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [todayBookings, setTodayBookings] = useState<Booking[]>([])

  // Dialog states
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [batteryLevel, setBatteryLevel] = useState(100)

  useEffect(() => {
    // Check if already authenticated via session storage
    const auth = sessionStorage.getItem(`ecomobility_auth_${structure.id}`)
    if (auth) {
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
      setIsAuthenticated(true)
      loadData()
    } catch (error) {
      setLoginError("Errore di connessione")
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load vehicles
      const vehiclesRes = await fetch(`/api/ecomobility/admin/vehicles?structureId=${structure.id}`)
      const vehiclesData = await vehiclesRes.json()
      setVehicles(vehiclesData.vehicles || [])

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
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "In attesa", variant: "secondary" },
      confirmed: { label: "Confermato", variant: "default" },
      picked_up: { label: "In corso", variant: "default" },
      returned: { label: "Riconsegnato", variant: "outline" },
      completed: { label: "Completato", variant: "outline" },
      available: { label: "Disponibile", variant: "default" },
      rented: { label: "Noleggiato", variant: "secondary" },
      charging: { label: "In carica", variant: "secondary" },
      maintenance: { label: "Manutenzione", variant: "destructive" },
    }
    const c = config[status] || { label: status, variant: "outline" as const }
    return <Badge variant={c.variant}>{c.label}</Badge>
  }

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

  // Login screen
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: structure.primary_color + "10" }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: structure.primary_color }}
            >
              <Bike className="h-8 w-8 text-white" />
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
                  placeholder="••••••••"
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
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white p-4" style={{ backgroundColor: structure.primary_color }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bike className="h-6 w-6" />
            <div>
              <h1 className="font-bold">{structure.name}</h1>
              <p className="text-sm opacity-80">Dashboard Gestore</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Today's summary */}
        <div className="grid grid-cols-3 gap-4">
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
        </div>

        <Tabs defaultValue="today">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="today">Oggi</TabsTrigger>
            <TabsTrigger value="fleet">Flotta</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prenotazioni di oggi</CardTitle>
              </CardHeader>
              <CardContent>
                {todayBookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nessuna prenotazione per oggi</p>
                ) : (
                  <div className="space-y-3">
                    {todayBookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {booking.customer?.first_name} {booking.customer?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.vehicle?.vehicle_type?.name} - {booking.pickup_time}
                          </p>
                          <p className="text-xs font-mono">{booking.booking_code}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(booking.status)}
                          {booking.status === "confirmed" && (
                            <Button
                              size="sm"
                              onClick={() => {
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
                              onClick={() => {
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fleet" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stato Flotta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className={`p-3 rounded-lg border ${
                        vehicle.status === "available"
                          ? "bg-green-50 border-green-200"
                          : vehicle.status === "charging"
                            ? "bg-yellow-50 border-yellow-200"
                            : vehicle.status === "rented"
                              ? "bg-blue-50 border-blue-200"
                              : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-medium">{vehicle.code}</span>
                        {getStatusBadge(vehicle.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{vehicle.vehicle_type?.name}</p>
                      {vehicle.battery_level !== null && (
                        <div className="flex items-center gap-2">
                          {getBatteryIcon(vehicle.battery_level, vehicle.battery_status)}
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPickupDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handlePickup}>Conferma Ritiro</Button>
          </div>
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
                Batteria sotto la soglia - il veicolo verrà messo in ricarica
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleReturn}>Conferma Riconsegna</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TenantDashboard
