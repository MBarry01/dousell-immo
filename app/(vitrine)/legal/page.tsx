import Link from "next/link";
import { ArrowLeft, Shield, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Mentions Légales · Dousell Immo",
  description: "Centre légal de Dousell Immo : Mentions légales, CGU et Politique de confidentialité",
};

export default function LegalHubPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8 px-4 text-white">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l&apos;accueil
        </Link>
      </Button>

      <div className="space-y-4 text-center mb-12">
        <h1 className="text-4xl font-bold">Centre Légal</h1>
        <p className="text-white/60">
          Retrouvez ici toutes les informations légales concernant Dousell Immo
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/legal/cgu" className="block h-full">
          <Card className="bg-background/5 border-white/10 hover:bg-background/10 transition-colors h-full cursor-pointer">
            <CardHeader>
              <FileText className="h-8 w-8 text-amber-400 mb-2" />
              <CardTitle className="text-white">Conditions Générales d&apos;Utilisation</CardTitle>
              <CardDescription className="text-white/60">
                Règles d&apos;utilisation de la plateforme et engagements des utilisateurs.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/legal/privacy" className="block h-full">
          <Card className="bg-background/5 border-white/10 hover:bg-background/10 transition-colors h-full cursor-pointer">
            <CardHeader>
              <Lock className="h-8 w-8 text-emerald-400 mb-2" />
              <CardTitle className="text-white">Politique de Confidentialité</CardTitle>
              <CardDescription className="text-white/60">
                Comment nous collectons, utilisons et protégeons vos données personnelles.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <div className="mt-12 space-y-6 prose prose-invert prose-lg max-w-none">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-blue-400" />
          <h2 className="text-2xl font-semibold m-0">Mentions Légales</h2>
        </div>
        
        <div className="bg-background/5 rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Éditeur</h3>
              <ul className="space-y-1 text-sm text-white/70 list-none pl-0">
                <li><strong>Raison sociale :</strong> Dousell Immo</li>
                <li><strong>Siège social :</strong> Sacré-Cœur 3, VDN, Dakar</li>
                <li><strong>Téléphone :</strong> +221 33 860 00 00</li>
                <li><strong>Email :</strong> contact@dousell.immo</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Hébergement</h3>
              <ul className="space-y-1 text-sm text-white/70 list-none pl-0">
                <li><strong>Hébergeur :</strong> Vercel Inc.</li>
                <li><strong>Adresse :</strong> 340 S Lemon Ave #4133</li>
                <li>Walnut, CA 91789, USA</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
