"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { PropertyFilters } from "@/services/propertyService";

export interface CreateAlertData {
  name: string;
  filters: PropertyFilters;
}

export interface SearchAlert {
  id: string;
  user_id: string;
  name: string;
  filters: PropertyFilters;
  is_active: boolean;
  created_at: string;
}

export async function createSearchAlert(data: CreateAlertData) {
  try {
    const supabase = await createClient();

    // Vérifier que l'utilisateur est authentifié
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: "Vous devez être connecté pour créer une alerte",
        data: null,
      };
    }

    // Créer l'alerte
    const { data: alert, error } = await supabase
      .from("search_alerts")
      .insert({
        user_id: user.id,
        name: data.name,
        filters: data.filters,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      // Si la table n'existe pas
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        return {
          error: "La fonctionnalité d'alertes n'est pas encore disponible. Veuillez réessayer plus tard.",
          data: null,
        };
      }

      return {
        error: error.message || "Erreur lors de la création de l'alerte",
        data: null,
      };
    }

    revalidatePath("/compte/alertes");

    return {
      error: null,
      data: alert as SearchAlert,
    };
  } catch (error) {
    console.error("Error creating search alert:", error);
    return {
      error: "Une erreur inattendue s'est produite",
      data: null,
    };
  }
}

export async function updateSearchAlert(
  alertId: string,
  updates: Partial<Pick<SearchAlert, "name" | "filters" | "is_active">>
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: "Vous devez être connecté pour modifier une alerte",
        data: null,
      };
    }

    const { data: alert, error } = await supabase
      .from("search_alerts")
      .update(updates)
      .eq("id", alertId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return {
        error: error.message || "Erreur lors de la mise à jour de l'alerte",
        data: null,
      };
    }

    revalidatePath("/compte/alertes");

    return {
      error: null,
      data: alert as SearchAlert,
    };
  } catch (error) {
    console.error("Error updating search alert:", error);
    return {
      error: "Une erreur inattendue s'est produite",
      data: null,
    };
  }
}

export async function deleteSearchAlert(alertId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: "Vous devez être connecté pour supprimer une alerte",
        data: null,
      };
    }

    const { error } = await supabase
      .from("search_alerts")
      .delete()
      .eq("id", alertId)
      .eq("user_id", user.id);

    if (error) {
      return {
        error: error.message || "Erreur lors de la suppression de l'alerte",
        data: null,
      };
    }

    revalidatePath("/compte/alertes");

    return {
      error: null,
      data: { success: true },
    };
  } catch (error) {
    console.error("Error deleting search alert:", error);
    return {
      error: "Une erreur inattendue s'est produite",
      data: null,
    };
  }
}

export interface NotificationPreferences {
  new_properties: boolean;
  property_updates: boolean;
  price_drops: boolean;
  matching_alerts: boolean;
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: "Vous devez être connecté pour modifier vos préférences",
        data: null,
      };
    }

    // Vérifier si une préférence existe déjà pour cet utilisateur
    const { data: existing, error: checkError } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // Erreur autre que "table n'existe pas"
      return {
        error: checkError.message || "Erreur lors de la vérification des préférences",
        data: null,
      };
    }

    let error;
    if (existing) {
      // Mise à jour si elle existe
      const { error: updateError } = await supabase
        .from("notification_preferences")
        .update({
          preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      error = updateError;
    } else {
      // Insertion si elle n'existe pas
      const { error: insertError } = await supabase
        .from("notification_preferences")
        .insert({
          user_id: user.id,
          preferences,
          updated_at: new Date().toISOString(),
        });
      error = insertError;
    }

    if (error) {
      // Si la table n'existe pas
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        return {
          error: "La fonctionnalité de préférences n'est pas encore disponible. Veuillez réessayer plus tard.",
          data: null,
        };
      }

      return {
        error: error.message || "Erreur lors de la sauvegarde des préférences",
        data: null,
      };
    }

    revalidatePath("/compte/alertes");

    return {
      error: null,
      data: { success: true },
    };
  } catch (error) {
    console.error("Error saving notification preferences:", error);
    return {
      error: "Une erreur inattendue s'est produite",
      data: null,
    };
  }
}

export async function getNotificationPreferences() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: "Vous devez être connecté",
        data: null,
      };
    }

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      // Si la table n'existe pas, retourner les valeurs par défaut
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        return {
          error: null,
          data: {
            new_properties: true,
            property_updates: true,
            price_drops: true,
            matching_alerts: true,
          } as NotificationPreferences,
        };
      }

      return {
        error: error.message || "Erreur lors du chargement des préférences",
        data: null,
      };
    }

    return {
      error: null,
      data: (data?.preferences as NotificationPreferences) || {
        new_properties: true,
        property_updates: true,
        price_drops: true,
        matching_alerts: true,
      },
    };
  } catch (error) {
    console.error("Error loading notification preferences:", error);
    return {
      error: "Une erreur inattendue s'est produite",
      data: null,
    };
  }
}

