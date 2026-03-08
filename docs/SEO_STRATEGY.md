# SEO Strategy - Doussel Immo 4-Tier Dynamic Routes

> **Last Updated**: 2026-03-08
> **Implementation Status**: Complete (Tasks 1-13 done)

## Overview

This document describes the 4-tier dynamic routing strategy for generating 500+ SEO-optimized pages at Doussel Immo. The system uses Next.js 16 App Router with Incremental Static Regeneration (ISR) to automatically generate pages for every meaningful combination of city, district, and property type.

---

## Architecture

### Route Structure

The 4-tier routing system is organized as follows:

```
/immobilier (Tier 1 - Root)
├── /immobilier/[city] (Tier 2)
│   └── /immobilier/[city]/[district] (Tier 3)
│       └── /immobilier/[city]/[district]/[type] (Tier 4)
```

### Tier Breakdown

| Tier | Route | Purpose | Example | Priority |
|------|-------|---------|---------|----------|
| **1** | `/immobilier` | Root directory of all real estate listings | `/immobilier` | 1.0 (daily) |
| **2** | `/immobilier/[city]` | City-level overview of all property types | `/immobilier/dakar` | 0.9 (daily) |
| **3** | `/immobilier/[city]/[district]` | Neighborhood-specific listings across all types | `/immobilier/dakar/plateau` | 0.85 (daily) |
| **4** | `/immobilier/[city]/[district]/[type]` | Hyper-specific: neighborhood + property type | `/immobilier/dakar/plateau/appartement` | 0.8 (daily) |

Each tier targets different search intents:
- **Tier 2**: Captures city-wide searches ("immobilier dakar")
- **Tier 3**: Targets neighborhood-specific queries ("appartement plateau dakar")
- **Tier 4**: Captures long-tail, intent-rich searches ("vendre appartement plateau dakar")

---

## Page Generation Strategy

### Incremental Static Regeneration (ISR)

All 4-tier pages use ISR with a revalidation period of **3600 seconds (1 hour)**:

```typescript
export const revalidate = 3600; // All pages refresh hourly
export const dynamicParams = true; // On-demand generation for uncrawled routes
```

**Benefits**:
- Pre-generated pages serve instantly from edge caches
- New properties appear within 1 hour of publication
- Reduces server load compared to SSR
- Allows on-demand generation for niche combinations

### Static Params Generation

Each page level generates static params to pre-render top routes at build time:

**Tier 2 - Cities**:
```typescript
// app/(vitrine)/immobilier/[city]/page.tsx
export async function generateStaticParams() {
  const cities = await getActiveCities();
  return cities.map(city => ({ city: city.slug }));
}
```

**Tier 3 - Districts**:
```typescript
// app/(vitrine)/immobilier/[city]/[district]/page.tsx
export async function generateStaticParams() {
  return await generateCityDistrictParams();
}
```

**Tier 4 - Types**:
```typescript
// app/(vitrine)/immobilier/[city]/[district]/[type]/page.tsx
export async function generateStaticParams() {
  return await generateCityDistrictTypeParams();
}
```

---

## SEO Implementation

### Meta Tags & Structured Data

Each page includes:
1. **OpenGraph Tags** (Facebook, LinkedIn, social sharing)
2. **Twitter Card Tags** (Twitter sharing)
3. **Canonical URLs** (prevents duplicate content issues)
4. **JSON-LD Schema.org** (rich snippets for Google)

**Example Meta Tags**:
```typescript
const metadata = generateMetadata({
  title: `Immobilier à Dakar : Ventes et Locations au Sénégal`,
  description: `Trouvez votre bien immobilier à Dakar. Villas, appartements...`,
  path: `/immobilier/dakar`,
  type: 'website',
  keywords: ['immobilier', 'dakar', 'senegal', 'vente', 'location'],
});
```

### JSON-LD Schemas

Each page includes multiple schema types:

**BreadcrumbList**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "position": 1, "name": "Accueil", "item": "https://www.dousel.com/" },
    { "position": 2, "name": "Immobilier", "item": "https://www.dousel.com/immobilier" },
    { "position": 3, "name": "Dakar", "item": "https://www.dousel.com/immobilier/dakar" }
  ]
}
```

**AggregateOffer** (price statistics)
```json
{
  "@context": "https://schema.org",
  "@type": "AggregateOffer",
  "priceCurrency": "XOF",
  "lowPrice": "50 000 000",
  "highPrice": "500 000 000",
  "offerCount": 47,
  "availability": "https://schema.org/InStock",
  "areaServed": "Plateau, Dakar"
}
```

**FAQPage** (common questions)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Quel est le prix moyen à Dakar?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Le prix moyen est de 250 000 000 XOF..."
      }
    }
  ]
}
```

