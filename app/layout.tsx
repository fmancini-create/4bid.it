import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { SonnerToasterProvider } from "@/components/ui/sonner"
import { CookieConsent } from "@/components/cookie-consent"
import { ScrollToTop } from "@/components/scroll-to-top"
import AISupportChat from "@/components/ai-support-chat"
import "./globals.css"
import { YandexMetrika } from "@/components/yandex-metrika"
import { IS_PRIVATE_AREA_JS } from "@/lib/is-private-area"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://www.4bid.it"),
  title: "Revenue Management per Hotel, B&B e Strutture Ricettive | 4BID",
  description:
    "Consulenza e software di revenue management per hotel, B&B e agriturismi: aumenta i ricavi, ottimizza prezzi e prenotazioni dirette. Scopri le soluzioni 4BID.",
  keywords:
    "revenue management hotel, software revenue management, aumentare ricavi hotel, dynamic pricing hotel, consulenza revenue management, prenotazioni dirette, 4bid",
  authors: [{ name: "4BID SRL" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Revenue Management per Hotel, B&B e Strutture Ricettive | 4BID",
    description:
      "Consulenza e software di revenue management per hotel, B&B e agriturismi: aumenta i ricavi e ottimizza prezzi e prenotazioni dirette.",
    type: "website",
    locale: "it_IT",
    siteName: "4BID.IT",
    url: "https://www.4bid.it",
    images: [
      {
        url: "/og-image-4bid.jpg",
        width: 1024,
        height: 1024,
        alt: "4BID - Revenue Management per Hotel, B&B e Strutture Ricettive",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Revenue Management per Hotel, B&B e Strutture Ricettive | 4BID",
    description:
      "Consulenza e software di revenue management per hotel, B&B e agriturismi: aumenta i ricavi e ottimizza prezzi e prenotazioni dirette.",
    images: ["/og-image-4bid.jpg"],
  },
  /**
   * NIENTE `alternates.canonical` qui.
   *
   * I metadata del layout radice vengono EREDITATI da ogni pagina che non li
   * sovrascrive: un canonical dichiarato qui faceva dire a 10 pagine "sono un
   * doppione della home, indicizza quella al mio posto". Erano cosi' escluse
   * dai risultati per loro stessa dichiarazione, e non potevano posizionarsi
   * per nulla: tra queste /prenotazioni-dirette-hotel,
   * /strategie-vendita-diretta-hotel e /revenue-manager-hotel-toscana.
   *
   * Il canonical e' per definizione l'indirizzo DELLA singola pagina, quindi va
   * dichiarato nella pagina. La home ha il suo in `app/page.tsx`, percio' qui
   * non si perde nulla.
   */
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "4BID.IT",
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  /**
   * Perimetro della misurazione: SOLO il sito pubblico in produzione.
   *
   * Prima la condizione era `NODE_ENV === "production"`, che su Vercel e' vero
   * per OGNI distribuzione, anteprime comprese: ogni deploy di prova finiva
   * nella stessa proprieta' GA e nello stesso contatore Yandex del sito vero.
   * Le anteprime sono protette, quindi le apriamo solo noi dal pannello v0: quel
   * traffico e' lavoro interno, non visite. Nel rapporto degli ultimi 90 giorni
   * `v0.app / referral` e' infatti la PRIMA sorgente con 143 utenti su 237
   * (60%), mentre la ricerca organica ne porta 2 in totale.
   *
   * `VERCEL_ENV` distingue quello che `NODE_ENV` non distingue: vale
   * "production" solo sul dominio di produzione, "preview" sulle anteprime,
   * "development" in locale. Se e' assente (build fuori da Vercel) non si
   * misura: meglio un dato mancante che un dato falso.
   */
  const isProduction = process.env.VERCEL_ENV === "production"

  return (
    <html lang="it" className="scroll-smooth">
      <head>
        {isProduction && (
          <>
            {/* Google Tag Manager - script HTML standard nel head per essere immediatamente visibile ai crawler.
                Non viene inizializzato nelle aree riservate: i path conterrebbero
                slug di progetto e nomi di documenti riservati. */}
            <script
              dangerouslySetInnerHTML={{
                __html: `if(!${IS_PRIVATE_AREA_JS}){(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K8PFZCBS');}`,
              }}
            />

            {/* Google Analytics - script tag standard per garantire rilevamento da crawler */}
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-S6YEEXE4C3" />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
if(!${IS_PRIVATE_AREA_JS}){
gtag('js', new Date());
gtag('config', 'G-S6YEEXE4C3');
}`,
              }}
            />

            {/* Script inline ufficiale Yandex con Session Replay (webvisor) abilitato */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
              window.initYandexMetrika = function() {
                if (window.yandexMetrikaLoaded) {
                  return;
                }
                (function(m,e,t,r,i,k,a){
                  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  for (var j = 0; j < document.scripts.length; j++) {
                    if (document.scripts[j].src === r) { return; }
                  }
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
                })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
                ym(105859080, "init", {
                  clickmap: true,
                  trackLinks: true,
                  accurateTrackBounce: true,
                  webvisor: true,
                  ecommerce: "dataLayer"
                });
                window.yandexMetrikaLoaded = true;
              };
              // AVVIO IMMEDIATO, allineato a Google Analytics.
              //
              // Prima la Metrika partiva solo con localStorage["cookie-consent"]
              // === "accepted". Misurato in produzione: su una pagina senza consenso
              // Google aveva gtag attivo, 5 eventi in dataLayer e 2 richieste
              // partite, mentre Yandex era a ZERO richieste. Chi ignorava il banner
              // e navigava non veniva visto da Yandex per tutta la sessione: e'
              // questa la ragione per cui i segnali non arrivavano piu'.
              //
              // Il fallback <noscript> in fondo al body, invece, ha SEMPRE inviato
              // l'hit senza consenso: i due percorsi erano incoerenti fra loro.
              //
              // L'UNICO cancello che resta e' l'area riservata, e va tenuto: la
              // Metrika gira con webvisor (session replay), quindi registra il DOM.
              // Nelle pagine riservate il DOM contiene i documenti dei clienti, che
              // finirebbero a un provider terzo. La' non parte affatto.
              if (typeof window !== "undefined" && !${IS_PRIVATE_AREA_JS}) {
                window.initYandexMetrika();
              }
            `,
              }}
            />
          </>
        )}
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* GTM noscript fallback - solo produzione */}
        {isProduction && (
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-K8PFZCBS"
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}

        {/* Yandex.Metrika noscript fallback - solo produzione */}
        {isProduction && (
          <noscript>
            <div>
              <img
                src="https://mc.yandex.ru/watch/105859080"
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
              />
            </div>
          </noscript>
        )}

        {isProduction && (
          <Suspense fallback={null}>
            <YandexMetrika />
          </Suspense>
        )}
        <ScrollToTop />
        {children}
        {isProduction && <Analytics />}
        <Toaster />
        <SonnerToasterProvider />
        <CookieConsent />
        <AISupportChat userEmail="" accountType="pro" />
      </body>
    </html>
  )
}
