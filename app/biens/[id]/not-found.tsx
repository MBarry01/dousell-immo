"use client";

import Link from "next/link";
import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PropertyNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#05080c] px-6 text-center text-white">
      <div className="mb-6 rounded-full bg-white/10 p-6">
        <Home className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-3xl font-semibold">Bien introuvable</h1>
      <p className="mt-3 max-w-md text-white/70">
        Ce bien n&apos;existe plus ou a été retiré par nos équipes. Reviens à
        l&apos;accueil pour découvrir d&apos;autres pépites.
      </p>
      <Button className="mt-6 rounded-full px-6" asChild>
        <Link href="/">Retour à l&apos;accueil</Link>
      </Button>
    </div>
  );
}







