interface FAQItem {
  question: string
  answer: string
}

interface BreadcrumbItem {
  name: string
  url: string
}

interface HowToStep {
  name: string
  text: string
}

interface HowToData {
  name: string
  description?: string
  steps: HowToStep[]
}

interface StructuredDataProps {
  type?:
    | "Article"
    | "Service"
    | "Organization"
    | "LocalBusiness"
    | "Product"
    | "FAQPage"
    | "WebPage"
    | "AboutPage"
    | "CollectionPage"
    | "SoftwareApplication"
  title: string
  description: string
  url: string
  image?: string
  datePublished?: string
  dateModified?: string
  price?: string
  currency?: string
  faqs?: FAQItem[]
  breadcrumbs?: BreadcrumbItem[]
  keywords?: string[]
  softwareCategory?: string
  operatingSystem?: string
  // Entity SEO: entità trattate (about) e citate (mentions), collegate via @id.
  about?: Array<Record<string, unknown>>
  mentions?: Array<Record<string, unknown>>
  // HowTo: procedura passo-passo (per pagine guida con step reali).
  howTo?: HowToData
  // Speakable: selettori CSS dei contenuti adatti alla lettura vocale (GEO).
  speakable?: string[]
  // CollectionPage: elementi raccolti (es. guide di una categoria) → hasPart.
  hasParts?: Array<{ name: string; url: string }>
}

const companyData = {
  name: "4BID SRL",
  legalName: "4BID SRL",
  url: "https://www.4bid.it",
  logo: "https://www.4bid.it/logo.png",
  image: "https://www.4bid.it/4bid-colorful-logo.jpg",
  email: "info@4bid.it",
  vatID: "IT06241710489",
  foundingDate: "2020",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Via Sorripa, 10",
    addressLocality: "San Casciano in Val di Pesa",
    addressRegion: "FI",
    postalCode: "50026",
    addressCountry: "IT",
  },
  sameAs: [
    "https://www.linkedin.com/company/4bid-srl/",
    "https://www.facebook.com/4bidrevenueguru",
    "https://www.instagram.com/4bid_revenue_guru/",
  ],
  areaServed: {
    "@type": "Country",
    name: "Italia",
  },
}

