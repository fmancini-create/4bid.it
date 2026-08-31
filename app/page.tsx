import type { Metadata } from "next"
import { Header } from "@/components/header"
import Hero from "@/components/hero"
import Services from "@/components/services"
import Portfolio from "@/components/portfolio"
import ProjectsSection from "@/components/projects-section"
import About from "@/components/about"
import Contact from "@/components/contact"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"
import { LatestVideos } from "@/components/latest-videos"

export const metadata: Metadata = {
  title: "Revenue Management per Hotel e Software Hospitality | 4BID",
  description:
    "Consulenza e software di revenue management per hotel, B&B e agriturismi: pricing, dati, controllo di gestione, CRM e automazione per l'hospitality.",
  openGraph: {
    title: "Revenue Management per Hotel e Software Hospitality | 4BID",
    description:
      "Consulenza e software per hotel e strutture ricettive: revenue management, pricing, dati, controllo di gestione, CRM e automazione.",
    type: "website",
    url: "https://www.4bid.it",
    locale: "it_IT",
    siteName: "4BID.IT",
    images: [
      {
        url: "https://www.4bid.it/og-image-4bid.jpg",
        width: 1200,
        height: 630,
        alt: "4BID SRL - Revenue management e software per l'hospitality",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Revenue Management per Hotel e Software Hospitality | 4BID",
    description:
      "Consulenza e software per hotel: revenue management, pricing, dati, controllo di gestione, CRM e automazione.",
    images: ["https://www.4bid.it/og-image-4bid.jpg"],
  },
  alternates: {
    canonical: "https://www.4bid.it",
  },
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <StructuredData
        type="Organization"
        title="4BID SRL - Revenue Management e Software per Hospitality"
        description="4BID combina consulenza di revenue management e software proprietari per hotel e strutture ricettive."
        url="https://www.4bid.it"
      />

      <LandingPageTracker slug="home" />

      <Header />
      <Hero />
      <Services />
      <Portfolio />
      <ProjectsSection />
      <LatestVideos limit={3} />
      <About />
      <Contact />
      <Footer />
    </div>
  )
}
