"use client";

import Image from "next/image";
import { useState, DragEvent, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { propertySchema, type PropertyFormValues } from "@/lib/schemas/propertySchema";
import { getPropertyById } from "@/services/propertyService";

const AUTHORIZED_ADMIN_EMAIL = "barrymohamadou98@gmail.com";

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

const typesBien = [
  { value: "villa", label: "Villa" },
  { value: "appartement", label: "Appartement" },
  { value: "terrain", label: "Terrain" },
  { value: "immeuble", label: "Immeuble / Commercial" },
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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
  });

  // Watch pour réagir aux changements
  const type = watch("type");
  const category = watch("category");
  const isTerrain = type === "terrain";

  // Check admin access
  useEffect(() => {
    if (!authLoading && user) {
      if (user.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        toast.error("Accès non autorisé");
        router.push("/compte");
      }
    } else if (!authLoading && !user) {
      router.push(`/login?redirect=/admin/biens/${propertyId}`);
    }
  }, [user, authLoading, router, propertyId]);

  // Load property data
  useEffect(() => {
    const loadProperty = async () => {
      if (!propertyId || authLoading) return;
      
      try {
        const property = await getPropertyById(propertyId);
        if (!property) {
          toast.error("Bien introuvable");
          router.push("/admin/dashboard");
          return;
        }

        // Pré-remplir le formulaire
        reset({
          title: property.title,
          description: property.description,
          price: property.price,
          category: property.transaction,
          type: property.details.type.toLowerCase() as "villa" | "appartement" | "terrain" | "immeuble",
          city: property.location.city,
          district: property.location.address,
          address: property.location.address,
          landmark: property.location.landmark,
          surface: property.specs.surface,
          surfaceTotale: property.specs.surface,
          rooms: property.specs.rooms,
          bedrooms: property.specs.bedrooms,
          bathrooms: property.specs.bathrooms,
          hasGenerator: property.details.hasBackupGenerator ?? false,
          hasWaterTank: property.details.hasWaterTank ?? false,
          security: property.details.security ?? false,
          pool: false,
          juridique: undefined,
        });

        setImageUrls(property.images ?? []);
        setLoading(false);
      } catch (error) {
        console.error("Error loading property:", error);
        toast.error("Erreur lors du chargement du bien");
        router.push("/admin/dashboard");
      }
    };

    if (user && propertyId) {
      loadProperty();
    }
  }, [propertyId, user, authLoading, reset, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-white/70">Chargement...</div>
      </div>
    );
  }

  if (!user || user.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    return null;
  }

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    await handleUpload(files);
  };

  const handleUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = fileArray.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
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
      toast.success(`${urls.length} image(s) uploadée(s)`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: PropertyFormValues) => {
    try {
      // Préparer les specs selon le type
      const specs = isTerrain
        ? {
            surface: values.surfaceTotale ?? 0,
            rooms: 0,
            bedrooms: 0,
            bathrooms: 0,
            dpe: "B" as const,
          }
        : {
            surface: values.surface ?? 0,
            rooms: values.rooms ?? 0,
            bedrooms: values.bedrooms ?? 0,
            bathrooms: values.bathrooms ?? 0,
            dpe: "B" as const,
          };

      // Préparer les features (masqués pour les terrains)
      const features = isTerrain
        ? {}
        : {
            hasGenerator: values.hasGenerator ?? false,
            hasWaterTank: values.hasWaterTank ?? false,
            security: values.security ?? false,
            pool: values.pool ?? false,
          };

      // Mapper le type pour details
      const typeMap: Record<string, "Appartement" | "Maison" | "Studio"> = {
        villa: "Maison",
        appartement: "Appartement",
        immeuble: "Appartement",
        terrain: "Appartement",
      };

      const payload = {
        title: values.title,
        description: values.description,
        price: values.price,
        category: values.category,
        location: {
          city: values.city,
          district: values.district,
          address: values.address,
          landmark: values.landmark,
          coords: { lat: 0, lng: 0 }, // TODO: Géocodage
        },
        specs,
        features,
        details: isTerrain
          ? {
              type: "Appartement" as const,
              year: new Date().getFullYear(),
              heating: "",
              juridique: values.juridique,
            }
          : {
              type: typeMap[values.type] ?? "Appartement",
              year: new Date().getFullYear(),
              heating: "Climatisation",
            },
        images: imageUrls,
      };

      const { error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", propertyId);

      if (error) throw error;
      toast.success("Bien mis à jour !");
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de mettre à jour ce bien");
    }
  };

  // Label dynamique pour le prix
  const priceLabel =
    category === "location"
      ? "Loyer Mensuel (FCFA)"
      : "Prix de Vente (FCFA)";

  return (
    <div className="space-y-6 py-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Admin
          </p>
          <h1 className="text-3xl font-semibold">Éditer le bien</h1>
        </div>
        <Button variant="secondary" className="rounded-full" asChild>
          <Link href="/admin/dashboard">Retour</Link>
        </Button>
      </div>
      <div
        className="space-y-6 sm:space-y-8 rounded-[32px] border border-white/10 bg-white/5 p-4 sm:p-6"
      >
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Informations principales</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Catégorie en premier */}
            <div>
              <label className="text-sm text-white/70">Catégorie</label>
              <select
                {...register("category")}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                style={{
                  colorScheme: "dark",
                }}
              >
                <option value="vente" className="bg-[#0b0f18] text-white">
                  Vente
                </option>
                <option value="location" className="bg-[#0b0f18] text-white">
                  Location
                </option>
              </select>
            </div>
            <div>
              <label className="text-sm text-white/70">Type de bien</label>
              <select
                {...register("type")}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                style={{
                  colorScheme: "dark",
                }}
              >
                {typesBien.map((t) => (
                  <option
                    key={t.value}
                    value={t.value}
                    className="bg-[#0b0f18] text-white"
                  >
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-sm text-amber-300">{errors.type.message}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-white/70">Titre</label>
              <Input {...register("title")} className="mt-2" />
              {errors.title && (
                <p className="text-sm text-amber-300">{errors.title.message}</p>
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
                <p className="text-sm text-amber-300">{errors.price.message}</p>
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
                <p className="text-sm text-amber-300">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Localisation</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-white/70">Ville</label>
              <Input {...register("city")} className="mt-2" />
              {errors.city && (
                <p className="text-sm text-amber-300">{errors.city.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm text-white/70">Quartier</label>
              <select
                {...register("district")}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                style={{
                  colorScheme: "dark",
                }}
              >
                <option value="" className="bg-[#0b0f18] text-white">
                  Sélectionner
                </option>
                {quartiers.map((q) => (
                  <option key={q} value={q} className="bg-[#0b0f18] text-white">
                    {q}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-white/70">Adresse</label>
              <Input {...register("address")} className="mt-2" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-white/70">Point de repère</label>
              <Input {...register("landmark")} className="mt-2" />
            </div>
          </div>
        </section>

        {!isTerrain && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Caractéristiques</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm text-white/70">Surface (m²)</label>
                <Input
                  type="number"
                  {...register("surface", { valueAsNumber: true })}
                  className="mt-2"
                />
                {errors.surface && (
                  <p className="text-sm text-amber-300">
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
                  <p className="text-sm text-amber-300">
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
                  <p className="text-sm text-amber-300">
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
                  <p className="text-sm text-amber-300">
                    {errors.bathrooms.message}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {isTerrain && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Caractéristiques du terrain</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-white/70">Surface totale (m²)</label>
                <Input
                  type="number"
                  {...register("surfaceTotale", { valueAsNumber: true })}
                  className="mt-2"
                />
                {errors.surfaceTotale && (
                  <p className="text-sm text-amber-300">
                    {errors.surfaceTotale.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-white/70">Situation juridique</label>
                <select
                  {...register("juridique")}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  style={{
                    colorScheme: "dark",
                  }}
                >
                  <option value="" className="bg-[#0b0f18] text-white">
                    Sélectionner
                  </option>
                  {situationsJuridiques.map((s) => (
                    <option
                      key={s.value}
                      value={s.value}
                      className="bg-[#0b0f18] text-white"
                    >
                      {s.label}
                    </option>
                  ))}
                </select>
                {errors.juridique && (
                  <p className="text-sm text-amber-300">
                    {errors.juridique.message}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {!isTerrain && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Équipements Dakar</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="text-sm text-white/70">Groupe électrogène</label>
                <Switch {...register("hasGenerator")} />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="text-sm text-white/70">Réservoir d&apos;eau</label>
                <Switch {...register("hasWaterTank")} />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="text-sm text-white/70">Sécurité</label>
                <Switch {...register("security")} />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="text-sm text-white/70">Piscine</label>
                <Switch {...register("pool")} />
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Photos</h2>
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center"
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
              className="hidden"
              id="image-upload"
              disabled={uploading}
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer text-white/70 hover:text-white"
            >
              {uploading ? (
                "Upload en cours..."
              ) : (
                <>
                  Glissez-déposez des images ou cliquez pour sélectionner
                  <br />
                  <span className="text-xs text-white/50">
                    {imageUrls.length} image(s) sélectionnée(s)
                  </span>
                </>
              )}
            </label>
          </div>
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {imageUrls.map((url, index) => (
                <div key={url} className="relative aspect-square">
                  <Image
                    src={url}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="rounded-xl object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImageUrls((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <Button
          type="button"
          onClick={handleSubmit(onSubmit)}
          className="w-full rounded-full bg-white text-black"
          disabled={uploading}
        >
          Mettre à jour le bien
        </Button>
      </div>
    </div>
  );
}

