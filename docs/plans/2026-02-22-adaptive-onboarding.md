# Adaptive Onboarding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a collapsible in-dashboard activation banner to `/gestion` that detects the user's current setup stage (bien → locataire/bail → complete) and guides them step-by-step until first quittance.

**Architecture:** Server Component layout injects stage into a Client Component banner. Stage is calculated live via 3 lightweight COUNT SQL queries. Banner collapses to a pill via localStorage. Disappears permanently after `activation_completed_at` is set on `teams`. Soft-lock badges on nav items show contextual nudges without blocking navigation. Locked module pages show an InlineNotice overlay on top of the existing (greyed) page content — user sees the reward waiting for them.

**Tech Stack:** Next.js App Router (Server + Client Components), Supabase SSR, Tailwind CSS, Framer Motion (already in project), direct `localStorage` (no hook needed — pattern from `/compte/deposer`)

---

## Context You Must Know

- **Tables**: `properties` (biens), `tenants` (locataires), `leases` (baux) — all have `team_id: uuid`
- **Server client**: `import { createClient } from "@/utils/supabase/server"` → `const supabase = await createClient()`
- **Team context**: `import { getUserTeamContext } from "@/lib/team-permissions.server"` → `const ctx = await getUserTeamContext()`
- **Sidebar nav**: `components/workspace/workspace-sidebar.tsx` — contains all gestion nav items
- **AddTenantButton**: `app/(workspace)/gestion/components/AddTenantButton.tsx` — 1456-line component, creates BOTH tenant AND lease in one wizard. Stages 2+3 CTA should link to the first property detail page where this button lives.
- **Stage 1 CTA**: `/gestion/biens/nouveau` (page exists)
- **Stage 2+3 CTA**: `/gestion/biens/{firstPropertyId}` (we fetch this ID alongside stage)
- **No `useLocalStorage` hook exists** — use `localStorage.getItem/setItem` directly in useEffect
- **Framer Motion**: already installed, use `motion.div` for progress bar animation

---

## Task 1: DB Migration — `activation_completed_at` on teams

**Files:**
- Apply via: Supabase MCP tool `apply_migration`

**Step 1: Apply migration**

Use Supabase MCP `apply_migration` with:
- project_id: (use `list_projects` to get it if unknown)
- name: `add_activation_completed_at_to_teams`
- query:
```sql
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS activation_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Index for fast lookup (layout runs on every /gestion navigation)
CREATE INDEX IF NOT EXISTS idx_teams_activation_completed_at
  ON teams (id, activation_completed_at)
  WHERE activation_completed_at IS NULL;
```

**Step 2: Verify**

Run SQL: `SELECT column_name FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'activation_completed_at';`

Expected: 1 row returned.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(db): add activation_completed_at to teams table"
```

---

## Task 2: Stage Calculation Function

**Files:**
- Create: `lib/activation/get-activation-stage.ts`

**Step 1: Create the file**

```typescript
// lib/activation/get-activation-stage.ts
import { createClient } from "@/utils/supabase/server";

export type ActivationStage = 1 | 2 | 3 | 4;

export interface ActivationData {
  stage: ActivationStage;
  completedAt: Date | null;
  firstPropertyId: string | null; // Used for stage 2+3 CTA link
}

/**
 * Calculates the current activation stage for a team.
 * Stage 1: No properties → add a property
 * Stage 2: ≥1 property, no tenants → add tenant+lease via AddTenantButton
 * Stage 3: ≥1 tenant, no active leases → (same action as stage 2)
 * Stage 4: ≥1 active lease → complete
 *
 * Uses COUNT(*) with indexed team_id for minimal DB load.
 * Returns early if activation_completed_at is already set.
 */
