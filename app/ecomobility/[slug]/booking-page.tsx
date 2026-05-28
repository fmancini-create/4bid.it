"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/ecomobility/i18n/provider"
import { LanguageSwitcher } from "@/components/ecomobility/language-switcher"
import {
  Bike,
  Zap,
  Calendar,
  CreditCard,
  Upload,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Shield,
  TrendingDown,
  Info,
  Camera,
  FileText,
  Battery,
  BatteryLow,
  BatteryCharging,
  AlertCircle,
} from "lucide-react"

interface Structure {
  id: string
  name: string
  slug: string
  description: string
  address: string
  city: string
  province: string
  phone: string
  email: string
  logo_url: string
  cover_image_url: string
  primary_color: string
  secondary_color: string
  min_battery_threshold: number
}

interface VehicleType {
  id: string
  name: string
  description: string
  icon: string
  image_url?: string | null
  image_urls?: string[] | null
  max_speed_kmh: number
  avg_range_km: number
  requires_license: boolean
  license_type?: string | null
  max_passengers: number
}

interface Vehicle {
  id: string
  internal_code: string
  brand: string
  model: string
  color: string
  status: string
  battery_level: number
  battery_status: "available" | "low_battery" | "charging" | "unavailable"
  estimated_range_km: number
  estimated_available_time: string | null
  images: string[]
  vehicle_type: VehicleType
}

interface Pricing {
  id: string
  vehicle_type_id: string
  hour_1: number
  hour_2: number
  hour_3: number
  hour_4: number
  hour_5: number
  hour_6: number
  hour_7: number
  hour_8_plus: number
  daily_cap: number
  deposit: number
  minimum_charge: number
  vehicle_type: VehicleType
}

interface Terms {
  id: string
  title: string
  content: string
}

interface ScheduleRow {
  day_of_week: number
  is_open: boolean
  open_time: string | null
  close_time: string | null
}

interface BlockedSlot {
  date: string
  start_time: string | null
  end_time: string | null
  all_day: boolean
  reason?: string | null
}

interface Props {
  structure: Structure
  vehicles: Vehicle[]
  pricing: Pricing[]
  terms: Terms | null
  schedule?: ScheduleRow[]
  blockedSlots?: BlockedSlot[]
}

type Step = "select" | "datetime" | "details" | "documents" | "payment" | "confirmation"

type TFn = (path: string, vars?: Record<string, string | number>) => string

// Validates a chosen pickup date+time against opening hours and blocked slots.
// Returns an error message (string) when not bookable, or null when OK.
function getAvailabilityError(
  date: string,
  time: string,
  schedule: ScheduleRow[],
  blocked: BlockedSlot[],
  t: TFn,
): string | null {
  if (!date || !time) return null
  const hhmm = time.slice(0, 5)
  const dow = new Date(`${date}T00:00:00`).getDay()
  const dayName = t(`booking.days.${dow}`)

  const day = schedule.find((s) => s.day_of_week === dow)
  if (day) {
    if (!day.is_open) {
      return t("booking.availability.closedDay", { day: dayName })
    }
    const open = day.open_time?.slice(0, 5)
    const close = day.close_time?.slice(0, 5)
    if (open && close && (hhmm < open || hhmm > close)) {
      return t("booking.availability.outsideHours", { open, close })
    }
  }

  for (const b of blocked) {
    if (b.date !== date) continue
    if (b.all_day) {
      return b.reason
        ? t("booking.availability.dateBlockedReason", { reason: b.reason })
        : t("booking.availability.dateBlocked")
    }
    const from = b.start_time?.slice(0, 5)
    const to = b.end_time?.slice(0, 5)
    if (from && to && hhmm >= from && hhmm < to) {
      return b.reason
        ? t("booking.availability.slotBlockedReason", { reason: b.reason })
        : t("booking.availability.slotBlocked")
    }
  }

  return null
}

// Returns all photos for a type (gallery first, falls back to legacy single image_url)
function getTypeImages(type?: VehicleType | null): string[] {
  if (!type) return []
  if (type.image_urls && type.image_urls.length > 0) return type.image_urls
  if (type.image_url) return [type.image_url]
  return []
}

