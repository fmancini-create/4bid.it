import type { Metadata } from "next"
import { SantaddeoBrochure } from "@/components/santaddeo-brochure"

export const metadata: Metadata = {
  title: "Santaddeo Brochure | 4BID SRL",
  description: "Brochure Santaddeo - Il sistema intelligente di revenue management per hotel",
}

export default function SantaddeoBrochurePage() {
  return <SantaddeoBrochure />
}
