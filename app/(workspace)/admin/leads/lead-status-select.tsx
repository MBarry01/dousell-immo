"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateLeadStatus, type LeadStatus } from "./actions";

type LeadStatusSelectProps = {
  leadId: string;
  currentStatus: LeadStatus;
};

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: "nouveau", label: "Nouveau" },
  { value: "contacté", label: "Contacté" },
  { value: "clos", label: "Clos" },
];

const statusColors: Record<LeadStatus, string> = {
  nouveau: "bg-red-500/20 text-red-300 border-red-500/30",
  contacté: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  clos: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export function LeadStatusSelect({
  leadId,
  currentStatus,
}: LeadStatusSelectProps) {
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: LeadStatus) => {
    const previousStatus = status;
    setStatus(newStatus);

    startTransition(async () => {
      const result = await updateLeadStatus(leadId, newStatus);
      if (!result.success) {
        setStatus(previousStatus);
        toast.error(result.error || "Erreur lors de la mise à jour");
      } else {
        toast.success("Statut mis à jour");
      }
    });
  };

  return (
    <select
      value={status}
      onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
      disabled={isPending}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 ${
        statusColors[status]
      }`}
      style={{ colorScheme: "dark" }}
    >
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}


