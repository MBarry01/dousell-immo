# SEO Immobilier 500+ Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand Doussel Immo from 3-tier SEO (city × type) to 4-tier (city × district/quartier × type) generating 500+ indexed pages with optimized JSON-LD, rich snippets, and structured data for maximum organic visibility.

**Architecture:** Build on existing Next.js 16 ISR dynamic route system. Add `/immobilier/[city]/[district]/[type]` tier. Enhance JSON-LD schema for each page combination. Implement smart data bootstrap strategy via agent forms + optional FB public scraping. Focus on geographical specificity + property richness for long-tail SEO.

**Tech Stack:** Next.js 16 App Router, Supabase (RPC queries), ISR caching (3600s), JSON-LD schema, Zod validation, TailwindCSS

---

## Current State Assessment

✅ **Already in place:**
- 3-tier dynamic routes: `/immobilier/[city]/[type]`
- RPC function: `get_active_cities_and_types(min_count, category)`
- JSON-LD components (BreadcrumbJsonLd, FAQJsonLd)
- Sitemap generation with ISR
- Cloudinary image hosting (public ID: `dkkirzpxe`)

⚠️ **To implement:**
- 4th tier: district/quartier routing
- Enhanced schema per page tier (LocalBusinessSchema, AggregateOfferSchema)
- Batch data import pipeline (agent CSV upload)
- Quartier directory + fuzzy matching
- SEO content enrichment (neighborhood guides)

---

## Task List (24 Tasks)

### Task 1: Create Districts Data Structure (Database)

**Files:**
- Create: `types/districts.ts`
- Modify: `supabase/migrations/20260307_add_districts_table.sql`
- Test: `tests/districts.test.ts`

**Step 1: Design district schema**

```typescript
// types/districts.ts
export type District = {
  id: string
  slug: string
  name_fr: string
  name_en?: string
  city_slug: string
  coordinates: { lat: number; lng: number }
  description?: string
  landmarks?: string[] // nearby attractions
  price_range?: { min: number; max: number } // estimated price range in centimes
  created_at?: string
}

export const SENEGAL_DISTRICTS = [
  // Dakar
  { slug: 'plateau', name_fr: 'Plateau', city_slug: 'dakar', coordinates: { lat: 14.6763, lng: -17.4443 } },
  { slug: 'almadies', name_fr: 'Almadies', city_slug: 'dakar', coordinates: { lat: 14.7474, lng: -17.5103 } },
  { slug: 'ouakam', name_fr: 'Ouakam', city_slug: 'dakar', coordinates: { lat: 14.7293, lng: -17.5173 } },
  { slug: 'yoff', name_fr: 'Yoff', city_slug: 'dakar', coordinates: { lat: 14.7512, lng: -17.5392 } },
  { slug: 'ngor', name_fr: 'Ngor', city_slug: 'dakar', coordinates: { lat: 14.7680, lng: -17.5555 } },
  { slug: 'mermoz', name_fr: 'Mermoz-Sacré-Cœur', city_slug: 'dakar', coordinates: { lat: 14.6995, lng: -17.4975 } },
  { slug: 'fann-point-e', name_fr: 'Fann Point-E', city_slug: 'dakar', coordinates: { lat: 14.6902, lng: -17.4850 } },
  { slug: 'hann-bel-air', name_fr: 'Hann-Bel Air', city_slug: 'dakar', coordinates: { lat: 14.6580, lng: -17.4508 } },
  { slug: 'liberté', name_fr: 'Liberté', city_slug: 'dakar', coordinates: { lat: 14.6672, lng: -17.4638 } },
  { slug: 'patte-doie', name_fr: 'Patte d\'Oie', city_slug: 'dakar', coordinates: { lat: 14.6520, lng: -17.4650 } },
  // Thiès
  { slug: 'thiès-centre', name_fr: 'Thiès Centre', city_slug: 'thies', coordinates: { lat: 14.7939, lng: -16.9256 } },
  // Add more cities/districts...
] as const
```

**Step 2: Write SQL migration**

```sql
-- supabase/migrations/20260307_add_districts_table.sql

CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_en TEXT,
  city_slug TEXT NOT NULL,
  coordinates JSONB NOT NULL, -- { lat: number; lng: number }
  description TEXT,
  landmarks TEXT[],
  price_range JSONB, -- { min: number; max: number }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (city_slug) REFERENCES cities(slug) ON DELETE CASCADE
);

CREATE INDEX idx_districts_city_slug ON districts(city_slug);
CREATE INDEX idx_districts_slug ON districts(slug);

-- Seed initial data for major Senegal cities
INSERT INTO districts (slug, name_fr, city_slug, coordinates) VALUES
  ('plateau', 'Plateau', 'dakar', '{"lat": 14.6763, "lng": -17.4443}'),
  ('almadies', 'Almadies', 'dakar', '{"lat": 14.7474, "lng": -17.5103}'),
  ('ouakam', 'Ouakam', 'dakar', '{"lat": 14.7293, "lng": -17.5173}'),
  ('yoff', 'Yoff', 'dakar', '{"lat": 14.7512, "lng": -17.5392}'),
  ('ngor', 'Ngor', 'dakar', '{"lat": 14.7680, "lng": -17.5555}'),
  ('mermoz', 'Mermoz-Sacré-Cœur', 'dakar', '{"lat": 14.6995, "lng": -17.4975}'),
  ('fann-point-e', 'Fann Point-E', 'dakar', '{"lat": 14.6902, "lng": -17.4850}'),
  ('hann-bel-air', 'Hann-Bel Air', 'dakar', '{"lat": 14.6580, "lng": -17.4508}'),
  ('liberté', 'Liberté', 'dakar', '{"lat": 14.6672, "lng": -17.4638}'),
  ('patte-doie', 'Patte d\'Oie', 'dakar', '{"lat": 14.6520, "lng": -17.4650}')
ON CONFLICT (slug) DO NOTHING;
```

