"use client"

import { useEffect, useState } from "react"
import DossierAvatarSpotlight from "./dossier-avatar-spotlight"
import DossierLiveAvatar from "./dossier-live-avatar"

function corporateDossierIsUnlocked() {
  if (typeof document === "undefined") return false

  const loginVisible = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).some((button) =>
    button.textContent?.includes("Accedi al dossier"),
  )

  const authenticatedHeaderVisible = Array.from(document.querySelectorAll<HTMLElement>("header p")).some((node) =>
    node.textContent?.trim().startsWith("Riservato ·"),
  )

  return authenticatedHeaderVisible && !loginVisible
}

export default function DossierAvatarGate({ token }: { token: string }) {
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    let frame: number | null = null

    const sync = () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        frame = null
        setUnlocked(corporateDossierIsUnlocked())
      })
    }

    sync()

    const observer = new MutationObserver(sync)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => {
      observer.disconnect()
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [])

  if (!unlocked) return null

  return (
    <>
      <DossierAvatarSpotlight token={token} />
      <DossierLiveAvatar token={token} />
    </>
  )
}
