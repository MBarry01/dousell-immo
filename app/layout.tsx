import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";

import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SuppressHydrationWarning } from "@/components/providers/suppress-hydration-warning";

import "./globals.css";
import "react-medium-image-zoom/dist/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://doussel-immo.app"),
  title: {
    default: "Doussel Immo",
    template: "%s · Doussel Immo",
  },
  description:
    "Doussel Immo est une expérience immobilière mobile-first inspirée des apps natives iOS & Android.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#05080c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#05080c] antialiased`}
        suppressHydrationWarning
      >
        <SuppressHydrationWarning />
        <ServiceWorkerRegister />
        <AppShell>{children}</AppShell>
        <InstallPrompt />
        <Toaster position="top-center" theme="dark" richColors />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
