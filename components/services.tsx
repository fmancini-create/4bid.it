import Link from "next/link"

export default function Services() {
  const services = [
    {
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      title: "Mettiamo Il Turbo Alla Tua Struttura",
      description:
        "Forniamo consulenza e/o management alle strutture ricettive sia in fase di start-up che nella riorganizzazione aziendale.",
    },
    {
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      title: "Ampliamo La Tua Base Commerciale",
      description:
        "La vasta esperienza maturata nell'accommodation business ci permette di configurare il miglior balance dei canali per la commercializzazione della tua struttura.",
    },
    {
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      title: "Incrementa Il Fatturato Del 45%",
      description:
        "L'incremento del fatturato medio generato dai nostri clienti grazie alle nostre consulenze è del 45%.",
      href: "/come-aumentare-ricavi-hotel",
    },
    {
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      title: "Head Hunting & Staff Recruitment",
      description:
        "Ci occupiamo di reperire e formare il personale della tua struttura affrontando il meglio la stagione sfruttando le più innovative tecniche di vendita.",
    },
    {
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 17V9.5a1.5 1.5 0 0 0-1.5-1.5h-3A1.5 1.5 0 0 0 17 9.5V17" />
          <path d="M7 8h10M7 12h10M7 16h10" />
        </svg>
      ),
      title: "Sempre Al Tuo Fianco",
      description:
        "Ti affianchiamo in loco per 15 gg nel periodo a cavallo fra pre-apertura ed apertura della struttura.",
    },
    {
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      title: "Curiamo La Tua Immagine Sul Web",
      description:
        "Realizziamo il tuo sito internet e curiamo i social coordinatamente alla strategia commerciale che definiamo per te.",
    },
  ]

  return (
    <section id="services" className="py-20 bg-[#F5F5F5]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-gray-500 text-sm mb-2 tracking-wide">Il nostro campo d'azione</p>
          <h2 className="text-4xl md:text-5xl font-light text-gray-700">Dove interveniamo</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => {
            const cardClass =
              "bg-white p-8 rounded shadow-sm hover:shadow-md transition-shadow border border-gray-100 block"
            const inner = (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-[#F4B942] flex items-center justify-center text-gray-700">
                    {service.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">{service.title}</h3>
                <p className="text-gray-600 text-sm text-center leading-relaxed">{service.description}</p>
              </>
            )
            return service.href ? (
              <Link key={index} href={service.href} className={`${cardClass} hover:border-[#F4B942]`}>
                {inner}
              </Link>
            ) : (
              <div key={index} className={cardClass}>
                {inner}
              </div>
            )
          })}
        </div>

        {/* Chi arriva qui cerca per problema ("perdo prenotazioni", "dipendo dalle
            OTA"), non per nome del servizio. L'unico ingresso alla pagina
            problemi/soluzioni era un link testuale a ~4300px di scroll e la voce
            di footer: in pratica invisibile. Questo richiamo sta subito sotto
            "Dove interveniamo", a poche centinaia di pixel dall'apertura. */}
        <div className="max-w-7xl mx-auto mt-12 flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white px-6 py-8 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Non sai da quale intervento partire?</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Dicci qual è il problema della tua struttura e ti mostriamo quali soluzioni lo risolvono.
            </p>
          </div>
          <Link
            href="/problemi-hotel-soluzioni"
            className="shrink-0 rounded-md bg-[#F4B942] px-6 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-[#e0a92f]"
          >
            Parti dal tuo problema
          </Link>
        </div>
      </div>
    </section>
  )
}
