"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteProperty } from "./actions";

type DeleteButtonProps = {
  propertyId: string;
};

export function DeleteButton({ propertyId }: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        "Confirme la suppression de ce bien ? Cette action est définitive."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteProperty(propertyId);
      if (result.error) {
        toast.error("Erreur", { description: result.error });
      } else {
        toast.success("Bien supprimé", {
          description: "Le bien a été supprimé avec succès.",
        });
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-300 hover:text-red-200 disabled:opacity-50 transition-colors"
    >
      {isDeleting ? "Suppression..." : "Supprimer"}
    </button>
  );
}

