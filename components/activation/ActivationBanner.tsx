"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, X, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ActivationStep } from "./ActivationStep";
import { completeActivation } from "@/lib/activation/actions";
import type { ActivationStage } from "@/lib/activation/get-activation-stage";

const COLLAPSE_KEY = "activation-banner-collapsed";
const STAGE_KEY = "activation-stage";

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
  if (stepIndex === 0) return "done" as const;
  if (stepIndex === 1) return stage >= 2 ? "done" as const : stage === 1 ? "active" as const : "pending" as const;
  if (stepIndex === 2) return stage >= 4 ? "done" as const : stage >= 2 ? "active" as const : "pending" as const;
  return "pending" as const;
}

function getCTA(stage: ActivationStage, firstPropertyId: string | null) {
  if (stage === 1) return { href: "/gestion/biens/nouveau", label: "Ajouter un bien →" };
  if (stage === 2 || stage === 3) {
    const href = firstPropertyId ? `/gestion/biens/${firstPropertyId}` : "/gestion/biens";
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
  const router = useRouter();
  const prevStageRef = useRef(stage);

  // Restore collapse preference + sync stage to localStorage for sidebar badges
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSE_KEY);
    if (stored === "true") setCollapsed(true);

    // Share stage with sidebar via localStorage
    localStorage.setItem(STAGE_KEY, String(stage));
    window.dispatchEvent(new CustomEvent("activation-stage-changed", { detail: stage }));
  }, [stage]);

  // Detect stage advancement → expand banner to show progress
  useEffect(() => {
    if (prevStageRef.current !== stage) {
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

  // Already completed: render nothing
  if (completedAt) return null;

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, String(next));
  };

  const handleDismissComplete = async (redirectTo?: string) => {
    setCompleting(true);
    try {
      await completeActivation(teamId);
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (error) {
      console.error("Failed to complete activation:", error);
    } finally {
      setCompleting(false);
    }
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
            onClick={() => handleDismissComplete()}
            disabled={completing}
            className="shrink-0 rounded-full p-1 text-white/40 hover:text-white/80 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleDismissComplete("/gestion/documents")}
            disabled={completing}
            className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-bold text-black transition-all hover:bg-green-400 active:scale-95 disabled:opacity-50"
          >
            {completing && <Loader2 className="h-4 w-4 animate-spin" />}
            Générer un contrat
          </button>
          <button
            onClick={() => handleDismissComplete("/gestion/documents")}
            disabled={completing}
            className="flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-2.5 text-sm font-bold text-green-300 transition-all hover:bg-green-500/20 active:scale-95 disabled:opacity-50"
          >
            Générer une quittance
          </button>
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
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
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
