# 🚀 Guide d'Activation du Cache Redis - Dousell Immo

## 📋 État Actuel

**✅ Code implémenté :**
- Client Redis multi-env ([lib/cache/](lib/cache/))
- Pattern Cache-Aside complet
- Services cachés prêts à l'emploi
- Suite de tests complète

**⏸️ Cache DÉSACTIVÉ par défaut** pour éviter erreurs si Redis pas installé.

---

## 🎯 Activation Progressive (Recommandé)

### **Phase 1 : Installation Redis (5 minutes)**

**Option A : Dev Local avec Docker (Recommandé)**

```bash
# 1. Lancer Valkey
docker run -d --name valkey -p 6379:6379 valkey/valkey

# 2. Vérifier que ça tourne
docker logs valkey
# Output attendu : "Ready to accept connections"

# 3. Ajouter dans .env.local
echo "REDIS_URL=redis://localhost:6379" >> .env.local

# 4. Tester la connexion
npx tsx scripts/test-redis.ts
```

**Option B : Vercel Production (Upstash)**

```bash
# 1. Créer compte sur https://upstash.com (gratuit)
# 2. Créer une database Redis (région : Europe)
# 3. Copier les credentials

# 4. Ajouter dans .env.local
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXX...XXX

# 5. Tester
npx tsx scripts/test-redis.ts
```

---

### **Phase 2 : Activer Homepage (5 minutes)**

**Étape 1 : Modifier `app/page.tsx`**

```typescript
// ❌ AVANT (ligne 5)
import { getHomePageSections } from "@/services/homeService";

// ✅ APRÈS (ligne 5)
import { getHomePageSections } from "@/services/homeService.cached";
```

**Étape 2 : Tester**

```bash
# Lancer dev
npm run dev

# Observer les logs dans la console
# 1er chargement : 🐌 CACHE MISS (300ms)
# 2ème chargement : 🚀 CACHE HIT (5ms)
```

**Étape 3 : Vérifier dans le navigateur**

1. Ouvrir DevTools (F12)
2. Onglet Network
3. Recharger la page (Ctrl+R)
4. Temps de chargement devrait passer de ~1s à ~100ms

---

### **Phase 3 : Activer Page Détail Bien (10 minutes)**

**Créer `services/propertyService.cached.ts` :**

```typescript
import { getOrSetCache } from "@/lib/cache/cache-aside";
import { createClient } from "@/utils/supabase/server";
import type { Property } from "@/types/property";

export async function getPropertyById(id: string): Promise<Property | null> {
  return getOrSetCache(
    `detail:${id}`,
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("properties")
        .select("*, profiles:owner_id(first_name, last_name, avatar_url)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Property;
    },
    {
      ttl: 3600, // 1 heure (propriété change rarement)
      namespace: "properties",
    }
  );
}
```

**Modifier `app/biens/[id]/page.tsx` :**

```typescript
// Importer le service caché
import { getPropertyById } from "@/services/propertyService.cached";
```

---

### **Phase 4 : Activer Recherche (10 minutes)**

**Créer version cachée des filtres dans `propertyService.cached.ts` :**

```typescript
export async function getPropertiesByCity(city: string): Promise<Property[]> {
  return getOrSetCache(
    `city:${city}`,
    async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("city", city)
        .eq("status", "disponible");

      return data || [];
    },
    { ttl: 600, namespace: "properties" } // 10 minutes
  );
}
```

---

### **Phase 5 : Invalidation Cache (20 minutes)**

**Important :** Quand un propriétaire modifie un bien, il faut invalider le cache !

**Dans `app/_actions/properties.ts` (ou vos Server Actions) :**

```typescript
import { invalidateCacheBatch } from "@/lib/cache/cache-aside";

export async function updateProperty(id: string, data: any) {
  // 1. Update DB
  const { error } = await supabase
    .from("properties")
    .update(data)
    .eq("id", id);

  if (error) throw error;

  // 2. 📢 INVALIDER CACHE IMMÉDIATEMENT
  await invalidateCacheBatch(
    [
      "all_sections", // Homepage
      `detail:${id}`, // Détail du bien
      `city:${data.city}`, // Filtres ville
      "popular_locations_8", // Section locations
      "properties_for_sale_8", // Section ventes
      "land_for_sale_8", // Section terrains
    ],
    "homepage"
  );

  // Invalider namespace properties aussi
  await invalidateCacheBatch(
    [`detail:${id}`, `city:${data.city}`],
    "properties"
  );

  return { success: true };
}
```

**Clés à invalider selon l'action :**

| Action | Clés à invalider |
|--------|------------------|
| Nouveau bien | `all_sections`, `city:X`, `popular_locations_8` |
| Modification bien | `all_sections`, `detail:ID`, `city:X` |
| Suppression bien | `all_sections`, `detail:ID`, `city:X` |
| Changement statut | `all_sections`, `detail:ID` |

---

### **Phase 6 : Verrous Paiements (30 minutes)**

**Dans les Server Actions de paiement :**

