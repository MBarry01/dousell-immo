"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Home, Building2, Mountain, Store, X } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { AddressInputWithMap } from "@/components/forms/address-input-with-map";
import { AdCertificationUpload } from "@/components/dashboard/ad-certification-upload";
import { useAuth } from "@/hooks/use-auth";
import { submitUserListing } from "@/app/compte/deposer/actions";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

// Schéma de validation complet
const depositSchema = z
  .object({
    type: z.enum(["villa", "appartement", "terrain", "immeuble"]),
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
    description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
    price: z.number().min(0, "Le prix doit être positif"),
    category: z.enum(["vente", "location"]),
    city: z.string().min(1, "La région est requise"),
    district: z.string().min(1, "Le quartier est requis"),
    address: z.string().min(3, "L'adresse est requise"),
    landmark: z.string().min(3, "Le point de repère est requis"),

    surface: z.preprocess(
      (val) => (typeof val === "number" && isNaN(val) ? undefined : val),
      z.number().optional()
    ),
    surfaceTotale: z.preprocess(
      (val) => (typeof val === "number" && isNaN(val) ? undefined : val),
      z.number().optional()
    ),
    juridique: z.string().optional().refine(
      (val) => !val || val === "" || ["titre-foncier", "bail", "deliberation", "nicad"].includes(val),
      { message: "Situation juridique invalide" }
    ),
    rooms: z.preprocess(
      (val) => (typeof val === "number" && isNaN(val) ? undefined : val),
      z.number().optional()
    ),
    bedrooms: z.preprocess(
      (val) => (typeof val === "number" && isNaN(val) ? undefined : val),
      z.number().optional()
    ),
    bathrooms: z.preprocess(
      (val) => (typeof val === "number" && isNaN(val) ? undefined : val),
      z.number().optional()
    ),

    service_type: z.enum(["mandat_confort", "boost_visibilite"]),
    payment_ref: z.string().optional(),
    contact_phone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isTerrain = data.type === "terrain";

    if (isTerrain) {
      if (!data.surfaceTotale || data.surfaceTotale < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La surface totale est requise (min 10 m²)",
          path: ["surfaceTotale"],
        });
      }
      if (!data.juridique) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La situation juridique est requise pour un terrain",
          path: ["juridique"],
        });
      }
    } else {
      if (!data.surface || data.surface < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La surface habitable est requise (min 10 m²)",
          path: ["surface"],
        });
      }
      if (!data.rooms || data.rooms < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le nombre de pièces est requis",
          path: ["rooms"],
        });
      }
      // Bedrooms et bathrooms peuvent être 0 (studio)
      if (data.bedrooms === undefined || data.bedrooms < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le nombre de chambres est requis",
          path: ["bedrooms"],
        });
      }
      if (data.bathrooms === undefined || data.bathrooms < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le nombre de salles de bain est requis",
          path: ["bathrooms"],
        });
      }
    }
  });


import { smartGeocode } from "@/lib/geocoding";

type DepositFormValues = {
  type: "villa" | "appartement" | "terrain" | "immeuble";
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
  juridique?: string;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  service_type: "mandat_confort" | "boost_visibilite";
  payment_ref?: string;
  contact_phone?: string;
};

const quartiers = [
  "Almadies",
  "Plateau",
  "Mermoz",
  "Yoff",
  "Ngor",
  "Ouakam",
  "Sacré-Cœur",
  "Les Mamelles",
];

const situationsJuridiques = [
  { value: "titre-foncier", label: "Titre Foncier" },
  { value: "bail", label: "Bail" },
  { value: "deliberation", label: "Délibération" },
  { value: "nicad", label: "Nicad" },
];

const typesBien = [
  { value: "villa", label: "Villa", icon: Home },
  { value: "appartement", label: "Appartement", icon: Building2 },
  { value: "terrain", label: "Terrain", icon: Mountain },
  { value: "immeuble", label: "Immeuble / Commercial", icon: Store },
];

function DeposerPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const [step, setStep] = useState(1);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [services, setServices] = useState<{ code: string; name: string; price: number; description: string }[]>([]);

  // Charger les services depuis la base de données
  useEffect(() => {
    const fetchServices = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("services").select("*");
      if (error) {
        console.error("Erreur chargement services:", error);
        toast.error("Impossible de charger les offres");
      } else if (data) {
        setServices(data);
      }
    };
    fetchServices();
  }, []);

  // Coordonnées sélectionnées manuellement sur la carte
  const [manualCoordinates, setManualCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // États Paiement - FLUX STRICT
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [paymentVerification, setPaymentVerification] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  // État persistant pour éviter le flash du formulaire pendant la soumission
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

  const {
    register,
    watch,
    getValues,
    setValue,
    trigger,
    control,
    formState: { errors },
  } = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema) as any,
    mode: "onChange",
    defaultValues: {
      type: "appartement",
      category: "vente",
      service_type: "mandat_confort",
      title: "",
      description: "",
      price: 0,
      city: "",
      district: "",
      address: "",
      landmark: "",
      surface: undefined,
      surfaceTotale: undefined,
      rooms: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      juridique: "",
    },
  });

  // Pré-remplir le téléphone avec celui du profil utilisateur (une fois que user est chargé)
  useEffect(() => {
    if (user?.user_metadata?.phone && !getValues("contact_phone")) {
      // Seulement si le champ est vide (pas de données sauvegardées)
      setValue("contact_phone", user.user_metadata.phone);
    }
  }, [user, setValue, getValues]);

  const serviceType = watch("service_type");
  const category = watch("category");
  const type = watch("type");
  const isTerrain = type === "terrain";
  const needsPayment = serviceType === "boost_visibilite";

  // Scroll vers le haut à chaque changement d'étape
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [step]);

  // Restaurer les données du formulaire (formulaire en cours, pas de gestion de paiement ici)
  // Ce useEffect ne gère PAS le retour après paiement (c'est le rôle du useEffect suivant)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Vérifier si on revient d'un paiement (paramètre URL)
    // Si oui, on laisse le useEffect suivant gérer TOUT (étape + données)
    const paymentStatus = searchParams?.get("payment");
    if (paymentStatus === "success" || paymentStatus === "canceled") {
      // Le useEffect suivant va gérer le retour après paiement
      // On ne fait rien ici pour éviter les conflits
      return;
    }

    // NOUVEAU FORMULAIRE ou REPRISE : Restaurer les données mais pas l'étape si nouveau formulaire
    const storedFormData = localStorage.getItem("deposit_form_data");
    const storedImages = localStorage.getItem("deposit_form_images");
    const storedStep = localStorage.getItem("deposit_form_step");

    // Restaurer les valeurs du formulaire sauvegardées (si on reprend un formulaire en cours)
    if (storedFormData) {
      try {
        const formData = JSON.parse(storedFormData);
        Object.keys(formData).forEach((key) => {
          if (formData[key] !== undefined && formData[key] !== null) {
            setValue(key as keyof DepositFormValues, formData[key]);
          }
        });
      } catch (error) {
        console.error("Erreur lors de la restauration des données du formulaire:", error);
      }
    }

    // Restaurer les images
    if (storedImages) {
      try {
        const images = JSON.parse(storedImages);
        if (Array.isArray(images)) {
          setImageUrls(images);
        }
      } catch (error) {
        console.error("Erreur lors de la restauration des images:", error);
      }
    }

    // Si on a un paiement déjà vérifié (refresh de page après paiement confirmé)
    // On restaure l'état mais on laisse l'étape être gérée par le useEffect suivant
    const storedToken = localStorage.getItem("paydunya_payment_token");
    const verified = localStorage.getItem("paydunya_payment_verified");
    if (storedToken && verified === "true") {
      setPaymentToken(storedToken);
      setPaymentVerification("success");
      setIsPaymentConfirmed(true);
      // L'étape sera gérée par le useEffect suivant si payment=success est dans l'URL
      // Sinon, on restaure l'étape sauvegardée
      if (!paymentStatus && storedStep) {
        const stepNum = parseInt(storedStep, 10);
        if (stepNum >= 1 && stepNum <= 3) {
          setStep(stepNum);
        }
      }
    } else if (!paymentStatus) {
      // NOUVEAU FORMULAIRE : Toujours commencer à l'étape 1
      setStep(1);
    }
  }, [setValue, searchParams]);

  // Sauvegarder l'étape dans localStorage à chaque changement
  useEffect(() => {
    if (typeof window !== "undefined" && step >= 1 && step <= 3) {
      localStorage.setItem("deposit_form_step", step.toString());
    }
  }, [step]);

  // Sauvegarder les valeurs du formulaire dans localStorage à chaque changement de valeur
  useEffect(() => {
    if (typeof window === "undefined") return;

    const subscription = watch((value) => {
      try {
        localStorage.setItem("deposit_form_data", JSON.stringify(value));
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des données du formulaire:", error);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  // Sauvegarder les images dans localStorage à chaque changement
  useEffect(() => {
    if (typeof window !== "undefined" && imageUrls.length > 0) {
      try {
        localStorage.setItem("deposit_form_images", JSON.stringify(imageUrls));
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des images:", error);
      }
    }
  }, [imageUrls]);

  // --- LOGIQUE DE RETOUR PAIEMENT (FLUX STRICT : PAS D'AUTO-SUBMIT) ---
  // Ce useEffect est le SEUL responsable de gérer le retour après paiement
  useEffect(() => {
    const paymentStatus = searchParams?.get("payment");
    if (!paymentStatus) return;

    const clearPaymentQuery = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("payment");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    if (paymentStatus === "success") {
      if (typeof window === "undefined") {
        clearPaymentQuery();
        return;
      }

      // ÉTAPE CRITIQUE : FORCER L'ÉTAPE 3 IMMÉDIATEMENT et restaurer les données
      // Cela doit être fait AVANT toute autre logique pour éviter les conflits
      setStep(3);
      localStorage.setItem("deposit_form_step", "3");

      // Restaurer les données du formulaire immédiatement
      const storedFormData = localStorage.getItem("deposit_form_data");
      const storedImages = localStorage.getItem("deposit_form_images");

      if (storedFormData) {
        try {
          const formData = JSON.parse(storedFormData);
          Object.keys(formData).forEach((key) => {
            if (formData[key] !== undefined && formData[key] !== null) {
              setValue(key as keyof DepositFormValues, formData[key]);
            }
          });
        } catch (error) {
          console.error("Erreur lors de la restauration des données:", error);
        }
      }

      if (storedImages) {
        try {
          const images = JSON.parse(storedImages);
          if (Array.isArray(images)) {
            setImageUrls(images);
          }
        } catch (error) {
          console.error("Erreur lors de la restauration des images:", error);
        }
      }

      const token = localStorage.getItem("paydunya_payment_token");
      if (!token) {
        setPaymentVerification("error");
        setPaymentMessage("Impossible de vérifier le paiement. Merci de réessayer.");
        toast.error("Paiement introuvable", {
          description: "Veuillez relancer la procédure de paiement.",
        });
        clearPaymentQuery();
        return;
      }

      setPaymentVerification("checking");
      setPaymentMessage("Vérification du paiement en cours...");

      const verifyPayment = async () => {
        try {
          const res = await fetch(`/api/paydunya/confirm?token=${token}`);
          const data = await res.json();

          if (!res.ok || !data?.success) {
            console.error("❌ Erreur de vérification:", data);
            throw new Error(data?.error || "Vérification impossible");
          }

          // Accepter plusieurs statuts de confirmation
          const isPaymentCompleted =
            data.status === "completed" ||
            data.isCompleted ||
            data.status === "paid" ||
            (data.response?.response_code === "00");

          if (isPaymentCompleted) {
            localStorage.setItem("paydunya_payment_verified", "true");
            setPaymentToken(token);
            setPaymentVerification("success");
            setIsPaymentConfirmed(true);
            setPaymentMessage(null);
            // FORCER L'ÉTAPE 3 une dernière fois pour être sûr (après vérification)
            setStep(3);
            localStorage.setItem("deposit_form_step", "3");
            toast.success("Paiement confirmé ✅", {
              description: "Veuillez cliquer sur 'Confirmer le dépôt' pour terminer.",
            });
          } else {
            console.error("❌ Statut de paiement non confirmé:", data);
            throw new Error(`Paiement non confirmé. Statut: ${data.status || "inconnu"}`);
          }
        } catch (error) {
          console.error("❌ Vérification PayDunya échouée:", error);
          setPaymentVerification("error");
          setPaymentToken(null);
          setIsPaymentConfirmed(false);
          setPaymentMessage("Le paiement n'a pas été confirmé. Merci de réessayer.");
          localStorage.removeItem("paydunya_payment_token");
          localStorage.removeItem("paydunya_payment_verified");
          toast.error("Paiement non confirmé", {
            description: error instanceof Error ? error.message : undefined,
          });
        } finally {
          // Ne pas supprimer le paramètre payment immédiatement
          // On le garde pour éviter que le premier useEffect ne remette l'étape à 1
          // On le supprimera après un court délai pour permettre à l'utilisateur de voir le succès
          setTimeout(() => {
            clearPaymentQuery();
          }, 2000);
        }
      };

      void verifyPayment();
    } else if (paymentStatus === "canceled") {
      if (typeof window !== "undefined") {
        localStorage.removeItem("paydunya_payment_token");
        localStorage.removeItem("paydunya_payment_verified");
      }
      setPaymentToken(null);
      setPaymentVerification("idle");
      setIsPaymentConfirmed(false);
      setPaymentMessage("Paiement annulé. Vous pouvez réessayer.");
      // Rester à l'étape 3 pour permettre de réessayer le paiement
      setStep(3);
      localStorage.setItem("deposit_form_step", "3");
      toast.error("Paiement annulé", {
        description: "Vous pouvez relancer le paiement quand vous êtes prêt.",
      });
      clearPaymentQuery();
    }
  }, [pathname, router, searchParams, setValue]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-white/70">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 py-6 text-center">
        <h1 className="text-2xl font-semibold text-white">
          Connexion requise
        </h1>
        <p className="text-white/70">
          Vous devez être connecté pour déposer une annonce
        </p>
        <Button asChild>
          <Link href="/login">Se connecter</Link>
        </Button>
      </div>
    );
  }

  const handleImageUpload = async (files: FileList) => {
    if (!user) {
      toast.error("Vous devez être connecté pour uploader des images");
      return;
    }

    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];

      for (const file of fileArray) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from("properties")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("properties").getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setImageUrls((prev) => [...prev, ...uploadedUrls]);
      toast.success(`${fileArray.length} photo(s) ajoutée(s) avec succès`);
    } catch (error) {
      console.error("Error uploading images:", error);
      const errorMessage = error instanceof Error ? error.message : "Veuillez réessayer";
      toast.error("Erreur lors de l'upload des photos", {
        description: errorMessage,
      });
    } finally {
      setUploading(false);
    }
  };

  // --- SOUMISSION FINALE (APPELÉE UNIQUEMENT PAR CLIC MANUEL) ---
  const onSubmit = async (values: DepositFormValues) => {
    // PROTECTION STRICTE : Vérifier qu'on est bien à l'étape 3 EN PREMIER
    if (step !== 3) {
      console.error("❌ BLOCAGE : Pas à l'étape 3, step actuel:", step);
      toast.error("Formulaire incomplet", {
        description: `Vous devez compléter toutes les étapes. Étape actuelle: ${step}/3`,
      });
      setSubmitting(false);
      return;
    }

    // Validation : vérifier que les champs essentiels sont remplis
    if (!values.title || values.title.trim().length < 3) {
      console.error("❌ BLOCAGE : Titre manquant ou invalide");
      toast.error("Formulaire incomplet", {
        description: "Le titre de l'annonce est requis.",
      });
      setSubmitting(false);
      return;
    }

    // Validation : au moins une image est requise
    if (imageUrls.length === 0) {
      console.error("❌ BLOCAGE : Aucune image");
      toast.error("Au moins une photo est requise", {
        description: "Veuillez ajouter au moins une photo de votre bien.",
      });
      setSubmitting(false);
      return;
    }

    // Validation : si Diffusion Simple, un token de paiement PayDunya est requis
    if (
      needsPayment &&
      (!isPaymentConfirmed && (!paymentToken || paymentVerification !== "success")) &&
      !values.payment_ref?.trim()
    ) {
      console.error("❌ BLOCAGE : Paiement non effectué");
      toast.error("Paiement requis", {
        description: "Veuillez effectuer le paiement avant de finaliser votre annonce.",
      });
      setSubmitting(false);
      return;
    }

    setSubmitting(true);

    // GÉOCODAGE INTELLIGENT (Triangulation) - GARANTIT toujours un résultat
    let coordinates = { lat: 0, lng: 0 };

    // PRIORITÉ 1: Coordonnées sélectionnées manuellement sur la carte
    if (manualCoordinates && manualCoordinates.lat !== 0 && manualCoordinates.lng !== 0) {
      coordinates = manualCoordinates;
      console.log("✅ Coordonnées utilisées (sélection manuelle sur carte):", coordinates);
    } else {
      // PRIORITÉ 2: Géocodage automatique via smartGeocode
      try {
        // smartGeocode utilise une stratégie multi-niveaux et garantit toujours un résultat
        coordinates = await smartGeocode(
          values.address,
          values.district,
          values.city
        );
        console.log("✅ Coordonnées trouvées (smartGeocode):", coordinates);
      } catch (geoError) {
        console.error("Erreur lors du géocodage:", geoError);
        // En cas d'erreur inattendue, utiliser les coordonnées par défaut (Dakar)
        coordinates = { lat: 14.7167, lng: -17.4677 };
        console.warn("⚠️ Utilisation des coordonnées par défaut (Dakar)");
      }
    }

    try {
      const result = await submitUserListing({
        ...values,
        images: imageUrls,
        payment_ref: paymentToken || values.payment_ref,
        // Ajout des coordonnées géographiques
        // Note: Il faudra peut-être adapter submitUserListing pour accepter coords séparément
        // ou l'inclure dans location si la structure le permet
        location: {
          address: values.address,
          city: values.city,
          district: values.district,
          landmark: values.landmark,
          coords: coordinates
        }
      });

      if (result?.error) {
        console.error("❌ Erreur lors de la soumission:", result.error);
        toast.error("Erreur lors du dépôt", {
          description: result.error || "Une erreur est survenue. Veuillez réessayer.",
          duration: 6000,
        });
      } else if (result?.success) {
        toast.success("Annonce déposée avec succès !", {
          description: needsPayment
            ? "Votre annonce est en attente de validation après vérification du paiement."
            : "Votre annonce est en attente de validation par notre équipe.",
          duration: 5000,
        });
        // Petit délai pour voir le toast avant la redirection
        // NE PAS réinitialiser les états de paiement avant la redirection pour éviter le flash du formulaire
        setTimeout(() => {
          // Nettoyer le token PayDunya, l'étape ET les données du formulaire AVANT la redirection
          localStorage.removeItem("paydunya_payment_token");
          localStorage.removeItem("paydunya_payment_verified");
          localStorage.removeItem("deposit_form_step");
          localStorage.removeItem("deposit_form_data");
          localStorage.removeItem("deposit_form_images");
          // Réinitialiser les états juste avant la redirection pour éviter le flash
          setPaymentToken(null);
          setPaymentVerification("idle");
          setIsPaymentConfirmed(false); // Réinitialiser aussi l'état de confirmation
          router.push("/compte/mes-biens");
          router.refresh();
        }, 1500);
      } else {
        console.error("❌ Réponse inattendue:", result);
        toast.error("Erreur inattendue", {
          description: "La réponse du serveur est invalide. Veuillez réessayer.",
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors du dépôt:", error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur inattendue est survenue";
      toast.error("Erreur lors du dépôt de l'annonce", {
        description: errorMessage,
        duration: 6000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handler pour le bouton submit
  const handleSubmitClick = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();

    try {
      // Valider tous les champs du formulaire
      const isValid = await trigger();
      const currentValues = getValues();

      if (!isValid) {
        console.error("❌ Formulaire invalide. Erreurs détaillées:", errors);
        console.error("❌ Valeurs actuelles:", currentValues);

        // Afficher les erreurs spécifiques
        const errorMessages = Object.entries(errors)
          .map(([field, error]) => `${field}: ${error?.message}`)
          .filter(Boolean)
          .join(", ");

        toast.error("Veuillez corriger les erreurs du formulaire", {
          description: errorMessages || "Certains champs sont manquants ou invalides. Vérifiez que vous avez bien rempli toutes les étapes du formulaire.",
        });
        return;
      }

      // Vérifier qu'on est à l'étape 3
      if (step !== 3) {
        console.error("❌ Pas à l'étape 3:", step);
        toast.error("Formulaire incomplet", {
          description: "Veuillez compléter toutes les étapes du formulaire.",
        });
        return;
      }

      // Vérifier qu'il y a au moins une image
      if (imageUrls.length === 0) {
        console.error("❌ Aucune image");
        toast.error("Au moins une photo est requise", {
          description: "Veuillez ajouter au moins une photo de votre bien.",
        });
        return;
      }

      // Récupérer les valeurs validées
      const values = getValues();

      // Appeler onSubmit avec les valeurs
      await onSubmit(values);
    } catch (error) {
      console.error("❌ Erreur lors de la validation du formulaire:", error);
      toast.error("Erreur lors de la validation", {
        description: error instanceof Error ? error.message : "Une erreur est survenue",
      });
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (step < 3) {
      // Valider les champs de l'étape actuelle avant de passer à la suivante
      let fieldsToValidate: (keyof DepositFormValues)[] = [];

      if (step === 1) {
        fieldsToValidate = [
          "type",
          "title",
          "description",
          "price",
          "category",
          "city",
          "district",
          "address",
          "landmark",
        ];

        if (isTerrain) {
          fieldsToValidate.push("surfaceTotale", "juridique");
        } else {
          fieldsToValidate.push("surface", "rooms", "bedrooms", "bathrooms");
        }
      } else if (step === 2) {
        fieldsToValidate = ["service_type"];
      }

      const isValidStep = await trigger(fieldsToValidate);

      if (isValidStep) {
        // Sauvegarder les valeurs actuelles avant de changer d'étape
        const currentValues = getValues();
        localStorage.setItem("deposit_form_data", JSON.stringify(currentValues));

        setStep(step + 1);
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      } else {
        toast.error("Veuillez remplir tous les champs requis", {
          description: "Certains champs sont manquants ou invalides.",
        });
      }
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  };

  const priceLabel =
    category === "location"
      ? "Loyer Mensuel (FCFA)"
      : "Prix de Vente (FCFA)";

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-32 text-white">
      <div className="h-16 md:hidden" />

      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/compte">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Espace Propriétaire
          </p>
          <h1 className="text-3xl font-semibold">Déposer une annonce</h1>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1">
            <div
              className={`h-2 rounded-full ${s <= step ? "bg-amber-500" : "bg-white/10"
                }`}
            />
          </div>
        ))}
      </div>

      <form
        className="rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6 mt-6"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <AnimatePresence mode="wait">
          {/* Step 1: Le Bien */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold">1. Informations du bien</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-white/70">Type de bien</label>
                  <select
                    {...register("type")}
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-[16px] text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                    style={{ colorScheme: "dark", fontSize: "16px" }}
                  >
                    {typesBien.map((t) => (
                      <option key={t.value} value={t.value} className="bg-[#0b0f18] text-white">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-white/70">Catégorie</label>
                  <select
                    {...register("category")}
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-[16px] text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                    style={{ colorScheme: "dark", fontSize: "16px" }}
                  >
                    <option value="vente" className="bg-[#0b0f18] text-white">
                      Vente
                    </option>
                    <option value="location" className="bg-[#0b0f18] text-white">
                      Location
                    </option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm text-white/70">Titre</label>
                  <Input {...register("title")} className="mt-2 text-[16px]" />
                  {errors.title && (
                    <p className="mt-1 text-sm text-amber-300">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm text-white/70">{priceLabel}</label>
                  <Input
                    type="number"
                    {...register("price", { valueAsNumber: true })}
                    className="mt-2 text-[16px]"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-amber-300">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-white/70">Région</label>
                  <Input {...register("city")} className="mt-2 text-base" />
                  {errors.city && (
                    <p className="mt-1 text-sm text-amber-300">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-white/70">Quartier (ville)</label>
                  <Input {...register("district")} className="mt-2 text-base" />
                  {errors.district && (
                    <p className="mt-1 text-sm text-amber-300">
                      {errors.district.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm text-white/70">Adresse</label>
                  <AddressInputWithMap
                    register={register("address")}
                    error={errors.address?.message}
                    setValue={setValue}
                    currentAddress={watch("address")}
                    city={watch("city")}
                    district={watch("district")}
                    onLocationSelect={(lat, lng) => {
                      setManualCoordinates({ lat, lng });
                      console.log("📍 Coordonnées sélectionnées manuellement:", { lat, lng });
                    }}
                    onAddressFound={(details) => {
                      if (details.city) {
                        setValue("city", details.city, { shouldValidate: true });
                      }
                      if (details.district) {
                        setValue("district", details.district, { shouldValidate: true });
                      }
                    }}
                    className="mt-2"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm text-white/70">Point de repère</label>
                  <Input {...register("landmark")} className="mt-2 text-[16px]" />
                  {errors.landmark && (
                    <p className="mt-1 text-sm text-amber-300">
                      {errors.landmark.message}
                    </p>
                  )}
                </div>

                {/* Champs conditionnels selon le type */}
                {isTerrain ? (
                  <>
                    <div className="sm:col-span-2">
                      <label className="text-sm text-white/70">Surface totale (m²)</label>
                      <Input
                        type="number"
                        {...register("surfaceTotale", { valueAsNumber: true })}
                        className="mt-2 text-[16px]"
                      />
                      {errors.surfaceTotale && (
                        <p className="mt-1 text-sm text-amber-300">
                          {errors.surfaceTotale.message}
                        </p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm text-white/70">Situation juridique</label>
                      <select
                        {...register("juridique")}
                        className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-[16px] text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                        style={{ colorScheme: "dark", fontSize: "16px" }}
                      >
                        <option value="" className="bg-[#0b0f18] text-white">
                          Sélectionnez
                        </option>
                        {situationsJuridiques.map((sj) => (
                          <option
                            key={sj.value}
                            value={sj.value}
                            className="bg-[#0b0f18] text-white"
                          >
                            {sj.label}
                          </option>
                        ))}
                      </select>
                      {errors.juridique && (
                        <p className="mt-1 text-sm text-amber-300">
                          {errors.juridique.message}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm text-white/70">Surface habitable (m²)</label>
                      <Input
                        type="number"
                        {...register("surface", { valueAsNumber: true })}
                        className="mt-2 text-[16px]"
                      />
                      {errors.surface && (
                        <p className="mt-1 text-sm text-amber-300">
                          {errors.surface.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-white/70">Pièces</label>
                      <Input
                        type="number"
                        {...register("rooms", { valueAsNumber: true })}
                        className="mt-2 text-[16px]"
                      />
                      {errors.rooms && (
                        <p className="mt-1 text-sm text-amber-300">
                          {errors.rooms.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-white/70">Chambres</label>
                      <Input
                        type="number"
                        {...register("bedrooms", { valueAsNumber: true })}
                        className="mt-2 text-[16px]"
                      />
                      {errors.bedrooms && (
                        <p className="mt-1 text-sm text-amber-300">
                          {errors.bedrooms.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-white/70">Salles de bain</label>
                      <Input
                        type="number"
                        {...register("bathrooms", { valueAsNumber: true })}
                        className="mt-2 text-[16px]"
                      />
                      {errors.bathrooms && (
                        <p className="mt-1 text-sm text-amber-300">
                          {errors.bathrooms.message}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="text-sm text-white/70">Description</label>
                <Textarea
                  {...register("description")}
                  className="mt-2 min-h-[120px]"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-amber-300">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm text-white/70">Photos</label>
                <div className="mt-2 rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="photo-upload"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    disabled={uploading}
                  />
                  <label
                    htmlFor="photo-upload"
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 ${uploading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                  >
                    {uploading ? "Upload en cours..." : "Choisir des photos"}
                  </label>
                  {imageUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square overflow-hidden rounded-xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Photo ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== index))}
                            className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {imageUrls.length === 0 && (
                    <p className="mt-2 text-xs text-white/50">
                      Au moins une photo est requise
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: L'Offre */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold">2. Choisissez votre offre</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setValue("service_type", "mandat_confort")}
                  className={`rounded-2xl border-2 p-6 text-left transition-all ${serviceType === "mandat_confort"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">
                          Mandat Agence
                        </h3>
                        <InfoTooltip content="L'option sérénité. Doussel Immo s'occupe de tout : photos professionnelles, visites, rédaction du bail/vente. Vous ne payez rien maintenant. Une commission sera prélevée uniquement si nous trouvons un preneur." />
                      </div>
                      <p className="mt-2 text-sm text-white/70">
                        On s&apos;occupe de tout. Commission au succès.
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-2xl font-bold text-amber-400">
                          Gratuit
                        </span>
                      </div>
                    </div>
                    {serviceType === "mandat_confort" && (
                      <Check className="h-6 w-6 text-amber-400" />
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("service_type", "boost_visibilite")}
                  className={`rounded-2xl border-2 p-6 text-left transition-all ${serviceType === "boost_visibilite"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">
                          Diffusion Simple
                        </h3>
                        <InfoTooltip content="L'option autonomie. Vous payez pour afficher votre annonce sur notre site pendant 30 jours. Vous gérez vous-même les appels et les visites. Idéal si vous voulez garder le contrôle total." />
                      </div>
                      <p className="mt-2 text-sm text-white/70">
                        Vous gérez vos visites. Votre annonce visible 30 jours.
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-2xl font-bold text-amber-400">
                          {services.find(s => s.code === "boost_visibilite")?.price.toLocaleString("fr-SN") || "1 500"} FCFA
                        </span>
                      </div>
                    </div>
                    {serviceType === "boost_visibilite" && (
                      <Check className="h-6 w-6 text-amber-400" />
                    )}
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Paiement & Confirmation */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold">3. Finalisation</h2>

              {/* Champ téléphone de contact */}
              <div>
                <label className="text-sm text-white/70">
                  Votre numéro de téléphone (pour vous contacter)
                </label>
                <Controller
                  name="contact_phone"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <PhoneInput
                      {...field}
                      value={value || undefined}
                      onChange={(val) => onChange(val || "")}
                      defaultCountry="SN"
                      international
                      className="mt-2"
                    />
                  )}
                />
                {errors.contact_phone && (
                  <p className="mt-1 text-sm text-amber-300">
                    {errors.contact_phone.message}
                  </p>
                )}
              </div>

              {/* CERTIFICATION ANNONCE (NOUVEAU) */}
              <AdCertificationUpload className="mb-6" />

              {/* LOGIQUE PAIEMENT - FLUX STRICT */}
              {needsPayment ? (
                <>
                  {/* On affiche le succès SI le paiement est confirmé (état persistant pour éviter le flash) */}
                  {(isPaymentConfirmed || (paymentToken && paymentVerification === "success")) ? (
                    // CAS 1 : PAIEMENT RÉUSSI -> CARTE VERTE + BOUTON CONFIRMER
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center animate-in fade-in zoom-in duration-500">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                          <Check className="h-8 w-8 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          Paiement validé ✅
                        </h3>
                        <p className="mt-2 text-white/70">
                          Nous avons bien reçu votre paiement de 1 500 FCFA.
                        </p>
                      </div>

                      {/* LE BOUTON FINAL - ACTION MANUELLE OBLIGATOIRE */}
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSubmitClick(e);
                        }}
                        disabled={submitting}
                        className="w-full h-14 text-lg font-semibold rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {submitting ? (
                          <>
                            <svg
                              className="mr-2 h-5 w-5 animate-spin"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Finalisation en cours...
                          </>
                        ) : (
                          "Confirmer le dépôt de l'annonce"
                        )}
                      </Button>
                    </div>
                  ) : (
                    // CAS 2 : PAS ENCORE PAYÉ -> BOUTON PAYER
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                      <p className="text-sm text-white/70 mb-4">
                        Paiement sécurisé via PayDunya
                      </p>
                      <p className="text-lg font-semibold text-white mb-2">
                        {services.find(s => s.code === "boost_visibilite")?.price.toLocaleString("fr-SN") || "1 500"} FCFA
                      </p>
                      <p className="text-sm text-white/60 mb-4">
                        Accepte Wave, Orange Money et Free Money
                      </p>
                      <Button
                        type="button"
                        onClick={async () => {
                          try {
                            setSubmitting(true);
                            const values = getValues();

                            // Créer la facture PayDunya
                            const response = await fetch("/api/paydunya/create-invoice", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                serviceType: "boost_visibilite", // On envoie le CODE du service, pas le montant
                                description: `Diffusion Simple - ${values.title}`,
                                propertyId: null,
                                returnUrl: `${window.location.origin}/compte/deposer?payment=success`,
                                cancelUrl: `${window.location.origin}/compte/deposer?payment=canceled`,
                              }),
                            });

                            const data = await response.json();

                            if (!response.ok || !data.success) {
                              throw new Error(data.error || "Erreur lors de la création du paiement");
                            }

                            // Stocker le token avant la redirection
                            if (data.token) {
                              localStorage.removeItem("paydunya_payment_verified");
                              localStorage.setItem("paydunya_payment_token", data.token);
                              setPaymentToken(null);
                              setPaymentVerification("idle");
                              setIsPaymentConfirmed(false); // Réinitialiser l'état de confirmation avant redirection
                              setPaymentMessage(null);
                            }

                            // Rediriger vers PayDunya
                            window.location.href = data.checkout_url;
                          } catch (error) {
                            console.error("Erreur PayDunya:", error);
                            toast.error("Erreur lors de la création du paiement", {
                              description: error instanceof Error ? error.message : "Veuillez réessayer",
                            });
                            setSubmitting(false);
                          }
                        }}
                        disabled={submitting}
                        className="w-full h-12 rounded-xl bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50"
                      >
                        {submitting ? "Redirection..." : "Payer avec PayDunya"}
                      </Button>

                      {paymentVerification === "checking" && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/70">
                          Vérification du paiement en cours...
                        </div>
                      )}
                      {paymentMessage && paymentVerification === "error" && (
                        <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-center text-sm text-amber-200">
                          {paymentMessage}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                // CAS GRATUIT (Mandat)
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 text-center">
                  <Check className="mx-auto h-12 w-12 text-amber-400" />
                  <p className="mt-4 text-lg font-semibold text-white">
                    Offre gratuite sélectionnée
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    Votre annonce sera vérifiée par notre équipe avant publication
                  </p>

                  {/* Bouton pour les annonces gratuites */}
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSubmitClick(e);
                    }}
                    disabled={submitting}
                    className="mt-6 w-full h-12 rounded-xl bg-white text-black hover:bg-gray-100 disabled:opacity-50"
                  >
                    {submitting ? "Envoi..." : "Confirmer le dépôt"}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons - CACHÉ À L'ÉTAPE 3 SI PAIEMENT REQUIS */}
        <div className="mt-8 flex justify-between gap-4">
          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handlePrev}
              className="h-12 rounded-full text-base"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              type="button"
              size="lg"
              onClick={handleNext}
              className="h-12 rounded-full bg-white text-black text-base"
            >
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : !needsPayment ? (
            // Bouton visible uniquement pour les annonces GRATUITES à l'étape 3
            // (Pour les payantes, le bouton est dans le bloc de paiement)
            <Button
              type="button"
              size="lg"
              onClick={(e) => {
                e.preventDefault();
                handleSubmitClick(e);
              }}
              disabled={submitting || uploading}
              className="h-12 rounded-full bg-white text-black text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg
                    className="mr-2 h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                "Confirmer le dépôt"
              )}
            </Button>
          ) : null}
        </div>
      </form>
    </div >
  );
}

export default function DeposerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div></div>}>
      <DeposerPageContent />
    </Suspense>
  );
}
