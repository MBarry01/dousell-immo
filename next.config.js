/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const repositoryName = 'dousel-immo';

const nextConfig = {
    // Configuration pour GitHub Pages (seulement si déployé via GitHub Actions)
    ...(isGitHubPages && {
        output: 'export',
        basePath: `/${repositoryName}`,
        assetPrefix: `/${repositoryName}/`,
        trailingSlash: true,
    }),
    // Headers de sécurité OWASP
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
        // Tree-shaking optimisé pour librairies lourdes
        optimizePackageImports: ['lucide-react', 'date-fns', 'lodash', 'recharts'],
    },
    // Redirections legacy (désactivées pour restauration des chemins)
    async redirects() {
        return [
            // Route dupliquée CGU
            {
                source: '/cgu',
                destination: '/legal/cgu',
                permanent: true,
            },
        ];
    },
    // Disable static generation for vitrine routes with dynamic useSearchParams/usePathname
    onDemandEntries: {
        maxInactiveAge: 60 * 1000,
        pagesBufferLength: 5,
    },
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
                        value: 'camera=(), microphone=(self), geolocation=(), interest-cohort=()',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://*.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com https://www.clarity.ms https://*.clarity.ms https://scripts.clarity.ms https://c.bing.com https://cdn.kkiapay.me https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://*.onesignal.com https://onesignal.com`,
                            "style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.gstatic.com https://translate.googleapis.com https://*.onesignal.com https://onesignal.com https://fonts.googleapis.com",
                            "img-src 'self' blob: data: https://*.supabase.co https://images.unsplash.com https://images.pexels.com https://*.googleusercontent.com https://*.basemaps.cartocdn.com https://*.openstreetmap.org https://*.tile.openstreetmap.org https://cdnjs.cloudflare.com https://unpkg.com https://a.basemaps.cartocdn.com https://b.basemaps.cartocdn.com https://c.basemaps.cartocdn.com https://d.basemaps.cartocdn.com https://*.google-analytics.com https://*.googletagmanager.com https://c.bing.com https://*.clarity.ms https://fonts.gstatic.com https://www.gstatic.com https://translate.google.com https://*.coinafrique.com https://*.roamcdn.net https://i.roamcdn.net https://*.jijistatic.com https://pictures-senegal.jijistatic.com https://*.onesignal.com https://onesignal.com https://res.cloudinary.com https://*.cloudinary.com",
                            "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
                            "connect-src 'self' https://*.supabase.co https://*.supabase.in https://challenges.cloudflare.com https://*.google-analytics.com https://www.googletagmanager.com https://va.vercel-scripts.com https://*.basemaps.cartocdn.com https://*.openstreetmap.org https://images.unsplash.com https://images.pexels.com https://*.googleusercontent.com wss://*.supabase.co https://www.clarity.ms https://*.clarity.ms https://c.bing.com https://api.kkiapay.me https://*.kkiapay.me https://raw.githack.com https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://fonts.gstatic.com https://*.onesignal.com https://onesignal.com https://res.cloudinary.com https://*.cloudinary.com",
                            "frame-src 'self' https://*.supabase.co https://challenges.cloudflare.com https://www.youtube.com https://youtube.com https://www.google.com https://maps.google.com https://*.kkiapay.me https://translate.google.com https://*.onesignal.com",
                            "worker-src 'self' blob: https://*.onesignal.com",
                            "media-src 'self' data:",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
    images: {
        ...(isGitHubPages && { unoptimized: true }),
        // Restriction des qualités pour éviter trop de variations de cache
        qualities: [50, 60, 75, 80],
        remotePatterns: [
            { protocol: "https", hostname: "api.mapbox.com" },
            { protocol: "https", hostname: "images.unsplash.com" },
            { protocol: "https", hostname: "plus.unsplash.com" },
            { protocol: "https", hostname: "maps.googleapis.com" },
            { protocol: "https", hostname: "images.pexels.com" },
            { protocol: "https", hostname: "*.supabase.co" },
            { protocol: "https", hostname: "blyanhulvwpdfpezlaji.supabase.co" },
            { protocol: "https", hostname: "lh3.googleusercontent.com" },
            { protocol: "https", hostname: "*.coinafrique.com" },
            { protocol: "https", hostname: "sn.coinafrique.com" },
            { protocol: "https", hostname: "*.roamcdn.net" },
            { protocol: "https", hostname: "i.roamcdn.net" },
            { protocol: "https", hostname: "*.jijistatic.com" },
            { protocol: "https", hostname: "pictures-senegal.jijistatic.com" },
            { protocol: "https", hostname: "res.cloudinary.com" },
            { protocol: "https", hostname: "*.cloudinary.com" },
        ],
        // Réduction du nombre de breakpoints pour limiter les fichiers générés
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        // Cache agressif (60 jours) pour éviter de fetcher l'origine trop souvent sur Vercel
        minimumCacheTTL: 5184000,
    },

};

module.exports = nextConfig;
