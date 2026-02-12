"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Building2, Mail, Phone, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateTeam } from "../actions";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import type { Team } from "@/types/team";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface TeamSettingsFormProps {
  team: Team;
}

export function TeamSettingsForm({ team }: TeamSettingsFormProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || "",
    company_address: team.company_address || "",
    company_phone: team.company_phone || "",
    company_email: team.company_email || "",
    company_ninea: team.company_ninea || "",
    billing_email: team.billing_email || "",
    default_billing_day: team.default_billing_day,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateTeam(team.id, formData);

    setLoading(false);

    if (result.success) {
      toast.success("Paramètres mis à jour");
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la mise à jour");
    }
  };

  const hasChanges =
    formData.name !== team.name ||
    formData.description !== (team.description || "") ||
    formData.company_address !== (team.company_address || "") ||
    formData.company_phone !== (team.company_phone || "") ||
    formData.company_email !== (team.company_email || "") ||
    formData.company_ninea !== (team.company_ninea || "") ||
    formData.billing_email !== (team.billing_email || "") ||
    formData.default_billing_day !== team.default_billing_day;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations générales */}
      <div
        className={cn(
          "rounded-xl border p-6",
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
        )}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className={cn(
              "p-2 rounded-lg",
              isDark ? "bg-slate-800" : "bg-gray-100"
            )}
          >
            <Building2
              className={cn(
                "w-5 h-5",
                isDark ? "text-slate-400" : "text-gray-500"
              )}
            />
          </div>
          <h2
            className={cn(
              "text-lg font-semibold",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            Informations générales
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label
              className={cn(
                "text-sm font-medium mb-1.5 block",
                isDark ? "text-slate-300" : "text-gray-700"
              )}
              required
            >
              Nom de l'équipe
            </Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              className={cn(isDark && "bg-slate-800 border-slate-700 text-white")}
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
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className={cn(isDark && "bg-slate-800 border-slate-700 text-white")}
            />
          </div>
        </div>
      </div>

      {/* Coordonnées */}
      <div
        className={cn(
          "rounded-xl border p-6",
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
        )}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className={cn(
              "p-2 rounded-lg",
              isDark ? "bg-slate-800" : "bg-gray-100"
            )}
          >
            <Mail
              className={cn(
                "w-5 h-5",
                isDark ? "text-slate-400" : "text-gray-500"
              )}
            />
          </div>
          <h2
            className={cn(
              "text-lg font-semibold",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            Coordonnées
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label
              className={cn(
                "text-sm font-medium mb-1.5 flex items-center gap-2",
                isDark ? "text-slate-300" : "text-gray-700"
              )}
            >
              <Phone className="w-4 h-4" />
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
              className={cn(isDark && "bg-slate-800 border-slate-700 text-white")}
            />
          </div>

          <div>
            <label
              className={cn(
                "text-sm font-medium mb-1.5 flex items-center gap-2",
                isDark ? "text-slate-300" : "text-gray-700"
              )}
            >
              <Mail className="w-4 h-4" />
              Email de contact
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
              className={cn(isDark && "bg-slate-800 border-slate-700 text-white")}
            />
          </div>

          <div className="md:col-span-2">
            <label
              className={cn(
                "text-sm font-medium mb-1.5 flex items-center gap-2",
                isDark ? "text-slate-300" : "text-gray-700"
              )}
            >
              <MapPin className="w-4 h-4" />
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
              className={cn(isDark && "bg-slate-800 border-slate-700 text-white")}
            />
          </div>

          <div>
            <label
              className={cn(
                "text-sm font-medium mb-1.5 flex items-center gap-2",
                isDark ? "text-slate-300" : "text-gray-700"
              )}
            >
              <FileText className="w-4 h-4" />
              NINEA
            </label>
            <Input
              value={formData.company_ninea}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  company_ninea: e.target.value,
                }))
              }
              placeholder="123456789"
              className={cn(isDark && "bg-slate-800 border-slate-700 text-white")}
            />
          </div>
        </div>
      </div>

      {/* Facturation */}
      <div
        className={cn(
          "rounded-xl border p-6",
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
        )}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className={cn(
              "p-2 rounded-lg",
              isDark ? "bg-slate-800" : "bg-gray-100"
            )}
          >
            <FileText
              className={cn(
                "w-5 h-5",
                isDark ? "text-slate-400" : "text-gray-500"
              )}
            />
          </div>
          <h2
            className={cn(
              "text-lg font-semibold",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            Facturation
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label
              className={cn(
                "text-sm font-medium mb-1.5 block",
                isDark ? "text-slate-300" : "text-gray-700"
              )}
            >
              Email de facturation
            </label>
            <Input
              type="email"
              value={formData.billing_email}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  billing_email: e.target.value,
                }))
              }
              placeholder="comptabilite@agence.sn"
              className={cn(isDark && "bg-slate-800 border-slate-700 text-white")}
            />
          </div>

          <div>
            <label
              className={cn(
                "text-sm font-medium mb-1.5 block",
                isDark ? "text-slate-300" : "text-gray-700"
              )}
            >
              Jour d'échéance par défaut
            </label>
            <Input
              type="number"
              min={1}
              max={31}
              value={formData.default_billing_day}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  default_billing_day: parseInt(e.target.value) || 5,
                }))
              }
              className={cn(isDark && "bg-slate-800 border-slate-700 text-white")}
            />
            <p
              className={cn(
                "text-xs mt-1",
                isDark ? "text-slate-500" : "text-gray-400"
              )}
            >
              Jour du mois pour les paiements de loyer
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={loading || !hasChanges}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
