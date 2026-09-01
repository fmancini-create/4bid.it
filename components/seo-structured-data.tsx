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
  about?: Array<Record<string, unknown>>
  mentions?: Array<Record<string, unknown>>
  howTo?: HowToData
  speakable?: string[]
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
  const ORG_ID = "https://www.4bid.it/#organization"
  const PERSON_ID = "https://www.4bid.it/#person"
  const WEBSITE_ID = "https://www.4bid.it/#website"

  const mainSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name: title,
    description,
    url,
    image,
    inLanguage: "it-IT",
  }

  // Date: SOLO quelle vere passate dalla pagina. Una data assente e' preferibile
  // a una data inventata al momento della scansione.
  if (type === "Article" || type === "WebPage" || type === "AboutPage" || type === "CollectionPage") {
    if (datePublished) mainSchema.datePublished = datePublished
    if (dateModified) mainSchema.dateModified = dateModified
  }

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
    // Non dichiarare mai un prezzo fittizio pari a zero. Lo schema Offer viene
    // pubblicato soltanto se la pagina fornisce un prezzo reale e visibile.
    if (price) {
      mainSchema.offers = {
        "@type": "Offer",
        price,
        priceCurrency: currency,
        availability: "https://schema.org/InStock",
      }
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

  if (
    type === "WebPage" ||
    type === "Article" ||
    type === "AboutPage" ||
    type === "Service" ||
    type === "CollectionPage"
  ) {
    mainSchema.isPartOf = { "@id": WEBSITE_ID }
  }

  if (speakable && speakable.length > 0) {
    mainSchema.speakable = {
      "@type": "SpeakableSpecification",
      cssSelector: speakable,
    }
  }

  if (hasParts && hasParts.length > 0) {
    mainSchema.hasPart = hasParts.map((p) => ({
      "@type": "WebPage",
      name: p.name,
      url: p.url,
    }))
  }

  if (about && about.length > 0) {
    mainSchema.about = about
  }
  if (mentions && mentions.length > 0) {
    mainSchema.mentions = mentions
  }

  const faqSchema =
    faqs && faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${url}#faq`,
          url,
          mainEntityOfPage: { "@id": url },
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

  const entityGraphSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "4BID.IT",
        alternateName: "4BID",
        url: companyData.url,
        description: "Revenue management e software per hotel e strutture ricettive",
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
        url: "https://www.4bid.it/filippo-mancini",
        jobTitle: "Founder & CEO",
        image: "https://www.4bid.it/filippo.jpg",
        worksFor: { "@id": ORG_ID },
        sameAs: ["https://www.linkedin.com/in/fimancini/"],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(mainSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      )}
      {howToSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entityGraphSchema) }} />
    </>
  )
}

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
