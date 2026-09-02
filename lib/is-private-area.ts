/**
 * Routes that must never carry the public marketing/analytics furniture.
 *
 * This matters more than it looks. Yandex Metrika is initialised with
 * `webvisor: true` (session replay), which records the page DOM. Project Rooms
 * and shared Business Plan / Dossier Rooms render confidential documents, so
 * replaying those pages would ship the document contents themselves to a
 * third-party analytics provider. Page paths alone would also leak private
 * tokens, project slugs and document names.
 *
 * Kept as a single shared predicate so the header scripts, the SPA pageview
 * tracker and the support chat can never disagree about what is private.
 * Business-plan shares deliberately use first-party engagement tracking only.
 */
export const PRIVATE_AREA_PREFIXES = ["/area-riservata", "/admin", "/business-plan"] as const

export function isPrivateArea(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return PRIVATE_AREA_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

/**
 * The same check as an inline-script expression, for the analytics snippets that
 * run in <head> before React exists.
 */
export const IS_PRIVATE_AREA_JS = `(function(p){return ${JSON.stringify(
  PRIVATE_AREA_PREFIXES,
)}.some(function(x){return p===x||p.indexOf(x+"/")===0})})(location.pathname)`
