"use server";

/**
 * Server Actions: Temporary Access Control
 *
 * Gère les demandes d'accès temporaire et les permissions temporaires
 */

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireTeamPermission } from "@/lib/permissions";
import { z } from "zod";
import type { TeamPermissionKey } from "@/lib/team-permissions";
import {
  notifyAccessRequest,
  notifyAccessApproved,
  notifyAccessRejected,
} from "@/lib/notifications/access-control-notifications";

// =====================================================
// TYPES & SCHEMAS
// =====================================================

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired';

const requestAccessSchema = z.object({
    teamId: z.string().uuid(),
    permission: z.string().min(1),
    reason: z.string().optional(),
});

const reviewAccessRequestSchema = z.object({
    requestId: z.string().uuid(),
    action: z.enum(['approve', 'reject']),
    reviewNotes: z.string().optional(),
    durationHours: z.number().min(1).max(720).optional(), // Max 30 jours
});

const grantTemporaryPermissionSchema = z.object({
    teamId: z.string().uuid(),
    userId: z.string().uuid(),
    permission: z.string().min(1),
    durationHours: z.number().min(1).max(720),
    reason: z.string().optional(),
});

// =====================================================
// ACCESS REQUESTS
// =====================================================

/**
 * Créer une demande d'accès temporaire
 */
export async function requestAccessAction(formData: FormData | {
    teamId: string;
    permission: string;
    reason?: string;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Non connecté" };
        }

        // Parse & validate
        const data = formData instanceof FormData
            ? Object.fromEntries(formData.entries())
            : formData;

        const validation = requestAccessSchema.safeParse(data);
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.issues[0]?.message || "Données invalides"
            };
        }

        const { teamId, permission, reason } = validation.data;

        // Vérifier que l'utilisateur est membre de l'équipe
        const { data: membership } = await supabase
            .from('team_members')
            .select('id, role')
            .eq('team_id', teamId)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (!membership) {
            return { success: false, error: "Vous n'êtes pas membre de cette équipe" };
        }

        // Vérifier qu'il n'y a pas déjà une demande pending pour cette permission
        const { data: existingRequest } = await supabase
            .from('access_requests')
            .select('id')
            .eq('team_id', teamId)
            .eq('requester_id', user.id)
            .eq('requested_permission', permission)
            .eq('status', 'pending')
            .maybeSingle();

        if (existingRequest) {
            return {
                success: false,
                error: "Vous avez déjà une demande en attente pour cette permission"
            };
        }

        // Créer la demande
        const { error: insertError } = await supabase
            .from('access_requests')
            .insert({
                team_id: teamId,
                requester_id: user.id,
                requested_permission: permission,
                reason: reason || null,
                status: 'pending',
            });

        if (insertError) {
            console.error('[Access Request] Insert error:', insertError);
            return {
                success: false,
                error: "Erreur lors de la création de la demande"
            };
        }

        // Envoyer notification aux owners/managers
        await notifyAccessRequest({
            teamId,
            requesterId: user.id,
            permission,
            reason,
        });

        return {
            success: true,
            message: "Demande d'accès envoyée avec succès"
        };
    } catch (error) {
        console.error('[Access Request] Unexpected error:', error);
        return {
            success: false,
            error: "Erreur inattendue lors de la création de la demande"
        };
    }
}

/**
 * Récupérer les demandes d'accès pour une équipe
 */
