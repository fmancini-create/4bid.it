"use client"

import { useEffect } from "react"

interface LandingPageTrackerProps {
  slug: string
}

export function LandingPageTracker({ slug }: LandingPageTrackerProps) {
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch("/api/landing-pages/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        })
      } catch (error) {
        console.error("[v0] Failed to track view:", error)
      }
    }

    trackView()
  }, [slug])

  return null // This component doesn't render anything
}
