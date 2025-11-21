"use client";

import { useState, useEffect } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type OptimizedImageProps = ImageProps & {
  /**
   * Classes CSS additionnelles pour le conteneur
   */
  containerClassName?: string;
  /**
   * Afficher un skeleton pendant le chargement
   * @default true
   */
  showSkeleton?: boolean;
  /**
   * Durée de la transition fade-in en ms
   * @default 500
   */
  fadeInDuration?: number;
};

/**
 * Composant d'image optimisé avec skeleton et transition fade-in
 * 
 * Améliore l'UX sur les connexions mobiles instables en affichant
 * un skeleton pendant le chargement et une transition douce à la fin.
 */
export function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  showSkeleton = true,
  fadeInDuration = 500,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Timeout de sécurité : afficher l'image après 1 seconde max
  // Cela évite que l'image reste invisible si onLoadingComplete ne se déclenche pas
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Skeleton pendant le chargement */}
      {isLoading && showSkeleton && (
        <Skeleton
          className="absolute inset-0 z-10"
          aria-hidden="true"
        />
      )}

      {/* Image avec transition fade-in */}
      <Image
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity",
          isLoading ? "opacity-0" : "opacity-100",
          hasError && "opacity-50",
          className
        )}
        style={{
          transitionDuration: `${fadeInDuration}ms`,
        }}
        onLoadingComplete={handleLoadingComplete}
        onError={handleError}
        {...props}
      />

      {/* Message d'erreur si l'image ne charge pas */}
      {hasError && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100 dark:bg-white/5"
          aria-label="Image non disponible"
        >
          <div className="text-center text-xs text-gray-400 dark:text-white/40">
            <svg
              className="mx-auto mb-2 h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p>Image non disponible</p>
          </div>
        </div>
      )}
    </div>
  );
}

