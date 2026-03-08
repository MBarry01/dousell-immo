# Apify Facebook Marketplace Real Estate Configuration

**Objectif:** Configurer le scraper Apify pour cibler SEULEMENT les annonces immobilières (Real Estate category) sur Facebook Marketplace, au lieu de scraper tout le marketplace.

## Configuration Apify Console

### 1. Aller dans votre scraper Facebook Marketplace

- Console Apify: https://console.apify.com
- Naviguez vers votre scraper Facebook Marketplace
- Onglet: **Settings**

### 2. Configurer la recherche pour "Real Estate"

**Option A: Via Search Query (RECOMMANDÉ)**
```
Titre du scraper: Facebook Marketplace - Real Estate
Input Field "startUrls": Remplacer par:
https://www.facebook.com/marketplace/category/real-estate/

OU pour un pays/région spécifique:
https://www.facebook.com/marketplace/107327779344/?min_price=0&max_price=999999999
```

**Option B: Via le paramètre searchQuery**
```
searchQuery: "Real Estate"
city: "Dakar" (ou votre ville)
countryCode: "SN" (Sénégal)
```

### 3. Configurer les Input Fields

**Clé "startUrls":** Ajouter les URLs directement vers Real Estate:
```
[
  "https://www.facebook.com/marketplace/category/real-estate/",
  "https://www.facebook.com/marketplace/107327779344/" // ID catégorie Real Estate
]
```

**Clé "maxPages":** 100 (pour 2000-3000 annonces par run)

**Clé "proxyUrl":** Activer proxy si Facebook bloque (optionnel)

### 4. Vérifier Output Fields

Assurez-vous que ces champs sont mappés correctement:
```json
{
  "marketplace_listing_title": "Titre de l'annonce",
  "listing_price": "Prix",
  "location": {
    "reverse_geocode": {
      "city": "Ville",
      "state": "État/Région"
    }
  },
  "primary_listing_photo_url": "Image principale",
  "listingUrl": "URL de l'annonce",
  "is_live": "Annonce active?",
  "is_sold": "Vendue?",
  "created_at": "Date création"
}
```

### 5. Webhooks & Déclenchement

**Webhook pour production (déjà configuré):**
```
Event: Dataset items finished
URL: https://www.dousel.com/api/webhooks/apify-sync?source=Facebook+Marketplace
Headers: x-webhook-secret: [VOTRE_CRON_SECRET]
```

### 6. Planification Automatique (Optional)

**Fréquence recommandée:** Tous les 2 jours (images Facebook CDN valides 24-48h)

**Config Apify Scheduler:**
- **Frequency:** Every 2 days
- **Time:** 02:00 UTC
- **Task:** [Sélectionner votre scraper]

### 7. Tester la Configuration

**Avant de mettre en prod:**
1. Lancer un test avec 1 page → vérifier les résultats
2. Vérifier que SEULEMENT les annonces immobilières sont scrapées
3. Vérifier le format des champs (prix, titre, localisation, image)
4. Vérifier que le webhook se déclenche et insère les données

---

## Webhook Côté Serveur

Le webhook `/api/webhooks/apify-sync` fait:
- ✅ Filtre les non-immo (furniture, quincaillerie, etc.)
- ✅ Valide les URLs (404/410)
- ✅ Géocode automatiquement (Nominatim)
- ✅ Classifie (Vente/Location, Appartement/Villa/Terrain, Ville)
- ✅ Déduplique
- ✅ Upsert en DB (external_listings)
- ✅ Cleanup (7 jours TTL)

---

## Troubleshooting

**Problème:** Scraper retourne "0 items"
- **Solution:** Vérifier URL Facebook (peut changer), tester manuellement

**Problème:** Images 403 Forbidden
- **Connu:** Facebook bloque accès direct après ~48h
- **Solution:** URLs valides immédiatement après scrape, re-scrapez tous les 2 jours

**Problème:** Webhook 401 Unauthorized
- **Solution:** Vérifier `APIFY_WEBHOOK_SECRET` dans env vars

**Problème:** Trop d'annonces non-immo
- **Solution:** Voir `isRealEstateAd()` dans `app/api/webhooks/apify-sync/route.ts`

---

## Checklist Déploiement

- [ ] Configuration Apify: Real Estate category ciblée
- [ ] Test local: Scraper retourne items immobiliers seulement
- [ ] Test webhook: Données arrivent en DB
- [ ] Production: Images affichées sur `/recherche`
- [ ] Monitoring: Vérifier stats webhook (received, valid, skipped)
- [ ] Planification: Scraper configuré à tourner tous les 2 jours
