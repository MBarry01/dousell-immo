"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/app/(workspace)/gestion/equipe/actions";

export function AcceptInvitationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien d'invitation invalide");
      return;
    }

    const processInvitation = async () => {
      const result = await acceptInvitation(token);

      if (result.success) {
        setStatus("success");
        setTeamName(result.teamName || "l'équipe");
        setMessage(`Vous avez rejoint ${result.teamName || "l'équipe"} avec succès !`);
      } else {
        setStatus("error");
        setMessage(result.error || "Une erreur est survenue");
      }
    };

    processInvitation();
  }, [token]);

  return (
    <div className="max-w-md w-full">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#F4C430] animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              Traitement en cours...
            </h1>
            <p className="text-slate-400">
              Veuillez patienter pendant que nous validons votre invitation.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              Bienvenue dans l&apos;équipe !
            </h1>
            <p className="text-slate-400 mb-6">{message}</p>

            <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-3">
                <Users className="w-5 h-5 text-[#F4C430]" />
                <span className="text-white font-medium">{teamName}</span>
              </div>
            </div>

            <Button
              onClick={() => router.push("/gestion/equipe")}
              className="w-full bg-[#F4C430] hover:bg-[#B8860B] text-black"
            >
              Accéder à l&apos;équipe
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              Invitation invalide
            </h1>
            <p className="text-slate-400 mb-6">{message}</p>

            <div className="space-y-3">
              <Button
                onClick={() => router.push("/gestion")}
                className="w-full bg-[#F4C430] hover:bg-[#B8860B] text-black"
              >
                Aller à la gestion locative
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Retour à l&apos;accueil
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-slate-500 text-sm mt-6">
        © {new Date().getFullYear()} Dousel. Tous droits réservés.
      </p>
    </div>
  );
}
