"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2 } from "lucide-react"

export default function ProjectIdeaForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    projectTitle: "",
    projectDescription: "",
    budgetRange: "",
    timeline: "",
    interestedInRevenueShare: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/project-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          project_title: formData.projectTitle,
          project_description: formData.projectDescription,
          budget_range: formData.budgetRange,
          timeline: formData.timeline,
          interested_in_revenue_share: formData.interestedInRevenueShare,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("[v0] Error submitting project idea:", error)
        alert("Si è verificato un errore. Riprova più tardi.")
        return
      }

      setIsSuccess(true)
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        projectTitle: "",
        projectDescription: "",
        budgetRange: "",
        timeline: "",
        interestedInRevenueShare: false,
      })
    } catch (error) {
      console.error("[v0] Error:", error)
      alert("Si è verificato un errore. Riprova più tardi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="border-2 border-[#5B9BD5]">
        <CardContent className="pt-12 pb-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-[#5B9BD5] mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-foreground mb-4">Richiesta Inviata con Successo!</h3>
          <p className="text-lg text-muted-foreground mb-6">
            Grazie per aver condiviso la tua idea con noi. Il nostro team la valuterà e ti risponderà entro{" "}
            <strong>24 ore</strong> con una proposta dettagliata.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Riceverai a breve una <strong>email di conferma</strong> all'indirizzo fornito.
          </p>
          <Button onClick={() => setIsSuccess(false)} className="bg-[#5B9BD5] hover:bg-[#4A8BC4] text-white">
            Invia un'altra Idea
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Descrivi la Tua Idea</CardTitle>
        <CardDescription>
          Compila il form con i dettagli del progetto. Ti risponderemo entro 24 ore lavorative.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informazioni di Contatto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Informazioni di Contatto</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome e Cognome <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mario Rossi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="mario.rossi@example.com"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+39 123 456 7890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Azienda</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Nome Azienda (opzionale)"
                />
              </div>
            </div>
          </div>

          {/* Dettagli Progetto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Dettagli del Progetto</h3>
            <div className="space-y-2">
              <Label htmlFor="projectTitle">
                Titolo Progetto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="projectTitle"
                required
                value={formData.projectTitle}
                onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                placeholder="Es: App per gestione prenotazioni hotel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDescription">
                Descrizione Dettagliata <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="projectDescription"
                required
                value={formData.projectDescription}
                onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                placeholder="Descrivi la tua idea: obiettivi, funzionalità principali, target utenti, problemi che risolve..."
                className="min-h-[150px]"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetRange">Budget Indicativo</Label>
                <Select
                  value={formData.budgetRange}
                  onValueChange={(value) => setFormData({ ...formData, budgetRange: value })}
                >
                  <SelectTrigger id="budgetRange">
                    <SelectValue placeholder="Seleziona un range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<5k">Meno di 5.000€</SelectItem>
                    <SelectItem value="5-10k">5.000€ - 10.000€</SelectItem>
                    <SelectItem value="10-25k">10.000€ - 25.000€</SelectItem>
                    <SelectItem value="25-50k">25.000€ - 50.000€</SelectItem>
                    <SelectItem value=">50k">Oltre 50.000€</SelectItem>
                    <SelectItem value="revenue-share">Solo Revenue Share</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline Desiderata</Label>
                <Select
                  value={formData.timeline}
                  onValueChange={(value) => setFormData({ ...formData, timeline: value })}
                >
                  <SelectTrigger id="timeline">
                    <SelectValue placeholder="Seleziona una timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgente (1-2 mesi)</SelectItem>
                    <SelectItem value="normal">Standard (3-4 mesi)</SelectItem>
                    <SelectItem value="flexible">Flessibile (5-6 mesi)</SelectItem>
                    <SelectItem value="long-term">Lungo termine (6+ mesi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Revenue Share Option */}
          <div className="bg-[#F4B942]/10 border border-[#F4B942] rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="revenueShare"
                checked={formData.interestedInRevenueShare}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, interestedInRevenueShare: checked as boolean })
                }
              />
              <div className="space-y-1">
                <Label htmlFor="revenueShare" className="text-base font-semibold cursor-pointer">
                  Sono interessato al modello Revenue Share
                </Label>
                <p className="text-sm text-muted-foreground">
                  Sviluppiamo il progetto senza costi iniziali in cambio di una percentuale concordata sui ricavi
                  futuri. Valuteremo insieme la fattibilità.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full bg-[#5B9BD5] hover:bg-[#4A8BC4] text-white">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Invio in corso...
              </>
            ) : (
              "Invia la Tua Idea"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Inviando questo form, accetti la nostra politica sulla privacy e il trattamento dei dati personali secondo
            il GDPR.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
