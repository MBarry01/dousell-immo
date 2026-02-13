"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Home,
  MapPin,
  Ruler,
  ImageIcon,
  Send,
  Loader2,
  X,
  Sparkles,
  Check,
  Upload,
  Building,
  TreePine,
  Briefcase,
  Store,
  ChevronDown,
} from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";
import { submitUserListing, generateAIDescription } from "./actions";
import { smartGeocode } from "@/lib/geocoding";
import { scrollToTop } from "@/lib/scroll-utils";

// Storage keys
const STORAGE_KEYS = {
  formData: "deposit_form_data_v3",
  images: "deposit_form_images_v3",
  step: "deposit_form_step_v3",
};

const PROPERTY_TYPES = [
  { value: "villa", label: "Villa", icon: Home },
  { value: "appartement", label: "Appartement", icon: Building },
  { value: "terrain", label: "Terrain", icon: TreePine },
  { value: "immeuble", label: "Immeuble", icon: Building2 },
  { value: "magasin", label: "Magasin", icon: Store },
  { value: "bureau", label: "Bureau", icon: Briefcase },
];

const STEPS = [
  { id: 1, title: "L'essentiel", icon: Building2 },
  { id: 2, title: "Localisation", icon: MapPin },
  { id: 3, title: "Détails", icon: Ruler },
  { id: 4, title: "Média", icon: ImageIcon },
  { id: 5, title: "Publication", icon: Send },
];