export async function getAccessRequestsAction(teamId: string, status?: AccessRequestStatus) {
    try {
        const context = await requireTeamPermission("team.members.view");
        const adminSupabase = createAdminClient();

        // Récupérer les demandes
        let query = adminSupabase
            .from('access_requests')
            .select('*')
            .eq('team_id', teamId)
            .order('requested_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data: requests, error } = await query;

        if (error) {
            console.error('[Access Requests] Fetch error:', error);
            return { success: false, error: "Erreur lors de la récupération des demandes" };
        }

        if (!requests || requests.length === 0) {
            return { success: true, data: [] };
        }

        // Récupérer les profils des demandeurs et reviewers
        const userIds = new Set<string>();
        requests.forEach(r => {
            if (r.requester_id) userIds.add(r.requester_id);
            if (r.reviewed_by) userIds.add(r.reviewed_by);
        });

        const { data: profiles } = await adminSupabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', Array.from(userIds));

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Enrichir les demandes avec les profils
        const enrichedData = requests.map(r => ({
            ...r,
            requester: profileMap.get(r.requester_id) || null,
            reviewer: r.reviewed_by ? profileMap.get(r.reviewed_by) || null : null,
        }));

        return { success: true, data: enrichedData };
    } catch (error: any) {
        console.error('[Access Requests] Unexpected error:', error);
        return { success: false, error: error.message || "Erreur inattendue" };
    }
}

/**
 * Approuver ou rejeter une demande d'accès
 */
export async function reviewAccessRequestAction(formData: FormData | {
    requestId: string;
    action: 'approve' | 'reject';
    reviewNotes?: string;
    durationHours?: number;
}) {
    try {
        const context = await requireTeamPermission("team.members.edit_role"); // Owners/Managers
        const supabase = await createClient();
        const adminSupabase = createAdminClient();

        // Parse & validate
        const data = formData instanceof FormData
            ? {
                requestId: formData.get('requestId') as string,
                action: formData.get('action') as 'approve' | 'reject',
                reviewNotes: formData.get('reviewNotes') as string | undefined,
                durationHours: formData.get('durationHours') ? Number(formData.get('durationHours')) : undefined,
            }
            : formData;

        const validation = reviewAccessRequestSchema.safeParse(data);
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.issues[0]?.message || "Données invalides"
            };
        }

        const { requestId, action, reviewNotes, durationHours } = validation.data;

        // Récupérer la demande
        const { data: request, error: fetchError } = await supabase
            .from('access_requests')
            .select('*')
            .eq('id', requestId)
            .eq('team_id', context.teamId)
            .single();

        if (fetchError || !request) {
            return { success: false, error: "Demande introuvable" };
        }

        if (request.status !== 'pending') {
            return { success: false, error: "Cette demande a déjà été traitée" };
        }

        // Mettre à jour la demande
        const updateData: any = {
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewed_by: context.user.id,
            reviewed_at: new Date().toISOString(),
            review_notes: reviewNotes || null,
        };

        if (action === 'approve') {
            const hours = durationHours || 24; // Par défaut 24h
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + hours);
            updateData.expires_at = expiresAt.toISOString();

            // Créer la permission temporaire
            const { error: tempPermError } = await adminSupabase
                .from('temporary_permissions')
                .insert({
                    team_id: request.team_id,
                    user_id: request.requester_id,
                    permission: request.requested_permission,
                    granted_by: context.user.id,
                    expires_at: expiresAt.toISOString(),
                    access_request_id: requestId,
                    reason: request.reason,
                });

            if (tempPermError) {
                console.error('[Temporary Permission] Insert error:', tempPermError);
                return {
                    success: false,
                    error: "Erreur lors de la création de la permission temporaire"
                };
            }
        }

        const { error: updateError} = await adminSupabase
            .from('access_requests')
            .update(updateData)
            .eq('id', requestId);

        if (updateError) {
            console.error('[Access Request] Update error:', updateError);
            return {
                success: false,
                error: "Erreur lors de la mise à jour de la demande"
            };
        }

        // Envoyer notification au demandeur
        if (action === 'approve') {
            const hours = durationHours || 24;
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + hours);

            await notifyAccessApproved({
                requesterId: request.requester_id,
                teamId: request.team_id,
                permission: request.requested_permission,
                expiresAt: expiresAt.toISOString(),
                durationHours: hours,
                reviewerId: context.user.id,
                reviewNotes,
            });
        } else {
            await notifyAccessRejected({
                requesterId: request.requester_id,
                teamId: request.team_id,
                permission: request.requested_permission,
                reviewerId: context.user.id,
                reviewNotes,
            });
        }

        return {
            success: true,
            message: action === 'approve'
                ? "Demande approuvée et permission accordée"
                : "Demande rejetée"
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Erreur inattendue" };
    }
}

// =====================================================
// TEMPORARY PERMISSIONS
// =====================================================

/**
 * Accorder directement une permission temporaire (sans demande)
 */
