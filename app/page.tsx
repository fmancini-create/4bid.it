import type { Metadata } from "next"
import { Header } from "@/components/header"
import Hero from "@/components/hero"
import Services from "@/components/services"
import Portfolio from "@/components/portfolio"
import ProjectsSection from "@/components/projects-section"
import AppsSection from "@/components/apps-section"
import About from "@/components/about"
import Contact from "@/components/contact"
import { Footer } from "@/components/footer"
import Script from "next/script"
import { LandingPageTracker } from "@/components/landing-page-tracker"

export const metadata: Metadata = {
  title: "4BID.IT - Innovazione e Tecnologia per il Tuo Business | Revenue Management & Software",
  description:
    "4BID offre consulenza specializzata revenue management hotel, software innovativi e soluzioni tecnologiche per ottimizzare ricavi e performance aziendali. Scopri i nostri progetti e servizi.",
  keywords:
    "4bid, innovazione, tecnologia business, revenue management hotel, software gestionale, consulenza aziendale, ottimizzazione ricavi, progetti innovativi",
  openGraph: {
    title: "4BID.IT - Innovazione e Tecnologia per il Tuo Business",
    description: "Consulenza revenue management, software e soluzioni tecnologiche innovative per hotel e aziende",
    type: "website",
    url: "https://4bid.it",
    locale: "it_IT",
    siteName: "4BID.IT",
  },
  alternates: {
    canonical: "https://4bid.it",
  },
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <LandingPageTracker slug="home" />

      <Script async src="https://www.googletagmanager.com/gtag/js?id=G-S6YEEXE4C3" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-S6YEEXE4C3');
        `}
      </Script>

      <Header />
      <Hero />
      <Services />
      <Portfolio />
      <ProjectsSection />
      <AppsSection />
      <About />
      <Contact />
      <Footer />
    </div>
  )
}
