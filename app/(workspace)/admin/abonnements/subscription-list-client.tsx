"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ExternalLink,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import type { SubscriptionTeam } from "./actions";
import { overrideSubscriptionStatus } from "./actions";
import type { SubscriptionStatus, SubscriptionTier } from "@/lib/subscription/plans-config";

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  active: {
    label: "Actif",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle,
  },
  trialing: {
    label: "Essai",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Clock,
  },
  past_due: {
    label: "En retard",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: AlertCircle,
  },
  canceled: {
    label: "Annulé",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: XCircle,
  },
  trial_expired: {
    label: "Essai expiré",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: Clock,
  },
  unpaid: {
    label: "Impayé",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: XCircle,
  },
  incomplete: {
    label: "Incomplet",
    color: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    icon: AlertCircle,
  },
};

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  starter: {
    label: "Starter",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  },
  pro: {
    label: "Pro",
    color: "bg-[#F4C430]/20 text-[#F4C430] border-[#F4C430]/30",
  },
  enterprise: {
    label: "Enterprise",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
};

function StatusBadge({
  status,
  trialEndsAt,
}: {
  status: string | null;
  trialEndsAt?: string | null;
}) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  // canceled + avait un trial = essai expiré (jamais payé), pas une vraie résiliation
  const displayKey =
    status === "canceled" && trialEndsAt ? "trial_expired" : status;
  const config = STATUS_CONFIG[displayKey] ?? {
    label: status,
    color: "bg-slate-500/20 text-slate-300",
    icon: AlertCircle,
  };
  const Icon = config.icon;
  return (
    <Badge className={`gap-1 ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return <span className="text-muted-foreground text-xs">—</span>;
  const config = TIER_CONFIG[tier] ?? {
    label: tier,
    color: "bg-slate-500/20 text-slate-300",
  };
  return <Badge className={config.color}>{config.label}</Badge>;
}

// ── Override Dialog ───────────────────────────────────────────────────────────

type OverrideTarget = { teamId: string; teamName: string };

function OverrideDialog({
  target,
  onClose,
}: {
  target: OverrideTarget | null;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<SubscriptionStatus>("active");
  const [tier, setTier] = useState<SubscriptionTier | "keep">("keep");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!target) return;
    startTransition(async () => {
      const result = await overrideSubscriptionStatus(
        target.teamId,
        status,
        tier !== "keep" ? tier : undefined
      );
      if (result.success) {
        setFeedback(null);
        onClose();
      } else {
        setFeedback(result.error ?? "Erreur inconnue");
      }
    });
  };

  return (
    <Dialog open={!!target} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;abonnement</DialogTitle>
          <DialogDescription>
            Modifier manuellement le statut de <strong>{target?.teamName}</strong>.
            Cette action contourne Stripe — utilisez avec précaution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Statut — boutons groupés (pas de portail) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nouveau statut</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { value: "active", label: "Actif", color: "data-[active=true]:bg-emerald-500/20 data-[active=true]:border-emerald-500 data-[active=true]:text-emerald-400" },
                  { value: "trialing", label: "Essai", color: "data-[active=true]:bg-blue-500/20 data-[active=true]:border-blue-500 data-[active=true]:text-blue-400" },
                  { value: "past_due", label: "En retard", color: "data-[active=true]:bg-amber-500/20 data-[active=true]:border-amber-500 data-[active=true]:text-amber-400" },
                  { value: "canceled", label: "Annulé", color: "data-[active=true]:bg-red-500/20 data-[active=true]:border-red-500 data-[active=true]:text-red-400" },
                  { value: "unpaid", label: "Impayé", color: "data-[active=true]:bg-red-500/20 data-[active=true]:border-red-500 data-[active=true]:text-red-400" },
                  { value: "incomplete", label: "Incomplet", color: "data-[active=true]:bg-slate-500/20 data-[active=true]:border-slate-500 data-[active=true]:text-slate-300" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  data-active={status === opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    "rounded-lg border border-border px-2 py-1.5 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground",
                    opt.color
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Plan — boutons groupés (pas de portail) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Changer de plan{" "}
              <span className="text-muted-foreground font-normal">(optionnel)</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { value: "keep", label: "Inchangé" },
                  { value: "starter", label: "Starter" },
                  { value: "pro", label: "Pro" },
                  { value: "enterprise", label: "Enterprise" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  data-active={tier === opt.value}
                  onClick={() => setTier(opt.value)}
                  className={cn(
                    "rounded-lg border border-border px-2 py-1.5 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground",
                    "data-[active=true]:bg-primary/15 data-[active=true]:border-primary data-[active=true]:text-primary"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {feedback && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {feedback}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Confirmer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main List ─────────────────────────────────────────────────────────────────

type Props = {
  teams: SubscriptionTeam[];
};

export function SubscriptionListClient({ teams }: Props) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [overrideTarget, setOverrideTarget] = useState<OverrideTarget | null>(null);

  const filtered = teams.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.stripe_customer_id ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" || t.subscription_status === filterStatus;
    const matchTier =
      filterTier === "all" || t.subscription_tier === filterTier;
    return matchSearch && matchStatus && matchTier;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou ID client Stripe…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="trialing">Essai</SelectItem>
            <SelectItem value="past_due">En retard</SelectItem>
            <SelectItem value="canceled">Annulé</SelectItem>
            <SelectItem value="unpaid">Impayé</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les plans</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} équipe{filtered.length !== 1 ? "s" : ""} trouvée
        {filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Équipe</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Cycle</th>
                  <th className="px-4 py-3">Fin d&apos;essai / Démarrage</th>
                  <th className="px-4 py-3">Stripe ID</th>
                  <th className="px-4 py-3">Inscription</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((team) => (
                  <tr key={team.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground truncate max-w-[180px]">
                        {team.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                        {team.id}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <TierBadge tier={team.subscription_tier} />
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge
                        status={team.subscription_status}
                        trialEndsAt={team.subscription_trial_ends_at}
                      />
                    </td>

                    <td className="px-4 py-4">
                      {team.billing_cycle ? (
                        <span className="text-foreground/80 capitalize">
                          {team.billing_cycle === "monthly" ? "Mensuel" : "Annuel"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {team.subscription_status === "trialing" &&
                      team.subscription_trial_ends_at ? (
                        <span className="text-blue-400">
                          Fin essai:{" "}
                          {format(
                            new Date(team.subscription_trial_ends_at),
                            "dd MMM yyyy",
                            { locale: fr }
                          )}
                        </span>
                      ) : team.subscription_started_at ? (
                        <span>
                          Démarré:{" "}
                          {format(
                            new Date(team.subscription_started_at),
                            "dd MMM yyyy",
                            { locale: fr }
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {team.stripe_customer_id ? (
                        <a
                          href={`https://dashboard.stripe.com/customers/${team.stripe_customer_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[#F4C430] hover:underline font-mono"
                        >
                          {team.stripe_customer_id.slice(0, 12)}…
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(team.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </td>

                    <td className="px-4 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              setOverrideTarget({
                                teamId: team.id,
                                teamName: team.name,
                              })
                            }
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Modifier le statut
                          </DropdownMenuItem>
                          {team.stripe_customer_id && (
                            <DropdownMenuItem asChild>
                              <a
                                href={`https://dashboard.stripe.com/customers/${team.stripe_customer_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Voir dans Stripe
                              </a>
                            </DropdownMenuItem>
                          )}
                          {team.stripe_subscription_id && (
                            <DropdownMenuItem asChild>
                              <a
                                href={`https://dashboard.stripe.com/subscriptions/${team.stripe_subscription_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Voir l&apos;abonnement Stripe
                              </a>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      Aucun abonnement trouvé avec ces filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <OverrideDialog
        target={overrideTarget}
        onClose={() => setOverrideTarget(null)}
      />
    </>
  );
}
