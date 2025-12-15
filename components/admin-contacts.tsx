"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Calendar, User, LogOut, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
  const [contacts, setContacts] = useState(initialContacts)
  const router = useRouter()

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

  const unreadCount = contacts.filter((c) => !c.read).length

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
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

      <div className="mb-6">
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
                  {!contact.read && (
                    <Button onClick={() => handleMarkAsRead(contact.id)} size="sm" variant="outline">
                      Segna come letto
                    </Button>
                  )}
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
    </div>
  )
}
