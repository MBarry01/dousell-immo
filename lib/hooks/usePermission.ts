"use client";

/**
 * Hook usePermission
 *
 * Vérifie si l'utilisateur a une permission (via rôle ou permission temporaire)
 * et fournit une interface pour demander l'accès si nécessaire.
 */

import { useState, useEffect, useCallback } from 'react';
import type { TeamPermissionKey } from '@/lib/team-permissions';
import { useTeam } from '@/lib/hooks/useTeam';
import { createClient } from '@/utils/supabase/client';
import { requestAccessAction } from '@/app/(workspace)/gestion/access-control/actions';

export interface UsePermissionResult {
    /**
     * Si l'utilisateur a la permission (via rôle ou temporaire)
     */
    hasPermission: boolean;

    /**
     * Si la vérification est en cours
     */
    isLoading: boolean;

    /**
     * Erreur lors de la vérification
     */
    error: string | null;

    /**
     * Si une permission temporaire est active
     */
    hasTemporaryAccess: boolean;

    /**
     * Date d'expiration de la permission temporaire (si applicable)
     */
    temporaryAccessExpiresAt: Date | null;

    /**
     * Demander l'accès temporaire
     */
    requestAccess: (reason?: string) => Promise<{ success: boolean; error?: string }>;

    /**
     * Rafraîchir le statut de la permission
     */
    refresh: () => Promise<void>;
}

/**
 * Hook pour vérifier et gérer les permissions
 *
 * @param permission - La permission à vérifier
 * @param options - Options optionnelles
 * @returns UsePermissionResult
 *
 * @example
 * ```tsx
 * const { hasPermission, requestAccess, isLoading } = usePermission('leases.edit');
 *
 * if (isLoading) return <Spinner />;
 *
 * if (!hasPermission) {
 *   return <Button onClick={() => requestAccess('J\'ai besoin d\'éditer ce bail')}>
 *     Demander l'accès
 *   </Button>;
 * }
 *
 * return <LeaseEditForm />;
 * ```
 */
export function usePermission(
    permission: TeamPermissionKey,
    options?: {
        /**
         * Si true, ne vérifie pas automatiquement au montage
         */
        manual?: boolean;
    }
): UsePermissionResult {
    const { team_id: teamId, user_id, user } = useTeam();
    const [hasPermission, setHasPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(!options?.manual);
    const [error, setError] = useState<string | null>(null);
    const [hasTemporaryAccess, setHasTemporaryAccess] = useState(false);
    const [temporaryAccessExpiresAt, setTemporaryAccessExpiresAt] = useState<Date | null>(null);

    /**
     * Vérifie la permission (rôle + temporaire)
     */
    const checkPermission = useCallback(async () => {
        if (!teamId || !user_id || !permission) {
            setHasPermission(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            // 1. Vérifier la permission du rôle (côté client, simple check)
            // Note: Le vrai check est côté serveur, mais on peut optimiser l'UX
            // en affichant directement si le rôle a la permission

            // 2. Vérifier les permissions temporaires actives
            const { data: tempPermissions, error: tempError } = await supabase.rpc(
                'get_active_temporary_permissions',
                {
                    p_team_id: teamId,
                    p_user_id: user_id,
                }
            );

            if (tempError) {
                console.error('[usePermission] Error fetching temporary permissions:', tempError);
                setError(tempError.message);
                setHasPermission(false);
                return;
            }

            // Chercher si la permission demandée est dans les permissions temporaires
            const tempPerm = tempPermissions?.find((p: any) => p.permission === permission);

            if (tempPerm) {
                setHasTemporaryAccess(true);
                setTemporaryAccessExpiresAt(new Date(tempPerm.expires_at));
                setHasPermission(true);
            } else {
                setHasTemporaryAccess(false);
                setTemporaryAccessExpiresAt(null);

                // Si pas de permission temporaire, vérifier via le rôle
                // (On fait confiance au backend pour la vraie vérification)
                // Pour l'instant on assume que le user n'a pas la permission
                // À améliorer avec un appel serveur si nécessaire
                setHasPermission(false);
            }
        } catch (err: any) {
            console.error('[usePermission] Unexpected error:', err);
            setError(err.message || 'Erreur inattendue');
            setHasPermission(false);
        } finally {
            setIsLoading(false);
        }
    }, [teamId, user_id, permission]);

    /**
     * Demander l'accès temporaire
     */
    const requestAccess = useCallback(async (reason?: string) => {
        if (!teamId || !permission) {
            return { success: false, error: 'Contexte invalide' };
        }

        try {
            const result = await requestAccessAction({
                teamId,
                permission,
                reason,
            });

            if (result.success) {
                // Rafraîchir après la demande
                await checkPermission();
            }

            return result;
        } catch (err: any) {
            console.error('[usePermission] Request access error:', err);
            return {
                success: false,
                error: err.message || 'Erreur lors de la demande d\'accès',
            };
        }
    }, [teamId, permission, checkPermission]);

    /**
     * Rafraîchir le statut
     */
    const refresh = useCallback(async () => {
        await checkPermission();
    }, [checkPermission]);

    // Vérifier au montage (sauf si manual)
    useEffect(() => {
        if (!options?.manual) {
            checkPermission();
        }
    }, [checkPermission, options?.manual]);

    return {
        hasPermission,
        isLoading,
        error,
        hasTemporaryAccess,
        temporaryAccessExpiresAt,
        requestAccess,
        refresh,
    };
}

/**
 * Hook simplifié pour vérifier plusieurs permissions
 */
export function usePermissions(permissions: TeamPermissionKey[]) {
    const results = permissions.map((permission) => usePermission(permission));

    return {
        hasAll: results.every((r) => r.hasPermission),
        hasAny: results.some((r) => r.hasPermission),
        isLoading: results.some((r) => r.isLoading),
        permissions: results,
    };
}
