import Volantino2Client from "./volantino-2-client"

export const metadata = {
  title: "Volantino Suite 4BID v2 | Software per Hotel, Turismo e Mobilita Elettrica",
  description:
    "La suite 4BID al completo: Santaddeo, HotelProfit AI, Manubot, Hotel Accelerator e 4BID Ecomobility. Versione tech del volantino, pronta per la stampa A5.",
  keywords:
    "volantino 4bid, suite 4bid, software hotel, santaddeo, hotelprofit ai, manubot, hotel accelerator, 4bid ecomobility, mobilita elettrica hotel",
  alternates: {
    canonical: "https://www.4bid.it/volantino-2",
  },
  // Materiale commerciale: vedi la nota in app/volantino/page.tsx.
  robots: { index: false, follow: true },
  openGraph: {
    title: "Volantino Suite 4BID v2 | Versione Tech",
    description:
      "Cinque prodotti per il turismo del futuro: Santaddeo, HotelProfit AI, Manubot, Hotel Accelerator e 4BID Ecomobility.",
    type: "website",
    url: "https://www.4bid.it/volantino-2",
    locale: "it_IT",
    siteName: "4BID.IT",
  },
}

export default function Volantino2Page() {
  return <Volantino2Client />
}
