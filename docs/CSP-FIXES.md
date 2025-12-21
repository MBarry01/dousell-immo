# 🔒 Corrections CSP (Content Security Policy)

## 📝 Problème initial

La carte Leaflet et les ressources externes (images Pexels/Unsplash, Google User Content, Google Analytics) étaient bloquées par la Content Security Policy, causant des erreurs dans la console :

```
❌ Connecting to 'https://basemaps.cartocdn.com/...' violates CSP directive "connect-src"
❌ Connecting to 'https://www.googletagmanager.com/...' violates CSP directive "connect-src"
❌ Loading the image '<URL>' violates CSP directive "img-src"
❌ Uncaught (in promise) TypeError: Failed to convert value to 'Response'
```

---

## ✅ Solutions appliquées

### 1. **Mise à jour de `next.config.ts`**

#### **a) Directive `img-src`**
Ajout des domaines pour :
- Tuiles de carte CartoDB avec tous les sous-domaines (`a`, `b`, `c`, `d`)
- CDN Cloudflare pour les icônes Leaflet
- Images externes (Pexels, Unsplash, Google User Content)

```typescript
"img-src 'self' blob: data: https://*.supabase.co https://images.unsplash.com https://images.pexels.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.basemaps.cartocdn.com https://*.openstreetmap.org https://cdnjs.cloudflare.com https://a.basemaps.cartocdn.com https://b.basemaps.cartocdn.com https://c.basemaps.cartocdn.com https://d.basemaps.cartocdn.com"
```

#### **b) Directive `connect-src`**
Ajout des domaines pour :
- Google Tag Manager (`www.googletagmanager.com`)
- Google User Content (`*.googleusercontent.com`)
- Tuiles de carte (CartoDB, OpenStreetMap)
- Images externes (Pexels, Unsplash)

```typescript
"connect-src 'self' https://*.supabase.co https://*.supabase.in https://challenges.cloudflare.com https://*.google-analytics.com https://www.googletagmanager.com https://va.vercel-scripts.com https://*.basemaps.cartocdn.com https://*.openstreetmap.org https://images.unsplash.com https://images.pexels.com https://*.googleusercontent.com wss://*.supabase.co"
```

### 2. **Refactoring du Service Worker (`public/sw.js`)**

Le service worker essayait d'intercepter et de cacher les ressources externes, ce qui causait des violations CSP.

#### **Changement clé :**
Au lieu d'utiliser `event.respondWith(fetch(...))` pour les ressources externes, le service worker **ne fait rien** (`return;`), ce qui laisse le navigateur gérer ces requêtes directement.

#### **Liste des domaines exclus du cache :**
```javascript
const externalDomains = [
  "images.pexels.com",
  "images.unsplash.com",
  "plus.unsplash.com",
  "googleusercontent.com",    // Photos de profil Google
  "googletagmanager.com",     // Google Tag Manager
  "google-analytics.com",     // Google Analytics
  "basemaps.cartocdn.com",    // Tuiles de carte
  "openstreetmap.org",        // Tuiles de carte
  "supabase.co",              // Backend Supabase
  "supabase.in",              // Backend Supabase
  "cloudflare.com",           // Cloudflare Turnstile
  "vercel-scripts.com",       // Vercel Analytics
];
```

#### **Logique simplifiée :**
```javascript
// Vérifie si l'URL contient un des domaines externes
const isExternalResource = externalDomains.some((domain) => 
  url.hostname.includes(domain)
);

// Pour les ressources externes, laisser le navigateur gérer directement
if (isExternalResource) {
  return; // Ne PAS intercepter avec le service worker
}
```

---

## 🧪 Comment tester

### **1. Nettoyer le cache du service worker**

Le service worker est persistant dans le navigateur. Pour appliquer les changements :

