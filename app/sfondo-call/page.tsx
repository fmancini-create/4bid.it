import type { Metadata } from "next"
import SfondoCallClient from "./sfondo-call-client"

export const metadata: Metadata = {
  title: "Sfondo Videocall 4BID | Background Google Meet/Zoom",
  description:
    "Sfondo per videocall aziendale 4BID con logo holding e suite prodotti per il turismo. Formato 16:9 (1920x1080) per Google Meet, Zoom, Teams.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SfondoCallPage() {
  return <SfondoCallClient />
}
