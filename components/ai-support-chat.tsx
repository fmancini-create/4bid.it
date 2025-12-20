"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, Send, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  role: "user" | "assistant" | "admin" | "system"
  content: string
  created_at: string
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
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
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
      console.log("[v0] Sending message to AI support API...")

      const response = await fetch("/api/ai-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          userEmail,
          accountType,
        }),
      })

      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] API error:", errorData)
        throw new Error(errorData.error || "Failed to send message")
      }

      const data = await response.json()
      console.log("[v0] API response data received")

      // Update conversation ID if first message
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId)
        console.log("[v0] Set conversation ID:", data.conversationId)
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
      console.log("[v0] Message exchange complete")
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

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Supporto AI 4BID.IT</CardTitle>
                <p className="text-sm text-blue-100 mt-1">
                  Risposta in tempo reale • Account{" "}
                  <Badge variant="secondary" className="ml-1">
                    {accountType.toUpperCase()}
                  </Badge>
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-blue-800">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                  <p className="font-medium">Ciao! Come posso aiutarti?</p>
                  <p className="text-sm mt-2">Scrivi la tua domanda e riceverai una risposta immediata.</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 ${message.role === "user" ? "flex justify-end" : "flex justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
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
                      <div className="text-xs font-semibold mb-1 text-green-700">👤 Admin Team</div>
                    )}
                    {message.role === "system" && (
                      <div className="text-xs font-semibold mb-1 text-yellow-700">🔔 Sistema</div>
                    )}
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
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
                  <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Sto elaborando...</span>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Error Banner */}
            {error && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Scrivi la tua domanda..."
                  className="resize-none min-h-[60px]"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="shrink-0"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
