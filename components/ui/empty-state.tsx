import { type ReactNode } from "react";
import { Search, Home, AlertCircle, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  /**
   * Titre principal de l'état vide
   */
  title: string;
  /**
   * Description ou message secondaire
   */
  description?: string;
  /**
   * Label du bouton d'action
   */
  actionLabel?: string;
  /**
   * Callback appelé au clic sur le bouton
   */
  onAction?: () => void;
  /**
   * Icône personnalisée (par défaut: Search)
   */
  icon?: ReactNode;
  /**
   * Variante visuelle
   */
  variant?: "default" | "compact" | "large";
  /**
   * Classes CSS additionnelles
   */
  className?: string;
};

const defaultIcons = {
  default: Search,
  compact: Package,
  large: Home,
};

/**
 * Composant EmptyState - Affiche un état vide élégant
 * 
 * Utilisé quand il n'y a pas de résultats, pas de données, etc.
 * Design centré avec icône, texte et bouton d'action optionnel.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  variant = "default",
  className,
}: EmptyStateProps) {
  const DefaultIcon = defaultIcons[variant];
  const IconComponent = icon || <DefaultIcon className="h-12 w-12 text-white/40" />;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[32px] border border-white/10 bg-white/5 p-8 text-center",
        variant === "compact" && "p-6",
        variant === "large" && "p-12",
        className
      )}
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
        {typeof icon === "undefined" ? (
          <DefaultIcon className="h-10 w-10 text-white/40" />
        ) : (
          <div className="text-white/40">{IconComponent}</div>
        )}
      </div>

      <h3
        className={cn(
          "font-semibold text-white",
          variant === "compact" && "text-lg",
          variant === "default" && "text-xl",
          variant === "large" && "text-2xl"
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            "mt-2 max-w-md text-white/60",
            variant === "compact" && "text-sm",
            variant === "default" && "text-base",
            variant === "large" && "text-lg"
          )}
        >
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className={cn(
            "mt-6 rounded-full",
            variant === "compact" && "mt-4",
            variant === "large" && "mt-8"
          )}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}


