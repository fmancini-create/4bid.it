import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { sendEmail } from "@/lib/email-smtp"
import { buildCvPath, uploadCvFile, sanitizeFileName } from "@/lib/jobs/storage"
import { SPONTANEOUS_LABEL } from "@/lib/jobs/types"

// Reuse the same anti-spam approach already in place for project submissions.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 5 // max 5 applications per hour per IP
const MAX_CV_BYTES = 5 * 1024 * 1024

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }
  if (record.count >= RATE_LIMIT_MAX) return true
  record.count++
  return false
}

function isSpamContent(text: string): boolean {
  if (!text) return false
  const stripped = text.replace(/\s/g, "")
  if (/^[A-Za-z]{12,}$/.test(stripped)) return true
  if (/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{7,}/.test(text)) return true
  if (/[A-Za-z]{18,}/.test(text)) return true
  return false
}

function isValidEmail(email: string): boolean {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false
  const disposable = ["tempmail", "throwaway", "mailinator", "guerrillamail", "10minutemail"]
  const domain = email.split("@")[1]?.toLowerCase() || ""
  return !disposable.some((d) => domain.includes(d))
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Troppe richieste. Riprova tra un'ora." }, { status: 429 })
    }

    const formData = await request.formData()
    const get = (k: string) => (formData.get(k) ? String(formData.get(k)).trim() : "")

    // Honeypots — bots fill these, humans never see them.
    const website = get("website")
    const fax = get("fax")
    if (website || fax) {
      console.log(`[v0] job honeypot triggered - IP: ${ip}`)
      return NextResponse.json({ id: "ok" }, { status: 201 })
    }

    // Timestamp: form filled unrealistically fast => bot.
    const formTimestamp = Number(get("form_timestamp"))
    if (formTimestamp && Date.now() - formTimestamp < 3000) {
      console.log(`[v0] job form filled too fast - IP: ${ip}`)
      return NextResponse.json({ id: "ok" }, { status: 201 })
    }

    const first_name = get("first_name")
    const last_name = get("last_name")
    const email = get("email")
    const position_slug = get("position_slug")
    const position_title = get("position_title") || (position_slug === "spontanea" ? SPONTANEOUS_LABEL : "")
    const consent = get("consent") === "true"

    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: "Nome, cognome ed email sono obbligatori." }, { status: 400 })
    }
    if (!position_slug) {
      return NextResponse.json({ error: "Seleziona una posizione." }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Indirizzo email non valido." }, { status: 400 })
    }
    if (!consent) {
      return NextResponse.json(
        { error: "È necessario accettare l'informativa sulla privacy." },
        { status: 400 },
      )
    }
    // Silently drop obvious spam in the name fields.
    if (isSpamContent(first_name) || isSpamContent(last_name)) {
      console.log(`[v0] job spam name detected - IP: ${ip}`)
      return NextResponse.json({ id: "ok" }, { status: 201 })
    }

    // Parse dynamic answers.
    let answers: Record<string, string> = {}
    try {
      const raw = get("answers")
      if (raw) answers = JSON.parse(raw)
    } catch {
      answers = {}
    }

    // If the position exists, verify it is open and validate its required extra
    // fields server-side (never trust the client).
    const admin = createAdminClient()
    if (position_slug !== "spontanea") {
      const { data: pos } = await admin
        .from("job_positions")
        .select("slug, title, is_open, extra_fields")
        .eq("slug", position_slug)
        .maybeSingle()

      if (!pos || !pos.is_open) {
        return NextResponse.json({ error: "Questa posizione non è più disponibile." }, { status: 400 })
      }
      const extra = Array.isArray(pos.extra_fields) ? (pos.extra_fields as Array<Record<string, unknown>>) : []
      for (const field of extra) {
        if (field.required && !String(answers[field.key as string] ?? "").trim()) {
          return NextResponse.json({ error: `Campo obbligatorio mancante: ${field.label}.` }, { status: 400 })
        }
      }
    }

    // Handle optional CV upload.
    let cv_path: string | null = null
    let cv_filename: string | null = null
    const cv = formData.get("cv")
    if (cv && cv instanceof File && cv.size > 0) {
      if (cv.type !== "application/pdf" && !cv.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: "Il CV deve essere un PDF." }, { status: 400 })
      }
      if (cv.size > MAX_CV_BYTES) {
        return NextResponse.json({ error: "Il CV non può superare i 5 MB." }, { status: 400 })
      }
      cv_filename = sanitizeFileName(cv.name)
      const path = buildCvPath({ positionSlug: position_slug, fileName: cv.name })
      const bytes = new Uint8Array(await cv.arrayBuffer())
      const uploaded = await uploadCvFile({ path, body: bytes, contentType: "application/pdf" })
      if (!uploaded.ok) {
        console.log("[v0] CV upload failed:", uploaded.error)
        return NextResponse.json({ error: "Errore durante il caricamento del CV. Riprova." }, { status: 500 })
      }
      cv_path = path
    }

    const { data, error } = await admin
      .from("job_applications")
      .insert([
        {
          position_slug,
          position_title,
          first_name,
          last_name,
          email,
          phone: get("phone") || null,
          city: get("city") || null,
          linkedin_url: get("linkedin_url") || null,
          portfolio_url: get("portfolio_url") || null,
          current_occupation: get("current_occupation") || null,
          presentation: get("presentation") || null,
          motivation: get("motivation") || null,
          availability: get("availability") || null,
          preferred_engagement: get("preferred_engagement") || null,
          answers,
          cv_path,
          cv_filename,
          consent,
          status: "nuova",
          ip,
          user_agent: request.headers.get("user-agent") || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error inserting job application:", error)
      return NextResponse.json({ error: "Errore durante il salvataggio. Riprova." }, { status: 500 })
    }

    console.log("[v0] Job application inserted:", data.id)

    // Emails (best effort — never fail the request on email trouble).
    const positionLabel = position_title || SPONTANEOUS_LABEL
    try {
      await sendEmail({
        to: email,
        subject: "✅ Candidatura ricevuta - 4 Bid Srl",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #5B9BD5 0%, #4A8BC2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 26px;">Candidatura ricevuta</h1>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151;">Ciao <strong>${esc(first_name)}</strong>,</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                grazie per la tua candidatura a <strong>4 Bid Srl</strong> per la posizione
                "<strong>${esc(positionLabel)}</strong>".<br>
                Il nostro team la valuterà e ti risponderà appena possibile.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 0;">
                4 Bid Srl · Via Sorripa, 10 · 50026 San Casciano in Val di Pesa (FI)<br>
                P.IVA 06241710489 · <a href="https://www.4bid.it" style="color: #5B9BD5; text-decoration: none;">www.4bid.it</a>
              </p>
            </div>
          </div>`,
        replyTo: "info@4bid.it",
      })

      const answersRows = Object.entries(answers)
        .filter(([, v]) => String(v ?? "").trim())
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 0;color:#6b7280;"><strong>${esc(k)}:</strong></td><td style="padding:6px 0;color:#374151;">${esc(v)}</td></tr>`,
        )
        .join("")

      await sendEmail({
        to: "f.mancini@4bid.it",
        subject: `🧑‍💼 Nuova candidatura: ${positionLabel} — ${first_name} ${last_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #F4B942 0%, #E5A82E 100%); padding: 26px; border-radius: 10px 10px 0 0;">
              <h1 style="color: #2C3E50; margin: 0; font-size: 22px;">Nuova candidatura</h1>
              <p style="color: #2C3E50; margin: 8px 0 0; font-size: 16px;">${esc(positionLabel)}</p>
            </div>
            <div style="background-color: white; padding: 28px; border-radius: 0 0 10px 10px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding:6px 0;color:#6b7280;"><strong>Nome:</strong></td><td style="padding:6px 0;color:#374151;">${esc(first_name)} ${esc(last_name)}</td></tr>
                <tr><td style="padding:6px 0;color:#6b7280;"><strong>Email:</strong></td><td style="padding:6px 0;"><a href="mailto:${esc(email)}" style="color:#5B9BD5;text-decoration:none;">${esc(email)}</a></td></tr>
                ${get("phone") ? `<tr><td style="padding:6px 0;color:#6b7280;"><strong>Telefono:</strong></td><td style="padding:6px 0;color:#374151;">${esc(get("phone"))}</td></tr>` : ""}
                ${get("city") ? `<tr><td style="padding:6px 0;color:#6b7280;"><strong>Città:</strong></td><td style="padding:6px 0;color:#374151;">${esc(get("city"))}</td></tr>` : ""}
                ${get("linkedin_url") ? `<tr><td style="padding:6px 0;color:#6b7280;"><strong>LinkedIn:</strong></td><td style="padding:6px 0;"><a href="${esc(get("linkedin_url"))}" style="color:#5B9BD5;">${esc(get("linkedin_url"))}</a></td></tr>` : ""}
                ${get("portfolio_url") ? `<tr><td style="padding:6px 0;color:#6b7280;"><strong>GitHub/Portfolio:</strong></td><td style="padding:6px 0;"><a href="${esc(get("portfolio_url"))}" style="color:#5B9BD5;">${esc(get("portfolio_url"))}</a></td></tr>` : ""}
                ${get("current_occupation") ? `<tr><td style="padding:6px 0;color:#6b7280;"><strong>Ruolo attuale:</strong></td><td style="padding:6px 0;color:#374151;">${esc(get("current_occupation"))}</td></tr>` : ""}
                ${get("availability") ? `<tr><td style="padding:6px 0;color:#6b7280;"><strong>Disponibilità:</strong></td><td style="padding:6px 0;color:#374151;">${esc(get("availability"))}</td></tr>` : ""}
                ${get("preferred_engagement") ? `<tr><td style="padding:6px 0;color:#6b7280;"><strong>Collaborazione:</strong></td><td style="padding:6px 0;color:#374151;">${esc(get("preferred_engagement"))}</td></tr>` : ""}
                ${answersRows}
              </table>
              ${get("presentation") ? `<h3 style="color:#2C3E50;margin:20px 0 6px;font-size:15px;">Presentazione</h3><p style="color:#374151;line-height:1.6;white-space:pre-wrap;margin:0;">${esc(get("presentation"))}</p>` : ""}
              ${get("motivation") ? `<h3 style="color:#2C3E50;margin:20px 0 6px;font-size:15px;">Perché 4 Bid</h3><p style="color:#374151;line-height:1.6;white-space:pre-wrap;margin:0;">${esc(get("motivation"))}</p>` : ""}
              <p style="margin:20px 0 0;color:#374151;"><strong>CV:</strong> ${cv_filename ? esc(cv_filename) + " (disponibile nel backoffice)" : "non allegato"}</p>
              <div style="text-align:center;margin-top:26px;">
                <a href="https://www.4bid.it/admin/candidature" style="background:#5B9BD5;color:white;padding:12px 26px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Apri il backoffice candidature</a>
              </div>
              <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;">Data: ${new Date().toLocaleString("it-IT")} · ID: ${esc(data.id)}</p>
            </div>
          </div>`,
        replyTo: email,
      })
    } catch (emailError) {
      console.error("[v0] job application email error:", emailError)
    }

    return NextResponse.json({ id: data.id, status: data.status }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating job application:", error)
    return NextResponse.json({ error: "Errore interno del server." }, { status: 500 })
  }
}
