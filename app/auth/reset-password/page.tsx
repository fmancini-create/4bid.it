import { Suspense } from "react"
import type { Metadata } from "next"
import ResetPasswordClient from "./client"

export const metadata: Metadata = {
  title: "Imposta una nuova password | 4BID",
  description: "Scegli una nuova password per accedere alla tua area 4BID.",
  robots: { index: false, follow: false },
}

/**
 * Lives under /auth (not /admin) on purpose: the proxy guards /admin and
 * /area-riservata by session, and a password reset by definition happens when
 * the user cannot sign in. Putting the form behind that guard is what made the
 * previous link bounce straight back to the login page.
 */
/** Same constant the /admin guards use, so the redirect after a successful reset
 *  lands the super admin on /admin and everyone else in the Project Room. */
const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient adminEmail={SUPER_ADMIN_EMAIL} />
    </Suspense>
  )
}
