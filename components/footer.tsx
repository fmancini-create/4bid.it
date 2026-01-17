import Link from "next/link"
import Image from "next/image"
import { Facebook, Linkedin, Mail, MapPin } from "lucide-react"

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
