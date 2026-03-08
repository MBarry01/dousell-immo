/**
 * Cloudinary Image Optimization Helper
 *
 * Provides utility functions for generating optimized Cloudinary image URLs
 * with automatic format conversion, quality optimization, and responsive sizing.
 *
 * Project ID: dkkirzpxe
 */

export const CLOUDINARY_PROJECT_ID = 'dkkirzpxe';

export interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  crop?: string;
  format?: 'auto' | 'webp' | 'jpg';
  gravity?: string;
  dpr?: string;
}

/**
 * Generate a Cloudinary URL with transformations
 *
 * @param publicId - Cloudinary public ID (e.g., "mocupProLoc_f0pj79")
 * @param options - Transformation options
 * @returns Full Cloudinary URL with transformations
 */
export function getCloudinaryUrl(
  publicId: string,
  options?: CloudinaryOptions
): string {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_PROJECT_ID}/image/upload`;

  const transformations = [
    options?.width && options?.height
      ? `w_${options.width},h_${options.height},c_${options.crop || 'fill'}`
      : null,
    options?.quality ? `q_${options.quality}` : 'q_auto',
    options?.format ? `f_${options.format}` : 'f_auto',
    options?.gravity ? `g_${options.gravity}` : null,
    options?.dpr ? `dpr_${options.dpr}` : null,
  ]
    .filter(Boolean)
    .join(',');

  return `${baseUrl}/${transformations}/${publicId}`;
}

/**
 * Get optimized URL for property listing images
 *
 * @param publicId - Cloudinary public ID
 * @param size - Image size preset (thumb/medium/large)
 * @returns Optimized Cloudinary URL
 */
export function getPropertyImageUrl(
  publicId: string,
  size: 'thumb' | 'medium' | 'large' = 'medium'
): string {
  const sizes = {
    thumb: { width: 300, height: 200 },
    medium: { width: 800, height: 600 },
    large: { width: 1200, height: 900 },
  };

  return getCloudinaryUrl(publicId, {
    ...sizes[size],
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Get optimized URL for hero/banner images
 *
 * @param publicId - Cloudinary public ID
 * @returns Optimized Cloudinary URL for banners
 */
export function getHeroBannerUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, {
    width: 1920,
    height: 600,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Get optimized URL for thumbnail/card images
 *
 * @param publicId - Cloudinary public ID
 * @returns Optimized Cloudinary URL for thumbnails
 */
export function getThumbnailUrl(publicId: string): string {
  return getPropertyImageUrl(publicId, 'thumb');
}
