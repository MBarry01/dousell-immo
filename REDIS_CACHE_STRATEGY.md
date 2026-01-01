# 🚀 Stratégie de Cache Redis/Valkey pour Dousell Immo

## 📅 Date : 1er Janvier 2026

---

## 🎯 Objectifs

**Problème actuel :**
- Temps de réponse Supabase : **200-300ms** par requête
- Homepage avec 1000 visiteurs/jour = **300 secondes de latence cumulée**
- Dashboard propriétaire : **5+ requêtes** = 1.5s de chargement

**Objectif avec Redis :**
- ✅ Réduire à **5ms** pour 95% des requêtes (Cache Hit)
- ✅ Protéger contre surcharge Supabase (rate limits)
- ✅ Éviter double paiement/réservation (verrous distribués)

**Gain attendu : 98% de réduction du temps de réponse** 🚀

---

## 🏗️ Architecture Multi-Environnement

### **Environnement 1 : Vercel (Actuel - Serverless)**

```bash
┌─────────────┐
│   Vercel    │
│  (France)   │
└──────┬──────┘
       │ HTTP/REST
       ↓
┌─────────────┐      ┌──────────────┐
│   Upstash   │ ←──→ │   Supabase   │
│ Redis (Edge)│      │  (Database)  │
└─────────────┘      └──────────────┘
```

**Avantages :**
- ✅ Pas de connexion TCP (évite cold starts)
- ✅ Pay-per-request (pas de serveur à gérer)
- ✅ Free tier : 10K requêtes/jour
- ✅ Edge-compatible (cache au plus près des users)

**Installation :**
```bash
npm install @upstash/redis
```

**Variables d'environnement (.env.local) :**
```env
# Upstash Redis (Vercel)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXX...XXX
```

---

### **Environnement 2 : Serveur Dédié Sénégal (Future Prod)**

```bash
┌─────────────────┐
│ Serveur Dakar   │
│   (Dedicated)   │
├─────────────────┤
│   Next.js App   │
│       ↓         │
│ Valkey (Local)  │ ←──→ Supabase
│   Port 6379     │
└─────────────────┘
```

**Avantages :**
- ✅ Latence ultra-faible (localhost = 0.5ms)
- ✅ Contrôle total (évictions, persistance, clustering)
- ✅ Pas de coûts API externes
- ✅ Open-source (Valkey = fork Redis)

**Installation :**

**Option A : Docker (Recommandé Dev)**
```bash
docker run -d --name valkey \
  -p 6379:6379 \
  --restart unless-stopped \
  valkey/valkey
```

**Option B : Installation Native (Linux)**
```bash
# Ubuntu/Debian
sudo apt-get install valkey

# Démarrage
sudo systemctl start valkey
sudo systemctl enable valkey
```

**Variables d'environnement (.env.production) :**
```env
# Valkey/Redis (Serveur Dédié)
REDIS_URL=redis://localhost:6379
# Ou distant :
# REDIS_URL=redis://user:password@dakar-server.com:6379
```

**Installation package :**
```bash
npm install ioredis
```

---

## 📚 Pattern Cache-Aside (Lazy Loading)

### Schéma de Fonctionnement

```
┌───────────┐
│  Request  │
└─────┬─────┘
      │
      ↓
┌─────────────────────────────────┐
│ 1. Check Redis Cache            │
│    GET properties:all_public    │
└───────┬─────────────────────────┘
        │
    ┌───┴───┐
    │ Hit?  │
    └───┬───┘
        │
    ┌───┴───────────────────────┐
    │ YES                   NO  │
    ↓                           ↓
┌────────────┐         ┌─────────────────┐
│ Return     │         │ 2. Query DB     │
│ Cached     │         │    (Supabase)   │
│ Data (5ms) │         └────────┬────────┘
└────────────┘                  │
                                ↓
                       ┌─────────────────┐
                       │ 3. Store in     │
                       │    Redis        │
                       │    SET + TTL    │
                       └────────┬────────┘
                                │
                                ↓
                       ┌─────────────────┐
                       │ 4. Return Data  │
                       │    (300ms)      │
                       └─────────────────┘
```

### Implémentation

**Fonction générique :**
```typescript
import { getOrSetCache } from '@/lib/cache/cache-aside';

const properties = await getOrSetCache(
  'all_properties_public',
  async () => {
    // Cette fonction ne s'exécute que si cache vide (MISS)
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'published');
    return data || [];
  },
  {
    ttl: 300, // 5 minutes
    namespace: 'properties',
  }
);
```

