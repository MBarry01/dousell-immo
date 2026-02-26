"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { type CldImageProps } from "next-cloudinary";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Assets de design légers (< 50KB) servis localement pour un LCP instantané.
 */
const LOCAL_DESIGN_ASSETS: Record<string, string> = {};

/**
 * CldImageSafe v9 : "Zéro Bande Passante Vercel" + Optimisation Visuelle Logos
 */
export function CldImageSafe(props: CldImageProps) {
    const { className, onLoadingComplete, ...restProps } = props;
    const isFill = !!restProps.fill;
    const [isLoading, setIsLoading] = useState(!restProps.priority);
    const [hasError, setHasError] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

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

    // Fonction pour vérifier si une URL appartient à Cloudinary
    const isCloudinaryUrl = (url: string) => url.includes('res.cloudinary.com');

    // Loader personnalisé pour BYPASSER Vercel et utiliser le srcset natif de Cloudinary
    const cloudinaryLoader = ({ width }: { width: number }) => {
        // Si c'est un ID (cas standard)
        if (!src.startsWith('http') && !src.startsWith('//')) {
            return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${width}/${src}`;
        }
        // Si c'est déjà une URL complète Cloudinary, on essaie d'y injecter l'optimisation de largeur
        if (isCloudinaryUrl(src)) {
            // Remplacer /upload/ par /upload/f_auto,q_auto,w_WIDTH/
            if (src.includes('/upload/')) {
                return src.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
            }
        }
        return src;
    };

    const isCloudinary = !isLocal && (isCloudinaryUrl(src) || (!src.startsWith('http') && !src.startsWith('//')));

    // SSR Protection: We allow the image to render immediately ONLY if priority or if mounted
    if (!hasMounted && !restProps.priority) {
        return <div className={cn("bg-zinc-900/10", isFill ? "absolute inset-0" : className)} />;
    }

    return (
        <div className={cn("relative overflow-hidden", isFill ? "absolute inset-0" : className)}>
            <Image
                {...(nextImageProps as any)}
                src={isLocal ? finalSrc : src}
                className={cn(
                    "transition-opacity duration-300",
                    isLoading && !restProps.priority && !isDesign && !isLocal ? "opacity-0" : "opacity-100",
                    className
                )}
                // Utiliser le loader si c'est du Cloudinary (ID ou URL)
                loader={isCloudinary ? cloudinaryLoader : undefined}
                // unoptimized=true pour les images LCP locales ET les URLs externes non-Cloudinary
                unoptimized={isLocal || (!isCloudinary && (src.startsWith('http') || src.startsWith('//')))}
                referrerPolicy={(!isLocal && !isCloudinary) ? "no-referrer" : undefined}
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    );
}
