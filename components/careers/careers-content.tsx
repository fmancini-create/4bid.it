"use client"

import type React from "react"
import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowRight,
  CheckCircle2,
  Upload,
  FileText,
  Sparkles,
  Loader2,
  Briefcase,
} from "lucide-react"
import Link from "next/link"
import { ShareInvite } from "@/components/careers/share-invite"
import { type JobPosition, SPONTANEOUS_SLUG, SPONTANEOUS_LABEL, type JobExtraField } from "@/lib/jobs/types"

const MAX_CV_BYTES = 5 * 1024 * 1024 // 5 MB

interface Props {
  positions: JobPosition[]
}

interface FormState {
  first_name: string
  last_name: string
  email: string
  phone: string
  city: string
  position_slug: string
  linkedin_url: string
  portfolio_url: string
  current_occupation: string
  presentation: string
  motivation: string
  availability: string
  preferred_engagement: string
}

const EMPTY_FORM: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  position_slug: "",
  linkedin_url: "",
  portfolio_url: "",
  current_occupation: "",
  presentation: "",
  motivation: "",
  availability: "",
  preferred_engagement: "",
}

function renderDescription(text: string) {
  // Lightweight rendering of the seeded markdown-ish descriptions:
  // "## Heading" lines and "- bullet" lines.
  const lines = text.split("\n")
  const blocks: React.ReactNode[] = []
  let bullets: string[] = []

  const flushBullets = (key: string) => {
    if (bullets.length) {
      blocks.push(
        <ul key={key} className="my-2 list-disc space-y-1 pl-5 text-gray-600">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>,
      )
      bullets = []
    }
  }

  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (line.startsWith("## ")) {
      flushBullets(`ul-${i}`)
      blocks.push(
        <h4 key={`h-${i}`} className="mt-4 mb-1 font-semibold text-[#2C3E50]">
          {line.replace(/^##\s+/, "")}
        </h4>,
      )
    } else if (line.startsWith("- ")) {
      bullets.push(line.replace(/^-\s+/, ""))
    } else if (line.length) {
      flushBullets(`ul-${i}`)
      blocks.push(
        <p key={`p-${i}`} className="my-2 text-gray-600 leading-relaxed">
          {line}
        </p>,
      )
    }
  })
  flushBullets("ul-end")
  return blocks
}

