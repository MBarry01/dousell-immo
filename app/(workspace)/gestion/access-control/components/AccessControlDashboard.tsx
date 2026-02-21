"use client";

/**
 * AccessControlDashboard - Dashboard de gestion des accès temporaires
 *
 * Affiche:
 * - Demandes d'accès en attente
 * - Permissions temporaires actives
 * - Historique des demandes
 */

import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  ClockCounterClockwise,
  CheckCircle,
  XCircle,
  Warning,
  LockKey,
  Calendar,
  User,
} from "@phosphor-icons/react";
import { formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getAccessRequestsAction,
  getTemporaryPermissionsAction,
  reviewAccessRequestAction,
  revokeTemporaryPermissionAction,
} from "../actions";
import type { AccessRequestStatus } from "../actions";

interface AccessControlDashboardProps {
  teamId: string;
}

export function AccessControlDashboard({ teamId }: AccessControlDashboardProps) {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [activePermissions, setActivePermissions] = useState<any[]>([]);
  const [historyRequests, setHistoryRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  const loadData = useCallback(async () => {
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
          (historyResult.data || []).filter(
            (req: any) => req.status !== "pending"
          )
        );
      }
    } catch (error) {
      console.error("[AccessControlDashboard] Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadData();
  }, [teamId]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pending">
          <ClockCounterClockwise size={16} className="mr-2" />
          En attente
          {pendingRequests.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingRequests.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="active">
          <LockKey size={16} className="mr-2" />
          Permissions actives
          {activePermissions.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activePermissions.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="history">
          <Calendar size={16} className="mr-2" />
          Historique
        </TabsTrigger>
      </TabsList>

      {/* Demandes en attente */}
      <TabsContent value="pending" className="mt-6">
        {isLoading ? (
          <div className="text-center py-12 text-zinc-400">Chargement...</div>
        ) : pendingRequests.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-12 text-center">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
              <p className="text-zinc-400">Aucune demande en attente</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <PendingRequestCard
                key={request.id}
                request={request}
                onReview={loadData}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Permissions actives */}
      <TabsContent value="active" className="mt-6">
        {isLoading ? (
          <div className="text-center py-12 text-zinc-400">Chargement...</div>
        ) : activePermissions.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-12 text-center">
              <LockKey size={48} className="mx-auto mb-4 text-zinc-500" />
              <p className="text-zinc-400">Aucune permission temporaire active</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activePermissions.map((perm) => (
              <ActivePermissionCard
                key={perm.id}
                permission={perm}
                onRevoke={loadData}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Historique */}
      <TabsContent value="history" className="mt-6">
        {isLoading ? (
          <div className="text-center py-12 text-zinc-400">Chargement...</div>
        ) : historyRequests.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-12 text-center">
              <Calendar size={48} className="mx-auto mb-4 text-zinc-500" />
              <p className="text-zinc-400">Aucun historique</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {historyRequests.map((request) => (
              <HistoryRequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

/**
 * Carte pour une demande en attente
 */
function PendingRequestCard({
  request,
  onReview,
}: {
  request: any;
  onReview: () => void;
}) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [durationHours, setDurationHours] = useState("24");

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
        onReview();
      } else {
        alert(result.error);
      }
    } catch (error: any) {
      alert(error.message || "Erreur lors du traitement de la demande");
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <User size={20} className="text-blue-400" />
              {request.requester?.full_name || request.requester?.email}
            </CardTitle>
            <CardDescription className="mt-1">
              Demande: <span className="text-zinc-300 font-mono text-sm">{request.requested_permission}</span>
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-amber-500 text-amber-400">
            <ClockCounterClockwise size={14} className="mr-1" />
            En attente
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {request.reason && (
          <div>
            <Label className="text-zinc-400 text-xs">Raison</Label>
            <p className="mt-1 text-sm text-zinc-300">{request.reason}</p>
          </div>
        )}

        <div className="text-xs text-zinc-500">
          Demandé{" "}
          {formatDistance(new Date(request.requested_at), new Date(), {
            addSuffix: true,
            locale: fr,
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
          <div>
            <Label htmlFor={`duration-${request.id}`} className="text-zinc-300 text-sm">
              Durée de l&apos;accès
            </Label>
            <Select value={durationHours} onValueChange={setDurationHours}>
              <SelectTrigger id={`duration-${request.id}`} className="mt-1 bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 heures</SelectItem>
                <SelectItem value="4">4 heures</SelectItem>
                <SelectItem value="8">8 heures</SelectItem>
                <SelectItem value="24">24 heures</SelectItem>
                <SelectItem value="48">48 heures</SelectItem>
                <SelectItem value="168">1 semaine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`notes-${request.id}`} className="text-zinc-300 text-sm">
              Notes (optionnel)
            </Label>
            <Textarea
              id={`notes-${request.id}`}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Ajouter une note..."
              className="mt-1 bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => handleReview('approve')}
            disabled={isReviewing}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle size={16} className="mr-2" />
            Approuver
          </Button>
          <Button
            onClick={() => handleReview('reject')}
            disabled={isReviewing}
            variant="outline"
            className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
          >
            <XCircle size={16} className="mr-2" />
            Rejeter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Carte pour une permission active
 */
function ActivePermissionCard({
  permission,
  onRevoke,
}: {
  permission: any;
  onRevoke: () => void;
}) {
  const [isRevoking, setIsRevoking] = useState(false);
  const expiresAt = new Date(permission.expires_at);
  const now = new Date();
  const hoursRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));

  const handleRevoke = async () => {
    if (!confirm("Êtes-vous sûr de vouloir révoquer cette permission temporaire?")) {
      return;
    }

    setIsRevoking(true);

    try {
      const result = await revokeTemporaryPermissionAction(permission.id);

      if (result.success) {
        onRevoke();
      } else {
        alert(result.error);
      }
    } catch (error: any) {
      alert(error.message || "Erreur lors de la révocation");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <User size={20} className="text-green-400" />
              {permission.user?.full_name || permission.user?.email}
            </CardTitle>
            <CardDescription className="mt-1">
              Permission: <span className="text-zinc-300 font-mono text-sm">{permission.permission}</span>
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-green-500 text-green-400">
            <CheckCircle size={14} className="mr-1" />
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-zinc-400 text-xs">Accordé par</Label>
            <p className="mt-1 text-zinc-300">
              {permission.granter?.full_name || permission.granter?.email}
            </p>
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Expire dans</Label>
            <p className="mt-1 text-zinc-300">
              {hoursRemaining} heure{hoursRemaining > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {permission.reason && (
          <div>
            <Label className="text-zinc-400 text-xs">Raison</Label>
            <p className="mt-1 text-sm text-zinc-300">{permission.reason}</p>
          </div>
        )}

        <Button
          onClick={handleRevoke}
          disabled={isRevoking}
          variant="outline"
          size="sm"
          className="w-full bg-zinc-800 border-zinc-700 text-red-400 hover:bg-zinc-700 hover:text-red-300"
        >
          <XCircle size={16} className="mr-2" />
          Révoquer
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Carte pour l'historique
 */
function HistoryRequestCard({ request }: { request: any }) {
  const isApproved = request.status === 'approved';
  const isRejected = request.status === 'rejected';
  const isExpired = request.status === 'expired';

  return (
    <Card className="bg-zinc-900 border-zinc-800 opacity-75">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <User size={18} className="text-zinc-500" />
              {request.requester?.full_name || request.requester?.email}
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Permission: <span className="font-mono">{request.requested_permission}</span>
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={
              isApproved
                ? "border-green-500 text-green-400"
                : isRejected
                  ? "border-red-500 text-red-400"
                  : "border-zinc-500 text-zinc-400"
            }
          >
            {isApproved && <CheckCircle size={12} className="mr-1" />}
            {isRejected && <XCircle size={12} className="mr-1" />}
            {isExpired && <Warning size={12} className="mr-1" />}
            {isApproved ? "Approuvée" : isRejected ? "Rejetée" : "Expirée"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {request.review_notes && (
          <div>
            <Label className="text-zinc-400 text-xs">Notes du responsable</Label>
            <p className="mt-1 text-xs text-zinc-300">{request.review_notes}</p>
          </div>
        )}

        <div className="text-xs text-zinc-500">
          Traitée par {request.reviewer?.full_name || request.reviewer?.email}{" "}
          {formatDistance(new Date(request.reviewed_at), new Date(), {
            addSuffix: true,
            locale: fr,
          })}
        </div>
      </CardContent>
    </Card>
  );
}
