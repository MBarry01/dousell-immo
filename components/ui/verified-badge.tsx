"use client";

import { BadgeCheck } from "lucide-react";

export const VerifiedBadge = ({
    className = "",
    size = "md",
}: {
    className?: string;
    size?: "sm" | "md" | "lg";
    showTooltip?: boolean;
    variant?: "pill" | "icon";
}) => {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
    };

    // Badge simplifié : icône uniquement
    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            {/* Icône style "Sceau" : remplie or, trait noir */}
            <BadgeCheck
                className={`${sizeClasses[size]} fill-[#F4C430] text-black`}
                strokeWidth={2}
            />
        </div>
    );

    /* 
    // Version avec tooltip (désactivée temporairement)
    if (!showTooltip) return <BadgeContent />;

    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <div className="cursor-help inline-flex hover:scale-110 hover:brightness-110 transition-all duration-200">
                        <BadgeContent />
                    </div>
                </TooltipTrigger>
                <TooltipContent className="bg-black/90 text-white border-[#F4C430]/30 backdrop-blur-md px-3 py-2">
                    <p className="flex items-center gap-2 font-medium">
                        <BadgeCheck className="h-4 w-4 fill-[#F4C430] text-black" />
                        Bien vérifié par Dousel
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
    */
};
