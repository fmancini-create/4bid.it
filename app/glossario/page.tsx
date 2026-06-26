import type { Metadata } from "next"
import Script from "next/script"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { KBBreadcrumb } from "@/components/knowledge-base/kb-breadcrumb"
import { KBSearch } from "@/components/knowledge-base/kb-search"
import { GLOSSARY, getCategory, kbBreadcrumbs } from "@/lib/knowledge-base"

const GLOSSARY_URL = "https://www.4bid.it/glossario"

export const metadata: Metadata = {
  title: "Glossario del Revenue Management Alberghiero | 4BID",
  description:
    "Glossario completo dei termini del revenue management e della gestione alberghiera: ADR, RevPAR, occupazione, dynamic pricing, OTA, PMS e molto altro.",
  keywords: [
    "glossario revenue management",
    "termini hotel",
    "ADR",
    "RevPAR",
    "dynamic pricing",
    "OTA",
    "PMS",
    "glossario alberghiero",
  ],
  alternates: { canonical: GLOSSARY_URL },
  openGraph: {
    title: "Glossario del Revenue Management Alberghiero | 4BID",
    description:
      "Tutti i termini del revenue management e della gestione alberghiera spiegati in modo chiaro e sintetico.",
    type: "website",
    url: GLOSSARY_URL,
    siteName: "4BID.IT",
    locale: "it_IT",
    images: [{ url: "/og-image-4bid.jpg", width: 1024, height: 1024, alt: "Glossario 4BID" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Glossario del Revenue Management Alberghiero | 4BID",
    description: "Tutti i termini del revenue management alberghiero spiegati in modo chiaro.",
    images: ["/og-image-4bid.jpg"],
  },
}

export default function GlossarioPage() {
  const breadcrumbs = kbBreadcrumbs({ name: "Glossario", url: GLOSSARY_URL })

  // Schema DefinedTermSet: insieme di termini definiti (GEO/Entity SEO).
  const definedTermSet = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": `${GLOSSARY_URL}#glossary`,
    name: "Glossario del Revenue Management Alberghiero",
    description:
      "Glossario dei termini del revenue management e della gestione alberghiera a cura di 4BID.",
    url: GLOSSARY_URL,
    inLanguage: "it-IT",
    hasDefinedTerm: GLOSSARY.map((t) => ({
      "@type": "DefinedTerm",
      "@id": `${GLOSSARY_URL}/${t.slug}#term`,
      name: t.fullName ? `${t.term} (${t.fullName})` : t.term,
      description: t.definition,
      url: `${GLOSSARY_URL}/${t.slug}`,
      inDefinedTermSet: `${GLOSSARY_URL}#glossary`,
    })),
  }

  return (
    <>
      <Header />
      <Script
        id="glossary-defined-term-set"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSet) }}
      />
      <main className="min-h-screen bg-background">
        <section className="pt-32 pb-10 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-4xl">
              <div className="mb-4">
                <KBBreadcrumb items={breadcrumbs} />
              </div>
              <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl text-balance">
                Glossario del Revenue Management Alberghiero
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-pretty">
                Tutti i termini chiave del revenue management e della gestione alberghiera, spiegati in modo chiaro e
                sintetico. {GLOSSARY.length} definizioni aggiornate.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-4xl">
              <KBSearch
                placeholder="Cerca un termine..."
                items={GLOSSARY.map((t) => ({
                  title: t.fullName ? `${t.term} — ${t.fullName}` : t.term,
                  description: t.definition,
                  href: `/glossario/${t.slug}`,
                  kind: "Glossario" as const,
                  haystack: `${t.term} ${t.fullName ?? ""} ${(t.aliases ?? []).join(" ")} ${
                    getCategory(t.categorySlug)?.name ?? ""
                  }`,
                }))}
              />

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {GLOSSARY.slice()
                  .sort((a, b) => a.term.localeCompare(b.term, "it"))
                  .map((t) => (
                    <a
                      key={t.slug}
                      href={`/glossario/${t.slug}`}
                      className="group flex flex-col gap-1 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary-blue"
                    >
                      <span className="font-mono font-semibold text-primary-blue">
                        {t.fullName ? `${t.term} — ${t.fullName}` : t.term}
                      </span>
                      <span className="text-sm text-muted-foreground line-clamp-2">{t.definition}</span>
                    </a>
                  ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
