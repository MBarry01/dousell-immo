import fs from "fs";

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error("Missing PEXELS_API_KEY environment variable.");
  process.exit(1);
}

const targets = [
  { title: "Superbe F4 Moderne avec Piscine - Zone Almadies", query: "luxury modern living room pool" },
  { title: "Appartement F3 Spacieux et Accessible - Mermoz", query: "cozy apartment interior bright" },
  { title: "Villa d'Architecte R+1 avec Rooftop - Les Mamelles", query: "modern white villa rooftop" },
  { title: "Studio Chic & Meublé Tout Inclus - Dakar Plateau", query: "modern studio apartment interior" },
  { title: "Terrain d'Angle 300m² - Pôle Urbain Diamniadio", query: "empty land plot aerial" },
  { title: "Plateau de Bureaux 150m² - Façade VDN", query: "modern open space office" },
  { title: "F3 Pieds dans l'eau - Virage", query: "ocean view apartment balcony" },
  { title: "Immeuble R+3 à Rénover - Sicap Liberté", query: "apartment building facade" },
  { title: "Villa de Charme 3 Chambres avec Piscine Privée - Saly", query: "tropical villa pool" },
  { title: "F4 de Prestige - Résidence Diplomatique Point E", query: "luxury apartment marble" }
];

const headers = { Authorization: API_KEY };

async function run() {
  const results: Record<string, string[]> = {};

  for (const target of targets) {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", target.query);
    url.searchParams.set("per_page", "6");
    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.error("Pexels request failed for:", response.status, response.statusText);
      continue;
    }
    const data = (await response.json()) as any;
    const urls = (data?.photos ?? [])
      .slice(0, 3)
      .map((photo: any) => photo?.src?.large2x || photo?.src?.original)
      .filter(Boolean);
    results[target.title] = urls;
    console.log("Fetched photos for", target.title);
  }

  fs.mkdirSync("scripts/output", { recursive: true });
  fs.writeFileSync("scripts/output/pexels-images.json", JSON.stringify(results, null, 2));
  console.log("Saved scripts/output/pexels-images.json");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
