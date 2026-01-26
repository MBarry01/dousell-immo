import { slugify } from "./slugs";

// Map of city slugs to image paths
// Ensure these images exist in public/images/cities/
const CITY_IMAGES: Record<string, string> = {
    "dakar": "/images/cities/dakar.jpg",
    "region-de-dakar": "/images/cities/dakar.jpg",
    "dakar-region": "/images/cities/dakar.jpg",
    "ville-de-dakar": "/images/cities/dakar.jpg",

    "saly": "/images/cities/saly.jpg",
    "saly-portudal": "/images/cities/saly.jpg",
    "petite-cote": "/images/cities/saly.jpg",

    "mbour": "/images/cities/mbour.jpg",

    "thies": "/images/cities/thies.jpg",
    "region-de-thies": "/images/cities/thies.jpg",
    "thies-region": "/images/cities/thies.jpg",
    "ville-de-thies": "/images/cities/thies.jpg",

    "saint-louis": "/images/cities/saint-louis.jpg",
    "somone": "/images/cities/saly.jpg", // Fallback for nearby coast
    "ngaparou": "/images/cities/saly.jpg",
};

const DEFAULT_IMAGE = "/images/cities/default.jpg";

export function getCityImage(cityName: string): string {
    if (!cityName) return DEFAULT_IMAGE;
    const slug = slugify(cityName);
    return CITY_IMAGES[slug] || DEFAULT_IMAGE;
}
