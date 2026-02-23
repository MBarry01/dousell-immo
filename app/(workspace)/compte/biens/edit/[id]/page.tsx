"use client";

import { useEffect, useState, useTransition } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { propertySchema, type PropertyFormValues } from "@/lib/schemas/propertySchema";
import { updateUserProperty } from "./actions";
import { Controller } from "react-hook-form";

const _quartiers = [
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
  const [submitting, startTransition] = useTransition();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
    control,
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      type: "appartement",
      category: "vente",
      juridique: "titre-foncier",
      contact_phone: "",
      virtual_tour_url: "",
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

      const specs = data.specs || {};
      const features = data.features || {};
      const details = data.details || {};
      const location = data.location || {};

      let formType: PropertyFormValues["type"] = "appartement";
      const dbType = String(data.type || data.property_type || "").toLowerCase();

      if (dbType.includes("terrain") || details.type === "Terrain") {
        formType = "terrain";
      } else if (dbType.includes("villa") || dbType.includes("maison") || details.type === "Maison") {
        formType = "villa";
      } else if (dbType.includes("immeuble") || dbType.includes("commercial")) {
        formType = "immeuble";
      } else if (dbType.includes("studio") || details.type === "Studio") {
        formType = "studio";
      } else if (dbType.includes("bureau") || details.type === "Bureau") {
        formType = "bureau";
      }

      const defaultJuridique = formType === "terrain" ? "titre-foncier" : undefined;

      reset({
        title: data.title || "",
        description: data.description || "",
        price: data.price || 0,
        category: (data.category as "vente" | "location") || "vente",
        type: formType,
        city: location.city || "",
        district: location.district || "",
        address: location.address || "",
        landmark: location.landmark || "",
        // Force number fields to undefined if 0/null, or parse them to avoid NaN
        surface: formType !== "terrain" ? (specs.surface ? Number(specs.surface) : undefined) : undefined,
        surfaceTotale: formType === "terrain" ? (specs.surface ? Number(specs.surface) : undefined) : undefined,
        rooms: formType !== "terrain" ? (specs.rooms ? Number(specs.rooms) : undefined) : undefined,
        bedrooms: formType !== "terrain" ? (specs.bedrooms !== undefined ? Number(specs.bedrooms) : undefined) : undefined,
        bathrooms: formType !== "terrain" ? (specs.bathrooms !== undefined ? Number(specs.bathrooms) : undefined) : undefined,
        juridique: details.juridique || defaultJuridique,

        hasGenerator: Boolean(features.hasGenerator),
        hasWaterTank: Boolean(features.hasWaterTank),
        security: Boolean(features.security),
        pool: Boolean(features.pool),

        contact_phone: data.contact_phone || "",
        virtual_tour_url: data.virtual_tour_url || "",
      });

      setImageUrls(data.images || []);
      setLoading(false);
    };

    loadProperty();
  }, [user, propertyId, router, reset]);

  const handleUpload = async (files: File[]) => {
    if (!user) return;

    setUploading(true);
    const supabase = createClient();

    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `properties/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("properties")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("properties").getPublicUrl(filePath);
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
    startTransition(async () => {
      try {
        const result = await updateUserProperty(propertyId, {
          ...values,
          images: imageUrls,
        });

        if (result.error) {
          toast.error("Erreur", { description: result.error });
        } else {
          toast.success("Bien mis à jour avec succès !", {
            description: "Vos modifications ont été enregistrées.",
          });
          router.push("/compte/mes-biens");
          router.refresh();
        }
      } catch (error) {
        console.error(error);
        toast.error("Erreur lors de la mise à jour");
      }
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 py-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Connexion requise</h1>
        <Button asChild>
          <a href="/login">Se connecter</a>
        </Button>
      </div>
    );
  }

  const priceLabel =
    category === "location" ? "Loyer Mensuel (FCFA)" : "Prix de Vente (FCFA)";

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 text-foreground">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full hover:-translate-y-1 hover:shadow-md transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Édition
          </p>
          <h1 className="text-3xl font-semibold">Modifier mon bien</h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm"
      >
        {/* Informations principales */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">
            Informations principales
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Catégorie</label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12 rounded-lg border-border bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all">
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vente">Vente</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Type de bien</label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12 rounded-lg border-border bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all">
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appartement">Appartement</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="terrain">Terrain</SelectItem>
                      <SelectItem value="immeuble">Immeuble / Commercial</SelectItem>
                      <SelectItem value="bureau">Bureau</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Titre</label>
              <Input
                {...register("title")}
                className="h-12 rounded-lg border-border bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                placeholder="Ex: Superbe Villa aux Almadies"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{priceLabel}</label>
              <div className="relative">
                <Input
                  type="number"
                  {...register("price", { valueAsNumber: true })}
                  className="h-12 rounded-lg border-border bg-background pl-4 pr-16 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground/60">
                  FCFA
                </span>
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <Textarea
                {...register("description")}
                className="mt-2 min-h-[120px] rounded-lg border-border bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                rows={5}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-destructive">
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
              <label className="text-sm font-medium text-muted-foreground">Ville</label>
              <Input {...register("city")} className="mt-2 h-12 rounded-lg border-border bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all" />
              {errors.city && (
                <p className="mt-1 text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Quartier</label>
              <Input {...register("district")} className="mt-2 h-12 rounded-lg border-border bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all" placeholder="Ex: Mbour 1, Quartier Som" />
              {errors.district && (
                <p className="mt-1 text-sm text-destructive">{errors.district.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Adresse</label>
              <Input {...register("address")} className="mt-2 h-12 rounded-lg border-border bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all" />
              {errors.address && (
                <p className="mt-1 text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Point de repère <span className="text-muted-foreground/60">(optionnel)</span></label>
              <Input {...register("landmark")} className="mt-2 h-12 rounded-lg border-border bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all" />
              {errors.landmark && (
                <p className="mt-1 text-sm text-destructive">{errors.landmark.message}</p>
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
                  <label className="text-sm font-medium text-muted-foreground">{field.label}</label>
                  <Input
                    type="number"
                    {...register(field.key as keyof PropertyFormValues, {
                      valueAsNumber: true,
                    })}
                    className="mt-2 h-12 rounded-lg border-border bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                  {errors[field.key as keyof PropertyFormValues] && (
                    <p className="mt-1 text-sm text-destructive">
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
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-all duration-200"
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
          <section className="space-y-6">
            <h2 className="text-xl font-semibold">Informations Terrain</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Surface Totale (m²)</label>
                <Input
                  type="number"
                  {...register("surfaceTotale", { valueAsNumber: true })}
                  className="h-12 rounded-lg border-border bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
                {errors.surfaceTotale && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.surfaceTotale.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Situation Juridique</label>
                <Controller
                  name="juridique"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-12 rounded-lg border-border bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all">
                        <SelectValue placeholder="Choisir une situation" />
                      </SelectTrigger>
                      <SelectContent>
                        {situationsJuridiques.map((sj) => (
                          <SelectItem key={sj.value} value={sj.value}>
                            {sj.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.juridique && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.juridique.message}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Contact et Multimédia */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">
            Contact & Multimédia
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Téléphone de contact (optionnel)</label>
              <Controller
                name="contact_phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value as any}
                    onChange={field.onChange}
                    defaultCountry="SN"
                    className="h-12 border-border"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">URL Visite Virtuelle (optionnel)</label>
              <Input
                {...register("virtual_tour_url")}
                placeholder="Lien YouTube, Matterport..."
                className="h-12 rounded-lg border-border bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
              {errors.virtual_tour_url && (
                <p className="mt-1 text-sm text-destructive">{errors.virtual_tour_url.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* Photos */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            {isTerrain ? "Photos du site" : "Photos"}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label
              htmlFor="compte-edit-photo-upload"
              className="relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background transition-colors hover:border-muted-foreground/30 hover:bg-muted/50"
            >
              <Upload className="mb-2 h-8 w-8 text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground">Ajouter</span>
              <input
                id="compte-edit-photo-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    handleUpload(files);
                  }
                  e.target.value = '';
                }}
                disabled={uploading}
              />
            </label>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="rounded-full hover:-translate-y-1 hover:shadow-md transition-all duration-200"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-primary text-primary-foreground hover:-translate-y-1 hover:shadow-md transition-all duration-200"
          >
            {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </div>
  );
}

