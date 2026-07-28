/**
 * Invitation landing page.
 *
 * The token arrives as a path segment. It is resolved server-side with the
 * service role so the browser never receives the token hash or any project data
 * it is not entitled to. `noindex` is essential: these URLs are credentials.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

import { createAdminClient } from "@/lib/supabase/server"
import {
  hashInvitationToken,
  invitationRejection,
  INVITATION_REJECTION_MESSAGE,
} from "@/lib/project-room/invitations"
import { ROLE_LABELS } from "@/lib/project-room/types"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import InviteClient from "./client"

export const metadata: Metadata = {
  title: "Invito | Area riservata 4Bid",
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = "force-dynamic"

/**
 * Site chrome around the invitation. The invitee arrives here from an email with
 * no other context, so the 4Bid logo and footer are what tell them the page is
 * genuinely ours before they are asked to choose a password.
 */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {children}
      <Footer />
    </div>
  )
}

function Problem({ message }: { message: string }) {
  return (
    <Shell>
      <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 pb-16 pt-24">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
          <h1 className="text-lg font-semibold text-foreground">Invito non utilizzabile</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
          <Link
            href="/area-riservata/login"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Vai al login
          </Link>
        </div>
      </main>
    </Shell>
  )
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const db = createAdminClient()
  const { data: invitation } = await db
    .from("pr_invitations")
    .select("id, project_id, email, role, expires_at, accepted_at, revoked_at")
    .eq("token", hashInvitationToken(decodeURIComponent(token)))
    .maybeSingle()

  if (!invitation) {
    return <Problem message="Il link non e valido. Verifica di aver copiato l'indirizzo completo." />
  }

  const rejection = invitationRejection(invitation)
  if (rejection) {
    return <Problem message={INVITATION_REJECTION_MESSAGE[rejection]} />
  }

  const { data: project } = await db
    .from("pr_projects")
    .select("name")
    .eq("id", invitation.project_id)
    .maybeSingle()

  return (
    <Shell>
      <InviteClient
        token={token}
        email={invitation.email}
        projectName={project?.name ?? "Progetto riservato"}
        roleLabel={ROLE_LABELS[invitation.role as keyof typeof ROLE_LABELS] ?? invitation.role}
        expiresAt={invitation.expires_at}
      />
    </Shell>
  )
}
