import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SuppressHydrationWarning } from "@/components/providers/suppress-hydration-warning";
import { SplashProvider } from "@/components/providers/splash-provider";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { LazyAnalytics } from "@/components/analytics/lazy-analytics";
import { LazySpeedInsights } from "@/components/analytics/lazy-speed-insights";
import { PhoneMissingDialog } from "@/components/auth/phone-missing-dialog";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://dousell-immo.app"),
  title: {
    default: "Dousell Immo | L'immobilier de confiance au Sénégal",
    template: "%s | Dousell Immo",
  },
  description:
    "Villas, terrains et appartements de luxe à Dakar et sur la Petite Côte. Une expérience immobilière transparente et moderne.",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "fr_SN",
    url: "https://dousell-immo.app",
    siteName: "Dousell Immo",
    title: "Dousell Immo | L'immobilier de confiance au Sénégal",
    description: "Villas, terrains et appartements de luxe à Dakar et sur la Petite Côte.",
    images: [
      {
        url: "/monument.png", // Image par défaut (Monument de la Renaissance)
        width: 1200,
        height: 630,
        alt: "Dousell Immo - Immobilier Sénégal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dousell Immo | L'immobilier de confiance au Sénégal",
    description: "Villas, terrains et appartements de luxe à Dakar et sur la Petite Côte.",
    images: ["/monument.png"],
    creator: "@dousell_immo",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dousell Immo",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Dousell Immo",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#05080c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID || "ui7ik5nepa";
  // TODO: Configure NEXT_PUBLIC_GTM_ID in your .env.local file
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Anti-Flash & Instant Dark Mode Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('theme');
                  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const isDark = storedTheme === 'dark' || (!storedTheme && systemDark) || (storedTheme === 'system' && systemDark);
                  
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.backgroundColor = '#05080c';
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.style.backgroundColor = '#f8fafc';
                  }

                  // Create splash-blocker if needed (prevent initial layout shifts)
                  if (!sessionStorage.getItem('doussel_splash_shown')) {
                    const style = document.createElement('style');
                    style.id = 'splash-style-blocker';
                    style.innerHTML = 'body { overflow: hidden !important; }';
                    document.head.appendChild(style);
                    
                    const blocker = document.createElement('div');
                    blocker.id = 'splash-blocker';
                    blocker.style.position = 'fixed';
                    blocker.style.inset = '0';
                    blocker.style.zIndex = '9999';
                    blocker.style.backgroundColor = isDark ? '#05080c' : '#f8fafc';
                    document.documentElement.appendChild(blocker);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />

        {/* Standard iOS Splash Screens (Apple Touch Startup Image) */}
        <link rel="apple-touch-startup-image" href="/splash/iphone5_splash.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone6_splash.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/iphoneplus_splash.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/iphonex_splash.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/iphonexr_splash.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/iphonexsmax_splash.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/ipad_splash.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/ipadpro1_splash.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/ipadpro2_splash.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />

        {/* Schema.org GEO Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://dousell-immo.app/#organization",
                  "name": "Dousell Immo",
                  "url": "https://dousell-immo.app",
                  "logo": "https://dousell-immo.app/icons/icon-512.png",
                  "description": "Plateforme immobilière de référence au Sénégal pour l'achat, la vente et la gestion locative.",
                  "sameAs": [
                    "https://facebook.com",
                    "https://instagram.com",
                    "https://linkedin.com"
                  ]
                },
                {
                  "@type": "RealEstateAgent",
                  "@id": "https://dousell-immo.app/#localbusiness",
                  "url": "https://dousell-immo.app",
                  "name": "Dousell Immo",
                  "image": "https://dousell-immo.app/monument.png",
                  "areaServed": [
                    { "@type": "City", "name": "Dakar" },
                    { "@type": "City", "name": "Saly" },
                    { "@type": "City", "name": "Mbour" },
                    { "@type": "Place", "name": "Petite Côte" }
                  ],
                  "address": {
                    "@type": "PostalAddress",
                    "addressCountry": "SN",
                    "addressLocality": "Dakar"
                  },
                  "priceRange": "$$"
                }
              ]
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background antialiased`}
        suppressHydrationWarning
      >
        {/* Google Tag Manager (noscript) */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {/* End Google Tag Manager (noscript) */}

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Top Loader - Barre de progression dorée style YouTube */}
          <NextTopLoader
            color="rgb(244, 196, 48)"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px rgb(244, 196, 48), 0 0 5px rgb(244, 196, 48)"
            zIndex={10001}
          />
          <SuppressHydrationWarning />
          <ServiceWorkerRegister />
          <SplashProvider>
            {children}
            <InstallPrompt />
            <Toaster position="top-center" richColors />
            <CookieConsent />
            <PhoneMissingDialog />
          </SplashProvider>
          {/* Analytics lazy-loaded après interaction utilisateur (GA, Clarity, GTM) */}
          <LazyAnalytics gaId={gaId} clarityId={clarityId} gtmId={gtmId} />
          {/* Speed Insights TEMPORAIREMENT DÉSACTIVÉ pour mesurer l'impact sur critical path */}
          {/* <LazySpeedInsights /> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
