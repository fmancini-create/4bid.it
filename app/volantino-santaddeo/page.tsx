import VolantinoSantaddeoClient from "./volantino-santaddeo-client"

export const metadata = {
  title: "Volantino Santaddeo | Revenue Management Hotel a Costo Zero",
  description:
    "Scarica il volantino di Santaddeo, il Revenue Management System che paghi solo se funziona: zero costi fissi, commissione sui risultati.",
  keywords:
    "volantino santaddeo, revenue management costo zero, rms a commissione, aumentare ricavi hotel, software revenue management hotel, santaddeo",
  alternates: {
    canonical: "https://www.4bid.it/volantino-santaddeo",
  },
  openGraph: {
    title: "Volantino Santaddeo | Cresci a Costo Zero",
    description:
      "Il Revenue Management System che paghi solo se funziona. Zero costi fissi, formula a commissione sui risultati.",
    type: "website",
    url: "https://www.4bid.it/volantino-santaddeo",
    locale: "it_IT",
    siteName: "4BID.IT",
  },
}

export default function VolantinoSantaddeoPage() {
  return <VolantinoSantaddeoClient />
}
