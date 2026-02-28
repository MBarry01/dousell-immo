/**
 * Service de géocodage utilisant OpenStreetMap Nominatim avec fallback intelligent
 * Documentation: https://nominatim.org/release-docs/develop/api/Search/
 */

import { findInDictionary, DEFAULT_COORDINATES } from "@/constants/coordinates";

export interface Coordinates {
  lat: number;
  lng: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  // D'autres champs sont disponibles mais non utilisés ici
}

/**
 * Nettoie et formate une requête pour Nominatim
 * @param query Requête brute
 * @returns Requête nettoyée et formatée
 */
function cleanQuery(query: string): string {
  return query
    .trim()
    // Retirer les espaces multiples
    .replace(/\s+/g, " ")
    // Retirer les virgules en fin de chaîne
    .replace(/,\s*$/, "")
    // S'assurer qu'on termine par "Sénégal" si ce n'est pas déjà le cas
    .replace(/,\s*Sénégal\s*$/i, ", Sénégal");
}

/**
 * Récupère les coordonnées GPS pour une adresse donnée au Sénégal
 * Utilise l'API Nominatim avec retry automatique pour plus de robustesse
 * @param query Adresse ou lieu à rechercher (ex: "Almadies, Dakar")
 * @param retries Nombre de tentatives en cas d'échec (défaut: 2)
 * @returns Coordonnées {lat, lng} ou null si non trouvé
 */
export async function getCoordinates(
  query: string,
  retries: number = 2
): Promise<Coordinates | null> {
  if (!query || !query.trim()) return null;

  const cleanQueryStr = cleanQuery(query);

  // Si la requête est trop courte ou ne contient que "Sénégal", on skip
  if (cleanQueryStr.length < 3 || cleanQueryStr.toLowerCase() === "sénégal") {
    return null;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Construction de l'URL avec paramètres optimisés
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cleanQueryStr
      )}&countrycodes=sn&limit=1&addressdetails=1`;

      // Respect de la politique d'utilisation de Nominatim (User-Agent requis)
      const headers = {
        "User-Agent": "Dousel-App/1.0",
        "Accept-Language": "fr",
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s max par requête pour éviter de bloquer

      const response = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeoutId);

      // Si rate limit (429), on attend un peu plus longtemps
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : (attempt + 1) * 2000;
        console.warn(`⚠️ Rate limit Nominatim, attente ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue; // Réessayer
      }

      if (!response.ok) {
        if (attempt < retries) {
          // Attendre un peu avant de réessayer
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        console.warn(`Erreur Nominatim (${response.status}): ${response.statusText}`);
        return null;
      }

      const data = (await response.json()) as NominatimResult[];

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        // Vérifier que les coordonnées sont valides (dans les limites du Sénégal)
        if (
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= 12.0 &&
          lat <= 16.7 &&
          lng >= -17.5 &&
          lng <= -11.3
        ) {
          return { lat, lng };
        } else {
          console.warn(`⚠️ Coordonnées hors limites Sénégal: ${lat}, ${lng}`);
          if (attempt < retries) continue;
        }
      }

      // Si aucun résultat et qu'on a encore des tentatives, réessayer avec une requête simplifiée
      if (attempt < retries && cleanQueryStr.includes(",")) {
        // Essayer avec juste la dernière partie (ex: "Dakar, Sénégal" -> "Dakar, Sénégal")
        const parts = cleanQueryStr.split(",");
        if (parts.length > 1) {
          const simplified = parts.slice(-2).join(",").trim(); // Prendre les 2 dernières parties
          if (simplified !== cleanQueryStr) {
            console.log(`🔄 Réessai avec requête simplifiée: ${simplified}`);
            return getCoordinates(simplified, retries - attempt - 1);
          }
        }
      }

      return null;
    } catch (error) {
      if (attempt < retries) {
        // Attendre avant de réessayer en cas d'erreur réseau
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      console.error("Erreur lors du géocodage:", error);
      return null;
    }
  }

  return null;
}

/**
 * Géocodage intelligent par "Triangulation" - GARANTIT toujours un résultat
 * 
 * Stratégie multi-niveaux :
 * 1. Adresse complète (adresse + quartier + ville)
 * 2. Quartier + Ville
 * 3. Ville seule
 * 4. Recherche dans le dictionnaire local (avec correspondance approximative)
 * 5. Fallback absolu : Coordonnées de Dakar
 * 
 * @param address Adresse complète
 * @param district Quartier/Ville
 * @param city Ville/Région
 * @returns Coordonnées {lat, lng} - JAMAIS null
 */
