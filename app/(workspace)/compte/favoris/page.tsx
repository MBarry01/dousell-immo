"use client";

import { useFavoritesStore } from "@/store/use-store";
import { EmptyState } from "@/components/ui/empty-state";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function FavorisPage() {
    const { favorites } = useFavoritesStore();
    const router = useRouter();

    // Note: Dans une vraie implémentation, on récupérerait les détails des favoris depuis la DB
    // via l'ID stocké dans favorites. Ici on simule ou on affiche juste l'état vide.

    return (
        <div className="space-y-6 py-6 text-foreground min-h-[60vh]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold">Mes Favoris</h1>
                    <p className="text-muted-foreground">Retrouvez ici vos annonces sauvegardées</p>
                </div>
            </div>

            {favorites.length === 0 ? (
                <EmptyState
                    title="Aucun favori pour le moment"
                    description="Parcourez les annonces et cliquez sur le cœur pour sauvegarder vos biens préférés."
                    actionLabel="Explorer les annonces"
                    onAction={() => router.push("/recherche")}
                    icon={Heart} // Lucide icon component, removing extra braces
                />
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {favorites.map((favId) => (
                        <Card key={String(favId)} className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-foreground">Bien #{String(favId)}</CardTitle>
                                <CardDescription>Annonce sauvegardée</CardDescription>
                                <Button asChild className="w-full mt-4" variant="secondary">
                                    <Link href={`/biens/${favId}`}>Voir l'annonce</Link>
                                </Button>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
