"use client"

import type React from "react"

import { useState } from "react"
import { X, Loader2, TrendingUp, Handshake, Users, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface InvestorInquiryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function InvestorInquiryModal({ isOpen, onClose }: InvestorInquiryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    inquiryType: "investment" as "investment" | "collaboration" | "partnership" | "other",
    interestedProjects: [] as string[],
    investmentAmount: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const projects = [
    { id: "santaddeo", name: "SANTADDEO - Revenue Management" },
    { id: "manubot", name: "MANUBOT - Maintenance Assistant" },
    { id: "hotel-accelerator", name: "HOTEL ACCELERATOR - Performance Booster" },
    { id: "risparmio-compulsivo", name: "RISPARMIO COMPULSIVO - Savings App" },
    { id: "autoexel", name: "AUTOEXEL - Smart Excel" },
  ]

  const inquiryTypes = [
    { value: "investment", label: "Investimento", icon: TrendingUp },
    { value: "collaboration", label: "Collaborazione", icon: Handshake },
    { value: "partnership", label: "Partnership", icon: Users },
    { value: "other", label: "Altro", icon: HelpCircle },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/investor-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to submit inquiry")

      setSubmitSuccess(true)
      setTimeout(() => {
        onClose()
        setSubmitSuccess(false)
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          inquiryType: "investment",
          interestedProjects: [],
          investmentAmount: "",
          message: "",
        })
      }, 2000)
    } catch (error) {
      console.error("Error submitting inquiry:", error)
      alert("Errore durante l'invio. Riprova.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleProject = (projectId: string) => {
    setFormData((prev) => ({
      ...prev,
      interestedProjects: prev.interestedProjects.includes(projectId)
        ? prev.interestedProjects.filter((id) => id !== projectId)
        : [...prev.interestedProjects, projectId],
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Chiudi"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="p-8 pb-6 border-b">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Investitori & Collaboratori</h2>
          <p className="text-gray-600">
            Interessato ai nostri progetti? Compila il form e ti ricontatteremo entro 24 ore.
          </p>
        </div>

        {submitSuccess ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Richiesta Inviata!</h3>
            <p className="text-gray-600">Ti ricontatteremo entro 24 ore.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Inquiry Type */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Tipo di Richiesta *</Label>
              <div className="grid grid-cols-2 gap-3">
                {inquiryTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, inquiryType: type.value as any })}
                      className={`p-4 border-2 rounded-xl flex items-center gap-3 transition-all ${
                        formData.inquiryType === type.value
                          ? "border-[#5B9BD5] bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{type.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company">Azienda/Organizzazione</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            {/* Projects Interest */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Progetti di Interesse</Label>
              <div className="space-y-2">
                {projects.map((project) => (
                  <label
                    key={project.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.interestedProjects.includes(project.id)}
                      onChange={() => toggleProject(project.id)}
                      className="w-4 h-4 text-[#5B9BD5] rounded"
                    />
                    <span className="text-sm font-medium">{project.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Investment Amount (only for investment type) */}
            {formData.inquiryType === "investment" && (
              <div>
                <Label htmlFor="investmentAmount">Importo di Investimento Indicativo</Label>
                <Input
                  id="investmentAmount"
                  placeholder="es. €50.000 - €100.000"
                  value={formData.investmentAmount}
                  onChange={(e) => setFormData({ ...formData, investmentAmount: e.target.value })}
                />
              </div>
            )}

            {/* Message */}
            <div>
              <Label htmlFor="message">Messaggio *</Label>
              <Textarea
                id="message"
                rows={5}
                placeholder="Raccontaci di più sui tuoi interessi, obiettivi e come vorresti collaborare..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                className="resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#5B9BD5] to-[#4A8BC2] text-white hover:from-[#4A8BC2] hover:to-[#3A7AB2] h-12"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Invio in corso...
                </>
              ) : (
                "Invia Richiesta"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
