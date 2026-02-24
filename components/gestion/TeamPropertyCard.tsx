"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, Bed, Bath, Square, Eye, EyeOff, Pencil, Trash2, MoreVertical, Clock, Copy, Share2, UserPlus, CheckCircle2, AlertCircle, Plus, FileText } from "lucide-react";
import { useState } from "react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    is_full_rental?: boolean;
    tenants?: Array<{
      id: string;
      full_name: string;
      avatar_url?: string;
      payment_status: "up_to_date" | "late";
    }>;
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
  const isPublished = property.validation_status === "approved";
  const isScheduled = property.validation_status === "scheduled";
  const isVerified = property.verification_status === "verified";

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/biens/${property.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien copié !");
    setShowMenu(false);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info("Fonctionnalité de duplication à venir");
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
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all hover:border-primary/50 group">
      {/* Image */}
      <div className="relative aspect-video bg-muted group-hover:scale-[1.01] transition-transform duration-500">
        {property.images?.[0] ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
            <Building2 className="w-12 h-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Badges sur l'image */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "backdrop-blur-md border-0 text-white",
              property.category === "vente"
                ? "bg-purple-500/90"
                : "bg-blue-500/90"
            )}
          >
            {property.category === "vente" ? "Vente" : "Location"}
          </Badge>
          {property.details.type && (
            <Badge variant="outline" className="bg-black/30 text-white border-white/20 backdrop-blur-md">
              {property.details.type}
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3">
          {property.status === "loué" ? (
            <Badge className="bg-emerald-500/90 text-white hover:bg-emerald-600 border-0 backdrop-blur-md">
              ✓ Loué
            </Badge>
          ) : property.status === "preavis" ? (
            <Badge className="bg-orange-500/90 text-white hover:bg-orange-600 border-0 backdrop-blur-md">
              Préavis
            </Badge>
          ) : isScheduled ? (
            <Badge className="bg-blue-500/90 text-white hover:bg-blue-600 border-0 backdrop-blur-md flex gap-1">
              <Clock className="w-3 h-3" />
              {property.scheduled_publish_at
                ? formatScheduledDate(property.scheduled_publish_at)
                : "Programmé"}
            </Badge>
          ) : !isPublished ? (
            <Badge className="bg-zinc-700/90 text-white hover:bg-zinc-600 border-0 backdrop-blur-md flex gap-1">
              <EyeOff className="w-3 h-3" /> Brouillon
            </Badge>
          ) : (
            <Badge className="bg-amber-500/90 text-white hover:bg-amber-600 border-0 backdrop-blur-md">
              À louer
            </Badge>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {property.title}
            </h3>
            {isVerified && <VerifiedBadge size="sm" className="mt-1" />}
            <div className="flex items-center gap-2 text-primary font-bold text-lg mt-1">
              {formatPrice(property.price)} FCFA
              {property.category === "location" && (
                <span className="text-sm font-normal text-muted-foreground">/mois</span>
              )}
            </div>
          </div>

          <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/gestion/biens/${property.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  Voir détails
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/gestion/biens/${property.id}/edit`}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Modifier
                </Link>
              </DropdownMenuItem>

              {property.tenants && property.tenants.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {property.tenants.map((t) => (
                    <DropdownMenuItem key={t.id} asChild>
                      <Link href={`/gestion/locataires/${t.id}#documents`}>
                        <FileText className="w-4 h-4 mr-2" />
                        Bail: {t.full_name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              <DropdownMenuSeparator />

              {(!property.tenants || property.tenants.length === 0) ? (
                <DropdownMenuItem onClick={() => onTogglePublication(property.id)}>
                  {isPublished ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" /> Dépublier
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" /> Publier
                    </>
                  )}
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="w-4 h-4 mr-2" /> Dupliquer
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => {
                  if (confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) {
                    onDelete(property.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" /> Partager
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Location & Specs */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {property.location.address || property.location.city}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-3">
            {property.specs.surface > 0 && (
              <div className="flex items-center gap-1.5">
                <Square className="w-4 h-4" />
                {property.specs.surface} m²
              </div>
            )}
            {property.specs.bedrooms > 0 && (
              <div className="flex items-center gap-1.5">
                <Bed className="w-4 h-4" />
                {property.specs.bedrooms}
              </div>
            )}
            {property.specs.bathrooms > 0 && (
              <div className="flex items-center gap-1.5">
                <Bath className="w-4 h-4" />
                {property.specs.bathrooms}
              </div>
            )}
          </div>
        </div>

        {/* Tenant Section */}
        <div className="pt-3 border-t border-border">
          <div className="space-y-2">
            {property.tenants?.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/gestion/locataires/${tenant.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-primary/20 transition-all duration-300 group"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={tenant.avatar_url} />
                  <AvatarFallback>{tenant.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {tenant.full_name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      tenant.payment_status === "up_to_date" ? "bg-green-500" : "bg-red-500"
                    )} />
                    <span className="text-xs text-muted-foreground">
                      {tenant.payment_status === "up_to_date" ? "À jour" : "Retard"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {(!property.is_full_rental && (!property.tenants || property.tenants.length < (property.specs.bedrooms || 1))) && (
              <button
                onClick={() => onAssociate(property.id)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-300 group shadow-sm"
              >
                <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">
                  {property.tenants?.length ? "Ajouter un colocataire" : "Associer un locataire"}
                </span>
              </button>
            )}
          </div>

        </div>

        {/* Views */}
        {property.view_count !== undefined && property.view_count > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Eye className="w-3 h-3" />
            <span>{property.view_count} vues</span>
          </div>
        )}
      </div>
    </div >
  );
}
