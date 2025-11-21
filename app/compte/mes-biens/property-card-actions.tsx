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

type PropertyCardActionsProps = {
  propertyId: string;
  validationStatus: "pending" | "payment_pending" | "approved" | "rejected";
  status: "disponible" | "sous-offre" | "vendu";
};

export function PropertyCardActions({
  propertyId,
  validationStatus,
  status,
}: PropertyCardActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingSold, setIsMarkingSold] = useState(false);

  const handleEdit = () => {
    router.push(`/compte/biens/edit/${propertyId}`);
  };

  const handleMarkAsSold = async () => {
    if (!confirm("Marquer ce bien comme vendu/loué ?")) {
      return;
    }

    setIsMarkingSold(true);
    try {
      const result = await markPropertyAsSold(propertyId);
      if (result.error) {
        toast.error("Erreur", { description: result.error });
      } else {
        toast.success("Bien marqué comme vendu/loué");
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
        "Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est définitive."
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
        toast.success("Annonce supprimée");
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-[#0b0f18] border-white/10">
        <DropdownMenuItem
          onClick={handleEdit}
          className="cursor-pointer text-white/80 hover:bg-white/10 hover:text-white"
        >
          <Edit className="mr-2 h-4 w-4" />
          {validationStatus === "rejected" ? "Ré-soumettre" : "Modifier"}
        </DropdownMenuItem>
        {status !== "vendu" && (
          <DropdownMenuItem
            onClick={handleMarkAsSold}
            disabled={isMarkingSold}
            className="cursor-pointer text-white/80 hover:bg-white/10 hover:text-white"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Marquer comme Vendu/Loué
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isDeleting}
          className="cursor-pointer text-red-300 hover:bg-red-500/10 hover:text-red-200"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

