"use client";

/**
 * AccessControlTab - Onglet de gestion des accès temporaires
 *
 * Affiche dans la page Équipe:
 * - Demandes d'accès en attente
 * - Permissions temporaires actives
 * - Historique des demandes
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/workspace/providers/theme-provider";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  KeyRound,
  Calendar,
  User,
  Loader2,
  Trash2,
  Home,
  FileText,
  Wallet,
  Wrench,
  Users,
  FolderOpen,
  ClipboardList,
  Filter,
} from "lucide-react";
import { formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getAccessRequestsAction,
  getTemporaryPermissionsAction,
  reviewAccessRequestAction,
  revokeTemporaryPermissionAction,
} from "@/app/(workspace)/gestion/access-control/actions";
import { toast } from "sonner";

interface AccessControlTabProps {
  teamId: string;
}

// Catégories de permissions
const PERMISSION_CATEGORIES = [
  { id: "all", label: "Toutes", icon: Filter, color: "text-slate-400", badgeBg: "bg-amber-500" },
  { id: "properties", label: "Biens", icon: Home, color: "text-blue-500", badgeBg: "bg-blue-500" },
  { id: "leases", label: "Baux", icon: FileText, color: "text-purple-500", badgeBg: "bg-purple-500" },
  { id: "tenants", label: "Locataires", icon: Users, color: "text-green-500", badgeBg: "bg-green-500" },
  { id: "payments", label: "Paiements", icon: Wallet, color: "text-amber-500", badgeBg: "bg-amber-500" },
  { id: "expenses", label: "Dépenses", icon: Wallet, color: "text-red-500", badgeBg: "bg-red-500" },
  { id: "maintenance", label: "Maintenance", icon: Wrench, color: "text-orange-500", badgeBg: "bg-orange-500" },
  { id: "documents", label: "Documents", icon: FolderOpen, color: "text-cyan-500", badgeBg: "bg-cyan-500" },
  { id: "inventory", label: "États lieux", icon: ClipboardList, color: "text-indigo-500", badgeBg: "bg-indigo-500" },
  { id: "team", label: "Équipe", icon: Users, color: "text-pink-500", badgeBg: "bg-pink-500" },
];

// Labels des permissions pour affichage
const PERMISSION_LABELS: Record<string, string> = {
  "leases.view": "Voir baux",
  "leases.create": "Créer baux",
  "leases.edit": "Éditer baux",
  "leases.delete": "Supprimer baux",
  "tenants.view": "Voir locataires",
  "tenants.edit": "Éditer locataires",
  "payments.view": "Voir paiements",
  "payments.confirm": "Confirmer paiements",
  "expenses.view": "Voir dépenses",
  "expenses.create": "Créer dépenses",
  "maintenance.view": "Voir maintenance",
  "maintenance.create": "Créer maintenance",
  "documents.view": "Voir documents",
  "documents.generate": "Générer documents",
  "properties.view": "Voir biens",
  "properties.create": "Créer biens",
  "properties.edit": "Éditer biens",
  "inventory.view": "Voir états des lieux",
  "inventory.create": "Créer états des lieux",
  "team.members.view": "Voir membres",
  "team.members.invite": "Inviter membres",
  "team.settings.view": "Voir paramètres",
};

function getPermissionLabel(permission: string): string {
  return PERMISSION_LABELS[permission] || permission;
}

function getPermissionCategory(permission: string): string {
  const prefix = permission.split(".")[0];
  return prefix || "all";
}

export function AccessControlTab({ teamId }: AccessControlTabProps) {
  const { isDark } = useTheme();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [activePermissions, setActivePermissions] = useState<any[]>([]);
  const [historyRequests, setHistoryRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Filtrer par catégorie
  const filterByCategory = (items: any[], field: string = "requested_permission") => {
    if (selectedCategory === "all") return items;
    return items.filter(item => {
      const permission = item[field] || item.permission;
      return getPermissionCategory(permission) === selectedCategory;
    });
  };

  const filteredPendingRequests = filterByCategory(pendingRequests);
  const filteredActivePermissions = filterByCategory(activePermissions, "permission");
  const filteredHistoryRequests = filterByCategory(historyRequests);

  // Compter les demandes en attente par catégorie
  const getCategoryCount = (categoryId: string) => {
    if (categoryId === "all") {
      return pendingRequests.length;
    }
    return pendingRequests.filter(req =>
      getPermissionCategory(req.requested_permission) === categoryId
    ).length;
  };

  const loadData = async () => {
    setIsLoading(true);

    try {
      // Charger les demandes en attente
      const pendingResult = await getAccessRequestsAction(teamId, "pending");
      if (pendingResult.success) {
        setPendingRequests(pendingResult.data || []);
      }

      // Charger les permissions actives
      const activeResult = await getTemporaryPermissionsAction(teamId);
      if (activeResult.success) {
        setActivePermissions(activeResult.data || []);
      }

      // Charger l'historique (approved + rejected)
      const historyResult = await getAccessRequestsAction(teamId);
      if (historyResult.success) {
        setHistoryRequests(
          (historyResult.data || [])
            .filter((req: any) => req.status !== "pending")
            .slice(0, 10) // Limiter à 10 derniers
        );
      }
    } catch (error) {
      console.error("[AccessControlTab] Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teamId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={cn(
        "flex items-center gap-2 p-2 md:p-3 rounded-xl overflow-x-auto scrollbar-none touch-pan-x",
        isDark ? "bg-slate-900/50 border border-slate-800" : "bg-slate-50 border border-slate-200"
      )}>
        {PERMISSION_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          const count = getCategoryCount(cat.id);
          const hasItems = count > 0;
          return (
            <Button
              key={cat.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "shrink-0 gap-1.5 md:gap-2 transition-all relative py-1 md:py-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-800"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 md:h-4 md:w-4", !isActive && cat.color)} />
              <span className="text-xs md:text-sm">{cat.label}</span>
              {hasItems && (
                <span className={cn(
                  "absolute -top-1 -right-1 min-w-[16px] md:min-w-[18px] h-[16px] md:h-[18px] flex items-center justify-center text-[8px] md:text-[10px] font-bold rounded-full border-2",
                  isActive
                    ? "bg-red-500 text-white border-white dark:border-slate-900"
                    : cn(cat.badgeBg, "text-white border-white dark:border-slate-950")
                )}>
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Section: Demandes en attente */}
      <Card className={cn(
        isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg">Demandes en attente</CardTitle>
            </div>
            {filteredPendingRequests.length > 0 && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                {filteredPendingRequests.length} à traiter
              </Badge>
            )}
          </div>
          <CardDescription>
            Demandes d'accès temporaire de vos membres
            {selectedCategory !== "all" && (
              <span className="ml-1 text-primary">
                • Catégorie: {PERMISSION_CATEGORIES.find(c => c.id === selectedCategory)?.label}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500/50" />
              <p>{selectedCategory === "all" ? "Aucune demande en attente" : "Aucune demande dans cette catégorie"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPendingRequests.map((request) => (
                <PendingRequestCard
                  key={request.id}
                  request={request}
                  onReview={loadData}
                  isDark={isDark}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section: Permissions actives */}
      <Card className={cn(
        isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Permissions temporaires actives</CardTitle>
            </div>
            {filteredActivePermissions.length > 0 && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                {filteredActivePermissions.length} active{filteredActivePermissions.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <CardDescription>
            Accès temporaires accordés à vos membres
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredActivePermissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <KeyRound className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{selectedCategory === "all" ? "Aucune permission temporaire active" : "Aucune permission dans cette catégorie"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivePermissions.map((perm) => (
                <ActivePermissionCard
                  key={perm.id}
                  permission={perm}
                  onRevoke={loadData}
                  isDark={isDark}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section: Historique (compact) */}
      {filteredHistoryRequests.length > 0 && (
        <Card className={cn(
          isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Historique récent</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredHistoryRequests.map((request) => (
                <HistoryRequestRow key={request.id} request={request} isDark={isDark} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Carte pour une demande en attente
 */
function PendingRequestCard({
  request,
  onReview,
  isDark,
}: {
  request: any;
  onReview: () => void;
  isDark: boolean;
}) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [durationHours, setDurationHours] = useState("24");
  const [showDetails, setShowDetails] = useState(false);

  const handleReview = async (action: 'approve' | 'reject') => {
    setIsReviewing(true);

    try {
      const result = await reviewAccessRequestAction({
        requestId: request.id,
        action,
        reviewNotes,
        durationHours: action === 'approve' ? Number(durationHours) : undefined,
      });

      if (result.success) {
        toast.success(result.message);
        onReview();
      } else {
        toast.error(result.error || "Erreur lors du traitement");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du traitement de la demande");
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className={cn(
      "rounded-lg border p-4",
      isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-full bg-amber-500/10 shrink-0">
            <User className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm md:text-base truncate">
              {request.requester?.full_name || request.requester?.email}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] md:text-xs py-0 h-5 px-2 bg-background/50">
                {getPermissionLabel(request.requested_permission)}
              </Badge>
              <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
                {formatDistance(new Date(request.requested_at), new Date(), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>
            {request.reason && (
              <p className="text-xs md:text-sm text-muted-foreground mt-2 italic line-clamp-2 md:line-clamp-none">
                "{request.reason}"
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end sm:justify-start">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[10px] h-8 md:h-9 px-3 md:text-xs bg-background/50"
          >
            {showDetails ? "Masquer" : "Détails"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500 hover:bg-red-500/10 h-8 w-8 md:h-9 md:w-9 p-0 bg-background/50"
            onClick={() => handleReview('reject')}
            disabled={isReviewing}
            title="Refuser"
          >
            <XCircle className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white h-8 w-8 md:h-9 md:w-9 p-0 shadow-sm"
            onClick={() => handleReview('approve')}
            disabled={isReviewing}
            title="Approuver"
          >
            {isReviewing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Options détaillées */}
      {showDetails && (
        <div className={cn(
          "mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4",
          isDark ? "border-slate-700" : "border-slate-200"
        )}>
          <div>
            <Label className="text-xs text-muted-foreground">Durée de l'accès</Label>
            <Select value={durationHours} onValueChange={setDurationHours}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 heure</SelectItem>
                <SelectItem value="4">4 heures</SelectItem>
                <SelectItem value="8">8 heures</SelectItem>
                <SelectItem value="24">24 heures</SelectItem>
                <SelectItem value="48">48 heures</SelectItem>
                <SelectItem value="168">1 semaine</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Note (optionnel)</Label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Ajouter une note..."
              className="mt-1 min-h-[60px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Carte pour une permission active
 */
function ActivePermissionCard({
  permission,
  onRevoke,
  isDark,
}: {
  permission: any;
  onRevoke: () => void;
  isDark: boolean;
}) {
  const [isRevoking, setIsRevoking] = useState(false);
  const expiresAt = new Date(permission.expires_at);
  const now = new Date();
  const hoursRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const isExpiringSoon = hoursRemaining <= 2;

  const handleRevoke = async () => {
    if (!confirm("Révoquer cette permission immédiatement?")) return;

    setIsRevoking(true);
    try {
      const result = await revokeTemporaryPermissionAction(permission.id);
      if (result.success) {
        toast.success("Permission révoquée");
        onRevoke();
      } else {
        toast.error(result.error || "Erreur lors de la révocation");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la révocation");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className={cn(
      "rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
      isExpiringSoon
        ? isDark ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200"
        : isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
    )}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          "p-2 rounded-full shrink-0",
          isExpiringSoon ? "bg-red-500/20" : "bg-green-500/10"
        )}>
          <KeyRound className={cn(
            "h-4 w-4",
            isExpiringSoon ? "text-red-500" : "text-green-500"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm md:text-base truncate">
            {permission.user?.full_name || permission.user?.email}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <Badge variant="secondary" className="text-[10px] md:text-xs">
              {getPermissionLabel(permission.permission)}
            </Badge>
            <span className={cn(
              "text-[10px] md:text-xs flex items-center gap-1 whitespace-nowrap",
              isExpiringSoon ? "text-red-500 font-medium" : "text-muted-foreground"
            )}>
              <Clock className="h-3 w-3" />
              {hoursRemaining}h restante{hoursRemaining > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end w-full sm:w-auto">
        <Button
          size="sm"
          variant="ghost"
          className="text-red-500 hover:bg-red-500/10 shrink-0 h-8 w-8 md:h-9 md:w-9 p-0 bg-background/50"
          onClick={handleRevoke}
          disabled={isRevoking}
          title="Révoquer"
        >
          {isRevoking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Ligne compacte pour l'historique
 */
function HistoryRequestRow({ request, isDark }: { request: any; isDark: boolean }) {
  const isApproved = request.status === 'approved';

  return (
    <div className={cn(
      "flex items-center justify-between py-2 px-3 rounded-lg",
      isDark ? "bg-slate-800/30" : "bg-slate-50"
    )}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isApproved ? (
          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
        )}
        <span className="text-sm truncate">
          {request.requester?.full_name || request.requester?.email}
        </span>
        <Badge variant="outline" className="text-xs shrink-0">
          {getPermissionLabel(request.requested_permission)}
        </Badge>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 ml-2">
        {formatDistance(new Date(request.reviewed_at || request.requested_at), new Date(), {
          addSuffix: true,
          locale: fr,
        })}
      </span>
    </div>
  );
}
