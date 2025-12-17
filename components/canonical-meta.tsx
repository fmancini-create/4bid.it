"use client"
import { usePathname } from "next/navigation"

export function CanonicalMeta() {
  const pathname = usePathname()
  const canonicalUrl = `https://4bid.it${pathname}`

  return (
    <>
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:url" content={canonicalUrl} />
    </>
  )
}
