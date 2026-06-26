"use client"

import { useEffect } from "react"

interface LandingPageTrackerProps {
  slug: string
}

export function LandingPageTracker({ slug }: LandingPageTrackerProps) {
  useEffect(() => {
    if (typeof window === "undefined") return
    // Fire-and-forget with timeout — never throws, never blocks render
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    fetch("/api/landing-pages/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      signal: controller.signal,
    })
      .catch(() => {/* non-critical */})
      .finally(() => clearTimeout(timeout))
  }, [slug])

  return null
}