**Dans Chrome/Edge/Brave :**
1. Ouvre DevTools (`F12`)
2. Va dans **Application** → **Service Workers**
3. Clique sur **Unregister** à côté de "dousell-immo-v2"
4. Recharge la page en **mode hard refresh** : `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)

**OU simplement :**
1. DevTools (`F12`) → **Application** → **Clear storage**
2. Coche **Unregister service workers**
3. Clique **Clear site data**
4. Recharge la page

### **2. Vérifier la console**

Après le rechargement, tu ne devrais **PLUS VOIR** :
```
❌ Connecting to '...' violates the following Content Security Policy directive
❌ Failed to convert value to 'Response'
❌ Loading the image '...' violates CSP directive "img-src"
```

### **3. Vérifier que tout fonctionne**
- ✅ La carte Leaflet s'affiche avec les tuiles géographiques
- ✅ Les marqueurs de prix sont visibles
- ✅ Les images externes (Pexels/Unsplash) se chargent
- ✅ Les photos de profil Google se chargent
- ✅ Google Analytics fonctionne sans erreur

---

## 📊 Statut des domaines autorisés

### **Images (`img-src`)**
| Domaine | Raison |
|---------|--------|
| `*.supabase.co` | Images uploadées par les utilisateurs |
| `images.pexels.com` | Images de stock gratuites |
| `images.unsplash.com` | Images de stock gratuites |
| `*.googleusercontent.com` | Photos de profil Google OAuth |
| `*.basemaps.cartocdn.com` | Tuiles de carte (wildcard) |
| `a/b/c/d.basemaps.cartocdn.com` | Tuiles de carte (sous-domaines) |
| `*.openstreetmap.org` | Tuiles de carte alternative |
| `cdnjs.cloudflare.com` | Icônes Leaflet |

### **Connexions (`connect-src`)**
| Domaine | Raison |
|---------|--------|
| `*.supabase.co` | API Backend |
| `*.supabase.in` | API Backend (alternative) |
| `wss://*.supabase.co` | WebSocket Realtime |
| `www.googletagmanager.com` | Google Tag Manager / Analytics |
| `*.google-analytics.com` | Google Analytics |
| `*.googleusercontent.com` | Photos de profil Google |
| `*.basemaps.cartocdn.com` | Tuiles de carte |
| `*.openstreetmap.org` | Tuiles de carte |
| `images.unsplash.com` | Images Unsplash |
| `images.pexels.com` | Images Pexels |
| `challenges.cloudflare.com` | Cloudflare Turnstile |
| `va.vercel-scripts.com` | Vercel Analytics |

---

## 🚀 Déploiement

Lors du prochain déploiement sur Vercel :
1. Les nouvelles règles CSP seront appliquées automatiquement
2. Le nouveau service worker sera téléchargé par les utilisateurs
3. Les utilisateurs devront recharger la page une fois pour obtenir la nouvelle version

---

## ⚠️ Avertissements restants (non bloquants)

Ces avertissements peuvent encore apparaître mais ne sont **pas bloquants** :

### **1. Multiple GoTrueClient instances**
```
Multiple GoTrueClient instances detected in the same browser context.
```
**Cause :** Plusieurs instances de Supabase Auth créées (probablement client + middleware).  
**Impact :** Aucun, juste un warning de performance.  
**Solution (optionnelle) :** Utiliser un singleton Supabase client.

### **2. Realtime non activé**
```
⚠️ Impossible de s'abonner aux changements de rôles. Realtime peut ne pas être activé.
⚠️ Erreur d'abonnement au canal Realtime. Realtime peut ne pas être activé.
```
**Cause :** Supabase Realtime n'est pas activé pour la table `user_roles`.  
**Impact :** Les changements de rôles ne sont pas mis à jour en temps réel (nécessite un refresh).  
**Solution (optionnelle) :** Activer Realtime dans Supabase Dashboard pour la table `user_roles`.

### **3. PWA Install Banner**
```
Banner not shown: beforeinstallpromptevent.preventDefault() called.
```
**Cause :** L'événement d'installation PWA est intercepté mais pas déclenché.  
**Impact :** Aucun, c'est le comportement attendu si tu gères manuellement l'installation PWA.  
**Solution :** Aucune action requise.

---

## 📚 Ressources

- [MDN - Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Leaflet CSP Configuration](https://leafletjs.com/reference.html#map-option)

---

**Date de dernière mise à jour :** 28 novembre 2025









