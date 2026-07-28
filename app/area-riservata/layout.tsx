import type { Metadata } from "next"
import { StopSessionReplay } from "@/components/project-room/stop-session-replay"

export const metadata: Metadata = {
  title: "Area Riservata - 4BID",
  // Belt and braces alongside the proxy: nothing under this segment should ever
  // be indexed, even if a future page forgets its own robots directive.
  robots: { index: false, follow: false, nocache: true },
}

export default function AreaRiservataLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StopSessionReplay />
      {children}
    </>
  )
}
