# Design : Intégration Facebook Marketplace

**Date** : 2026-03-08
**Auteur** : Claude Code
**Status** : ✅ Approved

---

## 📋 Résumé Exécutif

Intégrer le scraper Apify Facebook Marketplace dans la base de données existante en utilisant la table `external_listings` (une seule source de vérité pour tous les scrapeurs). Les annonces Facebook seront transparentes, mélangées avec CoinAfrique/Expat-Dakar sur la vitrine `/pro`, suivant les mêmes paramètres de classification et filtrage.

---

## 🎯 Objectifs

1. ✅ Ingérer les données Facebook via webhook Apify existant
2. ✅ Normaliser et classifier automatiquement (category, type, city)
3. ✅ Afficher transparente sur la vitrine (sans distinction de source)
4. ✅ Géocoder et valider liens (pipeline existant)
5. ✅ Auto-publier directement (`status = 'PUBLISHED'`)

---

## 🏗️ Architecture

### Data Layer

**Table unique** : `external_listings`
```sql
- id (UUID, PK)
- source_url (TEXT UNIQUE) — Facebook listing URL
- title, price, location (TEXT)
- image_url (TEXT)
- source_site (TEXT) — "Facebook Marketplace"
- category (TEXT) — auto-classified: Appartement, Villa, Terrain, Commercial, Autre
- type (TEXT) — auto-classified: Vente, Location
- city (TEXT) — auto-classified: Dakar, Saly, Thiès, Saint-Louis, Rufisque, Diamniadio
- status (TEXT) — 'PUBLISHED' (auto)
- coords_lat, coords_lng (NUMERIC) — géocodage Nominatim
- last_seen_at, created_at (TIMESTAMP)
```

**Suppression** :
- ❌ Table `facebook_listings` (migration `20260308000000_create_facebook_listings.sql`) — non appliquée, suppression du repo

### Webhook Layer

**Endpoint** : `POST /api/webhooks/apify-sync?source=Facebook+Marketplace`

**Config existante** (déjà présente dans `route.ts`, lignes 41-47) :
```typescript
'Facebook Marketplace': {
  urlField: ['listingUrl', 'url'],
  titleField: ['marketplace_listing_title', 'title'],
  priceField: ['listing_price.formatted_amount', 'price'],
  locationField: ['location.reverse_geocode.city', 'location.reverse_geocode.state', 'location'],
  imageField: ['primary_listing_photo_url', 'image'],
}
```

**Pipeline** (réutilise logique existante) :
1. ✅ Validation secret webhook (`APIFY_WEBHOOK_SECRET`)
2. ✅ Extraction flexible des champs (fallback multiples)
3. ✅ Filtrage : ignorer inactive listings (`is_live=false`, `is_sold=true`, `is_pending=true`, `is_hidden=true`)
4. ✅ Classification auto (category, type, city)
5. ✅ Validation URL (404/410 rejection)
6. ✅ Géocodage Nominatim (réutiliser coords existantes si URL déjà connue)
7. ✅ Déduplication (même URL dans batch)
8. ✅ Upsert vers `external_listings` (conflict on `source_url`)
9. ✅ Cleanup TTL (7 jours, supprimer annonces non vues)

### Presentation Layer

**Vitrine** : `/pro`
- ✅ Query : `SELECT * FROM external_listings WHERE status='PUBLISHED' AND city=? AND type=? AND category=?`
- ✅ Affichage transparent (mélangé CoinAfrique + Expat-Dakar + Facebook Marketplace)
- ✅ Aucun changement UX (badge source optionnel si affiché)

---

## 🔧 Changements Requis

| Composant | Action | Fichier | Détails |
|-----------|--------|---------|---------|
| **Migrations** | Supprimer | `supabase/migrations/20260308000000_create_facebook_listings.sql` | Migration non appliquée, utiliser `external_listings` à la place |
| **Env Vars** | Ajouter | `.env.local.example` | `APIFY_API_TOKEN_FACEBOOK=<token>` (token du compte Apify Facebook séparé) |
| **Webhook** | Vérifier | `app/api/webhooks/apify-sync/route.ts` | Config + token déjà supportés, aucun change code |
| **Vitrine** | N/A | `/pro` | Aucun changement (query existant suffit) |

---

## 🔐 Sécurité

- ✅ Webhook secret obligatoire (`APIFY_WEBHOOK_SECRET`)
- ✅ Token Apify Facebook séparé (pas d'accès cross-source)
- ✅ RLS existant sur `external_listings` (public voit seulement `status='PUBLISHED'`)
- ✅ Validation URL et lien-checking anti-malware

---

## 📊 Data Flow

```
Apify Facebook Task
        ↓
   Webhook POST
   /api/webhooks/apify-sync?source=Facebook+Marketplace
        ↓
   [Validation Secret]
        ↓
   [Extract Fields] (Facebook-specific mapping)
        ↓
   [Filter Inactive Listings]
        ↓
   [Classify] (category, type, city)
        ↓
   [Validate URLs] (404/410 check)
        ↓
   [Geocode] (Nominatim or reuse existing)
        ↓
   [Deduplicate] (by source_url)
        ↓
   [Upsert to external_listings]
        ↓
   [Cleanup TTL] (delete >7 days unseen)
        ↓
   Vitrine /pro (transparent display)
```

---

## ✅ Testing Strategy

1. **Unit** : Extraction de champs (extractField function, déjà testé)
2. **Integration** : Webhook POST → Supabase insert (e2e test)
3. **E2E** : Apify Facebook → Webhook → Supabase → Vitrine affichage
4. **Validation** :
   - ✅ 5-10 annonces Facebook visibles sur `/pro`
   - ✅ Classification correcte (category, type, city)
   - ✅ Géocodage appliqué (coords_lat, coords_lng remplis)
   - ✅ Cleanup TTL supprime les anciennes après 7 jours

---

## 📈 Success Criteria

- ✅ Données Facebook ingérées dans `external_listings`
- ✅ Affichage transparent sur vitrine (mélangées avec autres sources)
- ✅ Auto-classification fonctionnelle
- ✅ Géocodage appliqué
- ✅ Zero breaking changes (vitrine/SaaS unchanged)

---

## 🚀 Rollout

**Phase 1** (Dev) :
- Supprimer migration `facebook_listings`
- Configurer `APIFY_API_TOKEN_FACEBOOK`
- Test webhook avec Postman

**Phase 2** (Prod) :
- Deploy to Vercel
- Ajouter `APIFY_API_TOKEN_FACEBOOK` à Dashboard > Settings > Environment Variables
- Valider données affichées sur `/pro`

---

## 📝 Notes

- Pipeline Apify existant reconfiguré pour Facebook (aucun nouveau code de logique)
- Config Facebook déjà présente dans webhook (lines 41-47 de `route.ts`)
- Une table `external_listings` = source unique de vérité (évite UNION queries)
- Token séparé = isolation sécurisée des comptes Apify
