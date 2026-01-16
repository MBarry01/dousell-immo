"use client";

import { cn } from "@/lib/utils";
import { Icon as PhosphorIcon } from "@phosphor-icons/react";

interface SoftwareIconProps {
    icon: PhosphorIcon;
    className?: string;
    variant?: "glass" | "solid" | "glow";
}

export function SoftwareIcon({ icon: Icon, className, variant = "glass", iconSize = 28 }: SoftwareIconProps & { iconSize?: number }) {

    const variants = {
        // Style "Verre" (Classique SaaS Dark Mode)
        glass: "bg-white/5 border border-white/10 text-slate-300",

        // Style "Solid" (Pour les actions principales)
        solid: "bg-amber-500 border border-amber-400 text-black",

        // Style "Glow" (Pour les features magiques/IA)
        glow: "bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    };

    return (
        <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
            variants[variant],
            className
        )}>
            <Icon size={iconSize} weight="light" />
        </div>
    );
}