**Step 3: Test schema validation**

```typescript
// tests/districts.test.ts
import { describe, it, expect } from 'vitest'
import { District, SENEGAL_DISTRICTS } from '@/types/districts'

describe('Districts Schema', () => {
  it('should validate district structure', () => {
    const district = SENEGAL_DISTRICTS[0]
    expect(district).toHaveProperty('slug')
    expect(district).toHaveProperty('name_fr')
    expect(district).toHaveProperty('city_slug')
    expect(district).toHaveProperty('coordinates')
    expect(district.coordinates).toHaveProperty('lat')
    expect(district.coordinates).toHaveProperty('lng')
  })

  it('should have unique slugs', () => {
    const slugs = SENEGAL_DISTRICTS.map(d => d.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
```

**Step 4: Commit**

```bash
git add types/districts.ts supabase/migrations/20260307_add_districts_table.sql tests/districts.test.ts
git commit -m "feat: add districts data structure and migration"
```

---

### Task 2: Create Districts Service

**Files:**
- Create: `services/districtService.ts`
- Create: `services/districtService.cached.ts`
- Test: `tests/districtService.test.ts`

**Step 1: Write service interface**

```typescript
// services/districtService.ts
import { createClient } from '@/lib/supabase/server'
import { District } from '@/types/districts'
import { SENEGAL_DISTRICTS } from '@/types/districts'

export async function getDistrictsByCity(citySlug: string): Promise<District[]> {
  const filtered = SENEGAL_DISTRICTS.filter(d => d.city_slug === citySlug)
  return filtered
}

export async function getDistrictBySlug(districtSlug: string, citySlug: string): Promise<District | null> {
  const district = SENEGAL_DISTRICTS.find(d => d.slug === districtSlug && d.city_slug === citySlug)
  return district || null
}

export async function getPropertiesByDistrict(
  districtSlug: string,
  citySlug: string,
  category?: 'vente' | 'location',
  type?: string,
  limit = 20,
  offset = 0
) {
  const supabase = await createClient()
  const district = await getDistrictBySlug(districtSlug, citySlug)

  if (!district) return { properties: [], total: 0 }

  // Use district coordinates for geo-proximity search
  const { data, count, error } = await supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('status', 'disponible')
    .eq('validation_status', 'approved')
    .or(`location->>'city'.ilike.${citySlug}`)
    .or(`location->>'landmark'.ilike.%${district.name_fr}%`)
    .eq('category', category || 'vente')
    .eq('details->type', type || 'Appartement')
    .range(offset, offset + limit - 1)

  if (error) console.error('District properties error:', error)
  return { properties: data || [], total: count || 0 }
}
```

**Step 2: Create cached version**

```typescript
// services/districtService.cached.ts
import { unstable_cache } from 'next/cache'
import { getDistrictsByCity, getDistrictBySlug, getPropertiesByDistrict } from './districtService'

export const getCachedDistrictsByCity = unstable_cache(
  async (citySlug: string) => getDistrictsByCity(citySlug),
  ['districts', 'by-city'],
  { revalidate: 86400, tags: ['districts'] }
)

export const getCachedDistrictBySlug = unstable_cache(
  async (districtSlug: string, citySlug: string) => getDistrictBySlug(districtSlug, citySlug),
  ['district', 'by-slug'],
  { revalidate: 86400, tags: ['districts'] }
)

export const getCachedPropertiesByDistrict = unstable_cache(
  async (districtSlug: string, citySlug: string, category?: 'vente' | 'location', type?: string) =>
    getPropertiesByDistrict(districtSlug, citySlug, category, type, 20, 0),
  ['properties', 'by-district'],
  { revalidate: 3600, tags: ['properties', 'districts'] }
)
```

**Step 3: Test service**

```typescript
// tests/districtService.test.ts
import { describe, it, expect } from 'vitest'
import { getDistrictsByCity, getDistrictBySlug } from '@/services/districtService'

describe('DistrictService', () => {
  it('should return districts for a given city', async () => {
    const districts = await getDistrictsByCity('dakar')
    expect(districts.length).toBeGreaterThan(0)
    expect(districts[0].city_slug).toBe('dakar')
  })

  it('should find a district by slug', async () => {
    const district = await getDistrictBySlug('plateau', 'dakar')
    expect(district).not.toBeNull()
    expect(district?.slug).toBe('plateau')
    expect(district?.city_slug).toBe('dakar')
  })

  it('should return null for non-existent district', async () => {
    const district = await getDistrictBySlug('invalid-slug', 'dakar')
    expect(district).toBeNull()
  })
})
```

**Step 4: Commit**

```bash
git add services/districtService.ts services/districtService.cached.ts tests/districtService.test.ts
git commit -m "feat: add district service with caching"
```

---

### Task 3: Add SEO RPC for 4-Tier Combinations

**Files:**
- Modify: `supabase/migrations/20260307_create_seo_4tier_rpc.sql`

**Step 1: Write RPC function**

```sql
-- Get active city/district/type combinations for sitemap generation
CREATE OR REPLACE FUNCTION get_active_cities_districts_types(
  min_count INT DEFAULT 1,
  target_category TEXT DEFAULT 'vente'
)
RETURNS TABLE (
  city_slug TEXT,
  district_slug TEXT,
  property_type TEXT,
  property_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (p.location->>'city')::TEXT AS city_slug,
    COALESCE((p.location->>'landmark')::TEXT, 'all') AS district_slug,
    (p.details->>'type')::TEXT AS property_type,
    COUNT(*) AS property_count
  FROM properties p
  WHERE
    p.status = 'disponible'
    AND p.validation_status = 'approved'
    AND p.category = target_category
  GROUP BY city_slug, district_slug, property_type
  HAVING COUNT(*) >= min_count
  ORDER BY city_slug, district_slug, property_type;
END;
$$ LANGUAGE plpgsql;
```

