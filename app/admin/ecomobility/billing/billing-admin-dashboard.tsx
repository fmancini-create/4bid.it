"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  CreditCard, 
  Building2, 
  FileText, 
  Euro,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Download
} from "lucide-react"
import Link from "next/link"

interface Plan {
  id: string
  name: string
  description: string
  monthly_fee: number
  annual_fee: number
  device_fee_monthly: number
  transaction_fee_pct: number
  max_vehicles: number | null
  max_devices: number | null
  features: string[]
  is_active: boolean
}

interface Subscription {
  id: string
  plan_id: string
  status: string
  billing_cycle: string
  current_period_start: string
  current_period_end: string
  plan: Plan
}

interface Structure {
  id: string
  name: string
  slug: string
  email: string
  city: string
  is_active: boolean
  subscription: Subscription[]
}

interface Invoice {
  id: string
  invoice_number: string
  period_start: string
  period_end: string
  platform_fee: number
  devices_fee: number
  transactions_fee: number
  subtotal: number
  vat_amount: number
  total: number
  status: string
  due_date: string
  structure: { name: string; slug: string }
}

interface BillingAdminDashboardProps {
  plans: Plan[]
  structures: Structure[]
  invoices: Invoice[]
}

export function BillingAdminDashboard({ plans: initialPlans, structures: initialStructures, invoices: initialInvoices }: BillingAdminDashboardProps) {
  const { toast } = useToast()
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [structures] = useState<Structure[]>(initialStructures)
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    monthly_fee: 49,
    annual_fee: 490,
    device_fee_monthly: 5,
    transaction_fee_pct: 5,
    max_vehicles: 5,
    max_devices: 5,
    features: [] as string[],
    is_active: true
  })

  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({
    structure_id: "",
    period_start: "",
    period_end: "",
    platform_fee: 0,
    devices_fee: 0,
    transactions_fee: 0,
    notes: ""
  })

  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)
  const [subscriptionForm, setSubscriptionForm] = useState({
    structure_id: "",
    plan_id: "",
    billing_cycle: "monthly",
    status: "active"
  })

  // Stats
  const activeSubscriptions = structures.filter(s => s.subscription?.[0]?.status === "active").length
  const totalMRR = structures.reduce((sum, s) => {
    const sub = s.subscription?.[0]
    if (sub?.status === "active") {
      return sum + (sub.plan?.monthly_fee || 0)
    }
    return sum
  }, 0)
  const pendingInvoices = invoices.filter(i => i.status === "sent" || i.status === "overdue").length
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.total, 0)

  const handleSavePlan = async () => {
    try {
      const res = await fetch("/api/ecomobility/admin/plans", {
        method: editingPlan ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlan ? { ...planForm, id: editingPlan.id } : planForm)
      })
      
      if (!res.ok) throw new Error("Errore salvataggio")
      
      const data = await res.json()
      
      if (editingPlan) {
        setPlans(plans.map(p => p.id === editingPlan.id ? data : p))
      } else {
        setPlans([...plans, data])
      }
      
      setShowPlanDialog(false)
      setEditingPlan(null)
      toast({ title: "Successo", description: editingPlan ? "Piano aggiornato" : "Piano creato" })
    } catch {
      toast({ title: "Errore", description: "Impossibile salvare il piano", variant: "destructive" })
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Eliminare questo piano?")) return
    
    try {
      const res = await fetch(`/api/ecomobility/admin/plans?id=${planId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Errore eliminazione")
      
      setPlans(plans.filter(p => p.id !== planId))
      toast({ title: "Successo", description: "Piano eliminato" })
    } catch {
      toast({ title: "Errore", description: "Impossibile eliminare il piano", variant: "destructive" })
    }
  }

  const handleCreateInvoice = async () => {
    try {
      const res = await fetch("/api/ecomobility/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceForm)
      })
      
      if (!res.ok) throw new Error("Errore creazione")
      
      const data = await res.json()
      setInvoices([data, ...invoices])
      setShowInvoiceDialog(false)
      toast({ title: "Successo", description: "Fattura creata" })
    } catch {
      toast({ title: "Errore", description: "Impossibile creare la fattura", variant: "destructive" })
    }
  }

  const handleUpdateInvoiceStatus = async (invoiceId: string, status: string) => {
    try {
      const res = await fetch("/api/ecomobility/admin/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invoiceId, status })
      })
      
      if (!res.ok) throw new Error("Errore aggiornamento")
      
      setInvoices(invoices.map(i => i.id === invoiceId ? { ...i, status } : i))
      toast({ title: "Successo", description: "Stato fattura aggiornato" })
    } catch {
      toast({ title: "Errore", description: "Impossibile aggiornare la fattura", variant: "destructive" })
    }
  }

  const handleAssignSubscription = async () => {
    try {
      const res = await fetch("/api/ecomobility/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscriptionForm)
      })
      
      if (!res.ok) throw new Error("Errore assegnazione")
      
      setShowSubscriptionDialog(false)
      toast({ title: "Successo", description: "Abbonamento assegnato. Ricarica la pagina per vedere i cambiamenti." })
    } catch {
      toast({ title: "Errore", description: "Impossibile assegnare l'abbonamento", variant: "destructive" })
    }
  }

  const openEditPlan = (plan: Plan) => {
    setEditingPlan(plan)
    setPlanForm({
      name: plan.name,
      description: plan.description || "",
      monthly_fee: plan.monthly_fee,
      annual_fee: plan.annual_fee || plan.monthly_fee * 10,
      device_fee_monthly: plan.device_fee_monthly,
      transaction_fee_pct: plan.transaction_fee_pct,
      max_vehicles: plan.max_vehicles || 0,
      max_devices: plan.max_devices || 0,
      features: plan.features || [],
      is_active: plan.is_active
    })
    setShowPlanDialog(true)
  }

  const openNewPlan = () => {
    setEditingPlan(null)
    setPlanForm({
      name: "",
      description: "",
      monthly_fee: 49,
      annual_fee: 490,
      device_fee_monthly: 5,
      transaction_fee_pct: 5,
      max_vehicles: 5,
      max_devices: 5,
      features: [],
      is_active: true
    })
    setShowPlanDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800">Attivo</Badge>
      case "trial": return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>
      case "suspended": return <Badge className="bg-yellow-100 text-yellow-800">Sospeso</Badge>
      case "cancelled": return <Badge className="bg-red-100 text-red-800">Cancellato</Badge>
      case "paid": return <Badge className="bg-green-100 text-green-800">Pagata</Badge>
      case "sent": return <Badge className="bg-blue-100 text-blue-800">Inviata</Badge>
      case "overdue": return <Badge className="bg-red-100 text-red-800">Scaduta</Badge>
      case "draft": return <Badge className="bg-gray-100 text-gray-800">Bozza</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/ecomobility">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Gestione Abbonamenti e Fatturazione</h1>
            <p className="text-muted-foreground">Pannello amministrativo 4BID Ecomobility</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Abbonamenti attivi</p>
                <p className="text-2xl font-bold">{activeSubscriptions}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">MRR (Ricavi mensili)</p>
                <p className="text-2xl font-bold">€{totalMRR.toFixed(2)}</p>
              </div>
              <Euro className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Fatture da incassare</p>
                <p className="text-2xl font-bold">{pendingInvoices}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Totale incassato</p>
                <p className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans">
        <TabsList className="grid grid-cols-4 w-full max-w-xl mb-6">
          <TabsTrigger value="plans">
            <CreditCard className="h-4 w-4 mr-2" />
            Piani
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <Building2 className="h-4 w-4 mr-2" />
            Abbonamenti
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            Fatture
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Euro className="h-4 w-4 mr-2" />
            Report
          </TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Piani di abbonamento</CardTitle>
                  <CardDescription>Gestisci i piani disponibili per le strutture</CardDescription>
                </div>
                <Button onClick={openNewPlan}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo piano
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className={!plan.is_active ? "opacity-50" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditPlan(plan)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-3xl font-bold">€{plan.monthly_fee}<span className="text-sm font-normal">/mese</span></p>
                        <p className="text-sm text-muted-foreground">o €{plan.annual_fee}/anno</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Max veicoli:</span>
                          <span className="font-medium">{plan.max_vehicles || "Illimitati"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fee dispositivo:</span>
                          <span className="font-medium">€{plan.device_fee_monthly}/mese</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fee transazioni:</span>
                          <span className="font-medium">{plan.transaction_fee_pct}%</span>
                        </div>
                      </div>
                      {!plan.is_active && <Badge variant="secondary">Disattivato</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Abbonamenti strutture</CardTitle>
                  <CardDescription>Gestisci gli abbonamenti delle strutture clienti</CardDescription>
                </div>
                <Button onClick={() => setShowSubscriptionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Assegna abbonamento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Struttura</TableHead>
                    <TableHead>Città</TableHead>
                    <TableHead>Piano</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Scadenza</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structures.map((structure) => {
                    const sub = structure.subscription?.[0]
                    return (
                      <TableRow key={structure.id}>
                        <TableCell className="font-medium">{structure.name}</TableCell>
                        <TableCell>{structure.city}</TableCell>
                        <TableCell>{sub?.plan?.name || "-"}</TableCell>
                        <TableCell>{sub ? getStatusBadge(sub.status) : <Badge variant="outline">Nessuno</Badge>}</TableCell>
                        <TableCell>{sub?.billing_cycle === "annual" ? "Annuale" : "Mensile"}</TableCell>
                        <TableCell>{sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("it-IT") : "-"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSubscriptionForm({
                              structure_id: structure.id,
                              plan_id: sub?.plan_id || "",
                              billing_cycle: sub?.billing_cycle || "monthly",
                              status: sub?.status || "active"
                            })
                            setShowSubscriptionDialog(true)
                          }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fatture</CardTitle>
                  <CardDescription>Gestisci le fatture alle strutture clienti</CardDescription>
                </div>
                <Button onClick={() => setShowInvoiceDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova fattura
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N. Fattura</TableHead>
                    <TableHead>Struttura</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Totale</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Scadenza</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nessuna fattura presente
                      </TableCell>
                    </TableRow>
                  ) : invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.structure?.name}</TableCell>
                      <TableCell>{new Date(invoice.period_start).toLocaleDateString("it-IT")} - {new Date(invoice.period_end).toLocaleDateString("it-IT")}</TableCell>
                      <TableCell className="font-bold">€{invoice.total.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("it-IT") : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {invoice.status === "draft" && (
                            <Button variant="ghost" size="icon" onClick={() => handleUpdateInvoiceStatus(invoice.id, "sent")} title="Invia">
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {(invoice.status === "sent" || invoice.status === "overdue") && (
                            <Button variant="ghost" size="icon" onClick={() => handleUpdateInvoiceStatus(invoice.id, "paid")} title="Segna come pagata">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Scarica PDF">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ricavi per piano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plans.map((plan) => {
                    const subsCount = structures.filter(s => s.subscription?.[0]?.plan_id === plan.id && s.subscription?.[0]?.status === "active").length
                    const revenue = subsCount * plan.monthly_fee
                    return (
                      <div key={plan.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">{subsCount} abbonamenti attivi</p>
                        </div>
                        <p className="text-xl font-bold">€{revenue.toFixed(2)}/mese</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Stato fatture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Pagate</span>
                    </div>
                    <p className="font-bold">{invoices.filter(i => i.status === "paid").length}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Send className="h-5 w-5 text-blue-500" />
                      <span>Inviate</span>
                    </div>
                    <p className="font-bold">{invoices.filter(i => i.status === "sent").length}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span>Scadute</span>
                    </div>
                    <p className="font-bold">{invoices.filter(i => i.status === "overdue").length}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <span>Bozze</span>
                    </div>
                    <p className="font-bold">{invoices.filter(i => i.status === "draft").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Modifica piano" : "Nuovo piano"}</DialogTitle>
            <DialogDescription>Configura i dettagli del piano di abbonamento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome piano *</Label>
              <Input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Descrizione</Label>
              <Textarea value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Canone mensile (€) *</Label>
                <Input type="number" value={planForm.monthly_fee} onChange={(e) => setPlanForm({ ...planForm, monthly_fee: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label>Canone annuale (€)</Label>
                <Input type="number" value={planForm.annual_fee} onChange={(e) => setPlanForm({ ...planForm, annual_fee: parseFloat(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fee dispositivo (€/mese)</Label>
                <Input type="number" value={planForm.device_fee_monthly} onChange={(e) => setPlanForm({ ...planForm, device_fee_monthly: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label>Fee transazioni (%)</Label>
                <Input type="number" value={planForm.transaction_fee_pct} onChange={(e) => setPlanForm({ ...planForm, transaction_fee_pct: parseFloat(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max veicoli (0=illimitati)</Label>
                <Input type="number" value={planForm.max_vehicles} onChange={(e) => setPlanForm({ ...planForm, max_vehicles: parseInt(e.target.value) })} />
              </div>
              <div>
                <Label>Max dispositivi (0=illimitati)</Label>
                <Input type="number" value={planForm.max_devices} onChange={(e) => setPlanForm({ ...planForm, max_devices: parseInt(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>Annulla</Button>
            <Button onClick={handleSavePlan}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuova fattura</DialogTitle>
            <DialogDescription>Crea una nuova fattura per una struttura</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Struttura *</Label>
              <Select value={invoiceForm.structure_id} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, structure_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona struttura" />
                </SelectTrigger>
                <SelectContent>
                  {structures.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Inizio periodo *</Label>
                <Input type="date" value={invoiceForm.period_start} onChange={(e) => setInvoiceForm({ ...invoiceForm, period_start: e.target.value })} />
              </div>
              <div>
                <Label>Fine periodo *</Label>
                <Input type="date" value={invoiceForm.period_end} onChange={(e) => setInvoiceForm({ ...invoiceForm, period_end: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Canone (€)</Label>
                <Input type="number" value={invoiceForm.platform_fee} onChange={(e) => setInvoiceForm({ ...invoiceForm, platform_fee: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label>Dispositivi (€)</Label>
                <Input type="number" value={invoiceForm.devices_fee} onChange={(e) => setInvoiceForm({ ...invoiceForm, devices_fee: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label>Transazioni (€)</Label>
                <Input type="number" value={invoiceForm.transactions_fee} onChange={(e) => setInvoiceForm({ ...invoiceForm, transactions_fee: parseFloat(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Note</Label>
              <Textarea value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>Annulla</Button>
            <Button onClick={handleCreateInvoice}>Crea fattura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assegna abbonamento</DialogTitle>
            <DialogDescription>Assegna o modifica l'abbonamento di una struttura</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Struttura *</Label>
              <Select value={subscriptionForm.structure_id} onValueChange={(v) => setSubscriptionForm({ ...subscriptionForm, structure_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona struttura" />
                </SelectTrigger>
                <SelectContent>
                  {structures.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Piano *</Label>
              <Select value={subscriptionForm.plan_id} onValueChange={(v) => setSubscriptionForm({ ...subscriptionForm, plan_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona piano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.is_active).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} - €{p.monthly_fee}/mese</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ciclo di fatturazione</Label>
              <Select value={subscriptionForm.billing_cycle} onValueChange={(v) => setSubscriptionForm({ ...subscriptionForm, billing_cycle: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensile</SelectItem>
                  <SelectItem value="annual">Annuale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stato</Label>
              <Select value={subscriptionForm.status} onValueChange={(v) => setSubscriptionForm({ ...subscriptionForm, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Attivo</SelectItem>
                  <SelectItem value="suspended">Sospeso</SelectItem>
                  <SelectItem value="cancelled">Cancellato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)}>Annulla</Button>
            <Button onClick={handleAssignSubscription}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
