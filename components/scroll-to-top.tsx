"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // Check if the URL has a hash (anchor link like #contact, #services, etc.)
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" })
    }
    // If there's a hash, let the browser handle the scroll to the anchor naturally
  }, [pathname])

  return null
}
