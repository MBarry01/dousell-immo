import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SuppressHydrationWarning } from "@/components/providers/suppress-hydration-warning";
import { SplashProvider } from "@/components/providers/splash-provider";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { ConditionalGoogleAnalytics } from "@/components/analytics/conditional-google-analytics";
import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PhoneMissingDialog } from "@/components/auth/phone-missing-dialog";

import "./globals.css";
import "react-medium-image-zoom/dist/styles.css";
import "leaflet/dist/leaflet.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dousell-immo.app"),
  title: {
    default: "Dousell Immo",
    template: "%s · Dousell Immo",
  },
  description:
    "L'immobilier de confiance à Dakar et au Sénégal. Expérience mobile-first inspirée des apps natives iOS & Android.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dousell Immo",
    // Empêche l'effet de brillance sur iOS (si l'icône a un fond opaque)
    startupImage: [
      {
        url: "/icons/icon-512.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/icon-512.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/icon-512.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
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
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#F4C430",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID || "ui7isx66wq";

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Script inline pour afficher écran noir AVANT React (anti-flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Ne pas bloquer si déjà vu dans cette session
                try {
                  if (sessionStorage.getItem('doussel_splash_shown')) return;
                } catch (e) {
                  // sessionStorage peut être indisponible (Safari/PWA selon réglages) : on continue sans bloquer le script
                }
                
                // Créer le blocker immédiatement
                var d = document.createElement('div');
                d.id = 'splash-blocker';
                d.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#000;';
                document.documentElement.appendChild(d);
                
                // Bloquer le scroll
                document.documentElement.style.overflow = 'hidden';
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#05080c] antialiased`}
        suppressHydrationWarning
      >
        {/* Top Loader - Désactivé temporairement */}
        {/* <NextTopLoader
          color="#F4C430"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #F4C430, 0 0 5px #F4C430"
          zIndex={9000}
        /> */}
        <SuppressHydrationWarning />
        <ServiceWorkerRegister />
        <SplashProvider>
          <AppShell>{children}</AppShell>
          <InstallPrompt />
          <Toaster position="top-center" theme="dark" richColors />
          <CookieConsent />
          <PhoneMissingDialog />
        </SplashProvider>
        {gaId && <ConditionalGoogleAnalytics gaId={gaId} />}
        <MicrosoftClarity clarityId={clarityId} />
        <SpeedInsights />
      </body>
    </html>
  );
}
