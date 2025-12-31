"use strict";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  actionComponent?: React.ReactNode;
  secondaryActionComponent?: React.ReactNode;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  children?: React.ReactNode; // Custom content (e.g. illustration)
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  actionComponent,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionComponent,
  className,
  children
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40",
      className
    )}>
      <div className="flex flex-col items-center max-w-md space-y-4">
        {/* Illustration / Icon */}
        <div className="bg-slate-800/50 p-4 rounded-full mb-2">
          {children ? children : Icon && <Icon className="w-8 h-8 md:w-10 md:h-10 text-slate-400" />}
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">
            {title}
          </h3>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full sm:w-auto items-center">
          {actionComponent ? (
            actionComponent
          ) : actionLabel && onAction ? (
            <Button
              onClick={onAction}
              size="lg"
              className="w-full sm:w-auto bg-[#F4C430] text-black hover:bg-[#F4C430]/90 font-semibold"
            >
              {actionLabel}
            </Button>
          ) : null}

          {secondaryActionComponent ? (
            secondaryActionComponent
          ) : secondaryActionLabel && onSecondaryAction ? (
            <Button
              variant="ghost"
              onClick={onSecondaryAction}
              className="w-full sm:w-auto text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {secondaryActionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
