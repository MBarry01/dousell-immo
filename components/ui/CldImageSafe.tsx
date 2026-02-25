"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CldImage, type CldImageProps } from "next-cloudinary";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Un wrapper sécurisé pour CldImage qui évite les erreurs d'hydratation
 * et gère les états de chargement avec un skeleton et un fade-in.
 */
export function CldImageSafe(props: CldImageProps) {
    const { className, onLoadingComplete, ...restProps } = props;
    const isFill = !!restProps.fill;
    const [hasMounted, setHasMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(!restProps.priority);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const isDev = process.env.NODE_ENV === 'development';

    // Fonction pour extraire le public ID si c'est une URL Cloudinary complète
    const getPublicId = (src: any): string => {
        if (typeof src !== 'string') return src;
        if (!src.includes('res.cloudinary.com')) return src;

        try {
            // Format typique: https://res.cloudinary.com/cloud_name/image/upload/v1/folder/id.jpg
            const parts = src.split('/upload/');
            if (parts.length > 1) {
                const pathAfterUpload = parts[1];
                // On enlève la version (v123456) si présente
                const pathParts = pathAfterUpload.split('/');
                if (pathParts[0].startsWith('v') && !isNaN(parseInt(pathParts[0].substring(1)))) {
                    return pathParts.slice(1).join('/').split('.')[0];
                }
                return pathAfterUpload.split('.')[0];
            }
        } catch (e) {
            return src;
        }
        return src;
    };

    const finalSrc = getPublicId(props.src);
    // Éviter les erreurs d'hydratation
    useEffect(() => {
        setHasMounted(true);

        // Si c'est déjà chargé ou priority, on sort
        if (restProps.priority) {
            setIsLoading(false);
            return;
        }

        // Timeout de sécurité (très long pour éviter les faux positifs en scroll)
        const timeout = setTimeout(() => {
            if (isLoading) {
                if (isDev) console.warn(`[CldImageSafe] Safety timeout (10s) reached for ${finalSrc}`);
                setIsLoading(false);
            }
        }, 10000);

        return () => clearTimeout(timeout);
    }, [restProps.priority, finalSrc]);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
    };

    // Si on n'est pas encore monté au client, on rend un skeleton ou l'image invisible
    // pour éviter que le HTML du serveur diffère trop de celui du client
    if (!hasMounted) {
        return (
            <div className={cn("relative overflow-hidden", isFill ? "absolute inset-0" : className)}>
                <Skeleton className="absolute inset-0 z-10" />
            </div>
        );
    }

    // Si le cloud name est manquant, on bascule sur l'Image standard de Next.js
    if (!cloudName) {
        const {
            crop, gravity, tint, blur, grayscale, pixelate, ...nextImageProps
        } = restProps;

        return (
            <div className={cn("relative overflow-hidden", isFill ? "absolute inset-0" : className)}>
                {isLoading && <Skeleton className="absolute inset-0 z-10" />}
                <Image
                    {...(nextImageProps as any)}
                    className={cn(
                        "transition-opacity duration-500",
                        isLoading ? "opacity-0" : "opacity-100",
                        className
                    )}
                    unoptimized={true}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden", isFill ? "absolute inset-0" : className)}>
            {isLoading && <Skeleton className="absolute inset-0 z-10" />}
            <CldImage
                {...restProps}
                src={finalSrc}
                className={cn(
                    "transition-opacity duration-500",
                    isLoading ? "opacity-0" : "opacity-100",
                    className
                )}
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    );
}
