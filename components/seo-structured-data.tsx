import Script from "next/script"

interface FAQItem {
  question: string
  answer: string
}

interface BreadcrumbItem {
  name: string
  url: string
}

interface StructuredDataProps {
  type?: "Article" | "Service" | "Organization" | "LocalBusiness" | "Product" | "FAQPage" | "WebPage"
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
}

// Dati aziendali centralizzati
const companyData = {
  name: "4BID SRL",
  legalName: "4BID SRL",
  url: "https://4bid.it",
  logo: "https://4bid.it/logo.png",
  image: "https://4bid.it/4bid-colorful-logo.jpg",
  email: "info@4bid.it",
  telephone: "+39 055 0000000", // Da aggiornare con numero reale
  vatID: "IT00000000000", // Da aggiornare con P.IVA reale
  foundingDate: "2020",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Via Sorripa, 10",
    addressLocality: "San Casciano in Val di Pesa",
    addressRegion: "FI",
    postalCode: "50026",
    addressCountry: "IT",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "43.6567",
    longitude: "11.1847",
  },
  sameAs: ["https://www.linkedin.com/company/4bid-srl", "https://www.facebook.com/4bidIT"],
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
  image = "https://4bid.it/4bid-colorful-logo.jpg",
  datePublished,
  dateModified,
  price,
  currency = "EUR",
  faqs,
  breadcrumbs,
  keywords,
}: StructuredDataProps) {
  const now = new Date().toISOString()

  // Schema principale
  const mainSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name: title,
    description,
    url,
    image,
    datePublished: datePublished || now,
    dateModified: dateModified || now,
    inLanguage: "it-IT",
    isAccessibleForFree: true,
    provider: {
      "@type": "Organization",
      ...companyData,
    },
  }

  // Aggiungi proprietà specifiche per tipo
  if (type === "Service") {
    mainSchema.serviceType = "Revenue Management Hotel"
    mainSchema.areaServed = companyData.areaServed
    mainSchema.provider = {
      "@type": "Organization",
      ...companyData,
    }
  }

  if (type === "Organization" || type === "LocalBusiness") {
    Object.assign(mainSchema, companyData)
    mainSchema.contactPoint = {
      "@type": "ContactPoint",
      telephone: companyData.telephone,
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

  if (type === "WebPage" || type === "Article") {
    mainSchema.mainEntityOfPage = {
      "@type": "WebPage",
      "@id": url,
    }
    mainSchema.author = {
      "@type": "Organization",
      ...companyData,
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

  // Schema WebSite per la ricerca
  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "4BID.IT",
    url: "https://4bid.it",
    description:
      "Innovazione e Tecnologia per il Tuo Business - Revenue Management Hotel, Software e Soluzioni Tecnologiche",
    publisher: {
      "@type": "Organization",
      name: companyData.name,
      logo: companyData.logo,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://4bid.it/?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <>
      <Script
        id="structured-data-main"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mainSchema) }}
      />
      {faqSchema && (
        <Script
          id="structured-data-faq"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <Script
          id="structured-data-breadcrumb"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <Script
        id="structured-data-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
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
        { name: "Home", url: "https://4bid.it" },
        { name: title, url },
      ]}
    />
  )
}