export function CareersContent({ positions }: Props) {
  const formRef = useRef<HTMLDivElement>(null)
  const startedAt = useRef<number>(Date.now())

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState({ website: "", fax: "" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const selectedPosition = useMemo(
    () => positions.find((p) => p.slug === form.position_slug) ?? null,
    [positions, form.position_slug],
  )
  const extraFields: JobExtraField[] = selectedPosition?.extra_fields ?? []

  const set = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const selectPosition = (slug: string) => {
    setForm((f) => ({ ...f, position_slug: slug }))
    setAnswers({})
    setError(null)
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setError(null)
    if (!file) {
      setCvFile(null)
      return
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Il CV deve essere un file PDF.")
      e.target.value = ""
      return
    }
    if (file.size > MAX_CV_BYTES) {
      setError("Il CV non può superare i 5 MB.")
      e.target.value = ""
      return
    }
    setCvFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.first_name || !form.last_name || !form.email) {
      setError("Nome, cognome ed email sono obbligatori.")
      return
    }
    if (!form.position_slug) {
      setError("Seleziona una posizione (o la candidatura spontanea).")
      return
    }
    if (!consent) {
      setError("Devi accettare l'informativa sul trattamento dei dati per candidarti.")
      return
    }
    // Required dynamic fields
    for (const field of extraFields) {
      if (field.required && !answers[field.key]?.trim()) {
        setError(`Compila il campo obbligatorio: ${field.label}.`)
        return
      }
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append(
        "position_title",
        form.position_slug === SPONTANEOUS_SLUG
          ? SPONTANEOUS_LABEL
          : selectedPosition?.title ?? "",
      )
      fd.append("answers", JSON.stringify(answers))
      fd.append("consent", consent ? "true" : "false")
      fd.append("website", honeypot.website)
      fd.append("fax", honeypot.fax)
      fd.append("form_timestamp", String(startedAt.current))
      if (cvFile) fd.append("cv", cvFile)

      const res = await fetch("/api/job-applications", { method: "POST", body: fd })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error || "Si è verificato un errore. Riprova più tardi.")
        setSubmitting(false)
        return
      }

      setSuccess(true)
      window.scrollTo({ top: formRef.current?.offsetTop ?? 0, behavior: "smooth" })
    } catch (err) {
      console.log("[v0] application submit error:", (err as Error).message)
      setError("Si è verificato un errore di rete. Riprova più tardi.")
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* POSITIONS */}
      <section id="posizioni" className="bg-white py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#5B9BD5]">Posizioni aperte</p>
            <h2 className="text-3xl font-bold text-[#2C3E50] text-balance sm:text-4xl">
              Entra nel team di 4 Bid
            </h2>
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
            {positions.map((pos) => (
              <article
                key={pos.id}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#5B9BD5]/10 text-[#5B9BD5]">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  {pos.badge && (
                    <span className="rounded-full bg-[#F4B942]/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#B27B00]">
                      {pos.badge}
                    </span>
                  )}
                </div>

                <h3 className="mb-1 text-xl font-bold text-[#2C3E50] text-pretty">{pos.title}</h3>
                {pos.employment_type && (
                  <p className="mb-3 text-sm font-medium text-gray-500">{pos.employment_type}</p>
                )}
                {pos.summary && <p className="mb-4 text-gray-600 leading-relaxed">{pos.summary}</p>}

                {pos.description && (
                  <details className="mb-5 rounded-lg bg-gray-50 p-4 text-sm">
                    <summary className="cursor-pointer font-medium text-[#5B9BD5]">
                      Leggi la descrizione completa
                    </summary>
                    <div className="mt-2">{renderDescription(pos.description)}</div>
                  </details>
                )}

                <div className="mt-auto">
                  <Button
                    onClick={() => selectPosition(pos.slug)}
                    className="w-full bg-[#5B9BD5] text-white hover:bg-[#4A8BC2]"
                  >
                    Candidati
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}

            {/* SPONTANEOUS */}
            <article className="flex flex-col rounded-2xl border-2 border-dashed border-[#5B9BD5]/40 bg-[#5B9BD5]/5 p-6 shadow-sm sm:p-8 lg:col-span-2">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4B942]/15 text-[#B27B00]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#2C3E50]">Pensi di poter portare valore a 4 Bid?</h3>
              <p className="mb-2 text-gray-600 leading-relaxed">
                Non tutte le persone interessanti rientrano in una job description.
              </p>
              <p className="mb-5 max-w-3xl text-gray-600 leading-relaxed">
                Se conosci tecnologia, SaaS, AI, vendite B2B, customer success, product design, marketing digitale o hai
                semplicemente competenze che pensi possano essere utili ai nostri prodotti, vogliamo conoscerti.
              </p>
              <div>
                <Button
                  onClick={() => selectPosition(SPONTANEOUS_SLUG)}
                  variant="outline"
                  className="border-[#5B9BD5] bg-white text-[#5B9BD5] hover:bg-[#5B9BD5] hover:text-white"
                >
                  Invia candidatura spontanea
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </article>
          </div>

          {/* Referral: invite someone suitable even before applying. */}
          <div className="mx-auto mt-8 max-w-5xl">
            <ShareInvite
              title="Non fa per te ma conosci la persona giusta?"
              subtitle="Aiutaci a trovarla: inoltra questa pagina a un amico o un collega che pensi abbia le caratteristiche adatte."
            />
          </div>
        </div>
      </section>

      {/* FORM */}
      <section id="candidatura" className="bg-gray-50 py-16 sm:py-20" ref={formRef}>
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            {success ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-[#2C3E50]">Candidatura inviata!</h2>
                <p className="mx-auto max-w-md text-gray-600 leading-relaxed">
                  Grazie {form.first_name}. Abbiamo ricevuto la tua candidatura e ti risponderemo appena possibile.
                  Trovi una conferma nella tua casella email.
                </p>
                <Button asChild variant="outline" className="mt-6 bg-transparent">
                  <Link href="/">Torna alla home</Link>
                </Button>

                <div className="mt-8 border-t border-gray-100 pt-6 text-left">
                  <ShareInvite
                    title="Conosci qualcuno di adatto?"
                    subtitle="Se pensi che un amico o un collega possa essere la persona giusta per 4 Bid, inoltragli questa pagina."
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8 text-center">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#5B9BD5]">Candidatura</p>
                  <h2 className="text-3xl font-bold text-[#2C3E50] text-balance">Raccontaci chi sei</h2>
                  <p className="mt-2 text-gray-600">
                    Un unico form per tutte le posizioni. I campi contrassegnati con * sono obbligatori.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
                >
                  {/* Honeypots: hidden from humans, tempting for bots. */}
                  <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
                    <label>
                      Website
                      <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot.website}
                        onChange={(e) => setHoneypot((h) => ({ ...h, website: e.target.value }))}
                      />
                    </label>
                    <label>
                      Fax
                      <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot.fax}
                        onChange={(e) => setHoneypot((h) => ({ ...h, fax: e.target.value }))}
                      />
                    </label>
                  </div>

                  {/* Position */}
                  <div className="space-y-2">
                    <Label htmlFor="position">Posizione *</Label>
                    <Select value={form.position_slug} onValueChange={(v) => selectPositionInline(v)}>
                      <SelectTrigger id="position">
                        <SelectValue placeholder="Seleziona una posizione" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((p) => (
                          <SelectItem key={p.slug} value={p.slug}>
                            {p.title}
                          </SelectItem>
                        ))}
                        <SelectItem value={SPONTANEOUS_SLUG}>{SPONTANEOUS_LABEL}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Nome *</Label>
                      <Input id="first_name" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Cognome *</Label>
                      <Input id="last_name" value={form.last_name} onChange={(e) => set("last_name", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefono</Label>
                      <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Città</Label>
                      <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url">LinkedIn</Label>
                      <Input id="linkedin_url" placeholder="https://linkedin.com/in/..." value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="portfolio_url">GitHub / Portfolio (opzionale)</Label>
                      <Input id="portfolio_url" placeholder="https://github.com/..." value={form.portfolio_url} onChange={(e) => set("portfolio_url", e.target.value)} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="current_occupation">Ruolo / esperienza attuale</Label>
                      <Input id="current_occupation" value={form.current_occupation} onChange={(e) => set("current_occupation", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="presentation">Breve presentazione</Label>
                    <Textarea id="presentation" rows={4} value={form.presentation} onChange={(e) => set("presentation", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motivation">Perché vorresti lavorare con 4 Bid?</Label>
                    <Textarea id="motivation" rows={4} value={form.motivation} onChange={(e) => set("motivation", e.target.value)} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="availability">Disponibilità</Label>
                      <Input id="availability" placeholder="es. immediata, da settembre..." value={form.availability} onChange={(e) => set("availability", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferred_engagement">Modalità di collaborazione preferita</Label>
                      <Input id="preferred_engagement" placeholder="es. dipendente, freelance, P.IVA..." value={form.preferred_engagement} onChange={(e) => set("preferred_engagement", e.target.value)} />
                    </div>
                  </div>

                  {/* Dynamic, position-specific fields */}
                  {extraFields.length > 0 && (
                    <div className="space-y-4 rounded-xl border border-[#5B9BD5]/20 bg-[#5B9BD5]/5 p-4 sm:p-5">
                      <p className="text-sm font-semibold text-[#2C3E50]">
                        Domande specifiche per: {selectedPosition?.title}
                      </p>
                      {extraFields.map((field) => (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={`x-${field.key}`}>
                            {field.label}
                            {field.required ? " *" : ""}
                          </Label>
                          {field.type === "textarea" ? (
                            <Textarea
                              id={`x-${field.key}`}
                              rows={3}
                              value={answers[field.key] ?? ""}
                              onChange={(e) => setAnswers((a) => ({ ...a, [field.key]: e.target.value }))}
                            />
                          ) : field.type === "select" ? (
                            <Select
                              value={answers[field.key] ?? ""}
                              onValueChange={(v) => setAnswers((a) => ({ ...a, [field.key]: v }))}
                            >
                              <SelectTrigger id={`x-${field.key}`}>
                                <SelectValue placeholder="Seleziona..." />
                              </SelectTrigger>
                              <SelectContent>
                                {(field.options ?? []).map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id={`x-${field.key}`}
                              placeholder={field.placeholder}
                              value={answers[field.key] ?? ""}
                              onChange={(e) => setAnswers((a) => ({ ...a, [field.key]: e.target.value }))}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CV upload */}
                  <div className="space-y-2">
                    <Label htmlFor="cv">CV (PDF, max 5 MB)</Label>
                    <label
                      htmlFor="cv"
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm text-gray-600 transition-colors hover:border-[#5B9BD5] hover:bg-[#5B9BD5]/5"
                    >
                      {cvFile ? (
                        <>
                          <FileText className="h-5 w-5 flex-shrink-0 text-[#5B9BD5]" />
                          <span className="truncate font-medium text-[#2C3E50]">{cvFile.name}</span>
                          <span className="ml-auto text-xs text-gray-400">Cambia file</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 flex-shrink-0 text-[#5B9BD5]" />
                          <span>Carica il tuo CV in formato PDF</span>
                        </>
                      )}
                      <input id="cv" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={onFile} />
                    </label>
                  </div>

                  {/* Consent */}
                  <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
                    <Checkbox
                      id="consent"
                      checked={consent}
                      onCheckedChange={(c) => setConsent(c === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="consent" className="text-sm font-normal leading-relaxed text-gray-600">
                      Ho letto l&apos;
                      <Link href="/privacy" target="_blank" className="font-medium text-[#5B9BD5] underline">
                        informativa sulla privacy
                      </Link>{" "}
                      e acconsento al trattamento dei miei dati personali (inclusi CV e dati di contatto) per finalità di
                      selezione e recruiting da parte di 4 Bid Srl. *
                    </Label>
                  </div>

                  {error && (
                    <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#F4B942] text-[#2C3E50] hover:bg-[#E5A82E]"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        Invia candidatura
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )

  // Selecting from the in-form dropdown must reset dynamic answers too, but
  // without the scroll (the user is already at the form).
  function selectPositionInline(slug: string) {
    setForm((f) => ({ ...f, position_slug: slug }))
    setAnswers({})
    setError(null)
  }
}
