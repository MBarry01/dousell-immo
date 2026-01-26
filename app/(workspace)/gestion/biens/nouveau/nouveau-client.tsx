"use client";

import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Home,
  MapPin,
  Ruler,
  ImageIcon,
  FileText,
  Loader2,
  Plus,
  X,
  Sparkles,
  Calendar,
  Save,
  Send,
  Check,
  Upload,
  User,
  Building,
  Warehouse,
  TreePine,
  Briefcase,
  Hotel,

  ChevronDown,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/utils/supabase/client";
import { OwnerSelector } from "@/components/gestion/OwnerSelector";
import { createTeamProperty, generateSEODescription, type TeamPropertyData } from "../actions";

type PublishMode = "publish" | "draft" | "schedule";

type NouveauBienClientProps = {
  teamId: string;
  teamName: string;
};

const PROPERTY_TYPES = [
  { value: "villa", label: "Villa", icon: Home },
  { value: "appartement", label: "Appartement", icon: Building },
  { value: "studio", label: "Studio", icon: Hotel },
  { value: "terrain", label: "Terrain", icon: TreePine },
  { value: "immeuble", label: "Immeuble", icon: Building2 },
  { value: "bureau", label: "Bureau", icon: Briefcase },
];

const STEPS = [
  { id: 1, title: "L'essentiel", icon: Building2 },
  { id: 2, title: "Localisation", icon: MapPin },
  { id: 3, title: "Détails", icon: Ruler },
  { id: 4, title: "Média", icon: ImageIcon },
  { id: 5, title: "Publication", icon: Send },
];

