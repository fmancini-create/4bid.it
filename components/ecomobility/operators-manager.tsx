"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Users, UserPlus, Trash2, Mail, Loader2, ShieldCheck } from "lucide-react"

interface Operator {
  id: string
  email: string
  name: string | null
  role: string
  is_active: boolean
  created_at: string
}

interface Props {
  structureId: string
  primaryColor?: string
  // When false, the section is read-only (no invite/remove). Defaults to true.
  canManage?: boolean
}

export function OperatorsManager({ structureId, primaryColor = "#f97316", canManage = true }: Props) {
  const { toast } = useToast()
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", role: "operator" })

  const loadOperators = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ecomobility/admin/operators?structureId=${structureId}`)
      const data = await res.json()
      setOperators(data.operators || [])
    } catch {
      toast({ title: "Errore caricamento operatori", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (structureId) loadOperators()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureId])

  const inviteOperator = async () => {
    if (!form.email.trim()) {
      toast({ title: "Inserisci un'email", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/ecomobility/admin/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structureId,
          email: form.email.trim(),
          name: form.name.trim(),
          role: form.role,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: "Errore", description: data.error || "Impossibile invitare l'operatore", variant: "destructive" })
        return
      }
      toast({
        title: "Operatore invitato",
        description: data.emailSent
          ? "Email di invito inviata con il link per impostare la password."
          : "Operatore creato, ma l'invio dell'email di invito non è riuscito.",
      })
      setDialogOpen(false)
      setForm({ name: "", email: "", role: "operator" })
      loadOperators()
    } catch {
      toast({ title: "Errore di connessione", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const removeOperator = async (op: Operator) => {
    if (!confirm(`Disattivare l'accesso di ${op.name || op.email}?`)) return
    try {
      const res = await fetch(`/api/ecomobility/admin/operators?id=${op.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        toast({ title: "Errore", description: data.error, variant: "destructive" })
        return
      }
      toast({ title: "Operatore disattivato" })
      loadOperators()
    } catch {
      toast({ title: "Errore di connessione", variant: "destructive" })
    }
  }

  const activeOperators = operators.filter((o) => o.is_active)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Operatori
            </CardTitle>
            <CardDescription>
              Gestisci gli utenti che possono accedere alla dashboard di questa struttura
            </CardDescription>
          </div>
          {canManage && (
            <Button onClick={() => setDialogOpen(true)} style={{ backgroundColor: primaryColor }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invita operatore
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Caricamento...
          </div>
        ) : activeOperators.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nessun operatore. {canManage ? 'Invita il primo con "Invita operatore".' : ""}</p>
          </div>
        ) : (
          <div className="divide-y">
            {activeOperators.map((op) => (
              <div key={op.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted shrink-0">
                    {op.role === "admin" ? <ShieldCheck className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{op.name || op.email}</p>
                    <p className="text-sm text-muted-foreground truncate">{op.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={op.role === "admin" ? "default" : "secondary"}>
                    {op.role === "admin" ? "Admin" : "Operatore"}
                  </Badge>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOperator(op)}
                      aria-label="Disattiva operatore"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invita operatore</DialogTitle>
            <DialogDescription>
              Riceverà un'email con un link per impostare la propria password e accedere.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Mario Rossi"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="operatore@struttura.it"
              />
            </div>
            <div>
              <Label>Ruolo</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Operatore (gestione quotidiana)</SelectItem>
                  <SelectItem value="admin">Admin (può gestire gli operatori)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annulla
            </Button>
            <Button onClick={inviteOperator} disabled={saving} style={{ backgroundColor: primaryColor }}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              Invia invito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
