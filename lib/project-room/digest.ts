/**
 * Riepilogo email di "fine sessione" della Project Room.
 *
 * Il problema che risolve: chi commenta un documento lo fa a raffica — cinque
 * commenti su tre pagine in dieci minuti. Una mail per evento significherebbe
 * cinque mail, e la reazione prevedibile e' silenziare il mittente, cioe'
 * perdere anche gli avvisi importanti. Quindi si aspetta che l'attivita' si
 * fermi e si manda UN riepilogo.
 *
 * Non esiste una "sessione" tracciata nel prodotto: la fine sessione e' dedotta
 * dal silenzio. Se sul progetto non accade nulla per QUIET_MINUTES, la sessione
 * e' considerata chiusa.
 *
 * Tre proprieta' che il codice deve garantire, e che sono la parte difficile:
 *
 *   1. NIENTE DOPPI INVII. Il cron passa ogni 5 minuti sugli stessi dati: senza
 *      un watermark persistente (`pr_digest_state.notified_through`) ogni
 *      passaggio rispedirebbe tutto. Il watermark avanza solo dopo un invio
 *      riuscito.
 *   2. NIENTE STORICO RETROATTIVO. Alla prima attivazione il watermark NON parte
 *      dall'origine dei tempi, altrimenti il primo passaggio spedirebbe mesi di
 *      commenti vecchi come se fossero appena arrivati.
 *   3. NIENTE PERDITE SILENZIOSE. Se l'invio fallisce il watermark resta dov'e' e
 *      si riprova al passaggio successivo. Dopo MAX_ATTEMPTS tentativi si smette
 *      e il motivo resta scritto in `last_error`: preferibile a un ciclo infinito,
 *      ma deve essere leggibile, non silenzioso.
 */

import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-resend"
import { formatDateTimeNumericIT } from "@/lib/date-utils"
import { COMMENT_TYPE_LABELS } from "@/lib/project-room/types"
import { projectAudience } from "@/lib/project-room/activity"

/**
 * Minuti di silenzio dopo i quali la sessione e' considerata chiusa.
 *
 * Scelto dall'utente. Va letto insieme alla cadenza del cron (5 minuti): il
 * ritardo effettivo tra l'ultima azione e la mail e' quindi tra 5 e 10 minuti.
 * Piu' e' corto, piu' e' probabile che una pausa di lettura spezzi la sessione
 * in due mail invece di una.
 */
const QUIET_MINUTES = 5

/**
 * Quanto indietro guarda un progetto la PRIMA volta che viene inizializzato.
 *
 * Non zero: un commento arrivato pochi minuti prima del primo passaggio del cron
 * verrebbe altrimenti scartato per sempre. Non illimitato: vedi proprieta' (2).
 */
const INITIAL_LOOKBACK_MINUTES = 30

/** Oltre questo numero di fallimenti consecutivi si smette di riprovare. */
const MAX_ATTEMPTS = 5

/** Durata del lock di esecuzione. Piu' lunga del tempo di invio, di molto. */
const LOCK_MINUTES = 5

/** Quanti eventi vengono elencati per esteso prima di passare al conteggio. */
const MAX_DETAILED_EVENTS = 12

/** Lunghezza massima di un estratto. Un commento lungo non deve invadere la mail. */
const EXCERPT_CHARS = 240

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.4bid.it").replace(/\/$/, "")

const UNDELIVERABLE_TLDS = [".test", ".invalid", ".example", ".localhost", ".local"]

function isUndeliverable(email: string): boolean {
  const domain = email.split("@")[1] ?? ""
  return UNDELIVERABLE_TLDS.some((tld) => domain.endsWith(tld))
}

function esc(value: string | null | undefined): string {
  if (!value) return ""
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Taglia sul confine di parola e segnala il taglio, senza spezzare a meta'. */
function excerpt(text: string | null | undefined): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim()
  if (clean.length <= EXCERPT_CHARS) return clean
  const cut = clean.slice(0, EXCERPT_CHARS)
  const lastSpace = cut.lastIndexOf(" ")
  return `${cut.slice(0, lastSpace > EXCERPT_CHARS * 0.6 ? lastSpace : EXCERPT_CHARS)}…`
}

