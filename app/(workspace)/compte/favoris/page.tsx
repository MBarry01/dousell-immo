"use client";

import { useFavoritesStore } from "@/store/use-store";
import { EmptyState } from "@/components/ui/empty-state";
import { Heart, MapPin, Bed, Square, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

export default function FavorisPage() {
    const { favorites, removeFavorite } = useFavoritesStore();
    const router = useRouter();

    return (
        <div className="px-4 md:px-6 lg:px-8 space-y-6 py-6 text-foreground min-h-[60vh]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold">Mes Favoris</h1>
                    <p className="text-muted-foreground">
                        Retrouvez ici vos annonces sauvegardées
                        {favorites.length > 0 && ` (${favorites.length})`}
                    </p>
                </div>
            </div>

            {favorites.length === 0 ? (
                <EmptyState
                    title="Aucun favori pour le moment"
                    description="Parcourez les annonces et cliquez sur le bookmark pour sauvegarder vos biens préférés."
                    actionLabel="Explorer les annonces"
                    onAction={() => router.push("/recherche")}
                    icon={Heart}
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {favorites.map((property) => {
                        const isExternal = property.isExternal;
                        const href = isExternal
                            ? `/biens/ext/${property.id}`
                            : `/biens/${property.id}`;
                        const mainImage = property.images?.[0] || "/placeholder-property.jpg";

                        return (
                            <Link
                                key={property.id}
                                href={href}
                                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card transition-all hover:border-primary/30 hover:shadow-lg"
                            >
                                {/* Image */}
                                <div className="relative aspect-[16/10] w-full overflow-hidden">
                                    <Image
                                        src={mainImage}
                                        alt={property.title}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    {/* Prix */}
                                    <div className="absolute bottom-3 left-3 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1 border border-primary/30">
                                        <span className="text-sm font-bold text-primary">
                                            {formatCurrency(property.price)}
                                        </span>
                                    </div>
                                    {/* Badge externe */}
                                    {isExternal && (
                                        <span className="absolute top-3 left-3 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white border border-white/20">
                                            Partenaire
                                        </span>
                                    )}
                                </div>

                                {/* Infos */}
                                <div className="flex flex-1 flex-col gap-2 p-4">
                                    <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                                        {property.title}
                                    </h3>
                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate">{property.location?.city}</span>
                                    </p>
                                    {(property.specs?.bedrooms > 0 || property.specs?.surface > 0) && (
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {property.specs.bedrooms > 0 && (
                                                <span className="inline-flex items-center gap-1">
                                                    <Bed className="h-3.5 w-3.5" />
                                                    {property.specs.bedrooms} ch
                                                </span>
                                            )}
                                            {property.specs.surface > 0 && (
                                                <span className="inline-flex items-center gap-1">
                                                    <Square className="h-3.5 w-3.5" />
                                                    {property.specs.surface} m²
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Supprimer le favori */}
                                <div className="absolute right-3 top-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full bg-black/40 text-white/70 hover:bg-red-500/80 hover:text-white"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            removeFavorite(property.id);
                                        }}
                                        aria-label="Retirer des favoris"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
