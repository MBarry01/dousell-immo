"use client";

import Image from "next/image";
import { useState, DragEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { propertySchema, type PropertyFormValues } from "@/lib/schemas/propertySchema";
import { PropertyCard } from "@/app/(workspace)/compte/mes-biens/PropertyCard";
import type { Property } from "@/types/property";

const AUTHORIZED_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

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
  { value: "studio", label: "Studio" },
  { value: "bureau", label: "Bureau" },
  { value: "magasin", label: "Magasin" },
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
  const [createdProperty, setCreatedProperty] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const triggereMagic = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const onDrop = async (event: DragEvent<HTMLLabelElement>) => {
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
      const typeMap: Record<string, "Appartement" | "Maison" | "Studio" | "Bureau" | "Magasin"> = {
        villa: "Maison",
        appartement: "Appartement",
        immeuble: "Appartement",
        terrain: "Appartement", // Valeur par défaut, non utilisée pour terrain
        studio: "Studio",
        bureau: "Bureau",
        magasin: "Magasin",
      };

      const payload = {
        title: values.title,
        description: values.description,
        price: values.price,
        category: values.category,
        transaction: values.category, // Ajout pour conformité type
        status: "disponible",
        location: {
          city: values.city,
          district: values.district,
          address: values.address,
          landmark: values.landmark,
          coords: { lat: 14.7167, lng: -17.4677 }, // Default Dakar coords
        },
        specs,
        features, // Sera ignoré si pas dans le type, mais utile pour le stockage
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
            ...features, // Spread features into details for compatibility if needed
          },
        images: imageUrls,
        agent: {
          name: "Admin",
          photo: "",
          phone: ""
        },
        disponibilite: "Immédiate"
      };

      const { data, error } = await supabase
        .from("properties")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Construire l'objet complet pour la PropertyCard
      const completeProperty = {
        ...data,
        validation_status: 'approved',
        occupation_status: 'vacant',
        // S'assurer que les champs requis par le type Property sont présents
        transaction: payload.transaction,
        location: payload.location,
        specs: payload.specs,
        details: payload.details,
        images: payload.images,
        agent: payload.agent,
        disponibilite: payload.disponibilite
      };

      setCreatedProperty(completeProperty);
      triggereMagic();

      // Scroll to bottom to see effects
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);

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

  if (createdProperty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] py-10 space-y-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="w-full max-w-md"
        >
          <PropertyCard
            property={createdProperty}
            viewMode="grid"
          />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full animate-pulse" />
            <div className="relative bg-[#FFD700] text-black px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 shadow-[0_0_30px_rgba(255,215,0,0.3)] border border-[#FFD700]/50">
              <SparklesIcon className="w-5 h-5 animate-spin-slow" />
              Magie opérée ✨
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setCreatedProperty(null);
                setImageUrls([]);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
            >
              Nouveau bien
            </Button>
            <Button onClick={() => router.push('/admin/dashboard')}>
              Aller au tableau de bord
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 text-white relative">
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
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none bg-no-repeat bg-right pr-10"
                style={{
                  colorScheme: "dark",
                  backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27rgba(255,255,255,0.4)%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1.5em 1.5em"
                }}
              >
                <option value="vente" className="bg-[#121212] text-white py-2">
                  Vente
                </option>
                <option value="location" className="bg-[#121212] text-white py-2">
                  Location
                </option>
              </select>
            </div>
            <div>
              <label className="text-sm text-white/70">Type de bien</label>
              <select
                {...register("type")}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none bg-no-repeat bg-right pr-10"
                style={{
                  colorScheme: "dark",
                  backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27rgba(255,255,255,0.4)%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1.5em 1.5em"
                }}
              >
                {typesBien.map((t) => (
                  <option
                    key={t.value}
                    value={t.value}
                    className="bg-[#121212] text-white py-2"
                  >
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-sm text-primary">{errors.type.message}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-white/70">Titre</label>
              <Input {...register("title")} className="mt-2" />
              {errors.title && (
                <p className="text-sm text-primary">{errors.title.message}</p>
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
                <p className="text-sm text-primary">{errors.price.message}</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm text-white/70">Description</label>
            <Textarea {...register("description")} className="mt-2" />
            {errors.description && (
              <p className="text-sm text-primary">
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
                <p className="text-sm text-primary">{errors.city.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm text-white/70">Quartier</label>
              <select
                {...register("district")}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none bg-no-repeat bg-right pr-10"
                style={{
                  colorScheme: "dark",
                  backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27rgba(255,255,255,0.4)%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1.5em 1.5em"
                }}
              >
                <option value="" className="bg-[#121212] text-white py-2">
                  Sélectionnez
                </option>
                {quartiers.map((q) => (
                  <option
                    key={q}
                    value={q}
                    className="bg-[#121212] text-white py-2"
                  >
                    {q}
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className="text-sm text-primary">
                  {errors.district.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-white/70">Adresse</label>
              <Input {...register("address")} className="mt-2" />
              {errors.address && (
                <p className="text-sm text-primary">
                  {errors.address.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-white/70">Point de repère</label>
              <Input {...register("landmark")} className="mt-2" />
              {errors.landmark && (
                <p className="text-sm text-primary">
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
                  <p className="text-sm text-primary">
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
                  <p className="text-sm text-primary">
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
                  <p className="text-sm text-primary">
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
                  <p className="text-sm text-primary">
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
                  <p className="text-sm text-primary">
                    {errors.surfaceTotale.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-white/70">Situation juridique</label>
                <select
                  {...register("juridique")}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none bg-no-repeat bg-right pr-10"
                  style={{
                    colorScheme: "dark",
                    backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27rgba(255,255,255,0.4)%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1.5em 1.5em"
                  }}
                >
                  <option value="" className="bg-[#121212] text-white py-2">
                    Sélectionnez
                  </option>
                  {situationsJuridiques.map((sj) => (
                    <option
                      key={sj.value}
                      value={sj.value}
                      className="bg-[#121212] text-white py-2"
                    >
                      {sj.label}
                    </option>
                  ))}
                </select>
                {errors.juridique && (
                  <p className="text-sm text-primary">
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
          <label
            htmlFor="admin-nouveau-photo-upload"
            className="block cursor-pointer rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-white/70"
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
          >
            <p>Glisse-dépose tes images ici ou</p>
            <div className="mt-3">
              <input
                id="admin-nouveau-photo-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  event.target.files && handleUpload(event.target.files)
                }
              />
              <span
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white"
              >
                Choisir des fichiers
              </span>
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
          </label>
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
          className="w-full rounded-full bg-background text-foreground"
          disabled={uploading}
        >
          Publier le bien
        </Button>
      </div>

      {/* Badge Saisie Admin en bas à droite comme sur la maquette */}
      <div className="fixed bottom-6 right-6 pointer-events-none">
        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-white/50 font-medium">
          Saisie Admin
        </div>
      </div>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  )
}
