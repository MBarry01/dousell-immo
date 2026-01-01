"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TestDesignSystemPage() {
  return (
    <div className="min-h-screen bg-background p-8 pt-24">
      <div className="mx-auto max-w-7xl space-y-12">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">
            🎨 Design System "Luxe & Teranga"
          </h1>
          <p className="text-white/70">
            Démonstration des micro-interactions et skeleton screens améliorés
          </p>
        </div>

        {/* Section Skeleton Screens */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">
              ✨ Skeleton Screens avec Shimmer Or
            </h2>
            <p className="text-sm text-white/60">
              Nouveaux variants : luxury (shimmer or double couche), card (gradient diagonal), text (pulse subtil)
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Variant Luxury */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Variant: Luxury
              </p>
              <Skeleton variant="luxury" className="h-32 w-full rounded-2xl" />
              <Skeleton variant="luxury" className="h-6 w-3/4 rounded-full" />
              <Skeleton variant="luxury" className="h-6 w-1/2 rounded-full" />
            </div>

            {/* Variant Card */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Variant: Card
              </p>
              <Skeleton variant="card" className="h-32 w-full rounded-2xl" />
              <Skeleton variant="card" className="h-6 w-3/4 rounded-xl" />
              <Skeleton variant="card" className="h-6 w-1/2 rounded-xl" />
            </div>

            {/* Variant Text */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Variant: Text
              </p>
              <div className="space-y-2 rounded-2xl bg-card p-6">
                <Skeleton variant="text" className="w-full" />
                <Skeleton variant="text" className="w-5/6" />
                <Skeleton variant="text" className="w-4/6" />
                <Skeleton variant="text" className="w-3/6" />
              </div>
            </div>
          </div>
        </section>

        {/* Section Cards Interactive */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">
              🎯 Card Component avec Micro-interactions
            </h2>
            <p className="text-sm text-white/60">
              Nouveau variant interactive avec hover:shadow-lg, hover:border-primary, active:scale
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Card Default */}
            <Card>
              <CardHeader>
                <CardTitle>Card Default</CardTitle>
                <CardDescription>
                  Variant par défaut avec transition de base
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/70">
                  Pas d&apos;effet hover particulier, juste une transition fluide.
                </p>
              </CardContent>
            </Card>

            {/* Card Interactive */}
            <Card variant="interactive" onClick={() => alert('Card cliquée !')}>
              <CardHeader>
                <CardTitle>Card Interactive 🚀</CardTitle>
                <CardDescription>
                  Variant interactive - Essayez de survoler et cliquer !
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/70">
                  Effets : shadow or, border or, scale, cursor pointer
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section Badges */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">
              🏷️ Badge Component avec Animations
            </h2>
            <p className="text-sm text-white/60">
              Nouveaux effets : hover:scale-105, hover:shadow-md, active:scale-95
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge>Default Badge</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge interactive>Interactive Badge</Badge>
            <Badge variant="secondary" interactive>
              Cliquable
            </Badge>
          </div>

          <p className="text-xs text-white/50">
            💡 Survolez les badges pour voir l&apos;effet scale et shadow
          </p>
        </section>

        {/* Section Demo PropertyCard-like */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">
              🏠 Simulation PropertyCard Loading
            </h2>
            <p className="text-sm text-white/60">
              Aperçu du skeleton utilisé pour les cartes de propriétés
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`demo-${index}`} className="space-y-3">
                <Skeleton variant="card" className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton variant="luxury" className="h-6 w-3/4 rounded-full" />
                <Skeleton variant="text" className="h-4 w-1/2" />
                <Skeleton variant="luxury" className="h-8 w-32 rounded-full" />
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton
                      key={`feature-${index}-${i}`}
                      variant="text"
                      className="h-4 w-16"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer info */}
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-white/50">
            🎨 Design System "Luxe & Teranga" - Couleur Or : #F4C430
          </p>
          <p className="mt-2 text-xs text-white/40">
            Tous les composants utilisent maintenant des micro-interactions sophistiquées
          </p>
        </div>
      </div>
    </div>
  );
}
