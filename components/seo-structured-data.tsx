"use client"

import Script from "next/script"

interface StructuredDataProps {
  type?: "Article" | "Service" | "Organization" | "LocalBusiness"
  title: string
  description: string
  url: string
  image?: string
  datePublished?: string
  dateModified?: string
}

export function StructuredData({
  type = "Service",
  title,
  description,
  url,
  image = "https://4bid.it/4bid-colorful-logo.jpg",
  datePublished = new Date().toISOString(),
  dateModified = new Date().toISOString(),
}: StructuredDataProps) {
  const structuredData = {
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
    ...(type === "Service" && {
      serviceType: "Revenue Management Hotel",
      areaServed: {
        "@type": "Country",
        name: "Italia",
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
