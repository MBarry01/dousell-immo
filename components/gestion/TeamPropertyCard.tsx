"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, Bed, Bath, Square, Eye, EyeOff, Pencil, Trash2, MoreVertical, Clock, Copy, Share2, UserPlus, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { useState } from "react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddTenantButton } from "@/app/(webapp)/gestion-locative/components/AddTenantButton";
import { toast } from "sonner"; // Assuming sonner is used, or alerts if not. Using window.alert/console for now if uncertain.

type TeamPropertyCardProps = {
  property: {
    id: string;
    title: string;
    price: number;
    category: "vente" | "location";
    status: string;
    validation_status: string;
    verification_status: string | null;
    scheduled_publish_at?: string;
    images: string[];
    location: {
      city: string;
      district?: string;
      address?: string;
    };
    specs: {
      surface: number;
      bedrooms: number;
      bathrooms: number;
    };
    details: {
      type: string;
    };
    owner?: {
      id: string;
      full_name?: string;
      phone?: string;
    };
    view_count?: number;
    tenant?: {
      id: string;
      full_name: string;
      avatar_url?: string;
      payment_status: "up_to_date" | "late";
    };
  };
  onTogglePublication: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAssociate: (id: string) => void;
  isLoading?: boolean;
};

export function TeamPropertyCard({
  property,
  onTogglePublication,
  onDelete,
  onAssociate,
  isLoading,
}: TeamPropertyCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const isPublished = property.validation_status === "approved";
  const isScheduled = property.validation_status === "scheduled";
  const isVerified = property.verification_status === "verified";

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/biens/${property.id}`;
    navigator.clipboard.writeText(url);
    // You might want a toast here
    alert("Lien copié !");
    setShowMenu(false);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Placeholder for duplication logic
    alert("Fonctionnalité de duplication à venir");
    setShowMenu(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-SN").format(price);
  };

  const formatScheduledDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      {/* Image */}
      <div className="relative h-48">
        {property.images?.[0] ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className="object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement?.classList.add("bg-zinc-800");
              const icon = document.createElement("div");
              icon.className = "absolute inset-0 flex items-center justify-center text-zinc-700";
              icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>';
              e.currentTarget.parentElement?.appendChild(icon);
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-700">
            <Building2 className="w-12 h-12" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-zinc-900/80 text-white">
            {property.category === "vente" ? "Vente" : "Location"}
          </span>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-zinc-900/80 text-white">
            {property.details.type}
          </span>
        </div>

        {/* Statut principal (Un seul badge prioritaire) */}
        <div className="absolute top-3 right-3">
          {/* Priorité 1: Statut d'occupation ou publication spéciale */}
          {property.status === "loué" ? (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
              ✓ Loué
            </span>
          ) : property.status === "preavis" ? (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 backdrop-blur-md">
              Préavis
            </span>
          ) : isScheduled ? (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1 backdrop-blur-md">
              <Clock className="w-3 h-3" />
              {property.scheduled_publish_at
                ? formatScheduledDate(property.scheduled_publish_at)
                : "Programmé"}
            </span>
          ) : !isPublished ? (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-zinc-700/80 text-zinc-400 flex items-center gap-1 backdrop-blur-md">
              <EyeOff className="w-3 h-3" /> Brouillon
            </span>
          ) : (
            /* Bien vacant ET en ligne = afficher "Vacant" (plus important) */
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-md">
              À louer
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title & Price */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <h3 className="font-semibold text-white line-clamp-1">{property.title}</h3>
            {isVerified && <VerifiedBadge size="sm" />}
          </div>
          <div className="relative">
            <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 hover:bg-zinc-800 rounded-lg transition-colors outline-none"
                >
                  <MoreVertical className="w-5 h-5 text-zinc-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px] bg-zinc-900 border-zinc-800 z-50">
                <Link
                  href={`/gestion/biens/${property.id}`}
                  className="relative flex cursor-default select-none items-center gap-2 px-2 py-1.5 text-sm outline-none transition-colors hover:bg-zinc-800 focus:bg-zinc-800 text-white rounded-sm w-full"
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </Link>

                {/* MENU CONTEXTUEL : Bien Loué */}
                {property.tenant ? (
                  <>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <Link
                      href={`/gestion/baux?property=${property.id}`}
                      className="relative flex cursor-default select-none items-center gap-2 px-2 py-1.5 text-sm outline-none transition-colors hover:bg-zinc-800 focus:bg-zinc-800 text-white rounded-sm w-full"
                    >
                      📄 Voir le Bail
                    </Link>
                    <Link
                      href={`/gestion/quittances/nouveau?property=${property.id}`}
                      className="relative flex cursor-default select-none items-center gap-2 px-2 py-1.5 text-sm outline-none transition-colors hover:bg-zinc-800 focus:bg-zinc-800 text-white rounded-sm w-full"
                    >
                      📤 Envoyer une quittance
                    </Link>
                    <Link
                      href={`/gestion/maintenance/nouveau?property=${property.id}`}
                      className="relative flex cursor-default select-none items-center gap-2 px-2 py-1.5 text-sm outline-none transition-colors hover:bg-zinc-800 focus:bg-zinc-800 text-white rounded-sm w-full"
                    >
                      🔧 Signaler une intervention
                    </Link>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem
                      onClick={() => toast.info("Fonctionnalité bientôt disponible")}
                      className="cursor-pointer focus:bg-zinc-800 focus:text-orange-400 text-orange-400 transition-colors gap-2"
                    >
                      🛑 Signaler un départ
                    </DropdownMenuItem>
                  </>
                ) : (
                  /* MENU CONTEXTUEL : Bien Vacant */
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        onTogglePublication(property.id);
                      }}
                      disabled={isLoading}
                      className="cursor-pointer focus:bg-zinc-800 focus:text-white text-zinc-300 transition-colors gap-2"
                    >
                      {isPublished ? (
                        <>
                          <EyeOff className="w-4 h-4" /> Retirer
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" /> Publier
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem
                      onClick={handleDuplicate}
                      className="cursor-pointer focus:bg-zinc-800 focus:text-white text-zinc-300 transition-colors gap-2"
                    >
                      <Copy className="w-4 h-4" /> Dupliquer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem
                      onClick={() => {
                        if (confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) {
                          onDelete(property.id);
                        }
                      }}
                      disabled={isLoading}
                      className="cursor-pointer focus:bg-zinc-800 focus:text-red-400 text-red-400 transition-colors gap-2 hover:text-red-400 hover:bg-zinc-800"
                    >
                      <Trash2 className="w-4 h-4" /> Supprimer
                    </DropdownMenuItem>
                  </>
                )}

                {/* Option Partager (toujours visible) */}
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  onClick={handleShare}
                  className="cursor-pointer focus:bg-zinc-800 focus:text-white text-zinc-300 transition-colors gap-2"
                >
                  <Share2 className="w-4 h-4" /> Partager
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="text-[#F4C430] font-bold text-lg mb-3">
          {formatPrice(property.price)} FCFA
          {property.category === "location" && (
            <span className="text-sm font-normal text-zinc-500"> /mois</span>
          )}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1 text-zinc-400 text-sm mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {property.location.district
              ? `${property.location.district}, ${property.location.city}`
              : property.location.city}
          </span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-zinc-500 text-sm mb-3">
          {property.specs.surface > 0 && (
            <div className="flex items-center gap-1">
              <Square className="w-4 h-4" />
              <span>{property.specs.surface} m²</span>
            </div>
          )}
          {property.specs.bedrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{property.specs.bedrooms}</span>
            </div>
          )}
          {property.specs.bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{property.specs.bathrooms}</span>
            </div>
          )}
        </div>

        {/* Owner & Tenant Section */}
        <div className="pt-3 border-t border-zinc-800 flex flex-col gap-3">
          {/* Owner (Small) */}
          {property.owner?.full_name && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
                <Building2 className="w-2.5 h-2.5 text-zinc-400" />
              </div>
              <span className="text-xs text-zinc-500">{property.owner.full_name}</span>
            </div>
          )}

          {/* Tenant or Associate Action */}
          {property.tenant ? (
            <Link
              href={`/gestion/locataires/${property.tenant.id}`}
              className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
            >
              <div className="flex items-center gap-2">
                {property.tenant.avatar_url ? (
                  <Image
                    src={property.tenant.avatar_url}
                    alt={property.tenant.full_name}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#F4C430]/10 flex items-center justify-center text-[#F4C430] font-medium text-xs">
                    {property.tenant.full_name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm text-white font-medium group-hover:text-[#F4C430] transition-colors">{property.tenant.full_name}</p>
                  <p className="text-xs text-zinc-500">Locataire actuel</p>
                </div>
              </div>
              {property.tenant.payment_status === "up_to_date" ? (
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" title="Paiements à jour" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" title="Retard de paiement" />
              )}
            </Link>
          ) : (
            <button
              onClick={() => onAssociate(property.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#F4C430] font-medium transition-all group"
            >
              <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Associer un locataire
            </button>
          )}

          {/* Controlled Wizard Modal */}
          <AddTenantButton
            ownerId={property.owner?.id || ""}
            propertyId={property.id}
            open={showAddTenant}
            onOpenChange={setShowAddTenant}
            initialData={{
              address: property.location.address || `${property.location.district ? property.location.district + ', ' : ''}${property.location.city}`,
              amount: property.price
            }}
            trigger={null}
          />
        </div>

        {/* Views */}
        {property.view_count !== undefined && property.view_count > 0 && (
          <div className="flex items-center gap-1 text-xs text-zinc-600 mt-2">
            <Eye className="w-3 h-3" />
            <span>{property.view_count} vues</span>
          </div>
        )}
      </div>
    </div >
  );
}