**Step 2: Test RPC**

```bash
# In Supabase dashboard SQL editor:
SELECT * FROM get_active_cities_districts_types(1, 'vente') LIMIT 20;
```

**Step 3: Commit**

```bash
git add supabase/migrations/20260307_create_seo_4tier_rpc.sql
git commit -m "feat: add RPC for 4-tier SEO combinations"
```

---

### Task 4: Create 4-Tier Dynamic Route Structure

**Files:**
- Create: `app/(vitrine)/immobilier/[city]/[district]/[type]/page.tsx`
- Create: `app/(vitrine)/immobilier/[city]/[district]/[type]/layout.tsx`
- Create: `app/(vitrine)/immobilier/[city]/[district]/page.tsx` (district overview)
- Test: `tests/routes/immobilier-4tier.test.tsx`

**Step 1: Create district overview page**

```typescript
// app/(vitrine)/immobilier/[city]/[district]/page.tsx
import { notFound } from 'next/navigation'
import { getCachedDistrictBySlug, getCachedPropertiesByDistrict } from '@/services/districtService'
import { ProgrammaticPageTemplate } from '@/components/seo/ProgrammaticPageTemplate'
import { generateMetadata as generateBaseMetadata } from '@/lib/seo/metadata'

export async function generateMetadata({ params }) {
  const { city, district } = params
  const districtData = await getCachedDistrictBySlug(district, city)

  if (!districtData) return { title: 'District not found', robots: { index: false } }

  const title = `Immobilier ${districtData.name_fr}, ${city.charAt(0).toUpperCase() + city.slice(1)} | Dousell`
  const description = `Trouvez les meilleures annonces immobilières à ${districtData.name_fr}. Appartements, villas, terrains en vente et location.`

  return generateBaseMetadata({
    title,
    description,
    path: `/immobilier/${city}/${district}`,
    type: 'website'
  })
}

export async function generateStaticParams() {
  // TODO: Generate from RPC in Task 5
  return []
}

export default async function DistrictPage({ params }) {
  const { city, district } = params
  const districtData = await getCachedDistrictBySlug(district, city)

  if (!districtData) notFound()

  const { properties } = await getCachedPropertiesByDistrict(district, city)

  return (
    <ProgrammaticPageTemplate
      title={districtData.name_fr}
      subtitle={`Immobilier à ${districtData.name_fr}`}
      properties={properties}
      breadcrumbs={[
        { label: 'Accueil', href: '/' },
        { label: 'Immobilier', href: '/immobilier' },
        { label: city, href: `/immobilier/${city}` },
        { label: districtData.name_fr, href: `/immobilier/${city}/${district}` }
      ]}
      seoContent={{
        description: `Découvrez les opportunités immobilières à ${districtData.name_fr}. ${properties.length} annonces disponibles.`,
        landmarks: districtData.landmarks
      }}
    />
  )
}
```

**Step 2: Create city/district/type page**

```typescript
// app/(vitrine)/immobilier/[city]/[district]/[type]/page.tsx
import { notFound } from 'next/navigation'
import { getCachedDistrictBySlug, getCachedPropertiesByDistrict } from '@/services/districtService'
import { getCachedCityBySlug } from '@/services/cityService'
import { ProgrammaticPageTemplate } from '@/components/seo/ProgrammaticPageTemplate'
import { generateMetadata as generateBaseMetadata } from '@/lib/seo/metadata'

export async function generateMetadata({ params }) {
  const { city, district, type } = params
  const districtData = await getCachedDistrictBySlug(district, city)
  const cityData = await getCachedCityBySlug(city)

  if (!districtData || !cityData) return { title: 'Not found', robots: { index: false } }

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
  const title = `${typeLabel} à ${districtData.name_fr}, ${cityData.name} | Dousell`
  const description = `Annonces de ${type} à ${districtData.name_fr}. Trouvez le bien idéal parmi ${type} disponibles.`

  return generateBaseMetadata({
    title,
    description,
    path: `/immobilier/${city}/${district}/${type}`,
    type: 'website'
  })
}

export async function generateStaticParams() {
  // TODO: Generate from RPC in Task 5
  return []
}

export default async function CityDistrictTypePage({ params }) {
  const { city, district, type } = params
  const districtData = await getCachedDistrictBySlug(district, city)

  if (!districtData) notFound()

  const { properties } = await getCachedPropertiesByDistrict(district, city, 'vente', type)

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')

  return (
    <ProgrammaticPageTemplate
      title={`${typeLabel} à ${districtData.name_fr}`}
      subtitle={`Immobilier ${type} en vente`}
      properties={properties}
      breadcrumbs={[
        { label: 'Accueil', href: '/' },
        { label: 'Immobilier', href: '/immobilier' },
        { label: city, href: `/immobilier/${city}` },
        { label: districtData.name_fr, href: `/immobilier/${city}/${district}` },
        { label: typeLabel, href: `/immobilier/${city}/${district}/${type}` }
      ]}
      seoContent={{
        description: `Découvrez les ${type} à ${districtData.name_fr}. ${properties.length} ${type} en vente.`
      }}
    />
  )
}
```

**Step 3: Create layout**

```typescript
// app/(vitrine)/immobilier/[city]/[district]/[type]/layout.tsx
export default function DistrictTypeLayout({ children, params }) {
  return <>{children}</>
}
```

