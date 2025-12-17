"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Calendar, User, LogOut, RefreshCw, Reply } from "lucide-react"
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

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  const handleMarkAsRead = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("contacts").update({ read: true }).eq("id", id)

    if (!error) {
      setContacts((prev) => prev.map((contact) => (contact.id === id ? { ...contact, read: true } : contact)))
    }
  }

  const handleRefresh = () => {
    router.refresh()
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
    <div className="container mx-auto">
      <div className="fixed top-0 left-0 right-0 bg-white p-4 shadow z-50">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Pannello Amministrativo</h1>
            <p className="text-gray-600">
              Connesso come: <span className="font-semibold">{userEmail}</span>
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Aggiorna
            </Button>
            <Button onClick={handleSignOut} variant="destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Esci
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 mt-20">
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Totale Contatti</p>
                <p className="text-3xl font-bold text-gray-800">{contacts.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Non Letti</p>
                <p className="text-3xl font-bold text-orange-600">{unreadCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Letti</p>
                <p className="text-3xl font-bold text-green-600">{contacts.length - unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Messaggi Ricevuti</h2>

        {contacts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">Nessun contatto ricevuto ancora.</CardContent>
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} className={contact.read ? "opacity-75" : "border-l-4 border-l-blue-600"}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {contact.name}
                    {!contact.read && (
                      <Badge variant="default" className="ml-2">
                        Nuovo
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setReplyingTo(contact)}
                      size="sm"
                      variant="default"
                      className="bg-[#5B9BD5] hover:bg-[#4A90D9]"
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      Rispondi
                    </Button>
                    {!contact.read && (
                      <Button onClick={() => handleMarkAsRead(contact.id)} size="sm" variant="outline">
                        Segna come letto
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                      {contact.email}
                    </a>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {new Date(contact.created_at).toLocaleString("it-IT", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Messaggio:</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{contact.message}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!replyingTo} onOpenChange={() => setReplyingTo(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rispondi a {replyingTo?.name}</DialogTitle>
            <DialogDescription>Invia una risposta via email a {replyingTo?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Messaggio originale:</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{replyingTo?.message}</p>
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
    </div>
  )
}