**Résultat :**
- 1er utilisateur : **300ms** (DB) → Cache rempli
- 100 suivants : **5ms** (Cache HIT)
- Après 5 min : Cache expiré → Reboucle

---

## 🔄 Invalidation Intelligente

### Le Problème du TTL

**❌ TTL seul ne suffit pas :**
- Propriétaire modifie le prix : **Fausse info pendant 5 minutes** 😱
- Locataire paie : **Le compteur n'est pas à jour**
- Visite réservée : **Toujours affiché comme disponible**

### Solution : Invalidation Événementielle

**Principe : Le "Chef crie dans la cuisine"** 📢

Quand une **modification** se produit, on **supprime** immédiatement les caches concernés.

**Exemple : Mise à jour d'une propriété**

```typescript
// Server Action (app/_actions/properties.ts)
import { invalidateCacheBatch } from '@/lib/cache/cache-aside';

export async function updateProperty(id: string, newData: any) {
  // 1. Mise à jour DB
  await supabase.from('properties').update(newData).eq('id', id);

  // 2. INVALIDATION IMMÉDIATE
  await invalidateCacheBatch(
    [
      'all_properties_public', // Liste globale
      `detail:${id}`, // Détail de ce bien
      `city:${newData.city}`, // Filtres par ville
    ],
    'properties'
  );

  return { success: true };
}
```

**Clés à invalider selon l'action :**

| Action | Clés à invalider |
|--------|------------------|
| Nouveau bien | `all_properties_public`, `city:X` |
| Modification bien | `all_properties_public`, `detail:ID`, `city:X` |
| Suppression bien | `all_properties_public`, `detail:ID`, `city:X` |
| Nouveau paiement | `payments:lease:ID`, `dashboard:ownerID` |
| Visite réservée | `available_slots:propertyID` |

---

## 🔒 Verrous Distribués (Distributed Locks)

### Le Problème de la Concurrence

**Scénario 1 : Double Paiement**
```
User 1 : Clic "Payer" (12:00:00.000)
User 1 : Clic "Payer" (12:00:00.050) <- Double clic accidentel

❌ Sans verrou :
  → 2 paiements créés dans PayDunya
  → Double débit bancaire
  → Refund manuel nécessaire

✅ Avec verrou :
  → 1er clic acquiert le verrou
  → 2ème clic rejeté ("Paiement en cours...")
  → Sécurité garantie
```

**Scénario 2 : Double Réservation de Visite**
```
User A : Réserve créneau 14h-15h
User B : Réserve créneau 14h-15h (en même temps)

❌ Sans verrou :
  → Les 2 SELECT passent (slot dispo)
  → Les 2 INSERT passent
  → Conflit : 2 personnes pour 1 créneau

✅ Avec verrou :
  → User A acquiert le verrou "visit:prop123:14h"
  → User B attend (retry)
  → User A crée la réservation
  → User A libère le verrou
  → User B voit que c'est pris
```

### Implémentation avec `withLock`

**Pattern recommandé (Auto-release) :**

```typescript
import { withLock } from '@/lib/cache/distributed-locks';

export async function payRent(leaseId: string, amount: number) {
  // Le verrou est géré automatiquement
  const result = await withLock(
    `payment:${leaseId}`,
    async () => {
      // Code protégé par verrou
      // Si ça plante, le verrou sera quand même libéré

      const { data } = await supabase
        .from('rental_payments')
        .insert({ lease_id: leaseId, amount });

      return { paymentId: data.id };
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

**Pattern manuel (Plus de contrôle) :**

```typescript
import { acquireLock, releaseLock } from '@/lib/cache/distributed-locks';

export async function bookVisit(propertyId: string, slot: string) {
  const lockKey = `visit:${propertyId}:${slot}`;

  // 1. Acquérir le verrou
  const hasLock = await acquireLock(lockKey, { expireSeconds: 10 });

  if (!hasLock) {
    return { error: "Quelqu'un réserve ce créneau en ce moment. Réessayez." };
  }

  try {
    // 2. Vérifier + Créer
    const { data } = await supabase
      .from('visit_bookings')
      .insert({ property_id: propertyId, slot });

    return { bookingId: data.id };
  } finally {
    // 3. TOUJOURS libérer, même si erreur
    await releaseLock(lockKey);
  }
}
```

---

## 📊 Stratégie de TTL par Type de Donnée

| Type de Donnée | TTL | Justification |
|---------------|-----|---------------|
| **Liste propriétés** | 5 min | Change rarement, beaucoup de lectures |
| **Détail propriété** | 1 heure | Modifié 1x/semaine max |
| **Stats dashboard** | 30 min | Pas besoin temps réel |
| **Résultats recherche** | 10 min | Filtres dynamiques |
| **Profil utilisateur** | 1 heure | Modifié rarement |
| **Disponibilités visite** | 2 min | Doit être assez frais |
| **Notifications** | 1 min | Temps quasi-réel |

**Règle d'or :**
> Plus c'est modifié souvent, plus le TTL doit être court.

---

## 🧪 Guide d'Installation & Tests

### Étape 1 : Choisir l'Environnement

**Dev Local (Docker Valkey) :**
```bash
# Lancer Valkey
docker run -d --name valkey -p 6379:6379 valkey/valkey

