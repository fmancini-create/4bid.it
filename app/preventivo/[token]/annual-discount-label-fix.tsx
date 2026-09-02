"use client"

import { useEffect } from "react"

/**
 * Normalizza la label dei selettori annuali gia renderizzati da QuoteCommerceView.
 * La vecchia forma "Annuale · -15%" puo sembrare visivamente un doppio meno;
 * la trasformiamo in "Annuale · sconto 15%" senza toccare alcun calcolo.
 */
export default function AnnualDiscountLabelFix() {
  useEffect(() => {
    const normalize = () => {
      document.querySelectorAll<HTMLButtonElement>('button[aria-label], button').forEach((button) => {
        const text = button.textContent?.trim() || ""
        const match = text.match(/^Annuale\s*·\s*-([0-9]+(?:[.,][0-9]+)?)%$/)
        if (!match) return
        button.textContent = `Annuale · sconto ${match[1]}%`
      })
    }

    normalize()
    const observer = new MutationObserver(normalize)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  return null
}
