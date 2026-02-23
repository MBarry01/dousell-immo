"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Edit, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { markPropertyAsSold, deleteUserProperty } from "./actions";
import { AssociateTenantDialog } from "@/components/gestion/AssociateTenantDialog";
import { UpsellManagementModal } from "@/components/ui/upsell-management-modal";

type PropertyCardActionsProps = {
  propertyId: string;
  validationStatus: "pending" | "payment_pending" | "approved" | "rejected";
  status: "disponible" | "sous-offre" | "vendu" | "loué";
  category?: "vente" | "location";
  teamId?: string | null;
  propertyTitle?: string;
  propertyAddress?: string;
  propertyPrice?: number;
  ownerId?: string;
};

export function PropertyCardActions({
  propertyId,
  validationStatus,
  status,
  category,
  teamId,
  propertyTitle,
  propertyAddress,
  propertyPrice,
  ownerId,
}: PropertyCardActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingSold, setIsMarkingSold] = useState(false);
  const [isAssociateOpen, setIsAssociateOpen] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);

  const handleEdit = () => {
    router.push(`/compte/biens/edit/${propertyId}`);
  };

  const handleMarkAsSold = async (skipUpsell = false) => {
    // Si c'est une location et que l'utilisateur a un compte gestion, on ouvre la modale d'association
    if (category === "location" && teamId) {
      setIsAssociateOpen(true);
      return;
    }

    // SI c'est une location et que c'est un particulier (pas de teamId), on affiche l'upsell
    if (category === "location" && !teamId && !skipUpsell) {
      setIsUpsellOpen(true);
      return;
    }

    setIsUpsellOpen(false);

    if (!confirm(`Marquer ce bien comme ${category === "location" ? "loué" : "vendu"} ?`)) {
      return;
    }

    setIsMarkingSold(true);
    try {
      const result = await markPropertyAsSold(propertyId);
      if (result.error) {
        toast.error("Erreur", { description: result.error });
      } else {
        toast.success(`Bien marqué comme ${category === "location" ? "loué" : "vendu"}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsMarkingSold(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer ce bien ? Cette action est définitive."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteUserProperty(propertyId);
      if (result.error) {
        toast.error("Erreur", { description: result.error });
      } else {
        toast.success("Bien supprimé");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative z-50 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
        <DropdownMenuItem
          onClick={handleEdit}
          className="cursor-pointer text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white"
        >
          <Edit className="mr-2 h-4 w-4" />
          {validationStatus === "rejected" ? "Ré-soumettre" : "Modifier"}
        </DropdownMenuItem>
        {status !== "vendu" && status !== "loué" && (
          <DropdownMenuItem
            onClick={() => handleMarkAsSold(false)}
            disabled={isMarkingSold}
            className="cursor-pointer text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Marquer comme {category === "location" ? "Loué" : "Vendu"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isDeleting}
          className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/10 hover:text-red-700 dark:hover:text-red-300"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* Modale d'association (Mode Business) */}
      {isAssociateOpen && teamId && (
        <AssociateTenantDialog
          isOpen={isAssociateOpen}
          onClose={() => setIsAssociateOpen(false)}
          propertyId={propertyId}
          propertyTitle={propertyTitle || ""}
          propertyAddress={propertyAddress}
          propertyPrice={propertyPrice}
          ownerId={ownerId || ""}
          teamId={teamId}
        />
      )}

      {/* Modale d'Upsell Gestion (Mode Particulier) */}
      <UpsellManagementModal
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
        onProceed={() => handleMarkAsSold(true)}
      />
    </DropdownMenu>
  );
}

