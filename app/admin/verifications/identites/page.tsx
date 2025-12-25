import { Suspense } from "react";
import { getPendingIdentityDocuments } from "./actions";
import { IdentityVerificationList } from "./identity-verification-list";
import { Card } from "@/components/ui/card";
import { UserCheck, ShieldCheck } from "lucide-react";

export const metadata = {
    title: "Vérification d'Identités | Admin",
    description: "Validation des documents d'identité (CNI, Passeport)"
};

export default async function IdentityVerificationPage() {
    const result = await getPendingIdentityDocuments();

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-500/10 p-3 border border-blue-500/20">
                    <UserCheck className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Vérification d'Identités</h1>
                    <p className="text-white/60">Validation des CNI et Passeports pour certification globale des profils</p>
                </div>
            </div>

            {/* Info Card */}
            <Card className="border-blue-500/20 bg-blue-500/5 p-4">
                <div className="flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="text-sm text-white/70">
                        <p className="font-semibold text-white mb-1">Certification Globale</p>
                        <p>
                            En approuvant un document d'identité, vous certifiez l'identité de l'utilisateur sur l'ensemble de
                            la plateforme. Son profil affichera un badge "Vérifié" visible sur toutes ses annonces.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Documents List */}
            <Suspense fallback={<LoadingSkeleton />}>
                {result.success ? (
                    <IdentityVerificationList initialDocuments={result.data} />
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-white/10 bg-white/5 p-6 animate-pulse">
                    <div className="h-32 bg-white/10 rounded-lg mb-4" />
                    <div className="h-4 bg-white/10 rounded mb-2" />
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                </Card>
            ))}
        </div>
    );
}
