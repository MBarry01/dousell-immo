"use client";

import { Check, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TEAM_PERMISSIONS, TEAM_ROLE_CONFIG } from "@/lib/team-permissions";
import type { TeamRole } from "@/types/team";

interface PermissionCategory {
  name: string;
  permissions: {
    key: string;
    label: string;
    description: string;
  }[];
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    name: "Équipe",
    permissions: [
      { key: "team.settings.view", label: "Voir paramètres", description: "Accéder aux paramètres de l'équipe" },
      { key: "team.settings.edit", label: "Modifier paramètres", description: "Modifier les paramètres de l'équipe" },
      { key: "team.members.view", label: "Voir membres", description: "Voir la liste des membres" },
      { key: "team.members.invite", label: "Inviter membres", description: "Envoyer des invitations" },
      { key: "team.members.edit_role", label: "Changer rôles", description: "Modifier les rôles des membres" },
      { key: "team.members.remove", label: "Supprimer membres", description: "Retirer des membres de l'équipe" },
      { key: "team.audit.view", label: "Voir l'historique", description: "Consulter les logs d'audit" },
    ],
  },
  {
    name: "Baux & Locataires",
    permissions: [
      { key: "leases.view", label: "Voir baux", description: "Consulter les baux" },
      { key: "leases.create", label: "Créer baux", description: "Créer de nouveaux baux" },
      { key: "leases.edit", label: "Modifier baux", description: "Modifier les baux existants" },
      { key: "leases.terminate", label: "Résilier baux", description: "Résilier des baux" },
      { key: "tenants.view", label: "Voir locataires", description: "Consulter les profils locataires" },
      { key: "tenants.contact", label: "Contacter locataires", description: "Envoyer des messages aux locataires" },
    ],
  },
  {
    name: "Finances",
    permissions: [
      { key: "payments.view", label: "Voir paiements", description: "Consulter les paiements" },
      { key: "payments.confirm", label: "Confirmer paiements", description: "Valider les paiements reçus" },
      { key: "receipts.generate", label: "Générer quittances", description: "Créer des quittances de loyer" },
      { key: "expenses.view", label: "Voir dépenses", description: "Consulter les dépenses" },
      { key: "expenses.create", label: "Créer dépenses", description: "Enregistrer de nouvelles dépenses" },
      { key: "reports.financial.view", label: "Rapports financiers", description: "Consulter les rapports financiers" },
    ],
  },
  {
    name: "Maintenance & Documents",
    permissions: [
      { key: "maintenance.view", label: "Voir interventions", description: "Consulter les demandes de maintenance" },
      { key: "maintenance.create", label: "Créer interventions", description: "Créer des demandes de maintenance" },
      { key: "maintenance.approve_quote", label: "Approuver devis", description: "Valider les devis de travaux" },
      { key: "documents.view", label: "Voir documents", description: "Consulter les documents" },
      { key: "documents.generate", label: "Générer documents", description: "Créer des documents légaux" },
    ],
  },
  {
    name: "Biens Immobiliers",
    permissions: [
      { key: "properties.view", label: "Voir biens", description: "Consulter les biens" },
      { key: "properties.create", label: "Créer biens", description: "Ajouter de nouveaux biens" },
      { key: "properties.edit", label: "Modifier biens", description: "Modifier les biens existants" },
      { key: "properties.publish", label: "Publier biens", description: "Publier/Dépublier des biens" },
    ],
  },
];

const ROLES: TeamRole[] = ["owner", "manager", "accountant", "agent"];

function hasPermission(role: TeamRole, permissionKey: string): boolean {
  const allowedRoles = (TEAM_PERMISSIONS as Record<string, readonly string[]>)[permissionKey];
  return allowedRoles?.includes(role) ?? false;
}

interface RolePermissionsTableProps {
  currentUserRole?: TeamRole;
}

export function RolePermissionsTable({ currentUserRole }: RolePermissionsTableProps) {
  const { isDark } = useTheme();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* En-tête explicatif */}
        <div className={cn(
          "p-4 rounded-lg border",
          isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
        )}>
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className={cn(
                "text-sm font-medium",
                isDark ? "text-slate-200" : "text-slate-800"
              )}>
                Matrice des permissions par rôle
              </p>
              <p className={cn(
                "text-sm mt-1",
                isDark ? "text-slate-400" : "text-slate-600"
              )}>
                Ce tableau montre les actions autorisées pour chaque rôle dans votre équipe.
                Le propriétaire a accès à toutes les fonctionnalités.
              </p>
            </div>
          </div>
        </div>

        {/* Légende des rôles */}
        <div className="flex flex-wrap gap-2 md:gap-3">
          {ROLES.map((role) => {
            const config = TEAM_ROLE_CONFIG[role];
            const isCurrentRole = role === currentUserRole;
            return (
              <div
                key={role}
                className={cn(
                  "flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm transition-all shrink-0",
                  config.bgColor,
                  config.textColor,
                  !isCurrentRole && "grayscale opacity-50"
                )}
              >
                <span className={cn("w-1.5 h-1.5 md:w-2 md:h-2 rounded-full", config.color)} />
                <span className="font-medium">{config.label}</span>
                {isCurrentRole && (
                  <span className="text-[10px] opacity-70 ml-0.5 md:ml-1">(Vous)</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Table des permissions par catégorie */}
        <div className="space-y-6">
          {PERMISSION_CATEGORIES.map((category) => (
            <div key={category.name} className="overflow-hidden rounded-lg border border-border">
              {/* Titre catégorie */}
              <div className={cn(
                "px-4 py-3 border-b border-border",
                isDark ? "bg-slate-800" : "bg-slate-100"
              )}>
                <h3 className={cn(
                  "text-sm font-semibold",
                  isDark ? "text-slate-200" : "text-slate-800"
                )}>
                  {category.name}
                </h3>
              </div>

              {/* Table avec scroll horizontal sur mobile */}
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className={cn(
                      "border-b border-border",
                      isDark ? "bg-slate-900/50" : "bg-slate-50"
                    )}>
                      <th className={cn(
                        "text-left px-4 py-2 text-xs font-medium uppercase tracking-wider min-w-[180px]",
                        isDark ? "text-slate-400" : "text-slate-500"
                      )}>
                        Permission
                      </th>
                      {ROLES.map((role) => (
                        <th
                          key={role}
                          className={cn(
                            "text-center px-3 py-2 text-xs font-medium uppercase tracking-wider w-24",
                            isDark ? "text-slate-400" : "text-slate-500",
                            role === currentUserRole && "bg-primary/5"
                          )}
                        >
                          {TEAM_ROLE_CONFIG[role].label.substring(0, 4)}.
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {category.permissions.map((perm, idx) => (
                      <tr
                        key={perm.key}
                        className={cn(
                          idx % 2 === 0
                            ? isDark ? "bg-slate-900/30" : "bg-white"
                            : isDark ? "bg-slate-900/10" : "bg-slate-50/50"
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={cn(
                                "text-sm cursor-help border-b border-dotted",
                                isDark
                                  ? "text-slate-300 border-slate-600"
                                  : "text-slate-700 border-slate-300"
                              )}>
                                {perm.label}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p>{perm.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        {ROLES.map((role) => {
                          const allowed = hasPermission(role, perm.key);
                          return (
                            <td
                              key={role}
                              className={cn(
                                "text-center px-3 py-2.5",
                                role === currentUserRole && "bg-primary/5"
                              )}
                            >
                              {allowed ? (
                                <Check className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-slate-400 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
