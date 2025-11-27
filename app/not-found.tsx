import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <h1 className="text-9xl font-bold text-white/5">404</h1>
      <div className="absolute flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Page introuvable</h2>
        <p className="text-white/60 max-w-md">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Button asChild>
          <Link href="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
}
