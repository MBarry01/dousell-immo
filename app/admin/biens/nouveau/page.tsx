"use client";

import Image from "next/image";
import { useState, DragEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { propertySchema, type PropertyFormValues } from "@/lib/schemas/propertySchema";

const AUTHORIZED_ADMIN_EMAIL = "barrymohamadou98@gmail.com";

const defaultValues: Partial<PropertyFormValues> = {
  title: "",
  description: "",
  price: 0,
  category: "vente",
  type: "appartement",
  city: "",
  district: "",
  address: "",
  landmark: "",
  surface: 120,
  surfaceTotale: undefined,
  rooms: 4,
  bedrooms: 3,
  bathrooms: 2,
  hasGenerator: false,
  hasWaterTank: false,
  security: true,
  pool: false,
  juridique: undefined,
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

export default function NewPropertyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
    trigger,
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues,
  });

  // Watch pour réagir aux changements
  const type = watch("type");
  const category = watch("category");
  const isTerrain = type === "terrain";

  // Check admin access
  useEffect(() => {
    if (!loading && user) {
      if (user.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        toast.error("Accès non autorisé");
        router.push("/compte");
      }
    } else if (!loading && !user) {
      router.push("/login?redirect=/admin/biens/nouveau");
    }
  }, [user, loading, router]);

  if (loading) {
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
    const arr = Array.from(files);
    if (!arr.length) return;
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of arr) {
        const filePath = `${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from("properties")
          .upload(filePath, file, { upsert: true });
        if (error) throw error;
        const {
          data: { publicUrl },
        } = supabase.storage.from("properties").getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }
      setImageUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error(error);
      toast.error("Upload impossible");
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
        terrain: "Appartement", // Valeur par défaut, non utilisée pour terrain
      };

      const payload = {
        title: values.title,
        description: values.description,
        price: values.price,
        category: values.category,
        status: "disponible",
        location: {
          city: values.city,
          district: values.district,
          address: values.address,
          landmark: values.landmark,
          coords: { lat: 0, lng: 0 }, // À améliorer avec géolocalisation
        },
        specs,
        features,
        details: isTerrain
          ? {
              type: "Appartement" as const, // Non utilisé pour terrain
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

      const { error } = await supabase.from("properties").insert([payload]);
      if (error) throw error;
      toast.success("Bien publié !");
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'enregistrer ce bien");
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
          <h1 className="text-3xl font-semibold">Nouveau bien</h1>
        </div>
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
          </div>
          <div>
            <label className="text-sm text-white/70">Description</label>
            <Textarea {...register("description")} className="mt-2" />
            {errors.description && (
              <p className="text-sm text-amber-300">
                {errors.description.message}
              </p>
            )}
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
                    Sélectionnez
                  </option>
                  {quartiers.map((q) => (
                    <option
                      key={q}
                      value={q}
                      className="bg-[#0b0f18] text-white"
                    >
                      {q}
                    </option>
                  ))}
              </select>
              {errors.district && (
                <p className="text-sm text-amber-300">
                  {errors.district.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-white/70">Adresse</label>
              <Input {...register("address")} className="mt-2" />
              {errors.address && (
                <p className="text-sm text-amber-300">
                  {errors.address.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-white/70">Point de repère</label>
              <Input {...register("landmark")} className="mt-2" />
              {errors.landmark && (
                <p className="text-sm text-amber-300">
                  {errors.landmark.message}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Section Caractéristiques - Conditionnelle selon le type */}
        {!isTerrain ? (
          <section className="space-y-4 transition-all duration-300">
            <h2 className="text-xl font-semibold">Caractéristiques</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm text-white/70">Surface habitable (m²)</label>
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
                    checked={(watch(feature.key as keyof PropertyFormValues) as boolean) ?? false}
                    onCheckedChange={(checked) =>
                      setValue(feature.key as keyof PropertyFormValues, checked)
                    }
                  />
                </label>
              ))}
            </div>
          </section>
        ) : (
          <section className="space-y-4 transition-all duration-300">
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
                  <p className="text-sm text-amber-300">
                    {errors.juridique.message}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            {isTerrain ? "Photos du site" : "Photos"}
          </h2>
          <div
            className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-white/70"
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
          >
            <p>Glisse-dépose tes images ici ou</p>
            <div className="mt-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    event.target.files && handleUpload(event.target.files)
                  }
                />
                Choisir des fichiers
              </label>
            </div>
            {uploading && <p className="mt-2 text-sm">Upload en cours...</p>}
            {imageUrls.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {imageUrls.map((url) => (
                  <div
                    key={url}
                    className="relative h-24 w-24 overflow-hidden rounded-xl"
                  >
                    <Image
                      src={url}
                      alt="preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <Button
          type="button"
          onClick={async () => {
            const isValid = await trigger();
            if (!isValid) {
              return;
            }
            const values = getValues();
            await onSubmit(values);
          }}
          className="w-full rounded-full bg-white text-black"
          disabled={uploading}
        >
          Publier le bien
        </Button>
      </div>
    </div>
  );
}
