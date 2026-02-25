"use client";

import Image from "next/image";
import { CldImage, type CldImageProps } from "next-cloudinary";

/**
 * Un wrapper sécurisé pour CldImage qui évite de faire crash le build
 * si la variable d'environnement NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME est manquante.
 * 
 * En cas d'absence de configuration, il se replie sur le composant Image standard de Next.js.
 */
export function CldImageSafe(props: CldImageProps) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    // Si le cloud name est manquant, on bascule sur l'Image standard de Next.js
    if (!cloudName) {
        // On extrait les props spécifiques à Cloudinary qui ne sont pas compatibles avec next/image
        const {
            crop,
            gravity,
            tint,
            blur,
            grayscale,
            pixelate,
            ...nextImageProps
        } = props;

        return (
            <Image
                {...(nextImageProps as any)}
                unoptimized={true} // Obligatoire si on n'a pas configuré les domaines properly ou si on veut juste passer l'URL brute
            />
        );
    }

    // Sinon on utilise le composant optimisé de Cloudinary
    return <CldImage {...props} />;
}
