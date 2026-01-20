# Système de Scraping et Intégration des Annonces Externes

## Vue d'ensemble

Ce document décrit le fonctionnement complet du système d'intégration des annonces immobilières scrapées depuis des sites partenaires (CoinAfrique, Expat-Dakar, Seloger, etc.) vers la plateforme Doussel Immo.

---

## Architecture du Système

```mermaid
flowchart LR
    A1[Apify Scraper<br/>CoinAfrique] -->|POST + source| W[/api/webhooks/apify-sync]
    A2[Apify Scraper<br/>Expat-Dakar] -->|POST + source| W
    A3[Apify Scraper<br/>Seloger] -->|POST + source| W
    W -->|Header Secret?| S{Authentifié?}
    S -->|Non| X[❌ 401 Unauthorized]
    S -->|Oui| V{Données valides?}
    V -->|Non| E[❌ 400 Rejeté]
    V -->|Oui| M[Mapping Flexible]
    M --> C[Classification Auto]
    C --> D[Déduplication]
    D --> U[Upsert Supabase]
    U --> N[Nettoyage TTL 7j<br/>par source]
    N --> H[(external_listings)]
    H -->|gatewayService| I[UI Unifiée]
```

---

## Structure de la Base de Données

### Table `external_listings`

| Colonne        | Type          | Description                                      |
|----------------|---------------|--------------------------------------------------|
| `id`           | UUID          | Identifiant unique (auto-généré)                |
| `source_url`   | TEXT (UNIQUE) | URL de l'annonce originale — **clé de dédup**   |
| `title`        | TEXT (NOT NULL)| Titre de l'annonce                              |
| `price`        | TEXT          | Prix en format texte (ex: "500 000 FCFA")       |
| `location`     | TEXT          | Adresse/quartier de l'annonce                   |
| `image_url`    | TEXT          | URL de l'image principale                       |
| `source_site`  | TEXT          | Site source: CoinAfrique, Expat-Dakar, Seloger  |
| `category`     | TEXT          | Type: Appartement, Villa, Terrain, Commercial, Autre |
| `type`         | TEXT          | Transaction: Vente ou Location                  |
| `city`         | TEXT          | Ville: Dakar, Saly, Thiès, Saint-Louis, etc.    |
| `last_seen_at` | TIMESTAMPTZ   | Dernière synchronisation                        |
| `created_at`   | TIMESTAMPTZ   | Date de première insertion                      |

> [!IMPORTANT]
> La colonne `source_url` est **UNIQUE** — c'est la clé utilisée pour l'upsert (insertion ou mise à jour).

### Index de Performance

```sql
CREATE INDEX idx_external_city ON external_listings(city);
CREATE INDEX idx_external_category ON external_listings(category);
CREATE INDEX idx_external_type ON external_listings(type);
CREATE INDEX idx_external_source ON external_listings(source_site);
CREATE INDEX idx_external_last_seen ON external_listings(last_seen_at);
```

---

## Webhook d'Intégration

### Endpoint

```
POST /api/webhooks/apify-sync
GET  /api/webhooks/apify-sync  (health check)
```

### Fichier source

`app/api/webhooks/apify-sync/route.ts`

### Sécurité

Le webhook est protégé par un header secret optionnel :

| Header | Valeur attendue |
|--------|-----------------|
| `x-webhook-secret` | Valeur de `APIFY_WEBHOOK_SECRET` |
| `Authorization` | `Bearer {APIFY_WEBHOOK_SECRET}` |

> [!WARNING]
> En production, définissez **toujours** `APIFY_WEBHOOK_SECRET` dans vos variables d'environnement.

### Payload attendu

**Format Apify standard :**
```json
{
  "resource": {
    "defaultDatasetId": "DATASET_ID_APIFY"
  },
  "source": "CoinAfrique"
}
```

**Format simplifié :**
```json
{
  "datasetId": "DATASET_ID_APIFY",
  "source": "Expat-Dakar"
}
```

> [!NOTE]
> Le champ `source` est **obligatoire** pour identifier le site partenaire. Valeurs supportées : `CoinAfrique`, `Expat-Dakar`, `Seloger`.

---

## Sources Supportées

Le système supporte plusieurs sources avec un mapping flexible des champs :

| Source | URL Field | Title Field | Price Field | Location Field | Image Fields |
|--------|-----------|-------------|-------------|----------------|--------------|
| **CoinAfrique** | `url` | `title` | `price` | `location` | `image`, `image_url`, `img` |
| **Expat-Dakar** | `link` | `title` | `prix` | `localisation` | `photo`, `image`, `thumbnail` |
| **Seloger** | `url` | `nom` | `price` | `adresse` | `image_principale`, `image` |

### Ajouter une nouvelle source

1. Ajouter la configuration dans `SOURCE_CONFIG` :

```typescript
'NouveauSite': {
  urlField: 'lien',
  titleField: 'titre',
  priceField: 'tarif',
  locationField: 'adresse',
  imageField: ['photo', 'visuel'],
},
```

2. Configurer le scraper Apify pour envoyer `"source": "NouveauSite"` dans le payload.

---

## Pipeline de Traitement

### 1. Authentification