export async function getActivationData(teamId: string): Promise<ActivationData> {
  const supabase = await createClient();

  // First: check if already completed (cheap single lookup)
  const { data: team } = await supabase
    .from("teams")
    .select("activation_completed_at")
    .eq("id", teamId)
    .single();

  if (team?.activation_completed_at) {
    return {
      stage: 4,
      completedAt: new Date(team.activation_completed_at),
      firstPropertyId: null,
    };
  }

  // Count properties — fetch one to get firstPropertyId
  const { data: properties, count: propertyCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: false })
    .eq("team_id", teamId)
    .limit(1);

  if (!propertyCount || propertyCount === 0) {
    return { stage: 1, completedAt: null, firstPropertyId: null };
  }

  const firstPropertyId = properties?.[0]?.id ?? null;

  // Count tenants
  const { count: tenantCount } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  if (!tenantCount || tenantCount === 0) {
    return { stage: 2, completedAt: null, firstPropertyId };
  }

  // Count active leases
  const { count: leaseCount } = await supabase
    .from("leases")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("status", "active");

  if (!leaseCount || leaseCount === 0) {
    return { stage: 3, completedAt: null, firstPropertyId };
  }

  return { stage: 4, completedAt: null, firstPropertyId };
}
```

**Step 2: Commit**

```bash
git add lib/activation/get-activation-stage.ts
git commit -m "feat(activation): add server-side stage calculation"
```

---

## Task 3: Update Gestion Layout

**Files:**
- Modify: `app/(workspace)/gestion/layout.tsx`

**Step 1: Read the current file**

Current content (confirmed):
```typescript
export default function GestionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Step 2: Replace with stage-injected layout**

```typescript
// app/(workspace)/gestion/layout.tsx
import { getUserTeamContext } from "@/lib/team-permissions.server";
import { getActivationData } from "@/lib/activation/get-activation-stage";
import { ActivationBanner } from "@/components/activation/ActivationBanner";

export default async function GestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const teamContext = await getUserTeamContext();

  // No team = onboarding not started yet, skip banner
  if (!teamContext) {
    return <>{children}</>;
  }

  const activation = await getActivationData(teamContext.team_id);

  return (
    <>
      <ActivationBanner
        stage={activation.stage}
        completedAt={activation.completedAt}
        teamId={teamContext.team_id}
        firstPropertyId={activation.firstPropertyId}
      />
      {children}
    </>
  );
}
```

**Step 3: Commit**

```bash
git add app/\(workspace\)/gestion/layout.tsx
git commit -m "feat(activation): inject activation stage into gestion layout"
```

---

## Task 4: ActivationStep Component

**Files:**
- Create: `components/activation/ActivationStep.tsx`

**Step 1: Create the component**

```typescript
// components/activation/ActivationStep.tsx
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "done" | "active" | "pending";

interface ActivationStepProps {
  label: string;
  status: StepStatus;
  ctaLabel?: string;
  ctaHref?: string;
}

export function ActivationStep({ label, status, ctaLabel, ctaHref }: ActivationStepProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs",
            status === "done" && "border-transparent bg-green-500 text-white",
            status === "active" && "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]",
            status === "pending" && "border-white/20 bg-transparent text-white/30"
          )}
        >
          {status === "done" ? (
            <Check className="h-3 w-3" />
          ) : status === "active" ? (
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          )}
        </div>

        {/* Label */}
        <span
          className={cn(
            "text-sm",
            status === "done" && "text-white/50 line-through",
            status === "active" && "font-medium text-white",
            status === "pending" && "text-white/40"
          )}
        >
          {label}
        </span>
      </div>

      {/* CTA */}
      {status === "active" && ctaHref && (
        <a
          href={ctaHref}
          className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-90"
        >
          {ctaLabel ?? "Commencer →"}
        </a>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/activation/ActivationStep.tsx
git commit -m "feat(activation): add ActivationStep component"
```

---

## Task 5: ActivationBanner Component

**Files:**
- Create: `components/activation/ActivationBanner.tsx`

This is the main Client Component. It handles:
- Collapsed/expanded state via localStorage
- Animated progress bar on mount (and on stage change)
- Shows CompleteCTA when stage = 4 and not yet persisted
- Calls `completeActivation` server action after user dismisses CompleteCTA

**Step 1: Create the complete activation server action first**

```typescript
// lib/activation/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function completeActivation(teamId: string) {
  const supabase = await createClient();

  await supabase
    .from("teams")
    .update({ activation_completed_at: new Date().toISOString() })
    .eq("id", teamId);

  revalidatePath("/gestion", "layout");
}
```