export function StructuredData({
  type = "Service",
  title,
  description,
  url,
  image = "https://www.4bid.it/4bid-colorful-logo.jpg",
  datePublished,
  dateModified,
  price,
  currency = "EUR",
  faqs,
  breadcrumbs,
  keywords,
  softwareCategory,
  operatingSystem = "Web",
  about,
  mentions,
  howTo,
  speakable,
  hasParts,
}: StructuredDataProps) {
  const now = new Date().toISOString()

  // @id stabili per collegare le entità tra loro (knowledge graph EEAT/GEO).
  const ORG_ID = "https://www.4bid.it/#organization"
  const PERSON_ID = "https://www.4bid.it/#person"
  const WEBSITE_ID = "https://www.4bid.it/#website"

  // Schema principale
  const mainSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name: title,
    description,
    url,
    image,
    inLanguage: "it-IT",
  }

  // Aggiungi date solo se fornite o per tipi che le richiedono
  if (type === "Article" || type === "WebPage" || type === "AboutPage" || type === "CollectionPage") {
    mainSchema.datePublished = datePublished || now
    mainSchema.dateModified = dateModified || now
  }

  // Aggiungi proprietà specifiche per tipo
  if (type === "Service") {
    mainSchema.serviceType = "Revenue Management Hotel"
    mainSchema.areaServed = companyData.areaServed
    mainSchema.provider = {
      "@type": "Organization",
      name: companyData.name,
      url: companyData.url,
      logo: companyData.logo,
      email: companyData.email,
      vatID: companyData.vatID,
      address: companyData.address,
      sameAs: companyData.sameAs,
    }
  }

  if (type === "SoftwareApplication") {
    mainSchema.applicationCategory = softwareCategory || "BusinessApplication"
    mainSchema.operatingSystem = operatingSystem
    mainSchema.offers = {
      "@type": "Offer",
      price: price || "0",
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
    }
    mainSchema.author = {
      "@type": "Organization",
      name: companyData.name,
      url: companyData.url,
    }
  }

  if (type === "Organization" || type === "LocalBusiness") {
    Object.assign(mainSchema, {
      name: companyData.name,
      legalName: companyData.legalName,
      url: companyData.url,
      logo: companyData.logo,
      email: companyData.email,
      vatID: companyData.vatID,
      foundingDate: companyData.foundingDate,
      address: companyData.address,
      sameAs: companyData.sameAs,
      areaServed: companyData.areaServed,
    })
    mainSchema.contactPoint = {
      "@type": "ContactPoint",
      email: companyData.email,
      contactType: "customer service",
      areaServed: "IT",
      availableLanguage: ["Italian", "English"],
    }
  }

  if (type === "Product" && price) {
    mainSchema.offers = {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
    }
  }

  if (type === "WebPage" || type === "Article" || type === "AboutPage" || type === "CollectionPage") {
    // headline: campo raccomandato da Google per Article, migliora la
    // comprensione del titolo principale della pagina.
    if (type === "Article") {
      mainSchema.headline = title
    }
    mainSchema.mainEntityOfPage = {
      "@type": "WebPage",
      "@id": url,
    }
    mainSchema.author = {
      "@type": "Organization",
      name: companyData.name,
      url: companyData.url,
    }
    mainSchema.publisher = {
      "@type": "Organization",
      name: companyData.name,
      logo: {
        "@type": "ImageObject",
        url: companyData.logo,
      },
    }
    if (keywords) {
      mainSchema.keywords = keywords.join(", ")
    }
  }

  // isPartOf: la pagina fa parte del sito (collega l'entità al WebSite via @id).
  if (
    type === "WebPage" ||
    type === "Article" ||
    type === "AboutPage" ||
    type === "Service" ||
    type === "CollectionPage"
  ) {
    mainSchema.isPartOf = { "@id": WEBSITE_ID }
  }

  // Speakable: porzioni della pagina adatte alla lettura vocale (assistenti, GEO).
  if (speakable && speakable.length > 0) {
    mainSchema.speakable = {
      "@type": "SpeakableSpecification",
      cssSelector: speakable,
    }
  }

  // hasPart: elementi raccolti da una CollectionPage (es. guide di una categoria).
  if (hasParts && hasParts.length > 0) {
    mainSchema.hasPart = hasParts.map((p) => ({
      "@type": "WebPage",
      name: p.name,
      url: p.url,
    }))
  }

  // about / mentions: entità trattate e citate, per rafforzare l'Entity SEO.
  if (about && about.length > 0) {
    mainSchema.about = about
  }
  if (mentions && mentions.length > 0) {
    mainSchema.mentions = mentions
  }

  // Schema FAQ separato
  const faqSchema =
    faqs && faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null

  // Schema Breadcrumb separato
  const breadcrumbSchema =
    breadcrumbs && breadcrumbs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        }
      : null

  // Schema HowTo separato (procedura passo-passo con step reali della pagina).
  const howToSchema =
    howTo && howTo.steps.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: howTo.name,
          description: howTo.description || description,
          step: howTo.steps.map((s, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: s.name,
            text: s.text,
          })),
        }
      : null

  // Grafo entità sempre incluso: WebSite + Organization + Person (founder),
  // collegati via @id. Dati reali presenti sul sito (Filippo Mancini, founder).
  const entityGraphSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "4BID.IT",
        url: companyData.url,
        description:
          "Innovazione e Tecnologia per il Tuo Business - Revenue Management Hotel, Software e Soluzioni Tecnologiche",
        inLanguage: "it-IT",
        publisher: { "@id": ORG_ID },
      },
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: companyData.name,
        legalName: companyData.legalName,
        url: companyData.url,
        logo: {
          "@type": "ImageObject",
          url: companyData.logo,
        },
        email: companyData.email,
        vatID: companyData.vatID,
        foundingDate: companyData.foundingDate,
        founder: { "@id": PERSON_ID },
        address: companyData.address,
        sameAs: companyData.sameAs,
        areaServed: companyData.areaServed,
        contactPoint: {
          "@type": "ContactPoint",
          email: companyData.email,
          contactType: "customer service",
          areaServed: "IT",
          availableLanguage: ["Italian", "English"],
        },
      },
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: "Filippo Mancini",
        jobTitle: "Founder & CEO",
        image: "https://www.4bid.it/filippo.jpg",
        worksFor: { "@id": ORG_ID },
        sameAs: ["https://www.linkedin.com/in/fimancini/"],
      },
    ],
  }

  // JSON-LD reso con tag <script> nativi (non next/script): così il markup è
  // presente nell'HTML server-side ed è leggibile da tutti i crawler e bot AI,
  // senza dipendere dall'esecuzione JS lato client (afterInteractive).
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mainSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(entityGraphSchema) }}
      />
    </>
  )
}

// Componente semplificato per pagine che non hanno già StructuredData
export function PageSEO({
  title,
  description,
  url,
  faqs,
}: {
  title: string
  description: string
  url: string
  faqs?: FAQItem[]
}) {
  return (
    <StructuredData
      type="WebPage"
      title={title}
      description={description}
      url={url}
      faqs={faqs}
      breadcrumbs={[
        { name: "Home", url: "https://www.4bid.it" },
        { name: title, url },
      ]}
    />
  )
}
