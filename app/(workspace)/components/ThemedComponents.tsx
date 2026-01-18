"use client";

import { useTheme } from '@/components/workspace/providers/theme-provider';
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Wrapper pour une page complète - applique les couleurs de texte
 */
export function ThemedPage({ children, className = "" }: { children: ReactNode; className?: string }) {
    const { isDark } = useTheme();

    return (
        <div className={cn(
            "space-y-6",
            isDark ? 'text-white' : 'text-gray-900',
            className
        )}>
            {children}
        </div>
    );
}

/**
 * Card avec background et bordures adaptés au thème
 */
export function ThemedCard({
    children,
    className = "",
    hover = false
}: {
    children: ReactNode;
    className?: string;
    hover?: boolean;
}) {
    const { isDark } = useTheme();

    return (
        <div className={cn(
            "border rounded-xl",
            isDark
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-gray-200',
            hover && (isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50'),
            "transition-colors",
            className
        )}>
            {children}
        </div>
    );
}

/**
 * Texte avec variantes de couleur selon le thème
 */
export function ThemedText({
    children,
    variant = "primary",
    className = "",
    as: Component = "span"
}: {
    children: ReactNode;
    variant?: "primary" | "secondary" | "muted";
    className?: string;
    as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "div";
}) {
    const { isDark } = useTheme();

    const colorClasses = {
        primary: isDark ? 'text-white' : 'text-gray-900',
        secondary: isDark ? 'text-white/80' : 'text-gray-700',
        muted: isDark ? 'text-white/60' : 'text-gray-500'
    };

    return (
        <Component className={cn(colorClasses[variant], className)}>
            {children}
        </Component>
    );
}

/**
 * Empty State avec thème adapté
 */
export function ThemedEmptyState({
    icon: Icon,
    title,
    description,
    action
}: {
    icon: any;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    const { isDark } = useTheme();

    return (
        <ThemedCard className="p-12 text-center">
            <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                isDark ? 'bg-slate-800' : 'bg-gray-100'
            )}>
                <Icon className={cn(
                    "w-8 h-8",
                    isDark ? 'text-slate-600' : 'text-gray-400'
                )} />
            </div>
            <ThemedText as="h3" variant="primary" className="text-lg font-medium mb-2">
                {title}
            </ThemedText>
            <ThemedText as="p" variant="muted" className="text-sm max-w-md mx-auto mb-6">
                {description}
            </ThemedText>
            {action}
        </ThemedCard>
    );
}

/**
 * Badge avec couleur de fond adaptée au thème
 */
export function ThemedBadge({
    children,
    variant = "default",
    className = ""
}: {
    children: ReactNode;
    variant?: "default" | "success" | "warning" | "danger";
    className?: string;
}) {
    const { isDark } = useTheme();

    const variantClasses = {
        default: isDark
            ? 'bg-slate-500/20 text-slate-300'
            : 'bg-gray-200 text-gray-700',
        success: isDark
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-emerald-100 text-emerald-700',
        warning: isDark
            ? 'bg-amber-500/20 text-amber-300'
            : 'bg-amber-100 text-amber-700',
        danger: isDark
            ? 'bg-red-500/20 text-red-300'
            : 'bg-red-100 text-red-700'
    };

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
            variantClasses[variant],
            className
        )}>
            {children}
        </span>
    );
}

/**
 * Header de section avec titre et action
 */
export function ThemedSectionHeader({
    title,
    subtitle,
    action
}: {
    title: string;
    subtitle?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <ThemedText as="h1" variant="primary" className="text-2xl font-semibold">
                    {title}
                </ThemedText>
                {subtitle && (
                    <ThemedText as="p" variant="muted" className="text-sm mt-1">
                        {subtitle}
                    </ThemedText>
                )}
            </div>
            {action && <div className="flex gap-2">{action}</div>}
        </div>
    );
}

/**
 * Alert/Message box avec thème adapté
 */
export function ThemedAlert({
    children,
    variant = "info",
    className = ""
}: {
    children: ReactNode;
    variant?: "info" | "success" | "warning" | "error";
    className?: string;
}) {
    const { isDark } = useTheme();

    const variantClasses = {
        info: isDark
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            : 'bg-blue-50 border-blue-200 text-blue-700',
        success: isDark
            ? 'bg-green-500/10 border-green-500/30 text-green-300'
            : 'bg-green-50 border-green-200 text-green-700',
        warning: isDark
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-amber-50 border-amber-200 text-amber-700',
        error: isDark
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-red-50 border-red-200 text-red-700'
    };

    return (
        <div className={cn(
            "border rounded-xl p-4",
            variantClasses[variant],
            className
        )}>
            {children}
        </div>
    );
}
