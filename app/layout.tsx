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
import OneSignalProvider from "@/components/providers/onesignal-provider";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#05080c" },
    { media: "(prefers-color-scheme: dark)", color: "#05080c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID || "ui7ik5nepa";
  // TODO: Configure NEXT_PUBLIC_GTM_ID in your .env.local file
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  // Get authenticated user for OneSignal login
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
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
                    // Force background on body too
                    const style = document.createElement('style');
                    style.innerHTML = 'body { background-color: #05080c !important; }';
                    document.head.appendChild(style);
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.style.backgroundColor = '#f8fafc';
                    const style = document.createElement('style');
                    style.innerHTML = 'body { background-color: #f8fafc !important; }';
                    document.head.appendChild(style);
                  }

                  // Create splash-blocker only in PWA standalone mode
                  var isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
                  if (isPWA && !sessionStorage.getItem('doussel_splash_shown')) {
                    var style = document.createElement('style');
                    style.id = 'splash-style-blocker';
                    style.innerHTML = 'body { overflow: hidden !important; }';
                    document.head.appendChild(style);
                    
                    var blocker = document.createElement('div');
                    blocker.id = 'splash-blocker';
                    blocker.style.position = 'fixed';
                    blocker.style.inset = '0';
                    blocker.style.zIndex = '9999';
                    blocker.style.backgroundColor = '#05080c';
                    document.documentElement.appendChild(blocker);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />



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
            <OneSignalProvider userId={user?.id} />
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
