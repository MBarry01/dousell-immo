"use client";

import { useState } from "react";
import { Share2, Copy, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Property } from "@/types/property";

type ShareButtonProps = {
  property: Property;
  shareUrl: string;
  variant?: "default" | "icon" | "full";
  className?: string;
};

/**
 * Génère un texte accrocheur pour le partage WhatsApp
 */
function generateWhatsAppText(property: Property, url: string): string {
  const district = (property.location as { district?: string }).district ||
    property.location.landmark ||
    property.location.city;
  const formattedPrice = formatCurrency(property.price);

  return `🏡 *${property.title}*
📍 ${district}
💰 ${formattedPrice} FCFA

Regarde ça : ${url}`;
}

/**
 * Détecte si on est sur mobile
 */
function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}

/**
 * Composant de partage WhatsApp optimisé pour le marché local
 * 
 * - Génère un texte accrocheur avec emojis
 * - Utilise whatsapp:// sur mobile et web.whatsapp.com sur desktop
 * - Fallback avec copie du lien
 */
export function ShareButton({
  property,
  shareUrl,
  variant = "default",
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // 1. Essayer l'API Native de partage (Mobile Experience)
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Découvre ce bien à ${property.location.city} : ${property.title}`,
          url: shareUrl,
        });
        toast.success("Partagé avec succès !");
        return;
      } catch (error) {
        // Ignorer l'erreur si l'utilisateur annule le partage (AbortError)
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
        } else {
          return; // Stop ici si annulé
        }
      }
    }

    // 2. Fallback : WhatsApp (Desktop ou si API non dispo)
    const text = generateWhatsAppText(property, shareUrl);
    const encodedText = encodeURIComponent(text);

    // Utiliser le bon protocole selon la plateforme
    const whatsappUrl = isMobile()
      ? `whatsapp://send?text=${encodedText}`
      : `https://web.whatsapp.com/send?text=${encodedText}`;

    // Essayer d'ouvrir WhatsApp
    try {
      window.open(whatsappUrl, "_blank");
      toast.success("Ouverture de WhatsApp...");
    } catch (_error) {
      // Fallback final : copier le texte
      handleCopy();
    }
  };

  const handleCopy = async () => {
    const text = generateWhatsAppText(property, shareUrl);

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback pour les navigateurs plus anciens
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      toast.success("Lien copié ! Partagez-le sur WhatsApp");

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Impossible de copier le lien");
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant="secondary"
        size="icon"
        onClick={handleShare}
        className={className}
        aria-label="Partager"
      >
        <Share2 className="h-5 w-5" />
      </Button>
    );
  }

  if (variant === "full") {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button
          onClick={handleShare}
          className="flex-1 rounded-full bg-[#25D366] text-white hover:bg-[#20ba58]"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Partager sur WhatsApp
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className="rounded-full"
          aria-label="Copier le lien"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  // Variant default
  return (
    <Button
      onClick={handleShare}
      variant="secondary"
      className={`rounded-full ${className}`}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      Partager
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          handleCopy();
        }}
        className="ml-2 h-6 w-6 rounded-full"
        aria-label="Copier le lien"
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </Button>
  );
}


