"use client"

import Script from "next/script"

interface StructuredDataProps {
  type?: "Article" | "Service" | "Organization" | "LocalBusiness" | "Product"
  title: string
  description: string
  url: string
  image?: string
  datePublished?: string
  dateModified?: string
  price?: string
  currency?: string
}

export function StructuredData({
  type = "Service",
  title,
  description,
  url,
  image = "https://4bid.it/4bid-colorful-logo.jpg",
  datePublished = new Date().toISOString(),
  dateModified = new Date().toISOString(),
  price,
  currency = "EUR",
}: StructuredDataProps) {
  const baseStructure = {
    "@context": "https://schema.org",
    "@type": type,
    name: title,
    description,
    url,
    image,
    datePublished,
    dateModified,
    provider: {
      "@type": "Organization",
      name: "4BID.IT SRL",
      url: "https://4bid.it",
      logo: "https://4bid.it/logo.png",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Via Sorripa, 10",
        addressLocality: "San Casciano in Val di Pesa",
        addressRegion: "FI",
        postalCode: "50026",
        addressCountry: "IT",
      },
      sameAs: ["https://4bid.it"],
    },
  }

  const structuredData = {
    ...baseStructure,
    ...(type === "Service" && {
      serviceType: "Revenue Management Hotel",
      areaServed: {
        "@type": "Country",
        name: "Italia",
      },
    }),
    ...(type === "Organization" && {
      "@type": "Organization",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+39-055-1234567",
        contactType: "customer service",
        areaServed: "IT",
        availableLanguage: ["Italian", "English"],
      },
    }),
    ...(type === "Product" &&
      price && {
        offers: {
          "@type": "Offer",
          price,
          priceCurrency: currency,
          availability: "https://schema.org/InStock",
        },
      }),
  }

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