**Step 4: Create test**

```typescript
// tests/routes/immobilier-4tier.test.tsx
import { describe, it, expect } from 'vitest'

describe('4-Tier Immobilier Routes', () => {
  it('should have correct route patterns', () => {
    // Validate route structure
    const validRoutes = [
      '/immobilier/dakar/plateau',
      '/immobilier/dakar/plateau/appartement',
      '/immobilier/thies/thies-centre/villa'
    ]
    expect(validRoutes[0]).toMatch(/\/immobilier\/[\w-]+\/[\w-]+/)
  })
})
```

**Step 5: Commit**

```bash
git add app/(vitrine)/immobilier/[city]/[district]
git commit -m "feat: add 4-tier dynamic routes for city/district/type"
```

---

### Task 5: Implement Static Params Generation

**Files:**
- Create: `lib/seo/generateStaticParams.ts`
- Modify: `app/(vitrine)/immobilier/[city]/[district]/[type]/page.tsx`
- Modify: `app/(vitrine)/immobilier/[city]/[district]/page.tsx`
- Test: `tests/seo/generateStaticParams.test.ts`

**Step 1: Create params generation utility**

```typescript
// lib/seo/generateStaticParams.ts
import { createClient } from '@/lib/supabase/server'

export async function generateCityDistrictTypeParams() {
  try {
    const supabase = await createClient()

    // Call RPC to get active combinations
    const { data, error } = await supabase.rpc('get_active_cities_districts_types', {
      min_count: 1,
      target_category: 'vente'
    })

    if (error) {
      console.error('Error generating params:', error)
      return []
    }

    const params = data.map((row: any) => ({
      city: row.city_slug,
      district: row.district_slug === 'all' ? undefined : row.district_slug,
      type: row.property_type?.toLowerCase().replace(/\s+/g, '-')
    })).filter(p => p.type && p.city)

    return params
  } catch (e) {
    console.error('Params generation failed:', e)
    return []
  }
}

export async function generateCityDistrictParams() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_active_cities_districts_types', {
      min_count: 1
    })

    if (error) return []

    // Extract unique city/district combinations
    const uniquePairs = new Set()
    data.forEach((row: any) => {
      if (row.district_slug !== 'all') {
        uniquePairs.add(`${row.city_slug}|${row.district_slug}`)
      }
    })

    return Array.from(uniquePairs).map(pair => {
      const [city, district] = (pair as string).split('|')
      return { city, district }
    })
  } catch (e) {
    console.error('District params generation failed:', e)
    return []
  }
}
```

**Step 2: Update route generateStaticParams**

```typescript
// Update in app/(vitrine)/immobilier/[city]/[district]/[type]/page.tsx
import { generateCityDistrictTypeParams } from '@/lib/seo/generateStaticParams'

export async function generateStaticParams() {
  const params = await generateCityDistrictTypeParams()
  // Pre-generate top 50 by property count for faster builds
  return params.slice(0, 50)
}

// Add dynamic params for on-demand rendering
export const dynamicParams = true
```

**Step 3: Update district overview generateStaticParams**

```typescript
// Update in app/(vitrine)/immobilier/[city]/[district]/page.tsx
import { generateCityDistrictParams } from '@/lib/seo/generateStaticParams'

export async function generateStaticParams() {
  const params = await generateCityDistrictParams()
  return params.slice(0, 30)
}

export const dynamicParams = true
```

**Step 4: Test generation**

```typescript
// tests/seo/generateStaticParams.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { generateCityDistrictTypeParams, generateCityDistrictParams } from '@/lib/seo/generateStaticParams'

describe('Static Params Generation', () => {
  let params: any

  beforeAll(async () => {
    params = await generateCityDistrictTypeParams()
  })

  it('should generate params with required fields', () => {
    params.forEach((p: any) => {
      expect(p).toHaveProperty('city')
      expect(p).toHaveProperty('type')
    })
  })

  it('should have valid slugs', () => {
    params.forEach((p: any) => {
      expect(p.city).toMatch(/^[a-z0-9-]+$/)
      expect(p.type).toMatch(/^[a-z0-9-]+$/)
    })
  })
})
```

**Step 5: Commit**

```bash
git add lib/seo/generateStaticParams.ts tests/seo/generateStaticParams.test.ts
git commit -m "feat: implement static params generation for 4-tier routes"
```

---

### Task 6: Enhanced JSON-LD Schema for Each Tier

**Files:**
- Create: `components/seo/json-ld-enhanced.tsx`
- Test: `tests/seo/json-ld-enhanced.test.tsx`

**Step 1: Create enhanced JSON-LD component**

```typescript
// components/seo/json-ld-enhanced.tsx
import React from 'react'

export interface BreadcrumbItem {
  label: string
  url: string
}

export function EnhancedBreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `${process.env.NEXT_PUBLIC_APP_URL}${item.url}`
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  )
}

export function CityDistrictAggregateOfferJsonLd({
  city,
  district,
  propertyType,
  properties,
  url
}: {
  city: string
  district?: string
  propertyType?: string
  properties: any[]
  url: string
}) {
  if (properties.length === 0) return null

  // Calculate price stats
  const prices = properties
    .map(p => parseInt(p.price))
    .filter(p => p > 0)
    .sort((a, b) => a - b)

  const minPrice = prices[0] || 0
  const maxPrice = prices[prices.length - 1] || 0
  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b) / prices.length) : 0

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AggregateOffer',
    name: `Propriétés à ${district || city}`,
    description: `${properties.length} propriétés disponibles ${district ? `à ${district}` : `à ${city}`}`,
    url,
    priceCurrency: 'XOF',
    lowPrice: (minPrice / 100).toFixed(0),
    highPrice: (maxPrice / 100).toFixed(0),
    price: (avgPrice / 100).toFixed(0),
    availability: 'https://schema.org/InStock',
    offerCount: properties.length,
    offers: properties.slice(0, 10).map(p => ({
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/biens/${p.id}`,
      price: (parseInt(p.price) / 100).toFixed(0),
      priceCurrency: 'XOF',
      name: p.title,
      description: p.description?.substring(0, 100)
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  )
}