type EventKind = "commento" | "revisione" | "versione"

interface DigestEvent {
  kind: EventKind
  createdAt: string
  /** Id dell'autore, per risolvere il nome. */
  actorId: string | null
  documentId: string | null
  documentTitle?: string
  pageNumber: number | null
  /** Etichetta del tipo (es. "Correzione") quando disponibile. */
  typeLabel: string | null
  /** Testo mostrato nell'estratto. */
  body: string | null
}

export interface ProjectDigestOutcome {
  projectId: string
  projectName: string
  status: "inviato" | "sessione_in_corso" | "nessuna_novita" | "nessun_destinatario" | "errore" | "gia_in_corso" | "sospeso"
  events?: number
  recipients?: number
  error?: string
}

/**
 * Nome leggibile di una persona. Se il profilo non ha nome si usa l'email; se
 * manca anche quella, un'etichetta neutra — mai una stringa vuota, che nella
 * frase "X ha commentato" produrrebbe " ha commentato".
 */
function displayName(profile: { first_name?: string | null; last_name?: string | null; email?: string | null } | undefined): string {
  if (!profile) return "Un partecipante"
  const full = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
  if (full) return full
  if (profile.email) return profile.email
  return "Un partecipante"
}

/**
 * Eventi di un progetto piu' recenti del watermark.
 *
 * I commenti cancellati (soft delete) sono esclusi: avvisare di un commento che
 * l'autore ha ritirato manderebbe le persone a cercare qualcosa che non c'e'.
 */
async function collectEvents(projectId: string, since: string): Promise<DigestEvent[]> {
  const db = createAdminClient()

  const [comments, revisions, documents] = await Promise.all([
    db
      .from("pr_comments")
      .select("id, created_at, author_id, document_id, page_number, comment_type, content")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .gt("created_at", since)
      .order("created_at", { ascending: true }),
    db
      .from("pr_revision_proposals")
      .select("id, created_at, created_by, document_id, page_number, proposed_text")
      .eq("project_id", projectId)
      .gt("created_at", since)
      .order("created_at", { ascending: true }),
    // pr_document_versions non ha project_id: si passa dai documenti del progetto.
    db.from("pr_documents").select("id, title").eq("project_id", projectId),
  ])

  const docs = new Map<string, string>((documents.data ?? []).map((d) => [d.id as string, (d.title as string) ?? "Documento"]))

  const events: DigestEvent[] = []

  for (const c of comments.data ?? []) {
    events.push({
      kind: "commento",
      createdAt: c.created_at as string,
      actorId: (c.author_id as string) ?? null,
      documentId: (c.document_id as string) ?? null,
      documentTitle: docs.get(c.document_id as string),
      pageNumber: (c.page_number as number) ?? null,
      typeLabel: COMMENT_TYPE_LABELS[c.comment_type as keyof typeof COMMENT_TYPE_LABELS] ?? null,
      body: (c.content as string) ?? null,
    })
  }

  for (const r of revisions.data ?? []) {
    events.push({
      kind: "revisione",
      createdAt: r.created_at as string,
      actorId: (r.created_by as string) ?? null,
      documentId: (r.document_id as string) ?? null,
      documentTitle: docs.get(r.document_id as string),
      pageNumber: (r.page_number as number) ?? null,
      typeLabel: "Proposta di revisione",
      body: (r.proposed_text as string) ?? null,
    })
  }

  const docIds = [...docs.keys()]
  if (docIds.length > 0) {
    const { data: newVersions } = await createAdminClient()
      .from("pr_document_versions")
      .select("id, created_at, uploaded_by, document_id, version_number, version_label, changelog")
      .in("document_id", docIds)
      .gt("created_at", since)
      .order("created_at", { ascending: true })

    for (const v of newVersions ?? []) {
      events.push({
        kind: "versione",
        createdAt: v.created_at as string,
        actorId: (v.uploaded_by as string) ?? null,
        documentId: (v.document_id as string) ?? null,
        documentTitle: docs.get(v.document_id as string),
        pageNumber: null,
        typeLabel: `Nuova versione ${v.version_label ?? `v${v.version_number}`}`,
        body: (v.changelog as string) ?? null,
      })
    }
  }

  events.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return events
}

