# ✅ Checklist de Déploiement - Dousell Immo

## 📋 Avant de pousser sur GitHub/Vercel

### **1. Build local**
```bash
npm run build
```
✅ **Résultat attendu :** Build réussi sans erreur

### **2. Test en local**
```bash
npm run dev
```
- ✅ La carte Leaflet s'affiche avec les tuiles géographiques
- ✅ Aucune erreur CSP dans la console
- ✅ Les images externes (Pexels/Unsplash) se chargent
- ✅ Les photos de profil Google s'affichent
- ✅ Les 32+ propriétés sont visibles sur la page `/recherche`
- ✅ Le géocodage automatique fonctionne lors du dépôt d'annonce

### **3. Nettoyage du service worker (important !)**
Avant de tester, nettoie le service worker :
1. DevTools (`F12`) → **Application** → **Service Workers**
2. Clique sur **Unregister**
3. Recharge avec `Ctrl+Shift+R`

---

## 🔐 Variables d'environnement Vercel

Vérifie que ces variables sont bien configurées dans Vercel :

### **Supabase**
```env
NEXT_PUBLIC_SUPABASE_URL=https://blyanhulvwpdfpezlaji.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (SECRET!)
```

### **Email (Gmail SMTP)**
```env
GMAIL_USER=votre-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx (16 caractères)
ADMIN_EMAIL=admin@dousell-immo.com
```

### **PayDunya**
```env
PAYDUNYA_MASTER_KEY=votre-master-key
PAYDUNYA_PRIVATE_KEY=votre-private-key
PAYDUNYA_PUBLIC_KEY=votre-public-key
PAYDUNYA_TOKEN=votre-token
```

### **Cloudflare Turnstile**
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=votre-site-key
TURNSTILE_SECRET_KEY=votre-secret-key
```

### **Google Analytics (optionnel)**
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

📚 **Documentation complète :** `docs/VERCEL-ENV-VARIABLES.md`

---

## 🚀 Déploiement

### **1. Commit et push**
```bash
git add .
git commit -m "fix(csp): résolution des violations CSP pour carte et images externes"
git push origin main
```

### **2. Vérification automatique Vercel**
Vercel détecte automatiquement le push et lance un build. Vérifie que :
- ✅ Build réussi (temps estimé : 2-3 min)
- ✅ Aucune erreur de compilation
- ✅ Deployment URL générée

### **3. Test en production**
Va sur l'URL de production et vérifie :
- ✅ La carte s'affiche correctement
- ✅ Aucune erreur CSP dans la console (F12)
- ✅ Les emails de contact fonctionnent
- ✅ Le dépôt d'annonce avec géocodage fonctionne
- ✅ Les 32+ propriétés sont visibles

### **4. Forcer le rechargement du service worker**
Pour les utilisateurs existants :
1. Ouvre DevTools (`F12`) → **Application** → **Service Workers**
2. Vérifie que "dousell-immo-v2" est bien actif
3. Clique sur **Update**
4. Recharge la page

**Note :** Les nouveaux visiteurs obtiendront automatiquement la dernière version.

---

## 🐛 Dépannage

### **Problème : Les emails ne sont pas reçus en production**
✅ **Solution :** Vérifie les variables `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ADMIN_EMAIL` dans Vercel  
📚 Voir : `docs/FIX-EMAIL-PRODUCTION.md`

### **Problème : La carte ne s'affiche pas (fond noir)**
✅ **Solution :** Nettoie le cache du service worker (voir section 3 ci-dessus)  
📚 Voir : `docs/CSP-FIXES.md`

### **Problème : Erreurs CSP dans la console**
✅ **Solution :** Vérifie que `next.config.ts` inclut tous les domaines nécessaires  
📚 Voir : `docs/CSP-FIXES.md`

### **Problème : Seulement 12 propriétés au lieu de 32+**
✅ **Solution :** Vérifie que `app/recherche/page.tsx` utilise `getProperties({})` et non `getLatestProperties(12)`

### **Problème : Les propriétés n'ont pas de coordonnées**
✅ **Solution :** Lance le script de migration :
```bash
npx tsx scripts/update-coordinates.ts
```

---

## 📊 État actuel du projet

### **✅ Fonctionnalités implémentées**
- Géocodage automatique avec Nominatim (OpenStreetMap)
- Fallback régional pour les adresses non trouvées
- Carte Leaflet interactive avec tuiles CartoDB Dark Matter
- Affichage de toutes les propriétés approuvées (pas de limite)
- Service Worker optimisé (exclut ressources externes)
- Content Security Policy complète et sécurisée
- Email transactionnel avec Gmail SMTP

### **⚠️ Warnings non bloquants**
- Multiple GoTrueClient instances (Supabase Auth)
- Realtime non activé pour `user_roles`
- PWA Install Banner intercepté

📚 Voir `docs/CSP-FIXES.md` pour les détails

---

## 📝 Changelog récent

### **28 novembre 2025**
- ✅ Résolution des violations CSP pour `img-src` et `connect-src`
- ✅ Refactoring du service worker (exclusion ressources externes)
- ✅ Ajout de tous les sous-domaines CartoDB (a, b, c, d)
- ✅ Ajout de `cdnjs.cloudflare.com` pour icônes Leaflet
- ✅ Ajout de `www.googletagmanager.com` et `*.googleusercontent.com`
- ✅ Documentation complète CSP (`docs/CSP-FIXES.md`)
- ✅ Migration de 26 propriétés avec coordonnées GPS

### **27 novembre 2025**
- ✅ Implémentation du géocodage automatique
- ✅ Création du service `lib/geocoding.ts`
- ✅ Script de migration `scripts/update-coordinates.ts`
- ✅ Fallback régional `constants/coordinates.ts`
- ✅ Intégration dans le formulaire de dépôt

---

## 🔄 Prochaines étapes (optionnel)

### **Performance**
- [ ] Activer Realtime pour la table `user_roles`
- [ ] Singleton Supabase client pour éviter multiples instances
- [ ] Lazy loading des composants lourds

### **Fonctionnalités**
- [ ] Page d'administration pour gérer les coordonnées manuellement
- [ ] Filtres géographiques sur la carte (rayon de recherche)
- [ ] Clustering des marqueurs pour grandes quantités de propriétés

### **Monitoring**
- [ ] Sentry pour le suivi des erreurs en production
- [ ] Dashboard Vercel Analytics activé
- [ ] Logs Supabase pour debugging

---

## 📚 Documentation

- **Configuration environnement :** `docs/VERCEL-ENV-VARIABLES.md`
- **Corrections CSP :** `docs/CSP-FIXES.md`
- **Emails production :** `docs/FIX-EMAIL-PRODUCTION.md`
- **Architecture projet :** `docs/ARCHITECTURE.md` (si existe)

---

**Prêt pour le déploiement !** 🚀✨

**Dernière vérification :** 28 novembre 2025