**Step 2: Create the banner**

```typescript
// components/activation/ActivationBanner.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, X, CheckCircle2, Sparkles } from "lucide-react";
import { ActivationStep } from "./ActivationStep";
import { completeActivation } from "@/lib/activation/actions";
import type { ActivationStage } from "@/lib/activation/get-activation-stage";

const COLLAPSE_KEY = "activation-banner-collapsed";

interface ActivationBannerProps {
  stage: ActivationStage;
  completedAt: Date | null;
  teamId: string;
  firstPropertyId: string | null;
}

const STEPS = [
  { label: "Compte et agence créés" },
  { label: "Ajouter un bien" },
  { label: "Ajouter un locataire et configurer un bail" },
];

function getStepStatus(stepIndex: number, stage: ActivationStage) {
  // stepIndex 0 = "Compte créé" (always done)
  // stepIndex 1 = "Ajouter un bien" (done if stage >= 2)
  // stepIndex 2 = "Locataire + bail" (done if stage >= 4)
  if (stepIndex === 0) return "done";
  if (stepIndex === 1) return stage >= 2 ? "done" : stage === 1 ? "active" : "pending";
  if (stepIndex === 2) return stage >= 4 ? "done" : stage >= 2 ? "active" : "pending";
  return "pending";
}

function getCTA(stage: ActivationStage, firstPropertyId: string | null) {
  if (stage === 1) return { href: "/gestion/biens/nouveau", label: "Ajouter un bien →" };
  if (stage === 2 || stage === 3) {
    const href = firstPropertyId
      ? `/gestion/biens/${firstPropertyId}`
      : "/gestion/biens";
    return { href, label: "Ajouter locataire + bail →" };
  }
  return null;
}

export function ActivationBanner({
  stage,
  completedAt,
  teamId,
  firstPropertyId,
}: ActivationBannerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showCompleteCTA, setShowCompleteCTA] = useState(false);
  const [completing, setCompleting] = useState(false);
  const prevStageRef = useRef(stage);

  // Restore collapse preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  // Detect stage advancement → expand + animate
  useEffect(() => {
    if (prevStageRef.current !== stage) {
      // Stage advanced: expand banner to show progress
      setCollapsed(false);
      localStorage.setItem(COLLAPSE_KEY, "false");
      prevStageRef.current = stage;
    }
  }, [stage]);

  // Show complete CTA when stage reaches 4
  useEffect(() => {
    if (stage === 4 && !completedAt) {
      setShowCompleteCTA(true);
    }
  }, [stage, completedAt]);

  // If already completed: don't render anything
  if (completedAt) return null;

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, String(next));
  };

  const handleDismissComplete = async () => {
    setCompleting(true);
    await completeActivation(teamId);
    // revalidatePath will reload the layout → banner disappears
  };

  const progress = Math.round(((stage - 1) / 3) * 100);
  const cta = getCTA(stage, firstPropertyId);

  // ── Complete CTA (stage 4) ──────────────────────────────────────────
  if (showCompleteCTA) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 mb-0 rounded-xl border border-green-500/30 bg-green-900/20 p-4 backdrop-blur-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 shrink-0 text-green-400" />
            <div>
              <p className="font-semibold text-white">
                Votre gestion locative est activée !
              </p>
              <p className="mt-0.5 text-sm text-white/60">
                Générez votre premier document dès maintenant.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismissComplete}
            disabled={completing}
            className="shrink-0 rounded-full p-1 text-white/40 hover:text-white/80 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <a
            href="/gestion/documents"
            className="rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Générer un contrat
          </a>
          <a
            href="/gestion/documents"
            className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm font-semibold text-green-300 transition-opacity hover:opacity-90"
          >
            Générer une quittance
          </a>
        </div>
      </motion.div>
    );
  }

  // ── Collapsed pill ──────────────────────────────────────────────────
  if (collapsed) {
    return (
      <button
        onClick={toggleCollapse}
        className="mx-4 mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 backdrop-blur-sm transition hover:bg-white/10"
      >
        <span className="font-medium text-[var(--accent)]">▶</span>
        Activer gestion — {stage - 1}/3
        <ChevronDown className="h-3 w-3" />
      </button>
    );
  }

  // ── Expanded banner ─────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white">
          Activez votre gestion locative
        </p>
        <button
          onClick={toggleCollapse}
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70"
        >
          Réduire <ChevronUp className="h-3 w-3" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-[var(--accent)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <p className="mb-3 text-right text-xs text-white/40">{stage - 1} / 3 étapes</p>

      {/* Steps */}
      <div className="space-y-0.5">
        {STEPS.map((step, i) => (
          <ActivationStep
            key={i}
            label={step.label}
            status={getStepStatus(i, stage)}
            ctaLabel={cta?.label}
            ctaHref={cta?.href}
          />
        ))}
      </div>
    </motion.div>
  );
}
```

