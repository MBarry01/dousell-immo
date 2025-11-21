import { createClient } from "@/utils/supabase/server";
import type { NotificationType } from "@/hooks/use-notifications";
import { getAdminEmail } from "@/lib/mail";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type NotifyUserParams = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  resourcePath?: string;
};

type NotifyAdminParams = {
  type: NotificationType;
  title: string;
  message: string;
  resourcePath?: string;
};

/**
 * Notifier un utilisateur
 * @param params - Paramètres de la notification
 */
export async function notifyUser({
  userId,
  type,
  title,
  message,
  resourcePath,
}: NotifyUserParams) {
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    resource_path: resourcePath || null,
  });

  if (error) {
    console.error("Error creating user notification:", error);
    throw error;
  }

  return { success: true };
}

/**
 * Notifier l'admin
 * @param params - Paramètres de la notification
 */
export async function notifyAdmin({
  type,
  title,
  message,
  resourcePath,
}: NotifyAdminParams) {
  try {
    const supabase = await createClient();
    const adminEmail = getAdminEmail();
    console.log("🔍 Recherche de l'admin avec l'email:", adminEmail);

    // Utiliser NEXT_PUBLIC_ADMIN_ID si disponible, sinon chercher par email
    let adminUserId: string | null = process.env.NEXT_PUBLIC_ADMIN_ID || null;

    if (adminUserId) {
      console.log("✅ Admin ID trouvé via NEXT_PUBLIC_ADMIN_ID:", adminUserId);
    } else {
      // Essayer d'abord avec le service role client si disponible
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          console.log("🔑 Tentative avec service role client...");
          const serviceClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          );

          const { data: adminUsers, error: userError } = await serviceClient.auth.admin.listUsers();
          
          if (userError) {
            console.error("❌ Erreur lors de la récupération des users:", userError);
          } else if (adminUsers) {
            const admin = adminUsers.users.find(
              (user) => user.email?.toLowerCase() === adminEmail.toLowerCase()
            );
            if (admin) {
              adminUserId = admin.id;
              console.log("✅ Admin trouvé via service role:", adminUserId);
            } else {
              console.warn("⚠️ Admin non trouvé dans la liste des users");
            }
          }
        } catch (error) {
          console.warn("⚠️ Erreur avec service role client:", error);
        }
      }

      // Si on n'a pas trouvé avec le service role, utiliser la fonction SQL
      if (!adminUserId) {
        console.log("🔍 Tentative avec fonction SQL get_admin_user_id...");
        const { data, error: rpcError } = await supabase.rpc("get_admin_user_id", {
          admin_email: adminEmail,
        });

        if (rpcError) {
          console.error("❌ Erreur RPC get_admin_user_id:", rpcError);
          // Si la fonction n'existe pas, on peut essayer une requête directe
          if (rpcError.code === "42883" || rpcError.message?.includes("does not exist")) {
            console.warn("⚠️ La fonction get_admin_user_id n'existe pas. Veuillez appliquer la migration SQL.");
          }
        } else if (data) {
          adminUserId = data;
          console.log("✅ Admin trouvé via fonction SQL:", adminUserId);
        }
      }
    }

    if (!adminUserId) {
      const errorMsg = `Admin user with email ${adminEmail} not found. Vérifiez que la migration SQL a été appliquée et que l'admin existe dans auth.users.`;
      console.error("❌", errorMsg);
      return { success: false, error: errorMsg };
    }

    // Créer la notification avec le service role client si disponible pour bypasser RLS
    const notificationClient = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
      : supabase;

    console.log("📝 Création de la notification pour l'admin:", adminUserId);
    const { data, error } = await notificationClient.from("notifications").insert({
      user_id: adminUserId,
      type,
      title,
      message,
      resource_path: resourcePath || null,
    }).select();

    if (error) {
      console.error("❌ Erreur lors de la création de la notification:", error);
      console.error("Détails:", JSON.stringify(error, null, 2));
      return { success: false, error: error.message || "Erreur inconnue" };
    }

    console.log("✅ Notification créée avec succès:", data?.[0]?.id);
    return { success: true, notificationId: data?.[0]?.id };
  } catch (error) {
    console.error("❌ Erreur inattendue dans notifyAdmin:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    };
  }
}

