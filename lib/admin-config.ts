/**
 * Single source of truth for who may enter the back office.
 *
 * This address used to be copy-pasted as a literal into app/admin/page.tsx and
 * app/admin/login/page.tsx. There is no SUPER_ADMIN_EMAIL environment variable in
 * this project, so anything reading process.env.SUPER_ADMIN_EMAIL silently gets
 * undefined and every comparison against it fails.
 */
export const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && email.trim().toLowerCase() === SUPER_ADMIN_EMAIL
}
