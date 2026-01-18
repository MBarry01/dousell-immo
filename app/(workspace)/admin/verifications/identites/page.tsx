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
                    <h1 className="text-3xl font-bold text-foreground">Vérification d&apos;Identités</h1>
                    <p className="text-muted-foreground">Validation des CNI et Passeports pour certification globale des profils</p>
                </div>
            </div>

            {/* Info Card */}
            <Card className="border-blue-500/20 bg-blue-500/5 p-4">
                <div className="flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="text-sm text-foreground/80">
                        <p className="font-semibold text-foreground mb-1">Certification Globale</p>
                        <p>
                            En approuvant un document d&apos;identité, vous certifiez l&apos;identité de l&apos;utilisateur sur l&apos;ensemble de
                            la plateforme. Son profil affichera un badge &quot;Vérifié&quot; visible sur toutes ses annonces.
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
                        <p className="text-red-500">Erreur: {result.error}</p>
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
                <Card key={i} className="border-border bg-card p-6 animate-pulse">
                    <div className="h-32 bg-muted rounded-lg mb-4" />
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                </Card>
            ))}
        </div>
    );
}


