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
import { useTheme } from '../../theme-provider';
import { AddTenantButton } from './AddTenantButton';

interface QuickActionsProps {
    onAddTenant?: () => void;
    onExportCSV?: () => void;
    onSendReminders?: () => void;
    pendingCount?: number;
    overdueCount?: number;
    ownerId: string;
    profile: any;
}

export function QuickActions({
    onAddTenant,
    onExportCSV,
    onSendReminders,
    pendingCount = 0,
    overdueCount = 0,
    ownerId,
    profile
}: QuickActionsProps) {
    const [hoveredAction, setHoveredAction] = useState<string | null>(null);
    const { isDark } = useTheme();

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

            // onClick: onAddTenant, // Handled by AddTenantButton trigger
            type: 'custom' as const,
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
            href: '/interventions',
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
            href: '/gestion-locative/messages',
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
            href: '/documents-legaux',
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
                    p-2 rounded-lg
                    transition-transform duration-200
                    ${hoveredAction === action.id ? 'scale-110' : ''}
                    ${isDark ? 'bg-slate-800' : 'bg-gray-100'}
                `}>
                    <Icon className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'
                        }`} />
                </div>
                <span className={`
                    text-xs font-medium
                    hidden sm:inline
                    transition-colors duration-200
                    ${hoveredAction === action.id
                        ? isDark ? 'text-white' : 'text-gray-900'
                        : isDark ? 'text-slate-300' : 'text-gray-600'
                    }
                `}>
                    {action.label}
                </span>
                <span className={`
                    text-xs font-medium
                    sm:hidden
                    transition-colors duration-200
                    ${hoveredAction === action.id
                        ? isDark ? 'text-white' : 'text-gray-900'
                        : isDark ? 'text-slate-300' : 'text-gray-600'
                    }
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
                <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-500'
                    }`}>
                    Actions Rapides
                </span>
                <div className={`flex-1 h-px ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
            </div>

            {/* Actions Grid */}
            <div className="flex flex-wrap gap-2">
                {actions.map((action) => {
                    const baseClasses = `
                        relative flex items-center gap-2 px-3 py-2
                        rounded-lg border
                        transition-all duration-200
                        cursor-pointer
                        group
                        ${isDark
                            ? 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }
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
                                    w-3 h-3
                                    transition-all duration-200
                                    opacity-0 group-hover:opacity-100
                                    -translate-x-1 group-hover:translate-x-0
                                    ${isDark ? 'text-slate-600' : 'text-gray-400'}
                                `} />
                            </Link>
                        );
                    }

                    if (action.type === 'custom' && action.id === 'add-tenant') {
                        return (
                            <AddTenantButton
                                key={action.id}
                                ownerId={ownerId}
                                profile={profile}
                                trigger={
                                    <button
                                        className={baseClasses}
                                        onMouseEnter={() => setHoveredAction(action.id)}
                                        onMouseLeave={() => setHoveredAction(null)}
                                    >
                                        <ActionContent action={action} />
                                    </button>
                                }
                            />
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
