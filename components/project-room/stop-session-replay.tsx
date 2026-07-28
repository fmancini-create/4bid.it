"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    yandexMetrikaLoaded?: boolean
  }
}

/**
 * Closes the last gap in keeping session replay out of the document room.
 *
 * The scripts in the root layout already refuse to initialise Yandex Metrika
 * (which runs with `webvisor: true`, i.e. DOM session replay) when the initial
 * document is a reserved-area URL. That guard runs once per document load, so it
 * does NOT help when the visitor was on a public page - where the recorder did
 * start - and then reached the reserved area through a client-side navigation.
 * In that case the recorder is already live and would capture confidential
 * document contents.
 *
 * Metrika exposes no reliable way to stop an active webvisor recording, so the
 * only dependable remedy is to reload the page as a fresh document: the head
 * guard then sees a reserved-area path and never starts the recorder. A
 * sessionStorage marker makes this happen at most once, so a mis-set flag can
 * never turn into a reload loop.
 */
const RELOAD_MARKER = "pr-replay-reload"

export function StopSessionReplay() {
  useEffect(() => {
    if (!window.yandexMetrikaLoaded) return
    if (sessionStorage.getItem(RELOAD_MARKER)) return

    sessionStorage.setItem(RELOAD_MARKER, "1")
    window.location.reload()
  }, [])

  return null
}
