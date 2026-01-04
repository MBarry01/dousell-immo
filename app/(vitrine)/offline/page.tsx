"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-background/5">
          <WifiOff className="h-12 w-12 text-white/50" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">
            Vous êtes hors ligne
          </h1>
          <p className="text-white/70">
            Vérifiez votre connexion internet et réessayez.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={handleRetry}
            className="rounded-full bg-primary text-black"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
          <Button
            variant="secondary"
            className="rounded-full border border-white/10 bg-background/5 text-white"
            asChild
          >
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}


