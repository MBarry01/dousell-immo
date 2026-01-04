"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function ModerationBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const loadPendingCount = async () => {
      const supabase = createClient();
      const { count, error } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("is_agency_listing", false)
        .in("validation_status", ["pending", "payment_pending"]);

      if (!error && count !== null) {
        setCount(count);
      }
    };

    loadPendingCount();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (count === null || count === 0) {
    return null;
  }

  return (
    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}


