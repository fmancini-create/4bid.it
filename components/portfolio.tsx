export default function Portfolio() {
  const portfolioData = [
    { type: "Resort 4*", location: "Chianti", rooms: 21, revenueBefore: 550, revenueYear1: 700, revenueYear2: 930 },
    { type: "Agriturismo", location: "Chianti", rooms: 18, revenueBefore: 200, revenueYear1: 350, revenueYear2: 420 },
    { type: "Dimora Storica", location: "Firenze", rooms: 6, revenueBefore: 50, revenueYear1: 130, revenueYear2: 180 },
    { type: "Agriturismo", location: "Chianti", rooms: 33, revenueBefore: 330, revenueYear1: 650, revenueYear2: 1150 },
    { type: "Agriturismo", location: "Val d'Elsa", rooms: 16, revenueBefore: 100, revenueYear1: 280, revenueYear2: 330 },
    { type: "Hotel 3*", location: "Firenze", rooms: 17, revenueBefore: 300, revenueYear1: 630, revenueYear2: 780 },
    { type: "Hotel 3*", location: "Cecina", rooms: 60, revenueBefore: 560, revenueYear1: 820, revenueYear2: 910 },
    { type: "Aparthotel", location: "Pelago", rooms: 28, revenueBefore: 0, revenueYear1: 390, revenueYear2: 450 },
    { type: "Hotel 4* L", location: "Bellaria", rooms: 42, revenueBefore: 1200, revenueYear1: 1800, revenueYear2: 2100 },
    { type: "Hotel 4*", location: "Siena", rooms: 28, revenueBefore: 420, revenueYear1: 625, revenueYear2: 660 },
  ]

  const getIncrease = (before: number, year2: number) => {
    if (before <= 0) return null
    return Math.round(((year2 - before) / before) * 10000) / 100
  }

  const formatIncrease = (before: number, year2: number) => {
    const increase = getIncrease(before, year2)
    return increase === null ? "Nuova apertura" : `+${increase}%`
  }

  return (
    <section id="portfolio" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Casi del portfolio</h2>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">
            Una selezione di strutture seguite da 4BID. I valori riportano il fatturato in migliaia di euro prima
            dell'intervento e nei due anni successivi; la variazione percentuale è calcolata automaticamente tra il
            valore iniziale e il secondo anno.
          </p>
        </div>

        <div className="md:hidden space-y-4">
          {portfolioData.map((item, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-start mb-3 gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.type}</h3>
                  <p className="text-sm text-gray-600">
                    {item.location} • {item.rooms} camere
                  </p>
                </div>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
                  {formatIncrease(item.revenueBefore, item.revenueYear2)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Prima</p>
                  <p className="font-mono font-semibold text-gray-900">
                    {item.revenueBefore > 0 ? `${item.revenueBefore}K` : "Startup"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Anno 1</p>
                  <p className="font-mono font-semibold text-gray-900">{item.revenueYear1}K</p>
                </div>
                <div className="bg-blue-50 rounded p-2">
                  <p className="text-xs text-gray-500">Anno 2</p>
                  <p className="font-mono font-semibold text-blue-600">{item.revenueYear2}K</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block max-w-7xl mx-auto overflow-x-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#5B9BD5] text-white">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Tipologia</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Località</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold">Camere</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    Prima<br />
                    <span className="text-xs font-normal">(K€)</span>
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    Anno 1<br />
                    <span className="text-xs font-normal">(K€)</span>
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    Anno 2<br />
                    <span className="text-xs font-normal">(K€)</span>
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">Variazione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {portfolioData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-900 font-medium">{item.type}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{item.location}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-center">{item.rooms}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right font-mono">
                      {item.revenueBefore > 0 ? `${item.revenueBefore}K` : "Startup"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right font-mono">{item.revenueYear1}K</td>
                    <td className="px-4 py-4 text-sm font-semibold text-blue-600 text-right">{item.revenueYear2}K</td>
                    <td className="px-4 py-4 text-sm font-semibold text-green-600 text-right">
                      {formatIncrease(item.revenueBefore, item.revenueYear2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4 text-base md:text-lg">Vuoi capire quali leve possono funzionare per la tua struttura?</p>
          <a
            href="#contact"
            className="inline-block bg-[#5B9BD5] text-white px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-[#4A8BC4] transition-colors text-sm md:text-base"
          >
            Richiedi una consulenza
          </a>
        </div>
      </div>
    </section>
  )
}
