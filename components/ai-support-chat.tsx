"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, Send, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  role: "user" | "assistant" | "admin" | "system"
  content: string
  created_at: string
}

interface LeadState {
  isCollecting: boolean
  reason: "consulenza" | "contatto" | "non_so_rispondere" | null
  collectedData: {
    nome?: string
    email?: string
    telefono?: string
    messaggio?: string
  }
  step: "nome" | "email" | "telefono" | "messaggio" | "conferma" | "completato" | null
}

interface AISupportChatProps {
  userEmail: string
  accountType: "free" | "pro" | "business"
}

export default function AISupportChat({ userEmail, accountType }: AISupportChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [leadState, setLeadState] = useState<LeadState | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Hide chat for free users
  if (accountType === "free") {
    return null
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setError(null)
    setIsLoading(true)

    // Add user message optimistically
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      console.log("[v0] Sending to API:", {
        message: userMessage,
        conversationId,
        leadState,
      })

      const response = await fetch("/api/ai-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          userEmail,
          accountType,
          leadState,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send message")
      }

      const data = await response.json()

      console.log("[v0] Received from API:", {
        hasLeadState: !!data.leadState,
        leadStateIsCollecting: data.leadState?.isCollecting,
        leadStateStep: data.leadState?.step,
      })

      // Update conversation ID if first message
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId)
      }

      if (data.leadState !== undefined) {
        console.log("[v0] Updating leadState to:", data.leadState)
        setLeadState(data.leadState)
      }

      const responseMessage: Message = {
        id: data.messageId || `msg-${Date.now()}`,
        role: data.role || "assistant",
        content: data.response,
        created_at: new Date().toISOString(),
      }

      // Replace temp message with real one and add response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMessage.id)
        return [...filtered, { ...tempUserMessage, id: `user-${Date.now()}` }, responseMessage]
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Si è verificato un errore. Riprova."
      setError(errorMessage)
      console.error("[v0] AI Support Chat error:", err)
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getPlaceholder = () => {
    if (!leadState?.isCollecting) return "Scrivi la tua domanda..."
    switch (leadState.step) {
      case "nome":
        return "Inserisci il tuo nome..."
      case "email":
        return "Inserisci la tua email..."
      case "telefono":
        return "Inserisci telefono o scrivi 'salta'..."
      case "messaggio":
        return "Descrivi la tua richiesta..."
      case "conferma":
        return "Scrivi 'sì' per confermare o 'no' per annullare..."
      default:
        return "Scrivi la tua domanda..."
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50 bg-blue-600 hover:bg-blue-700 text-white"
          size="icon"
        >
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-96 md:h-[600px] z-50 flex flex-col bg-background md:rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="shrink-0 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base md:text-lg font-semibold">Supporto AI 4BID.IT</h2>
                <p className="text-xs md:text-sm text-blue-100 mt-1">
                  {leadState?.isCollecting ? <>Raccolta dati in corso</> : <>Risposta in tempo reale</>}
                  {" • "}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {accountType.toUpperCase()}
                  </Badge>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="hover:bg-blue-800 shrink-0"
                aria-label="Chiudi chat"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 text-blue-500" />
                <p className="font-medium text-sm md:text-base">Ciao! Come posso aiutarti?</p>
                <p className="text-xs md:text-sm mt-2">Scrivi la tua domanda e riceverai una risposta immediata.</p>
                <p className="text-xs mt-3 text-blue-600">
                  Se vuoi essere ricontattato, dimmelo e raccoglierò i tuoi dati!
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-3 md:mb-4 ${message.role === "user" ? "flex justify-end" : "flex justify-start"}`}
              >
                <div
                  className={`max-w-[90%] md:max-w-[85%] rounded-lg px-3 py-2 md:px-4 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : message.role === "admin"
                        ? "bg-green-100 text-green-900 border border-green-300"
                        : message.role === "system"
                          ? "bg-yellow-100 text-yellow-900 border border-yellow-300"
                          : "bg-muted text-foreground"
                  }`}
                >
                  {message.role === "admin" && (
                    <div className="text-xs font-semibold mb-1 text-green-700">Admin Team</div>
                  )}
                  {message.role === "system" && (
                    <div className="text-xs font-semibold mb-1 text-yellow-700">Sistema</div>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return <strong key={i}>{part.slice(2, -2)}</strong>
                      }
                      return part
                    })}
                  </p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.created_at).toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-muted rounded-lg px-3 py-2 md:px-4 md:py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Sto elaborando...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="shrink-0 px-3 py-2 md:px-4 bg-red-50 border-t border-red-200 flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-xs md:text-sm">{error}</span>
            </div>
          )}

          {/* Lead State Progress */}
          {leadState?.isCollecting && leadState.step && (
            <div className="shrink-0 px-3 py-3 bg-blue-50 border-t border-blue-200">
              <div className="flex items-center justify-between text-xs text-blue-700 mb-2">
                <span className="font-medium">📝 Raccolta dati in corso</span>
                <span>{["nome", "email", "telefono", "messaggio", "conferma"].indexOf(leadState.step) + 1}/5</span>
              </div>
              <div className="flex gap-1">
                {["nome", "email", "telefono", "messaggio", "conferma"].map((step, index) => {
                  const currentIndex = ["nome", "email", "telefono", "messaggio", "conferma"].indexOf(
                    leadState.step || "",
                  )
                  const isCompleted = index < currentIndex
                  const isCurrent = index === currentIndex
                  return (
                    <div
                      key={step}
                      className={`h-2 flex-1 rounded transition-colors ${
                        isCompleted ? "bg-green-500" : isCurrent ? "bg-blue-600" : "bg-blue-200"
                      }`}
                      title={step.charAt(0).toUpperCase() + step.slice(1)}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-blue-500 mt-1">
                <span>Nome</span>
                <span>Email</span>
                <span>Tel</span>
                <span>Msg</span>
                <span>✓</span>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="shrink-0 p-3 md:p-4 border-t bg-background">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex gap-2"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                className="resize-none min-h-[44px] max-h-[100px] text-sm md:text-base flex-1"
                disabled={isLoading}
                rows={1}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="icon"
                className="shrink-0 h-[44px] w-[44px]"
                aria-label="Invia messaggio"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