export async function smartGeocode(
  address?: string,
  district?: string,
  city?: string
): Promise<Coordinates> {
  // Nettoyage des entrées
  const cleanAddress = address?.trim() || "";
  const cleanDistrict = district?.trim() || "";
  let cleanCity = city?.trim() || "";

  // DÉTECTION D'ERREURS COMMUNES : Si l'adresse est une ville connue mais la ville est différente
  // Exemple: address="Touba" mais city="Kafrine" → corriger city="Touba"
  const knownCities = ["Touba", "Thiès", "Kaolack", "Saint-Louis", "Ziguinchor", "Louga", "Tambacounda", "Kolda", "Matam", "Fatick", "Kédougou", "Sédhiou"];
  const addressLower = cleanAddress.toLowerCase();
  const cityLower = cleanCity.toLowerCase();

  for (const knownCity of knownCities) {
    const knownCityLower = knownCity.toLowerCase();
    // Si l'adresse contient une ville connue mais la ville est différente, corriger
    if (addressLower.includes(knownCityLower) && cityLower !== knownCityLower && !cityLower.includes(knownCityLower)) {
      console.log(`⚠️ Détection d'erreur: adresse="${cleanAddress}" contient "${knownCity}" mais ville="${cleanCity}" (incorrect). Correction automatique.`);
      cleanCity = knownCity;
      break;
    }
  }

  // Niveau 1 : Adresse complète (précision maximale)
  if (cleanAddress && cleanDistrict && cleanCity) {
    const fullQuery = `${cleanAddress}, ${cleanDistrict}, ${cleanCity}, Sénégal`;
    const result = await getCoordinates(fullQuery, 0); // 0 retries pour fail fast
    if (result) {
      console.log(`✅ Géocodage niveau 1 (adresse complète): ${fullQuery}`);
      return result;
    }
  }

  // Niveau 2 : Quartier + Ville
  if (cleanDistrict && cleanCity) {
    const districtQuery = `${cleanDistrict}, ${cleanCity}, Sénégal`;
    const result = await getCoordinates(districtQuery, 0);
    if (result) {
      console.log(`✅ Géocodage niveau 2 (quartier + ville): ${districtQuery}`);
      return result;
    }
  }

  // Niveau 3 : Ville seule (utiliser la ville corrigée)
  if (cleanCity) {
    const cityQuery = `${cleanCity}, Sénégal`;
    const result = await getCoordinates(cityQuery, 0);
    if (result) {
      console.log(`✅ Géocodage niveau 3 (ville): ${cityQuery}`);
      return result;
    }
  }

  // Niveau 3.5 : Si l'adresse est une ville connue, essayer directement
  if (cleanAddress) {
    const addressAsCityQuery = `${cleanAddress}, Sénégal`;
    const result = await getCoordinates(addressAsCityQuery, 0);
    if (result) {
      console.log(`✅ Géocodage niveau 3.5 (adresse comme ville): ${addressAsCityQuery}`);
      return result;
    }
  }

  // Niveau 4 : Recherche dans le dictionnaire local (avec correspondance approximative)
  // Essayer d'abord avec la ville
  if (cleanCity) {
    const dictResult = findInDictionary(cleanCity);
    if (dictResult) {
      console.log(`✅ Géocodage niveau 4 (dictionnaire - ville): ${cleanCity}`);
      return dictResult;
    }
  }

  // Essayer avec le quartier
  if (cleanDistrict) {
    const dictResult = findInDictionary(cleanDistrict);
    if (dictResult) {
      console.log(`✅ Géocodage niveau 4 (dictionnaire - quartier): ${cleanDistrict}`);
      return dictResult;
    }
  }

  // Essayer avec l'adresse (au cas où ce serait un nom de lieu connu)
  if (cleanAddress) {
    // Nettoyer l'adresse (prendre juste le premier mot, souvent c'est le nom du lieu)
    const firstWord = cleanAddress.split(/[\s,]/)[0];
    if (firstWord.length > 2) {
      const dictResult = findInDictionary(firstWord);
      if (dictResult) {
        console.log(`✅ Géocodage niveau 4 (dictionnaire - adresse): ${firstWord}`);
        return dictResult;
      }
    }
  }

  // Niveau 5 : Fallback absolu - Coordonnées de Dakar
  // On ne renvoie JAMAIS null, on garantit toujours un résultat
  console.warn(
    `⚠️ Géocodage échoué pour "${cleanAddress}, ${cleanDistrict}, ${cleanCity}". Utilisation du fallback Dakar.`
  );
  return DEFAULT_COORDINATES;
}

