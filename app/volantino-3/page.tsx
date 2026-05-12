import Volantino3Client from "./volantino-3-client"

export const metadata = {
  title: "Volantino Suite Prodotti 4BID v3 | Stile Editoriale",
  description:
    "Volantino A5 della suite 4BID in stile editoriale: Santaddeo, HotelProfit AI, Manubot, Hotel Accelerator e 4BID Ecomobility con tutte le caratteristiche principali.",
  keywords:
    "volantino 4bid, brochure 4bid, suite hospitality, santaddeo, hotelprofit ai, manubot, hotel accelerator, ecomobility",
  alternates: {
    canonical: "https://www.4bid.it/volantino-3",
  },
  openGraph: {
    title: "Volantino Suite 4BID - Edizione Editoriale",
    description:
      "Cinque prodotti per il turismo: revenue, controllo di gestione, manutenzioni, marketing e mobilita' elettrica.",
    type: "website",
    url: "https://www.4bid.it/volantino-3",
    locale: "it_IT",
    siteName: "4BID.IT",
  },
}

export default function Volantino3Page() {
  return <Volantino3Client />
}
