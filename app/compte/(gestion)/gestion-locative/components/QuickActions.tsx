'use client';

import { useState } from 'react';
import {
    UserPlus,
    Receipt,
    FileText,
    Download,
    Bell,
    Wrench,
    MessageSquare,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface QuickActionsProps {
    onAddTenant?: () => void;
    onExportCSV?: () => void;
    onSendReminders?: () => void;
    pendingCount?: number;
    overdueCount?: number;
}

export function QuickActions({
    onAddTenant,
    onExportCSV,
    onSendReminders,
    pendingCount = 0,
    overdueCount = 0
}: QuickActionsProps) {
    const [hoveredAction, setHoveredAction] = useState<string | null>(null);

    const actions = [
        {
            id: 'add-tenant',
            label: 'Nouveau Locataire',
            shortLabel: 'Nouveau',
            icon: UserPlus,
            color: 'text-white',
            bgColor: 'bg-slate-900',
            hoverBg: 'hover:bg-slate-800',
            borderColor: 'border-slate-800',
            onClick: onAddTenant,
            type: 'button' as const,
        },
        {
            id: 'send-reminders',
            label: 'Envoyer Relances',
            shortLabel: 'Relances',
            icon: Bell,
            color: 'text-white',
            bgColor: 'bg-slate-900',
            hoverBg: 'hover:bg-slate-800',
            borderColor: 'border-slate-800',
            onClick: onSendReminders,
            type: 'button' as const,
            badge: overdueCount > 0 ? overdueCount : undefined,
        },
        {
            id: 'interventions',
            label: 'Interventions',
            shortLabel: 'Travaux',
            icon: Wrench,
            color: 'text-white',
            bgColor: 'bg-slate-900',
            hoverBg: 'hover:bg-slate-800',
            borderColor: 'border-slate-800',
            href: '/compte/interventions',
            type: 'link' as const,
        },
        {
            id: 'messages',
            label: 'Messagerie',
            shortLabel: 'Messages',
            icon: MessageSquare,
            color: 'text-white',
            bgColor: 'bg-slate-900',
            hoverBg: 'hover:bg-slate-800',
            borderColor: 'border-slate-800',
            href: '/compte/gestion-locative/messages',
            type: 'link' as const,
        },
        {
            id: 'legal',
            label: 'Documents Juridiques',
            shortLabel: 'Juridique',
            icon: FileText,
            color: 'text-white',
            bgColor: 'bg-slate-900',
            hoverBg: 'hover:bg-slate-800',
            borderColor: 'border-slate-800',
            href: '/compte/legal',
            type: 'link' as const,
        },
        {
            id: 'export',
            label: 'Exporter CSV',
            shortLabel: 'Export',
            icon: Download,
            color: 'text-white',
            bgColor: 'bg-slate-900',
            hoverBg: 'hover:bg-slate-800',
            borderColor: 'border-slate-800',
            onClick: onExportCSV,
            type: 'button' as const,
        },
    ];

    const ActionContent = ({ action }: { action: typeof actions[0] }) => {
        const Icon = action.icon;
        return (
            <>
                <div className={`
                    p-2 rounded-lg ${action.bgColor}
                    transition-transform duration-200
                    ${hoveredAction === action.id ? 'scale-110' : ''}
                `}>
                    <Icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <span className={`
                    text-xs font-medium text-slate-300
                    hidden sm:inline
                    transition-colors duration-200
                    ${hoveredAction === action.id ? 'text-white' : ''}
                `}>
                    {action.label}
                </span>
                <span className={`
                    text-xs font-medium text-slate-300
                    sm:hidden
                    transition-colors duration-200
                    ${hoveredAction === action.id ? 'text-white' : ''}
                `}>
                    {action.shortLabel}
                </span>
                {action.badge && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] text-white font-bold items-center justify-center">
                            {action.badge}
                        </span>
                    </span>
                )}
            </>
        );
    };

    return (
        <div className="mb-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions Rapides
                </span>
                <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            {/* Actions Grid */}
            <div className="flex flex-wrap gap-2">
                {actions.map((action) => {
                    const baseClasses = `
                        relative flex items-center gap-2 px-3 py-2
                        rounded-lg border ${action.borderColor}
                        ${action.bgColor} ${action.hoverBg}
                        transition-all duration-200
                        cursor-pointer
                        group
                    `;

                    if (action.type === 'link') {
                        return (
                            <Link
                                key={action.id}
                                href={action.href!}
                                className={baseClasses}
                                onMouseEnter={() => setHoveredAction(action.id)}
                                onMouseLeave={() => setHoveredAction(null)}
                            >
                                <ActionContent action={action} />
                                <ChevronRight className={`
                                    w-3 h-3 text-slate-600 
                                    transition-all duration-200
                                    opacity-0 group-hover:opacity-100
                                    -translate-x-1 group-hover:translate-x-0
                                `} />
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={action.id}
                            onClick={action.onClick}
                            className={baseClasses}
                            onMouseEnter={() => setHoveredAction(action.id)}
                            onMouseLeave={() => setHoveredAction(null)}
                            disabled={!action.onClick}
                        >
                            <ActionContent action={action} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
