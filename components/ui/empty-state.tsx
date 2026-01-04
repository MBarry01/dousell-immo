"use strict";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/app/(webapp)/theme-provider";

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
  const { isDark } = useTheme();

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border-2 border-dashed transition-colors",
      isDark
        ? "border-slate-800 bg-slate-900/40"
        : "border-gray-300 bg-gray-50/50",
      className
    )}>
      <div className="flex flex-col items-center max-w-md space-y-4">
        {/* Illustration / Icon */}
        <div className={`p-4 rounded-full mb-2 ${isDark ? 'bg-slate-800/50' : 'bg-white shadow-sm border border-gray-100'}`}>
          {children ? children : Icon && <Icon className={`w-8 h-8 md:w-10 md:h-10 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />}
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          <p className={`text-sm md:text-base leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
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
              className={`w-full sm:w-auto font-semibold ${isDark ? 'bg-[#F4C430] text-black hover:bg-[#F4C430]/90' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
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
              className={`w-full sm:w-auto ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              {secondaryActionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
