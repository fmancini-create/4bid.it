import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  openGraph: {
    title: "SANTADDEO: Software Revenue Management Hotel AI Trasparente | 4BID.IT",
    description:
      "SANTADDEO è il software Revenue Management di 4BID con AI spiegabile e pricing dinamico personalizzabile per struttura e giorno.",
    url: "https://www.4bid.it/software-revenue-management-santaddeo",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "website",
    images: ["https://www.4bid.it/og-image-4bid.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "SANTADDEO RMS | 4BID.IT",
    description: "RMS con AI spiegabile, pricing dinamico e logiche personalizzabili per hotel e strutture ricettive.",
    images: ["https://www.4bid.it/og-image-4bid.jpg"],
  },
}

export default function SantaddeoSoftwareLayout({ children }: { children: ReactNode }) {
  return children
}
