import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { requireDocumentAccess } from "@/lib/project-room/auth"
import {
  getProfile,
  listComments,
  listDocuments,
  listProjectsForUser,
  listRevisions,
} from "@/lib/project-room/queries"
import { ProjectRoomShell } from "@/components/project-room/shell"
import { BreadcrumbTrail } from "@/components/project-room/breadcrumb-trail"
import { DocumentWorkspaceClient } from "@/components/project-room/document-workspace-client"
import { VersionStatusBadge } from "@/components/project-room/status-badge"
import { ROLE_LABELS } from "@/lib/project-room/types"
import { recordAudit } from "@/lib/project-room/activity"

export const metadata: Metadata = {
  title: "Documento | Area riservata 4BID",
  robots: { index: false, follow: false },
}

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ versione?: string }>
}) {
  const { id } = await params
  const { versione } = await searchParams

  const access = await requireDocumentAccess(id)
  if (!access.ok) {
    // 401 means "not signed in"; anything else must not reveal whether this
    // document exists, so it collapses into a 404.
    if (access.status === 401) {
      redirect(`/area-riservata/login?redirect=/area-riservata/documenti/${id}`)
    }
    notFound()
  }

  const { projectId, documentId, role, canDownload: memberCanDownload, user } = access.data

  const [documents, projects, profile] = await Promise.all([
    listDocuments(projectId),
    listProjectsForUser(user.id),
    getProfile(user.id),
  ])

  const document = documents.find((d) => d.id === documentId)
  const project = projects.find((p) => p.id === projectId)
  if (!document || !project) notFound()

  if (document.versions.length === 0) {
    return (
      <ProjectRoomShell
        profile={profile}
        breadcrumb={
          <BreadcrumbTrail
            items={[
              { label: "Progetti", href: "/area-riservata/progetti" },
              { label: project.name, href: `/area-riservata/progetti/${project.slug}` },
              { label: document.title },
            ]}
          />
        }
      >
        <h1 className="text-2xl font-semibold text-brand-navy">{document.title}</h1>
        <p className="mt-3 rounded-lg border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          Nessuna versione e ancora stata caricata per questo documento.
        </p>
      </ProjectRoomShell>
    )
  }

  // A `versione` from the query string is honoured only if it belongs to this
  // document, otherwise it is a way to probe for other documents' versions.
  const requested = versione ? document.versions.find((v) => v.id === versione) : undefined
  const activeVersion =
    requested ?? document.versions.find((v) => v.id === document.current_version_id) ?? document.versions[0]

  const [comments, revisions] = await Promise.all([
    listComments({ documentId, versionId: activeVersion.id }),
    listRevisions(documentId),
  ])

  await recordAudit({
    projectId,
    userId: user.id,
    action: "document.viewed",
    entityType: "version",
    entityId: activeVersion.id,
    metadata: { document_id: documentId },
  })

  return (
    <ProjectRoomShell
      profile={profile}
      breadcrumb={
        <BreadcrumbTrail
          items={[
            { label: "Progetti", href: "/area-riservata/progetti" },
            { label: project.name, href: `/area-riservata/progetti/${project.slug}` },
            { label: document.title },
          ]}
        />
      }
    >
      <header className="mb-6 flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-balance text-xl font-semibold text-brand-navy md:text-2xl">{document.title}</h1>
          {document.description ? (
            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              {document.description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
          <VersionStatusBadge status={activeVersion.status} />
          <span className="text-xs text-muted-foreground">Il tuo ruolo: {ROLE_LABELS[role]}</span>
        </div>
      </header>

      <DocumentWorkspaceClient
        document={document}
        activeVersion={activeVersion}
        comments={comments}
        revisions={revisions}
        role={role}
        memberCanDownload={memberCanDownload}
        viewerId={user.id}
      />
    </ProjectRoomShell>
  )
}
