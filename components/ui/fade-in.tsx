"use client";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function FadeIn({
    children,
    className,
    delay = 0
}: {
    children: React.ReactNode,
    className?: string,
    delay?: number
}) {
    const { mounted } = useTheme();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    // Hydration guard to prevent double renders or flickering
    if (!mounted) {
        return <div className="opacity-0 translate-y-4">{children}</div>;
    }

    return (
        <div
            className={cn(
                "duration-500 ease-out transition-all",
                isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4",
                className
            )}
        >
            {/* Si isVisible est faux, on affiche quand même les enfants avec opacity-0 
                pour permettre le référencement et éviter les sauts de layout,
                mais on s'assure qu'ils sont cliquables après l'animation */}
            <div className={!isVisible ? "pointer-events-none" : ""}>
                {children}
            </div>
        </div>
    );
}
