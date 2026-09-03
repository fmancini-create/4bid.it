"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
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

function findPresentationCard() {
  const title = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-slot="card-title"], [class*="card-title"], h1, h2, h3, h4, div, p',
    ),
  ).find((node) => node.textContent?.trim() === "Presentazione prodotti")

  if (!title) return null

  let node: HTMLElement | null = title
  while (node && node !== document.body) {
    const text = node.textContent || ""
    const looksLikeCard =
      node.dataset.slot === "card" ||
      node.getAttribute("data-slot") === "card" ||
      node.className.includes("rounded") ||
      node.className.includes("shadow")

    if (looksLikeCard && text.includes("Presentazione prodotti")) return node
    node = node.parentElement
  }

  return null
}

export default function DossierAvatarGate({ token }: { token: string }) {
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let frame: number | null = null
    let host: HTMLDivElement | null = null
    let card: HTMLElement | null = null
    let originalCardStyle: string | null = null
    const hiddenChildren = new Map<HTMLElement, string>()

    const mountInsidePresentationCard = () => {
      if (host || !corporateDossierIsUnlocked()) return

      const target = findPresentationCard()
      if (!target) return

      card = target
      originalCardStyle = card.getAttribute("style")

      Array.from(card.children).forEach((child) => {
        if (!(child instanceof HTMLElement)) return
        hiddenChildren.set(child, child.style.display)
        child.style.display = "none"
      })

      card.style.position = "relative"
      card.style.overflow = "hidden"
      card.style.minHeight = "430px"
      card.style.padding = "0"
      card.style.background = "#000"
      card.style.borderColor = "rgba(255,255,255,.10)"

      host = document.createElement("div")
      host.dataset.dossierAvatarHost = "true"
      Object.assign(host.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        background: "#000",
        zIndex: "10",
      })
      card.appendChild(host)
      setPortalHost(host)

      const styleEmbeddedPlayer = () => {
        if (!host) return

        const section = host.querySelector<HTMLElement>("section")
        if (section) {
          Object.assign(section.style, {
            width: "100%",
            height: "100%",
            padding: "0",
            border: "0",
            background: "#000",
          })
        }

        const frameElement = section?.firstElementChild
        if (frameElement instanceof HTMLElement) {
          Object.assign(frameElement.style, {
            width: "100%",
            maxWidth: "none",
            height: "100%",
            minHeight: "100%",
            border: "0",
            borderRadius: "0",
            boxShadow: "none",
          })
        }

        const video = host.querySelector<HTMLVideoElement>("video")
        if (video) {
          video.style.objectFit = "cover"
          video.style.objectPosition = "center 18%"
        }
      }

      styleEmbeddedPlayer()
      const hostObserver = new MutationObserver(styleEmbeddedPlayer)
      hostObserver.observe(host, { childList: true, subtree: true })
      ;(host as HTMLDivElement & { __avatarObserver?: MutationObserver }).__avatarObserver = hostObserver
    }

    const sync = () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        frame = null
        mountInsidePresentationCard()
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

      if (host) {
        ;(host as HTMLDivElement & { __avatarObserver?: MutationObserver }).__avatarObserver?.disconnect()
        host.remove()
      }

      hiddenChildren.forEach((display, child) => {
        child.style.display = display
      })

      if (card) {
        if (originalCardStyle === null) card.removeAttribute("style")
        else card.setAttribute("style", originalCardStyle)
      }
    }
  }, [])

  if (!portalHost) return null
  return createPortal(<DossierLiveAvatar token={token} />, portalHost)
}
