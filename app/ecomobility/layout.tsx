import type React from "react"
import { LanguageProvider } from "@/lib/ecomobility/i18n/provider"

export default function EcomobilityLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>
}
