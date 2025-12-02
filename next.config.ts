import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const repositoryName = 'dousel-immo';

const nextConfig: NextConfig = {
  // Configuration pour GitHub Pages (seulement si déployé via GitHub Actions)
  ...(isGitHubPages && {
    output: 'export',
    basePath: `/${repositoryName}`,
    assetPrefix: `/${repositoryName}/`,
    trailingSlash: true,
  }),
  // Headers de sécurité OWASP
  async headers() {
    return [
      {
        // Appliquer à toutes les routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // En développement, Next.js nécessite 'unsafe-eval' pour le hot reload
              // En production, cette directive n'est pas nécessaire
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://*.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com`,
              "style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
              "img-src 'self' blob: data: https://*.supabase.co https://images.unsplash.com https://images.pexels.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.basemaps.cartocdn.com https://*.openstreetmap.org https://*.tile.openstreetmap.org https://cdnjs.cloudflare.com https://unpkg.com https://a.basemaps.cartocdn.com https://b.basemaps.cartocdn.com https://c.basemaps.cartocdn.com https://d.basemaps.cartocdn.com https://*.google-analytics.com https://*.googletagmanager.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in https://challenges.cloudflare.com https://*.google-analytics.com https://www.googletagmanager.com https://va.vercel-scripts.com https://*.basemaps.cartocdn.com https://*.openstreetmap.org https://images.unsplash.com https://images.pexels.com https://*.googleusercontent.com wss://*.supabase.co",
              "frame-src 'self' https://challenges.cloudflare.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
  images: {
    ...(isGitHubPages && { unoptimized: true }),
    qualities: [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.mapbox.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "blyanhulvwpdfpezlaji.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
