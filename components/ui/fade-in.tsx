"use client";

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
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div
            className={cn(
                "duration-500 ease-out",
                isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4",
                "transition-[opacity,transform]", // Only animate opacity and transform
                className
            )}
        >
            {children}
        </div>
    );
}
