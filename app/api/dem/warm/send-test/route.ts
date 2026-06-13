import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-resend"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

function personalize(template: string, sample: { nome_azienda: string; nome: string; email: string }): string {
  return template
    .replace(/\{\{nome\}\}/gi, sample.nome)
    .replace(/\{\{cognome\}\}/gi, "")
    .replace(/\{\{nome_azienda\}\}/gi, sample.nome_azienda)
    .replace(/\{\{email\}\}/gi, sample.email)
    .replace(/\{\{\s*unsubscribe\s*\}\}/gi, "#")
}

// Prova di invio di uno step di sollecito (oggetto + template), senza toccare i
// contatori reali. Riceve step_id ed email di prova.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    const { step_id, email } = await request.json()
    if (!step_id) return NextResponse.json({ error: "step_id mancante" }, { status: 400 })
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email di prova non valida" }, { status: 400 })
    }
    const testEmail = email.trim().toLowerCase()

    const admin = createAdminClient()
    const { data: step, error } = await admin
      .from("dem_followup_steps")
      .select("subject, html_template")
      .eq("id", step_id)
      .single()
    if (error || !step) return NextResponse.json({ error: "Step non trovato" }, { status: 404 })

    const sample = { nome_azienda: "Hotel di Prova", nome: "Mario", email: testEmail }
    const html = personalize(step.html_template || "", sample)
    const subject = `[PROVA] ${personalize(step.subject || "Sollecito", sample)}`

    const result = await sendEmail({ to: testEmail, subject, html })
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Invio di prova fallito" }, { status: 500 })
    }
    return NextResponse.json({ success: true, to: testEmail })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    )
  }
}