**Step 3: Commit**

```bash
git add components/activation/ lib/activation/
git commit -m "feat(activation): add ActivationBanner + completeActivation action"
```

---

## Task 6: Soft-lock Badges in Sidebar

**Files:**
- Modify: `components/workspace/workspace-sidebar.tsx`

**Step 1: Read the relevant nav section**

Find the nav items for: `États des lieux`, `Interventions`, `Comptabilité`, `Juridique`. They are around lines 57-66 based on exploration.

**Step 2: Add stage prop and badge logic**

The sidebar needs to know the current stage. Since it's inside the workspace layout (parent of gestion), the cleanest approach is a `data-activation-stage` attribute passed via a Client wrapper.

Instead of threading props through the entire sidebar, add a small `ActivationNavBadge` component that reads from a lightweight context:

```typescript
// components/activation/ActivationNavBadge.tsx
"use client";

interface Props {
  requiredStage: number;
  currentStage: number;
}

export function ActivationNavBadge({ requiredStage, currentStage }: Props) {
  if (currentStage >= requiredStage) return null;
  return (
    <span className="ml-auto text-[10px] text-white/30 font-normal">
      🔒
    </span>
  );
}
```

In `workspace-sidebar.tsx`, for each locked nav item, add the badge. The stage comes from the workspace layout that already has it (pass via prop or a minimal context).

**Sidebar modification pattern:**

```typescript
// Before (example nav item):
{ href: "/gestion/comptabilite", label: "Comptabilité", icon: BarChart2 }

// After:
{ href: "/gestion/comptabilite", label: "Comptabilité", icon: BarChart2, requiredStage: 4 }
```

Render as:
```tsx
<Link href={item.href} className={...}>
  <item.icon />
  {item.label}
  {item.requiredStage && stage < item.requiredStage && (
    <span className="ml-auto text-[10px] text-white/30">🔒</span>
  )}
</Link>
```

**Locked modules matrix:**

| Module | `requiredStage` |
|--------|----------------|
| États des lieux | 3 |
| Interventions | 3 |
| Comptabilité | 4 |
| Juridique | 4 |

**Note:** The sidebar is likely a Server Component. If it is, pass `stage` as prop from the workspace layout. If it's a Client Component, use a small React context (`ActivationContext`) created in the layout and consumed here.

**Step 3: Commit**

```bash
git add components/workspace/workspace-sidebar.tsx components/activation/ActivationNavBadge.tsx
git commit -m "feat(activation): add soft-lock badges to gestion sidebar nav"
```

---

## Task 7: InlineNotice on Locked Module Pages

**Files:**
- Create: `components/activation/ActivationInlineNotice.tsx`
- Modify (add notice): `app/(workspace)/gestion/etats-lieux/page.tsx` ← find the page file
- Modify (add notice): `app/(workspace)/gestion/interventions/page.tsx` ← if exists
- Modify (add notice): `app/(workspace)/gestion/comptabilite/page.tsx` ← if exists
- Modify (add notice): `app/(workspace)/gestion/documents-legaux/page.tsx` ← if exists

**CRITICAL UX NOTE:** The InlineNotice must be an overlay/banner ON TOP of the page content — NOT a replacement. The user must see the page structure (tables, filters, empty state) greyed out behind the notice. This shows the "reward" waiting for them.

