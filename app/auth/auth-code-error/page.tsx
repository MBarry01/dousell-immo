import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white">
            Erreur d&apos;authentification
          </h1>
          <p className="text-white/70">
            Le lien d&apos;authentification est invalide ou a expiré.
          </p>
        </div>
        <div className="space-y-3">
          <Button asChild className="w-full rounded-xl bg-white text-black">
            <Link href="/login">Retour à la connexion</Link>
          </Button>
          <Button
            variant="secondary"
            asChild
            className="w-full rounded-xl border border-white/10 bg-white/5 text-white"
          >
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

