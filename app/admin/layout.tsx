import type { Metadata } from "next"
import type { ReactNode } from "react"
import { AdminDemAlertBanner } from "@/components/admin-dem-alert-banner"
import { StopSessionReplay } from "@/components/project-room/stop-session-replay"

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StopSessionReplay />
      <AdminDemAlertBanner />
      {children}
    </>
  )
}
