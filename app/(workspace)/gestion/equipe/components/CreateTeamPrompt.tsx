"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, Loader2, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createTeam } from "../actions";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";

interface ProfileData {
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_ninea: string | null;
  full_name: string | null;
  email: string | null;
}

interface CreateTeamPromptProps {
  profileData?: ProfileData | null;
}

export function CreateTeamPrompt({ profileData }: CreateTeamPromptProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Déterminer si l'utilisateur a déjà configuré son agence
  const hasExistingAgency = Boolean(profileData?.company_name);

  // Pré-remplir avec les données du profil si disponibles
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_ninea: "",
  });

  // Pré-remplir quand profileData est disponible
  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.company_name || "",
        description: "",
        company_address: profileData.company_address || "",
        company_phone: profileData.company_phone || "",
        company_email: profileData.company_email || profileData.email || "",
        company_ninea: profileData.company_ninea || "",
      });
    }
  }, [profileData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createTeam(formData);

    setLoading(false);

    if (result.success) {
      toast.success("Équipe créée avec succès !");
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la création");
    }
  };

  const handleContinueSolo = () => {
    router.push("/gestion");
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={cn(
              "inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6",
              isDark ? "bg-slate-800" : "bg-gray-100"
            )}
          >
            <Users className="w-10 h-10 text-[#F4C430]" />
          </div>
          <h1
            className={cn(
              "text-3xl font-bold mb-3",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            Gestion d&apos;équipe
          </h1>
          <p className={cn("text-lg", isDark ? "text-slate-400" : "text-gray-600")}>
            Collaborez avec votre équipe pour gérer vos biens locatifs
          </p>
        </div>

        {/* Message si agence déjà configurée */}
        {hasExistingAgency && (
          <div
            className={cn(
              "mb-6 p-4 rounded-xl border flex items-start gap-3",
              isDark
                ? "bg-green-500/10 border-green-500/20"
                : "bg-green-50 border-green-200"
            )}
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className={cn("font-medium", isDark ? "text-green-400" : "text-green-700")}>
                Agence déjà configurée : {profileData?.company_name}
              </p>
              <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-gray-600")}>
                Vos informations seront automatiquement utilisées pour créer votre équipe.
              </p>
            </div>
          </div>
        )}

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Option 1: Créer une équipe */}
          <button
            onClick={() => setShowForm(true)}
            className={cn(
              "group relative p-6 rounded-2xl border-2 text-left transition-all duration-200",
              "hover:border-[#F4C430] hover:shadow-lg hover:shadow-[#F4C430]/10",
              isDark
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-gray-200"
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "p-3 rounded-xl",
                  isDark ? "bg-slate-800" : "bg-gray-100",
                  "group-hover:bg-[#F4C430]/10"
                )}
              >
                <Building2
                  className={cn(
                    "w-6 h-6",
                    isDark ? "text-slate-400" : "text-gray-500",
                    "group-hover:text-[#F4C430]"
                  )}
                />
              </div>
              <div className="flex-1">
                <h3
                  className={cn(
                    "font-semibold text-lg mb-1",
                    isDark ? "text-white" : "text-gray-900"
                  )}
                >
                  {hasExistingAgency ? "Activer le mode équipe" : "Créer une équipe"}
                </h3>
                <p
                  className={cn(
                    "text-sm mb-3",
                    isDark ? "text-slate-400" : "text-gray-500"
                  )}
                >
                  {hasExistingAgency
                    ? "Transformez votre agence en équipe et invitez des collaborateurs"
                    : "Invitez des collaborateurs et attribuez-leur des rôles spécifiques"}
                </p>
                <div className="flex items-center gap-2 text-[#F4C430] text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span>Recommandé</span>
                </div>
              </div>
              <ArrowRight
                className={cn(
                  "w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity",
                  isDark ? "text-slate-400" : "text-gray-400"
                )}
              />
            </div>
          </button>

          {/* Option 2: Continuer seul */}
          <button
            onClick={handleContinueSolo}
            className={cn(
              "group relative p-6 rounded-2xl border-2 text-left transition-all duration-200",
              "hover:border-slate-500",
              isDark
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-gray-200"
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "p-3 rounded-xl",
                  isDark ? "bg-slate-800" : "bg-gray-100"
                )}
              >
                <Users
                  className={cn(
                    "w-6 h-6",
                    isDark ? "text-slate-400" : "text-gray-500"
                  )}
                />
              </div>
              <div className="flex-1">
                <h3
                  className={cn(
                    "font-semibold text-lg mb-1",
                    isDark ? "text-white" : "text-gray-900"
                  )}
                >
                  Continuer seul
                </h3>
                <p
                  className={cn(
                    "text-sm",
                    isDark ? "text-slate-400" : "text-gray-500"
                  )}
                >
                  Gérez vos biens en solo. Vous pourrez créer une équipe plus
                  tard.
                </p>
              </div>
              <ArrowRight
                className={cn(
                  "w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity",
                  isDark ? "text-slate-400" : "text-gray-400"
                )}
              />
            </div>
          </button>
        </div>

        {/* Modal de création */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent
            className={cn(
              "sm:max-w-lg",
              isDark ? "bg-slate-900 border-slate-700" : "bg-white"
            )}
          >
            <DialogHeader>
              <DialogTitle
                className={cn(isDark ? "text-white" : "text-gray-900")}
              >
                {hasExistingAgency ? "Activer le mode équipe" : "Créer votre équipe"}
              </DialogTitle>
              <DialogDescription>
                {hasExistingAgency
                  ? "Vérifiez les informations pré-remplies depuis votre configuration"
                  : "Renseignez les informations de votre équipe ou agence"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label
                  className={cn(
                    "text-sm font-medium mb-1.5 block",
                    isDark ? "text-slate-300" : "text-gray-700"
                  )}
                >
                  Nom de l&apos;équipe <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Baraka Immobilier"
                  required
                  className={cn(
                    isDark && "bg-slate-800 border-slate-700 text-white"
                  )}
                />
              </div>

              <div>
                <label
                  className={cn(
                    "text-sm font-medium mb-1.5 block",
                    isDark ? "text-slate-300" : "text-gray-700"
                  )}
                >
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Décrivez brièvement votre équipe..."
                  rows={3}
                  className={cn(
                    isDark && "bg-slate-800 border-slate-700 text-white"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={cn(
                      "text-sm font-medium mb-1.5 block",
                      isDark ? "text-slate-300" : "text-gray-700"
                    )}
                  >
                    Téléphone
                  </label>
                  <Input
                    value={formData.company_phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        company_phone: e.target.value,
                      }))
                    }
                    placeholder="+221 77 123 45 67"
                    className={cn(
                      isDark && "bg-slate-800 border-slate-700 text-white"
                    )}
                  />
                </div>

                <div>
                  <label
                    className={cn(
                      "text-sm font-medium mb-1.5 block",
                      isDark ? "text-slate-300" : "text-gray-700"
                    )}
                  >
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.company_email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        company_email: e.target.value,
                      }))
                    }
                    placeholder="contact@agence.sn"
                    className={cn(
                      isDark && "bg-slate-800 border-slate-700 text-white"
                    )}
                  />
                </div>
              </div>

              <div>
                <label
                  className={cn(
                    "text-sm font-medium mb-1.5 block",
                    isDark ? "text-slate-300" : "text-gray-700"
                  )}
                >
                  Adresse
                </label>
                <Input
                  value={formData.company_address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      company_address: e.target.value,
                    }))
                  }
                  placeholder="123 Avenue Bourguiba, Dakar"
                  className={cn(
                    isDark && "bg-slate-800 border-slate-700 text-white"
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className={cn(
                    isDark && "border-slate-700 text-slate-300 hover:bg-slate-800"
                  )}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="bg-[#F4C430] hover:bg-[#B8860B] text-black"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    hasExistingAgency ? "Activer l'équipe" : "Créer l'équipe"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
