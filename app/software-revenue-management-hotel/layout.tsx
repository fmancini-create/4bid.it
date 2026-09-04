import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  openGraph: {
    title: "Software Revenue Management Hotel | Soluzioni RMS Professionali | 4BID.IT",
    description:
      "Panoramica delle funzioni di un software Revenue Management per hotel: AI, dynamic pricing, forecast e analytics per ottimizzare tariffe e RevPAR.",
    url: "https://www.4bid.it/software-revenue-management-hotel",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "website",
    images: ["https://www.4bid.it/og-image-4bid.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Software Revenue Management Hotel | 4BID.IT",
    description: "Funzioni e vantaggi di un RMS per automatizzare pricing, forecast e analisi delle performance.",
    images: ["https://www.4bid.it/og-image-4bid.jpg"],
  },
}

export default function SoftwareRevenueManagementLayout({ children }: { children: ReactNode }) {
  return children
}
