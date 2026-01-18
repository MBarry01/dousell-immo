"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function ModerationNotification() {
  const router = useRouter();
  const [hasShownNotification, setHasShownNotification] = useState(false);

  useEffect(() => {
    const checkNewProperties = async () => {
      const supabase = createClient();
      
      // Vérifier s'il y a de nouvelles annonces en attente
      const { count, error } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("is_agency_listing", false)
        .in("validation_status", ["pending", "payment_pending"]);

      if (!error && count && count > 0 && !hasShownNotification) {
        // Afficher une notification une seule fois
        toast.info(`${count} annonce${count > 1 ? "s" : ""} en attente de modération`, {
          description: "Cliquez sur Modération pour les examiner",
          duration: 6000,
          action: {
            label: "Voir",
            onClick: () => {
              router.push("/admin/moderation");
            },
          },
        });
        setHasShownNotification(true);
      }
    };

    // Vérifier au chargement de la page (avec un petit délai)
    const timeout = setTimeout(checkNewProperties, 1000);

    // Vérifier toutes les 60 secondes
    const interval = setInterval(checkNewProperties, 60000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [router, hasShownNotification]);

  return null;
}
