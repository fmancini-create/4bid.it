"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Calendar, User, Reply, ChevronDown, ChevronUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Contact = {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  created_at: string
  read: boolean
}

export default function AdminContacts({
  contacts: initialContacts,
  userEmail,
}: {
  contacts: Contact[]
  userEmail: string
}) {
  const [contacts, setContacts] = useState(initialContacts || [])
  const router = useRouter()
  const [replyingTo, setReplyingTo] = useState<Contact | null>(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleMarkAsRead = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("contacts").update({ read: true }).eq("id", id)

    if (!error) {
      setContacts((prev) => prev.map((contact) => (contact.id === id ? { ...contact, read: true } : contact)))
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

  const unreadCount = contacts.filter((c) => !c.read).length

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats row - mobile optimized */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Totale</p>
            <p className="text-xl sm:text-3xl font-bold">{contacts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Non Letti</p>
            <p className="text-xl sm:text-3xl font-bold text-orange-600">{unreadCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Letti</p>
            <p className="text-xl sm:text-3xl font-bold text-green-600">{contacts.length - unreadCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Contacts list */}
      <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-base sm:text-lg">Messaggi Ricevuti</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 py-0 pb-3 sm:pb-6">
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nessun contatto ricevuto ancora.</div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`border rounded-lg overflow-hidden ${!contact.read ? "border-l-4 border-l-blue-600" : ""}`}
                >
                  <button
                    onClick={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                    className="w-full p-3 sm:p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-semibold text-sm sm:text-base truncate">{contact.name}</span>
                      {!contact.read && <Badge className="shrink-0 text-xs">Nuovo</Badge>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {new Date(contact.created_at).toLocaleDateString("it-IT")}
                      </span>
                      {expandedId === contact.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {expandedId === contact.id && (
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3 border-t">
                      {/* Contact info */}
                      <div className="pt-3 space-y-2">
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{contact.email}</span>
                        </a>
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          >
                            <Phone className="h-4 w-4" />
                            {contact.phone}
                          </a>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(contact.created_at).toLocaleString("it-IT", {
                            dateStyle: "long",
                            timeStyle: "short",
                          })}
                        </div>
                      </div>

                      {/* Message */}
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Messaggio:</p>
                        <p className="text-sm whitespace-pre-wrap">{contact.message}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => setReplyingTo(contact)} size="sm" className="flex-1 sm:flex-none">
                          <Reply className="h-4 w-4 mr-2" />
                          Rispondi
                        </Button>
                        {!contact.read && (
                          <Button
                            onClick={() => handleMarkAsRead(contact.id)}
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-none bg-transparent"
                          >
                            Segna letto
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={!!replyingTo} onOpenChange={() => setReplyingTo(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Rispondi a {replyingTo?.name}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm truncate">
              Invia una risposta via email a {replyingTo?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm font-medium mb-2">Messaggio originale:</p>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                {replyingTo?.message}
              </p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium mb-2 block">La tua risposta:</label>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Scrivi qui la tua risposta..."
                rows={6}
                className="text-base" // 16px font to prevent iOS zoom
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setReplyingTo(null)}
                className="flex-1 sm:flex-none bg-transparent"
              >
                Annulla
              </Button>
              <Button
                onClick={handleReply}
                disabled={sendingReply || !replyMessage.trim()}
                className="flex-1 sm:flex-none"
              >
                <Reply className="h-4 w-4 mr-2" />
                {sendingReply ? "Invio..." : "Invia"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
