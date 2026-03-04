import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ClientProviders } from "@/components/client-providers"
import { StructuredData } from "@/components/seo-structured-data"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "4BID SRL - Consulenza Revenue Management Hotel & Sviluppo Software",
  description:
    "4BID SRL: consulenza revenue management per hotel, sviluppo software e app personalizzate. Massimizza i ricavi del tuo hotel con strategie data-driven.",
  keywords: [
    "revenue management hotel",
    "consulenza alberghiera",
    "sviluppo software",
    "app personalizzate",
    "4BID",
    "ottimizzazione ricavi hotel",
  ],
  authors: [{ name: "4BID SRL" }],
  creator: "4BID SRL",
  publisher: "4BID SRL",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "https://4bid.it",
    siteName: "4BID SRL",
    title: "4BID SRL - Consulenza Revenue Management Hotel & Sviluppo Software",
    description:
      "Consulenza revenue management per hotel e sviluppo software personalizzato. Massimizza i ricavi con strategie data-driven.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "4BID SRL - Revenue Management & Software Development",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "4BID SRL - Revenue Management & Software",
    description: "Consulenza revenue management per hotel e sviluppo software personalizzato.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://4bid.it",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e3a5f",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isProduction = process.env.NODE_ENV === "production"

  return (
    <html lang="it" className="scroll-smooth">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-S6YEEXE4C3"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-S6YEEXE4C3');
          `}
        </Script>
        <StructuredData
          type="Organization"
          title="4BID SRL - Consulenza Revenue Management Hotel & Sviluppo Software"
          description="4BID SRL: consulenza revenue management per hotel, sviluppo software e app personalizzate."
          url="https://4bid.it"
        />
      </head>
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Footer />
        <ClientProviders isProduction={isProduction} />
      </body>
    </html>
  )
}
