"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send } from "lucide-react"
import { useRouter } from "next/navigation"

interface AdminReplyFormProps {
  conversationId: string
  userEmail: string
}

export default function AdminReplyForm({ conversationId, userEmail }: AdminReplyFormProps) {
  const [reply, setReply] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSendReply = async () => {
    if (!reply.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/admin/chat-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          userEmail,
          message: reply.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send reply")
      }

      setSuccess(true)
      setReply("")

      // Refresh page to show new message
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err) {
      setError("Errore nell'invio della risposta. Riprova.")
      console.error("[v0] Admin reply error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Scrivi la tua risposta all'utente..."
        className="min-h-[150px]"
        disabled={isLoading}
      />

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">✅ Risposta inviata con successo!</div>}

      <Button onClick={handleSendReply} disabled={!reply.trim() || isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Invio in corso...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Invia Risposta
          </>
        )}
      </Button>
    </div>
  )
}