### robots.txt Configuration

The `robots.txt` file directs crawlers to prioritize our 4-tier routes:

```
User-agent: Googlebot
Allow: /
Disallow: /gestion/, /compte/, /auth/, /admin/, /api/
Crawl-delay: 0

User-agent: *
Allow: /immobilier, /immobilier/, /biens, /location, /vente, /recherche
Disallow: /gestion/, /compte/, /auth/, /admin/, /api/, /workspace/
Crawl-delay: 10

# Block aggressive bots
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /
```

**Strategy**:
- Google gets unlimited crawl rate (0 delay)
- Other bots throttled to 10 seconds (reduces bandwidth usage)
- Aggressive bots (Ahrefs, Semrush, MJ12bot) completely blocked
- Only allows crawling of immobilier routes

### Sitemap Generation

Automatic sitemap generation includes all 4-tier routes:

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetches active city/district/type combinations from RPC
  const vente4tier = await supabase.rpc('get_active_cities_districts_types', {
    min_count: 1,
    target_category: 'vente'
  });

  // Generates routes with priority and update frequency
  return [
    { url: `${BASE_URL}/immobilier`, priority: 1.0, changeFrequency: 'daily' },
    { url: `${BASE_URL}/immobilier/dakar`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE_URL}/immobilier/dakar/plateau`, priority: 0.85, changeFrequency: 'daily' },
    { url: `${BASE_URL}/immobilier/dakar/plateau/appartement`, priority: 0.8, changeFrequency: 'daily' },
    // ... all active combinations
  ];
}
```

---

## Analytics & Monitoring

### PostHog Event Tracking

Every page view and property interaction is tracked via PostHog:

```typescript
// Automatic tracking in server components
await trackPageView({
  city: 'dakar',
  district: 'plateau',
  type: 'appartement',
  url: '/immobilier/dakar/plateau/appartement',
});

// Property click tracking
await trackPropertyClick(propertyId, 'immobilier_dakar_plateau');
```

**Events Captured**:
- `seo_page_view`: Page impressions with city/district/type parameters
- `property_click`: User interactions with property listings

**Analytics Questions We Can Answer**:
- Which tier 4 combinations get the most traffic?
- Which properties get clicked most from SEO traffic?
- How do different neighborhoods perform in search?
- What's the conversion rate from page view to property interaction?

---

## Performance Optimization

### Image Optimization

All images are served via Cloudinary with automatic format negotiation:

```typescript
import { getPropertyImageUrl } from '@/lib/images/cloudinaryHelper';

// Automatically serves WebP to modern browsers, JPEG fallback
const imageUrl = getPropertyImageUrl(publicId, 'large'); // 1200x900
// Result: https://res.cloudinary.com/dkkirzpxe/image/upload/w_1200,h_900,c_fill,q_auto,f_auto/{publicId}
```

**Transformations Applied**:
- Auto-format negotiation (WebP → JPEG → PNG based on browser)
- Quality auto-optimization (reduces JPEG quality on slow networks)
- Responsive sizing (thumb: 300x200, medium: 800x600, large: 1200x900)
- Caching via Cloudinary's global CDN

### Build Optimization

- Next.js Turbopack for faster development builds
- Static page pre-generation for top 50 city/district/type combinations
- On-demand ISR for less popular combinations
- 24-hour sitemap revalidation (reduces Vercel compute)

---

## Data Bootstrap & Management

### Seed Data Requirement

The 4-tier system requires a critical mass of properties to generate meaningful routes. Bootstrap process:

1. **District Setup** (required)
   - Load districts from migration: `supabase/migrations/20260307_add_districts_table.sql`
   - Each district links to a city and includes French name + description

2. **Property Seeding** (required)
   - Import properties with `district_id` + `type` fields
   - Minimum 3 properties per district for route generation
   - Recommended: 10+ properties per combination for ranking

3. **Type Classification**
   - Property types: `appartement`, `maison`, `terrain`, `villa`, etc.
   - Types are derived from RPC query on property data
   - Pre-defined in UI dropdowns

### Data Validation

All imported properties must pass:
- Geographic validation (valid city + district)
- Type validation (must match predefined types)
- Price validation (centimes format, must be positive)
- Status validation (`disponible`, `vendu`, `loue`)
- Admin approval before publishing

---

## Search Console Integration

### Expected Metrics

Once deployed, monitor in Google Search Console:

1. **Impressions** (how many times pages appear in search results)
   - Tier 4 pages should have highest impressions for long-tail keywords
   - Example: "appartement plateau dakar location 2026"

2. **Click-Through Rate** (how many people click from results)
   - Target: 3-5% CTR for tier 4 pages
   - Improve by optimizing title and description

3. **Average Position** (ranking position in SERPs)
   - Target: Position 1-3 for tier 4 long-tail keywords
   - Improve by adding more content, backlinks

4. **Core Web Vitals**
   - Ensure LCP < 2.5s (Largest Contentful Paint)
   - Ensure CLS < 0.1 (Cumulative Layout Shift)
   - Monitor via PageSpeed Insights

### Optimization Workflow

1. **Week 1**: Let pages index naturally (submit sitemap to GSC)
2. **Week 2**: Monitor impressions and CTR in GSC
3. **Week 3**: Identify top performing cities/districts
4. **Week 4**: Add rich content to top-performing pages (guides, FAQs)
5. **Ongoing**: A/B test title/description to improve CTR

---

## Troubleshooting

### Pages Not Indexing

**Symptoms**: Pages appear in sitemap but not in Google Search results

**Solutions**:
1. Check robots.txt allows crawling:
   ```bash
   curl -I https://www.dousel.com/robots.txt
   ```

2. Verify page is not 404:
   ```bash
   curl -I https://www.dousel.com/immobilier/dakar/plateau/appartement
   ```

3. Submit to Google Search Console:
   - Add property
   - Submit sitemap: `/sitemap.xml`
   - Request indexing for specific URLs

4. Check for robots meta tag blocking:
   ```
   # Should NOT have noindex
   <meta name="robots" content="index, follow">
   ```

### Poor Ranking for Keywords

**Symptoms**: Pages appear in SERP but rank below competitors

**Solutions**:
1. Add neighborhood content (guides, price trends)
2. Increase internal linking between tiers
3. Get backlinks from local Senegal real estate sites
4. Optimize for featured snippets (add more FAQ content)
5. Improve Core Web Vitals (speed optimization)

### Analytics Not Recording

**Symptoms**: No events in PostHog dashboard

**Solutions**:
1. Verify PostHog credentials:
   ```bash
   echo $NEXT_PUBLIC_POSTHOG_KEY
   echo $NEXT_PUBLIC_POSTHOG_HOST
   ```

2. Check PostHog SDK is enabled:
   ```typescript
   if (!posthog.isEnabled()) console.warn('PostHog disabled');
   ```

3. Manually trigger event in dev console:
   ```bash
   npm run dev
   # Visit any 4-tier page, check browser network tab for PostHog requests
   ```

---

## Files Reference

### Core Implementation Files

| File | Purpose |
|------|---------|
| `app/(vitrine)/immobilier/[city]/page.tsx` | Tier 2 (city) page component |
| `app/(vitrine)/immobilier/[city]/[district]/page.tsx` | Tier 3 (city + district) page component |
| `app/(vitrine)/immobilier/[city]/[district]/[type]/page.tsx` | Tier 4 (city + district + type) page component |
| `lib/seo/metadata.ts` | Unified metadata generator for all pages |
| `lib/seo/schemaBuilders.ts` | JSON-LD schema builders (breadcrumb, aggregate offer, FAQ) |
| `lib/analytics/seoTracking.ts` | PostHog analytics integration |
| `lib/images/cloudinaryHelper.ts` | Cloudinary image optimization |
| `app/robots.ts` | SEO crawler configuration |
| `app/sitemap.ts` | Dynamic sitemap generation |

### Database Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260307_add_districts_table.sql` | District data structure |
| `supabase/functions/get_active_cities_districts_types.sql` | RPC query for generating routes |

---

## Next Steps

### Phase 2 (Planned)

- [ ] Add neighborhood guides to Tier 3 pages (improve time-on-page)
- [ ] Implement backlink strategy from local Senegal sites
- [ ] Set up Google Search Console notifications for ranking changes
- [ ] Add hreflang tags for French localization
- [ ] Implement dynamic price trend graphs per neighborhood
- [ ] Build internal linking strategy between tiers

### Monitoring

- Set up weekly GSC reports (impressions, CTR, rankings)
- Monitor Core Web Vitals weekly
- Track property clicks via PostHog trends
- Analyze user behavior with heatmaps (Hotjar)
- A/B test page titles and descriptions quarterly

---

## Questions?

For questions about:
- **Database schema**: See `docs/DATABASE.md`
- **Component architecture**: See `COMPONENT_MAP.md`
- **Project structure**: See `PROJECT_BRAIN.md`
- **Development workflow**: See `.claude/rules/common/`
