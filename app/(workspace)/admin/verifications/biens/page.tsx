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
                    <h1 className="text-3xl font-bold text-foreground">Vérification de Biens</h1>
                    <p className="text-muted-foreground">Validation des titres de propriété pour certification des annonces</p>
                </div>
            </div>

            {/* Info Card */}
            <Card className="border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <div className="text-sm text-foreground/80">
                        <p className="font-semibold text-foreground mb-1">Certification Spécifique</p>
                        <p>
                            En approuvant un document de propriété, vous certifiez l&apos;annonce spécifique associée.
                            Le bien affichera un badge &quot;Certifié&quot; pour renforcer la confiance des acheteurs.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Documents List */}
            <Suspense fallback={<LoadingSkeleton />}>
                {result.success ? (
                    <PropertyVerificationList initialProperties={result.data} />
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
        <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-border bg-card p-6 animate-pulse">
                    <div className="h-48 bg-muted rounded-lg mb-4" />
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                </Card>
            ))}
        </div>
    );
}


