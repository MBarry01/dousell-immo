"use client";

import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/workspace/providers/theme-provider";
import Link from "next/link";

interface FeatureLockedStateProps {
    title: string;
    description: string;
    requiredTier?: "pro" | "enterprise";
}

export function FeatureLockedState({
    title,
    description,
    requiredTier = "pro",
}: FeatureLockedStateProps) {
    const { isDark } = useTheme();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-500">
            <div
                className={`p-4 rounded-full mb-6 ${isDark ? "bg-slate-800 text-amber-500" : "bg-amber-100 text-amber-600"
                    }`}
            >
                <Lock className="w-12 h-12" />
            </div>

            <h2
                className={`text-2xl md:text-3xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"
                    }`}
            >
                {title}
            </h2>

            <p
                className={`max-w-md mb-8 text-lg ${isDark ? "text-slate-400" : "text-gray-600"
                    }`}
            >
                {description}
            </p>

            <div
                className={`p-6 rounded-xl border max-w-lg w-full mb-8 ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-gray-200"
                    }`}
            >
                <div className="flex items-center gap-3 mb-2 justify-center">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-amber-500 uppercase tracking-wider text-sm">
                        Fonctionnalité {requiredTier === "pro" ? "Pro" : "Enterprise"}
                    </span>
                </div>
                <p className={`text-sm ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                    Passez au plan supérieur pour débloquer cet outil et bien plus encore.
                </p>
            </div>

            <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/20"
            >
                <Link href="/gestion/config">
                    Découvrir les plans
                </Link>
            </Button>
        </div>
    );
}
