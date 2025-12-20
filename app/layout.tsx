import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { CookieConsent } from "@/components/cookie-consent"
import { ScrollToTop } from "@/components/scroll-to-top"
import { LandingPagePopup } from "@/components/landing-page-popup"
import Script from "next/script"
import AISupportChat from "@/components/ai-support-chat"
import "./globals.css"
import { YandexMetrika } from "@/components/yandex-metrika"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://4bid.it"),
  title: "4BID.IT – Innovazione e Tecnologia per il Tuo Business",
  description:
    "4BID offre consulenza revenue management per hotel, software innovativi e soluzioni tecnologiche per ottimizzare ricavi e performance aziendali.",
  keywords: "4bid, revenue management, consulenza turistica, hotel management, tecnologia, innovazione",
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
    title: "4BID.IT – Innovazione e Tecnologia per il Tuo Business",
    description: "Consulenza revenue management, software e soluzioni tecnologiche innovative",
    type: "website",
    locale: "it_IT",
    siteName: "4BID.IT",
    url: "https://4bid.it",
  },
  alternates: {
    canonical: "https://4bid.it",
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
  const isProduction = process.env.NODE_ENV === "production"

  return (
    <html lang="it" className="scroll-smooth">
      <head>
        {isProduction && (
          <>
            {/* Google Tag Manager */}
            <Script
              id="gtm-script"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K8PFZCBS');`,
              }}
            />

            {/* Google Analytics */}
            <Script async src="https://www.googletagmanager.com/gtag/js?id=G-S6YEEXE4C3" strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-S6YEEXE4C3');
          `}
            </Script>

            {/* Script inline ufficiale Yandex con Session Replay (webvisor) abilitato */}
            <Script
              id="yandex-metrika-loader"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
              window.initYandexMetrika = function() {
                if (window.yandexMetrikaLoaded) {
                  console.log("[v0] Yandex Metrika already loaded");
                  return;
                }
                
                console.log("[v0] Loading Yandex Metrika...");
                
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
                console.log("[v0] Yandex Metrika loaded successfully with Session Replay enabled");
              };
              
              if (typeof window !== "undefined") {
                const consent = localStorage.getItem("cookie-consent");
                if (consent === "accepted") {
                  window.initYandexMetrika();
                }
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
        <CookieConsent />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <LandingPagePopup />
          <AISupportChat userEmail="" accountType="pro" />
        </div>
      </body>
    </html>
  )
}
