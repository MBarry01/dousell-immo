"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail, getAdminNotificationEmails, getAdminEmail } from "@/lib/mail";
import { ListingSubmittedEmail } from "@/emails/listing-submitted-email";
import { getBaseUrl } from "@/lib/utils";

type SubmitListingData = {
  type: string;
  title: string;
  description: string;
  price: number;
  category: "vente" | "location";
  city: string;
  district: string;
  address: string;
  landmark?: string;
  surface?: number;
  surfaceTotale?: number;
  juridique?: "titre-foncier" | "bail" | "deliberation" | "nicad" | string;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  service_type: "mandat_confort" | "boost_visibilite";
  payment_ref?: string;
  contact_phone?: string;
  images: string[];
  location?: {
    city: string;
    district: string;
    address: string;
    landmark?: string;
    coords: {
      lat: number;
      lng: number;
    };
  };
  proof_document_url?: string;
};

export async function submitUserListing(data: SubmitListingData) {
  try {
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
        validationStatus = "payment_pending";
      } else {
        console.error("❌ Pas de référence de paiement pour boost_visibilite");
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
      contact_phone: data.contact_phone || null, // Numéro de contact spécifique à l'annonce
      location: data.location || {
        city: data.city,
        district: data.district,
        address: data.address,
        landmark: data.landmark || "",
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
      proof_document_url: data.proof_document_url || null,
      verification_status: data.proof_document_url ? "pending" : "pending", // Si document, on peut mettre un statut spécifique
    };

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

    // Créer une notification pour tous les admins et modérateurs
    const serviceLabel =
      data.service_type === "mandat_confort"
        ? "Mandat Agence (Gratuit)"
        : "Diffusion Simple (Payant)";

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
    }

    // Envoyer un email à l'admin (même si la notification échoue)
    const baseUrl = getBaseUrl();
    const adminUrl = `${baseUrl}/admin/moderation`;
    const adminEmails = await getAdminNotificationEmails();
    const adminEmail = getAdminEmail(); // utilisé pour fallback logs/notifications

    const emailResult = await sendEmail({
      to: adminEmails.length > 0 ? adminEmails : adminEmail,
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
    }

    revalidatePath("/compte/mes-biens");
    revalidatePath("/admin/moderation");

    return { success: true };
  } catch (error) {
    console.error("❌ Erreur inattendue dans submitUserListing:", error);
    const errorMessage = error instanceof Error ? error.message : "Une erreur inattendue est survenue";
    return { error: `Erreur lors du dépôt de l'annonce : ${errorMessage}` };
  }
}

// ============================================
// GÉNÉRATEUR DE DESCRIPTION IA
// ============================================

type AIDescriptionParams = {
  type: string;
  category: "vente" | "location";
  city: string;
  district?: string;
  price: number;
  surface?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
};

export async function generateAIDescription(params: AIDescriptionParams): Promise<{
  success: boolean;
  description?: string;
  error?: string
}> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      console.error("❌ OPENAI_API_KEY non configurée");
      return {
        success: false,
        error: "La génération IA n'est pas configurée. Veuillez contacter l'administrateur."
      };
    }

    // Construire le prompt
    const categoryLabel = params.category === "vente" ? "à vendre" : "à louer";
    const typeLabel = params.type.charAt(0).toUpperCase() + params.type.slice(1);
    const locationLabel = params.district
      ? `${params.district}, ${params.city}`
      : params.city;

    const specs = [];
    if (params.surface) specs.push(`${params.surface} m²`);
    if (params.rooms) specs.push(`${params.rooms} pièces`);
    if (params.bedrooms) specs.push(`${params.bedrooms} chambre(s)`);
    if (params.bathrooms) specs.push(`${params.bathrooms} salle(s) de bain`);

    const specsText = specs.length > 0 ? specs.join(", ") : "Détails non spécifiés";
    const priceFormatted = params.price.toLocaleString("fr-SN");

    const prompt = `Tu es un expert en immobilier au Sénégal. Génère une description professionnelle, engageante et concise (2-3 paragraphes, max 150 mots) pour une annonce immobilière.

Bien : ${typeLabel} ${categoryLabel}
Localisation : ${locationLabel}
Caractéristiques : ${specsText}
Prix : ${priceFormatted} FCFA${params.category === "location" ? " / mois" : ""}

Règles :
- Ton professionnel mais chaleureux
- Mets en valeur les atouts du bien et du quartier
- Inclus un appel à l'action à la fin
- N'invente pas de caractéristiques non mentionnées
- Écris en français

Génère uniquement la description, sans titre ni en-tête.`;

    // Appeler OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Tu es un rédacteur immobilier professionnel spécialisé au Sénégal." },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Erreur OpenAI:", response.status, errorData);
      return {
        success: false,
        error: "Erreur lors de la génération. Veuillez réessayer."
      };
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim();

    if (!description) {
      return {
        success: false,
        error: "La description générée est vide. Veuillez réessayer."
      };
    }

    console.log("✅ Description IA générée avec succès");
    return { success: true, description };

  } catch (error) {
    console.error("❌ Erreur inattendue dans generateAIDescription:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la génération."
    };
  }
}
