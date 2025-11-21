# Configuration de la carte (Maps)

## 🗺️ Vue d'ensemble

Le composant `StaticMap` affiche une carte statique de la localisation d'un bien. Il supporte deux services de cartes :

1. **Google Maps Static API** (prioritaire)
2. **Mapbox Static API** (fallback)

## 🔑 Variables d'environnement

### Option 1 : Google Maps (Recommandé)

Ajouter dans votre `.env.local` :

```env
NEXT_PUBLIC_GOOGLE_MAPS_KEY=votre-clé-api-google-maps
```

#### Comment obtenir une clé Google Maps API

1. **Aller dans Google Cloud Console**
   - https://console.cloud.google.com/
   - Créer un projet ou sélectionner un projet existant

2. **Activer l'API**
   - Aller dans **APIs & Services** → **Library**
   - Rechercher "Maps Static API"
   - Cliquer sur **Enable**

3. **Créer une clé API**
   - Aller dans **APIs & Services** → **Credentials**
   - Cliquer sur **Create Credentials** → **API Key**
   - Copier la clé générée

4. **Restreindre la clé (Recommandé pour production)**
   - Cliquer sur la clé pour l'éditer
   - Dans **API restrictions**, sélectionner "Restrict key"
   - Choisir "Maps Static API"
   - Dans **Application restrictions**, configurer selon vos besoins

### Option 2 : Mapbox (Alternative)

Ajouter dans votre `.env.local` :

```env
NEXT_PUBLIC_MAPBOX_TOKEN=votre-token-mapbox
```

#### Comment obtenir un token Mapbox

1. **Créer un compte Mapbox**
   - https://account.mapbox.com/auth/signup/

2. **Récupérer votre token**
   - Aller dans **Account** → **Access tokens**
   - Copier votre **Default public token** ou créer un nouveau token

3. **Configurer les permissions**
   - Le token par défaut a généralement les bonnes permissions
   - Pour la production, créez un token spécifique avec des restrictions

## 📝 Configuration complète `.env.local`

```env
# Supabase (obligatoire)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key

# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google Maps API (optionnel, prioritaire)
NEXT_PUBLIC_GOOGLE_MAPS_KEY=votre-clé-api-google-maps

# Mapbox Token (optionnel, fallback si Google Maps n'est pas configuré)
NEXT_PUBLIC_MAPBOX_TOKEN=votre-token-mapbox
```

## 🎨 Personnalisation de la carte

### Paramètres de Google Maps Static API

Le composant utilise ces paramètres par défaut :
- **Zoom** : 15 (niveau de zoom)
- **Taille** : 800x400 pixels
- **Échelle** : 2x (haute résolution)
- **Format** : JPG
- **Type de carte** : roadmap
- **Style** : Simplifié (sans labels POI)

### Paramètres de Mapbox Static API

Le composant utilise ces paramètres par défaut :
- **Style** : streets-v12
- **Marqueur** : Pin bleu (couleur #3B82F6)
- **Zoom** : 15
- **Taille** : 800x400 @2x

## 🔧 Modification du composant

Le composant se trouve dans `components/property/static-map.tsx`.

### Changer le zoom

```typescript
googleMapUrl.searchParams.set("zoom", "17"); // Plus proche
// ou
googleMapUrl.searchParams.set("zoom", "12"); // Plus éloigné
```

### Changer la taille

```typescript
googleMapUrl.searchParams.set("size", "1200x600"); // Plus grande
```

### Changer le style de la carte Google

```typescript
googleMapUrl.searchParams.set("maptype", "satellite"); // Vue satellite
// ou
googleMapUrl.searchParams.set("maptype", "hybrid"); // Vue hybride
```

### Changer le style Mapbox

```typescript
// Dans l'URL Mapbox, remplacer "streets-v12" par :
// - "dark-v11" (mode sombre)
// - "satellite-v9" (satellite)
// - "outdoors-v12" (plein air)
```

## 🐛 Dépannage

### La carte ne s'affiche pas

1. **Vérifier les variables d'environnement**
   - Vérifier que la clé/token est correctement configurée dans `.env.local`
   - Redémarrer le serveur après modification de `.env.local`

2. **Vérifier la console du navigateur**
   - Ouvrir DevTools (F12)
   - Regarder les erreurs dans la console
   - Vérifier si l'image de la carte charge correctement

3. **Vérifier les restrictions de clé API**
   - Google Maps : Vérifier que "Maps Static API" est activée
   - Vérifier les restrictions d'application (domaines, IP, etc.)

### La carte affiche "Carte non disponible"

Cela signifie qu'aucune clé API n'est configurée. Deux solutions :

1. **Configurer une clé API** (voir ci-dessus)
2. **Utiliser le bouton "Ouvrir Maps"** qui fonctionne toujours

### Erreur "RefererNotAllowedMapError"

Cela signifie que votre domaine n'est pas autorisé dans les restrictions de la clé Google Maps.

**Solution** :
1. Aller dans Google Cloud Console → Credentials
2. Cliquer sur votre clé API
3. Dans **Application restrictions**, ajouter votre domaine
4. Pour le développement local, ajouter `localhost`

## 📊 Performance

### Optimisation des images

- La carte utilise `next/image` pour l'optimisation automatique
- Format JPG pour Google Maps (plus léger)
- Qualité à 85% pour un bon équilibre taille/qualité
- Lazy loading activé par défaut

### Cache

Les cartes statiques sont mises en cache par :
- Le navigateur (via next/image)
- Google Maps / Mapbox (côté serveur)

## 🚀 Production

### Recommandations pour la production

1. **Restreindre la clé API**
   - Limiter aux domaines autorisés
   - Limiter aux APIs nécessaires uniquement

2. **Quotas et limites**
   - Google Maps : 25 000 requêtes gratuites/mois
   - Mapbox : 50 000 requêtes gratuites/mois

3. **Monitoring**
   - Surveiller l'utilisation de l'API
   - Configurer des alertes si nécessaire

4. **Fallback**
   - Le bouton "Ouvrir Maps" fonctionne toujours même sans clé API
   - Il ouvre Google Maps dans un nouvel onglet