# Vérifier que ça tourne
docker logs valkey
# Devrait afficher : "Ready to accept connections"

# Installer le client Node.js
npm install ioredis

# .env.local
REDIS_URL=redis://localhost:6379
```

**Vercel (Upstash Redis) :**
```bash
# Créer un compte sur https://upstash.com (gratuit)
# Créer une database Redis (région : Europe)
# Copier les credentials

npm install @upstash/redis

# .env.local
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXX...XXX
```

### Étape 2 : Tester la Connexion

**Créer `scripts/test-redis.ts` :**
```typescript
import { redis } from '@/lib/cache/redis-client';

async function testRedis() {
  console.log('🧪 Test Redis Connection...\n');

  // Test 1 : SET
  await redis.set('test:hello', 'world', 10);
  console.log('✅ SET test:hello = "world"');

  // Test 2 : GET
  const value = await redis.get('test:hello');
  console.log(`✅ GET test:hello = "${value}"`);

  // Test 3 : EXISTS
  const exists = await redis.exists('test:hello');
  console.log(`✅ EXISTS test:hello = ${exists}`);

  // Test 4 : DEL
  await redis.del('test:hello');
  console.log('✅ DEL test:hello');

  console.log('\n🎉 Redis is working!\n');
}

testRedis().catch(console.error);
```

```bash
# Lancer le test
npx tsx scripts/test-redis.ts

# Output attendu :
# 🧪 Test Redis Connection...
# ✅ SET test:hello = "world"
# ✅ GET test:hello = "world"
# ✅ EXISTS test:hello = true
# ✅ DEL test:hello
# 🎉 Redis is working!
```

### Étape 3 : Implémenter sur une Page

**Exemple : Homepage avec cache**

```typescript
// app/page.tsx
import { getAllPropertiesPublic } from '@/lib/cache/examples';

