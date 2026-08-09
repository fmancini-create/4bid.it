// Dati legali ufficiali dell'emittente (4BID SRL) da mostrare sulla pagina
// pubblica del preventivo. Fonte unica: coincide con lib/quotes/bank.ts e
// lib/quotes/pdf.ts. NON duplicare questi valori altrove: importa QUOTE_SELLER.
export const QUOTE_SELLER = {
  name: "4 bid srl",
  legalName: "4BID S.r.l.",
  tagline: "Soluzioni digitali e consulenza per l'ospitalità",
  address: "Via Sorripa, 10",
  zip: "50026",
  city: "San Casciano in Val di Pesa",
  province: "FI",
  vat: "06241710489",
  email: "clienti@4bid.it",
  website: "www.4bid.it",
} as const

// Indirizzo su singola riga nel formato canonico usato in fatture e documenti.
export const QUOTE_SELLER_ADDRESS_LINE = `${QUOTE_SELLER.address} - ${QUOTE_SELLER.zip} - ${QUOTE_SELLER.city} (${QUOTE_SELLER.province})`
