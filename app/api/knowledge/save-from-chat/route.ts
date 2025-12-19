import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check admin auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user || user.email !== "f.mancini@4bid.it") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId, category, title, keywords } = await request.json()

    console.log("[v0] Saving message as knowledge:", { messageId, category, title })

    // Get the message content
    const { data: message, error: msgError } = await supabase
      .from("chat_messages")
      .select("content, conversation_id")
      .eq("id", messageId)
      .single()

    if (msgError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Save to knowledge base
    const { data, error } = await supabase
      .from("knowledge_base")
      .insert({
        source: "chat",
        source_url: `https://4bid.it/admin/chat-conversations/${message.conversation_id}`,
        category: category || "faq",
        title: title || "Risposta dalla chat",
        content: message.content,
        keywords: keywords || [],
        priority: 6,
        is_active: true,
        created_by: user.email,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving to knowledge base:", error)
      throw error
    }

    console.log("[v0] Successfully saved to knowledge base:", data.id)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[v0] Save from chat error:", error)
    return NextResponse.json({ error: error.message || "Failed to save to knowledge base" }, { status: 500 })
  }
}
