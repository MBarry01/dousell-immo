"use client";

// components/activation/ActivationInlineNoticeClient.tsx
import Link from "next/link";
import { Lock } from "lucide-react";
import { useActivationStage } from "@/hooks/use-activation-stage";

interface Props {
  moduleLabel: string;
  requiredAction: string;
  ctaLabel: string;
  ctaHref: string;
  requiredStage: number;
}

/**
 * Client-side version of ActivationInlineNotice.
 * Used on pages that are already Client Components (e.g. Comptabilité).
 * Reads activation stage from localStorage — no server call needed.
 */
export function ActivationInlineNoticeClient({
  moduleLabel,
  requiredAction,
  ctaLabel,
  ctaHref,
  requiredStage,
}: Props) {
  const stage = useActivationStage();

  // Don't render until hydrated, or if user has reached the required stage
  if (stage === null || stage >= requiredStage) return null;

  return (
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
