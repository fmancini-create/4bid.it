"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"

/**
 * Input quantità robusto per il builder preventivi.
 *
 * Problema che risolve: gli input quantità erano controllati con
 * `value={item.quantity || 1}` e ricalcolavano la riga a ogni battitura passando
 * da `calculateQuoteLine`, che forza `Math.max(1, ...)`. Appena l'utente
 * svuotava il campo per digitare un nuovo numero, il valore tornava subito a 1 e
 * il cursore si resettava: sembrava impossibile modificare la quantità.
 *
 * Qui teniamo una bozza testuale locale: il campo può restare vuoto o contenere
 * cifre intermedie mentre si digita, si committa il numero solo quando è valido,
 * e si clampa al minimo soltanto al blur.
 */
export function QuantityInput({
  value,
  onCommit,
  min = 1,
  className,
  "aria-label": ariaLabel,
}: {
  value: number
  onCommit: (n: number) => void
  min?: number
  className?: string
  "aria-label"?: string
}) {
  const [draft, setDraft] = useState(String(value ?? min))

  // Riallinea la bozza quando il valore esterno cambia davvero (es. ricalcolo
  // della configurazione Santaddeo). Se il valore committato coincide con quanto
  // già digitato, setDraft riscrive la stessa stringa e non disturba il cursore.
  useEffect(() => {
    setDraft(String(value ?? min))
  }, [value, min])

  return (
    <Input
      type="number"
      min={min}
      step="1"
      inputMode="numeric"
      value={draft}
      aria-label={ariaLabel}
      className={className}
      onChange={(e) => {
        const raw = e.target.value
        setDraft(raw) // consenti vuoto / cifre intermedie senza snap a 1
        if (raw === "") return
        const n = Number(raw)
        if (Number.isFinite(n) && n >= min) onCommit(Math.floor(n))
      }}
      onBlur={() => {
        const n = Number(draft)
        const clamped = Number.isFinite(n) && n >= min ? Math.floor(n) : min
        setDraft(String(clamped))
        onCommit(clamped)
      }}
    />
  )
}
