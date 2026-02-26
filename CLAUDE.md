# CLAUDE.md - Dousell Immo Project Memory

> **System Instruction**: Always apply these rules before writing code or executing commands.

## 🧠 Core Philosophy (Plan & Coherence)

1. **No Scope Creep**: Restate the goal in 1 sentence before starting. If ambiguous, ASK.
2. **Minimal Changes**: Prefer refactor-in-place over rewriting. One change = one commit.
3. **Reuse First**: Search for existing components/utils (`grep`/`find`) before creating new ones.
4. **Validation**: Never assume. Check `minSdk`, existing dependencies, and types.
5. **Justification Obligatoire**: If creation is necessary, document in the code:
   - Why existing solutions were unsuitable.
   - Why the chosen approach is superior.
   - How it fits into the global architecture.

### Patterns à Respecter
- **Components**: One component per file (except very small sub-components).
- **Utilities**: One function = one responsibility.
- **Styles**: Use the existing system (Tailwind CSS, Outfit font).
- **Types**: Reuse existing interfaces/types; do not duplicate.

---

## 🏗️ Architecture & Discovery

### 1. Stack Identification
- **Framework**: Next.js 16 (App Router).
- **Database**: Supabase (Auth, DB, Realtime).
- **Styling**: Tailwind CSS + "Luxe & Teranga" Design System (Gold: `#F4C430`).
- **Cache**: Redis/Valkey (Cache-Aside pattern).

### 2. Structure mapping (Layer-based)
- **Presentation**: Pure UI components (SaaS/Vitrine).
- **Domain**: Business logic (Services, hooks, utilities).
- **Data**: Infrastructure (API clients, Database).
- **Check**: Are imports strictly top-to-bottom? (UI → Domain → Data).

---

## 🛡️ Security Gate (Security by Design)

### 1. Secrets & Safe Ops
- **No Secrets**: Never hardcode keys or commit `.env`. Use `process.env`.
- **Safe Ops**: Require confirmation for `rm -rf`, `drop table`, `delete`, or `sudo`.
- **Validation**: Strict Zod schemas for all Server Actions and API routes.

### 2. Database & Auth (Supabase/RLS)
- **RLS First**: Application filters are for UX; RLS is the final security barrier.
- **Auth**: Always verify `await getCurrentUser()` and roles (`lib/permissions.ts`) before sensitive actions.
- **Webhooks**: Always validate signatures for PayDunya and KKiaPay callbacks.

---

## 🔄 Data Flow & SEO Consistency

### 1. Single Source of Truth
- **Unified Types**: Define business entities (Bien, Locataire) once in `lib/types.ts`.
- **Shared Logic**: Reuse React Query hooks and Server Actions between Vitrine and SaaS.

### 2. Propagation & UX
- **Realtime**: Active subscriptions on `biens`, `locations`, `paiements`.
- **Invalidation**: Clear cache/revalidate routes after mutations.
- **Optimistic UI**: Use for all visible mutations (Likes, Status changes).

### 3. SEO Strategy
- **Vitrine**: Index/Follow + Canonicals + Structured Data (JSON-LD).
- **SaaS**: Strict `noindex, nofollow` via Middleware/Headers.

---

## 📱 Mobile Standards

- **Performance**: 60fps target. Virtualized lists. Lazy loading with blur placeholders.
- **UX**: Respect platform conventions (Bottom Nav on both, Back button on Android, Swipe-back on iOS).
- **Resilience**: Loading/Empty/Error states for every view. Offline-first fallback strategies.

---

## 👥 Team-Awareness (SaaS Specifics)

- **Permissions**: Verify if an action is for the individual or a `team_id`.
- **Branding**: Prioritize Team/Agency branding (Logo, Signature) over individual profile for contracts/invoices.

---

## 🛠️ Ops & Commands

- **Build**: `npm run build`
- **Quality**: `npm run quality` (Lint, Scan UI, Check Actions).
- **Diagnostics**: `npm run test:email`, `npm run test:signup`, `npm run test:redis`.

---

## 📜 Lessons Learned
- **Currency**: Field `prix` is an integer (centimes/smallest unit).
- **Logic**: French-first UX labels and messages.
- **Cache**: Always invalidate after mutation (Server Actions).

---

## 🧩 Skills (Domain Knowledge)

Skills are detailed documentation for complex subsystems. **Always read relevant skills before modifying these areas:**

| Skill | Path | When to read |
|-------|------|--------------|
| **Rental Payments** | `.agent/skills/rental-payments/SKILL.md` | Stripe payments, webhooks, `rental_transactions` |

**Load context workflow**: Run `/load_context` to auto-load all skills and project brain.
