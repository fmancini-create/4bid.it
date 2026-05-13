"use client"

import Image from "next/image"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SfondoCallClient() {
  const handleDownload = () => {
    // Scarica l'immagine usando html2canvas o semplicemente istruire l'utente a fare right-click > Salva immagine
    const canvas = document.getElementById("sfondo-canvas") as HTMLDivElement
    if (!canvas) return

    // Soluzione semplice: istruire a fare right-click
    alert(
      "Clicca con il tasto destro sullo sfondo qui sotto e seleziona 'Salva immagine come...' oppure fai uno screenshot del riquadro."
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Toolbar */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sfondo Videocall 4BID</h1>
            <p className="text-sm text-gray-500 mt-1">
              Formato 16:9 (1920x1080) per Google Meet, Zoom, Microsoft Teams
            </p>
          </div>
          <Button onClick={handleDownload} size="lg" className="bg-gray-900 hover:bg-gray-800">
            <Download className="h-5 w-5 mr-2" />
            Istruzioni Download
          </Button>
        </div>
      </div>

      {/* Canvas 16:9 */}
      <div className="max-w-7xl mx-auto">
        <div
          id="sfondo-canvas"
          className="bg-white shadow-2xl mx-auto relative overflow-hidden"
          style={{
            width: "100%",
            maxWidth: "1920px",
            aspectRatio: "16 / 9",
          }}
        >
          {/* Left section - 4BID logo + tagline */}
          <div className="absolute left-0 top-0 w-[35%] h-full flex flex-col items-center justify-center px-8">
            <div className="flex flex-col items-center gap-6">
              {/* Logo 4BID colorato */}
              <div className="relative w-72 h-72">
                <Image
                  src="/4bid-colorful-logo.jpg"
                  alt="4BID Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Tagline */}
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700 tracking-wide leading-tight">
                  Suite per il Turismo
                </p>
              </div>
            </div>
          </div>

          {/* Right section - Product logos */}
          <div className="absolute right-0 top-0 w-[65%] h-full flex flex-col items-center justify-center py-12 px-16">
            <div className="w-full flex flex-col items-center gap-8">
              {/* Santaddeo Hotel Accelerator */}
              <div className="relative w-full h-32">
                <Image
                  src="/santaddeo-logo.png"
                  alt="Santaddeo Hotel Accelerator"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Hotel Accelerator */}
              <div className="relative w-full h-32">
                <Image
                  src="/hotel-accelerator-logo.jpg"
                  alt="Hotel Accelerator"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* HotelProfit AI */}
              <div className="relative w-full h-32">
                <Image
                  src="/hotelprofit-ai-logo.png"
                  alt="HotelProfit AI"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Manubot */}
              <div className="relative w-full h-32">
                <Image src="/manubot-logo.jpg" alt="Manubot" fill className="object-contain" priority />
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Come usare lo sfondo</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>
              <strong>Screenshot:</strong> Fai uno screenshot del riquadro bianco sopra (includi solo il contenuto,
              non i bordi grigi)
            </li>
            <li>
              <strong>Oppure:</strong> Clicca con il tasto destro sul riquadro bianco e seleziona
              &quot;Salva immagine come...&quot;
            </li>
            <li>
              <strong>Su Google Meet:</strong> Impostazioni → Effetti → Sfondo → Carica la tua immagine
            </li>
            <li>
              <strong>Su Zoom:</strong> Impostazioni → Sfondo e filtri → Sfondi virtuali → Aggiungi immagine
            </li>
            <li>
              <strong>Su Microsoft Teams:</strong> Impostazioni → Dispositivi → Effetti e avatar → Sfondo → Aggiungi
              nuovo
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
