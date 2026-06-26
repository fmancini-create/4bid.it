import Link from "next/link"
import Image from "next/image"
import { Facebook, Linkedin, Mail, MapPin, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <Image src="/logo.png" alt="4BID Logo" width={120} height={80} className="mb-4" />
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              4BID SRL è la tua partner di fiducia per la consulenza e il revenue management nel settore
              turistico-ricettivo. Innovazione, tecnologia e esperienza al servizio del tuo business.
            </p>

            {/* Social Links */}
            <div className="mt-6 flex gap-4">
              <Link
                href="https://www.facebook.com/4bidrevenueguru"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-gray-400 hover:bg-[#5B9BD5] hover:text-white transition-colors"
                aria-label="Seguici su Facebook"
              >
                <Facebook className="w-5 h-5" />
              </Link>
              <Link
                href="https://www.linkedin.com/company/4bid/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-gray-400 hover:bg-[#5B9BD5] hover:text-white transition-colors"
                aria-label="Seguici su LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </Link>
              <Link
                href="https://www.instagram.com/4bid.it"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-gray-400 hover:bg-[#E1306C] hover:text-white transition-colors"
                aria-label="Seguici su Instagram"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link
                href="https://share.google/N51fdKpwYcE4QBkjL"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-gray-400 hover:bg-[#4285F4] hover:text-white transition-colors"
                aria-label="Recensiscici su Google"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Company Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Dati Aziendali</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="font-semibold text-white">4BID SRL</li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Via Sorripa, 10
                  <br />
                  50026 San Casciano in Val di Pesa (FI)
                </span>
              </li>
              <li>P.IVA: 06241710489</li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:info@4bid.it" className="hover:text-white transition-colors">
                  info@4bid.it
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Link Veloci</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Servizi
                </Link>
              </li>
              <li>
                <Link
                  href="/cose-il-revenue-management"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Revenue Management
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Chi Siamo
                </Link>
              </li>
              <li>
                <Link href="/#projects" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Progetti
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Contatti
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} 4BID SRL. Tutti i diritti riservati.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                Termini e Condizioni
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