/**
 * @deprecated Utilisez notifyUser à la place
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  return notifyUser({
    userId,
    type,
    title,
    message,
    resourcePath: link,
  });
}

/**
 * Créer une notification pour l'admin
 * @param notificationType - Type de notification (pour déterminer le type de notification)
 * @param title - Titre de la notification
 * @param message - Message de la notification
 * @param propertyId - ID du bien (optionnel, pour créer le lien)
 */
export async function createAdminNotification(
  notificationType: "new_property" | "property_approved" | "property_rejected" | "payment_received",
  title: string,
  message: string,
  propertyId?: string
) {
  const supabase = await createClient();
  const adminEmail = getAdminEmail();

  // Trouver l'ID de l'utilisateur admin en utilisant la fonction SQL ou le service role
  let adminUserId: string | null = null;

  // Essayer d'abord avec le service role client si disponible
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const serviceClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: adminUsers, error: userError } = await serviceClient.auth.admin.listUsers();
      
      if (!userError && adminUsers) {
        const admin = adminUsers.users.find(
          (user) => user.email?.toLowerCase() === adminEmail.toLowerCase()
        );
        if (admin) {
          adminUserId = admin.id;
        }
      }
    } catch (error) {
      console.warn("Could not use service role client:", error);
    }
  }

  // Si on n'a pas trouvé avec le service role, utiliser la fonction SQL
  if (!adminUserId) {
    const { data, error: rpcError } = await supabase.rpc("get_admin_user_id", {
      admin_email: adminEmail,
    });

    if (!rpcError && data) {
      adminUserId = data;
    }
  }

  if (!adminUserId) {
    console.warn(`Admin user with email ${adminEmail} not found`);
    return { success: false, error: "Admin user not found" };
  }

  // Déterminer le type de notification et le lien
  let type: NotificationType = "info";
  let link: string | undefined;

  switch (notificationType) {
    case "new_property":
      type = "info";
      link = propertyId ? `/admin/moderation?property=${propertyId}` : "/admin/moderation";
      break;
    case "property_approved":
      type = "success";
      link = propertyId ? `/biens/${propertyId}` : undefined;
      break;
    case "property_rejected":
      type = "warning";
      link = propertyId ? `/admin/biens/${propertyId}` : "/admin/moderation";
      break;
    case "payment_received":
      type = "success";
      link = propertyId ? `/admin/biens/${propertyId}` : "/admin/dashboard";
      break;
  }

  // Créer la notification avec le service role client si disponible pour bypasser RLS
  const notificationClient = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : supabase;

  const { error } = await notificationClient.from("notifications").insert({
    user_id: adminUserId,
    type,
    title,
    message,
    link: link || null,
  });

  if (error) {
    console.error("Error creating admin notification:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Exemples d'utilisation :
 * 
 * // Notification de bien approuvé
 * await createNotification(
 *   userId,
 *   'success',
 *   'Bien approuvé',
 *   'Votre bien "Villa à Dakar" a été approuvé et est maintenant visible.',
 *   '/biens/123'
 * );
 * 
 * // Notification de visite planifiée
 * await createNotification(
 *   userId,
 *   'info',
 *   'Visite planifiée',
 *   'Une visite a été planifiée pour votre bien le 15 janvier à 14h.',
 *   '/compte/mes-biens'
 * );
 * 
 * // Notification d'erreur
 * await createNotification(
 *   userId,
 *   'error',
 *   'Erreur de paiement',
 *   'Le paiement de votre annonce n\'a pas pu être traité. Veuillez réessayer.'
 * );
 */
