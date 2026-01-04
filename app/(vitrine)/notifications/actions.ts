"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

/**
 * Marquer une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();

  // Vérifier que l'utilisateur est connecté
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Non authentifié",
    };
  }

  // Mettre à jour la notification
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error marking notification as read:", error);
    return {
      error: error.message,
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
  };
}

/**
 * Marquer toutes les notifications comme lues pour un utilisateur
 */
export async function markAllNotificationsAsRead() {
  const supabase = await createClient();

  // Vérifier que l'utilisateur est connecté
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Non authentifié",
    };
  }

  // Mettre à jour toutes les notifications non lues
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      error: error.message,
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
  };
}


