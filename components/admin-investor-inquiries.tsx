"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  TrendingUp,
  Handshake,
  Users,
  HelpCircle,
  Mail,
  Phone,
  Building2,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface InvestorInquiry {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  inquiry_type: string
  interested_projects?: string[]
  investment_amount?: string
  message: string
  status: string
  admin_notes?: string
  created_at: string
}

interface AdminInvestorInquiriesProps {
  inquiries: InvestorInquiry[]
}

export default function AdminInvestorInquiries({ inquiries }: AdminInvestorInquiriesProps) {
  const safeInquiries = inquiries || []
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({})

  const inquiryTypeIcons: Record<string, any> = {
    investment: TrendingUp,
    collaboration: Handshake,
    partnership: Users,
    other: HelpCircle,
  }

  const inquiryTypeLabels: Record<string, string> = {
    investment: "Investimento",
    collaboration: "Collaborazione",
    partnership: "Partnership",
    other: "Altro",
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    contacted: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    closed: "bg-gray-100 text-gray-800",
  }

  const statusLabels: Record<string, string> = {
    pending: "In Attesa",
    contacted: "Contattato",
    in_progress: "In Corso",
    closed: "Chiuso",
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/investor-inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const handleSaveNotes = async (id: string) => {
    try {
      const response = await fetch(`/api/investor-inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: editingNotes[id] }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Error saving notes:", error)
    }
  }

  const stats = {
    total: safeInquiries.length,
    pending: safeInquiries.filter((i) => i.status === "pending").length,
    investment: safeInquiries.filter((i) => i.inquiry_type === "investment").length,
    collaboration: safeInquiries.filter((i) => i.inquiry_type === "collaboration").length,
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Richieste Investitori & Collaboratori</CardTitle>
          <CardDescription>Gestisci le richieste di investimento e collaborazione</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Totale Richieste</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">In Attesa</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.investment}</div>
              <div className="text-sm text-gray-600">Investimenti</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.collaboration}</div>
              <div className="text-sm text-gray-600">Collaborazioni</div>
            </div>
          </div>

          {/* Inquiries List */}
          <div className="space-y-4">
            {safeInquiries.map((inquiry) => {
              const Icon = inquiryTypeIcons[inquiry.inquiry_type] || HelpCircle
              const isExpanded = expandedId === inquiry.id

              return (
                <div key={inquiry.id} className="border rounded-lg overflow-hidden">
                  {/* Header */}
                  <div
                    className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : inquiry.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-lg">
                          <Icon className="h-5 w-5 text-[#5B9BD5]" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{inquiry.name}</div>
                          <div className="text-sm text-gray-600">{inquiry.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[inquiry.status]}>{statusLabels[inquiry.status]}</Badge>
                        <Badge variant="outline">{inquiryTypeLabels[inquiry.inquiry_type]}</Badge>
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-6 space-y-6 bg-white">
                      {/* Contact Info Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:underline">
                            {inquiry.email}
                          </a>
                        </div>
                        {inquiry.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <a href={`tel:${inquiry.phone}`} className="text-blue-600 hover:underline">
                              {inquiry.phone}
                            </a>
                          </div>
                        )}
                        {inquiry.company && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>{inquiry.company}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(inquiry.created_at).toLocaleDateString("it-IT")}</span>
                        </div>
                      </div>

                      {/* Interested Projects */}
                      {inquiry.interested_projects && inquiry.interested_projects.length > 0 && (
                        <div>
                          <div className="font-semibold text-sm text-gray-700 mb-2">Progetti di Interesse:</div>
                          <div className="flex flex-wrap gap-2">
                            {inquiry.interested_projects.map((project) => (
                              <Badge key={project} variant="secondary">
                                {project}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Investment Amount */}
                      {inquiry.investment_amount && (
                        <div>
                          <div className="font-semibold text-sm text-gray-700 mb-2">Importo Investimento:</div>
                          <div className="text-lg font-bold text-green-600">{inquiry.investment_amount}</div>
                        </div>
                      )}

                      {/* Message */}
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-sm text-gray-700 mb-2">
                          <MessageSquare className="h-4 w-4" />
                          Messaggio:
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                          {inquiry.message}
                        </div>
                      </div>

                      {/* Status Change */}
                      <div>
                        <div className="font-semibold text-sm text-gray-700 mb-2">Cambia Stato:</div>
                        <div className="flex gap-2">
                          {Object.keys(statusLabels).map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant={inquiry.status === status ? "default" : "outline"}
                              onClick={() => handleStatusChange(inquiry.id, status)}
                            >
                              {statusLabels[status]}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Admin Notes */}
                      <div>
                        <div className="font-semibold text-sm text-gray-700 mb-2">Note Admin:</div>
                        <Textarea
                          rows={3}
                          placeholder="Aggiungi note interne..."
                          value={editingNotes[inquiry.id] ?? inquiry.admin_notes ?? ""}
                          onChange={(e) => setEditingNotes({ ...editingNotes, [inquiry.id]: e.target.value })}
                          className="mb-2"
                        />
                        <Button size="sm" onClick={() => handleSaveNotes(inquiry.id)}>
                          Salva Note
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {safeInquiries.length === 0 && (
              <div className="text-center py-12 text-gray-500">Nessuna richiesta ricevuta ancora.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