```typescript
import { withLock } from "@/lib/cache/distributed-locks";

export async function payRent(leaseId: string, amount: number) {
  const result = await withLock(
    `payment:${leaseId}`,
    async () => {
      // 1. Vérifier que le paiement n'existe pas déjà
      const { data: existing } = await supabase
        .from("rental_payments")
        .select("id")
        .eq("lease_id", leaseId)
        .eq("month", getCurrentMonth())
        .maybeSingle();

      if (existing) {
        throw new Error("Paiement déjà effectué pour ce mois");
      }

      // 2. Créer le paiement PayDunya
      const invoice = await createPayDunyaInvoice({ amount, leaseId });

      // 3. Enregistrer dans DB
      const { data: payment } = await supabase
        .from("rental_payments")
        .insert({
          lease_id: leaseId,
          amount,
          status: "pending",
          paydunya_invoice_id: invoice.id,
        })
        .select()
        .single();

      return { paymentId: payment.id, invoiceUrl: invoice.url };
    },
    {
      expireSeconds: 30, // Max 30s pour traiter
      retries: 1, // Pas de réessai automatique
    }
  );

  if (!result.success) {
    return { error: result.error };
  }

  return result.data;
}
```

---

## 📊 Monitoring & Métriques

### **Vérifier que le cache fonctionne**

**Dans les logs de dev :**

```bash
# Logs attendus (avec debug: true)
🐌 CACHE MISS: homepage:all_sections (fetching from DB...)
💾 CACHE SET: homepage:all_sections (TTL: 300s)

# 2ème chargement
🚀 CACHE HIT: homepage:all_sections
```

### **Mesurer les performances**

**Avant cache (sans Redis) :**
```
Homepage load time: ~800-1200ms
DB queries: 3-5 requêtes
Latence moyenne: 250ms
```

**Après cache (avec Redis) :**
```
Homepage load time: ~50-150ms (1er hit: ~300ms)
DB queries: 0 (après 1er hit)
Latence moyenne: 5ms
Gain: 95-98% réduction
```

---

## 🐛 Troubleshooting

### **Erreur : "Redis connection refused"**

```bash
# Vérifier que Redis/Valkey tourne
docker ps | grep valkey

# Si pas de résultat, relancer
docker start valkey

# Ou relancer depuis zéro
docker run -d --name valkey -p 6379:6379 valkey/valkey
```

### **Erreur : "Cache not working, still slow"**

**Checklist :**
1. ✅ Redis tourne ? → `docker ps`
2. ✅ REDIS_URL dans .env.local ? → `cat .env.local | grep REDIS`
3. ✅ Import correct ? → Vérifier `.cached` dans import
4. ✅ Logs visibles ? → Ajouter `debug: true` dans options

### **Données obsolètes (cache "stale")**

**Solutions :**

1. **Forcer invalidation manuelle :**
```bash
# Vider tout le cache (dev only)
docker exec -it valkey redis-cli FLUSHDB
```

2. **Réduire TTL temporairement :**
```typescript
// Dans le service
ttl: 60, // 1 minute au lieu de 300
```

3. **Vérifier invalidation dans Server Actions** (voir Phase 5)

---

## 🎯 Checklist d'Activation Complète

- [ ] **Phase 1** : Redis installé et testé ✅
  - [ ] Docker Valkey tourne OU Upstash configuré
  - [ ] `npx tsx scripts/test-redis.ts` passe tous les tests
  - [ ] Variables dans `.env.local`

- [ ] **Phase 2** : Homepage cachée ✅
  - [ ] Import `.cached` dans `app/page.tsx`
  - [ ] Logs cache HIT/MISS visibles
  - [ ] Temps de chargement réduit

- [ ] **Phase 3** : Page détail cachée ✅
  - [ ] Service `propertyService.cached.ts` créé
  - [ ] Import dans `app/biens/[id]/page.tsx`
  - [ ] TTL 1h configuré

- [ ] **Phase 4** : Recherche cachée ✅
  - [ ] Filtres par ville cachés
  - [ ] TTL 10 min configuré

- [ ] **Phase 5** : Invalidation active ✅
  - [ ] Server Actions mises à jour
  - [ ] Clés invalidées après chaque mutation
  - [ ] Testé manuellement (modifier bien → cache invalidé)

- [ ] **Phase 6** : Verrous paiements ✅
  - [ ] `withLock` dans actions paiements
  - [ ] Testé double-clic (2ème rejeté)
  - [ ] Logs verrous visibles

- [ ] **Monitoring** ✅
  - [ ] Cache hit rate > 90%
  - [ ] Latence P50 < 10ms
  - [ ] 0 double paiements en 1 semaine

---

## 🔄 Rollback (Retour en arrière)

**Si problème, désactiver rapidement le cache :**

```typescript
// app/page.tsx
// AVANT (cache activé)
import { getHomePageSections } from "@/services/homeService.cached";

// APRÈS (cache désactivé)
import { getHomePageSections } from "@/services/homeService";
```

**Le site continue de fonctionner normalement** (juste plus lent).

---

## 📚 Ressources

- **Guide complet :** [REDIS_CACHE_STRATEGY.md](REDIS_CACHE_STRATEGY.md)
- **Exemples de code :** [lib/cache/examples.ts](lib/cache/examples.ts)
- **Tests :** `npx tsx scripts/test-redis.ts`
- **Architecture :** [ARCHITECTURE_CACHE.txt](ARCHITECTURE_CACHE.txt)

---

**🎉 Temps total estimé : 1-2 heures pour activation complète avec monitoring**

*Dernière mise à jour : 1er Janvier 2026*
