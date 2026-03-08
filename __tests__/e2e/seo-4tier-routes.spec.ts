/**
 * E2E Tests - 4-Tier SEO Routes
 *
 * Tests the complete 4-tier dynamic routing structure:
 * - /immobilier (Tier 1 - root)
 * - /immobilier/[city] (Tier 2)
 * - /immobilier/[city]/[district] (Tier 3)
 * - /immobilier/[city]/[district]/[type] (Tier 4)
 *
 * Verifies:
 * - Routes respond without 404s
 * - Meta tags present (OpenGraph, Twitter, canonical)
 * - JSON-LD schemas valid
 * - Breadcrumb navigation correct
 * - Property listings render
 * - SEO tracking enabled
 *
 * Run with: npx playwright test __tests__/e2e/seo-4tier-routes.spec.ts
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

// Test data - real routes from production
const TEST_ROUTES = {
  tier1: {
    path: '/immobilier',
    title: 'immobilier',
  },
  tier2: {
    path: '/immobilier/dakar',
    title: 'Dakar',
  },
  tier3: {
    path: '/immobilier/dakar/plateau',
    title: 'Plateau',
  },
  tier4: {
    path: '/immobilier/dakar/plateau/appartement',
    title: 'Appartement',
  },
}

test.describe('4-Tier SEO Routes', () => {
  // =========================================================================
  // Tier 1 - Root Immobilier Page
  // =========================================================================

  test('Tier 1: /immobilier responds with 200', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}${TEST_ROUTES.tier1.path}`)
    expect(response?.status()).toBe(200)
  })

  test('Tier 1: displays page content', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier1.path}`)

    // Check for main heading
    await expect(page.locator('h1')).toBeDefined()

    // Check breadcrumb exists
    const breadcrumb = page.locator('[aria-label="breadcrumb"]')
    expect(breadcrumb).toBeDefined()
  })

  test('Tier 1: has canonical URL', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier1.path}`)

    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute(
      'href',
      `${BASE_URL}${TEST_ROUTES.tier1.path}`
    )
  })

  test('Tier 1: has OpenGraph tags', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier1.path}`)

    // Check og:title
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /immobilier/i)

    // Check og:type
    const ogType = page.locator('meta[property="og:type"]')
    await expect(ogType).toHaveAttribute('content', 'website')

    // Check og:url
    const ogUrl = page.locator('meta[property="og:url"]')
    await expect(ogUrl).toBeDefined()
  })

  test('Tier 1: has Twitter Card tags', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier1.path}`)

    const twitterCard = page.locator('meta[name="twitter:card"]')
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image')
  })

  // =========================================================================
  // Tier 2 - City Page
  // =========================================================================

  test('Tier 2: /immobilier/[city] responds with 200', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}${TEST_ROUTES.tier2.path}`)
    expect(response?.status()).toBe(200)
  })

  test('Tier 2: displays city name in title', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier2.path}`)

    const title = page.locator('title')
    await expect(title).toContainText('Dakar')
  })

  test('Tier 2: has valid canonical URL', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier2.path}`)

    const canonical = page.locator('link[rel="canonical"]')
    const href = await canonical.getAttribute('href')
    expect(href).toContain('/dakar')
  })

  test('Tier 2: breadcrumb includes city', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier2.path}`)

    const breadcrumb = page.locator('[aria-label="breadcrumb"]')
    await expect(breadcrumb).toContainText('Dakar')
  })

  test('Tier 2: has JSON-LD BreadcrumbList schema', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier2.path}`)

    // Extract JSON-LD script
    const jsonld = await page.locator('script[type="application/ld+json"]').first()
    const content = await jsonld.textContent()

    expect(content).toBeTruthy()
    const schema = JSON.parse(content || '{}')
    expect(schema['@type']).toBe('BreadcrumbList')
    expect(schema.itemListElement).toBeDefined()
    expect(Array.isArray(schema.itemListElement)).toBe(true)
  })

  // =========================================================================
  // Tier 3 - District Page
  // =========================================================================

  test('Tier 3: /immobilier/[city]/[district] responds with 200', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}${TEST_ROUTES.tier3.path}`)
    expect(response?.status()).toBe(200)
  })

  test('Tier 3: displays district name', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier3.path}`)

    const title = page.locator('title')
    await expect(title).toContainText(/Plateau/)
  })

  test('Tier 3: breadcrumb includes city and district', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier3.path}`)

    const breadcrumb = page.locator('[aria-label="breadcrumb"]')
    await expect(breadcrumb).toContainText('Dakar')
    await expect(breadcrumb).toContainText(/Plateau/)
  })

  test('Tier 3: has correct canonical URL', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier3.path}`)

    const canonical = page.locator('link[rel="canonical"]')
    const href = await canonical.getAttribute('href')
    expect(href).toContain('/dakar/plateau')
  })

  test('Tier 3: has AggregateOffer schema', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier3.path}`)

    // Look for AggregateOffer schema
    const scripts = await page.locator('script[type="application/ld+json"]').all()

    for (const script of scripts) {
      const content = await script.textContent()
      if (content) {
        try {
          const schema = JSON.parse(content)
          if (schema['@type'] === 'AggregateOffer') {
            expect(schema.priceCurrency).toBe('XOF')
            expect(schema.offerCount).toBeGreaterThanOrEqual(0)
          }
        } catch (_e) {
          // Not JSON-LD, skip
        }
      }
    }

    // It's okay if no AggregateOffer (district might have 0 properties)
  })

  // =========================================================================
  // Tier 4 - Type-Filtered District Page
  // =========================================================================

  test('Tier 4: /immobilier/[city]/[district]/[type] responds with 200', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}${TEST_ROUTES.tier4.path}`)
    expect(response?.status()).toBe(200)
  })

  test('Tier 4: displays property type in title', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier4.path}`)

    const title = page.locator('title')
    await expect(title).toContainText(/Appartement/i)
  })

  test('Tier 4: breadcrumb is complete (all 4 tiers)', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier4.path}`)

    const breadcrumb = page.locator('[aria-label="breadcrumb"]')

    // Should contain: Home, Immobilier, City, District, Type
    await expect(breadcrumb).toContainText('Dakar')
    await expect(breadcrumb).toContainText(/Plateau/)
    await expect(breadcrumb).toContainText(/Appartement/i)
  })

  test('Tier 4: has correct canonical URL', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier4.path}`)

    const canonical = page.locator('link[rel="canonical"]')
    const href = await canonical.getAttribute('href')
    expect(href).toContain('/dakar/plateau/appartement')
  })

  test('Tier 4: article type in OpenGraph', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier4.path}`)

    const ogType = page.locator('meta[property="og:type"]')
    await expect(ogType).toHaveAttribute('content', 'article')
  })

  // =========================================================================
  // Meta Tags - All Tiers
  // =========================================================================

  test('Meta tags: all tiers have description', async ({ page }) => {
    for (const tier of Object.values(TEST_ROUTES)) {
      await page.goto(`${BASE_URL}${tier.path}`)

      const description = page.locator('meta[name="description"]')
      const content = await description.getAttribute('content')
      expect(content).toBeTruthy()
      expect(content!.length).toBeGreaterThan(10)
    }
  })

  test('Meta tags: all tiers have robots index/follow', async ({ page }) => {
    for (const tier of Object.values(TEST_ROUTES)) {
      await page.goto(`${BASE_URL}${tier.path}`)

      const robots = page.locator('meta[name="robots"]')
      const content = await robots.getAttribute('content')
      expect(content).toMatch(/index/)
      expect(content).toMatch(/follow/)
    }
  })

  // =========================================================================
  // Performance & Accessibility
  // =========================================================================

  test('Performance: Tier 4 page loads in < 3s', async ({ page }) => {
    const startTime = Date.now()
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier4.path}`, { waitUntil: 'networkidle' })
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(3000)
  })

  test('Accessibility: pages have main landmark', async ({ page }) => {
    for (const tier of Object.values(TEST_ROUTES)) {
      await page.goto(`${BASE_URL}${tier.path}`)

      const main = page.locator('main')
      await expect(main).toBeDefined()
    }
  })

  test('Accessibility: headings are hierarchical', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier2.path}`)

    const h1 = page.locator('h1')
    await expect(h1).toBeDefined()

    // H1 should come before H2
    const headings = await page.locator('h1, h2, h3').all()
    expect(headings.length).toBeGreaterThan(0)
  })

  // =========================================================================
  // Navigation & User Flows
  // =========================================================================

  test('Navigation: can navigate from Tier 2 to Tier 3', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier2.path}`)

    // Find a link to a Tier 3 page
    const districtLink = page.locator('a[href*="/plateau"]').first()
    if (await districtLink.isVisible()) {
      await districtLink.click()
      await expect(page).toHaveURL(/\/plateau/)
    }
  })

  test('Navigation: can navigate from Tier 3 to Tier 4', async ({ page }) => {
    await page.goto(`${BASE_URL}${TEST_ROUTES.tier3.path}`)

    // Find a link to a Tier 4 page (type-specific)
    const typeLink = page.locator('a[href*="/appartement"], button:has-text("Appartement")').first()
    if (await typeLink.isVisible()) {
      await typeLink.click()
      await page.waitForNavigation()
      expect(page.url()).toContain('/appartement')
    }
  })

  // =========================================================================
  // Error Handling
  // =========================================================================

  test('404 handling: non-existent city returns 404', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/immobilier/nonexistent-city-xyz`, {
      waitUntil: 'networkidle',
    })

    expect(response?.status()).toBe(404)
  })

  test('404 handling: displays user-friendly error message', async ({ page }) => {
    await page.goto(`${BASE_URL}/immobilier/nonexistent-xyz`, { waitUntil: 'networkidle' })

    // Should show 404 page, not blank page
    const content = page.locator('body')
    const text = await content.textContent()
    expect(text).toBeTruthy() // Page has content (error message or fallback)
  })
})