export function NouveauBienClient({ teamId, teamName }: NouveauBienClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: "appartement",
    category: "location" as "vente" | "location",
    title: "",
    price: "",
    address: "",
    surface: "",
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    description: "",
    virtual_tour_url: "",
    images: [] as string[],
    owner_id: undefined as string | undefined,
  });

  // Image upload state
  const [uploadingImages, setUploadingImages] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // AI generation state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Publication options
  const [publishMode, setPublishMode] = useState<PublishMode>("publish");
  const [scheduledDate, setScheduledDate] = useState("");
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  const updateField = (field: string, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Drag & Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processImageFiles(Array.from(files));
    }
  }, [formData.images.length, teamId]);

  const processImageFiles = async (fileArray: File[]) => {
    if (formData.images.length + fileArray.length > 10) {
      setError("Maximum 10 photos autorisées");
      return;
    }

    setUploadingImages(true);
    setError(null);

    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];

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

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `team-properties/${teamId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("properties")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (uploadError) throw new Error(`Erreur upload: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage.from("properties").getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
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

  const removeImage = (index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // AI Description
  const handleGenerateAI = async () => {
    if (!formData.address || !formData.price) {
      setError("Renseignez l'adresse et le prix pour générer une description.");
      return;
    }

    setIsGeneratingAI(true);
    setError(null);

    const result = await generateSEODescription({
      type: formData.type,
      category: formData.category,
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
      if (result.description) updateField("description", result.description);
      if (result.title && !formData.title) updateField("title", result.title);
    } else {
      setError(result.error || "Erreur lors de la génération");
    }
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    setError(null);
    switch (step) {
      case 1:
        if (!formData.title || formData.title.length < 3) {
          setError("Le titre doit contenir au moins 3 caractères");
          return false;
        }
        if (!formData.price || parseInt(formData.price) <= 0) {
          setError("Le prix est requis");
          return false;
        }
        return true;
      case 2:
        if (!formData.address) {
          setError("L'adresse est requise");
          return false;
        }
        if (!formData.address) {
          setError("L'adresse est requise");
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        if (publishMode === "publish" && formData.images.length === 0) {
          setError("Au moins une image est requise pour publier");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Submit
  const handleSubmit = async (mode: PublishMode = "publish", date?: string) => {
    if (!validateStep(5)) return;

    // Specific validation for scheduling
    if (mode === "schedule" && !date) {
      setError("Sélectionnez une date pour la programmation");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const data: TeamPropertyData = {
      type: formData.type,
      category: formData.category,
      title: formData.title,
      price: parseInt(formData.price),
      address: formData.address,
      surface: formData.surface ? parseInt(formData.surface) : undefined,
      rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
      description: formData.description,
      virtual_tour_url: formData.virtual_tour_url,
      images: formData.images,
      owner_id: formData.owner_id,
    };

    const result = await createTeamProperty(
      teamId,
      data,
      mode,
      mode === "schedule" ? date : undefined
    );

    setIsSubmitting(false);

    if (result.success) {
      const successMsg = mode === "draft" ? "saved_draft" : mode === "schedule" ? "scheduled" : "created";
      router.push(`/gestion/biens?success=${successMsg}`);
    } else {
      setError(result.error || "Erreur lors de la création");
    }
  };

  const handleScheduleSubmit = () => {
    if (!scheduledDate) return;
    handleSubmit("schedule", scheduledDate);
    setIsScheduleDialogOpen(false);
  };

  const isTerrain = formData.type === "terrain";

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-[#121212]/95 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/gestion/biens" className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-zinc-400" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-white">Nouveau bien</h1>
                <p className="text-sm text-zinc-500">{teamName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  className={`flex flex-col items-center gap-2 transition-all ${step.id <= currentStep ? "cursor-pointer" : "cursor-default"
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive
                    ? "bg-[#F4C430] text-black"
                    : isCompleted
                      ? "bg-[#F4C430]/20 text-[#F4C430]"
                      : "bg-zinc-800 text-zinc-500"
                    }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isActive ? "text-white" : isCompleted ? "text-[#F4C430]" : "text-zinc-500"
                    }`}>
                    {step.title}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 sm:w-20 h-0.5 mx-2 ${currentStep > step.id ? "bg-[#F4C430]/30" : "bg-zinc-800"
                    }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="space-y-8">
          {/* Step 1: L'essentiel */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Transaction Toggle */}
              <div>
                <label className="text-sm text-zinc-400 mb-3 block">Type de transaction</label>
                <div className="flex bg-zinc-800/50 rounded-lg p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => updateField("category", "location")}
                    className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${formData.category === "location"
                      ? "bg-[#F4C430] text-black"
                      : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    Location
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("category", "vente")}
                    className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${formData.category === "vente"
                      ? "bg-[#F4C430] text-black"
                      : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    Vente
                  </button>
                </div>
              </div>

              {/* Property Type Cards */}
              <div>
                <label className="text-sm text-zinc-400 mb-3 block">Type de bien</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {PROPERTY_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => updateField("type", type.value)}
                        className={`p-4 rounded-xl border transition-all text-center ${formData.type === type.value
                          ? "bg-[#F4C430]/10 border-[#F4C430]/50 text-[#F4C430]"
                          : "bg-zinc-800/30 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                          }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${formData.type === type.value ? "text-[#F4C430]" : "text-zinc-500"
                          }`} />
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Titre de l'annonce</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Ex: Belle villa avec piscine"
                  className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F4C430]/50 transition-colors"
                />
              </div>

              {/* Price */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  Prix {formData.category === "location" ? "mensuel" : "de vente"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    placeholder="0"
                    className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg px-4 py-3 pr-20 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F4C430]/50 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                    FCFA{formData.category === "location" && "/mois"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Localisation */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <label className="text-sm text-zinc-400 mb-3 block">Adresse complète du bien</label>

                <AddressAutocomplete
                  defaultValue={formData.address}
                  onAddressSelect={(details) => {
                    updateField("address", details.display_name);
                  }}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Step 3: Détails */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Surface</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.surface}
                      onChange={(e) => updateField("surface", e.target.value)}
                      placeholder="0"
                      className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F4C430]/50 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">m²</span>
                  </div>
                </div>

                {!isTerrain && (
                  <>
                    <div>
                      <label className="text-sm text-zinc-400 mb-2 block">Pièces</label>
                      <input
                        type="number"
                        value={formData.rooms}
                        onChange={(e) => updateField("rooms", e.target.value)}
                        placeholder="0"
                        className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F4C430]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400 mb-2 block">Chambres</label>
                      <input
                        type="number"
                        value={formData.bedrooms}
                        onChange={(e) => updateField("bedrooms", e.target.value)}
                        placeholder="0"
                        className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F4C430]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400 mb-2 block">Salles de bain</label>
                      <input
                        type="number"
                        value={formData.bathrooms}
                        onChange={(e) => updateField("bathrooms", e.target.value)}
                        placeholder="0"
                        className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F4C430]/50 transition-colors"
                      />
                    </div>
                  </>
                )}
              </div>

              {isTerrain && (
                <p className="text-sm text-zinc-500">
                  Pour un terrain, seule la surface est requise.
                </p>
              )}
            </div>
          )}

          {/* Step 4: Média */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Photos Drag & Drop */}
              <div>
                <label className="text-sm text-zinc-400 mb-3 block">
                  Photos ({formData.images.length}/10)
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
                    ? "border-[#F4C430] bg-[#F4C430]/5"
                    : "border-zinc-700 hover:border-zinc-600"
                    }`}
                >
                  {uploadingImages ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-[#F4C430] animate-spin" />
                      <p className="text-zinc-400">Upload en cours...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-10 h-10 text-zinc-500" />
                      <div>
                        <p className="text-zinc-300">Glissez vos photos ici</p>
                        <p className="text-sm text-zinc-500 mt-1">ou</p>
                      </div>
                      <label className="cursor-pointer px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors">
                        Parcourir
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-zinc-600">JPG, PNG, WebP • Max 5MB par photo</p>
                    </div>
                  )}
                </div>

                {/* Image Preview Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                        <Image src={url} alt={`Photo ${index + 1}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-[#F4C430] text-black text-xs font-medium rounded">
                            Principale
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-zinc-400">Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#F4C430] transition-colors disabled:opacity-50"
                  >
                    {isGeneratingAI ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Améliorer avec l'IA
                  </button>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Décrivez le bien, ses atouts, son environnement..."
                  rows={5}
                  className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F4C430]/50 resize-none transition-colors"
                />
              </div>

              {/* Virtual Tour */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  Visite virtuelle <span className="text-zinc-600">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={formData.virtual_tour_url}
                  onChange={(e) => updateField("virtual_tour_url", e.target.value)}
                  placeholder="Lien YouTube ou Google Maps 360"
                  className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F4C430]/50 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Step 5: Publication */}
          {currentStep === 5 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Owner */}
              <div>
                <label className="text-sm text-zinc-400 mb-3 block">
                  Propriétaire <span className="text-zinc-600">(optionnel)</span>
                </label>
                <OwnerSelector
                  value={formData.owner_id}
                  onChange={(id) => updateField("owner_id", id || "")}
                />
              </div>

            </div>

          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-zinc-800/50">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-5 py-2.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#F4C430] text-black font-medium rounded-lg hover:bg-[#F4C430]/90 transition-colors"
            >
              Continuer
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSubmit("draft")}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
              >
                Enregistrer en brouillon
              </button>

              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => handleSubmit("publish")}
                  disabled={isSubmitting}
                  className="
                    flex items-center gap-2 
                    px-4 py-2 
                    bg-[#F4C430] hover:bg-[#F4C430]/90 
                    text-black font-medium 
                    rounded-l-lg rounded-r-none 
                    transition-all duration-200 ease-in-out
                    focus:z-10 focus:ring-2 focus:ring-[#F4C430]/50
                  "
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publier
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      disabled={isSubmitting}
                      className="
                        px-2 py-2 
                        bg-[#F4C430] hover:bg-[#F4C430]/90 
                        text-black 
                        rounded-r-lg rounded-l-none 
                        border-l border-yellow-600/30 
                        transition-all duration-200 ease-in-out
                        focus:z-10 focus:ring-2 focus:ring-[#F4C430]/50
                      "
                    >
                      <ChevronDown className="w-4 h-4" />
                      <span className="sr-only">Options de publication</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px] bg-zinc-900 border-zinc-800 text-white">
                    <DropdownMenuItem
                      onClick={() => setIsScheduleDialogOpen(true)}
                      className="cursor-pointer hover:bg-zinc-800 flex items-center gap-2 py-2.5"
                    >
                      <Clock className="w-4 h-4 text-zinc-400" />
                      <span>Programmer</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>

        {/* Schedule Dialog */}
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Programmer la publication</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Choisissez la date et l'heure à laquelle le bien sera visible publiquement.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <div className="flex flex-col space-y-4">
                <label className="text-sm font-medium text-zinc-300">Date et heure</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F4C430]/50 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsScheduleDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleScheduleSubmit}
                disabled={!scheduledDate || isSubmitting}
                className="px-4 py-2 text-sm font-medium bg-[#F4C430] text-black rounded-lg hover:bg-[#F4C430]/90 disabled:opacity-50 transition-colors"
              >
                Programmer
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div >
    </div >
  );
}
