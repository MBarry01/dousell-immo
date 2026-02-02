"use server";

import { createClient } from "@/utils/supabase/server";
import { trackServerEvent, EVENTS } from "@/lib/analytics";

// Allowed redirect paths for validation
const ALLOWED_PATHS = ["/", "/gestion", "/compte", "/bienvenue"];
const ALLOWED_PREFIXES = ["/gestion/", "/compte/"];

/**
 * Validate that a redirect path is safe
 */
function isValidRedirectPath(path: string): boolean {
    // Block external URLs
    if (path.startsWith("http") || path.includes("://")) return false;

    // Check allowed paths
    return ALLOWED_PATHS.includes(path) ||
        ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix));
}

/**
 * Détermine la route de redirection après connexion
 * basée sur le type d'utilisateur :
 *
 * PRIORITY ORDER (per WORKFLOW_PROPOSAL.md section 5.2):
 * 0. Explicit ?next= parameter (if provided and valid)
 * 1. Pro status (trial/active) → /gestion
 * 2. Pro expired → /gestion?upgrade=required
 * 3. Team member → /gestion
 * 4. First login + prospect → /bienvenue
 * 5. Fallback → / (vitrine)
 *
 * NOTE: Tenants do NOT use this function - they access via Magic Link
 */
export async function getSmartRedirectPath(explicitNext?: string): Promise<string> {
    try {
        // 0. Priority: explicit ?next= parameter
        if (explicitNext && isValidRedirectPath(explicitNext)) {
            console.log("✅ Using explicit next parameter:", explicitNext);
            trackServerEvent(EVENTS.REDIRECT_EXECUTED, {
                from: "login",
                to: explicitNext,
                reason: "explicit_next_param",
            });
            return explicitNext;
        }

        const supabase = await createClient();

        // Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return "/";
        }

        // ===== 1. CHECK TEAM SUBSCRIPTION (PRIMARY - NEW ARCHITECTURE) =====

        // Récupérer le contexte d'équipe avec subscription (optimisé, 1 seul appel DB)
        const { getUserTeamContext } = await import("@/lib/team-permissions.server");
        const teamContext = await getUserTeamContext();

        if (teamContext) {
            // Vérifier le statut d'abonnement de l'équipe
            const subscriptionStatus = teamContext.subscription_status;

            if (subscriptionStatus === 'trial' || subscriptionStatus === 'active') {
                console.log("✅ Team has active subscription:", subscriptionStatus, "→ /gestion");
                trackServerEvent(EVENTS.REDIRECT_EXECUTED, {
                    from: "login",
                    to: "/gestion",
                    reason: "team_subscription_active",
                    subscription_status: subscriptionStatus,
                });
                return "/gestion";
            }

            // Équipe expirée → modal upgrade
            if (subscriptionStatus === 'expired' || subscriptionStatus === 'canceled') {
                console.log("⚠️ Team subscription expired/canceled → /gestion?upgrade=required");
                trackServerEvent(EVENTS.REDIRECT_EXECUTED, {
                    from: "login",
                    to: "/gestion?upgrade=required",
                    reason: "team_subscription_expired",
                    subscription_status: subscriptionStatus,
                });
                return "/gestion?upgrade=required";
            }
        }

        // ===== 2. FALLBACK: CHECK PRO STATUS (LEGACY - BACKWARD COMPATIBILITY) =====

        const { data: profile } = await supabase
            .from("profiles")
            .select("pro_status, pro_trial_ends_at, first_login, gestion_locative_enabled")
            .eq("id", user.id)
            .single();

        if (profile?.pro_status === "trial" || profile?.pro_status === "active") {
            console.log("⚠️ [LEGACY] User has pro_status:", profile.pro_status, "→ /gestion");
            trackServerEvent(EVENTS.REDIRECT_EXECUTED, {
                from: "login",
                to: "/gestion",
                reason: "pro_status_active_legacy",
                pro_status: profile.pro_status,
            });
            return "/gestion";
        }

        // Pro expired (legacy)
        if (profile?.pro_status === "expired") {
            console.log("⚠️ [LEGACY] User pro_status is expired → /gestion?upgrade=required");
            trackServerEvent(EVENTS.REDIRECT_EXECUTED, {
                from: "login",
                to: "/gestion?upgrade=required",
                reason: "pro_expired_legacy",
                pro_status: "expired",
            });
            return "/gestion?upgrade=required";
        }

        // ===== 3. FALLBACK: CHECK TEAM MEMBERSHIP =====

        const { data: teamMembership } = await supabase
            .from("team_members")
            .select("id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();

        if (teamMembership) {
            console.log("✅ User is a team member → /gestion");
            trackServerEvent(EVENTS.REDIRECT_EXECUTED, {
                from: "login",
                to: "/gestion",
                reason: "team_member",
            });
            return "/gestion";
        }

        // ===== 4. FALLBACK: CHECK LEGACY gestion_locative_enabled =====

        if (profile?.gestion_locative_enabled) {
            console.log("✅ User has gestion_locative_enabled → /gestion");
            trackServerEvent(EVENTS.REDIRECT_EXECUTED, {
                from: "login",
                to: "/gestion",
                reason: "legacy_gestion_enabled",
            });
            return "/gestion";
        }

        // ===== 5. FIRST LOGIN PROSPECT → /bienvenue =====

        if (profile?.first_login) {
            console.log("✅ First login, showing /bienvenue");
            trackServerEvent(EVENTS.REDIRECT_EXECUTED, {
                from: "login",
                to: "/bienvenue",
                reason: "first_login",
            });
            return "/bienvenue";
        }

        // ===== 6. FALLBACK: Visitor → vitrine =====
        console.log("ℹ️ Regular visitor → /");
        trackServerEvent(EVENTS.REDIRECT_EXECUTED, {
            from: "login",
            to: "/",
            reason: "prospect_fallback",
        });
        return "/";

    } catch (error) {
        console.error("Error determining redirect path:", error);
        return "/";
    }
}

/**
 * Version client-callable qui ne peut être utilisée que depuis une action serveur
 */
export async function determinePostLoginRedirect(): Promise<{ redirectPath: string }> {
    const redirectPath = await getSmartRedirectPath();
    return { redirectPath };
}

