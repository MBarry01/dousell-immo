# 🗺️ Système de Géocodage Intelligent par Triangulation

## 🎯 Objectif

Créer un système de géocodage **robuste** qui **ne renvoie JAMAIS d'erreur** en utilisant une stratégie de "triangulation" multi-niveaux avec un dictionnaire de secours local.

## 🔍 Problème résolu

Le système précédent échouait trop souvent au Sénégal :
- ❌ "Kafrine" ne renvoyait rien (variante d'orthographe de "Kaffrine")
- ❌ Erreurs réseau avec Nominatim
- ❌ Rate limiting
- ❌ Coordonnées à `(0, 0)` pour certaines villes

## ✅ Solution : `smartGeocode`

### Principe de Triangulation

La fonction `smartGeocode` tente plusieurs niveaux de précision, du plus précis au plus général, jusqu'à trouver un résultat :

```
Niveau 1: Adresse complète (adresse + quartier + ville)
    ↓ (si échec)
Niveau 2: Quartier + Ville
    ↓ (si échec)
Niveau 3: Ville seule
    ↓ (si échec)
Niveau 4: Dictionnaire local (correspondance approximative)
    ↓ (si échec)
Niveau 5: Fallback absolu (Dakar)
```

**GARANTIE :** La fonction retourne **TOUJOURS** des coordonnées valides, jamais `null`.

---

## 📁 Structure des fichiers

### 1. `constants/coordinates.ts`

**Dictionnaire de secours** contenant :
- ✅ Les 14 régions officielles du Sénégal
- ✅ Variantes d'orthographe communes ("Kafrine" → "Kaffrine")
- ✅ Départements de Dakar (Guédiawaye, Pikine, Rufisque)
- ✅ Quartiers clés de Dakar (Almadies, Mermoz, Plateau, etc.)

**Fonction `findInDictionary`** :
- Recherche exacte (insensible à la casse)
- Recherche par inclusion
- Normalisation des accents et caractères spéciaux
- Gère les variations d'orthographe

### 2. `lib/geocoding.ts`

**Fonction `smartGeocode(address?, district?, city?)`** :
- Stratégie multi-niveaux
- Utilise `getCoordinates` (API Nominatim) pour les niveaux 1-3
- Utilise `findInDictionary` pour le niveau 4
- Retourne `DEFAULT_COORDINATES` (Dakar) en dernier recours
- **JAMAIS de `null`**

**Fonction `getCoordinates(query, retries)`** :
- Appel à l'API Nominatim avec retry automatique
- Gestion du rate limiting (429)
- Validation des coordonnées (limites du Sénégal)
- Simplification automatique de la requête si échec

### 3. `app/compte/deposer/page.tsx`

**Intégration dans le formulaire de dépôt** :
- Remplace l'ancienne logique en cascade
- Utilise `smartGeocode` directement
- Gestion d'erreur avec fallback Dakar

### 4. `scripts/update-coordinates.ts`

**Script de migration** :
- Utilise `smartGeocodeLocal` (version adaptée pour le script)
- Garantit que toutes les annonces ont des coordonnées valides
- Logs détaillés pour chaque niveau de géocodage

---

## 🔄 Workflow de géocodage

### Exemple : "Kafrine" (variante de "Kaffrine")

```
1. Niveau 1: "Touba, Touba, Kafrine, Sénégal" → ❌ Échec Nominatim
2. Niveau 2: "Touba, Kafrine, Sénégal" → ❌ Échec Nominatim
3. Niveau 3: "Kafrine, Sénégal" → ❌ Échec Nominatim
4. Niveau 4: findInDictionary("Kafrine") → ✅ Trouvé ! (14.1059, -15.5508)
```

### Exemple : Ville inconnue

```
1. Niveau 1-3: ❌ Échecs Nominatim
2. Niveau 4: ❌ Pas dans le dictionnaire
3. Niveau 5: ✅ Fallback Dakar (14.7167, -17.4677)
```

---

## 📊 Dictionnaire de coordonnées

### Régions (14)

| Région | Latitude | Longitude |
|--------|----------|-----------|
| Dakar | 14.7167 | -17.4677 |
| Diourbel | 14.65 | -16.2333 |
| Fatick | 14.35 | -16.4 |
| **Kaffrine** | 14.1059 | -15.5508 |
| Kaolack | 14.15 | -16.0833 |
| Kédougou | 12.55 | -12.1833 |
| Kolda | 12.8833 | -14.95 |
| Louga | 15.6167 | -16.2167 |
| Matam | 15.6167 | -13.3333 |
| Saint-Louis | 16.0179 | -16.37 |
| Sédhiou | 12.7081 | -15.5569 |
| Tambacounda | 13.7667 | -13.6667 |
| Thiès | 14.7833 | -16.9167 |
| Ziguinchor | 12.5833 | -16.2667 |

### Variantes d'orthographe

- `"Kafrine"` → `Kaffrine` ✅
- `"Kaolak"` → `Kaolack` ✅
- `"Thies"` → `Thiès` ✅
- `"Saint Louis"` → `Saint-Louis` ✅

### Quartiers Dakar

- Almadies, Mermoz, Plateau, Ouakam, Yoff, Ngor, Sacré-Cœur, Les Mamelles, Fann, HLM, Sicap Liberté, Point E, Diamniadio

---

## 🧪 Tests

### Cas de test

1. ✅ **"Kafrine"** → Trouve "Kaffrine" dans le dictionnaire
2. ✅ **"Touba, Kafrine"** → Trouve "Kaffrine" après échec API
3. ✅ **Ville inconnue** → Fallback Dakar
4. ✅ **Adresse complète valide** → API Nominatim
5. ✅ **Erreur réseau** → Dictionnaire puis Dakar

### Garanties

- ✅ **JAMAIS de `null`** : Toujours des coordonnées valides
- ✅ **JAMAIS de `(0, 0)`** : Coordonnées toujours dans les limites du Sénégal
- ✅ **Robuste aux erreurs** : Gère les erreurs réseau, rate limiting, etc.
- ✅ **Variantes d'orthographe** : Gère "Kafrine" vs "Kaffrine"

---

## 📝 Utilisation

### Dans le formulaire de dépôt

```typescript
import { smartGeocode } from "@/lib/geocoding";

// Automatique lors de la soumission
const coordinates = await smartGeocode(
  values.address,    // "Touba"
  values.district,   // "Touba"
  values.city        // "Kafrine"
);
// Retourne TOUJOURS { lat: number, lng: number }
```

### Dans le script de migration

```typescript
import { smartGeocodeLocal } from "./update-coordinates";

const coords = await smartGeocodeLocal(address, district, city);
// Garantit toujours un résultat
```

---

## 🚀 Avantages

1. **Fiabilité** : 100% de succès (jamais d'erreur)
2. **Performance** : Dictionnaire local = pas d'appel API inutile
3. **Robustesse** : Gère les erreurs réseau, rate limiting, etc.
4. **Flexibilité** : Gère les variations d'orthographe
5. **Maintenabilité** : Dictionnaire facilement extensible

---

## 🔧 Maintenance

### Ajouter une nouvelle ville au dictionnaire

Éditer `constants/coordinates.ts` :

```typescript
export const SENEGAL_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // ... existant ...
  "NouvelleVille": { lat: XX.XXXX, lng: -XX.XXXX },
};
```

### Ajouter une variante d'orthographe

```typescript
"Variante": { lat: XX.XXXX, lng: -XX.XXXX }, // Pointe vers la même ville
```

---

**Date de création :** 28 novembre 2025  
**Version :** 1.0









