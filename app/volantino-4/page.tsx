import Volantino4Client from "./volantino-4-client"

export const metadata = {
  title: "Volantino Tri-fold A4 4BID v4 | Pronto Stampa",
  description:
    "Volantino A4 orizzontale tri-fold della suite 4BID: 3 pannelli per lato. Imposizione pronta per la stampa offset/digitale.",
  keywords:
    "volantino 4bid, tri-fold a4, brochure 4bid, suite hospitality, santaddeo, hotelprofit ai, manubot, hotel accelerator, stampa",
  alternates: {
    canonical: "https://www.4bid.it/volantino-4",
  },
  openGraph: {
    title: "Volantino Tri-fold 4BID - Pronto Stampa",
    description: "A4 orizzontale, 6 pannelli totali: copertina, 4 prodotti e retro copertina.",
    type: "website",
    url: "https://www.4bid.it/volantino-4",
    locale: "it_IT",
    siteName: "4BID.IT",
  },
}

export default function Volantino4Page() {
  return <Volantino4Client />
}
