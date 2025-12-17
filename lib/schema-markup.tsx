export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "4BID.IT",
    url: "https://4bid.it",
    logo: "https://4bid.it/logo.png",
    description: "Software house e consulenza Revenue Management per hotel in Italia",
    address: {
      "@type": "PostalAddress",
      addressCountry: "IT",
      addressRegion: "Toscana",
    },
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "clienti@4bid.it",
      availableLanguage: ["it", "en"],
    },
  }
}

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "4BID.IT",
    url: "https://4bid.it",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://4bid.it/?s={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  }
}

export function getServiceSchema(service: {
  name: string
  description: string
  url: string
  areaServed?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    provider: {
      "@type": "Organization",
      name: "4BID.IT",
      url: "https://4bid.it",
    },
    serviceType: "Consulenza Revenue Management",
    areaServed: service.areaServed || "IT",
    url: service.url,
  }
}

export function getSoftwareSchema(software: {
  name: string
  description: string
  url: string
  category: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: software.name,
    description: software.description,
    url: software.url,
    applicationCategory: software.category,
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
    },
    provider: {
      "@type": "Organization",
      name: "4BID.IT",
      url: "https://4bid.it",
    },
  }
}

export function getLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "4BID.IT - Consulenza Revenue Management Toscana",
    description:
      "Consulenza specializzata in Revenue Management per hotel e strutture ricettive in Toscana. Ottimizzazione prezzi, strategie di vendita e formazione.",
    url: "https://4bid.it",
    telephone: "+39-XXX-XXXXXXX",
    email: "clienti@4bid.it",
    address: {
      "@type": "PostalAddress",
      addressCountry: "IT",
      addressRegion: "Toscana",
    },
    geo: {
      "@type": "GeoCoordinates",
    },
    areaServed: [
      {
        "@type": "City",
        name: "Firenze",
      },
      {
        "@type": "City",
        name: "Siena",
      },
      {
        "@type": "City",
        name: "Pisa",
      },
      {
        "@type": "State",
        name: "Toscana",
      },
    ],
    priceRange: "€€",
  }
}

export function SoftwareAppSchema({
  data,
}: {
  data: {
    name: string
    description: string
    url: string
    applicationCategory?: string
    operatingSystem?: string
    offers?: {
      "@type": string
      price?: string
      priceCurrency?: string
    }
  }
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: data.name,
    description: data.description,
    url: data.url,
    applicationCategory: data.applicationCategory || "BusinessApplication",
    operatingSystem: data.operatingSystem || "Web",
    offers: data.offers || {
      "@type": "Offer",
      priceCurrency: "EUR",
    },
    provider: {
      "@type": "Organization",
      name: "4BID.IT",
      url: "https://4bid.it",
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export function OrganizationSchema() {
  const schema = getOrganizationSchema()
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export function WebSiteSchema() {
  const schema = getWebSiteSchema()
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export function ServiceSchema(props: {
  name: string
  description: string
  url: string
  areaServed?: string
}) {
  const schema = getServiceSchema(props)
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export function LocalBusinessSchema() {
  const schema = getLocalBusinessSchema()
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}
