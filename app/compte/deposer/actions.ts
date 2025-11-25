"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyAdmin } from "@/lib/notifications";
import { sendEmail, getAdminEmail } from "@/lib/mail";
import { ListingSubmittedEmail } from "@/emails/listing-submitted-email";

type SubmitListingData = {
  type: string;
  title: string;
  description: string;
  price: number;
  category: "vente" | "location";
  city: string;
  district: string;
  address: string;
  landmark: string;
  surface?: number;
  surfaceTotale?: number;
  juridique?: "titre-foncier" | "bail" | "deliberation" | "nicad";
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  service_type: "mandat_confort" | "boost_visibilite";
  payment_ref?: string;
  images: string[];
};

export async function submitUserListing(data: SubmitListingData) {
  try {
    console.log("📥 submitUserListing appelé avec:", {
      title: data.title,
      type: data.type,
      price: data.price,
      imagesCount: data.images?.length || 0,
      serviceType: data.service_type,
    });

    const supabase = await createClient();

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("❌ Erreur lors de la récupération de l'utilisateur:", userError);
      return { error: "Erreur d'authentification. Veuillez vous reconnecter." };
    }

    if (!user) {
      console.error("❌ Utilisateur non connecté");
      return { error: "Vous devez être connecté pour déposer une annonce" };
    }

    console.log("✅ Utilisateur récupéré:", { userId: user.id, email: user.email });

    // Déterminer le statut selon le service et le paiement
    let validationStatus: "pending" | "payment_pending" | "approved" | "rejected" =
      "pending";

    if (data.service_type === "boost_visibilite") {
      if (data.payment_ref) {
        // Vérifier si c'est un token PayDunya valide (format alphanumérique, généralement 40+ caractères)
        // Les tokens PayDunya sont des chaînes alphanumériques longues, pas des ID manuels courts
        const isPayDunyaToken = data.payment_ref.length >= 32 && /^[a-zA-Z0-9-]+$/.test(data.payment_ref);
        
        if (isPayDunyaToken) {
          // Token PayDunya valide - marquer comme vérifié (sera confirmé par webhook)
          validationStatus = "approved";
        } else {
          // ID de paiement manuel (Wave/OM) - nécessite vérification manuelle
          validationStatus = "payment_pending";
        }
      } else {
        return { error: "La référence de paiement est requise pour cette offre" };
      }
    }

    // Déterminer si c'est un terrain
    const isTerrain = data.type === "terrain";

    // Préparer les specs selon le type
    const specs = isTerrain
      ? {
          surface: data.surfaceTotale ?? 0,
          rooms: 0,
          bedrooms: 0,
          bathrooms: 0,
          dpe: "B" as const,
        }
      : {
          surface: data.surface ?? 0,
          rooms: data.rooms ?? 0,
          bedrooms: data.bedrooms ?? 0,
          bathrooms: data.bathrooms ?? 0,
          dpe: "B" as const,
        };

    // Mapper le type pour details
    const typeMap: Record<string, "Appartement" | "Maison" | "Studio"> = {
      villa: "Maison",
      appartement: "Appartement",
      immeuble: "Appartement",
      terrain: "Appartement",
    };

    const payload = {
    title: data.title,
    description: data.description,
    price: data.price,
    category: data.category,
    status: "disponible",
    owner_id: user.id,
    is_agency_listing: false,
    validation_status: validationStatus,
    service_type: data.service_type,
    payment_ref: data.payment_ref || null,
    location: {
      city: data.city,
      district: data.district,
      address: data.address,
      landmark: data.landmark,
      coords: { lat: 0, lng: 0 },
    },
      specs,
      features: {},
      details: isTerrain
        ? {
            type: "Appartement" as const, // Non utilisé pour terrain
            year: new Date().getFullYear(),
            heating: "",
            juridique: data.juridique,
          }
        : {
            type: typeMap[data.type] ?? "Appartement",
            year: new Date().getFullYear(),
            heating: "Climatisation",
          },
      images: data.images,
      views_count: 0,
    };

    console.log("📤 Tentative d'insertion dans Supabase...", {
      payloadKeys: Object.keys(payload),
      imagesCount: payload.images?.length || 0,
    });

    const { data: insertedProperty, error } = await supabase
      .from("properties")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("❌ Erreur lors de l'insertion dans Supabase:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      
      // Messages d'erreur plus explicites
      let errorMessage = "Erreur lors de l'enregistrement de l'annonce";
      if (error.message.includes("permission denied") || error.code === "42501") {
        errorMessage = "Vous n'avez pas la permission d'effectuer cette action. Vérifiez votre connexion.";
      } else if (error.message.includes("violates") || error.code === "23505") {
        errorMessage = "Cette annonce existe déjà ou contient des données invalides.";
      } else if (error.message) {
        errorMessage = `Erreur : ${error.message}`;
      }
      
      return { error: errorMessage };
    }

    if (!insertedProperty) {
      console.error("❌ Aucune propriété retournée après insertion");
      return { error: "L'annonce n'a pas pu être enregistrée. Veuillez réessayer." };
    }

    console.log("✅ Propriété insérée avec succès:", { propertyId: insertedProperty.id });

    // Créer une notification pour tous les admins et modérateurs
    const serviceLabel =
      data.service_type === "mandat_confort"
        ? "Mandat Agence (Gratuit)"
        : "Diffusion Simple (Payant)";

    console.log("📬 Tentative d'envoi de notification aux modérateurs/admins...");
    
    // Notifier tous les modérateurs et admins
    const { notifyModeratorsAndAdmins } = await import("@/lib/notifications-helpers");
    const notificationResult = await notifyModeratorsAndAdmins({
      type: "info",
      title: "Nouvelle annonce en attente",
      message: `${user.email} a déposé "${data.title}" (${data.price.toLocaleString("fr-SN")} FCFA) - ${serviceLabel}`,
      resourcePath: insertedProperty?.id ? `/admin/moderation?property=${insertedProperty.id}` : "/admin/moderation",
    });

    if (!notificationResult.success) {
      console.error("❌ Erreur lors de la création des notifications:", notificationResult.errors);
    } else {
      console.log(`✅ ${notificationResult.notified} notifications créées avec succès`);
    }

    // Envoyer un email à l'admin (même si la notification échoue)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dousell-immo.app";
    const adminUrl = `${baseUrl}/admin/moderation`;
    const adminEmail = getAdminEmail();
    
    console.log("📧 Tentative d'envoi d'email à l'admin:", adminEmail);
    const emailResult = await sendEmail({
      to: adminEmail,
      subject: `Nouvelle annonce en attente : ${data.title}`,
      user_id: user.id,
      react: ListingSubmittedEmail({
        propertyTitle: data.title,
        propertyPrice: data.price,
        ownerEmail: user.email || "Email non disponible",
        serviceType: serviceLabel,
        adminUrl,
      }),
    });

    if (emailResult.error) {
      console.error("❌ Erreur lors de l'envoi de l'email admin:", emailResult.error);
    } else {
      console.log("✅ Email admin envoyé avec succès");
    }

    revalidatePath("/compte/mes-biens");
    revalidatePath("/admin/moderation");

    console.log("✅ submitUserListing terminé avec succès");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur inattendue dans submitUserListing:", error);
    const errorMessage = error instanceof Error ? error.message : "Une erreur inattendue est survenue";
    return { error: `Erreur lors du dépôt de l'annonce : ${errorMessage}` };
  }
}