function DeposerPageContent() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [formData, setFormData] = useState({
    type: "appartement",
    category: "location" as "vente" | "location",
    title: "",
    price: "",
    city: "",
    district: "",
    address: "",
    landmark: "",
    surface: "",
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    description: "",
    virtual_tour_url: "",
    contact_phone: "",
    images: [] as string[],
  });

  const updateField = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Restore from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEYS.formData);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setFormData((prev) => ({ ...prev, ...data }));
      } catch { }
    }
    const storedStep = localStorage.getItem(STORAGE_KEYS.step);
    if (storedStep) setCurrentStep(parseInt(storedStep, 10) || 1);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (typeof window === "undefined" || isSubmitting) return;
    localStorage.setItem(STORAGE_KEYS.formData, JSON.stringify(formData));
    localStorage.setItem(STORAGE_KEYS.step, currentStep.toString());
  }, [formData, currentStep, isSubmitting]);

  // Pre-fill phone from profile
  useEffect(() => {
    if (user?.user_metadata?.phone && !formData.contact_phone) {
      updateField("contact_phone", user.user_metadata.phone);
    }
  }, [user]);

  // Drag & Drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files?.length) await processImageFiles(Array.from(files));
  }, [formData.images.length]);

  const processImageFiles = async (fileArray: File[]) => {
    if (formData.images.length + fileArray.length > 10) {
      setError("Maximum 10 photos");
      return;
    }
    setUploadingImages(true);
    setError(null);
    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];
      for (const file of fileArray) {
        if (file.size > 5 * 1024 * 1024) continue;
        const fileExt = file.name.split(".").pop()?.toLowerCase();
        if (!["jpg", "jpeg", "png", "webp"].includes(fileExt || "")) continue;
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("properties")
          .upload(fileName, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("properties").getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      toast.success(`${uploadedUrls.length} photo(s) ajoutée(s)`);
    } catch (err) {
      setError("Erreur lors de l'upload");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) await processImageFiles(Array.from(files));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // AI Description
  const handleGenerateAI = async () => {
    const isReady = currentStep >= 3 && formData.city && formData.price;
    if (!isReady) {
      setError("Renseignez au moins la ville et le prix.");
      return;
    }
    setIsGeneratingAI(true);
    setError(null);
    try {
      const result = await generateAIDescription({
        type: formData.type,
        category: formData.category,
        city: formData.city,
        district: formData.district,
        price: parseInt(formData.price),
        surface: formData.surface ? parseInt(formData.surface) : undefined,
        rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
      });
      if (result.success && result.description) {
        updateField("description", result.description);
        toast.success("Description générée !");
      }
    } catch {
      setError("Erreur lors de la génération");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Validation
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
        if (!formData.city) {
          setError("La ville est requise");
          return false;
        }
        if (!formData.district) {
          setError("Le quartier est requis");
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
        if (formData.images.length === 0) {
          setError("Au moins une photo est requise");
          return false;
        }
        return true;
      case 5:
        return true;
      default:
        return true;
    }
  };

  const nextStep = async () => {
    if (validateStep(currentStep)) {
      // Auto-generate description when going to step 4
      if (currentStep === 3 && (!formData.description || formData.description.length < 10)) {
        await handleGenerateAI();
      }
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      scrollToTop();
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    scrollToTop();
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(4)) return;
    setIsSubmitting(true);
    setError(null);

    let coordinates = { lat: 14.7167, lng: -17.4677 };
    try {
      coordinates = await smartGeocode(formData.address, formData.district, formData.city);
    } catch { }

    try {
      const result = await submitUserListing({
        type: formData.type,
        category: formData.category,
        title: formData.title,
        price: parseInt(formData.price),
        city: formData.city,
        district: formData.district,
        address: formData.address,
        landmark: formData.landmark,
        surface: formData.surface ? parseInt(formData.surface) : undefined,
        rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        description: formData.description,
        virtual_tour_url: formData.virtual_tour_url,
        contact_phone: formData.contact_phone,
        images: formData.images,
        location: {
          city: formData.city,
          district: formData.district,
          address: formData.address,
          landmark: formData.landmark,
          coords: coordinates,
        },
      });

      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      toast.success("Annonce publiée avec succès !");
      localStorage.removeItem(STORAGE_KEYS.formData);
      localStorage.removeItem(STORAGE_KEYS.step);
      setTimeout(() => {
        router.push("/compte/mes-biens?success=true");
        router.refresh();
      }, 1000);
    } catch {
      setError("Une erreur est survenue");
      setIsSubmitting(false);
    }
  };

  const isTerrain = formData.type === "terrain";
  const priceLabel = formData.category === "location" ? "Prix mensuel" : "Prix de vente";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F4C430] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4 text-white">
        <h1 className="text-xl font-semibold">Connexion requise</h1>
        <Link href="/login" className="px-6 py-3 bg-[#F4C430] text-black rounded-lg font-medium">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#121212]/95 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/compte" className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-white">Déposer une annonce</h1>
              <p className="text-sm text-emerald-400">100% Gratuit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex items-center shrink-0">
                <button
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  className={`flex flex-col items-center gap-2 transition-all ${step.id <= currentStep ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${isActive
                    ? "bg-[#F4C430] text-black shadow-lg shadow-[#F4C430]/20"
                    : isCompleted ? "bg-[#F4C430]/20 text-[#F4C430]" : "bg-zinc-800 text-zinc-500"
                    }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium ${isActive ? "text-white" : isCompleted ? "text-[#F4C430]" : "text-zinc-500"}`}>
                    {step.title}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`w-6 sm:w-20 h-0.5 mx-1 sm:mx-2 ${currentStep > step.id ? "bg-[#F4C430]/30" : "bg-zinc-800"}`} />
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
                <div className="flex bg-zinc-800/50 rounded-lg p-1 w-full sm:w-fit">
                  <button
                    type="button"
                    onClick={() => updateField("category", "location")}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-md text-sm font-medium transition-all ${formData.category === "location" ? "bg-[#F4C430] text-black" : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    Location
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("category", "vente")}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-md text-sm font-medium transition-all ${formData.category === "vente" ? "bg-[#F4C430] text-black" : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    Vente
                  </button>
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="text-sm text-zinc-400 mb-3 block">Type de bien</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {PROPERTY_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => updateField("type", type.value)}
                        className={`p-3 sm:p-4 rounded-xl border transition-all text-center ${formData.type === type.value
                          ? "bg-[#F4C430]/10 border-[#F4C430]/50 text-[#F4C430]"
                          : "bg-zinc-800/30 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                          }`}
                      >
                        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 ${formData.type === type.value ? "text-[#F4C430]" : "text-zinc-500"}`} />
                        <span className="text-[11px] sm:text-xs font-medium">{type.label}</span>
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
                <label className="text-sm text-zinc-400 mb-2 block">{priceLabel}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    placeholder="0"
                    className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg px-4 py-3 pr-24 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F4C430]/50 transition-colors"
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
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Ville / Région</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="Dakar"
                    className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F4C430]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Quartier</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => updateField("district", e.target.value)}
                    placeholder="Almadies"
                    className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F4C430]/50 transition-colors"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  Adresse précise <span className="text-zinc-600">(optionnel)</span>
                </label>
                <AddressAutocomplete
                  defaultValue={formData.address}
                  onAddressSelect={(details) => {
                    updateField("address", details.display_name);
                    if (details.state) updateField("city", details.state);
                    const quartier = details.suburb || details.city || details.road;
                    if (quartier) updateField("district", quartier);
                  }}
                  className="w-full"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Point de repère <span className="text-zinc-600">(optionnel)</span></label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => updateField("landmark", e.target.value)}
                  placeholder="Près de l'école..."
                  className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F4C430]/50 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Step 3: Détails */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in duration-300">
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
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Photos */}
              <div>
                <label className="text-sm text-zinc-400 mb-3 block">Photos ({formData.images.length}/10)</label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? "border-[#F4C430] bg-[#F4C430]/5" : "border-zinc-700 hover:border-zinc-600"
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
                      <p className="text-zinc-300">Glissez vos photos ici</p>
                      <label className="cursor-pointer px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors">
                        Parcourir
                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <p className="text-xs text-zinc-600">JPG, PNG, WebP • Max 5MB</p>
                    </div>
                  )}
                </div>

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
                    {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Générer avec l'IA
                  </button>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Décrivez le bien, ses atouts..."
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
                  placeholder="Lien YouTube"
                  className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F4C430]/50 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Step 5: Publication */}
          {currentStep === 5 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Contact */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  Téléphone de contact <span className="text-zinc-600">(optionnel)</span>
                </label>
                <PhoneInput
                  value={formData.contact_phone || undefined}
                  onChange={(val) => updateField("contact_phone", val || "")}
                  defaultCountry="SN"
                  international
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
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
              className="flex items-center gap-2 px-6 py-2.5 bg-[#F4C430] text-black font-medium rounded-lg hover:bg-[#F4C430]/90 transition-colors shadow-lg shadow-[#F4C430]/10"
            >
              Continuer
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#F4C430] text-black font-medium rounded-lg hover:bg-[#F4C430]/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publier gratuitement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DeposerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F4C430] animate-spin" /></div>}>
      <DeposerPageContent />
    </Suspense>
  );
}
