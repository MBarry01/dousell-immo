import { Suspense } from "react";
import { getPendingPropertyDocuments } from "./actions";
import { PropertyVerificationList } from "./property-verification-list";
import { Card } from "@/components/ui/card";
import { Home, ShieldCheck } from "lucide-react";

export const metadata = {
    title: "Vérification de Biens | Admin",
    description: "Validation des documents de propriété (Titres, Baux)"
};

export default async function PropertyVerificationPage() {
    const result = await getPendingPropertyDocuments();

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="rounded-xl bg-emerald-500/10 p-3 border border-emerald-500/20">
                    <Home className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Vérification de Biens</h1>
                    <p className="text-white/60">Validation des titres de propriété pour certification des annonces</p>
                </div>
            </div>

            {/* Info Card */}
            <Card className="border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5" />
                    <div className="text-sm text-white/70">
                        <p className="font-semibold text-white mb-1">Certification Spécifique</p>
                        <p>
                            En approuvant un document de propriété, vous certifiez l'annonce spécifique associée.
                            Le bien affichera un badge "Certifié" pour renforcer la confiance des acheteurs.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Documents List */}
            <Suspense fallback={<LoadingSkeleton />}>
                {result.success ? (
                    <PropertyVerificationList initialProperties={result.data as any} />
                ) : (
                    <Card className="border-red-500/20 bg-red-500/5 p-6 text-center">
                        <p className="text-red-400">Erreur: {result.error}</p>
                    </Card>
                )}
            </Suspense>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-white/10 bg-white/5 p-6 animate-pulse">
                    <div className="h-48 bg-white/10 rounded-lg mb-4" />
                    <div className="h-4 bg-white/10 rounded mb-2" />
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                </Card>
            ))}
        </div>
    );
}
