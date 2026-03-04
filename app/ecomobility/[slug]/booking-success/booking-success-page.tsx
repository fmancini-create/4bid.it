"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Calendar, Clock, Bike, MapPin, Download, QrCode, Mail, Phone } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface BookingSuccessPageProps {
  structure: any
  booking: any
}

const BookingSuccessPage = ({ structure, booking }: BookingSuccessPageProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")

  useEffect(() => {
    if (booking?.booking_code) {
      // Genera QR Code con API gratuita
      const qrData = JSON.stringify({
        code: booking.booking_code,
        structure: structure.slug,
        pickup: booking.pickup_datetime,
        vehicle: booking.vehicle?.name,
      })
      const encodedData = encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/ecomobility/${structure.slug}/verify/${booking.booking_code}`)
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`)
    }
  }, [booking, structure.slug])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const primaryColor = structure.primary_color || "#f97316"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href={`/ecomobility/${structure.slug}`}>
            <Image src="/ecomobility-logo.png" alt="4BID Ecomobility" width={120} height={60} />
          </Link>
          <span className="font-semibold" style={{ color: primaryColor }}>{structure.name}</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Banner */}
        <div className="text-center mb-8">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <CheckCircle className="h-10 w-10" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Prenotazione Confermata!</h1>
          <p className="text-muted-foreground">
            Il tuo pagamento è stato ricevuto. Ecco il tuo voucher digitale.
          </p>
        </div>

        {booking ? (
          <>
            {/* Voucher Card */}
            <Card className="mb-6 overflow-hidden">
              <div className="h-2" style={{ backgroundColor: primaryColor }} />
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">Voucher Noleggio</CardTitle>
                <CardDescription>Mostra questo QR code al momento del ritiro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* QR Code */}
                <div className="flex justify-center">
                  {qrCodeUrl ? (
                    <div className="p-4 bg-white border rounded-lg shadow-sm">
                      <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code Voucher" className="w-48 h-48" />
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Booking Code */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Codice Prenotazione</p>
                  <p className="text-3xl font-mono font-bold tracking-wider" style={{ color: primaryColor }}>
                    {booking.booking_code}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data Ritiro</p>
                      <p className="font-medium">{formatDate(booking.pickup_datetime)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ora Ritiro</p>
                      <p className="font-medium">{formatTime(booking.pickup_datetime)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Bike className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Veicolo</p>
                      <p className="font-medium">{booking.vehicle?.name}</p>
                      <p className="text-xs text-muted-foreground">{booking.vehicle?.vehicle_type?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Luogo</p>
                      <p className="font-medium">{structure.name}</p>
                      <p className="text-xs text-muted-foreground">{structure.city}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Intestato a</p>
                  <p className="font-medium">{booking.customer?.first_name} {booking.customer?.last_name}</p>
                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {booking.customer?.email}
                    </span>
                    {booking.customer?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {booking.customer?.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="pt-4 border-t flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Totale pagato</p>
                    <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                      €{((booking.estimated_amount || 0) + (booking.deposit_amount || 0)).toFixed(2)}
                    </p>
                    {booking.deposit_amount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Include cauzione €{booking.deposit_amount.toFixed(2)} (rimborsabile)
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Pagato
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => window.print()}>
                <Download className="h-4 w-4 mr-2" />
                Salva PDF
              </Button>
              <Link href={`/ecomobility/${structure.slug}`} className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  Nuova prenotazione
                </Button>
              </Link>
            </div>

            {/* Info */}
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Cosa fare al ritiro</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Presentati alla reception con questo voucher</li>
                  <li>Mostra il QR code o comunica il codice prenotazione</li>
                  <li>L'operatore verificherà i tuoi documenti</li>
                  <li>Riceverai le chiavi e le istruzioni del veicolo</li>
                </ol>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Pagamento ricevuto!</h2>
              <p className="text-muted-foreground mb-4">
                Riceverai una email di conferma con il tuo voucher digitale e il QR code per il ritiro.
              </p>
              <Link href={`/ecomobility/${structure.slug}`}>
                <Button style={{ backgroundColor: primaryColor }}>
                  Torna alla homepage
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Hai bisogno di assistenza?</p>
          <p>
            {structure.email && <a href={`mailto:${structure.email}`} className="underline">{structure.email}</a>}
            {structure.phone && <> | <a href={`tel:${structure.phone}`} className="underline">{structure.phone}</a></>}
          </p>
        </div>
      </main>
    </div>
  )
}

export { BookingSuccessPage }
export default BookingSuccessPage
