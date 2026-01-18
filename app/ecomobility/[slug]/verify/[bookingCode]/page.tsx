import { createAdminClient } from "@/lib/supabase/server-admin"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Calendar, Bike, User, FileText, Battery } from "lucide-react"
import Image from "next/image"

export default async function VerifyBookingPage({ 
  params 
}: { 
  params: Promise<{ slug: string; bookingCode: string }>
}) {
  const { slug, bookingCode } = await params
  
  const supabase = createAdminClient()

  // Recupera struttura
  const { data: structure } = await supabase
    .from("ecomobility_structures")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!structure) {
    notFound()
  }

  // Recupera prenotazione
  const { data: booking } = await supabase
    .from("ecomobility_bookings")
    .select(`
      *,
      customer:ecomobility_customers(*),
      vehicle:ecomobility_vehicles(*, vehicle_type:ecomobility_vehicle_types(*))
    `)
    .eq("booking_code", bookingCode)
    .eq("structure_id", structure.id)
    .single()

  const primaryColor = structure.primary_color || "#f97316"

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus !== "paid") {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Non pagato</Badge>
    }
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Confermato</Badge>
      case "in_progress":
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" /> In corso</Badge>
      case "completed":
        return <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" /> Completato</Badge>
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Annullato</Badge>
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> In attesa</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <Image 
            src="https://www.4bid.it/_next/image?url=%2Flogo.png&w=128&q=75" 
            alt="4BID" 
            width={80} 
            height={32} 
            className="mx-auto mb-2"
          />
          <p className="text-sm text-muted-foreground">{structure.name}</p>
        </div>

        {booking ? (
          <Card>
            <div className="h-2" style={{ backgroundColor: primaryColor }} />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Verifica Prenotazione</CardTitle>
                {getStatusBadge(booking.status, booking.payment_status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Booking Code */}
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Codice</p>
                <p className="text-2xl font-mono font-bold" style={{ color: primaryColor }}>
                  {booking.booking_code}
                </p>
              </div>

              {/* Customer */}
              <div className="flex items-start gap-3 p-3 bg-white border rounded-lg">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{booking.customer?.first_name} {booking.customer?.last_name}</p>
                  <p className="text-sm text-muted-foreground">{booking.customer?.email}</p>
                  {booking.customer?.phone && (
                    <p className="text-sm text-muted-foreground">{booking.customer?.phone}</p>
                  )}
                  {booking.customer?.room_number && (
                    <p className="text-sm">Camera: <strong>{booking.customer?.room_number}</strong></p>
                  )}
                </div>
                <Badge variant={booking.customer?.documents_verified ? "default" : "destructive"}>
                  <FileText className="h-3 w-3 mr-1" />
                  {booking.customer?.documents_verified ? "Verificato" : "Da verificare"}
                </Badge>
              </div>

              {/* Vehicle */}
              <div className="flex items-start gap-3 p-3 bg-white border rounded-lg">
                <Bike className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{booking.vehicle?.name}</p>
                  <p className="text-sm text-muted-foreground">{booking.vehicle?.vehicle_type?.name}</p>
                  <p className="text-xs font-mono">{booking.vehicle?.code}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Battery className="h-4 w-4" />
                  <span className="text-sm font-medium">{booking.vehicle?.battery_level || 100}%</span>
                </div>
              </div>

              {/* DateTime */}
              <div className="flex items-start gap-3 p-3 bg-white border rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Ritiro previsto</p>
                  <p className="font-medium">{formatDateTime(booking.pickup_datetime)}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Importo</p>
                  <p className="text-xl font-bold text-green-700">
                    €{(booking.estimated_amount || 0).toFixed(2)}
                  </p>
                </div>
                {booking.deposit_amount > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Cauzione</p>
                    <p className="font-medium">€{booking.deposit_amount.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Actions hint */}
              {booking.status === "confirmed" && booking.payment_status === "paid" && (
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-green-600 font-medium">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Prenotazione valida - Procedi con il ritiro
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Prenotazione non trovata</h2>
              <p className="text-muted-foreground">
                Il codice <strong>{bookingCode}</strong> non corrisponde a nessuna prenotazione valida.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
