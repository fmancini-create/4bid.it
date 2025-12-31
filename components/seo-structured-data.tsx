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
  type?:
    | "Article"
    | "Service"
    | "Organization"
    | "LocalBusiness"
    | "Product"
    | "FAQPage"
    | "WebPage"
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
}

const companyData = {
  name: "4BID SRL",
  legalName: "4BID SRL",
  url: "https://4bid.it",
  logo: "https://4bid.it/logo.png",
  image: "https://4bid.it/4bid-colorful-logo.jpg",
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
  softwareCategory,
  operatingSystem = "Web",
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
    inLanguage: "it-IT",
  }

  // Aggiungi date solo se fornite o per tipi che le richiedono
  if (type === "Article" || type === "WebPage") {
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

  if (type === "WebPage" || type === "Article") {
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
  }

  // Schema Organization sempre incluso
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
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
      <Script
        id="structured-data-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
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
