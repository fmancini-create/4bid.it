import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { FileText, MessageSquare, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getProfile, getProjectBySlug, listDocuments, listProjectMembers } from "@/lib/project-room/queries"
import { ProjectRoomShell } from "@/components/project-room/shell"
import { BreadcrumbTrail } from "@/components/project-room/breadcrumb-trail"
import { ProjectStatusBadge, VersionStatusBadge } from "@/components/project-room/status-badge"
import { SmartUniformProposal } from "@/components/project-room/smartuniform-proposal"
import { ROLE_LABELS, displayName } from "@/lib/project-room/types"
import { canManageMembers } from "@/lib/project-room/permissions"
import { recordAudit } from "@/lib/project-room/activity"

export const metadata: Metadata = {
  title: "Progetto | Area riservata 4BID",
  robots: { index: false, follow: false },
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/area-riservata/login?redirect=/area-riservata/progetti/${slug}`)
  }

  const project = await getProjectBySlug(slug, user.id)
  // A project the viewer has no role on is indistinguishable from one that does
  // not exist: 404 rather than 403, so the URL reveals nothing.
  if (!project) notFound()

  const [documents, members, profile] = await Promise.all([
    listDocuments(project.id),
    listProjectMembers(project.id),
    getProfile(user.id),
  ])

  await recordAudit({
    projectId: project.id,
    userId: user.id,
    action: "project.viewed",
    entityType: "project",
    entityId: project.id,
  })

  const isSmartUniform = project.slug === "smartuniform"

  return (
    <ProjectRoomShell
      profile={profile}
      breadcrumb={
        <BreadcrumbTrail
          items={[{ label: "Progetti", href: "/area-riservata/progetti" }, { label: project.name }]}
        />
      }
    >
      <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          {project.client_name && (
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {project.client_name}
            </span>
          )}
          <h1 className="text-balance text-2xl font-semibold text-brand-navy md:text-3xl">{project.name}</h1>
          {project.description && (
            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <ProjectStatusBadge status={project.status} />
          <span className="text-xs text-muted-foreground">Il tuo ruolo: {ROLE_LABELS[project.role]}</span>
        </div>
      </header>

      {isSmartUniform ? <SmartUniformProposal /> : null}

      <section aria-labelledby="documenti-title" className="mt-8">
        <h2 id="documenti-title" className="mb-4 flex items-center gap-2 text-lg font-semibold text-brand-navy">
          <FileText className="size-5 text-primary-blue" aria-hidden="true" />
          Documenti
        </h2>

        {documents.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
            Nessun documento condiviso in questo progetto.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {documents.map((doc) => {
              const current = doc.versions.find((v) => v.id === doc.current_version_id) ?? doc.versions[0] ?? null
              return (
                <li key={doc.id}>
                  <Link
                    href={`/area-riservata/documenti/${doc.id}`}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">{doc.title}</span>
                      {doc.description && <span className="text-sm text-muted-foreground">{doc.description}</span>}
                      <span className="text-xs text-muted-foreground">
                        {doc.versions.length === 0
                          ? "Nessuna versione"
                          : `${doc.versions.length} version${doc.versions.length === 1 ? "e" : "i"}`}
                        {current ? ` · attuale ${current.version_label}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {current && <VersionStatusBadge status={current.status} />}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="membri-title" className="mt-10">
        <h2 id="membri-title" className="mb-4 flex items-center gap-2 text-lg font-semibold text-brand-navy">
          <Users className="size-5 text-primary-blue" aria-hidden="true" />
          Partecipanti
        </h2>

        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun partecipante esplicito su questo progetto.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {members.map((member) => (
              <li key={member.user_id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{displayName(member.profile)}</span>
                  {member.profile?.company && (
                    <span className="text-xs text-muted-foreground">{member.profile.company}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{ROLE_LABELS[member.role]}</span>
              </li>
            ))}
          </ul>
        )}

        {canManageMembers(project.role) && (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="size-3.5" aria-hidden="true" />
            Gli inviti si gestiscono dalla console di amministrazione.
          </p>
        )}
      </section>
    </ProjectRoomShell>
  )
}
