import Link from "next/link";
import { Home, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Page introuvable · Doussel Immo",
  description: "La page que vous recherchez n'existe pas ou a été déplacée.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#05080c] via-[#05080c] to-[#040507] px-6 text-center text-white">
      <div className="mb-8">
        <div className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-white/10">
          <MapPin className="h-16 w-16 text-white/40" />
          <div className="absolute inset-0 animate-ping rounded-full bg-white/10" />
        </div>
        <h1 className="text-4xl font-bold md:text-5xl">
          Oups, cette page a déménagé.
        </h1>
        <p className="mt-4 max-w-md text-lg text-white/70">
          Il semblerait que ce bien n&apos;existe plus ou que l&apos;adresse soit
          incorrecte. Pas de panique, on t&apos;accompagne vers de meilleures
          destinations.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Button className="rounded-full px-6" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
        </Button>
        <Button variant="secondary" className="rounded-full px-6" asChild>
          <Link href="/recherche">
            Explorer les biens
          </Link>
        </Button>
      </div>

      <div className="mt-12 text-sm text-white/40">
        <p>Erreur 404</p>
      </div>
    </div>
  );
}

