"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Ruler,
  Image as ImageIcon,
  FileText,
  Loader2,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { OwnerSelector } from "@/components/gestion/OwnerSelector";
import { createClient } from "@/utils/supabase/client";
import { updateTeamProperty, togglePropertyPublication, generateSEODescription } from "../actions";

type Property = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: "vente" | "location";
  status: string;
  validation_status: string;
  images: string[];
  location: {
    city: string;
    district?: string;
    region?: string;
    address?: string;
    landmark?: string;
    coords?: { lat: number; lng: number };
  };
  specs: {
    surface: number;
    rooms: number;
    bedrooms: number;
    bathrooms: number;
  };
  details: {
    type: string;
  };
  virtual_tour_url?: string;
  owner?: {
    id?: string;
    full_name?: string;
    phone?: string;
    email?: string;
  };
};

type EditBienClientProps = {
  teamId: string;
  teamName: string;
  property: Property;
};

export function EditBienClient({ teamId, teamName, property }: EditBienClientProps) {
  const _router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingPublication, setIsTogglingPublication] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    location: false,
    specs: false,
    description: false,
    images: false,
  });

  // Reconstruire l'adresse complète depuis les champs existants
  const initialAddress = property.location.address ||
    [property.location.district, property.location.city].filter(Boolean).join(", ");

  const [formData, setFormData] = useState({
    title: property.title,
    description: property.description || "",
    price: property.price.toString(),
    address: initialAddress,
    surface: property.specs.surface?.toString() || "",
    rooms: property.specs.rooms?.toString() || "",
    bedrooms: property.specs.bedrooms?.toString() || "",
    bathrooms: property.specs.bathrooms?.toString() || "",
    virtual_tour_url: property.virtual_tour_url || "",
    images: property.images,
    owner_id: property.owner?.id,
    lat: property.location.coords?.lat ?? null,
    lon: property.location.coords?.lng ?? null,
    city: property.location.city || "",
    district: property.location.district || "",
    region: property.location.region || "",
  });

  const [isPublished, setIsPublished] = useState(property.validation_status === "approved");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFiles = async (fileArray: File[]) => {
    if (formData.images.length + fileArray.length > 20) {
      setError("Maximum 20 photos autorisées");
      return;
    }

    setUploadingImages(true);
    setError(null);

    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];

      const imageCompressionModule = await import('browser-image-compression');
      const imageCompression = imageCompressionModule.default || imageCompressionModule;

      for (const file of fileArray) {
        if (file.size > 5 * 1024 * 1024) {
          setError(`Le fichier ${file.name} dépasse 5MB`);
          continue;
        }

        const fileExt = file.name.split(".").pop()?.toLowerCase();
        if (!["jpg", "jpeg", "png", "webp"].includes(fileExt || "")) {
          setError(`Format non supporté: ${fileExt}`);
          continue;
        }

        // --- SECTION OPTIMISATION ---
        let fileToUpload: File | Blob = file;
        let thumbToUpload: File | Blob | null = null;
        let finalExt = fileExt;

        try {
          const mainOptions = {
            maxSizeMB: 0.4,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
            initialQuality: 0.8,
            fileType: 'image/webp'
          };

          const thumbOptions = {
            maxSizeMB: 0.05,
            maxWidthOrHeight: 400,
            useWebWorker: true,
            initialQuality: 0.6,
            fileType: 'image/webp'
          };

          // Exécution séquentielle pour préserver la RAM
          fileToUpload = await imageCompression(file, mainOptions);
          thumbToUpload = await imageCompression(file, thumbOptions);
          finalExt = "webp";
        } catch (compressionError) {
          console.warn("Échec de la compression client, fallback sur le fichier original", compressionError);
          // En cas d'échec du client, on utilise le Fallback automatique (l'image d'origine et son ext.)
        }

        // --- UPLOAD PRINCIPAL ---
        const baseName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const fileName = `${baseName}.${finalExt}`;
        const filePath = `team-properties/${teamId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("properties")
          .upload(filePath, fileToUpload, { cacheControl: "3600", upsert: false });

        if (uploadError) throw new Error(`Erreur upload principale: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage.from("properties").getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);

        // --- UPLOAD MINIATURE SILENCIEUX ---
        if (thumbToUpload) {
          const thumbPath = `team-properties/${teamId}/${baseName}-thumb.${finalExt}`;
          await supabase.storage
            .from("properties")
            .upload(thumbPath, thumbToUpload, { cacheControl: "31536000", upsert: false });
        }
      }

      setFormData((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processImageFiles(Array.from(files));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateField = (field: string, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const result = await updateTeamProperty(teamId, property.id, {
      title: formData.title,
      description: formData.description,
      price: parseInt(formData.price),
      address: formData.address,
      surface: formData.surface ? parseInt(formData.surface) : undefined,
      rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
      virtual_tour_url: formData.virtual_tour_url,
      images: formData.images,
      owner_id: formData.owner_id,
      location: formData.lat && formData.lon ? {
        lat: formData.lat,
        lon: formData.lon,
        city: formData.city,
        district: formData.district,
        region: formData.region,
      } : undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccess("Modifications enregistrées");
    } else {
      setError(result.error || "Erreur lors de la mise à jour");
    }
  };

  const handleTogglePublication = async () => {
    setIsTogglingPublication(true);
    const result = await togglePropertyPublication(teamId, property.id);
    setIsTogglingPublication(false);

    if (result.success) {
      setIsPublished(result.isPublished || false);
      setSuccess(result.message || "Statut modifié");
    } else {
      setError(result.error || "Erreur");
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Génération de description IA optimisée SEO
  const handleGenerateAI = async () => {
    if (!formData.address || !formData.price) {
      setError("Veuillez renseigner l'adresse et le prix avant de générer la description.");
      return;
    }

    setIsGeneratingAI(true);
    setError(null);

    const result = await generateSEODescription({
      type: (property.details?.type || "bien").toLowerCase(),
      category: property.category,
      city: formData.address,
      price: parseInt(formData.price),
      surface: formData.surface ? parseInt(formData.surface) : undefined,
      rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
      title: formData.title || undefined,
    });

    setIsGeneratingAI(false);

    if (result.success) {
      if (result.description) {
        updateField("description", result.description);
      }
      if (result.title && !formData.title) {
        updateField("title", result.title);
      }
      setSuccess("Description générée avec succès !");
    } else {
      setError(result.error || "Erreur lors de la génération");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/gestion/biens"
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Modifier le bien</h1>
              <p className="text-muted-foreground">{teamName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Statut publication */}
            {/* Statut publication */}
            <div className="flex items-center gap-2">
              {property.status === "loué" ? (
                <div className="px-3 py-1.5 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-lg text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Loué
                </div>
              ) : (
                <button
                  onClick={handleTogglePublication}
                  disabled={isTogglingPublication}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isPublished
                    ? "bg-green-500/10 text-green-600 border border-green-500/20 hover:bg-green-500/20 dark:text-green-400 dark:border-green-500/30"
                    : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                    }`}
                >
                  {isTogglingPublication ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPublished ? (
                    <>
                      <Eye className="w-4 h-4" /> En ligne
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" /> Hors ligne
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Voir sur la vitrine */}
            {isPublished && (
              <Link
                href={`/biens/${property.id}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Voir
              </Link>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 text-green-600 dark:text-green-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Informations générales */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("general")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="font-medium">Informations générales</span>
              </div>
              {expandedSections.general ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {expandedSections.general && (
              <div className="p-4 pt-0 space-y-4">
                <div>
                  <Label className="block text-sm text-muted-foreground mb-2" required>Titre</Label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <Label className="block text-sm text-muted-foreground mb-2" required>
                    Prix (FCFA) {property.category === "location" && "/ mois"}
                  </Label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Type: <strong className="text-foreground">{property.details.type}</strong></span>
                  <span>Catégorie: <strong className="text-foreground">{property.category === "vente" ? "Vente" : "Location"}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Section: Localisation */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("location")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium">Localisation</span>
              </div>
              {expandedSections.location ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {expandedSections.location && (
              <div className="p-4 pt-0">
                <div>
                  <Label className="block text-sm text-muted-foreground mb-3" required>Adresse complète du bien</Label>

                  <AddressAutocomplete
                    defaultValue={formData.address}
                    onAddressSelect={(details) => {
                      setFormData(prev => ({
                        ...prev,
                        address: details.display_name,
                        lat: details.lat ? parseFloat(details.lat) : null,
                        lon: details.lon ? parseFloat(details.lon) : null,
                        city: details.city || "",
                        district: details.suburb || "",
                        region: details.state || ""
                      }));
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: Caractéristiques */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("specs")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Ruler className="w-5 h-5 text-primary" />
                <span className="font-medium">Caractéristiques</span>
              </div>
              {expandedSections.specs ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {expandedSections.specs && (
              <div className="p-4 pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Surface (m²)</label>
                    <input
                      type="number"
                      value={formData.surface}
                      onChange={(e) => updateField("surface", e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Pièces</label>
                    <input
                      type="number"
                      value={formData.rooms}
                      onChange={(e) => updateField("rooms", e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Chambres</label>
                    <input
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => updateField("bedrooms", e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Salles de bain</label>
                    <input
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => updateField("bathrooms", e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Description */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("description")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-medium">Description</span>
              </div>
              {expandedSections.description ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {expandedSections.description && (
              <div className="p-4 pt-0 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-muted-foreground">Description du bien</label>
                    <button
                      type="button"
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Régénérer avec l&apos;IA
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={6}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    L&apos;IA génère une description optimisée SEO basée sur les caractéristiques du bien.
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Visite virtuelle</label>
                  <input
                    type="text"
                    value={formData.virtual_tour_url}
                    onChange={(e) => updateField("virtual_tour_url", e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: Images */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("images")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  Photos ({formData.images.length})
                </span>
              </div>
              {expandedSections.images ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {expandedSections.images && (
              <div className="p-4 pt-0">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                      <Image
                        src={image}
                        alt={`Photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black/80"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  <input
                    id="edit-photo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                  />
                  <label
                    htmlFor="edit-photo-upload"
                    className={`aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors ${uploadingImages ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    {uploadingImages ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground mt-1">{uploadingImages ? "Upload..." : "Ajouter"}</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Propriétaire */}
          <div className="bg-card border border-border rounded-xl p-4">
            <OwnerSelector
              value={formData.owner_id}
              onChange={(ownerId) => updateField("owner_id", ownerId || "")}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Link
              href="/gestion/biens"
              className="flex-1 px-6 py-3 border border-border rounded-lg text-foreground text-center hover:bg-muted transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
