import { slugify } from "./slugs";

// Map of city slugs to image paths on Cloudinary
const CITY_IMAGES: Record<string, string> = {
    "dakar": "Dousel/static/cities/dakar",
    "region-de-dakar": "Dousel/static/cities/dakar",
    "dakar-region": "Dousel/static/cities/dakar",
    "ville-de-dakar": "Dousel/static/cities/dakar",

    "saly": "Dousel/static/cities/saly",
    "saly-portudal": "Dousel/static/cities/saly",
    "petite-cote": "Dousel/static/cities/saly",

    "mbour": "Dousel/static/cities/mbour",

    "thies": "Dousel/static/cities/thies",
    "region-de-thies": "Dousel/static/cities/thies",
    "thies-region": "Dousel/static/cities/thies",
    "ville-de-thies": "Dousel/static/cities/thies",

    "saint-louis": "Dousel/static/cities/saint-louis",
    "diamniadio": "Dousel/static/cities/diamniadio",
    "rufisque": "Dousel/static/cities/rufisque",

    "touba": "Dousel/static/cities/touba",
    "ziguinchor": "Dousel/static/cities/ziguinchor",
    "kaolack": "Dousel/static/cities/kaolack",
    "diourbel": "Dousel/static/cities/diourbel",
    "tambacounda": "Dousel/static/cities/tambacounda",

    "somone": "Dousel/static/cities/saly", // Fallback for nearby coast
    "ngaparou": "Dousel/static/cities/saly",
};

const DEFAULT_IMAGE = "Dousel/static/cities/default_senegal";

export function getCityImage(cityName: string): string {
    if (!cityName) return DEFAULT_IMAGE;
    const slug = slugify(cityName);
    return CITY_IMAGES[slug] || DEFAULT_IMAGE;
}
