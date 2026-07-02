// Coordinate bancarie reali di 4BID SRL per il pagamento tramite bonifico.
// Fonte: documento anagrafico ufficiale 4BID (Chiantibanca). NON inventare o
// modificare questi dati: sono usati sia nella pagina pubblica del preventivo
// sia nell'email di conferma. Un valore env può sovrascriverli se necessario.

export const QUOTE_BANK_DETAILS = {
  holder: "4BID SRL",
  bank: "Chiantibanca",
  iban: process.env.NEXT_PUBLIC_QUOTE_IBAN?.trim() || "IT52M0867338050020000202592",
  address: "Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)",
  vat: "06241710489",
  paymentEmail: "clienti@4bid.it",
} as const

// Causale bonifico: il numero preventivo (fallback: token breve se mancante).
export function quoteTransferReason(quoteNumber: string | null | undefined, fallback: string): string {
  return (quoteNumber || fallback || "").trim()
}
