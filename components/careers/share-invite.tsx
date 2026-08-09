"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Check, Copy, Mail, Linkedin, MessageCircle } from "lucide-react"

interface Props {
  /** Heading shown above the buttons. */
  title?: string
  /** Supporting line under the heading. */
  subtitle?: string
  /** Visual style: "panel" (bordered card) or "plain" (no border, e.g. inside another card). */
  variant?: "panel" | "plain"
  className?: string
}

const SHARE_PATH = "/lavora-con-noi"
const SHARE_TEXT =
  "In 4 Bid stiamo cercando nuove persone per i nostri prodotti SaaS. Pensavo potesse interessarti: dai un'occhiata alle posizioni aperte."

export function ShareInvite({
  title = "Conosci la persona giusta?",
  subtitle = "Se pensi che un amico o un collega abbia le caratteristiche adatte, inoltragli questa pagina.",
  variant = "panel",
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false)

  // Build the absolute URL on the client so it works on any domain/preview.
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}${SHARE_PATH}` : `https://www.4bid.it${SHARE_PATH}`

  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedText = encodeURIComponent(SHARE_TEXT)

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${shareUrl}`)}`
  const emailHref = `mailto:?subject=${encodeURIComponent(
    "Posizioni aperte in 4 Bid",
  )}&body=${encodeURIComponent(`${SHARE_TEXT}\n\n${shareUrl}`)}`
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Lavora con noi - 4 Bid", text: SHARE_TEXT, url: shareUrl })
      } catch {
        // user cancelled the share sheet — nothing to do
      }
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked (older browsers) — the visible link buttons still work
    }
  }

  const canNativeShare = typeof navigator !== "undefined" && !!(navigator as Navigator).share

  return (
    <div
      className={`${
        variant === "panel" ? "rounded-2xl border border-[#5B9BD5]/20 bg-[#5B9BD5]/5 p-6 sm:p-8" : ""
      } ${className}`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#F4B942]/15 text-[#B27B00]">
          <Share2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#2C3E50] text-pretty">{title}</h3>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {canNativeShare && (
          <Button onClick={nativeShare} className="bg-[#5B9BD5] text-white hover:bg-[#4A8BC2]">
            <Share2 className="mr-2 h-4 w-4" />
            Condividi
          </Button>
        )}

        <Button asChild variant="outline" className="border-gray-300 bg-white text-[#2C3E50] hover:bg-gray-50">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4 text-[#25D366]" />
            WhatsApp
          </a>
        </Button>

        <Button asChild variant="outline" className="border-gray-300 bg-white text-[#2C3E50] hover:bg-gray-50">
          <a href={linkedinHref} target="_blank" rel="noopener noreferrer">
            <Linkedin className="mr-2 h-4 w-4 text-[#0A66C2]" />
            LinkedIn
          </a>
        </Button>

        <Button asChild variant="outline" className="border-gray-300 bg-white text-[#2C3E50] hover:bg-gray-50">
          <a href={emailHref}>
            <Mail className="mr-2 h-4 w-4 text-[#5B9BD5]" />
            Email
          </a>
        </Button>

        <Button
          onClick={copyLink}
          variant="outline"
          className="border-gray-300 bg-white text-[#2C3E50] hover:bg-gray-50"
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-emerald-600" />
              Link copiato
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4 text-gray-500" />
              Copia link
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