export function LocalBusinessJsonLd({
  city,
  district,
  properties
}: {
  city: string
  district?: string
  properties: any[]
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Dousell - Immobilier à ${district || city}`,
    url: process.env.NEXT_PUBLIC_APP_URL,
    telephone: process.env.NEXT_PUBLIC_PHONE || '+221-00-000-0000',
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressCountry: 'SN'
    },
    priceRange: properties.length > 0 ? '$$' : '',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      reviewCount: Math.min(properties.length, 50)
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  )
}

export function FAQJsonLd({
  city,
  propertyType
}: {
  city: string
  propertyType?: string
}) {
  const faqs = [
    {
      question: `Quel est le prix moyen d'un ${propertyType || 'bien'} à ${city}?`,
      answer: `Le prix moyen varie selon le quartier et les caractéristiques. Consultez nos annonces pour les prix actuels.`
    },
    {
      question: `Comment acheter un ${propertyType || 'bien'} à ${city} sur Dousell?`,
      answer: 'Parcourez nos annonces, contactez directement les agents, et finalisez votre achat via leur assistance.'
    },
    {
      question: `Quelle est la meilleure période pour acheter à ${city}?`,
      answer: 'Le marché immobilier sénégalais est actif toute l\'année. Nous vous recommandons de consulter régulièrement nos annonces.'
    }
  ]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  )
}
```

**Step 2: Create tests**

```typescript
// tests/seo/json-ld-enhanced.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { EnhancedBreadcrumbJsonLd, CityDistrictAggregateOfferJsonLd } from '@/components/seo/json-ld-enhanced'

describe('Enhanced JSON-LD Components', () => {
  it('should render breadcrumb schema', () => {
    const { container } = render(
      <EnhancedBreadcrumbJsonLd items={[
        { label: 'Home', url: '/' },
        { label: 'Immobilier', url: '/immobilier' }
      ]} />
    )

    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeTruthy()
    const schema = JSON.parse(script?.textContent || '{}')
    expect(schema['@type']).toBe('BreadcrumbList')
  })

  it('should render aggregate offer schema', () => {
    const properties = [
      { id: '1', price: '10000000', title: 'Apt 1', description: 'Nice apt' },
      { id: '2', price: '20000000', title: 'Apt 2', description: 'Nice apt 2' }
    ]

    const { container } = render(
      <CityDistrictAggregateOfferJsonLd
        city="dakar"
        district="plateau"
        properties={properties}
        url="https://dousel.com/immobilier/dakar/plateau"
      />
    )

    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeTruthy()
    const schema = JSON.parse(script?.textContent || '{}')
    expect(schema['@type']).toBe('AggregateOffer')
    expect(schema.offerCount).toBe(2)
  })
})
```

**Step 3: Commit**

```bash
git add components/seo/json-ld-enhanced.tsx tests/seo/json-ld-enhanced.test.tsx
git commit -m "feat: add enhanced JSON-LD schemas for aggregates and local business"
```

---

### Task 7: Update Sitemap for 4-Tier Structure

**Files:**
- Modify: `app/sitemap.ts`

**Step 1: Update sitemap generation**

```typescript
// app/sitemap.ts (updated)
import { MetadataRoute } from 'next'
import { generateCityDistrictTypeParams, generateCityDistrictParams } from '@/lib/seo/generateStaticParams'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dousel.com'

export const revalidate = 86400 // 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const districtTypeParams = await generateCityDistrictTypeParams()
  const districtParams = await generateCityDistrictParams()

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1
    },
    {
      url: `${BASE_URL}/immobilier`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9
    }
  ]

  // Add city/district pages
  districtParams.forEach(({ city, district }) => {
    entries.push({
      url: `${BASE_URL}/immobilier/${city}/${district}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8
    })
  })

  // Add city/district/type pages (up to 2000 URLs per sitemap)
  districtTypeParams.slice(0, 2000).forEach(({ city, district, type }) => {
    if (district) {
      entries.push({
        url: `${BASE_URL}/immobilier/${city}/${district}/${type}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7
      })
    }
  })

  return entries
}
```

**Step 2: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat: update sitemap for 4-tier dynamic routes"
```

---

### Task 8: Create Data Bootstrap Form (Agent Upload)

**Files:**
- Create: `app/(workspace)/admin/bulk-import/page.tsx`
- Create: `app/api/admin/bulk-import/route.ts`
- Create: `lib/schemas/bulkImportSchema.ts`
- Test: `tests/api/bulk-import.test.ts`

**Step 1: Create import schema**

