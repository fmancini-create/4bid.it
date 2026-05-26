"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import {
  Camera,
  CheckCircle2,
  Upload,
  Bike,
  Clock,
  AlertTriangle,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Info,
} from "lucide-react"

interface Props {
  structure: any
  booking: any
}

type PhotoType = "front" | "back" | "left" | "right"

const ReturnPage = ({ structure, booking }: Props) => {
  const { toast } = useToast()
  const [photos, setPhotos] = useState<Record<PhotoType, File | null>>({
    front: null,
    back: null,
    left: null,
    right: null,
  })
  const [damageNotes, setDamageNotes] = useState("")
  const [batteryLevelReturn, setBatteryLevelReturn] = useState<number>(50)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [finalAmount, setFinalAmount] = useState<number | null>(null)
  const [vehiclePostStatus, setVehiclePostStatus] = useState<{
    status: string
    estimatedAvailableTime: string | null
  } | null>(null)

  const primaryColor = structure.primary_color || "#f97316"
  const minBatteryThreshold = structure.min_battery_threshold || 40

  const allPhotosUploaded = photos.front && photos.back && photos.left && photos.right

  const handlePhotoUpload = (type: PhotoType, file: File | null) => {
    setPhotos((prev) => ({ ...prev, [type]: file }))
  }

  const getBatteryIcon = (level: number) => {
    if (level < 25) return <BatteryLow className="h-5 w-5 text-red-500" />
    if (level < 50) return <BatteryMedium className="h-5 w-5 text-yellow-500" />
    if (level < 75) return <BatteryMedium className="h-5 w-5 text-green-500" />
    return <BatteryFull className="h-5 w-5 text-green-500" />
  }

  const handleSubmit = async () => {
    if (!allPhotosUploaded) {
      toast({ title: "Carica tutte le 4 foto richieste", variant: "destructive" })
      return
    }

    setIsSubmitting(true)

    try {
      // Upload photos to storage
      const formData = new FormData()
      formData.append("bookingId", booking.id)
      formData.append("front", photos.front!)
      formData.append("back", photos.back!)
      formData.append("left", photos.left!)
      formData.append("right", photos.right!)
      formData.append("damageNotes", damageNotes)
      formData.append("batteryLevelReturn", batteryLevelReturn.toString())

      const response = await fetch("/api/ecomobility/return", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Errore durante la riconsegna")

      const data = await response.json()
      setFinalAmount(data.finalAmount)
      setVehiclePostStatus({
        status: data.vehicleStatus,
        estimatedAvailableTime: data.estimatedAvailableTime,
      })
      setIsCompleted(true)
    } catch (error) {
      toast({ title: "Errore durante la riconsegna", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calcola tempo trascorso
  const pickupTime = booking.actual_pickup_datetime
    ? new Date(booking.actual_pickup_datetime)
    : booking.actual_pickup_at
    ? new Date(booking.actual_pickup_at)
    : null
  const elapsedMinutes = pickupTime ? Math.floor((Date.now() - pickupTime.getTime()) / 60000) : 0
  const elapsedHours = Math.floor(elapsedMinutes / 60)
  const remainingMinutes = elapsedMinutes % 60

  const photoLabels: Record<PhotoType, string> = {
    front: "Fronte",
    back: "Retro",
    left: "Lato sinistro",
    right: "Lato destro",
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <Bike className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-semibold text-sm">{structure.name}</h1>
              <p className="text-xs text-muted-foreground">4BID Ecomobility</p>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <CheckCircle2 className="h-10 w-10" style={{ color: primaryColor }} />
            </div>

            <h2 className="text-2xl font-bold mb-2">Riconsegna completata!</h2>
            <p className="text-muted-foreground mb-6">Grazie per aver noleggiato con noi.</p>

            <Card className="text-left mb-6">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tempo di utilizzo</span>
                  <span className="font-medium">
                    {elapsedHours}h {remainingMinutes}min
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Batteria alla riconsegna</span>
                  <span className="font-medium flex items-center gap-1">
                    {getBatteryIcon(batteryLevelReturn)}
                    {batteryLevelReturn}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">Importo finale</span>
                  <span className="font-bold" style={{ color: primaryColor }}>
                    €{finalAmount?.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {vehiclePostStatus && vehiclePostStatus.status !== "available" && (
              <Card className="text-left mb-6 bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Veicolo in ricarica</p>
                      <p className="text-yellow-700">
                        Il livello batteria è sotto la soglia minima ({minBatteryThreshold}%). Il veicolo verrà messo in
                        ricarica.
                        {vehiclePostStatus.estimatedAvailableTime && (
                          <>
                            {" "}
                            Disponibilità stimata:{" "}
                            {new Date(vehiclePostStatus.estimatedAvailableTime).toLocaleString("it-IT")}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-sm text-muted-foreground">
              Riceverai un'email con il riepilogo del noleggio. La cauzione sarà sbloccata entro 5-7 giorni lavorativi.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <Bike className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-sm">{structure.name}</h1>
            <p className="text-xs text-muted-foreground">Riconsegna veicolo</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Timer */}
        <Card style={{ backgroundColor: `${primaryColor}10`, borderColor: primaryColor }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" style={{ color: primaryColor }} />
                <span className="font-medium">Tempo di utilizzo</span>
              </div>
              <span className="text-xl font-bold" style={{ color: primaryColor }}>
                {elapsedHours}h {remainingMinutes}min
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Bike className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <p className="font-medium">{booking.vehicle?.vehicle_type?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.vehicle?.brand} {booking.vehicle?.model}
                </p>
                <p className="text-xs text-muted-foreground">Codice: {booking.booking_code}</p>
                {booking.battery_level_pickup && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Battery className="h-3 w-3" />
                    Batteria al ritiro: {booking.battery_level_pickup}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Battery className="h-5 w-5" />
              Livello batteria
            </CardTitle>
            <CardDescription>Indica il livello di carica attuale del veicolo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">0%</span>
              <div className="flex items-center gap-2">
                {getBatteryIcon(batteryLevelReturn)}
                <span
                  className="text-2xl font-bold"
                  style={{
                    color: batteryLevelReturn < minBatteryThreshold ? "#ef4444" : primaryColor,
                  }}
                >
                  {batteryLevelReturn}%
                </span>
              </div>
              <span className="text-sm text-muted-foreground">100%</span>
            </div>

            <Slider
              value={[batteryLevelReturn]}
              onValueChange={(value) => setBatteryLevelReturn(value[0])}
              max={100}
              step={5}
              className="w-full"
            />

            {/* Battery level ranges */}
            <div className="grid grid-cols-4 gap-2 text-xs text-center">
              {[
                { range: "0-25%", label: "Quasi scarico", color: "text-red-600 bg-red-50" },
                { range: "25-50%", label: "Basso", color: "text-yellow-600 bg-yellow-50" },
                { range: "50-75%", label: "Medio", color: "text-green-600 bg-green-50" },
                { range: "75-100%", label: "Alto", color: "text-green-600 bg-green-50" },
              ].map((item, i) => (
                <button
                  key={item.range}
                  type="button"
                  onClick={() => setBatteryLevelReturn([12, 37, 62, 87][i])}
                  className={`p-2 rounded-lg border transition-colors ${item.color} hover:opacity-80`}
                >
                  <p className="font-medium">{item.range}</p>
                  <p className="text-muted-foreground">{item.label}</p>
                </button>
              ))}
            </div>

            {/* Warning if below threshold */}
            {batteryLevelReturn < minBatteryThreshold && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-700">
                  Il livello batteria è sotto la soglia minima ({minBatteryThreshold}%). Il veicolo verrà
                  automaticamente messo in ricarica dopo la riconsegna.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Foto del veicolo
            </CardTitle>
            <CardDescription>Scatta 4 foto del veicolo da ogni lato prima di riconsegnarlo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(photoLabels) as PhotoType[]).map((type) => (
                <label
                  key={type}
                  className={`flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    photos[type] ? "border-green-500 bg-green-50" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(type, e.target.files?.[0] || null)}
                  />
                  {photos[type] ? (
                    <div className="text-center">
                      <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-1" />
                      <p className="text-xs text-green-600 font-medium">{photoLabels[type]}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                      <p className="text-xs text-muted-foreground">{photoLabels[type]}</p>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Damage Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Segnalazione danni
            </CardTitle>
            <CardDescription>Segnala eventuali danni o anomalie riscontrate (opzionale)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Descrivi eventuali danni o problemi..."
              value={damageNotes}
              onChange={(e) => setDamageNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={!allPhotosUploaded || isSubmitting}
          style={{ backgroundColor: primaryColor }}
        >
          {isSubmitting ? (
            "Elaborazione..."
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Completa riconsegna
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Una volta completata la riconsegna, l'importo finale sarà calcolato automaticamente in base al tempo effettivo
          di utilizzo.
        </p>
      </main>
    </div>
  )
}

export { ReturnPage }
export default ReturnPage
