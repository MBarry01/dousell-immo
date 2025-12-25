"use client"
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import L from 'leaflet';

// Fix pour les icônes Leaflet dans Next.js
const LeafletIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Petit composant pour forcer le refresh de la taille de la carte
function MapResizer({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300); // Délai pour laisser l'animation de transition se terminer
  }, [isFullscreen, map]);
  return null;
}

export function PropertyMap({ properties }: { properties: any[] }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filtrer uniquement les biens qui ont des coordonnées
  const mapMarkers = properties.filter(p => p.lat && p.lng);

  return (
    <div className={`relative transition-all duration-500 ease-in-out ${
      isFullscreen
        ? 'fixed inset-0 z-[9999] bg-black'
        : 'h-[400px] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden'
    }`}>
      {/* Bouton Plein Écran Custom */}
      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        className={`absolute z-[1000] p-3 bg-gray-900/90 border border-gray-700 rounded-xl text-white hover:bg-gray-800 hover:scale-105 transition-all shadow-2xl ${
          isFullscreen ? 'top-4 right-4' : 'top-6 right-6'
        }`}
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      <MapContainer
        center={[9.509, -13.712]}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full outline-none"
        zoomControl={false} // On le désactive pour garder l'UI propre
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
        />

        <MapResizer isFullscreen={isFullscreen} />

        {mapMarkers.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={LeafletIcon}
          />
        ))}
      </MapContainer>
    </div>
  );
}
