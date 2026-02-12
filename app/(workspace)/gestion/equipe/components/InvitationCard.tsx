"use client";

import { useState } from "react";
import { Mail, RefreshCw, XCircle, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { RoleBadge } from "./RoleBadge";
import { resendInvitation, cancelInvitation } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { TeamRole } from "@/types/team";

interface InvitationCardProps {
    invitation: {
        id: string;
        team_id: string;
        email: string;
        role: string;
        created_at: string;
        expires_at: string;
        status: string;
    };
    canManage: boolean;
}

export function InvitationCard({ invitation, canManage }: InvitationCardProps) {
    const { isDark } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleResend = async () => {
        setLoading(true);
        const result = await resendInvitation(invitation.team_id, invitation.id);
        setLoading(false);

        if (result.success) {
            toast.success("Invitation renvoyée !");
            router.refresh();
        } else {
            toast.error(result.error);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Voulez-vous vraiment annuler cette invitation ?")) return;

        setLoading(true);
        const result = await cancelInvitation(invitation.team_id, invitation.id);
        setLoading(false);

        if (result.success) {
            toast.success("Invitation annulée");
            router.refresh();
        } else {
            toast.error(result.error);
        }
    };

    const isExpired = new Date(invitation.expires_at) < new Date();

    return (
        <div
            className={cn(
                "p-4 rounded-xl border flex items-center justify-between gap-4 group",
                isDark ? "bg-slate-800/50 border-slate-800" : "bg-white border-gray-100"
            )}
        >
            <div className="flex items-center gap-4">
                <div
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        isDark ? "bg-slate-700 text-slate-400" : "bg-gray-100 text-gray-500"
                    )}
                >
                    <Mail className="w-5 h-5" />
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className={cn(
                                "font-medium",
                                isDark ? "text-slate-200" : "text-gray-900"
                            )}
                        >
                            {invitation.email}
                        </span>
                        <RoleBadge role={invitation.role as TeamRole} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <span className={cn(isDark ? "text-slate-500" : "text-gray-500")}>
                            Envoyée le {new Date(invitation.created_at).toLocaleDateString()}
                        </span>
                        {isExpired ? (
                            <Badge variant="destructive" className="h-5 text-[10px] px-1.5">
                                Expirée
                            </Badge>
                        ) : (
                            <span className="flex items-center gap-1 text-amber-500">
                                <Clock className="w-3 h-3" />
                                En attente
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {canManage && (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResend}
                        disabled={loading}
                        className={cn(
                            "h-8 px-2",
                            isDark ? "text-slate-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                        )}
                        title="Renvoyer l'invitation"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        disabled={loading}
                        className={cn(
                            "h-8 px-2 hover:bg-red-500/10 text-red-500 hover:text-red-600"
                        )}
                        title="Annuler"
                    >
                        <XCircle className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}
