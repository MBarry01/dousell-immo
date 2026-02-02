/**
 * Fonctions utilitaires pour les notifications
 */

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { notifyUser } from "./notifications";
import { getAdminEmail } from "@/lib/mail";
import type { NotificationType } from "@/hooks/use-notifications";

/**
 * Récupère tous les IDs des utilisateurs avec un rôle spécifique
 */
export async function getUsersWithRoles(roles: string[]): Promise<string[]> {
  try {
    // TOUJOURS utiliser le service role client si disponible pour bypasser RLS
    let supabase;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      console.log("🔑 Utilisation du service role client pour getUsersWithRoles");
    } else {
      supabase = await createClient();
      console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY non défini, utilisation du client normal (peut être bloqué par RLS)");
    }
    
    // Récupérer tous les user_id qui ont au moins un des rôles demandés
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", roles);

    if (error) {
      console.error("❌ Error fetching users with roles:", {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return [];
    }

    // Retourner les user_id uniques
    const userIds = new Set<string>();
    data?.forEach((row) => {
      if (row.user_id) {
        userIds.add(row.user_id);
      }
    });

    console.log(`✅ ${userIds.size} utilisateurs trouvés avec les rôles: ${roles.join(", ")}`, {
      userIds: Array.from(userIds),
      roles: data?.map(r => ({ user_id: r.user_id, role: r.role }))
    });

    // Ajouter l'admin principal même s'il n'a pas de rôle dans user_roles (fallback)
    const adminEmail = getAdminEmail();
    if (adminEmail && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const { data: adminUsers } = await adminClient.auth.admin.listUsers();
        const admin = adminUsers?.users.find(
          (user) => user.email?.toLowerCase() === adminEmail.toLowerCase()
        );
        if (admin && !userIds.has(admin.id)) {
          userIds.add(admin.id);
          console.log(`✅ Admin principal ajouté: ${admin.id} (${admin.email})`);
        }
      } catch (adminError) {
        console.warn("⚠️ Impossible de récupérer l'admin principal:", adminError);
      }
    } else if (!adminEmail) {
      console.warn("⚠️ Admin email non configuré, impossible d'ajouter l'admin principal");
    } else {
      console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY non défini, impossible d'ajouter l'admin principal");
    }

    return Array.from(userIds);
  } catch (error) {
    console.error("❌ Error in getUsersWithRoles:", error);
    return [];
  }
}

/**
 * Notifie tous les modérateurs et admins
 */
export async function notifyModeratorsAndAdmins({
  type,
  title,
  message,
  resourcePath,
}: {
  type: NotificationType;
  title: string;
  message: string;
  resourcePath?: string;
}): Promise<{ success: boolean; notified: number; errors: string[] }> {
  const errors: string[] = [];
  let notified = 0;

  try {
    console.log("🔍 notifyModeratorsAndAdmins appelé avec:", { type, title, message, resourcePath });
    
    // Récupérer tous les admins, modérateurs et superadmins
    const userIds = await getUsersWithRoles(["admin", "moderateur", "superadmin"]);

    console.log(`📬 Notification à ${userIds.length} modérateurs/admins`, { userIds });

    if (userIds.length === 0) {
      console.warn("⚠️ Aucun modérateur/admin trouvé. Vérifiez que les rôles sont bien assignés dans user_roles.");
      // Ne pas retourner une erreur, juste logger un avertissement
      return { success: true, notified: 0, errors: [] };
    }

    // Notifier chaque utilisateur
    for (const userId of userIds) {
      try {
        console.log(`📤 Envoi de notification à ${userId}...`);
        await notifyUser({
          userId,
          type,
          title,
          message,
          resourcePath,
        });
        notified++;
        console.log(`✅ Notification envoyée à ${userId}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
        errors.push(`User ${userId}: ${errorMsg}`);
        console.error(`❌ Erreur lors de la notification pour ${userId}:`, error);
      }
    }

    console.log(`✅ notifyModeratorsAndAdmins terminé: ${notified}/${userIds.length} notifications envoyées`);
    return { success: errors.length === 0, notified, errors };
  } catch (error) {
    console.error("❌ Erreur dans notifyModeratorsAndAdmins:", error);
    return {
      success: false,
      notified,
      errors: [error instanceof Error ? error.message : "Erreur inconnue"],
    };
  }
}

