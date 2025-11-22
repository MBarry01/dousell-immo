"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Home, Building2, Mountain, Store, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { submitUserListing } from "@/app/compte/deposer/actions";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

// Schéma simplifié pour les particuliers avec validation conditionnelle
const depositSchema = z
  .object({
    // Step 1: Le Bien
    type: z.enum(["villa", "appartement", "terrain", "immeuble"]),
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
    description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
    price: z.number().min(0, "Le prix doit être positif"),
    category: z.enum(["vente", "location"]),
    city: z.string().min(1, "La ville est requise"),
    district: z.string().min(1, "Le quartier est requis"),
    address: z.string().min(3, "L'adresse est requise"),
    landmark: z.string().min(3, "Le point de repère est requis"),
    
    // Champs conditionnels pour les terrains
    surface: z.number().min(10, "La surface doit être d'au moins 10 m²").optional(),
    surfaceTotale: z.number().min(10, "La surface totale doit être d'au moins 10 m²").optional(),
    juridique: z.enum(["titre-foncier", "bail", "deliberation", "nicad"]).optional(),
    
    // Champs conditionnels pour les biens construits
    rooms: z.number().min(1).optional(),
    bedrooms: z.number().min(0).optional(),
    bathrooms: z.number().min(0).optional(),
    
    // Step 2: L'Offre
    service_type: z.enum(["mandat_confort", "boost_visibilite"]),
    
    // Step 3: Paiement (si boost_visibilite)
    payment_ref: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isTerrain = data.type === "terrain";
    
    if (isTerrain) {
      // Pour les terrains : surface totale et juridique requis
      if (!data.surfaceTotale || data.surfaceTotale < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La surface totale est requise pour un terrain",
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
      // Pour les autres types : surface, rooms, bedrooms, bathrooms requis
      if (!data.surface || data.surface < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La surface habitable est requise",
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

type DepositFormValues = z.infer<typeof depositSchema>;

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

export default function DeposerPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    watch,
    getValues,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    mode: "onChange",
    defaultValues: {
      type: "appartement",
      category: "vente",
      service_type: "mandat_confort",
    },
  });

  const serviceType = watch("service_type");
  const category = watch("category");
  const type = watch("type");
  const isTerrain = type === "terrain";
  const needsPayment = serviceType === "boost_visibilite";

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
        // Générer un nom de fichier unique
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;

        // Upload vers Supabase Storage
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

        // Obtenir l'URL publique
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

  const onSubmit = async (values: DepositFormValues) => {
    console.log("🔄 Début de onSubmit...", { 
      step, 
      values: { ...values, images: imageUrls.length }, 
      imageUrlsCount: imageUrls.length,
      needsPayment 
    });

    // Validation : au moins une image est requise
    if (imageUrls.length === 0) {
      console.error("❌ Aucune image");
      toast.error("Au moins une photo est requise", {
        description: "Veuillez ajouter au moins une photo de votre bien.",
      });
      setSubmitting(false);
      return;
    }

    // Validation : si Diffusion Simple, payment_ref est requis
    if (needsPayment && !values.payment_ref?.trim()) {
      console.error("❌ Référence de paiement manquante");
      toast.error("Référence de paiement requise", {
        description: "Veuillez entrer votre ID de transaction Wave/OM.",
      });
      setSubmitting(false);
      return;
    }

    // Validation : s'assurer qu'on est à l'étape 3
    if (step !== 3) {
      console.error("❌ Pas à l'étape 3:", step);
      toast.error("Formulaire incomplet", {
        description: "Veuillez compléter toutes les étapes du formulaire.",
      });
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    try {
      console.log("📤 Envoi des données à submitUserListing...", {
        title: values.title,
        type: values.type,
        price: values.price,
        imagesCount: imageUrls.length,
        serviceType: values.service_type,
      });
      
      const result = await submitUserListing({
        ...values,
        images: imageUrls,
      });

      console.log("📥 Réponse reçue de submitUserListing:", result);

      if (result?.error) {
        console.error("❌ Erreur lors de la soumission:", result.error);
        toast.error("Erreur lors du dépôt", {
          description: result.error || "Une erreur est survenue. Veuillez réessayer.",
          duration: 6000,
        });
      } else if (result?.success) {
        console.log("✅ Annonce déposée avec succès !");
        toast.success("Annonce déposée avec succès !", {
          description: needsPayment
            ? "Votre annonce est en attente de validation après vérification du paiement."
            : "Votre annonce est en attente de validation par notre équipe.",
          duration: 5000,
        });
        // Petit délai pour voir le toast avant la redirection
        setTimeout(() => {
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
      console.error("❌ Détails de l'erreur:", {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast.error("Erreur lors du dépôt de l'annonce", {
        description: errorMessage,
        duration: 6000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handler pour le bouton submit (évite les problèmes de sérialisation dans Next.js 16)
  const handleSubmitClick = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      console.log("🔄 Début de handleSubmitClick...", { step, imageUrlsCount: imageUrls.length });
      
      // Valider tous les champs du formulaire
      const isValid = await trigger();
      console.log("✅ Validation du formulaire:", { isValid, errors: Object.keys(errors) });
      
      if (!isValid) {
        console.error("❌ Formulaire invalide:", errors);
        toast.error("Veuillez corriger les erreurs du formulaire", {
          description: Object.values(errors).map(e => e?.message).filter(Boolean).join(", ") || "Certains champs sont manquants ou invalides",
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
      console.log("📋 Valeurs du formulaire:", { ...values, images: imageUrls.length });
      
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
        // Valider les champs de l'étape 1
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
        // Valider l'offre
        fieldsToValidate = ["service_type"];
      }
      
      const isValidStep = await trigger(fieldsToValidate);
      
      if (isValidStep) {
        setStep(step + 1);
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
    }
  };

  const priceLabel =
    category === "location"
      ? "Loyer Mensuel (FCFA)"
      : "Prix de Vente (FCFA)";

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-32 text-white">
      {/* Spacer pour le header fixed */}
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
              className={`h-2 rounded-full ${
                s <= step ? "bg-amber-500" : "bg-white/10"
              }`}
            />
          </div>
        ))}
      </div>

      <form
        className="rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 3) {
            handleSubmitClick();
          }
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
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                    style={{ colorScheme: "dark" }}
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
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                    style={{ colorScheme: "dark" }}
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
                  <Input {...register("title")} className="mt-2" />
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
                    className="mt-2"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-amber-300">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-white/70">Ville</label>
                  <Input {...register("city")} className="mt-2" />
                  {errors.city && (
                    <p className="mt-1 text-sm text-amber-300">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-white/70">Quartier</label>
                  <select
                    {...register("district")}
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="" className="bg-[#0b0f18] text-white">
                      Sélectionnez
                    </option>
                    {quartiers.map((q) => (
                      <option key={q} value={q} className="bg-[#0b0f18] text-white">
                        {q}
                      </option>
                    ))}
                  </select>
                  {errors.district && (
                    <p className="mt-1 text-sm text-amber-300">
                      {errors.district.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm text-white/70">Adresse</label>
                  <Input {...register("address")} className="mt-2" />
                  {errors.address && (
                    <p className="mt-1 text-sm text-amber-300">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm text-white/70">Point de repère</label>
                  <Input {...register("landmark")} className="mt-2" />
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
                        className="mt-2"
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
                        className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                        style={{ colorScheme: "dark" }}
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
                        className="mt-2"
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
                        className="mt-2"
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
                        className="mt-2"
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
                        className="mt-2"
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
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 ${
                      uploading ? "opacity-50 cursor-not-allowed" : ""
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
                  className={`rounded-2xl border-2 p-6 text-left transition-all ${
                    serviceType === "mandat_confort"
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        Mandat Agence
                      </h3>
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
                  className={`rounded-2xl border-2 p-6 text-left transition-all ${
                    serviceType === "boost_visibilite"
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        Diffusion Simple
                      </h3>
                      <p className="mt-2 text-sm text-white/70">
                        Vous gérez vos visites. Votre annonce visible 30 jours.
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-2xl font-bold text-amber-400">
                          5 000 FCFA
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

          {/* Step 3: Paiement */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold">3. Paiement</h2>

              {needsPayment ? (
                <>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                    <p className="text-sm text-white/70 mb-4">
                      Scannez le QR Code ou envoyez 5 000 FCFA à ce numéro Wave/OM
                    </p>
                    <div className="mx-auto mb-4 h-48 w-48 rounded-xl bg-white/10 flex items-center justify-center">
                      <span className="text-white/40">QR Code</span>
                    </div>
                    <p className="text-lg font-semibold text-white mb-2">
                      +221 77 123 45 67
                    </p>
                    <p className="text-sm text-white/60">
                      (Dousell Immo)
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-white/70">
                      Entrez votre ID de transaction Wave/OM
                    </label>
                    <Input
                      {...register("payment_ref")}
                      placeholder="Ex: WAVE123456789"
                      className="mt-2"
                    />
                    {errors.payment_ref && (
                      <p className="mt-1 text-sm text-amber-300">
                        {errors.payment_ref.message}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 text-center">
                  <Check className="mx-auto h-12 w-12 text-amber-400" />
                  <p className="mt-4 text-lg font-semibold text-white">
                    Offre gratuite sélectionnée
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    Votre annonce sera vérifiée par notre équipe avant publication
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
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
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
          )}
        </div>
      </form>
    </div>
  );
}

