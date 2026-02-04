"use client";

/**
 * UpgradeCTA Component
 *
 * Reusable call-to-action for upgrading from Prospect to Pro.
 * Used in vitrine header, /bienvenue page, and /compte dashboard.
 *
 * Variants:
 * - banner: Full-width banner with gradient background
 * - compact: Small inline button
 * - card: Card-style with benefits list
 *
 * Per WORKFLOW_PROPOSAL.md section 4.4, REMAINING_TASKS.md 2.3
 */

import Link from "next/link";
import { ArrowRight, Sparkle, Buildings, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UpgradeCTAVariant = "banner" | "compact" | "card";

interface UpgradeCTAProps {
  variant?: UpgradeCTAVariant;
  className?: string;
  /** Custom CTA text */
  ctaText?: string;
  /** Show trial badge */
  showTrialBadge?: boolean;
  /** Custom destination (default: /compte/upgrade) */
  href?: string;
}

const benefits = [
  "Gestion illimitée de biens",
  "Contrats automatisés",
  "Suivi des loyers",
];

export function UpgradeCTA({
  variant = "compact",
  className,
  ctaText,
  showTrialBadge = true,
  href = "/compte/upgrade",
}: UpgradeCTAProps) {
  if (variant === "banner") {
    return (
      <div
        className={cn(
          "w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent",
          "border-b border-primary/20",
          "py-3 px-4",
          className
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {showTrialBadge && (
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-primary/20 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                <Sparkle size={12} weight="fill" />
                Essai 14 jours
              </span>
            )}
            <p className="text-sm text-muted-foreground">
              <span className="hidden md:inline">Vous êtes propriétaire ? </span>
              <span className="text-foreground font-medium">
                Gérez vos biens et locataires en un clic
              </span>
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
          >
            <Link href={href}>
              {ctaText || "Devenir Pro"}
              <ArrowRight size={14} className="ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "bg-card",
          "border border-primary/20 rounded-2xl",
          "p-6",
          className
        )}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Buildings size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Passez à la gestion Pro
            </h3>
            {showTrialBadge && (
              <span className="inline-flex items-center gap-1 text-primary text-sm mt-1">
                <Sparkle size={12} weight="fill" />
                14 jours d&apos;essai gratuit
              </span>
            )}
          </div>
        </div>

        <ul className="space-y-2 mb-6">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex items-center gap-2 text-muted-foreground text-sm">
              <Check size={16} className="text-primary flex-shrink-0" />
              {benefit}
            </li>
          ))}
        </ul>

        <Button
          asChild
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link href={href}>
            {ctaText || "Commencer l'essai gratuit"}
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </Button>
      </div>
    );
  }

  // Default: compact variant
  return (
    <Button
      asChild
      size="sm"
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
    >
      <Link href={href}>
        {showTrialBadge && <Sparkle size={14} className="mr-1.5" weight="fill" />}
        {ctaText || "Devenir Pro"}
        <ArrowRight size={14} className="ml-1.5" />
      </Link>
    </Button>
  );
}

/**
 * Banner variant specifically for prospects
 * Shows in the vitrine header when user is logged in but not Pro
 */
export function ProspectUpgradeBanner({ className }: { className?: string }) {
  return (
    <UpgradeCTA
      variant="banner"
      className={className}
      ctaText="Activer la gestion locative"
      href="/compte/upgrade"
    />
  );
}

/**
 * Card variant for /bienvenue page
 */
export function WelcomeUpgradeCard({ className }: { className?: string }) {
  return (
    <UpgradeCTA
      variant="card"
      className={className}
      ctaText="Commencer l'essai gratuit"
      href="/compte/upgrade"
    />
  );
}
