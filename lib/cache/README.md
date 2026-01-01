# 📦 Lib Cache - Dousell Immo

## 🎯 Vue d'ensemble

Ce dossier contient l'implémentation complète du système de cache Redis/Valkey pour Dousell Immo.

**Pattern utilisé :** Cache-Aside (Lazy Loading) avec invalidation intelligente

**Gain attendu :** 98% de réduction de latence (300ms → 5ms)

---

## 📁 Structure des Fichiers

```
lib/cache/
├── redis-client.ts          # Client Redis multi-environnement
├── cache-aside.ts            # Pattern Cache-Aside + invalidation
├── distributed-locks.ts      # Verrous pour concurrence
├── examples.ts               # 7 exemples concrets Dousell
└── README.md                 # Ce fichier
```

---

## 🚀 Quick Start (3 étapes)

### **1. Installer Redis**

```bash
# Docker (dev local)
docker run -d --name valkey -p 6379:6379 valkey/valkey

# .env.local
echo "REDIS_URL=redis://localhost:6379" >> .env.local
```

### **2. Tester la connexion**

```bash
npx tsx scripts/test-redis.ts
```

### **3. Utiliser dans votre code**

```typescript
import { getOrSetCache } from "@/lib/cache/cache-aside";

const data = await getOrSetCache(
  "my_key",
  async () => {
    // Cette fonction ne s'exécute que si cache vide
    const { data } = await supabase.from("table").select("*");
    return data;
  },
  { ttl: 300 } // 5 minutes
);
```

---

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| [REDIS_CACHE_STRATEGY.md](../../REDIS_CACHE_STRATEGY.md) | Guide complet (800 lignes) |
| [CACHE_ACTIVATION_GUIDE.md](../../CACHE_ACTIVATION_GUIDE.md) | Activation progressive |
| [CACHE_IMPLEMENTATION_SUMMARY.md](../../CACHE_IMPLEMENTATION_SUMMARY.md) | Résumé exécutif |
| [ARCHITECTURE_CACHE.txt](../../ARCHITECTURE_CACHE.txt) | Schémas visuels |

---

## 🔧 API Reference

### **redis-client.ts**

Client unifié qui s'adapte automatiquement à l'environnement :

```typescript
import { redis } from "@/lib/cache/redis-client";

// GET
const value = await redis.get("key");

// SET with TTL
await redis.set("key", "value", 3600); // 1 heure

// DELETE
await redis.del("key");

// EXISTS
const exists = await redis.exists("key");
```

**Environnements supportés :**
- Vercel → Upstash Redis (HTTP serverless)
- Serveur dédié → Valkey/Redis (TCP ultra-rapide)
- Dev local → Docker Valkey

---

### **cache-aside.ts**

Pattern Cache-Aside avec 3 fonctions principales :

#### **1. getOrSetCache<T>** (Read-Through)

```typescript
import { getOrSetCache } from "@/lib/cache/cache-aside";

const properties = await getOrSetCache<Property[]>(
  "all_properties",
  async () => {
    // Fetcher DB (appelé uniquement si cache MISS)
    const { data } = await supabase.from("properties").select("*");
    return data || [];
  },
  {
    ttl: 300, // 5 minutes (défaut: 3600)
    namespace: "properties", // Namespace (défaut: "dousell")
    debug: true, // Logs détaillés (défaut: false)
  }
);
```

#### **2. invalidateCache** (Single Key)

```typescript
import { invalidateCache } from "@/lib/cache/cache-aside";

// Invalider une clé simple
await invalidateCache("all_properties", "properties");

// Avec pattern (wildcard)
await invalidateCache("city:*", "properties"); // Toutes les villes
```

#### **3. invalidateCacheBatch** (Multiple Keys)

```typescript
import { invalidateCacheBatch } from "@/lib/cache/cache-aside";

// Invalider plusieurs clés en une fois
await invalidateCacheBatch(
  ["all_properties", "city:Dakar", "city:Thies"],
  "properties"
);
```

---

### **distributed-locks.ts**

Verrous distribués pour éviter race conditions :

#### **1. withLock** (Recommandé - Auto-release)

```typescript
import { withLock } from "@/lib/cache/distributed-locks";

const result = await withLock(
  "payment:lease123",
  async () => {
    // Code protégé par verrou
    await processPayment(leaseId);
    return { paymentId: "pay_789" };
  },
  {
    expireSeconds: 30, // TTL verrou (défaut: 10)
    retries: 3, // Nombre de retry (défaut: 3)
    retryDelay: 100, // Délai retry en ms (défaut: 100)
  }
);

if (!result.success) {
  console.error(result.error); // "Opération déjà en cours..."
  return;
}

console.log(result.data); // { paymentId: "pay_789" }
```

#### **2. acquireLock / releaseLock** (Manuel)

