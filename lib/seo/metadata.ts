/**
 * SEO Metadata Generator
 *
 * Pure function to generate consistent metadata for all pages.
 * Handles OpenGraph, Twitter cards, and canonical URLs.
 */

import { Metadata } from 'next';

export interface MetadataParams {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  image?: string;
  keywords?: string[];
  robots?: {
    index?: boolean;
    follow?: boolean;
    'max-snippet'?: number;
    'max-image-preview'?: 'none' | 'standard' | 'large';
  };
}

/**
 * Generate metadata for a page with OpenGraph and Twitter support.
 *
 * @param params - Metadata parameters (title, description, path, etc.)
 * @returns Next.js Metadata object for export in page.tsx generateMetadata()
 */
export function generateMetadata(params: MetadataParams): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dousel.com';
  const fullUrl = `${baseUrl}${params.path}`;
  const image = params.image || `${baseUrl}/og-image.png`;

  return {
    title: params.title,
    description: params.description,
    keywords: params.keywords || ['immobilier', 'senegal', 'annonces', 'proprietes'],
    alternates: { canonical: fullUrl },
    robots: params.robots || { index: true, follow: true },
    openGraph: {
      type: params.type || 'website',
      url: fullUrl,
      title: params.title,
      description: params.description,
      images: [{ url: image, width: 1200, height: 630 }],
      siteName: 'Dousell Immo',
      locale: 'fr_SN',
    },
    twitter: {
      card: 'summary_large_image',
      title: params.title,
      description: params.description,
      images: [image],
    },
  };
}
