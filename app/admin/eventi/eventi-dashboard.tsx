"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Users, Calendar, Building2, CheckCircle, XCircle, Clock, Download, Trash2, RefreshCw } from "lucide-react"

interface Registration {
  id: string
  event_slug: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  company_name: string | null
  role: string | null
  num_guests: number
  brings_device: boolean
  dietary_notes: string | null
  notes: string | null
  status: string
  created_at: string
  updated_at: string
}

export default function EventiDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [events, setEvents] = useState<string[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchRegistrations = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("event_registrations")
        .select("*")
        .order("created_at", { ascending: false })

      if (selectedEvent !== "all") {
        query = query.eq("event_slug", selectedEvent)
      }

      const { data, error } = await query

      if (error) throw error
      setRegistrations(data || [])

      // Extract unique events
      if (data) {
        const uniqueEvents = [...new Set(data.map((r) => r.event_slug))]
        setEvents(uniqueEvents)
      }
    } catch (error) {
      console.error("Error fetching registrations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [selectedEvent])

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("event_registrations")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
      fetchRegistrations()
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const deleteRegistration = async () => {
    if (!deleteId) return
    try {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("id", deleteId)

      if (error) throw error
      setDeleteId(null)
      fetchRegistrations()
    } catch (error) {
      console.error("Error deleting registration:", error)
    }
  }

  const exportCSV = () => {
    const headers = [
      "Nome",
      "Cognome",
      "Email",
      "Telefono",
      "Azienda",
      "Ruolo",
      "Accompagnatori",
      "Porta Device",
      "Note Dietetiche",
      "Note",
      "Stato",
      "Data Registrazione",
    ]
    const rows = registrations.map((r) => [
      r.first_name,
      r.last_name,
      r.email,
      r.phone || "",
      r.company_name || "",
      r.role || "",
      r.num_guests.toString(),
      r.brings_device ? "Si" : "No",
      r.dietary_notes || "",
      r.notes || "",
      r.status,
      new Date(r.created_at).toLocaleDateString("it-IT"),
    ])

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n")

    const link = document.createElement("a")
    link.setAttribute("href", encodeURI(csvContent))
    link.setAttribute("download", `registrazioni-${selectedEvent || "tutti"}-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confermato</Badge>
      case "cancelled":
        return <Badge variant="destructive">Annullato</Badge>
      case "pending":
      default:
        return <Badge variant="secondary">In attesa</Badge>
    }
  }

  const stats = {
    total: registrations.length,
    confirmed: registrations.filter((r) => r.status === "confirmed").length,
    pending: registrations.filter((r) => r.status === "pending").length,
    cancelled: registrations.filter((r) => r.status === "cancelled").length,
    totalGuests: registrations.reduce((sum, r) => sum + (r.num_guests || 0), 0),
    withDevice: registrations.filter((r) => r.brings_device).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Registrazioni Eventi</h1>
          <p className="text-muted-foreground">Gestisci le iscrizioni agli eventi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRegistrations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Esporta CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confermati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.confirmed}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Attesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Annullati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{stats.cancelled}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accompagnatori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">+{stats.totalGuests}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Con Device</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{stats.withDevice}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtra per evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli eventi</SelectItem>
            {events.map((event) => (
              <SelectItem key={event} value={event}>
                {event}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Calendar className="h-12 w-12 mb-4" />
              <p>Nessuna registrazione trovata</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Azienda</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead className="text-center">Acc.</TableHead>
                    <TableHead className="text-center">Device</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">
                        {reg.first_name} {reg.last_name}
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${reg.email}`} className="text-primary hover:underline">
                          {reg.email}
                        </a>
                      </TableCell>
                      <TableCell>{reg.company_name || "-"}</TableCell>
                      <TableCell>{reg.role || "-"}</TableCell>
                      <TableCell className="text-center">{reg.num_guests > 0 ? `+${reg.num_guests}` : "-"}</TableCell>
                      <TableCell className="text-center">
                        {reg.brings_device ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={reg.status}
                          onValueChange={(value) => updateStatus(reg.id, value)}
                        >
                          <SelectTrigger className="w-[130px] h-8">
                            <SelectValue>{getStatusBadge(reg.status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">In attesa</SelectItem>
                            <SelectItem value="confirmed">Confermato</SelectItem>
                            <SelectItem value="cancelled">Annullato</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(reg.created_at).toLocaleDateString("it-IT")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(reg.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa registrazione? L'azione non puo' essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={deleteRegistration} className="bg-destructive text-destructive-foreground">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
