import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { CareersContent } from "@/components/careers/careers-content"
import { createClient } from "@/lib/supabase/server"
import type { JobPosition } from "@/lib/jobs/types"
import { ArrowRight, Boxes, Cpu, Gauge, Users2, ShieldCheck, FlaskConical, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Lavora con noi | 4 Bid Srl — Software & SaaS Company",
  description:
    "4 Bid è una software company italiana che sviluppa prodotti SaaS e soluzioni digitali con tecnologia, automazione e AI. Scopri le posizioni aperte e candidati.",
  alternates: { canonical: "https://www.4bid.it/lavora-con-noi" },
  openGraph: {
    title: "Lavora con noi | 4 Bid Srl",
    description:
      "Costruiamo prodotti digitali. Cerchiamo persone che vogliano costruirli con noi. Scopri le posizioni aperte in 4 Bid.",
    url: "https://www.4bid.it/lavora-con-noi",
    type: "website",
  },
}

export const dynamic = "force-dynamic"

const SITE_URL = "https://www.4bid.it"

const HIRING_ORG = {
  "@type": "Organization",
  name: "4 Bid Srl",
  sameAs: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
}

/** Map free-text Italian employment types to schema.org employmentType enums. */
function toEmploymentType(value: string | null): string | undefined {
  if (!value) return undefined
  const v = value.toLowerCase()
  if (v.includes("full")) return "FULL_TIME"
  if (v.includes("part")) return "PART_TIME"
  if (v.includes("stage") || v.includes("tiroc")) return "INTERN"
  if (v.includes("freelance") || v.includes("collabor") || v.includes("partita iva") || v.includes("p.iva"))
    return "CONTRACTOR"
  if (v.includes("tempo") || v.includes("indetermin") || v.includes("determin")) return "FULL_TIME"
  return undefined
}

/**
 * Build a Google-compliant JobPosting for each open position so the careers page
 * is eligible for the Google for Jobs rich result. Remote/undefined locations
 * fall back to TELECOMMUTE with Italy as the applicant location requirement,
 * which Google accepts in place of a physical jobLocation address.
 */
function buildJobPostingSchemas(positions: JobPosition[]) {
  return positions.map((p) => {
    const employmentType = toEmploymentType(p.employment_type)
    const isRemote = !p.location || /remot|smart|ovunque|italia/i.test(p.location)
    const schema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: p.title,
      description: p.description || p.summary || p.title,
      datePosted: p.created_at,
      dateModified: p.updated_at,
      hiringOrganization: HIRING_ORG,
      directApply: true,
      url: `${SITE_URL}/lavora-con-noi#posizioni`,
      identifier: {
        "@type": "PropertyValue",
        name: "4 Bid Srl",
        value: p.slug,
      },
    }
    if (employmentType) schema.employmentType = employmentType
    if (p.department) schema.occupationalCategory = p.department
    if (isRemote) {
      schema.jobLocationType = "TELECOMMUTE"
      schema.applicantLocationRequirements = { "@type": "Country", name: "IT" }
    } else {
      schema.jobLocation = {
        "@type": "Place",
        address: { "@type": "PostalAddress", addressLocality: p.location, addressCountry: "IT" },
      }
    }
    return schema
  })
}

const BREADCRUMB_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Lavora con noi", item: `${SITE_URL}/lavora-con-noi` },
  ],
}

const CULTURE = [
  { icon: Boxes, title: "Prodotti SaaS", text: "Più piattaforme che condividono tecnologia, competenze e filosofia." },
  { icon: Cpu, title: "AI e automazione", text: "Usiamo intelligenza artificiale e automazione per risolvere problemi reali." },
  { icon: Gauge, title: "Sviluppo rapido", text: "Cicli brevi, rilasci frequenti, feedback continuo." },
  { icon: Users2, title: "Contatto diretto", text: "Vicini a utenti e clienti: le esigenze diventano prodotto." },
  { icon: ShieldCheck, title: "Responsabilità e qualità", text: "Autonomia individuale e attenzione costante alla qualità." },
  { icon: FlaskConical, title: "Sperimentazione", text: "Un team agile che prova, misura e migliora." },
]

export default async function CareersPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("job_positions")
    .select("*")
    .eq("is_open", true)
    .order("sort_order", { ascending: true })

  const positions = (data ?? []) as JobPosition[]
  const jobPostingSchemas = buildJobPostingSchemas(positions)

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_SCHEMA) }}
      />
      {jobPostingSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Header />

      <main className="pt-20">
        {/* HERO */}
        <section className="relative overflow-hidden bg-[#2C3E50]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2C3E50] via-[#2C3E50] to-[#3a5a7a]" />
          <div className="container relative mx-auto px-4 py-20 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F4B942]/15 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-[#F4B942]">
                <Sparkles className="h-4 w-4" />
                Lavora con noi
              </p>
              <h1 className="text-4xl font-bold leading-tight text-white text-balance sm:text-5xl">
                Costruiamo prodotti digitali. Cerchiamo persone che vogliano costruirli con noi.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-300">
                4 Bid è una software company italiana che sviluppa prodotti SaaS e soluzioni digitali pensate per
                risolvere problemi concreti attraverso tecnologia, automazione e intelligenza artificiale.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-gray-400 leading-relaxed">
                Abbiamo più prodotti online e altri in sviluppo. Stiamo costruendo una squadra agile capace di
                accompagnarne la crescita.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-[#5B9BD5] text-white hover:bg-[#4A8BC2]">
                  <Link href="#posizioni">
                    Scopri le posizioni aperte
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                >
                  <Link href="#candidatura">Candidatura spontanea</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CULTURE */}
        <section className="bg-white py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#5B9BD5]">Lavorare in 4 Bid</p>
              <h2 className="text-3xl font-bold text-[#2C3E50] text-balance sm:text-4xl">Un&apos;azienda, più prodotti</h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                In 4 Bid sviluppiamo piattaforme diverse, ma condividiamo tecnologia, competenze e una stessa filosofia:
                partire da un problema reale e costruire una soluzione semplice, utile e scalabile. Chi entra nel team
                può lavorare trasversalmente su più prodotti e contribuire direttamente alla loro evoluzione.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CULTURE.map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#5B9BD5]/10 text-[#5B9BD5]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1 font-bold text-[#2C3E50]">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CareersContent positions={positions} />
      </main>

      <Footer />
    </div>
  )
}
