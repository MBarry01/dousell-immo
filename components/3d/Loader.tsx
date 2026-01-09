"use client";

/**
 * Loader 3D affiché pendant le chargement du modèle
 * Version simple sans Html (pour éviter les problèmes SSR)
 */
export function Loader3D() {
  return null; // Le loader HTML sera utilisé à la place
}

/**
 * Loader HTML (alternatif) - Plus performant, affiché en dehors du Canvas
 */
export function HTMLLoader({ progress }: { progress: number }) {
  if (progress >= 100) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8 bg-slate-900 rounded-2xl border border-amber-500/20 shadow-2xl">
        {/* Logo ou icône */}
        <div className="text-6xl animate-bounce">🏠</div>

        {/* Spinner animé */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin" />
        </div>

        {/* Texte + Pourcentage */}
        <div className="text-center">
          <p className="text-white font-semibold text-xl mb-2">
            Préparation de votre visite virtuelle
          </p>
          <p className="text-amber-500 font-bold text-3xl">
            {progress.toFixed(0)}%
          </p>
        </div>

        {/* Barre de progression */}
        <div className="w-80 h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            {/* Effet de shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Message encourageant */}
        <p className="text-slate-400 text-sm italic mt-2">
          Chargement du modèle 3D en cours...
        </p>
      </div>
    </div>
  );
}
