"use client"

import { useState } from "react"
import { Play } from "lucide-react"

/**
 * "Facade" per video YouTube: mostra la miniatura + pulsante play e carica
 * l'iframe solo al click. Evita di caricare decine di iframe YouTube (pesanti,
 * con cookie e molti script) al primo render della pagina, migliorando molto
 * LCP/prestazioni. La miniatura resta indicizzabile e lo schema VideoObject
 * viene reso separatamente lato server.
 */
export function YoutubeFacade({
  videoId,
  title,
  thumbnailUrl,
  className = "",
}: {
  videoId: string
  title: string
  thumbnailUrl?: string | null
  className?: string
}) {
  const [active, setActive] = useState(false)
  const thumb = thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-xl bg-black ${className}`}>
      {active ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9BD5]"
          aria-label={`Riproduci il video: ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb || "/placeholder.svg"}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
            <Play className="ml-1 h-7 w-7 fill-current" aria-hidden="true" />
          </span>
        </button>
      )}
    </div>
  )
}
