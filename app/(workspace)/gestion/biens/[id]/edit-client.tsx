"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { OwnerSelector } from "@/components/gestion/OwnerSelector";
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
    address?: string;
    landmark?: string;
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
  const router = useRouter();
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
  });

  const [isPublished, setIsPublished] = useState(property.validation_status === "approved");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

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
      type: property.details.type.toLowerCase(),
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
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/gestion/biens"
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Modifier le bien</h1>
              <p className="text-zinc-400">{teamName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Statut publication */}
            <button
              onClick={handleTogglePublication}
              disabled={isTogglingPublication}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isPublished
                  ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                  : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"
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

            {/* Voir sur la vitrine */}
            {isPublished && (
              <Link
                href={`/biens/${property.id}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Voir
              </Link>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 text-green-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Informations générales */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("general")}
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-[#F4C430]" />
                <span className="font-medium text-white">Informations générales</span>
              </div>
              {expandedSections.general ? (
                <ChevronUp className="w-5 h-5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              )}
            </button>

            {expandedSections.general && (
              <div className="p-4 pt-0 space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Titre</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F4C430]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Prix (FCFA) {property.category === "location" && "/ mois"}
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F4C430]"
                  />
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span>Type: <strong className="text-white">{property.details.type}</strong></span>
                  <span>Catégorie: <strong className="text-white">{property.category === "vente" ? "Vente" : "Location"}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Section: Localisation */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("location")}
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#F4C430]" />
                <span className="font-medium text-white">Localisation</span>
              </div>
              {expandedSections.location ? (
                <ChevronUp className="w-5 h-5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              )}
            </button>

            {expandedSections.location && (
              <div className="p-4 pt-0">
                <div>
                  <label className="block text-sm text-zinc-400 mb-3">Adresse complète du bien</label>

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
          </div>

          {/* Section: Caractéristiques */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("specs")}
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Ruler className="w-5 h-5 text-[#F4C430]" />
                <span className="font-medium text-white">Caractéristiques</span>
              </div>
              {expandedSections.specs ? (
                <ChevronUp className="w-5 h-5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              )}
            </button>

            {expandedSections.specs && (
              <div className="p-4 pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Surface (m²)</label>
                    <input
                      type="number"
                      value={formData.surface}
                      onChange={(e) => updateField("surface", e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F4C430]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Pièces</label>
                    <input
                      type="number"
                      value={formData.rooms}
                      onChange={(e) => updateField("rooms", e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F4C430]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Chambres</label>
                    <input
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => updateField("bedrooms", e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F4C430]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Salles de bain</label>
                    <input
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => updateField("bathrooms", e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F4C430]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Description */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("description")}
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#F4C430]" />
                <span className="font-medium text-white">Description</span>
              </div>
              {expandedSections.description ? (
                <ChevronUp className="w-5 h-5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              )}
            </button>

            {expandedSections.description && (
              <div className="p-4 pt-0 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-zinc-400">Description du bien</label>
                    <button
                      type="button"
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#F4C430]/20 to-purple-500/20 border border-[#F4C430]/30 rounded-lg text-sm font-medium text-[#F4C430] hover:from-[#F4C430]/30 hover:to-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Régénérer avec l'IA
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={6}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F4C430] resize-none"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    L'IA génère une description optimisée SEO basée sur les caractéristiques du bien.
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Visite virtuelle</label>
                  <input
                    type="text"
                    value={formData.virtual_tour_url}
                    onChange={(e) => updateField("virtual_tour_url", e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F4C430]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: Images */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("images")}
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-[#F4C430]" />
                <span className="font-medium text-white">
                  Photos ({formData.images.length})
                </span>
              </div>
              {expandedSections.images ? (
                <ChevronUp className="w-5 h-5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              )}
            </button>

            {expandedSections.images && (
              <div className="p-4 pt-0">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
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
                  <label className="aspect-square border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#F4C430] transition-colors">
                    <Plus className="w-6 h-6 text-zinc-400" />
                    <span className="text-xs text-zinc-500 mt-1">Ajouter</span>
                    <input type="file" accept="image/*" multiple className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Propriétaire */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <OwnerSelector
              value={formData.owner_id}
              onChange={(ownerId) => updateField("owner_id", ownerId || "")}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Link
              href="/gestion/biens"
              className="flex-1 px-6 py-3 border border-zinc-700 rounded-lg text-white text-center hover:bg-zinc-800 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-[#F4C430] text-black rounded-lg font-medium hover:bg-[#F4C430]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