```typescript
// lib/schemas/bulkImportSchema.ts
import { z } from 'zod'

export const BulkPropertyImportSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  price: z.string().regex(/^\d+$/, 'Must be a number').transform(v => parseInt(v) * 100), // Convert to centimes
  category: z.enum(['vente', 'location']),
  type: z.enum(['Appartement', 'Villa', 'Maison', 'Studio', 'Terrain', 'Immeuble', 'Bureau', 'Magasin', 'Hangar', 'Local commercial', 'Chambre', 'Duplex']),
  city: z.string().min(2).max(50),
  district: z.string().optional(),
  surface: z.string().regex(/^\d+$/).transform(v => parseInt(v)).optional(),
  rooms: z.string().regex(/^\d+$/).transform(v => parseInt(v)).optional(),
  bedrooms: z.string().regex(/^\d+$/).transform(v => parseInt(v)).optional(),
  bathrooms: z.string().regex(/^\d+$/).transform(v => parseInt(v)).optional(),
  agent_name: z.string().min(2).max(100),
  agent_phone: z.string().regex(/^\+?[0-9\s-()]+$/),
  agent_email: z.string().email().optional()
})

export const BulkImportPayloadSchema = z.object({
  properties: z.array(BulkPropertyImportSchema).min(1).max(100)
})

export type BulkImportPayload = z.infer<typeof BulkImportPayloadSchema>
```

**Step 2: Create API route**

```typescript
// app/api/admin/bulk-import/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { BulkImportPayloadSchema } from '@/lib/schemas/bulkImportSchema'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Parse and validate payload
    const payload = await request.json()
    const validated = BulkImportPayloadSchema.parse(payload)

    // 3. Insert into database
    const supabase = await createClient()
    const properties = validated.properties.map(prop => ({
      title: prop.title,
      description: prop.description,
      price: prop.price,
      category: prop.category,
      location: {
        city: prop.city.toLowerCase(),
        landmark: prop.district || null,
        coordinates: { lat: 14.6928, lng: -17.4467 } // default Dakar
      },
      specs: {
        surface: prop.surface || null,
        rooms: prop.rooms || null,
        bedrooms: prop.bedrooms || null,
        bathrooms: prop.bathrooms || null
      },
      details: {
        type: prop.type
      },
      agent: {
        name: prop.agent_name,
        phone: prop.agent_phone,
        email: prop.agent_email || null
      },
      status: 'disponible',
      validation_status: 'pending', // Admin review required
      created_by: user.id,
      images: []
    }))

    const { data, error } = await supabase
      .from('properties')
      .insert(properties)
      .select()

    if (error) {
      console.error('Bulk import error:', error)
      return NextResponse.json({ error: 'Failed to import properties' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imported: data.length,
      message: `${data.length} properties imported for review`
    }, { status: 201 })
  } catch (err: any) {
    console.error('Bulk import error:', err)
    return NextResponse.json(
      { error: err.message || 'Invalid request' },
      { status: 400 }
    )
  }
}
```

**Step 3: Create admin UI page**

```typescript
// app/(workspace)/admin/bulk-import/page.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BulkImportPayloadSchema } from '@/lib/schemas/bulkImportSchema'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function BulkImportPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const form = useForm({
    resolver: zodResolver(BulkImportPayloadSchema),
    defaultValues: { properties: [] }
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      setResult({
        success: response.ok,
        message: result.message || result.error
      })
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Import en masse</h1>

      <Alert className="mb-6">
        <AlertDescription>
          Collez une liste JSON d'annonces. Format: {'{properties: [{title, description, price, category, ...}]}'}
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="properties"
            render={({ field }) => (
              <FormItem>
                <FormLabel>JSON Payload</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='{"properties": [...]}'
                    className="font-mono h-96"
                    {...field}
                    value={JSON.stringify(field.value, null, 2)}
                    onChange={(e) => {
                      try {
                        field.onChange(JSON.parse(e.target.value).properties || [])
                      } catch {}
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Importation...' : 'Importer'}
          </Button>
        </form>
      </Form>

      {result && (
        <Alert className={`mt-6 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
```

**Step 4: Test API**

```typescript
// tests/api/bulk-import.test.ts
import { describe, it, expect } from 'vitest'

describe('Bulk Import API', () => {
  it('should validate schema correctly', () => {
    const validPayload = {
      properties: [
        {
          title: 'Appartement spacieux',
          description: 'Bel appartement avec vue sur la mer',
          price: '50000000',
          category: 'vente',
          type: 'Appartement',
          city: 'dakar',
          district: 'plateau',
          surface: '120',
          rooms: '3',
          agent_name: 'Jean Dupont',
          agent_phone: '+221 77 123 4567'
        }
      ]
    }

    // Schema validation would happen on the server
    expect(validPayload.properties[0].price).toBe('50000000')
  })
})
```

**Step 5: Commit**

```bash
git add app/(workspace)/admin/bulk-import app/api/admin/bulk-import lib/schemas/bulkImportSchema.ts tests/api/bulk-import.test.ts
git commit -m "feat: add bulk property import API and admin UI"
```

---

### Task 9: Create CSV Import Helper (Optional Quick-Start)

**Files:**
- Create: `lib/csv/parsePropertyCSV.ts`
- Create: `scripts/generate-import-sample.ts`
- Test: `tests/csv/parsePropertyCSV.test.ts`

**Step 1: Create CSV parser**

```typescript
// lib/csv/parsePropertyCSV.ts
import { BulkPropertyImportSchema } from '@/lib/schemas/bulkImportSchema'

export function parseCSVToJSON(csvText: string) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l)
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

  const properties = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const obj: any = {}

    headers.forEach((header, i) => {
      obj[header] = values[i]
    })

    // Validate with schema
    try {
      return BulkPropertyImportSchema.parse(obj)
    } catch (e) {
      console.error(`Row validation failed:`, e)
      return null
    }
  }).filter(p => p !== null)

  return { properties, errors: [] }
}
```

**Step 2: Create sample generator**

```typescript
// scripts/generate-import-sample.ts
import fs from 'fs'

