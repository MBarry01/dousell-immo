"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";
import { propertySchema, type PropertyFormValues } from "@/lib/schemas/propertySchema";
import { updateUserProperty } from "./actions";

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

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      type: "appartement",
      category: "vente",
      juridique: "titre-foncier",
    },
  });

  const type = watch("type");
  const category = watch("category");
  const isTerrain = type === "terrain";

  // Charger les données du bien
  useEffect(() => {
    const loadProperty = async () => {
      if (!user || !propertyId) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .eq("owner_id", user.id)
        .single();

      if (error || !data) {
        toast.error("Bien introuvable ou accès non autorisé");
        router.push("/compte/mes-biens");
        return;
      }

      // Mapper les données Supabase vers le formulaire
      const location = (data.location as { city?: string; district?: string; address?: string; landmark?: string }) || {};
      const specs = (data.specs as { surface?: number; rooms?: number; bedrooms?: number; bathrooms?: number }) || {};
      const features = (data.features as { hasGenerator?: boolean; hasWaterTank?: boolean; security?: boolean; pool?: boolean }) || {};
      const details = (data.details as { type?: string; juridique?: string }) || {};

      // Déterminer le type
      let formType: PropertyFormValues["type"] = "appartement";
      if (details?.type === "Terrain" || data.type === "terrain") {
        formType = "terrain";
      } else if (data.type === "villa" || details?.type === "Maison") {
        formType = "villa";
      } else if (data.type === "immeuble") {
        formType = "immeuble";
      }

      reset({
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category as "vente" | "location",
        type: formType,
        city: location?.city || "",
        district: location?.district || "",
        address: location?.address || "",
        landmark: location?.landmark || "",
        surface: specs?.surface,
        surfaceTotale: specs?.surface, // Pour les terrains
        rooms: specs?.rooms,
        bedrooms: specs?.bedrooms,
        bathrooms: specs?.bathrooms,
        juridique: (details?.juridique as "titre-foncier" | "bail" | "deliberation" | "nicad") || "titre-foncier",
        hasGenerator: features?.hasGenerator || false,
        hasWaterTank: features?.hasWaterTank || false,
        security: features?.security || false,
        pool: features?.pool || false,
      });

      setImageUrls(data.images || []);
      setLoading(false);
    };

    if (user) {
      loadProperty();
    }
  }, [user, propertyId, router, reset]);

  const handleUpload = async (files: File[]) => {
    if (!user) return;

    setUploading(true);
    const supabase = createClient();

    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `properties/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("properties")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("properties").getPublicUrl(filePath);

        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setImageUrls((prev) => [...prev, ...urls]);
      toast.success(`${files.length} photo(s) ajoutée(s)`);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Erreur lors de l'upload des photos");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: PropertyFormValues) => {
    setSubmitting(true);
    try {
      const result = await updateUserProperty(propertyId, {
        ...values,
        images: imageUrls,
      });

      if (result.error) {
        toast.error("Erreur", { description: result.error });
      } else {
        toast.success("Annonce mise à jour avec succès !", {
          description: "Votre annonce est en attente de nouvelle validation.",
        });
        router.push("/compte/mes-biens");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-white/70">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 py-6 text-center">
        <h1 className="text-2xl font-semibold text-white">Connexion requise</h1>
        <Button asChild>
          <a href="/login">Se connecter</a>
        </Button>
      </div>
    );
  }

  const priceLabel =
    category === "location" ? "Loyer Mensuel (FCFA)" : "Prix de Vente (FCFA)";

  return (
    <div className="space-y-6 py-6 text-white">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Édition
          </p>
          <h1 className="text-3xl font-semibold">Modifier mon annonce</h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8 rounded-[32px] border border-white/10 bg-white/5 p-4 sm:p-6"
      >
        {/* Informations principales */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Informations principales</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-white/70">Catégorie</label>
              <select
                {...register("category")}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                style={{ colorScheme: "dark" }}
              >
                <option value="vente">Vente</option>
                <option value="location">Location</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-white/70">Type de bien</label>
              <select
                {...register("type")}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                style={{ colorScheme: "dark" }}
              >
                <option value="appartement">Appartement</option>
                <option value="villa">Villa</option>
                <option value="terrain">Terrain</option>
                <option value="immeuble">Immeuble / Commercial</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-white/70">Titre</label>
              <Input {...register("title")} className="mt-2" />
              {errors.title && (
                <p className="mt-1 text-sm text-amber-300">{errors.title.message}</p>
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
                <p className="mt-1 text-sm text-amber-300">{errors.price.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-white/70">Description</label>
              <Textarea
                {...register("description")}
                className="mt-2 min-h-[120px]"
                rows={5}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-amber-300">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Localisation */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Localisation</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-white/70">Ville</label>
              <Input {...register("city")} className="mt-2" />
              {errors.city && (
                <p className="mt-1 text-sm text-amber-300">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-white/70">Quartier</label>
              <select
                {...register("district")}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                style={{ colorScheme: "dark" }}
              >
                <option value="">Sélectionnez</option>
                {quartiers.map((q) => (
                  <option key={q} value={q} className="bg-[#0b0f18] text-white">
                    {q}
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className="mt-1 text-sm text-amber-300">{errors.district.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-white/70">Adresse</label>
              <Input {...register("address")} className="mt-2" />
              {errors.address && (
                <p className="mt-1 text-sm text-amber-300">{errors.address.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-white/70">Point de repère <span className="text-white/40">(optionnel)</span></label>
              <Input {...register("landmark")} className="mt-2" />
              {errors.landmark && (
                <p className="mt-1 text-sm text-amber-300">{errors.landmark.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* Caractéristiques conditionnelles */}
        {!isTerrain && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Caractéristiques</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Surface (m²)", key: "surface" },
                { label: "Pièces", key: "rooms" },
                { label: "Chambres", key: "bedrooms" },
                { label: "Salles de bain", key: "bathrooms" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-sm text-white/70">{field.label}</label>
                  <Input
                    type="number"
                    {...register(field.key as keyof PropertyFormValues, {
                      valueAsNumber: true,
                    })}
                    className="mt-2"
                  />
                  {errors[field.key as keyof PropertyFormValues] && (
                    <p className="mt-1 text-sm text-amber-300">
                      {errors[field.key as keyof PropertyFormValues]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Groupe électrogène", key: "hasGenerator" },
                { label: "Réservoir eau", key: "hasWaterTank" },
                { label: "Gardiennage 24/7", key: "security" },
                { label: "Piscine", key: "pool" },
              ].map((feature) => (
                <label
                  key={feature.key}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                >
                  {feature.label}
                  <Switch
                    checked={watch(feature.key as keyof PropertyFormValues) as boolean}
                    onCheckedChange={(checked) =>
                      setValue(feature.key as keyof PropertyFormValues, checked)
                    }
                  />
                </label>
              ))}
            </div>
          </section>
        )}

        {/* Terrain spécifique */}
        {isTerrain && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Informations Terrain</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-white/70">Surface Totale (m²)</label>
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
              <div>
                <label className="text-sm text-white/70">Situation Juridique</label>
                <select
                  {...register("juridique")}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                  style={{ colorScheme: "dark" }}
                >
                  {situationsJuridiques.map((sj) => (
                    <option key={sj.value} value={sj.value} className="bg-[#0b0f18] text-white">
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
            </div>
          </section>
        )}

        {/* Photos */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            {isTerrain ? "Photos du site" : "Photos"}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
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
                  onClick={() => removeImage(index)}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 transition-colors hover:border-white/40 hover:bg-white/10">
              <Upload className="mb-2 h-8 w-8 text-white/60" />
              <span className="text-xs text-white/60">Ajouter</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    handleUpload(files);
                  }
                }}
                disabled={uploading}
              />
            </label>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            className="rounded-full"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-white text-black hover:bg-white/90"
          >
            {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </div>
  );
}

