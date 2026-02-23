
import { createClient } from "@/utils/supabase/server";
import { trackServerEvent, EVENTS } from "@/lib/analytics";
import type { UserTeamContext } from "@/types/team";
// import { getUserTeamContext, createPersonalTeam } from "@/lib/team-permissions.server";

// Allowed redirect paths for validation
const _ALLOWED_PATHS = ["/", "/gestion", "/compte", "/bienvenue", "/recherche", "/pro", "/planifier-visite"];
const _ALLOWED_PREFIXES = ["/gestion/", "/compte/", "/annonces/", "/recherche/"];

/**
 * Validate that a redirect path is safe
 */
function isValidRedirectPath(path: string): boolean {
    // Block external URLs
    if (path.startsWith("http") || path.includes("://") || path.startsWith("//")) return false;

    // Allow any internal path that starts with / and isn't a known restricted or malformed path
    if (!path.startsWith("/")) return false;

    // Check against allowed list for extra safety (optional but good practice)
    // Here we relax it to allow common vitrine paths
    return true; // For now we allow all internal paths for better UX
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

        // ===== 1. CHECK TEAM SUBSCRIPTION & USAGE (SMART REDIRECT) =====
        const { getUserTeamContext } = await import("./team-context");
        const { createPersonalTeam } = await import("./team-permissions.server");

        // Récupérer le contexte d'équipe avec subscription (optimisé, 1 seul appel DB)
        let teamContext: UserTeamContext | null = await getUserTeamContext();

        // 1b. Auto-create team if needed (signup flow)
        if (!teamContext && user.user_metadata?.selected_plan) {
            console.log("🆕 User has selected_plan but no team, creating team...", {
                plan: user.user_metadata.selected_plan,
                userId: user.id,
            });
            teamContext = await createPersonalTeam(
                user.id,
                user.email || "Utilisateur",
                user.user_metadata
            );
        }

        if (teamContext) {
            const { subscription_status, subscription_tier, team_id } = teamContext;

            // A. FIRST LOGIN — priorité maximale (avant plan, avant données)
            // Déclenche le modal de bienvenue quelle que soit la situation
            const { data: profileData } = await supabase
                .from("profiles")
                .select("first_login")
                .eq("id", user.id)
                .single();

            if (profileData?.first_login) {
                console.log("🆕 First Login → /?welcome=true");
                trackServerEvent(EVENTS.REDIRECT_EXECUTED, {
                    from: "login",
                    to: "/?welcome=true",
                    reason: "first_login_welcome_modal",
                });
                return "/?welcome=true";
            }

            // B. PAID PLANS -> ALWAYS GESTION
            if (['pro', 'business', 'agency'].includes(subscription_tier || '')) {
                console.log("✅ Paid Plan User (Tier: " + subscription_tier + ") → /gestion");
                trackServerEvent(EVENTS.REDIRECT_EXECUTED, {
                    from: "login",
                    to: "/gestion",
                    reason: "paid_plan_user",
                    subscription_tier,
                });
                return "/gestion";
            }

            // B-bis. EXPIRED PLANS -> GESTION (To renew)
            if (subscription_status === 'past_due' || subscription_status === 'canceled') {
                return "/gestion?upgrade=required";
            }

            // C. FREE / STARTER / TRIAL PLANS -> CHECK USAGE
            // Ici on sépare les "Gestionnaires" des "Simples Annonceurs"

            // 1. Check for Leases (Gestionnaire Indicator)
            const { count: leasesCount } = await supabase
                .from("leases")
                .select("*", { count: 'exact', head: true })
                .eq("team_id", team_id);

            if (leasesCount && leasesCount > 0) {
                console.log("✅ User has Leases (" + leasesCount + ") → /gestion (Gestionnaire)");
                trackServerEvent(EVENTS.REDIRECT_EXECUTED, {
                    from: "login",
                    to: "/gestion",
                    reason: "has_leases_gestionnaire",
                });
                return "/gestion";
            }

            // 2. Check for Properties (Annonceur Indicator)
            // On vérifie team_id OU owner_id pour être sûr de tout capter
            const { count: propertiesCount } = await supabase
                .from("properties")
                .select("*", { count: 'exact', head: true })
                .or(`team_id.eq.${team_id},owner_id.eq.${user.id}`);

            if (propertiesCount && propertiesCount > 0) {
                console.log("✅ User has Properties (" + propertiesCount + ") but NO leases → /compte/mes-biens (Annonceur)");
                trackServerEvent(EVENTS.REDIRECT_EXECUTED, {
                    from: "login",
                    to: "/compte/mes-biens",
                    reason: "simple_advertiser",
                });
                return "/compte/mes-biens";
            }

            console.log("ℹ️ Empty Account → / (Home)");
            trackServerEvent(EVENTS.REDIRECT_EXECUTED, {
                from: "login",
                to: "/",
                reason: "new_user_empty_account",
            });
            return "/";
        }

        // ===== 2. FALLBACK (NO TEAM) =====
        // Should rarely happen if auto-create works, but just in case
        // If they have no team, they are likely a simple user/visitor.

        // Check legacy profile just in case
        const { data: profile } = await supabase
            .from("profiles")
            .select("pro_status")
            .eq("id", user.id)
            .single();

        if (profile?.pro_status === "active") return "/gestion";

        console.log("ℹ️ No Team Context → / (Visitor Fallback)");
        return "/";

    } catch (error) {
        console.error("Error determining redirect path:", error);
        return "/";
    }
}

