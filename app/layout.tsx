import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SuppressHydrationWarning } from "@/components/providers/suppress-hydration-warning";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { ConditionalGoogleAnalytics } from "@/components/analytics/conditional-google-analytics";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Dousell Immo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#05080c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#05080c] antialiased`}
        suppressHydrationWarning
      >
        <SuppressHydrationWarning />
        <ServiceWorkerRegister />
        <AppShell>{children}</AppShell>
        <InstallPrompt />
        <Toaster position="top-center" theme="dark" richColors />
        <CookieConsent />
        {gaId && <ConditionalGoogleAnalytics gaId={gaId} />}
        <SpeedInsights />
      </body>
    </html>
  );
}