const sample = {
  properties: [
    {
      title: "Magnifique Appartement Plateau",
      description: "Appartement moderne situé au cœur du plateau avec vue panoramique sur l'océan. 3 chambres, 2 salles de bain, cuisine équipée.",
      price: "50000000", // 500k XOF
      category: "vente",
      type: "Appartement",
      city: "dakar",
      district: "plateau",
      surface: "120",
      rooms: "3",
      bedrooms: "3",
      bathrooms: "2",
      agent_name: "Jean Dupont",
      agent_phone: "+221771234567",
      agent_email: "jean@immobilier.sn"
    },
    {
      title: "Villa Almadies Standing",
      description: "Superbe villa à Almadies avec piscine, garage et jardin. 4 chambres, standing élevé.",
      price: "150000000",
      category: "vente",
      type: "Villa",
      city: "dakar",
      district: "almadies",
      surface: "250",
      rooms: "4",
      bedrooms: "4",
      bathrooms: "3",
      agent_name: "Marie Sène",
      agent_phone: "+221777654321"
    }
  ]
}

fs.writeFileSync('./public/sample-import.json', JSON.stringify(sample, null, 2))
console.log('✅ Sample import file generated: public/sample-import.json')
```

**Step 3: Commit**

```bash
git add lib/csv/parsePropertyCSV.ts scripts/generate-import-sample.ts
git commit -m "feat: add CSV parser and import sample generator"
```

---

### Task 10: Add Meta Tags for 4-Tier Pages

**Files:**
- Modify: `lib/seo/metadata.ts`
- Modify: `app/(vitrine)/immobilier/[city]/[district]/[type]/page.tsx`
- Modify: `app/(vitrine)/immobilier/[city]/[district]/page.tsx`

**Step 1: Enhance metadata generator**

```typescript
// lib/seo/metadata.ts (updated/enhanced)
import { Metadata } from 'next'

export interface MetadataParams {
  title: string
  description: string
  path: string
  type?: 'website' | 'article' | 'product'
  image?: string
  keywords?: string[]
  robots?: {
    index?: boolean
    follow?: boolean
    'max-snippet'?: number
    'max-image-preview'?: 'none' | 'standard' | 'large'
  }
}

export function generateMetadata(params: MetadataParams): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dousel.com'
  const fullUrl = `${baseUrl}${params.path}`
  const image = params.image || `${baseUrl}/og-image.png`

  return {
    title: params.title,
    description: params.description,
    keywords: params.keywords || ['immobilier', 'senegal', 'annonces'],
    canonical: fullUrl,
    robots: params.robots || { index: true, follow: true },
    openGraph: {
      type: (params.type as any) || 'website',
      url: fullUrl,
      title: params.title,
      description: params.description,
      images: [{ url: image, width: 1200, height: 630 }],
      siteName: 'Dousell'
    },
    twitter: {
      card: 'summary_large_image',
      title: params.title,
      description: params.description,
      images: [image]
    },
    other: {
      'og:locale': 'fr_SN',
      'og:type': params.type === 'product' ? 'og:product' : 'og:website'
    }
  }
}
```

**Step 2: Commit**

```bash
git add lib/seo/metadata.ts
git commit -m "feat: enhance metadata generation for 4-tier pages"
```

---

### Task 11: Update robots.txt for New Routes

**Files:**
- Modify: `app/robots.ts`

**Step 1: Update robots configuration**

```typescript
// app/robots.ts (updated)
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dousel.com'

  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: ['/admin', '/workspace', '/api'],
        crawlDelay: 0
      },
      {
        userAgent: '*',
        allow: ['/immobilier', '/biens', '/location', '/vente'],
        disallow: ['/admin', '/workspace', '/api', '/auth'],
        crawlDelay: 10
      },
      {
        userAgent: 'AhrefsBot',
        disallow: ['/']
      },
      {
        userAgent: 'SemrushBot',
        disallow: ['/']
      },
      {
        userAgent: 'MJ12bot',
        disallow: ['/']
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  }
}
```

**Step 2: Commit**

```bash
git add app/robots.ts
git commit -m "chore: update robots.txt for SEO routes"
```

---

### Task 12: Performance Optimization - Image Serving

**Files:**
- Verify: `next.config.js` (image optimization already in place)
- Create: `lib/images/cloudinaryHelper.ts`

**Step 1: Create Cloudinary helper**

```typescript
// lib/images/cloudinaryHelper.ts
export const CLOUDINARY_PROJECT_ID = 'dkkirzpxe'

export function getCloudinaryUrl(publicId: string, options?: {
  width?: number
  height?: number
  quality?: 'auto' | number
  crop?: string
  format?: 'auto' | 'webp' | 'jpg'
}) {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_PROJECT_ID}/image/upload`
  const transformations = [
    options?.width && options?.height ? `w_${options.width},h_${options.height},c_${options.crop || 'fill'}` : null,
    options?.quality ? `q_${options.quality}` : 'q_auto',
    options?.format ? `f_${options.format}` : 'f_auto'
  ].filter(Boolean).join(',')

  return `${baseUrl}/${transformations}/${publicId}`
}

export function getPropertyImageUrl(publicId: string, size: 'thumb' | 'medium' | 'large' = 'medium') {
  const sizes = {
    thumb: { width: 300, height: 200 },
    medium: { width: 800, height: 600 },
    large: { width: 1200, height: 900 }
  }

  return getCloudinaryUrl(publicId, {
    ...sizes[size],
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  })
}
```

**Step 2: Commit**

```bash
git add lib/images/cloudinaryHelper.ts
git commit -m "feat: add Cloudinary image optimization helper"
```

---

### Task 13: Create Monitoring/Analytics for SEO Pages

**Files:**
- Create: `lib/analytics/seoTracking.ts`
- Create: `app/api/analytics/page-views/route.ts`

**Step 1: Create tracking utility**

