import type { ReactNode } from "react"
import { formatQuoteAmount } from "@/lib/quotes/types"
import { discountPercent } from "@/lib/quotes/commercial"

/**
 * Mostra un importo scontato con: prezzo netto in evidenza, badge con la
 * percentuale di sconto e prezzo di listino BARRATO. Se non c'e' sconto
 * (listino <= netto) mostra solo il netto, senza badge ne' barratura.
 * Usato nei riepiloghi del preventivo (vista commerce e vista semplice).
 */
export function DiscountedAmount({
  net,
  gross,
  currency,
  netClassName = "text-xl font-bold",
  suffix,
  align = "left",
}: {
  net: number
  gross: number
  currency?: string
  netClassName?: string
  suffix?: ReactNode
  align?: "left" | "right"
}) {
  const pct = discountPercent(gross, net)
  const hasDiscount = pct > 0
  return (
    <span className={`flex flex-col ${align === "right" ? "items-end" : "items-start"}`}>
      <span className="flex items-baseline gap-2">
        <span className={netClassName}>
          {formatQuoteAmount(net, currency)}
          {suffix}
        </span>
        {hasDiscount ? (
          <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-primary-foreground">
            -{pct}%
          </span>
        ) : null}
      </span>
      {hasDiscount ? (
        <span className="text-sm text-muted-foreground line-through">{formatQuoteAmount(gross, currency)}</span>
      ) : null}
    </span>
  )
}

export default DiscountedAmount
