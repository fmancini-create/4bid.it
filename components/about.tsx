import Image from "next/image"
import Link from "next/link"

export default function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-blue mb-3">4BID SRL</p>
              <h2 className="text-4xl md:text-5xl font-light text-gray-800 mb-6">Esperienza hospitality, dati e software</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                4BID è una società italiana con sede a San Casciano in Val di Pesa (Firenze), specializzata in revenue
                management e nello sviluppo di software per il settore turistico-ricettivo.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                L'approccio nasce dall'esperienza diretta nella gestione alberghiera e unisce strategia tariffaria,
                analisi dei dati, intelligenza artificiale e automazione operativa.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                Le soluzioni 4BID sono progettate per hotel, B&B, agriturismi e resort e includono consulenza di revenue
                management e prodotti software proprietari dedicati a pricing, controllo di gestione, CRM e operations.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/chi-siamo" className="font-semibold text-primary-blue hover:underline">
                  Chi siamo
                </Link>
                <Link href="/metodo-4bid" className="font-semibold text-primary-blue hover:underline">
                  Il Metodo 4BID
                </Link>
                <Link href="/filippo-mancini" className="font-semibold text-primary-blue hover:underline">
                  Il fondatore
                </Link>
                <Link href="/parlano-di-noi" className="font-semibold text-primary-blue hover:underline">
                  Parlano di noi
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src="/parallax1.jpg"
                alt="4BID: revenue management, tecnologia e software per l'hospitality"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