const KIND_NOUN: Record<EventKind, [string, string]> = {
  commento: ["commento", "commenti"],
  revisione: ["proposta di revisione", "proposte di revisione"],
  versione: ["nuova versione", "nuove versioni"],
}

/** "3 commenti e 1 nuova versione" — con singolari e plurali corretti. */
function summarise(events: DigestEvent[]): string {
  const counts = new Map<EventKind, number>()
  for (const e of events) counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1)

  const parts: string[] = []
  for (const kind of ["commento", "revisione", "versione"] as EventKind[]) {
    const n = counts.get(kind) ?? 0
    if (n === 0) continue
    const [one, many] = KIND_NOUN[kind]
    parts.push(`${n} ${n === 1 ? one : many}`)
  }

  // Accento letterale e non entita' HTML: questa stringa finisce anche
  // nell'OGGETTO della mail (vedi subject piu' sotto), dove "&agrave;" non
  // verrebbe interpretato e si leggerebbe "attivit&agrave;".
  if (parts.length === 0) return "attività"
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`
}

/** Esportata per poter ispezionare il corpo della mail senza spedirla. */
export function buildHtml(params: {
  projectName: string
  projectSlug: string | null
  events: DigestEvent[]
  names: Map<string, string>
}): string {
  const { projectName, projectSlug, events, names } = params
  const shown = events.slice(0, MAX_DETAILED_EVENTS)
  const hidden = events.length - shown.length

  const projectUrl = projectSlug
    ? `${SITE_URL}/area-riservata/progetti/${projectSlug}`
    : `${SITE_URL}/area-riservata/progetti`

  const items = shown
    .map((e) => {
      const who = esc(names.get(e.actorId ?? "") ?? "Un partecipante")
      const when = formatDateTimeNumericIT(e.createdAt)
      const where = [e.documentTitle ? esc(e.documentTitle) : null, e.pageNumber ? `pagina ${e.pageNumber}` : null]
        .filter(Boolean)
        .join(" · ")
      const link = e.documentId ? `${SITE_URL}/area-riservata/documenti/${e.documentId}` : projectUrl
      const body = excerpt(e.body)

      return `
      <div style="border-left:3px solid #5B9BD5;padding:0 0 0 14px;margin:0 0 18px">
        <p style="margin:0 0 2px;font-size:14px">
          <strong>${who}</strong>
          <span style="color:#52606d"> — ${esc(e.typeLabel ?? "")}</span>
        </p>
        <p style="margin:0 0 6px;color:#7b8794;font-size:12px">${when}${where ? ` · ${where}` : ""}</p>
        ${
          body
            ? `<p style="margin:0 0 6px;padding:8px 12px;background:#f5f7fa;border-radius:4px;white-space:pre-wrap;font-size:14px">${esc(body)}</p>`
            : ""
        }
        <p style="margin:0"><a href="${link}" style="color:#2f6f9f;font-size:13px">Apri nel documento</a></p>
      </div>`
    })
    .join("")

  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2933;max-width:560px">
  <h2 style="margin:0 0 4px;font-size:19px">Novit&agrave; su ${esc(projectName)}</h2>
  <p style="margin:0 0 20px;color:#52606d">${summarise(events)} da leggere nella Project Room.</p>

  ${items}

  ${
    hidden > 0
      ? `<p style="margin:0 0 20px;color:#52606d;font-size:14px">e altri ${hidden} interventi non elencati qui.</p>`
      : ""
  }

  <p style="margin:0 0 20px">
    <a href="${projectUrl}" style="display:inline-block;background:#5B9BD5;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:6px;font-weight:600">Apri la Project Room</a>
  </p>

  <p style="margin:0;color:#7b8794;font-size:13px">
    Ricevi questo riepilogo perch&eacute; partecipi al progetto. I contenuti sono riservati
    e confidenziali: non inoltrare questo messaggio.
  </p>
</div>`
}

