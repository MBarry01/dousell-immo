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

      {/* CTA — only on active step */}
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
