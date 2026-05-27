"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  RefreshCw,
  Lock,
  MapPin,
  Battery,
  Activity,
  Signal,
  SignalZero,
  Clock,
  Link2,
  Unlink,
} from "lucide-react"

interface Structure {
  id: string
  name: string
  slug: string
  primary_color?: string
}

interface Vehicle {
  id: string
  internal_code: string
  brand: string | null
  model: string | null
  vehicle_type?: { name: string } | null
}

interface BalinDeviceRow {
  imei: string
  name?: string | null
  model?: string | null
  is_connected?: boolean | null
  is_moving?: boolean | null
  battery_level?: number | null
  battery_voltage?: number | null
  odometer_km?: number | null
  last_position_at?: string | null
  last_position?: { lat: number; lng: number } | null
  local: {
    id: string
    vehicle_id: string | null
    last_synced_at: string | null
  } | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatRelative(iso?: string | null) {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return "ora"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min fa`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h fa`
  return new Date(iso).toLocaleDateString("it-IT")
}

export function DevicesDashboard({
  structure,
  vehicles,
}: {
  structure: Structure
  vehicles: Vehicle[]
}) {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const auth = sessionStorage.getItem(`ecomobility_auth_${structure.id}`)
    setAuthed(!!auth)
  }, [structure.id])

  const { data, isLoading, mutate } = useSWR<{
    devices: BalinDeviceRow[]
    total: number
    error?: string
  }>(authed ? "/api/ecomobility/admin/balin/devices" : null, fetcher, {
    refreshInterval: 30_000,
  })

  if (authed === null) return null
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Lock className="h-5 w-5" />
            </div>
            <CardTitle>Accesso richiesto</CardTitle>
            <CardDescription>Effettua il login alla dashboard per gestire i tracker.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/ecomobility/${structure.slug}/admin`}>Vai al login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const devices = data?.devices || []
  const linked = devices.filter((d: BalinDeviceRow) => d.local?.vehicle_id).length
  const unlinked = devices.length - linked

  async function handleLink(imei: string, model: string | null | undefined, vehicleId: string | null) {
    try {
      const res = await fetch("/api/ecomobility/admin/balin/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imei,
          vehicleId: vehicleId || null,
          structureId: structure.id,
          model: model || undefined,
          action: vehicleId ? "link" : "unlink",
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || "errore")
      toast({ title: vehicleId ? "Tracker associato" : "Associazione rimossa" })
      mutate()
    } catch (e: any) {
      toast({ title: "Errore", description: e.message, variant: "destructive" })
    }
  }

  async function triggerSync() {
    try {
      const res = await fetch("/api/cron/balin-sync", { method: "GET" })
      const json = await res.json()
      toast({
        title: json.success ? "Sync eseguita" : "Errore sync",
        description: json.success
          ? `Aggiornati ${json.updated || 0} device`
          : json.error || "errore",
        variant: json.success ? "default" : "destructive",
      })
      mutate()
    } catch (e: any) {
      toast({ title: "Errore sync", description: e.message, variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/ecomobility/${structure.slug}/admin`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Tracker GPS</h1>
              <p className="text-xs text-muted-foreground">
                {structure.name} · provider Balin.app
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={triggerSync} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Sync ora
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Device totali</CardDescription>
              <CardTitle className="text-3xl">{devices.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Associati a un veicolo</CardDescription>
              <CardTitle className="text-3xl text-green-600">{linked}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Da configurare</CardDescription>
              <CardTitle className="text-3xl text-amber-600">{unlinked}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {data?.error && (
          <Card className="border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Errore Balin API</CardTitle>
              <CardDescription>
                {data.error === "balin_credentials_missing"
                  ? "Mancano le variabili BALIN_EMAIL / BALIN_API_TOKEN nel progetto."
                  : data.error}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Device live</CardTitle>
            <CardDescription>
              Stato direttamente da Balin.app. La sync automatica gira ogni 5 minuti.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Batteria</TableHead>
                    <TableHead>Posizione</TableHead>
                    <TableHead>Ultimo dato</TableHead>
                    <TableHead className="min-w-[260px]">Veicolo associato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nessun device trovato sull&apos;account Balin.app
                      </TableCell>
                    </TableRow>
                  )}
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />
                        Caricamento...
                      </TableCell>
                    </TableRow>
                  )}
                    {devices.map((d: BalinDeviceRow) => {
                    const battery =
                      d.battery_level != null
                        ? `${d.battery_level}%`
                        : d.battery_voltage != null
                        ? `${(d.battery_voltage / 1000).toFixed(2)} V`
                        : "—"
                    const batteryColor =
                      d.battery_level != null && d.battery_level < 30
                        ? "text-red-600"
                        : d.battery_level != null && d.battery_level < 60
                        ? "text-amber-600"
                        : "text-green-600"
                    return (
                      <TableRow key={d.imei}>
                        <TableCell>
                          <div className="font-mono text-xs">{d.imei}</div>
                          {d.model && (
                            <div className="text-xs text-muted-foreground">{d.model}</div>
                          )}
                          {d.name && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {d.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={d.is_connected ? "default" : "secondary"}
                              className="w-fit gap-1"
                            >
                              {d.is_connected ? (
                                <Signal className="h-3 w-3" />
                              ) : (
                                <SignalZero className="h-3 w-3" />
                              )}
                              {d.is_connected ? "Online" : "Offline"}
                            </Badge>
                            {d.is_moving && (
                              <Badge variant="outline" className="w-fit gap-1 text-blue-600">
                                <Activity className="h-3 w-3" /> In movimento
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 font-medium ${batteryColor}`}>
                            <Battery className="h-4 w-4" /> {battery}
                          </div>
                          {d.odometer_km != null && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {d.odometer_km.toFixed(0)} km
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {d.last_position ? (
                            <a
                              href={`https://www.google.com/maps?q=${d.last_position.lat},${d.last_position.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm"
                            >
                              <MapPin className="h-3 w-3" />
                              {d.last_position.lat.toFixed(4)}, {d.last_position.lng.toFixed(4)}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatRelative(d.last_position_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={d.local?.vehicle_id || "none"}
                              onValueChange={(v) =>
                                handleLink(d.imei, d.model, v === "none" ? null : v)
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Non associato" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">— Non associato —</SelectItem>
                                {vehicles.map((v) => (
                                  <SelectItem key={v.id} value={v.id}>
                                    {v.internal_code}
                                    {v.brand || v.model
                                      ? ` · ${[v.brand, v.model].filter(Boolean).join(" ")}`
                                      : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {d.local?.vehicle_id ? (
                              <Link2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Unlink className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
