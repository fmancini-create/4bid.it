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
  const isProduction = process.env.VERCEL_ENV === "production"

  return (
    <html lang="it" className="scroll-smooth">
      <head>
        {isProduction && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `if(!${IS_PRIVATE_AREA_JS}){(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K8PFZCBS');}`,
              }}
            />

            {/*
              GA4 viene caricato solo sulle pagine pubbliche. Prima il file
              gtag.js veniva scaricato anche nelle aree private e veniva evitato
              soltanto gtag('config'): questo generava comunque una richiesta
              verso Google da URL che devono restare fuori dagli analytics.
            */}
            <script
              dangerouslySetInnerHTML={{
                __html: `if(!${IS_PRIVATE_AREA_JS}){
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-S6YEEXE4C3');
var ga=document.createElement('script');
ga.async=true;
ga.src='https://www.googletagmanager.com/gtag/js?id=G-S6YEEXE4C3';
(document.head||document.documentElement).appendChild(ga);
}`,
              }}
            />

            {/*
              Yandex Metrika: lo stato "loaded" viene impostato SOLO dopo il vero
              onload di tag.js. Prima veniva impostato subito dopo aver inserito lo
              script nel DOM, quindi ad blocker/errori di rete potevano produrre un
              falso positivo. Manteniamo la coda ym ufficiale e un retry controllato.
            */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
(function () {
  var YANDEX_SRC = "https://mc.yandex.ru/metrika/tag.js";
  var YANDEX_ID = 105859080;
  var retryTimer = null;

  window.yandexMetrikaLoaded = false;
  window.yandexMetrikaLoading = false;

  window.initYandexMetrika = function () {
    if (window.yandexMetrikaLoaded || window.yandexMetrikaLoading) return;

    window.ym = window.ym || function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = window.ym.l || 1 * new Date();

    var existing = Array.prototype.find.call(document.scripts, function (script) {
      return script.src === YANDEX_SRC;
    });

    var onReady = function () {
      window.yandexMetrikaLoading = false;
      window.yandexMetrikaLoaded = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      console.info("[4BID] Yandex Metrika tag.js loaded");
    };

    var onError = function () {
      window.yandexMetrikaLoading = false;
      window.yandexMetrikaLoaded = false;
      console.warn("[4BID] Yandex Metrika tag.js failed to load");

      var failedScript = document.querySelector('script[data-4bid-yandex="true"]');
      if (failedScript && failedScript.parentNode) {
        failedScript.parentNode.removeChild(failedScript);
      }

      if (!retryTimer) {
        retryTimer = setTimeout(function () {
          retryTimer = null;
          if (!${IS_PRIVATE_AREA_JS}) window.initYandexMetrika();
        }, 5000);
      }
    };

    window.yandexMetrikaLoading = true;

    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", onError, { once: true });
    } else {
      var script = document.createElement("script");
      script.async = true;
      script.src = YANDEX_SRC;
      script.setAttribute("data-4bid-yandex", "true");
      script.addEventListener("load", onReady, { once: true });
      script.addEventListener("error", onError, { once: true });
      (document.head || document.documentElement).appendChild(script);
    }

    window.ym(YANDEX_ID, "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
      ecommerce: "dataLayer"
    });
  };

  if (typeof window !== "undefined" && !${IS_PRIVATE_AREA_JS}) {
    window.initYandexMetrika();
  }
})();
`,
              }}
            />
          </>
        )}
      </head>
      <body className={`${inter.className} antialiased`}>
        {/*
          Nessun fallback analytics <noscript>: il root layout non conosce il
          pathname lato server. Un fallback globale contatterebbe GTM/Yandex
          anche su /admin, /area-riservata e /business-plan quando JS e' spento.
          Meglio perdere il tracking di quel caso marginale che violare il
          confine delle aree private.
        */}
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
