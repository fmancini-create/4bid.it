import VolantinoClient from "./volantino-client"

export const metadata = {
  title: "Volantino Prodotti | 4BID.IT",
  robots: {
    index: false,
    follow: false,
  },
}

export default function VolantinoPage() {
  return <VolantinoClient />
}
