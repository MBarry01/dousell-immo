"use client";

import dynamic from 'next/dynamic';

// Import dynamique pour éviter le rendu côté serveur (Leaflet nécessite window)
const PropertyMap = dynamic(() => import('./PropertyMap').then(mod => ({ default: mod.PropertyMap })), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] rounded-2xl border border-gray-800 shadow-2xl bg-gray-900/50 flex items-center justify-center">
      <div className="text-white/60">Chargement de la carte...</div>
    </div>
  ),
});

export function PropertyMapWrapper({ properties }: { properties: any[] }) {
  return <PropertyMap properties={properties} />;
}
