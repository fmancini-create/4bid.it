import VolantinoClient from "./volantino-client"

export const metadata = {
  title: "Volantino Suite Prodotti 4BID | Software per Hotel e Turismo",
  description:
    "Scarica il volantino della suite 4BID: Santaddeo, HotelProfit AI, Manubot e Hotel Accelerator. Software pensati per il settore alberghiero.",
  keywords:
    "volantino 4bid, suite 4bid, software hotel, santaddeo, hotelprofit ai, manubot, hotel accelerator, brochure prodotti hotel",
  alternates: {
    canonical: "https://www.4bid.it/volantino",
  },
  // Materiale commerciale da inviare o stampare, non una pagina che qualcuno
  // cerca su Google: stesso trattamento di /sfondo-call. `follow: true` perche'
  // i collegamenti verso le pagine dei prodotti restano utili.
  // La pagina resta online e funzionante: chi ha il link la apre come prima.
  robots: { index: false, follow: true },
  openGraph: {
    title: "Volantino Suite Prodotti 4BID",
    description:
      "La suite completa per il settore turismo: Santaddeo, HotelProfit AI, Manubot e Hotel Accelerator.",
    type: "website",
    url: "https://www.4bid.it/volantino",
    locale: "it_IT",
    siteName: "4BID.IT",
  },
}

export default function VolantinoPage() {
  return <VolantinoClient />
}
