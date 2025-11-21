"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

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
      const supabase = createClient();
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error("Error deleting property:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-300 hover:text-red-200 disabled:opacity-50"
    >
      {isDeleting ? "Suppression..." : "Supprimer"}
    </button>
  );
}

