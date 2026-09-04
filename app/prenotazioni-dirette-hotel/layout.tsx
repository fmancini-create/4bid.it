import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  openGraph: {
    title: "Prenotazioni Dirette Hotel | Aumenta Direct Booking e Riduci OTA | 4BID.IT",
    description:
      "Aumenta le prenotazioni dirette del tuo hotel e riduci le commissioni OTA con un piano operativo per il direct booking.",
    url: "https://www.4bid.it/prenotazioni-dirette-hotel",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "article",
    images: ["https://www.4bid.it/og-image-4bid.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prenotazioni Dirette Hotel | 4BID.IT",
    description: "Strategie operative per aumentare il direct booking e ridurre la dipendenza dalle OTA.",
    images: ["https://www.4bid.it/og-image-4bid.jpg"],
  },
}

export default function PrenotazioniDiretteLayout({ children }: { children: ReactNode }) {
  return children
}