**Step 1: Create ActivationInlineNotice**

```typescript
// components/activation/ActivationInlineNotice.tsx
import Link from "next/link";
import { Lock } from "lucide-react";

interface Props {
  moduleLabel: string;
  requiredAction: string;
  ctaLabel: string;
  ctaHref: string;
}

export function ActivationInlineNotice({ moduleLabel, requiredAction, ctaLabel, ctaHref }: Props) {
  return (
    // Sticky notice at top — does NOT hide page content below
    <div className="sticky top-0 z-10 mx-4 mb-4 flex items-center justify-between gap-4 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Lock className="h-4 w-4 shrink-0 text-[var(--accent)]" />
        <p className="text-sm text-white/70">
          Pour utiliser{" "}
          <span className="font-medium text-white">{moduleLabel}</span>
          {", "}
          {requiredAction}.
        </p>
      </div>
      <Link
        href={ctaHref}
        className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-90"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
```

**Step 2: Add to each locked page**

Pattern for each page (example: Comptabilité):

```typescript
// At the top of the page's Server Component:
const activation = await getActivationData(teamContext.team_id);

// In JSX, BEFORE the existing page content:
{activation.stage < 4 && (
  <ActivationInlineNotice
    moduleLabel="la Comptabilité"
    requiredAction="configurez d'abord un bail"
    ctaLabel="Configurer maintenant →"
    ctaHref={
      activation.firstPropertyId
        ? `/gestion/biens/${activation.firstPropertyId}`
        : "/gestion/biens"
    }
  />
)}

{/* Existing page content — always rendered, greyed out via Tailwind when stage low */}
<div className={activation.stage < 4 ? "pointer-events-none opacity-40" : ""}>
  {/* ... existing content ... */}
</div>
```

**InlineNotice messages per module:**

| Module | `requiredAction` | `ctaHref` |
|--------|-----------------|-----------|
| Comptabilité | "configurez d'abord un bail" | first property or /gestion/biens |
| Juridique | "configurez d'abord un bail" | first property or /gestion/biens |
| États des lieux | "ajoutez d'abord un locataire" | first property or /gestion/biens |
| Interventions | "ajoutez d'abord un locataire" | first property or /gestion/biens |

**Step 3: Commit**

```bash
git add components/activation/ActivationInlineNotice.tsx app/\(workspace\)/gestion/
git commit -m "feat(activation): add inline notices on soft-locked module pages"
```

---

## Task 8: Final Verification

**Step 1: Check TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors. If errors, fix them.

**Step 2: Manual flow test**

1. Log in as a new user (0 biens)
2. Navigate to `/gestion` → banner visible, stage 1, "Ajouter un bien" CTA active
3. Add a bien → return to `/gestion` → banner updates, stage 2
4. Progress bar animates from 0% to 33%
5. Click on Comptabilité → InlineNotice visible + existing page greyed out
6. Add tenant+lease via AddTenantButton → return to `/gestion` → banner shows stage 4 CTA
7. Dismiss CTA → banner disappears permanently
8. Reload `/gestion` → no banner

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete adaptive onboarding activation system

- Stage calculation server-side via COUNT queries
- Collapsible ActivationBanner in /gestion layout
- Progress bar animation on stage advancement
- Soft-lock badges in sidebar nav
- InlineNotice on locked modules (overlay, not replacement)
- activation_completed_at persisted after first quittance CTA"
```

---

## Gotchas & Edge Cases

1. **`getUserTeamContext()` returns null for non-team users** — layout already handles this (skip banner)
2. **AddTenantButton creates BOTH tenant AND lease in one flow** — stage can jump from 2 to 4 directly. This is expected and desirable. The progress bar will animate 33% → 100%.
3. **`leases.status` field** — verify the exact enum value for active leases. Could be `"active"`, `"actif"`, or similar. Check before filtering.
4. **Sidebar might be a Client Component** — if so, threading `stage` as prop may require passing from a React Context created in the layout. Evaluate on read.
5. **revalidatePath scope** — use `revalidatePath("/gestion", "layout")` in `completeActivation` to ensure the gestion layout re-runs and `completedAt` is picked up.
