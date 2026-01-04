"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Upload or update user avatar
 */
export async function updateAvatar(formData: FormData) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "Utilisateur non authentifié",
      };
    }

    const file = formData.get("avatar") as File;

    if (!file || file.size === 0) {
      return {
        success: false,
        error: "Aucun fichier sélectionné",
      };
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: "Format de fichier non supporté. Utilisez JPG, PNG ou WebP",
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "Le fichier est trop volumineux. Taille maximale : 5MB",
      };
    }

    // Generate unique file name
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Delete old avatar if exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (profile?.avatar_url) {
      // Extract file path from URL
      const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
      if (oldPath.startsWith("avatars/")) {
        await supabase.storage.from("avatars").remove([oldPath]);
      }
    }

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return {
        success: false,
        error: `Erreur lors de l'upload: ${uploadError.message}`,
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("❌ Profile update error:", updateError);
      return {
        success: false,
        error: `Erreur lors de la mise à jour du profil: ${updateError.message}`,
      };
    }

    // Revalidate paths
    revalidatePath("/compte/parametres");
    revalidatePath("/compte");

    return {
      success: true,
      avatarUrl: publicUrl,
    };
  } catch (error) {
    console.error("❌ updateAvatar error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}

/**
 * Delete user avatar
 */
export async function deleteAvatar() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "Utilisateur non authentifié",
      };
    }

    // Get current avatar
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (!profile?.avatar_url) {
      return {
        success: false,
        error: "Aucun avatar à supprimer",
      };
    }

    // Extract file path from URL
    const filePath = profile.avatar_url.split("/").slice(-2).join("/");

    // Delete from storage
    if (filePath.startsWith("avatars/")) {
      const { error: deleteError } = await supabase.storage
        .from("avatars")
        .remove([filePath]);

      if (deleteError) {
        console.error("❌ Delete error:", deleteError);
      }
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);

    if (updateError) {
      console.error("❌ Profile update error:", updateError);
      return {
        success: false,
        error: `Erreur lors de la mise à jour du profil: ${updateError.message}`,
      };
    }

    // Revalidate paths
    revalidatePath("/compte/parametres");
    revalidatePath("/compte");

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ deleteAvatar error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}
