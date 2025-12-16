import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { CookieConsent } from "@/components/cookie-consent"
import { ScrollToTop } from "@/components/scroll-to-top"
import { LandingPagePopup } from "@/components/landing-page-popup"
import Script from "next/script"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "4 Bid SRL – Offerte & Tecnologia",
  description:
    "Consulenza specializzata per il settore turistico-ricettivo. Revenue management, strategie commerciali e supporto operativo per hotel e strutture ricettive.",
  keywords: "revenue management, consulenza turistica, hotel management, 4bid, offerte, tecnologia",
  authors: [{ name: "4 Bid SRL" }],
  openGraph: {
    title: "4 Bid SRL – Offerte & Tecnologia",
    description: "Consulenza specializzata per il settore turistico-ricettivo",
    type: "website",
    locale: "it_IT",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it" className="scroll-smooth">
      <head>
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

        <Script
          id="yandex-metrika"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
              })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=105859080', 'ym');
              ym(105859080, 'init', {
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true,
                webvisor:true,
                ecommerce:"dataLayer"
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* GTM noscript fallback */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K8PFZCBS"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* Yandex.Metrika noscript fallback */}
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/105859080" style={{ position: "absolute", left: "-9999px" }} alt="" />
          </div>
        </noscript>

        <ScrollToTop />
        {children}
        <Analytics />
        <Toaster />
        <CookieConsent />
        <LandingPagePopup />
      </body>
    </html>
  )
}