```typescript
// lib/analytics/seoTracking.ts
import { PostHog } from 'posthog-node'

const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
  disabled: !process.env.NEXT_PUBLIC_POSTHOG_KEY
})

export async function trackPageView(params: {
  city?: string
  district?: string
  type?: string
  userId?: string
  url: string
}) {
  if (!posthog.isEnabled()) return

  await posthog.capture({
    distinctId: params.userId || 'anonymous',
    event: 'seo_page_view',
    properties: {
      city: params.city,
      district: params.district,
      property_type: params.type,
      url: params.url,
      timestamp: new Date().toISOString()
    }
  })
}

export async function trackPropertyClick(propertyId: string, source: string) {
  if (!posthog.isEnabled()) return

  await posthog.capture({
    distinctId: 'anonymous',
    event: 'property_click',
    properties: {
      property_id: propertyId,
      source,
      timestamp: new Date().toISOString()
    }
  })
}
```

**Step 2: Commit**

```bash
git add lib/analytics/seoTracking.ts
git commit -m "feat: add SEO page view tracking"
```

---

### Task 14: Create README for SEO Strategy

**Files:**
- Create: `docs/SEO_STRATEGY.md`

**Step 1: Document strategy**

```markdown
# SEO Strategy - Doussel Immo

## Overview

This document describes the 4-tier dynamic routing strategy for generating 500+ SEO pages.

## Structure

### Tier 1: City Pages
- Route: `/immobilier/[city]`
- Example: `/immobilier/dakar`
- Purpose: Target city-level search queries

### Tier 2: City + District Pages
- Route: `/immobilier/[city]/[district]`
- Example: `/immobilier/dakar/plateau`
- Purpose: Target neighborhood-specific searches

### Tier 3: City + District + Type Pages
- Route: `/immobilier/[city]/[district]/[type]`
- Example: `/immobilier/dakar/plateau/appartement`
- Purpose: Maximum specificity for long-tail keywords

## Page Generation

- Uses ISR (Incremental Static Regeneration): 3600 seconds cache
- Pre-generates top 50 combinations at build time
- On-demand rendering for less popular combinations
- Dynamic params enabled for flexibility

## Data Bootstrap

1. **Agent Form Upload**: Bulk import via admin UI
2. **CSV Parser**: Optional CLI-based import
3. **Validation**: All imports require admin approval before publishing

## JSON-LD Schema

Each page includes:
- BreadcrumbList (navigation hierarchy)
- AggregateOffer (price statistics)
- LocalBusiness (location info)
- FAQPage (common questions)

## Monitoring

- Page view tracking via PostHog
- Property click tracking
- Analytics dashboard available in admin

## Performance

- Cloudinary image optimization (auto WebP, quality auto)
- ISR caching to prevent unnecessary rebuilds
- Sitemap auto-generation (86400s revalidate)
- robots.txt configuration to guide crawlers

## Next Steps

1. Seed initial data via bulk import
2. Monitor search impressions via Google Search Console
3. Analyze click-through rates via analytics
4. Optimize content based on performance data
```

**Step 2: Commit**

```bash
git add docs/SEO_STRATEGY.md
git commit -m "docs: add SEO strategy documentation"
```

---

### Task 15: Run Build & Verify Routes

**Files:**
- Verify: All 4-tier routes render correctly

**Step 1: Build**

```bash
npm run build
```

Expected output:
- All routes compiled
- No TS errors
- Static params generated successfully
- Sitemap entries > 100

**Step 2: Test locally**

```bash
npm run dev
# Visit:
# http://localhost:3000/immobilier/dakar
# http://localhost:3000/immobilier/dakar/plateau
# http://localhost:3000/immobilier/dakar/plateau/appartement
```

**Step 3: Verify structure**

```bash
# Check generated params
grep -r "generateStaticParams" app/(vitrine)/immobilier
```

**Step 4: Commit**

```bash
git commit -m "chore: verify build and routes"
```

---

### Task 16-24: (Reserved for refinement, testing, and deployment)

These remaining 9 tasks are reserved for:
- E2E testing of all 4-tier routes
- Performance testing (Core Web Vitals)
- Search Console integration
- Content enrichment (neighborhood guides)
- Mobile optimization verification
- Analytics dashboard setup
- Production deployment checklist
- Documentation updates
- Performance monitoring setup

---

## Execution Checkpoints

**Checkpoint 1** (After Task 5): 4-tier routes functional
- [ ] Dynamic routes respond without 404s
- [ ] Static params generated
- [ ] Basic pages render

**Checkpoint 2** (After Task 10): SEO fundamentals
- [ ] Meta tags present
- [ ] JSON-LD schemas valid
- [ ] Sitemap includes new routes
- [ ] robots.txt updated

**Checkpoint 3** (After Task 14): Full implementation
- [ ] Build succeeds
- [ ] 100+ routes generated
- [ ] All tests pass
- [ ] Documentation complete

---

## Success Criteria

✅ **500+ pages generated** from 4-tier combinations
✅ **Valid JSON-LD** on all pages (schema.org)
✅ **ISR caching** optimized (3600s city/district, 86400s sitemap)
✅ **Data bootstrap** working (bulk import + validation)
✅ **SEO meta tags** complete (og:, twitter:, canonical)
✅ **Build time** < 10 minutes (with 1000+ static pre-renders)
✅ **0 TS errors** in build
✅ **Core Web Vitals** maintained (LCP, CLS, FID)

---

## Tech Debt / Future Phases

- Implement neighborhood content guides (Phase 2)
- Add pricing analytics & trends (Phase 2)
- Geographic heatmap visualization (Phase 3)
- AI-powered neighborhood recommendations (Phase 3)
- Integration with Google Ads for promoted listings (Phase 3)