export default async function HomePage() {
  // Au lieu d'appeler Supabase directement :
  // const properties = await getPropertiesFromDB();

  // On utilise la version cachée :
  const properties = await getAllPropertiesPublic();

  return (
    <div>
      <h1>Propriétés à Dakar</h1>
      {properties.map(p => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  );
}
```

**Observer les logs (dev) :**
```
1er chargement :
🐌 CACHE MISS: properties:all_properties_public (fetching from DB...)
💾 CACHE SET: properties:all_properties_public (TTL: 300s)

2ème chargement (dans les 5 min) :
🚀 CACHE HIT: properties:all_properties_public
```

### Étape 4 : Tester les Verrous

**Script de test :**
```typescript
// scripts/test-locks.ts
import { withLock } from '@/lib/cache/distributed-locks';

async function simulateDoubleClick() {
  console.log('🧪 Simulating double payment click...\n');

  // Simuler 2 clics simultanés
  const [result1, result2] = await Promise.all([
    withLock('payment:lease123', async () => {
      console.log('  💰 Payment 1: Processing...');
      await sleep(2000); // Simule traitement long
      return { id: 'pay1' };
    }),

    withLock('payment:lease123', async () => {
      console.log('  💰 Payment 2: Processing...');
      return { id: 'pay2' };
    }),
  ]);

  console.log('\n📊 Results:');
  console.log('Result 1:', result1);
  console.log('Result 2:', result2);
  console.log('\n✅ Only one payment should succeed!');
}

simulateDoubleClick();

// Output attendu :
// 🔒 LOCK ACQUIRED: lock:payment:lease123
// 💰 Payment 1: Processing...
// ⏳ Lock busy: lock:payment:lease123, retry 1/1
// ❌ LOCK FAILED: lock:payment:lease123
// 🔓 LOCK RELEASED: lock:payment:lease123
//
// Result 1: { success: true, data: { id: 'pay1' } }
// Result 2: { success: false, error: 'Opération déjà en cours...' }
```

---

## 🎯 Cas d'Usage Concrets pour Dousell

### 1. **Homepage - Liste des Biens** ⭐⭐⭐
- **Cache :** Oui (TTL 5 min)
- **Invalidation :** Quand nouveau bien publié
- **Impact :** 98% réduction latence

### 2. **Page Détail Bien** ⭐⭐⭐
- **Cache :** Oui (TTL 1h)
- **Invalidation :** Quand propriétaire modifie
- **Impact :** 95% réduction latence

### 3. **Recherche par Ville/Type** ⭐⭐
- **Cache :** Oui (TTL 10 min)
- **Invalidation :** Quand bien ajouté/modifié dans cette ville
- **Impact :** 90% réduction latence

### 4. **Dashboard Propriétaire** ⭐⭐⭐
- **Cache :** Oui (TTL 30 min)
- **Invalidation :** Quand nouveau paiement/bail
- **Impact :** 5 requêtes → 1 requête = 80% réduction

### 5. **Paiement de Loyer** ⭐⭐⭐
- **Cache :** Non (write operation)
- **Verrou :** OUI (30s)
- **Impact :** Évite 100% des doubles paiements

### 6. **Réservation de Visite** ⭐⭐⭐
- **Cache :** Créneaux dispo (TTL 2 min)
- **Verrou :** OUI (10s)
- **Invalidation :** Après chaque réservation

### 7. **Notifications** ⭐
- **Cache :** Oui (TTL 1 min)
- **Invalidation :** Quand nouvelle notif
- **Impact :** Modéré (peu de lectures répétées)

---

## 🚨 Points d'Attention & Limites

### ⚠️ Quand NE PAS utiliser le cache

1. **Données sensibles/critiques**
   - Soldes bancaires
   - Statuts de paiement (vérifier DB)
   - Documents légaux

2. **Données en temps réel strict**
   - Chat en direct (utiliser Supabase Realtime)
   - Notifications push immédiate

3. **Données à faible lecture**
   - Admin dashboard (1 user)
   - Pages rarement visitées

### ⚠️ Risques & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Redis down** | Cache fail | Fail-safe dans code (renvoie DB) |
| **Stale data** | Info obsolète | TTL courts + invalidation smart |
| **Memory overflow** | Redis plein | Politique d'éviction (LRU) |
| **Verrou bloqué** | Deadlock | TTL auto-expire (10-30s) |

---

## 📈 Monitoring & Métriques

### KPIs à Suivre

```typescript
// À ajouter dans lib/cache/cache-aside.ts
let cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
};

// Calculer le taux de hit
const hitRate = (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100;

// Objectif : 90%+ de hit rate
```

### Logs Recommandés

```
[CACHE] HIT   | properties:all_public | 5ms
[CACHE] MISS  | properties:detail:123 | 287ms (DB)
[CACHE] SET   | properties:detail:123 | TTL 3600s
[LOCK]  ACQUIRED | payment:lease456 | 10s
[LOCK]  RELEASED | payment:lease456
```

---

## 🎓 Prochaines Étapes

### Phase 1 : Foundation (Cette semaine)
- [x] Setup Redis client multi-env
- [x] Implémenter Cache-Aside pattern
- [x] Créer distributed locks
- [ ] Tester connexion Redis
- [ ] Implémenter sur 1 page (homepage)

### Phase 2 : Rollout (Semaine 2)
- [ ] Cache sur toutes les pages publiques
- [ ] Invalidation sur toutes les Server Actions
- [ ] Verrous sur paiements + réservations
- [ ] Monitoring basique (hit rate)

### Phase 3 : Optimisation (Semaine 3)
- [ ] Fine-tuning des TTL
- [ ] Cache warming (pré-remplir cache important)
- [ ] Redis clustering (si prod serveur)
- [ ] Alertes si hit rate < 80%

---

## 📚 Ressources

- **Redis Patterns** : https://redis.io/docs/latest/develop/use/patterns/
- **Upstash Docs** : https://upstash.com/docs/redis
- **Valkey GitHub** : https://github.com/valkey-io/valkey
- **Cache-Aside Pattern** : https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside

---

**🎉 Avec cette stratégie, Dousell Immo aura des performances dignes d'une plateforme de classe mondiale !**

*Dernière mise à jour : 1er Janvier 2026*
*Contributeur : Claude Sonnet 4.5*
