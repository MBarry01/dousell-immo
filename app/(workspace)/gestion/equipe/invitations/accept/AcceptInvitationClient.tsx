"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, XCircle, Clock, Mail, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { TEAM_ROLE_CONFIG } from "@/lib/team-permissions";
import { acceptInvitation } from "../../actions";
import { toast } from "sonner";
import type { TeamRole } from "@/types/team";

interface InvitationData {
  id: string;
  team_id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  message: string | null;
  token: string;
  team: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  } | null;
}

interface AcceptInvitationClientProps {
  invitation: InvitationData;
  token: string;
  isExpired: boolean;
  emailMatch: boolean;
  userEmail: string;
}

export function AcceptInvitationClient({
  invitation,
  token,
  isExpired,
  emailMatch,
  userEmail,
}: AcceptInvitationClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const roleConfig = TEAM_ROLE_CONFIG[invitation.role as TeamRole];

  const handleAccept = async () => {
    setIsLoading(true);

    const result = await acceptInvitation(token);

    if (result.success) {
      toast.success("Vous avez rejoint l'équipe avec succès!");
      router.push("/gestion/equipe");
    } else {
      toast.error(result.error || "Erreur lors de l'acceptation");
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    router.push("/gestion/equipe");
  };

  // Si expirée
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <CardTitle className="text-white">Invitation expirée</CardTitle>
            <CardDescription className="text-slate-400">
              Cette invitation a expiré le {new Date(invitation.expires_at).toLocaleDateString("fr-FR")}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={handleDecline} className="border-slate-700 text-slate-300">
              Retour
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Si l'email ne correspond pas
  if (!emailMatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-white">Email incompatible</CardTitle>
            <CardDescription className="text-slate-400">
              Cette invitation a été envoyée à <strong className="text-white">{invitation.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-slate-300">
                Vous êtes connecté avec <strong>{userEmail}</strong>. Veuillez vous connecter avec le bon compte ou demander une nouvelle invitation.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={handleDecline} className="border-slate-700 text-slate-300">
              Retour
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Interface normale d'acceptation
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-white">
            Invitation à rejoindre {invitation.team?.name}
          </CardTitle>
          <CardDescription className="text-slate-400 mt-2">
            {invitation.team?.description || "Gérez vos biens immobiliers en équipe"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
            <Mail className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Invité·e</p>
              <p className="text-sm font-medium text-white">{invitation.email}</p>
            </div>
          </div>

          {/* Rôle */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
            <Shield className="h-5 w-5 text-slate-400" />
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Rôle proposé</p>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(roleConfig.bgColor, roleConfig.textColor, "border-0")}
                >
                  {roleConfig.label}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">{roleConfig.description}</p>
            </div>
          </div>

          {/* Message personnalisé */}
          {invitation.message && (
            <div className="p-4 rounded-lg bg-slate-800/50 border-l-4 border-primary">
              <p className="text-xs text-slate-500 mb-1">Message de l&apos;équipe</p>
              <p className="text-sm text-slate-300 italic">&quot;{invitation.message}&quot;</p>
            </div>
          )}

          {/* Expiration */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-4 w-4" />
            <span>
              Cette invitation expire le {new Date(invitation.expires_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={isLoading}
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Refuser
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary/90 text-black font-semibold"
          >
            {isLoading ? (
              "Acceptation..."
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Accepter l&apos;invitation
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
