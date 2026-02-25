"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { type CldImageProps } from "next-cloudinary";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Assets de design légers (< 50KB) servis localement pour un LCP instantané.
 */
const LOCAL_DESIGN_ASSETS: Record<string, string> = {
    'doussel/static/logos/logo': '/logo.svg',
    'doussel/static/logos/logo-black': '/logo-black.svg',
    'doussel/static/logos/Logo': '/logo.svg',
    'doussel/static/logos/logo-white': '/logo-white.png',
    'doussel/static/logos/logo-or1': '/logo-or1.png',
    'doussel/static/logos/logo-jnor': '/logo-jnor.png',
    'doussel/static/logos/logo-black.png': '/logo-black.svg',
};

/**
 * CldImageSafe v9 : "Zéro Bande Passante Vercel" + Optimisation Visuelle Logos
 */
export function CldImageSafe(props: CldImageProps) {
    const { className, onLoadingComplete, ...restProps } = props;
    const isFill = !!restProps.fill;
    const [hasMounted, setHasMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(!restProps.priority);
    const [hasError, setHasError] = useState(false);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkkirzpxe';
    const src = props.src as string;

    // Debug help for production
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.NODE_ENV === 'production') {
        console.warn("[CldImageSafe] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is missing. Falling back to default.");
    }

    // 1. Détermination de la source et construction de l'URL
    const { isLocal, finalSrc, isLogo, isDesign } = useMemo(() => {
        if (typeof src !== 'string') return { isLocal: false, finalSrc: src, isLogo: false, isDesign: false };

        const isLogoAsset = src.toLowerCase().includes('logo');
        const isDesignAsset = src.startsWith('doussel/static/');

        // Cas A : Petit asset local (Logo/SVG)
        if (LOCAL_DESIGN_ASSETS[src]) {
            return { isLocal: true, finalSrc: LOCAL_DESIGN_ASSETS[src], isLogo: isLogoAsset, isDesign: true };
        }
        if (src.startsWith('/') && !src.startsWith('//')) {
            return { isLocal: true, finalSrc: src, isLogo: isLogoAsset, isDesign: true };
        }

        // Cas B : URL externe complète (Supabase, Unsplash)
        if (src.startsWith('http') || src.startsWith('//')) {
            return { isLocal: false, finalSrc: src, isLogo: isLogoAsset, isDesign: false };
        }

        // Cas C : Cloudinary ID -> URL DIRECTE pour BYPASSER Vercel
        const widthPart = restProps.width ? `,w_${restProps.width}` : '';
        const directUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto${widthPart}/${src}`;

        return { isLocal: false, finalSrc: directUrl, isLogo: isLogoAsset, isDesign: isDesignAsset };
    }, [src, cloudName, restProps.width]);

    useEffect(() => {
        setHasMounted(true);
        if (restProps.priority) {
            setIsLoading(false);
        }
    }, [restProps.priority]);

    const handleLoad = () => {
        setIsLoading(false);
        if (onLoadingComplete) onLoadingComplete({} as any);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const { crop, gravity, tint, blur, grayscale, pixelate, ...nextImageProps } = restProps;

    // SSR Prevention
    if (!hasMounted) {
        return (
            <div className={cn("relative overflow-hidden", isFill ? "absolute inset-0" : className)}>
                {/* Pas de skeleton en SSR pour le design (logo, hero) */}
                {!isDesign && !isLocal && <Skeleton className="absolute inset-0 z-10 bg-zinc-900" />}
            </div>
        );
    }

    // Protection Error
    if (hasError) {
        return (
            <div className={cn("relative overflow-hidden bg-zinc-900", isFill ? "absolute inset-0" : className)}>
                <div className="absolute inset-0 flex items-center justify-center text-zinc-800">
                    <span className="text-[10px]">Image indisponible</span>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden", isFill ? "absolute inset-0" : className)}>
            {/* Skeleton uniquement pour les images non-design (ex: annonces user) */}
            {isLoading && !restProps.priority && !isDesign && !isLocal && (
                <Skeleton className="absolute inset-0 z-10 bg-zinc-900 animate-pulse" />
            )}

            <Image
                {...(nextImageProps as any)}
                src={finalSrc}
                className={cn(
                    "transition-opacity duration-300",
                    isLoading && !restProps.priority && !isDesign && !isLocal ? "opacity-0" : "opacity-100",
                    className
                )}
                unoptimized={!isLocal}
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    );
}
