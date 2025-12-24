"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { grantRole, revokeRole, type UserRole } from "./actions";
import { Button } from "@/components/ui/button";

type RoleManagerProps = {
  userId: string;
  currentRoles: UserRole[];
};

const allRoles: UserRole[] = ["admin", "moderateur", "agent", "superadmin"];

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  moderateur: "Modérateur",
  agent: "Agent",
  superadmin: "Super Admin",
};

export function RoleManager({ userId, currentRoles }: RoleManagerProps) {
  const [roles, setRoles] = useState<UserRole[]>(currentRoles);
  const [isPending, startTransition] = useTransition();

  const toggleRole = (role: UserRole) => {
    const hasRole = roles.includes(role);
    const newRoles = hasRole
      ? roles.filter((r) => r !== role)
      : [...roles, role];

    setRoles(newRoles);

    startTransition(async () => {
      const result = hasRole
        ? await revokeRole(userId, role)
        : await grantRole(userId, role);

      if (!result.success) {
        // Revert on error
        setRoles(currentRoles);
        toast.error(result.error || "Erreur lors de la modification du rôle");
      } else {
        toast.success(
          hasRole
            ? `Rôle "${roleLabels[role]}" retiré`
            : `Rôle "${roleLabels[role]}" accordé`
        );
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {allRoles.map((role) => {
        const hasRole = roles.includes(role);
        return (
          <Button
            key={role}
            size="sm"
            variant={hasRole ? "primary" : "outline"}
            onClick={() => toggleRole(role)}
            disabled={isPending}
            className={`rounded-full text-xs ${
              hasRole
                ? "bg-background text-foreground hover:bg-background/90"
                : "border-white/20 text-white/60 hover:border-white/40 hover:text-white"
            }`}
          >
            {hasRole ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                {roleLabels[role]}
              </>
            ) : (
              <>
                <X className="mr-1 h-3 w-3" />
                {roleLabels[role]}
              </>
            )}
          </Button>
        );
      })}
    </div>
  );
}


