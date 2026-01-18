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
      "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border-2 border-dashed transition-colors",
      "border-gray-300 bg-gray-50/50 dark:border-slate-800 dark:bg-slate-900/40",
      className
    )}>
      <div className="flex flex-col items-center max-w-md space-y-4">
        {/* Illustration / Icon */}
        <div className={`p-4 rounded-full mb-2 bg-white shadow-sm border border-gray-100 dark:bg-slate-800/50 dark:border-none`}>
          {children ? children : Icon && <Icon className="w-8 h-8 md:w-10 md:h-10 text-gray-400 dark:text-slate-400" />}
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm md:text-base leading-relaxed text-gray-500 dark:text-slate-400">
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
              className="w-full sm:w-auto font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-[#F4C430] dark:text-black dark:hover:bg-[#F4C430]/90"
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
              className="w-full sm:w-auto text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
            >
              {secondaryActionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
