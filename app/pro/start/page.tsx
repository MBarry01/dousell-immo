"use client";

import { Suspense } from "react";
import Link from "next/link";
import { WizardForm } from "@/components/onboarding/WizardForm";

export default function CommencerPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#05080c] via-[#0a1020] to-[#05080c]">
            {/* Hero Section */}
            <div className="relative pt-10 pb-8 text-center text-white">
                <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
                <div className="relative z-10 max-w-3xl mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                        Démarrez votre transformation digitale
                    </h1>
                    <p className="text-lg text-white/60 max-w-xl mx-auto">
                        Rejoignez plus de 500 gestionnaires qui font confiance à Dousell Immo.
                    </p>
                    {/* Lien de connexion pour les utilisateurs existants */}
                    <p className="mt-4 text-sm text-white/50">
                        Déjà un compte ?{" "}
                        <Link
                            href="/login"
                            className="text-[#F4C430] hover:text-[#FFD700] underline underline-offset-2 transition-colors"
                        >
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>

            {/* Wizard Form */}
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="mt-4 text-white/60">Chargement du formulaire...</p>
                </div>
            }>
                <WizardForm />
            </Suspense>
        </div>
    );
}
