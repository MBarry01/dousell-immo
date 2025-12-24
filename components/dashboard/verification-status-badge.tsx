import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

type VerificationStatus = "pending" | "verified" | "rejected";

type VerificationStatusBadgeProps = {
  status: VerificationStatus;
  className?: string;
};

export function VerificationStatusBadge({
  status,
  className,
}: VerificationStatusBadgeProps) {
  const config = {
    pending: {
      label: "En attente",
      icon: Clock,
      className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
    verified: {
      label: "Vérifié",
      icon: CheckCircle2,
      className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    rejected: {
      label: "Refusé",
      icon: XCircle,
      className: "bg-red-500/20 text-red-300 border-red-500/30",
    },
  };

  const { label, icon: Icon, className: statusClassName } = config[status];

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 border ${statusClassName} ${className || ""}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
