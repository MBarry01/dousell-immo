/**
 * SEO Page Analytics Tracking
 *
 * Provides PostHog integration for tracking page views and property interactions
 * across the 4-tier immobilier routes (city/district/type combinations).
 *
 * Usage in server components:
 *   await trackPageView({ city: 'dakar', district: 'plateau', type: 'appartement', url: pathname })
 *
 * Usage in client components:
 *   trackPropertyClick(propertyId, 'immobilier_dakar_plateau')
 */

import { PostHog } from 'posthog-node'

const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
  {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
    disabled: !process.env.NEXT_PUBLIC_POSTHOG_KEY,
  }
)

/**
 * Track a page view on a 4-tier SEO page.
 *
 * @param params - Page view parameters
 * @param params.city - City slug (e.g., 'dakar')
 * @param params.district - District slug (e.g., 'plateau')
 * @param params.type - Property type slug (e.g., 'appartement')
 * @param params.userId - Optional user ID (defaults to 'anonymous')
 * @param params.url - Full URL path being viewed
 */
export async function trackPageView(params: {
  city?: string
  district?: string
  type?: string
  userId?: string
  url: string
}): Promise<void> {
  if (!posthog.isEnabled()) return

  try {
    await posthog.capture({
      distinctId: params.userId || 'anonymous',
      event: 'seo_page_view',
      properties: {
        city: params.city || null,
        district: params.district || null,
        property_type: params.type || null,
        url: params.url,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[Analytics] Failed to track page view:', error)
    // Non-blocking error - analytics should not impact user experience
  }
}

/**
 * Track a property click/interaction from a SEO page.
 *
 * @param propertyId - The property UUID
 * @param source - Source identifier (e.g., 'immobilier_dakar_plateau')
 * @param userId - Optional user ID (defaults to 'anonymous')
 */
export async function trackPropertyClick(
  propertyId: string,
  source: string,
  userId?: string
): Promise<void> {
  if (!posthog.isEnabled()) return

  try {
    await posthog.capture({
      distinctId: userId || 'anonymous',
      event: 'property_click',
      properties: {
        property_id: propertyId,
        source,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[Analytics] Failed to track property click:', error)
    // Non-blocking error - analytics should not impact user experience
  }
}

/**
 * Flush pending analytics events.
 *
 * Should be called before application shutdown to ensure all events are delivered.
 */
export async function flushAnalytics(): Promise<void> {
  if (!posthog.isEnabled()) return

  try {
    await posthog.flush()
  } catch (error) {
    console.error('[Analytics] Failed to flush events:', error)
  }
}
