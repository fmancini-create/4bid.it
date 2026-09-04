"use client"

import { Analytics } from "@vercel/analytics/next"
import { usePathname } from "next/navigation"
import { isPrivateArea } from "@/lib/is-private-area"

/**
 * Vercel Analytics deve seguire lo stesso confine privacy di GA/GTM/Yandex.
 * Il root layout non conosce il pathname lato server, quindi il filtro viene
 * applicato client-side prima di montare il componente Analytics.
 */
export function PublicAnalytics() {
  const pathname = usePathname()

  if (isPrivateArea(pathname)) return null

  return <Analytics />
}
