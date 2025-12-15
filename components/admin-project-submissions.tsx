"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, Clock, XCircle, Eye, Save, Reply } from "lucide-react"

type ProjectSubmission = {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  project_title: string
  project_description: string
  budget_range: string | null
  timeline: string | null
  interested_in_revenue_share: boolean
  status: string
  admin_notes: string | null
  created_at: string
}

export default function AdminProjectSubmissions({ submissions }: { submissions: ProjectSubmission[] }) {
  const safeSubmissions = submissions || []
  const [selectedSubmission, setSelectedSubmission] = useState<ProjectSubmission | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ProjectSubmission | null>(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            In Attesa
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Approvato
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rifiutato
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedSubmission) return

    setSaving(true)
    try {
      const response = await fetch(`/api/project-submissions/${selectedSubmission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_notes: adminNotes,
          status: status,
        }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Error saving notes:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleReply = async () => {
    if (!replyingTo || !replyMessage.trim()) return

    setSendingReply(true)
    try {
      const response = await fetch("/api/admin/reply-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: replyingTo.email,
          name: replyingTo.name,
          replyMessage: replyMessage,
        }),
      })

      if (response.ok) {
        alert("Risposta inviata con successo!")
        setReplyingTo(null)
        setReplyMessage("")
      } else {
        alert("Errore nell'invio della risposta")
      }
    } catch (error) {
      console.error("[v0] Error sending reply:", error)
      alert("Errore nell'invio della risposta")
    } finally {
      setSendingReply(false)
    }
  }

  const openDialog = (submission: ProjectSubmission) => {
    setSelectedSubmission(submission)
    setAdminNotes(submission.admin_notes || "")
    setStatus(submission.status)
  }

  const stats = {
    total: safeSubmissions.length,
    pending: safeSubmissions.filter((s) => s.status === "pending").length,
    approved: safeSubmissions.filter((s) => s.status === "approved").length,
    rejected: safeSubmissions.filter((s) => s.status === "rejected").length,
    revenueShare: safeSubmissions.filter((s) => s.interested_in_revenue_share).length,
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Proposte di Progetto</CardTitle>
          <CardDescription>Gestisci le richieste di progetto inviate tramite il form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Totale</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">In Attesa</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <p className="text-xs text-muted-foreground">Approvati</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-xs text-muted-foreground">Rifiutati</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{stats.revenueShare}</div>
                <p className="text-xs text-muted-foreground">Revenue Share</p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Progetto</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Revenue Share</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Nessuna proposta di progetto ricevuta
                    </TableCell>
                  </TableRow>
                ) : (
                  safeSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="text-sm">
                        {new Date(submission.created_at).toLocaleDateString("it-IT")}
                      </TableCell>
                      <TableCell className="font-medium">{submission.name}</TableCell>
                      <TableCell className="text-sm">{submission.email}</TableCell>
                      <TableCell className="max-w-xs truncate">{submission.project_title}</TableCell>
                      <TableCell className="text-sm">{submission.budget_range || "Non specificato"}</TableCell>
                      <TableCell>
                        {submission.interested_in_revenue_share ? (
                          <Badge variant="default" className="bg-blue-600">
                            Sì
                          </Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setReplyingTo(submission)} title="Rispondi">
                            <Reply className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDialog(submission)} title="Dettagli">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dettaglio Proposta Progetto</DialogTitle>
            <DialogDescription>Visualizza i dettagli completi e gestisci lo status della proposta</DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Nome</p>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Telefono</p>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.phone || "Non fornito"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Azienda</p>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.company || "Non fornita"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Titolo Progetto</p>
                <p className="text-sm text-muted-foreground">{selectedSubmission.project_title}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Descrizione Progetto</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedSubmission.project_description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Budget</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.budget_range || "Non specificato"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Timeline</p>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.timeline || "Non specificata"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Interessato a Revenue Share</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSubmission.interested_in_revenue_share ? "Sì, interessato" : "No"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Data Invio</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedSubmission.created_at).toLocaleString("it-IT")}
                </p>
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="pending">In Attesa</option>
                  <option value="approved">Approvato</option>
                  <option value="rejected">Rifiutato</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Note Amministratore</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Aggiungi note interne sulla valutazione del progetto..."
                  rows={4}
                />
              </div>

              <Button onClick={handleSaveNotes} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvataggio..." : "Salva Modifiche"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!replyingTo} onOpenChange={() => setReplyingTo(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rispondi a {replyingTo?.name}</DialogTitle>
            <DialogDescription>Invia una risposta via email a {replyingTo?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Progetto: {replyingTo?.project_title}</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{replyingTo?.project_description}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">La tua risposta:</label>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Scrivi qui la tua risposta..."
                rows={8}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReplyingTo(null)}>
                Annulla
              </Button>
              <Button
                onClick={handleReply}
                disabled={sendingReply || !replyMessage.trim()}
                className="bg-[#5B9BD5] hover:bg-[#4A90D9]"
              >
                <Reply className="w-4 h-4 mr-2" />
                {sendingReply ? "Invio..." : "Invia Risposta"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
