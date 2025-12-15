import Image from "next/image"

export default function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-light text-gray-800 mb-6">Chi siamo</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                4 Bid è una società di consulenza specializzata nel settore turistico-ricettivo. Offriamo servizi di
                revenue management, consulenza strategica e supporto operativo per strutture ricettive, hotel e B&B.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Con anni di esperienza nel settore, il nostro team di professionisti è in grado di fornire soluzioni
                personalizzate per massimizzare i profitti e ottimizzare la gestione della vostra struttura ricettiva.
              </p>
              <p className="text-gray-600 leading-relaxed">
                La nostra missione è aiutare i nostri clienti a raggiungere il successo attraverso strategie innovative,
                tecnologia avanzata e un supporto costante.
              </p>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-lg">
              <Image src="/parallax1.jpg" alt="Team 4 Bid" fill className="object-cover" />
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-20 text-center">
            <div className="flex justify-center gap-4 mb-8">
              <span className="text-6xl text-gray-300">"</span>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-center mb-6">
                <Image src="/filippo.jpg" alt="Filippo Mancini" width={80} height={80} className="rounded-full" />
              </div>
              <p className="text-xl text-gray-700 italic mb-4">
                "Grazie a 4 Bid abbiamo incrementato il nostro fatturato del 45% e ottimizzato completamente la gestione
                della nostra struttura. Un team di professionisti eccezionale!"
              </p>
              <p className="text-gray-500 font-medium">Cliente Soddisfatto</p>
            </div>
            <div className="flex justify-center gap-4 mt-8">
              <span className="text-6xl text-gray-300">"</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
