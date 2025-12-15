export default function Portfolio() {
  const portfolioData = [
    {
      name: "Resort 4*",
      type: "Resort 4*",
      location: "Chianti",
      rooms: 21,
      revenueBefore: 550,
      revenueYear1: 700,
      revenueYear2: 930,
      increase: 75.27,
    },
    {
      name: "Agriturismo",
      type: "Agriturismo",
      location: "Chianti",
      rooms: 18,
      revenueBefore: 200,
      revenueYear1: 350,
      revenueYear2: 420,
      increase: 83.33,
    },
    {
      name: "Dimora Storica",
      type: "Dimora Storica",
      location: "Firenze",
      rooms: 6,
      revenueBefore: 50,
      revenueYear1: 130,
      revenueYear2: 180,
      increase: 72.22,
    },
    {
      name: "Agriturismo",
      type: "Agriturismo",
      location: "Chianti",
      rooms: 33,
      revenueBefore: 330,
      revenueYear1: 650,
      revenueYear2: 1150,
      increase: 56.52,
    },
    {
      name: "Agriturismo",
      type: "Agriturismo",
      location: "Val d'Elsa",
      rooms: 16,
      revenueBefore: 100,
      revenueYear1: 280,
      revenueYear2: 330,
      increase: 84.85,
    },
    {
      name: "Hotel 3*",
      type: "Hotel 3*",
      location: "Firenze",
      rooms: 17,
      revenueBefore: 300,
      revenueYear1: 630,
      revenueYear2: 780,
      increase: 80.77,
    },
    {
      name: "Hotel 3*",
      type: "Hotel 3*",
      location: "Cecina",
      rooms: 60,
      revenueBefore: 560,
      revenueYear1: 820,
      revenueYear2: 910,
      increase: 90.11,
    },
    {
      name: "Aparthotel",
      type: "Aparthotel",
      location: "Pelago",
      rooms: 28,
      revenueBefore: 0,
      revenueYear1: 390,
      revenueYear2: 450,
      increase: 86.67,
    },
    {
      name: "Hotel 4* L",
      type: "Hotel 4* L",
      location: "Bellaria",
      rooms: 42,
      revenueBefore: 1200,
      revenueYear1: 1800,
      revenueYear2: 2100,
      increase: 85.71,
    },
    {
      name: "Hotel 4*",
      type: "Hotel 4*",
      location: "Siena",
      rooms: 28,
      revenueBefore: 420,
      revenueYear1: 625,
      revenueYear2: 660,
      increase: 94.7,
    },
  ]

  return (
    <section id="portfolio" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Portfolio</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Alcuni dei success cases raccolti nel portfolio. Come si può vedere dai numeri, l'incremento medio è
            notevole, e si raggiunge il massimo dell'efficienza dopo 3 anni di consulenza.
          </p>
        </div>

        {/* Table */}
        <div className="max-w-7xl mx-auto overflow-x-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#5B9BD5] text-white">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Tipologia</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Location</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold">Rooms</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    Before
                    <br />
                    <span className="text-xs font-normal">(K€)</span>
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    Year 1<br />
                    <span className="text-xs font-normal">(K€)</span>
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    Year 2<br />
                    <span className="text-xs font-normal">(K€)</span>
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    Increase
                    <br />
                    <span className="text-xs font-normal">(%)</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {portfolioData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-900 font-medium">{item.type}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{item.location}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-center">{item.rooms}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right font-mono">
                      {item.revenueBefore > 0 ? item.revenueBefore : "Startup"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right font-mono">{item.revenueYear1}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right font-mono">{item.revenueYear2}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-green-600 text-right">+{item.increase}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4 text-lg">Vuoi risultati simili per la tua struttura?</p>
          <a
            href="#contact"
            className="inline-block bg-[#5B9BD5] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#4A8BC4] transition-colors"
          >
            Richiedi una consulenza gratuita
          </a>
        </div>
      </div>
    </section>
  )
}
