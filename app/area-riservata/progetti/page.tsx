import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { FileText, FolderOpen, MessageSquare } from "lucide-react"
import { requireUser } from "@/lib/project-room/auth"
import { getProfile, listProjectsForUser } from "@/lib/project-room/queries"
import { ProjectRoomShell } from "@/components/project-room/shell"
import { ProjectStatusBadge } from "@/components/project-room/status-badge"
import { ROLE_LABELS } from "@/lib/project-room/types"

export const metadata: Metadata = {
  title: "I miei progetti - Area Riservata 4BID",
  description: "Elenco dei progetti condivisi con te nella Project Room 4BID.",
  robots: { index: false, follow: false },
}

export default async function ProjectsPage() {
  const guard = await requireUser()
  if (!guard.ok) {
    redirect("/area-riservata/login?redirect=/area-riservata/progetti")
  }

  const [profile, projects] = await Promise.all([
    getProfile(guard.data.id),
    listProjectsForUser(guard.data.id),
  ])

  return (
    <ProjectRoomShell profile={profile}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-navy">I miei progetti</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {projects.length === 0
            ? "Nessun progetto condiviso con il tuo account."
            : `${projects.length} ${projects.length === 1 ? "progetto condiviso" : "progetti condivisi"} con te.`}
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mb-2 font-semibold text-brand-navy">Nessun progetto disponibile</h2>
          <p className="mx-auto max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            Il tuo account non è ancora associato a nessun progetto. Se ti aspettavi di trovare un documento, contatta
            il tuo referente 4BID.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/area-riservata/progetti/${project.slug}`}
                className="flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <ProjectStatusBadge status={project.status} />
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                    {ROLE_LABELS[project.role]}
                  </span>
                </div>

                <div className="flex-1">
                  <h2 className="text-pretty font-bold leading-snug text-brand-navy">{project.name}</h2>
                  {project.client_name ? (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary-blue">
                      {project.client_name}
                    </p>
                  ) : null}
                  {project.description ? (
                    <p className="mt-2 line-clamp-3 text-pretty text-sm leading-relaxed text-muted-foreground">
                      {project.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    {project.document_count} {project.document_count === 1 ? "documento" : "documenti"}
                  </span>
                  {project.open_comment_count > 0 ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-brand-navy">
                      <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                      {project.open_comment_count} da valutare
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ProjectRoomShell>
  )
}
