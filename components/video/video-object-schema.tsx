/**
 * Dati strutturati schema.org VideoObject per i video YouTube.
 *
 * Permette a Google di mostrare l'anteprima video (miniatura + durata) nei
 * risultati di ricerca e di indicizzare i video nella scheda Video. Reso come
 * <script type="application/ld+json"> lato server, cosi' e' presente nell'HTML
 * ed e' leggibile da tutti i crawler senza dipendere dall'esecuzione JS.
 *
 * Accetta uno o piu' video: su una pagina con piu' video emettiamo un
 * VideoObject per ciascuno.
 */

export interface VideoSchemaItem {
  videoId: string
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  uploadDate?: string | null
}

function buildVideoObject(v: VideoSchemaItem): Record<string, unknown> {
  const thumb = v.thumbnailUrl || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    // La descrizione e' obbligatoria per la rich card: fallback al titolo.
    description: v.description?.trim() || v.title,
    thumbnailUrl: [thumb],
    contentUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.videoId}`,
    inLanguage: "it-IT",
    publisher: {
      "@type": "Organization",
      name: "4BID SRL",
      logo: {
        "@type": "ImageObject",
        url: "https://www.4bid.it/logo.png",
      },
    },
  }
  if (v.uploadDate) schema.uploadDate = v.uploadDate
  return schema
}

export function VideoObjectSchema({ videos }: { videos: VideoSchemaItem[] }) {
  if (!videos || videos.length === 0) return null
  return (
    <>
      {videos.map((v) => (
        <script
          key={v.videoId}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildVideoObject(v)) }}
        />
      ))}
    </>
  )
}
