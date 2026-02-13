import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ShieldCheck, UserCheck, Home } from "lucide-react";

export const metadata = {
    title: "Vérifications | Admin",
    description: "Gestion des vérifications de documents"
};

export default function VerificationsIndexPage() {
    return (
        <div className="px-4 md:px-6 lg:px-8 space-y-6 py-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3 border border-primary/20">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Vérifications</h1>
                    <p className="text-muted-foreground">Validation des documents et certification des profils/biens</p>
                </div>
            </div>

            {/* Verification Sections */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Identity Verification */}
                <Link href="/admin/verifications/identites">
                    <Card className="group border-border bg-card p-6 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-blue-500/10 p-3 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors shrink-0">
                                <UserCheck className="h-8 w-8 text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-foreground mb-2 group-hover:text-blue-500 transition-colors">
                                    Identités (Profils)
                                </h2>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Validation des documents d&apos;identité (CNI, Passeport) pour certification globale des profils utilisateurs
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-blue-500">Certification Globale</span>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className="text-xs text-muted-foreground">CNI / Passeport</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Link>

                {/* Property Verification */}
                <Link href="/admin/verifications/biens">
                    <Card className="group border-border bg-card p-6 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-emerald-500/10 p-3 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                                <Home className="h-8 w-8 text-emerald-500" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-foreground mb-2 group-hover:text-emerald-500 transition-colors">
                                    Biens (Annonces)
                                </h2>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Validation des documents de propriété (Titres, Baux) pour certification spécifique des annonces
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-emerald-500">Certification Spécifique</span>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className="text-xs text-muted-foreground">Titres de propriété</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Link>
            </div>

            {/* Info Card */}
            <Card className="border-border bg-card p-6">
                <div className="flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm text-foreground/80">
                        <p className="font-semibold text-foreground mb-2">Processus de vérification</p>
                        <ul className="space-y-1">
                            <li>• <strong>Identités :</strong> Certifie le profil utilisateur globalement (badge &quot;Vérifié&quot; sur toutes ses annonces)</li>
                            <li>• <strong>Biens :</strong> Certifie une annonce spécifique (badge &quot;Certifié&quot; sur l&apos;annonce concernée)</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
}


