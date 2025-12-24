# CLAUDE.md - Dousell Immo Project Memory

## 1. Project Overview & Architecture
- **Project:** Dousell Immo (Plateforme Immo Luxe / Sénégal).
- **Stack:** Next.js 16 (App Router), Supabase (Auth, DB, Realtime), TypeScript, Tailwind CSS.
- **Design System:** "Luxe & Teranga". Dark Mode (`#000000`, `#121212`). Primary Color: `#F4C430` (Or). Font: Outfit.
- **Key Patterns:**
  - **Server Components:** Par défaut. Fetching côté serveur.
  - **Client Components:** Uniquement pour l'interactivité (`useState`, `onClick`).
  - **Server Actions:** Pour TOUTES les mutations (stockées dans `actions.ts`).
  - **ISR:** Revalidation toutes les 3600s.

## 2. Critical Development Rules (NON-NEGOTIABLE)
1. **File Edits:** NE JAMAIS réécrire un fichier entier si une modif partielle suffit. NE JAMAIS utiliser de commentaires "placeholder" (`// ... rest of code`).
2. **Language:** UX **Français-first**. Messages d'erreur et labels utilisateurs en français.
3. **Type Safety:** Pas de `any`. Validation Zod stricte pour toutes les Server Actions.
4. **Mobile First:** Utiliser `dvh` pour la hauteur. Classes : `flex-col md:flex-row`.
5. **Security:** Vérifier `await getCurrentUser()` et les rôles (`lib/permissions.ts`) avant toute action sensible.

## 3. Build, Test & Quality Gates
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Quality Check (Obligatoire avant commit):** `npm run quality`
  - *Comprend : Lint, Scan UI (Design System), Check Actions (Contrats).*
- **Scripts Qualité:**
  - UI Violations: `npm run scan:ui`
  - Server Actions Sécu: `npm run check:actions`
- **Scripts Diagnostics (TypeScript):**
  - Email: `npm run test:email` ou `npx tsx scripts/test-email.ts`
  - Signup: `npm run check:signup` ou `npx tsx scripts/check-signup-issues.ts`
  - Images: `npm run fix-images` ou `npx tsx scripts/fix-broken-images.ts`

## 4. Operational Knowledge (Dousell Specifics)
- **Certification:** Upload User -> Supabase Storage -> Admin Queue (`pending` -> `verified`).
- **Paiement:** PayDunya via `/api/paydunya`. Factures via `lib/invoice.ts`.
- **Emails:** Stratégie Double (Gmail Primaire / Supabase Fallback). Templates dans `emails/`.

## 5. Lessons Learned (Mise à jour dynamique)
- *Ajoutez ici les erreurs récurrentes pour ne plus les reproduire.*
- [Exemple: Attention, le champ 'prix' est en centimes (int), pas en float.]