"use client";

import { Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PricingFeature {
    name: string;
    included: boolean;
    tooltip?: string;
}

interface PricingCardProps {
    title: string;
    price: string;
    period?: string;
    description: string;
    features: PricingFeature[];
    isPopular?: boolean;
    ctaText: string;
    onCtaClick?: () => void;
    color?: string; // Hex color for button/accents
}

export function PricingCard({
    title,
    price,
    period = "/ mois",
    description,
    features,
    isPopular,
    ctaText,
    onCtaClick,
    color = "#F59E0B",
}: PricingCardProps) {
    return (
        <Card
            className={cn(
                "relative flex flex-col h-full transition-all duration-300 hover:shadow-xl border-t-4",
                isPopular ? "scale-105 shadow-lg z-10" : "scale-100 border-slate-200"
            )}
            style={{ borderTopColor: color }}
        >
            {isPopular && (
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                    style={{ backgroundColor: color }}
                >
                    Le plus populaire
                </div>
            )}

            <CardHeader className="text-center pt-10 pb-2">
                <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
                <div className="flex items-center justify-center gap-1 mt-4">
                    <span className="text-4xl font-extrabold text-slate-900">{price}</span>
                    {price !== "Gratuit" && <span className="text-slate-500 font-medium">{period}</span>}
                </div>
                <p className="text-sm text-slate-500 mt-2 min-h-[40px]">{description}</p>
            </CardHeader>

            <CardContent className="flex-grow pt-6">
                <Button
                    className="w-full font-bold text-white mb-8 hover:brightness-110 transition-all shadow-md"
                    style={{ backgroundColor: color }}
                    onClick={onCtaClick}
                >
                    {ctaText}
                </Button>

                <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Ce qui est inclus :</p>
                    <ul className="space-y-3">
                        {features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                {feature.included ? (
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                ) : (
                                    <span className="w-5 h-5 block shrink-0" /> // Spacer
                                )}
                                <span className={cn("text-sm", feature.included ? "text-slate-700" : "text-slate-400 line-through")}>
                                    {feature.name}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
