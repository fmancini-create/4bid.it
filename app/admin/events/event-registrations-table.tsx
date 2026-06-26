"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Download, Laptop, Check, X, Users } from "lucide-react"

interface Registration {
  id: string
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
}

export function EventRegistrationsTable({ registrations }: { registrations: Registration[] }) {
  const [search, setSearch] = useState("")

  const filtered = registrations.filter((r) => {
    const q = search.toLowerCase()
    return (
      r.first_name.toLowerCase().includes(q) ||
      r.last_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.company_name && r.company_name.toLowerCase().includes(q))
    )
  })

  const exportCsv = () => {
    const headers = [
      "Nome",
      "Cognome",
      "Email",
      "Telefono",
      "Struttura",
      "Ruolo",
      "Partecipanti",
      "Porta device",
      "Intolleranze",
      "Note",
      "Stato",
      "Data registrazione",
    ]
    const rows = filtered.map((r) => [
      r.first_name,
      r.last_name,
      r.email,
      r.phone || "",
      r.company_name || "",
      r.role || "",
      r.num_guests,
      r.brings_device ? "Si" : "No",
      r.dietary_notes || "",
      r.notes || "",
      r.status,
      new Date(r.created_at).toLocaleDateString("it-IT"),
    ])
    const csv = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "registrazioni-santaddeo.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const confirmedCount = filtered.filter((r) => r.status === "confirmed").length
  const withDevice = filtered.filter((r) => r.brings_device).length
  const totalGuests = filtered.reduce((sum, r) => sum + (r.num_guests || 1), 0)

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{confirmedCount}</p>
            <p className="text-xs text-muted-foreground">Confermati</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalGuests}</p>
            <p className="text-xs text-muted-foreground">Persone totali</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{withDevice}</p>
            <p className="text-xs text-muted-foreground">Con device</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {filtered.filter((r) => r.dietary_notes).length}
            </p>
            <p className="text-xs text-muted-foreground">Con esigenze alimentari</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Export */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome, email, struttura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-2" />
          Esporta CSV
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Struttura</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Ruolo</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">
                    <Users className="h-4 w-4 mx-auto" />
                  </th>
                  <th className="text-center p-3 font-medium text-muted-foreground">
                    <Laptop className="h-4 w-4 mx-auto" />
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Dieta</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Stato</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
                      {search ? "Nessun risultato" : "Nessuna registrazione ancora"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <p className="font-medium text-foreground">
                          {r.first_name} {r.last_name}
                        </p>
                        {r.phone && (
                          <p className="text-xs text-muted-foreground">{r.phone}</p>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{r.email}</td>
                      <td className="p-3 text-muted-foreground">{r.company_name || "-"}</td>
                      <td className="p-3 text-muted-foreground">{r.role || "-"}</td>
                      <td className="p-3 text-center">
                        <span className="font-medium">{r.num_guests}</span>
                      </td>
                      <td className="p-3 text-center">
                        {r.brings_device ? (
                          <Check className="h-4 w-4 text-teal-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground max-w-[120px] truncate">
                        {r.dietary_notes || "-"}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={r.status === "confirmed" ? "default" : r.status === "cancelled" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {r.status === "confirmed" ? "Confermato" : r.status === "cancelled" ? "Annullato" : "Waitlist"}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