```typescript
if (WEBHOOK_SECRET) {
  const authHeader = req.headers.get('x-webhook-secret');
  if (authHeader !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

### 2. Récupération des données

```typescript
const response = await fetch(
  `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
);
const ads = await response.json();
```

### 3. Mapping flexible

Le système extrait automatiquement les champs selon la source :

```typescript
const sourceUrl = extractField(ad, config.urlField);  // 'url' ou 'link' selon source
const title = extractField(ad, config.titleField);
```

### 4. Classification Automatique

| Règle (titre)                                    | Catégorie      |
|--------------------------------------------------|----------------|
| Contient "terrain" ou "parcelle"                 | Terrain        |
| Contient "villa" ou "maison"                     | Villa          |
| Contient "appart", "studio" ou "chambre"         | Appartement    |
| Contient "bureau", "local" ou "commercial"       | Commercial     |
| Autre                                            | Autre          |

| Règle (titre)                                    | Type           |
|--------------------------------------------------|----------------|
| Contient "louer", "location", "à louer", "bail"  | Location       |
| Autre                                            | Vente          |

| Règle (localisation)                             | Ville          |
|--------------------------------------------------|----------------|
| Contient "saly", "mbour" ou "somone"             | Saly           |
| Contient "thiès" ou "thies"                      | Thiès          |
| Contient "saint-louis" ou "ndar"                 | Saint-Louis    |
| Contient "rufisque"                              | Rufisque       |
| Contient "diamniadio"                            | Diamniadio     |
| Autre                                            | Dakar          |

### 5. Déduplication

Les doublons (même `source_url`) sont éliminés avant insertion :

```typescript
const uniqueAdsMap = new Map<string, Ad>();
for (const ad of processedAds) {
  uniqueAdsMap.set(ad.source_url, ad);
}
```

### 6. Upsert en Base

```typescript
await supabase
  .from('external_listings')
  .upsert(uniqueAds, { onConflict: 'source_url' });
```

### 7. Nettoyage Ciblé (TTL 7 jours)

> [!IMPORTANT]
> Le nettoyage supprime **uniquement** les annonces de la source concernée qui n'ont pas été vues depuis 7 jours.

```typescript
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 7);

await supabase
  .from('external_listings')
  .delete()
  .eq('source_site', source)           // ← Seulement cette source
  .lt('last_seen_at', cutoffDate);     // ← Non vues depuis 7 jours
```

**Pourquoi ce choix ?**
- Un sync CoinAfrique ne supprime pas les annonces Expat-Dakar
- Si un scraper rate quelques runs, les annonces ne sont pas perdues
- Les annonces vraiment disparues (>7 jours) sont nettoyées automatiquement

---

## Affichage Unifié (Gateway Service)

### Fichier source

`services/gatewayService.ts`

### Fonctionnement

Le `gatewayService` fusionne les annonces **internes** (`properties`) avec les **externes** (`external_listings`).

### Filtres de fraîcheur

Seules les annonces vues dans les **4 derniers jours** sont affichées à l'utilisateur :

```typescript
const fourDaysAgo = new Date();
fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
query = query.gt("last_seen_at", fourDaysAgo.toISOString());
```

---

## Comportement UI

### Détection d'annonce externe

```typescript
if (property.isExternal && property.source_url) {
  window.open(property.source_url, '_blank');
}
```

### Badge partenaire

Les cartes affichent un badge "Partenaire" avec le nom du site source.

---

## Configuration

### Variables d'environnement

| Variable                      | Requis | Description                                |
|-------------------------------|--------|--------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`    | Oui    | URL de l'instance Supabase                 |
| `SUPABASE_SERVICE_ROLE_KEY`   | Oui    | Clé de service Supabase (admin)            |
| `APIFY_API_TOKEN`             | Oui    | Token API Apify pour récupérer les données |
| `APIFY_WEBHOOK_SECRET`        | **Recommandé** | Secret pour sécuriser le webhook     |

### Configuration Apify

Pour chaque scraper, configurer un webhook POST :

```
URL: https://votre-domaine.com/api/webhooks/apify-sync
Event: ACTOR.RUN.SUCCEEDED
Headers:
  x-webhook-secret: votre_secret_ici
Payload template:
{
  "resource": {{resource}},
  "source": "CoinAfrique"
}
```

---

## Health Check

Vérifier que le webhook est actif :

```bash
curl https://votre-domaine.com/api/webhooks/apify-sync
```

Réponse :
```json
{
  "status": "ok",
  "supportedSources": ["CoinAfrique", "Expat-Dakar", "Seloger"],
  "cleanupTTL": "7 jours",
  "secured": true
}
```

---

## Réponse du Webhook

### Succès (200)

```json
{
  "success": true,
  "source": "CoinAfrique",
  "stats": {
    "received": 523,
    "valid": 498,
    "unique": 495,
    "skipped": 25,
    "cleanupTTL": "7 jours"
  }
}
```

### Erreurs

| Code | Erreur | Cause |
|------|--------|-------|
| 401 | `Unauthorized` | Header secret manquant ou invalide |
| 400 | `Missing configuration` | `datasetId` ou `APIFY_API_TOKEN` absent |
| 400 | `Source inconnue: X` | Source non configurée dans `SOURCE_CONFIG` |
| 500 | `Upsert failed: ...` | Erreur Supabase |

---

## Logs de Diagnostic

Le webhook génère des logs structurés :

```
[CoinAfrique] Démarrage sync depuis dataset abc123
[CoinAfrique] 523 annonces brutes reçues
[CoinAfrique] 498 annonces valides (25 ignorées)
[CoinAfrique] 495 annonces uniques après déduplication
[CoinAfrique] 12 annonces obsolètes supprimées (>7 jours)
```

---

## Évolutions Futures

- [ ] Ajouter plus de sites sources (Jumia House, etc.)
- [ ] Améliorer la classification via NLP/ML
- [ ] Ajouter un système de scoring de qualité
- [ ] Implémenter un cache Redis pour les requêtes fréquentes
- [ ] Dashboard admin pour visualiser les stats de sync
- [ ] Alertes en cas d'échec de sync répétés
