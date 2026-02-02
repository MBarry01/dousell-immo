## 📊 Architecture Audit Report (Janvier 2026)

### 1. Executive Summary
- **Project**: Dousell Immo
- **Stack**: Next.js 16, Supabase, Redis (Upstash), PayDunya/KKiaPay
- **Overall Health**: **Healthy** (Structure propre, mais nécessite une unification de la logique métier).
- **Lines of Code**: ~30,000 LOC (Estimation basée sur les dossiers `app`, `lib`, `components`).

### 2. ✅ Strengths
- **Système de Permissions Granulaire**: Bonne séparation entre rôles globaux (Admin/Agent) et rôles d'équipe (Owner/Manager).
- **Infrastructure de Cache prête**: Le client Redis est bien implémenté avec support multi-env (Upstash/local).
- **Mobile-Ready**: Utilisation de composants réactifs et attention portée aux performances UI (60fps).

### 3. ⚠️ Issues (Priorisées)

#### 🔴 Critical (Fix immédiat requis)
- **Logique Finance Dupliquée**: La page `ComptabilitePage` ré-implémente les calculs de KPIs loyers au lieu d'utiliser `lib/finance.ts`. Risque d'incohérence des chiffres à court terme.
- **Authentification Faible (Webhook KKiaPay)**: Le webhook n'impose pas strictement la présence d'un secret en production, ce qui pourrait permettre l'injection de fausses transactions réussies.

#### 🟠 High (Fix dans la semaine)
- **Absence de Mise en Cache Serveur**: Les KPIs financiers (très gourmands en requêtes) sont recalculés côté client à chaque montage de page sans utiliser le cache Redis disponible.
- **God-Mode Hardcodé**: L'adresse `barrymohamadou98@gmail.com` est codée en dur dans les fichiers de permissions. Devrait être dans une variable d'environnement (`SUPER_ADMIN_EMAIL`).

#### 🟡 Medium (Amélioration continue)
- **RLS via Email**: L'utilisation du `tenant_email` dans les politiques RLS est moins robuste que `auth.uid()`.
- **Logiciel vs UI**: Trop de logique métier complexe réside dans les `useMemo` des composants React au lieu d'être dans des services purs.

### 4. 🎯 Action Plan
1. **Unification Finance**: Centraliser tout calcul de KPI dans `lib/finance.ts` et supprimer la logique locale des pages.
2. **Activation Cache Redis**: Implémenter le pattern **Cache-Aside** pour les requêtes de baux et transactions dans `lib/finance.ts`.
3. **Sécurisation Webhooks**: Rendre la validation du secret obligatoire dans `api/kkiapay/webhook`.
4. **Configuration Admin**: Déplacer l'email du super-admin dans le `.env.local`.

### 5. 📁 Files to Review
- [lib/finance.ts](file:///c:/Users/Barry/Downloads/Doussel_immo/lib/finance.ts)
- [app/(webapp)/gestion-locative/comptabilite/page.tsx](file:///c:/Users/Barry/Downloads/Doussel_immo/app/(webapp)/gestion-locative/comptabilite/page.tsx)
- [api/kkiapay/webhook/route.ts](file:///c:/Users/Barry/Downloads/Doussel_immo/app/(vitrine)/api/kkiapay/webhook/route.ts)
- [lib/permissions.ts](file:///c:/Users/Barry/Downloads/Doussel_immo/lib/permissions.ts)