// Small image carousel used in the vehicle selection grid
function TypeImageCarousel({ images, name }: { images: string[]; name: string }) {
  const { t } = useLanguage()
  const [index, setIndex] = useState(0)
  if (images.length === 0) {
    return <Bike className="h-10 w-10 text-gray-400" />
  }
  const current = Math.min(index, images.length - 1)
  return (
    <div className="relative w-full h-full">
      <Image
        src={images[current] || "/placeholder.svg"}
        alt={`${name} ${current + 1}`}
        fill
        sizes="112px"
        className="object-cover"
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIndex((current - 1 + images.length) % images.length)
            }}
            aria-label={t("booking.a11y.prevPhoto")}
            className="absolute left-0.5 top-1/2 -translate-y-1/2 bg-black/45 hover:bg-black/65 text-white rounded-full p-0.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIndex((current + 1) % images.length)
            }}
            aria-label={t("booking.a11y.nextPhoto")}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 bg-black/45 hover:bg-black/65 text-white rounded-full p-0.5"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === current ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const EcomobilityBookingPage = ({ structure, vehicles, pricing, terms, schedule = [], blockedSlots = [] }: Props) => {
  const { toast } = useToast()
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState<Step>("select")
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedPricing, setSelectedPricing] = useState<Pricing | null>(null)
  const [pickupDate, setPickupDate] = useState("")
  const [pickupTime, setPickupTime] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [batteryAutonomyAccepted, setBatteryAutonomyAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Customer details
  const [customerData, setCustomerData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    nationality: "IT",
    fiscalCode: "",
    licenseType: "",
    licenseNumber: "",
    licenseExpiry: "",
  })

  // Document uploads
  const [licenseFront, setLicenseFront] = useState<File | null>(null)
  const [licenseBack, setLicenseBack] = useState<File | null>(null)
  const [idFront, setIdFront] = useState<File | null>(null)

  const minBatteryThreshold = structure.min_battery_threshold || 40

  const isVehicleBookable = (vehicle: Vehicle): boolean => {
    // Must not be already rented or in maintenance
    if (vehicle.status !== "available" && vehicle.status !== "charging") return false
    // If charging, not bookable now
    if (vehicle.status === "charging" || vehicle.battery_status === "charging") return false
    // If explicitly unavailable, not bookable
    if (vehicle.battery_status === "unavailable" || vehicle.battery_status === "low_battery") return false
    // Battery level must be >= threshold (if set)
    if (vehicle.battery_level !== null && vehicle.battery_level < minBatteryThreshold) return false
    // If battery_status is null/undefined but status is available, consider it bookable
    return true
  }

  const getBatteryDisplay = (vehicle: Vehicle) => {
    const level = vehicle.battery_level
    const status = vehicle.battery_status

    if (status === "charging") {
      const availableTime = vehicle.estimated_available_time ? new Date(vehicle.estimated_available_time) : null
      const timeRemaining = availableTime
        ? Math.max(0, Math.ceil((availableTime.getTime() - Date.now()) / 60000))
        : null

      return {
        icon: <BatteryCharging className="h-4 w-4 text-yellow-500" />,
        text: timeRemaining
          ? t("booking.battery.chargingTime", { h: Math.floor(timeRemaining / 60), m: timeRemaining % 60 })
          : t("booking.battery.charging"),
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      }
    }

    if (status === "low_battery" || (level !== null && level < minBatteryThreshold)) {
      return {
        icon: <BatteryLow className="h-4 w-4 text-red-500" />,
        text: t("booking.battery.low", { level: level ?? 0 }),
        color: "text-red-600",
        bgColor: "bg-red-50",
      }
    }

    if (status === "unavailable" || level === null) {
      return {
        icon: <Battery className="h-4 w-4 text-gray-400" />,
        text: t("booking.battery.unavailable"),
        color: "text-gray-500",
        bgColor: "bg-gray-50",
      }
    }

    // Available
    return {
      icon: <Battery className="h-4 w-4 text-green-500" />,
      text: `${level}%`,
      color: "text-green-600",
      bgColor: "bg-green-50",
    }
  }

  // Group vehicles by type - now considers battery availability
  const vehiclesByType = vehicles.reduce(
    (acc, vehicle) => {
      const typeId = vehicle.vehicle_type?.id
      if (!typeId) return acc
      if (!acc[typeId]) {
        acc[typeId] = {
          type: vehicle.vehicle_type,
          vehicles: [],
          pricing: pricing.find((p) => p.vehicle_type?.id === typeId),
        }
      }
      acc[typeId].vehicles.push(vehicle)
      return acc
    },
    {} as Record<string, { type: VehicleType; vehicles: Vehicle[]; pricing?: Pricing }>,
  )

  const handleSelectVehicle = (vehicle: Vehicle, vehiclePricing: Pricing | undefined) => {
    if (!isVehicleBookable(vehicle)) {
      toast({
        title: t("booking.toast.vehicleUnavailableTitle"),
        description: t("booking.toast.vehicleUnavailableDesc"),
        variant: "destructive",
      })
      return
    }
    setSelectedVehicle(vehicle)
    setSelectedPricing(vehiclePricing || null)
    setCurrentStep("datetime")
  }

  const handleDateTimeNext = () => {
    if (!pickupDate || !pickupTime) {
      toast({ title: t("booking.toast.selectDateTime"), variant: "destructive" })
      return
    }
    const availabilityError = getAvailabilityError(pickupDate, pickupTime, schedule, blockedSlots, t)
    if (availabilityError) {
      toast({ title: t("booking.toast.timeUnavailable"), description: availabilityError, variant: "destructive" })
      return
    }
    setCurrentStep("details")
  }

  const handleDetailsNext = () => {
    if (!customerData.firstName || !customerData.lastName || !customerData.email || !customerData.phone) {
      toast({ title: t("booking.toast.fillRequired"), variant: "destructive" })
      return
    }
    setCurrentStep("documents")
  }

  const handleDocumentsNext = () => {
    if (!licenseFront || !idFront) {
      toast({ title: t("booking.toast.uploadDocs"), variant: "destructive" })
      return
    }
    if (!termsAccepted) {
      toast({ title: t("booking.toast.acceptTerms"), variant: "destructive" })
      return
    }
    if (!batteryAutonomyAccepted) {
      toast({ title: t("booking.toast.acceptBattery"), variant: "destructive" })
      return
    }
    setCurrentStep("payment")
  }

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      // 1. Crea la prenotazione
      const response = await fetch("/api/ecomobility/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structureId: structure.id,
          vehicleId: selectedVehicle?.id,
          pricingId: selectedPricing?.id,
          pickupDate,
          pickupTime,
          customer: customerData,
          termsAccepted,
          batteryAutonomyAccepted,
          batteryLevelPickup: selectedVehicle?.battery_level,
        }),
      })

      if (!response.ok) throw new Error(t("booking.toast.bookingError"))

      const bookingData = await response.json()

      // 2. Crea sessione Stripe Checkout
      const checkoutRes = await fetch("/api/ecomobility/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingData.booking_id,
          structure_id: structure.id,
          customer_email: customerData.email,
          customer_name: `${customerData.firstName} ${customerData.lastName}`,
          amount: selectedPricing?.minimum_charge || selectedPricing?.hour_1 || 0,
          deposit: selectedPricing?.deposit || 0,
          description: `${selectedVehicle?.vehicle_type?.name} - ${selectedVehicle?.brand} ${selectedVehicle?.model}`,
        }),
      })

      const checkoutData = await checkoutRes.json()
      if (!checkoutRes.ok) throw new Error(checkoutData.error || t("booking.toast.paymentError"))

      // 3. Redirect a Stripe Checkout
      if (checkoutData.url) {
        window.location.href = checkoutData.url
      } else {
        throw new Error(t("booking.toast.paymentCreateError"))
      }
    } catch (error: any) {
      toast({
        title: t("booking.toast.errorTitle"),
        description: error.message || t("booking.toast.paymentError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "select", label: t("booking.steps.vehicle"), icon: <Bike className="h-4 w-4" /> },
    { key: "datetime", label: t("booking.steps.datetime"), icon: <Calendar className="h-4 w-4" /> },
    { key: "details", label: t("booking.steps.details"), icon: <FileText className="h-4 w-4" /> },
    { key: "documents", label: t("booking.steps.documents"), icon: <Upload className="h-4 w-4" /> },
    { key: "payment", label: t("booking.steps.payment"), icon: <CreditCard className="h-4 w-4" /> },
  ]

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep)

  const primaryColor = structure.primary_color || "#f97316"

  const availabilityError = getAvailabilityError(pickupDate, pickupTime, schedule, blockedSlots, t)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {structure.logo_url ? (
            <Image
              src={structure.logo_url || "/placeholder.svg"}
              alt={structure.name}
              width={40}
              height={40}
              className="rounded-lg"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <Bike className="h-5 w-5 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="font-semibold text-sm">{structure.name}</h1>
            <p className="text-xs text-muted-foreground">4BID Ecomobility</p>
          </div>
          <LanguageSwitcher />
          <Image src="/ecomobility-logo.png" alt="4BID Ecomobility" width={48} height={48} />
        </div>
      </header>

      {/* Progress Steps */}
      {currentStep !== "confirmation" && (
        <div className="bg-white border-b">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                      index <= currentStepIndex ? "text-white" : "bg-gray-100 text-gray-400"
                    }`}
                    style={{ backgroundColor: index <= currentStepIndex ? primaryColor : undefined }}
                  >
                    {index < currentStepIndex ? <CheckCircle2 className="h-4 w-4" /> : step.icon}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 h-0.5 mx-1 ${index < currentStepIndex ? "" : "bg-gray-200"}`}
                      style={{ backgroundColor: index < currentStepIndex ? primaryColor : undefined }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Step 1: Select Vehicle */}
        {currentStep === "select" && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div
              className="rounded-2xl p-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${structure.secondary_color || "#ea580c"})`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5" />
                <span className="text-sm font-medium">{t("booking.hero.badge")}</span>
              </div>
              <h2 className="text-xl font-bold mb-1">{t("booking.hero.title")}</h2>
              <p className="text-sm opacity-90">{t("booking.hero.subtitle", { city: structure.city })}</p>
            </div>

            {/* Vehicle Types */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t("booking.select.title")}</h3>

              {Object.values(vehiclesByType).map(({ type, vehicles: typeVehicles, pricing: typePricing }) => {
                const availableCount = typeVehicles.filter(isVehicleBookable).length
                const chargingCount = typeVehicles.filter((v) => v.battery_status === "charging").length
                const lowBatteryCount = typeVehicles.filter((v) => v.battery_status === "low_battery").length

                return (
                  <Card key={type.id} className="overflow-hidden">
                    <div className="flex">
                      <div className="w-28 h-28 bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <TypeImageCarousel images={getTypeImages(type)} name={type.name} />
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold">{type.name}</h4>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={availableCount > 0 ? "default" : "secondary"} className="text-xs">
                              {availableCount} disponibili
                            </Badge>
                            {chargingCount > 0 && (
                              <span className="text-xs text-yellow-600 flex items-center gap-1">
                                <BatteryCharging className="h-3 w-3" /> {chargingCount} in carica
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{type.description}</p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          {type.avg_range_km && (
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" /> {type.avg_range_km} km
                            </span>
                          )}
                          {type.requires_license && type.license_type && (
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" /> Pat. {type.license_type}
                            </span>
                          )}
                        </div>

                        {typePricing && (
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-bold" style={{ color: primaryColor }}>
                                €{typePricing.hour_1}
                              </span>
                              <span className="text-xs text-muted-foreground">/1ª ora</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                max €{typePricing.daily_cap}/giorno
                              </span>
                            </div>
                            <Button
                              size="sm"
                              disabled={availableCount === 0}
                              onClick={() => {
                                const bookableVehicle = typeVehicles.find(isVehicleBookable)
                                if (bookableVehicle) {
                                  handleSelectVehicle(bookableVehicle, typePricing)
                                }
                              }}
                              style={{ backgroundColor: primaryColor }}
                              className="hover:opacity-90"
                            >
                              Prenota
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}

              {Object.keys(vehiclesByType).length === 0 && (
                <Card className="p-8 text-center">
                  <Bike className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-muted-foreground">Nessun veicolo disponibile al momento</p>
                </Card>
              )}
            </div>

            {/* Pricing Info */}
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-800 mb-1">Come funziona il pricing?</p>
                    <p className="text-orange-700">
                      Più a lungo noleggi, meno paghi all'ora. Il prezzo massimo giornaliero ti protegge: non pagherai
                      mai più di quello!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Battery className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800 mb-1">Veicoli sempre carichi</p>
                    <p className="text-green-700">
                      I nostri veicoli sono disponibili solo con batteria superiore al {minBatteryThreshold}%.
                      L'autonomia effettiva può variare in base allo stile di guida e al percorso.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {currentStep === "datetime" && selectedVehicle && (
          <div className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep("select")} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-1" /> Indietro
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quando vuoi ritirare?</CardTitle>
                <CardDescription>Seleziona data e ora del ritiro presso la reception</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pickupDate">Data ritiro</Label>
                  <Input
                    id="pickupDate"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="pickupTime">Ora ritiro</Label>
                  <Input
                    id="pickupTime"
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {(() => {
                  if (!pickupDate) return null
                  const dow = new Date(`${pickupDate}T00:00:00`).getDay()
                  const day = schedule.find((s) => s.day_of_week === dow)
                  if (day && day.is_open && day.open_time && day.close_time) {
                    return (
                      <p className="text-xs text-muted-foreground">
                        Reception aperta {DAY_LABELS[dow]}: {day.open_time.slice(0, 5)} - {day.close_time.slice(0, 5)}
                      </p>
                    )
                  }
                  return null
                })()}
                {availabilityError && (
                  <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-3">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{availabilityError}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Vehicle Summary with Battery Info */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {getTypeImages(selectedVehicle.vehicle_type)[0] ? (
                      <Image
                        src={getTypeImages(selectedVehicle.vehicle_type)[0] || "/placeholder.svg"}
                        alt={selectedVehicle.vehicle_type?.name || "Veicolo"}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Bike className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedVehicle.vehicle_type?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const batteryDisplay = getBatteryDisplay(selectedVehicle)
                        return (
                          <span className={`text-xs flex items-center gap-1 ${batteryDisplay.color}`}>
                            {batteryDisplay.icon}
                            {batteryDisplay.text}
                            {selectedVehicle.estimated_range_km && (
                              <span className="text-muted-foreground">
                                ({selectedVehicle.estimated_range_km} km autonomia)
                              </span>
                            )}
                          </span>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Summary */}
            {selectedPricing && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Riepilogo tariffe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>1ª ora</span>
                      <span className="font-medium">€{selectedPricing.hour_1}</span>
                    </div>
                    {selectedPricing.hour_2 && (
                      <div className="flex justify-between">
                        <span>2ª ora</span>
                        <span className="font-medium">€{selectedPricing.hour_2}</span>
                      </div>
                    )}
                    {selectedPricing.hour_3 && (
                      <div className="flex justify-between">
                        <span>3ª ora</span>
                        <span className="font-medium">€{selectedPricing.hour_3}</span>
                      </div>
                    )}
                    {selectedPricing.hour_8_plus && (
                      <div className="flex justify-between">
                        <span>Ore successive</span>
                        <span className="font-medium">€{selectedPricing.hour_8_plus}/ora</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-base">
                      <span className="font-medium">Max giornaliero</span>
                      <span className="font-bold" style={{ color: primaryColor }}>
                        €{selectedPricing.daily_cap}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Cauzione</span>
                      <span>€{selectedPricing.deposit}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleDateTimeNext}
              disabled={!!availabilityError}
              style={{ backgroundColor: primaryColor }}
            >
              Continua <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 3: Customer Details - unchanged */}
        {currentStep === "details" && (
          <div className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep("datetime")} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-1" /> Indietro
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">I tuoi dati</CardTitle>
                <CardDescription>Inserisci i dati per la prenotazione</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome *</Label>
                    <Input
                      id="firstName"
                      value={customerData.firstName}
                      onChange={(e) => setCustomerData({ ...customerData, firstName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Cognome *</Label>
                    <Input
                      id="lastName"
                      value={customerData.lastName}
                      onChange={(e) => setCustomerData({ ...customerData, lastName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Data di nascita</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={customerData.dateOfBirth}
                    onChange={(e) => setCustomerData({ ...customerData, dateOfBirth: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="fiscalCode">Codice fiscale</Label>
                  <Input
                    id="fiscalCode"
                    value={customerData.fiscalCode}
                    onChange={(e) => setCustomerData({ ...customerData, fiscalCode: e.target.value.toUpperCase() })}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" size="lg" onClick={handleDetailsNext} style={{ backgroundColor: primaryColor }}>
              Continua <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 4: Documents - added battery autonomy checkbox */}
        {currentStep === "documents" && (
          <div className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep("details")} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-1" /> Indietro
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documenti</CardTitle>
                <CardDescription>Carica i documenti richiesti per il noleggio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Patente (fronte) *</Label>
                  <label
                    className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer mt-1 transition-colors ${
                      licenseFront ? "border-green-500 bg-green-50" : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => setLicenseFront(e.target.files?.[0] || null)}
                    />
                    {licenseFront ? (
                      <div className="text-center">
                        <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-1" />
                        <p className="text-xs text-green-600">{licenseFront.name}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-muted-foreground">Tocca per caricare</p>
                      </div>
                    )}
                  </label>
                </div>

                <div>
                  <Label>Patente (retro)</Label>
                  <label
                    className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer mt-1 transition-colors ${
                      licenseBack ? "border-green-500 bg-green-50" : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => setLicenseBack(e.target.files?.[0] || null)}
                    />
                    {licenseBack ? (
                      <div className="text-center">
                        <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-1" />
                        <p className="text-xs text-green-600">{licenseBack.name}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-muted-foreground">Tocca per caricare</p>
                      </div>
                    )}
                  </label>
                </div>

                <div>
                  <Label>Documento identità (fronte) *</Label>
                  <label
                    className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer mt-1 transition-colors ${
                      idFront ? "border-green-500 bg-green-50" : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => setIdFront(e.target.files?.[0] || null)}
                    />
                    {idFront ? (
                      <div className="text-center">
                        <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-1" />
                        <p className="text-xs text-green-600">{idFront.name}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-muted-foreground">Tocca per caricare</p>
                      </div>
                    )}
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    Dichiaro di aver letto e accettato le{" "}
                    <span className="underline" style={{ color: primaryColor }}>
                      condizioni generali di noleggio
                    </span>{" "}
                    e l'informativa sulla privacy.
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="batteryAutonomy"
                    checked={batteryAutonomyAccepted}
                    onCheckedChange={(checked) => setBatteryAutonomyAccepted(checked as boolean)}
                  />
                  <label htmlFor="batteryAutonomy" className="text-sm leading-relaxed cursor-pointer">
                    <span className="font-medium">Dichiaro di essere consapevole che:</span>
                    <ul className="list-disc list-inside mt-1 text-muted-foreground">
                      <li>L'autonomia indicata ({selectedVehicle?.estimated_range_km || "–"} km) è stimata</li>
                      <li>L'autonomia reale può variare in base a stile di guida, percorso e condizioni</li>
                      <li>Batteria al ritiro: {selectedVehicle?.battery_level || "–"}%</li>
                    </ul>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={handleDocumentsNext}
              style={{ backgroundColor: primaryColor }}
            >
              Continua <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 5: Payment - shows battery info in summary */}
        {currentStep === "payment" && selectedVehicle && selectedPricing && (
          <div className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep("documents")} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-1" /> Indietro
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Riepilogo prenotazione</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {getTypeImages(selectedVehicle.vehicle_type)[0] ? (
                      <Image
                        src={getTypeImages(selectedVehicle.vehicle_type)[0] || "/placeholder.svg"}
                        alt={selectedVehicle.vehicle_type?.name || "Veicolo"}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Bike className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{selectedVehicle.vehicle_type?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Battery className="h-3 w-3" />
                      Batteria: {selectedVehicle.battery_level}% ({selectedVehicle.estimated_range_km} km)
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data ritiro</span>
                    <span>{pickupDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ora ritiro</span>
                    <span>{pickupTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente</span>
                    <span>
                      {customerData.firstName} {customerData.lastName}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Prezzo minimo</span>
                    <span>€{selectedPricing.minimum_charge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cauzione</span>
                    <span>€{selectedPricing.deposit}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-medium">
                    <span>Da pagare ora</span>
                    <span style={{ color: primaryColor }}>
                      €{(selectedPricing.minimum_charge || 0) + (selectedPricing.deposit || 0)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  L'importo finale sarà calcolato in base al tempo effettivo di utilizzo. La cauzione sarà sbloccata
                  dopo la verifica del veicolo.
                </p>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              disabled={isLoading}
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? "Elaborazione..." : "Paga e conferma"}
            </Button>
          </div>
        )}

        {/* Step 6: Confirmation */}
        {currentStep === "confirmation" && (
          <div className="text-center py-8">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <CheckCircle2 className="h-10 w-10" style={{ color: primaryColor }} />
            </div>

            <h2 className="text-2xl font-bold mb-2">Prenotazione confermata!</h2>
            <p className="text-muted-foreground mb-6">
              Riceverai un'email con il voucher e tutte le istruzioni per il ritiro.
            </p>

            <Card className="text-left">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Veicolo</span>
                  <span className="font-medium">{selectedVehicle?.vehicle_type?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data ritiro</span>
                  <span>
                    {pickupDate} alle {pickupTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Luogo</span>
                  <span>Reception {structure.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batteria al ritiro</span>
                  <span className="flex items-center gap-1">
                    <Battery className="h-4 w-4 text-green-500" />
                    {selectedVehicle?.battery_level}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground mt-6">
              <MapPin className="inline h-4 w-4 mr-1" />
              {structure.address}, {structure.city}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-lg mx-auto px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">Powered by 4BID Ecomobility</p>
        </div>
      </footer>
    </div>
  )
}

export { EcomobilityBookingPage }
export default EcomobilityBookingPage
