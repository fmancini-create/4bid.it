"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  FileText,
  User,
  Calendar,
  Bike,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
} from "lucide-react"

interface Structure {
  id: string
  name: string
  slug: string
}

interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  nationality: string
  license_type: string
  license_number: string
  license_expiry: string
  license_front_url: string
  license_back_url: string
  id_type: string
  id_number: string
  id_front_url: string
  documents_status: string
  documents_rejection_reason: string
}

interface DocumentItem {
  id: string
  booking_code: string
  pickup_date: string
  customer: Customer
}

interface Props {
  structures: Structure[]
}

export function DocumentVerificationPage({ structures }: Props) {
  const { toast } = useToast()
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(structures[0] || null)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [filterStatus, setFilterStatus] = useState("submitted")

  useEffect(() => {
    if (selectedStructure) {
      loadDocuments()
    }
  }, [selectedStructure, filterStatus])

  const loadDocuments = async () => {
    if (!selectedStructure) return
    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/ecomobility/admin/documents?structureId=${selectedStructure.id}&status=${filterStatus}`,
      )
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error("[v0] Error loading documents:", error)
      toast({ title: "Errore caricamento documenti", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (doc: DocumentItem) => {
    try {
      const response = await fetch("/api/ecomobility/admin/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: doc.customer.id,
          action: "approve",
          structureId: selectedStructure?.id,
          bookingId: doc.id,
        }),
      })

      if (!response.ok) throw new Error("Errore")

      toast({ title: "Documenti approvati con successo" })
      setSelectedDocument(null)
      loadDocuments()
    } catch (error) {
      toast({ title: "Errore durante l'approvazione", variant: "destructive" })
    }
  }

  const handleReject = async () => {
    if (!selectedDocument || !rejectionReason.trim()) {
      toast({ title: "Inserisci un motivo per il rifiuto", variant: "destructive" })
      return
    }

    try {
      const response = await fetch("/api/ecomobility/admin/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedDocument.customer.id,
          action: "reject",
          rejectionReason,
          structureId: selectedStructure?.id,
          bookingId: selectedDocument.id,
        }),
      })

      if (!response.ok) throw new Error("Errore")

      toast({ title: "Documenti rifiutati" })
      setRejectDialogOpen(false)
      setSelectedDocument(null)
      setRejectionReason("")
      loadDocuments()
    } catch (error) {
      toast({ title: "Errore durante il rifiuto", variant: "destructive" })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            In attesa
          </Badge>
        )
      case "submitted":
        return (
          <Badge variant="default" className="bg-orange-500">
            <FileText className="h-3 w-3 mr-1" />
            Da verificare
          </Badge>
        )
      case "verified":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verificato
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rifiutato
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <a href="/admin/ecomobility">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Dashboard
              </a>
            </Button>
            <h1 className="text-xl font-bold">Verifica Documenti</h1>

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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submitted">Da verificare</SelectItem>
                <SelectItem value="verified">Verificati</SelectItem>
                <SelectItem value="rejected">Rifiutati</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={loadDocuments} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Aggiorna
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {documents.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-muted-foreground">Nessun documento da verificare</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {doc.customer?.first_name} {doc.customer?.last_name}
                      </CardTitle>
                      <CardDescription>{doc.customer?.email}</CardDescription>
                    </div>
                    {getStatusBadge(doc.customer?.documents_status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Prenotazione: {doc.booking_code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bike className="h-4 w-4 text-muted-foreground" />
                      <span>Ritiro: {doc.pickup_date}</span>
                    </div>
                    {doc.customer?.license_type && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Patente: {doc.customer.license_type}</span>
                      </div>
                    )}
                  </div>

                  {doc.customer?.documents_status === "rejected" && doc.customer?.documents_rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-4 text-xs text-red-700">
                      <strong>Motivo rifiuto:</strong> {doc.customer.documents_rejection_reason}
                    </div>
                  )}

                  <Button className="w-full" onClick={() => setSelectedDocument(doc)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizza documenti
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Document Viewer Dialog */}
      <Dialog open={!!selectedDocument && !rejectDialogOpen} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Documenti di {selectedDocument?.customer?.first_name} {selectedDocument?.customer?.last_name}
            </DialogTitle>
            <DialogDescription>Verifica i documenti prima di approvare il noleggio</DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedDocument.customer?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefono</p>
                  <p className="font-medium">{selectedDocument.customer?.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data di nascita</p>
                  <p className="font-medium">{selectedDocument.customer?.date_of_birth || "N/D"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nazionalità</p>
                  <p className="font-medium">{selectedDocument.customer?.nationality || "N/D"}</p>
                </div>
              </div>

              {/* License Info */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Patente di guida
                </h4>
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-medium">{selectedDocument.customer?.license_type || "N/D"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Numero</p>
                    <p className="font-medium">{selectedDocument.customer?.license_number || "N/D"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Scadenza</p>
                    <p className="font-medium">{selectedDocument.customer?.license_expiry || "N/D"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedDocument.customer?.license_front_url ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Fronte</p>
                      <Image
                        src={selectedDocument.customer.license_front_url || "/placeholder.svg"}
                        alt="Patente fronte"
                        width={400}
                        height={250}
                        className="rounded-lg border w-full h-auto object-cover"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      Fronte non caricato
                    </div>
                  )}

                  {selectedDocument.customer?.license_back_url ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Retro</p>
                      <Image
                        src={selectedDocument.customer.license_back_url || "/placeholder.svg"}
                        alt="Patente retro"
                        width={400}
                        height={250}
                        className="rounded-lg border w-full h-auto object-cover"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                      Retro non caricato
                    </div>
                  )}
                </div>
              </div>

              {/* ID Document */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Documento di identità
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-medium">{selectedDocument.customer?.id_type || "N/D"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Numero</p>
                    <p className="font-medium">{selectedDocument.customer?.id_number || "N/D"}</p>
                  </div>
                </div>

                {selectedDocument.customer?.id_front_url ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Fronte</p>
                    <Image
                      src={selectedDocument.customer.id_front_url || "/placeholder.svg"}
                      alt="Documento fronte"
                      width={400}
                      height={250}
                      className="rounded-lg border w-full h-auto object-cover max-w-md"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    Documento non caricato
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setRejectDialogOpen(true)
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rifiuta
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedDocument)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approva
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta documenti</DialogTitle>
            <DialogDescription>Inserisci il motivo del rifiuto. Il cliente riceverà una notifica.</DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="es. Patente scaduta, foto illeggibile, documento non valido..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Conferma rifiuto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