/**
 * Elabora un singolo progetto. Ritorna sempre un esito, non solleva mai:
 * un progetto che fallisce non deve impedire agli altri di essere elaborati.
 */
async function processProject(project: {
  id: string
  name: string
  slug: string | null
}): Promise<ProjectDigestOutcome> {
  const db = createAdminClient()
  const base = { projectId: project.id, projectName: project.name }

  try {
    // Stato, creato al primo passaggio. Il watermark iniziale guarda indietro solo
    // INITIAL_LOOKBACK_MINUTES: vedi proprieta' (2) in testa al file.
    const { data: existing } = await db
      .from("pr_digest_state")
      .select("project_id, notified_through, attempts, locked_until")
      .eq("project_id", project.id)
      .maybeSingle()

    let state = existing
    if (!state) {
      const initial = new Date(Date.now() - INITIAL_LOOKBACK_MINUTES * 60_000).toISOString()
      const { data: created, error } = await db
        .from("pr_digest_state")
        .insert({ project_id: project.id, notified_through: initial })
        .select("project_id, notified_through, attempts, locked_until")
        .single()
      if (error) return { ...base, status: "errore", error: error.message }
      state = created
    }

    if ((state.attempts ?? 0) >= MAX_ATTEMPTS) {
      return { ...base, status: "sospeso" }
    }

    const events = await collectEvents(project.id, state.notified_through as string)
    if (events.length === 0) return { ...base, status: "nessuna_novita" }

    // Sessione ancora aperta: l'ultimo evento e' troppo recente. Non si manda
    // nulla e si riprova al prossimo passaggio, quando il silenzio sara' maturo.
    const lastEventAt = events[events.length - 1].createdAt
    const quietSince = Date.now() - new Date(lastEventAt).getTime()
    if (quietSince < QUIET_MINUTES * 60_000) {
      return { ...base, status: "sessione_in_corso", events: events.length }
    }

    // Lock: prenota il progetto solo se nessun altro lo sta elaborando, cosi' due
    // esecuzioni sovrapposte non possono spedire entrambe la stessa mail.
    // La condizione sta nel database (funzione pr_claim_digest_lock) e non in un
    // filtro PostgREST: `.or("locked_until.lt.<iso>")` fallisce con "column ...
    // does not exist" perche' i punti dei millisecondi rompono il parser dei
    // filtri. Con l'errore ingoiato il codice concludeva "gia' in corso" e il
    // riepilogo non partiva MAI: difetto trovato solo eseguendolo davvero.
    const { data: claimedRows, error: lockError } = await db.rpc("pr_claim_digest_lock", {
      p_project_id: project.id,
      p_lock_minutes: LOCK_MINUTES,
    })

    // Un errore qui NON e' "qualcun altro sta elaborando": e' un guasto, e va
    // dichiarato. Confonderli e' esattamente cio' che nascondeva il difetto.
    if (lockError) {
      return { ...base, status: "errore", error: `Lock non acquisibile: ${lockError.message}` }
    }

    const claimed = Array.isArray(claimedRows) ? claimedRows[0] : claimedRows
    if (!claimed) return { ...base, status: "gia_in_corso" }

    // Destinatari: membri del progetto + admin dell'organizzazione. Per scelta
    // dell'utente include anche l'autore delle azioni (fa da ricevuta).
    const audience = await projectAudience(project.id)
    const actorIds = [...new Set(events.map((e) => e.actorId).filter((id): id is string => Boolean(id)))]
    const allIds = [...new Set([...audience, ...actorIds])]

    const { data: profiles } = await db
      .from("profiles")
      .select("id, email, first_name, last_name")
      .in("id", allIds.length > 0 ? allIds : ["00000000-0000-0000-0000-000000000000"])

    const names = new Map<string, string>()
    for (const p of profiles ?? []) names.set(p.id as string, displayName(p))

    const recipients = [
      ...new Set(
        (profiles ?? [])
          .filter((p) => audience.includes(p.id as string))
          .map((p) => (typeof p.email === "string" ? p.email.trim().toLowerCase() : ""))
          .filter((email) => email.includes("@") && !isUndeliverable(email)),
      ),
    ]

    if (recipients.length === 0) {
      // Non e' un errore da riprovare all'infinito: il progetto non ha indirizzi
      // recapitabili. Il watermark avanza, altrimenti ogni passaggio rifarebbe
      // lo stesso lavoro inutilmente.
      await db
        .from("pr_digest_state")
        .update({ notified_through: lastEventAt, locked_until: null, last_error: "Nessun destinatario recapitabile." })
        .eq("project_id", project.id)
      return { ...base, status: "nessun_destinatario", events: events.length }
    }

    const html = buildHtml({ projectName: project.name, projectSlug: project.slug, events, names })
    const subject = `${project.name}: ${summarise(events)}`

    const result = await sendEmail({
      // Array e non stringa con virgole: Resend risponde 422 in quel caso.
      to: recipients,
      subject,
      html,
      // Riepilogo di collaborazione su un'area riservata: transazionale, non
      // marketing. Un link di disiscrizione one-click spegnerebbe l'unico canale
      // con cui i partecipanti vengono avvisati.
      listUnsubscribe: false,
      // Questo commento diceva "non marketing" mentre il messaggio partiva da
      // `marketing@mrk.4bid.it`, lo stesso mittente di 31.000 email di campagna.
      transactional: true,
    })

    if (!result.success) {
      await db
        .from("pr_digest_state")
        .update({ attempts: (state.attempts ?? 0) + 1, last_error: result.error ?? "Invio non riuscito.", locked_until: null })
        .eq("project_id", project.id)
      return { ...base, status: "errore", error: result.error, events: events.length }
    }

    // Solo ora il watermark avanza: fino a questo punto un fallimento lasciava
    // gli eventi "da comunicare", che e' il comportamento voluto.
    await db
      .from("pr_digest_state")
      .update({
        notified_through: lastEventAt,
        last_sent_at: new Date().toISOString(),
        last_recipients: recipients.length,
        attempts: 0,
        last_error: null,
        locked_until: null,
      })
      .eq("project_id", project.id)

    return { ...base, status: "inviato", events: events.length, recipients: recipients.length }
  } catch (error) {
    // Il lock scade da solo dopo LOCK_MINUTES, quindi un'eccezione qui non
    // blocca il progetto per sempre.
    const message = error instanceof Error ? error.message : "errore sconosciuto"
    console.log("[v0] digest processProject failed:", project.id, message)
    return { ...base, status: "errore", error: message }
  }
}

/** Elabora tutti i progetti non archiviati. Usata dal cron e dal test manuale. */
export async function runProjectRoomDigest(): Promise<{
  processed: number
  sent: number
  outcomes: ProjectDigestOutcome[]
}> {
  const db = createAdminClient()
  const { data: projects, error } = await db.from("pr_projects").select("id, name, slug").neq("status", "archiviato")

  if (error) {
    console.log("[v0] digest: lettura progetti fallita:", error.message)
    return { processed: 0, sent: 0, outcomes: [] }
  }

  const outcomes: ProjectDigestOutcome[] = []
  for (const p of projects ?? []) {
    outcomes.push(
      await processProject({ id: p.id as string, name: (p.name as string) ?? "Progetto", slug: (p.slug as string) ?? null }),
    )
  }

  return {
    processed: outcomes.length,
    sent: outcomes.filter((o) => o.status === "inviato").length,
    outcomes,
  }
}
