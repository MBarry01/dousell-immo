"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Home, Loader2, ExternalLink } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { checkOwnerHasTenantAccess, getOwnerTenantAccessLink } from "@/app/(workspace)/gestion/actions";
import { toast } from "sonner";

interface TenantLeaseInfo {
  id: string;
  property_title: string;
  owner_name: string;
  has_valid_token: boolean;
}

/**
 * Component to switch to tenant space when owner is also a tenant
 *
 * Displays in the user dropdown menu if the owner's email matches
 * a tenant_email in an active lease (meaning they're renting from someone else).
 *
 * Per WORKFLOW_PROPOSAL.md section 2.5 - Switch role Owners
 */
export function OwnerRoleSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tenantInfo, setTenantInfo] = useState<TenantLeaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if owner has tenant access on mount
  useEffect(() => {
    async function checkAccess() {
      try {
        const result = await checkOwnerHasTenantAccess();
        if (result.hasTenantAccess && result.tenantLease) {
          setTenantInfo(result.tenantLease);
        }
      } catch (error) {
        console.error("Error checking tenant access:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, []);

  const handleSwitchToTenant = () => {
    if (!tenantInfo) return;

    startTransition(async () => {
      try {
        const result = await getOwnerTenantAccessLink(tenantInfo.id);

        if (result.success && result.url) {
          toast.success("Redirection vers votre espace locataire...");
          // Open in same tab to switch context
          router.push(result.url);
        } else {
          toast.error(result.error || "Impossible d'accéder à l'espace locataire");
        }
      } catch (error) {
        console.error("Error switching to tenant:", error);
        toast.error("Erreur lors du changement d'espace");
      }
    });
  };

  // Don't render if loading or no tenant access
  if (isLoading || !tenantInfo) {
    return null;
  }

  return (
    <DropdownMenuItem
      onClick={handleSwitchToTenant}
      disabled={isPending}
      className="cursor-pointer"
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Home className="mr-2 h-4 w-4" />
      )}
      <div className="flex flex-col">
        <span className="flex items-center gap-1">
          Espace Locataire
          <ExternalLink className="h-3 w-3 opacity-50" />
        </span>
        <span className="text-xs text-muted-foreground truncate max-w-[180px]">
          {tenantInfo.property_title}
        </span>
      </div>
    </DropdownMenuItem>
  );
}