```typescript
import { acquireLock, releaseLock } from "@/lib/cache/distributed-locks";

const hasLock = await acquireLock("payment:lease123", { expireSeconds: 30 });

if (!hasLock) {
  return { error: "Opération déjà en cours" };
}

try {
  // Code protégé
  await processPayment();
} finally {
  // TOUJOURS relâcher, même si erreur
  await releaseLock("payment:lease123");
}
```

#### **3. isLocked** (Debug)

```typescript
import { isLocked } from "@/lib/cache/distributed-locks";

const locked = await isLocked("payment:lease123");
console.log(locked); // true ou false
```

---

## 💡 Exemples d'Utilisation

### **Cas 1 : Homepage avec cache**

```typescript
// services/homeService.cached.ts
import { getOrSetCache } from "@/lib/cache/cache-aside";

export async function getHomePageSections() {
  return getOrSetCache(
    "all_sections",
    async () => {
      const [locations, ventes, terrains] = await Promise.all([
        getPopularLocations(),
        getPropertiesForSale(),
        getLandForSale(),
      ]);
      return { locations, ventes, terrains };
    },
    { ttl: 300, namespace: "homepage" }
  );
}
```

### **Cas 2 : Server Action avec invalidation**

```typescript
// app/_actions/properties.ts
import { invalidateCacheBatch } from "@/lib/cache/cache-aside";

export async function updateProperty(id: string, data: any) {
  // 1. Update DB
  await supabase.from("properties").update(data).eq("id", id);

  // 2. Invalider cache
  await invalidateCacheBatch(
    ["all_sections", `detail:${id}`, `city:${data.city}`],
    "homepage"
  );

  return { success: true };
}
```

### **Cas 3 : Paiement avec verrou**

```typescript
// app/_actions/payments.ts
import { withLock } from "@/lib/cache/distributed-locks";

export async function payRent(leaseId: string) {
  return withLock(
    `payment:${leaseId}`,
    async () => {
      // Protégé contre double-clic
      const payment = await createPayment(leaseId);
      return { paymentId: payment.id };
    },
    { expireSeconds: 30 }
  );
}
```

---

## 🎯 Bonnes Pratiques

### **1. TTL par type de données**

| Type | TTL | Raison |
|------|-----|--------|
| Liste propriétés | 5 min | Change rarement, beaucoup de lectures |
| Détail propriété | 1 h | Modifié 1x/semaine max |
| Stats dashboard | 30 min | Pas besoin temps réel |
| Créneaux visite | 2 min | Doit être frais |

### **2. Namespaces recommandés**

```typescript
"homepage"    // Sections homepage
"properties"  // Détails propriétés
"users"       // Profils utilisateurs
"dashboard"   // Stats propriétaires
"visits"      // Réservations visites
"rentals"     // Paiements loyers
```

### **3. Invalidation systématique**

**✅ TOUJOURS invalider après :**
- Création de bien
- Modification de bien
- Suppression de bien
- Changement de statut
- Approbation admin

**❌ NE PAS invalider pour :**
- Lectures simples
- Vues d'une page
- Logs / analytics

### **4. Verrous pour opérations critiques**

**✅ Utiliser verrous pour :**
- Paiements (éviter double débit)
- Réservations (éviter double booking)
- Génération de contrats (éviter doublons)
- Modifications concurrentes

**❌ PAS besoin de verrous pour :**
- Lectures simples
- Créations indépendantes
- Updates non-critiques

---

## 🐛 Troubleshooting

### **Erreur : "Redis connection refused"**

```bash
# Vérifier que Redis tourne
docker ps | grep valkey

# Relancer si nécessaire
docker start valkey
```

### **Cache ne fonctionne pas**

```typescript
// Activer debug mode
const data = await getOrSetCache(
  "key",
  fetcher,
  { debug: true } // Voir logs HIT/MISS
);
```

### **Données obsolètes**

```bash
# Vider cache (dev only)
docker exec -it valkey redis-cli FLUSHDB
```

---

## 📊 Monitoring

### **Logs à surveiller**

```
🚀 CACHE HIT: homepage:all_sections (5ms)
🐌 CACHE MISS: properties:detail:123 (287ms)
💾 CACHE SET: properties:detail:123 (TTL: 3600s)
🔒 LOCK ACQUIRED: payment:lease456 (30s)
🔓 LOCK RELEASED: payment:lease456
```

### **Métriques clés**

```typescript
// Hit Rate (objectif: >90%)
const hitRate = (hits / (hits + misses)) * 100;

// Latence P50 (objectif: <10ms)
const p50Latency = measureLatency();
```

---

## 🔗 Liens Utiles

- **Redis Docs** : https://redis.io/docs/latest/
- **Upstash** : https://upstash.com/docs/redis
- **Valkey** : https://github.com/valkey-io/valkey
- **Cache-Aside Pattern** : https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside

---

**🎉 Système de cache production-ready pour Dousell Immo !**

*Pour toute question, voir les docs complètes dans le dossier racine.*