export async function grantTemporaryPermissionAction(formData: FormData | {
    teamId: string;
    userId: string;
    permission: string;
    durationHours: number;
    reason?: string;
}) {
    try {
        const context = await requireTeamPermission("team.members.edit_role");
        const adminSupabase = createAdminClient();

        // Parse & validate
        const data = formData instanceof FormData
            ? {
                teamId: formData.get('teamId') as string,
                userId: formData.get('userId') as string,
                permission: formData.get('permission') as string,
                durationHours: Number(formData.get('durationHours')),
                reason: formData.get('reason') as string | undefined,
            }
            : formData;

        const validation = grantTemporaryPermissionSchema.safeParse(data);
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.issues[0]?.message || "Données invalides"
            };
        }

        const { teamId, userId, permission, durationHours, reason } = validation.data;

        if (teamId !== context.teamId) {
            return { success: false, error: "Accès non autorisé" };
        }

        // Calculer la date d'expiration
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + durationHours);

        // Créer la permission temporaire (upsert pour éviter les doublons)
        const { error: insertError } = await adminSupabase
            .from('temporary_permissions')
            .upsert({
                team_id: teamId,
                user_id: userId,
                permission,
                granted_by: context.user.id,
                expires_at: expiresAt.toISOString(),
                reason: reason || null,
            }, {
                onConflict: 'team_id,user_id,permission'
            });

        if (insertError) {
            console.error('[Temporary Permission] Upsert error:', insertError);
            return {
                success: false,
                error: "Erreur lors de l'octroi de la permission temporaire"
            };
        }

        // Envoyer notification à l'utilisateur
        await notifyAccessApproved({
            requesterId: userId,
            teamId,
            permission,
            expiresAt: expiresAt.toISOString(),
            durationHours,
            reviewerId: context.user.id,
            reviewNotes: reason,
        });

        return {
            success: true,
            message: `Permission accordée pour ${durationHours} heures`
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Erreur inattendue" };
    }
}

/**
 * Révoquer une permission temporaire
 */
export async function revokeTemporaryPermissionAction(permissionId: string) {
    try {
        const context = await requireTeamPermission("team.members.edit_role");
        const adminSupabase = createAdminClient();

        // Vérifier que la permission appartient à l'équipe
        const { data: permission, error: fetchError } = await adminSupabase
            .from('temporary_permissions')
            .select('*')
            .eq('id', permissionId)
            .eq('team_id', context.teamId)
            .single();

        if (fetchError || !permission) {
            return { success: false, error: "Permission introuvable" };
        }

        // Supprimer la permission
        const { error: deleteError } = await adminSupabase
            .from('temporary_permissions')
            .delete()
            .eq('id', permissionId);

        if (deleteError) {
            console.error('[Temporary Permission] Delete error:', deleteError);
            return {
                success: false,
                error: "Erreur lors de la révocation de la permission"
            };
        }

        return {
            success: true,
            message: "Permission révoquée avec succès"
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Erreur inattendue" };
    }
}

/**
 * Récupérer les permissions temporaires actives d'une équipe
 */
export async function getTemporaryPermissionsAction(teamId: string) {
    try {
        const context = await requireTeamPermission("team.members.view");
        const adminSupabase = createAdminClient();

        const { data: permissions, error } = await adminSupabase
            .from('temporary_permissions')
            .select('*')
            .eq('team_id', teamId)
            .gte('expires_at', new Date().toISOString())
            .order('expires_at', { ascending: true });

        if (error) {
            console.error('[Temporary Permissions] Fetch error:', error);
            return {
                success: false,
                error: "Erreur lors de la récupération des permissions"
            };
        }

        if (!permissions || permissions.length === 0) {
            return { success: true, data: [] };
        }

        // Récupérer les profils des users et granters
        const userIds = new Set<string>();
        permissions.forEach(p => {
            if (p.user_id) userIds.add(p.user_id);
            if (p.granted_by) userIds.add(p.granted_by);
        });

        const { data: profiles } = await adminSupabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', Array.from(userIds));

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Enrichir les permissions avec les profils
        const enrichedData = permissions.map(p => ({
            ...p,
            user: profileMap.get(p.user_id) || null,
            granter: profileMap.get(p.granted_by) || null,
        }));

        return { success: true, data: enrichedData };
    } catch (error: any) {
        console.error('[Temporary Permissions] Unexpected error:', error);
        return { success: false, error: error.message || "Erreur inattendue" };
    }
}

/**
 * Nettoyer les permissions expirées
 */
export async function cleanupExpiredPermissionsAction() {
    try {
        const adminSupabase = createAdminClient();

        const { data, error } = await adminSupabase.rpc('cleanup_expired_permissions');

        if (error) {
            console.error('[Cleanup] Error:', error);
            return {
                success: false,
                error: "Erreur lors du nettoyage des permissions expirées"
            };
        }

        return {
            success: true,
            deletedCount: data as number,
            message: `${data} permission(s) expirée(s) supprimée(s)`
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Erreur inattendue" };
    }
}
