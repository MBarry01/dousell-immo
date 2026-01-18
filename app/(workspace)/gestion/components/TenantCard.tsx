'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    User,
    MapPin,
    Phone,
    Mail,
    Calendar,
    MoreVertical,
    CheckCircle,
    Eye,
    Edit2,
    Trash2,
    RotateCcw,
    FileText,
    Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/workspace/providers/theme-provider';

interface Tenant {
    id: string;
    name: string;
    property: string;
    phone?: string;
    email?: string;
    rentAmount: number;
    status: 'paid' | 'pending' | 'overdue';
    dueDate?: number;
    startDate?: string;
    last_transaction_id?: string;
    period_month?: number;
    period_year?: number;
    period_start?: string | null;
    period_end?: string | null;
}

interface TenantCardProps {
    tenant: Tenant;
    onConfirmPayment?: (leaseId: string, transactionId?: string) => void;
    onViewReceipt?: (tenant: Tenant) => void;
    onEdit?: (tenant: Tenant) => void;
    onTerminate?: (leaseId: string, name: string) => void;
    onReactivate?: (leaseId: string, name: string) => void;
    onInvite?: (leaseId: string) => void;
    isViewingTerminated?: boolean;
}

const statusConfig = {
    paid: {
        label: 'Payé',
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/20',
        dot: 'bg-green-500',
        glow: 'shadow-green-500/5'
    },
    pending: {
        label: 'En attente',
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        border: 'border-yellow-500/20',
        dot: 'bg-yellow-500',
        glow: 'shadow-yellow-500/5'
    },
    overdue: {
        label: 'En retard',
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20',
        dot: 'bg-red-500',
        glow: 'shadow-red-500/10'
    }
};

const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function TenantCard({
    tenant,
    onConfirmPayment,
    onViewReceipt,
    onEdit,
    onTerminate,
    onReactivate,
    onInvite,
    isViewingTerminated = false
}: TenantCardProps) {
    const router = useRouter();
    const { isDark } = useTheme();

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatAmount = (amount: number) => {
        return amount.toLocaleString('fr-FR');
    };

    const periodLabel = tenant.period_month && tenant.period_year
        ? `${monthNames[tenant.period_month - 1]} ${tenant.period_year}`
        : 'Non défini';

    const status = statusConfig[tenant.status];

    const handleCardClick = () => {
        router.push(`/gestion/locataires/${tenant.id}`);
    };

    return (
        <div
            onClick={handleCardClick}
            className={`
            relative group cursor-pointer
            border ${status.border} rounded-xl
            p-4 md:p-5
            transition-all duration-200
            ${status.glow} shadow-lg
            ${isDark
                    ? 'bg-slate-900/80 hover:bg-slate-900 hover:border-slate-700'
                    : 'bg-white hover:bg-gray-50 hover:border-gray-300'
                }
        `}>


            <div className="absolute top-3 right-3 flex items-center gap-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                {/* Status Badge REMOVED as per user request for uniformity (dots only) */}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-200'
                                }`}
                        >
                            <MoreVertical className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className={`w-56 p-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
                        }`}>
                        {/* VIEW RECEIPT - Only if Paid */}
                        {tenant.status === 'paid' && onViewReceipt && (
                            <DropdownMenuItem
                                onClick={() => onViewReceipt(tenant)}
                                className={`cursor-pointer mb-1 ${isDark
                                        ? 'text-slate-300 focus:text-white hover:bg-slate-800 focus:bg-slate-800'
                                        : 'text-gray-700 focus:text-gray-900 hover:bg-gray-100 focus:bg-gray-100'
                                    }`}
                            >
                                <Eye className={`mr-2 h-4 w-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`} />
                                Voir quittance
                            </DropdownMenuItem>
                        )}

                        {/* MARK PAID - Always visible, disabled if paid */}
                        {onConfirmPayment && (
                            <DropdownMenuItem
                                onClick={() => tenant.status !== 'paid' && onConfirmPayment(tenant.id, tenant.last_transaction_id)}
                                disabled={tenant.status === 'paid'}
                                className={`cursor-pointer mb-1 ${tenant.status === 'paid'
                                        ? isDark
                                            ? 'opacity-50 cursor-not-allowed text-slate-500'
                                            : 'opacity-50 cursor-not-allowed text-gray-400'
                                        : isDark
                                            ? 'text-slate-300 hover:bg-slate-800 focus:bg-slate-800 focus:text-white'
                                            : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900'
                                    }`}
                            >
                                <CheckCircle className={`mr-2 h-4 w-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`} />
                                Marquer payé
                            </DropdownMenuItem>
                        )}

                        {onInvite && tenant.email && (
                            <DropdownMenuItem
                                onClick={() => onInvite(tenant.id)}
                                className={`cursor-pointer mb-1 ${isDark
                                        ? 'text-slate-300 focus:text-white hover:bg-slate-800 focus:bg-slate-800'
                                        : 'text-gray-700 focus:text-gray-900 hover:bg-gray-100 focus:bg-gray-100'
                                    }`}
                            >
                                <Send className={`mr-2 h-4 w-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`} />
                                Inviter au portail
                            </DropdownMenuItem>
                        )}

                        {onEdit && (
                            <DropdownMenuItem
                                onClick={() => onEdit(tenant)}
                                className={`cursor-pointer mb-1 ${isDark
                                        ? 'text-slate-300 focus:text-white hover:bg-slate-800 focus:bg-slate-800'
                                        : 'text-gray-700 focus:text-gray-900 hover:bg-gray-100 focus:bg-gray-100'
                                    }`}
                            >
                                <Edit2 className={`mr-2 h-4 w-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`} />
                                Modifier
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className={`my-1 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />

                        {isViewingTerminated && onReactivate ? (
                            <DropdownMenuItem
                                onClick={() => onReactivate(tenant.id, tenant.name)}
                                className={`cursor-pointer ${isDark
                                        ? 'text-slate-300 hover:bg-slate-800 focus:bg-slate-800'
                                        : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'
                                    }`}
                            >
                                <RotateCcw className={`mr-2 h-4 w-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`} />
                                Réactiver
                            </DropdownMenuItem>
                        ) : onTerminate && (
                            <DropdownMenuItem
                                onClick={() => onTerminate(tenant.id, tenant.name)}
                                className="text-red-500 focus:text-red-600 hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-900/10 dark:focus:bg-red-900/10 cursor-pointer"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Résilier
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>


            {/* Main content */}
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="shrink-0">
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-semibold hover:border-blue-500/40 transition-colors">
                        {getInitials(tenant.name)}

                        {/* Unified Status Dot */}
                        <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                            {tenant.status === 'pending' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>}
                            {tenant.status === 'overdue' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                            <span className={`
                                relative inline-flex rounded-full h-3 w-3 border-2
                                ${isDark ? 'border-slate-900' : 'border-white'}
                                ${tenant.status === 'paid' ? 'bg-green-500' : ''}
                                ${tenant.status === 'pending' ? 'bg-yellow-500' : ''}
                                ${tenant.status === 'overdue' ? 'bg-red-500' : ''}
                            `}></span>
                        </span>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pr-8">
                    <div className="block group/link">
                        <h3
                            className={`font-semibold text-base truncate mb-1 group-hover/link:text-blue-400 transition-colors ${isDark ? 'text-white' : 'text-gray-900'
                                }`}
                            title={tenant.name}
                        >
                            {tenant.name}
                        </h3>
                    </div>

                    <div className="space-y-1.5">
                        {/* Property */}
                        <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            <MapPin className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                            <span className="truncate">{tenant.property}</span>
                        </div>

                        {/* Contact info - show on hover or always on mobile */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            {tenant.phone && (
                                <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                    <Phone className="w-3 h-3" />
                                    <span>{tenant.phone}</span>
                                </div>
                            )}
                            {tenant.email && (
                                <div className={`flex items-center gap-1.5 text-xs min-w-0 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                    <Mail className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{tenant.email}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer - Amount and Period */}
            <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'
                }`}>
                <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    <Calendar className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                    <span>{periodLabel}</span>
                </div>

                <div className="text-right">
                    <span className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                        {formatAmount(tenant.rentAmount)}
                    </span>
                    <span className={`text-xs ml-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>FCFA</span>
                </div>
            </div>

            {/* Quick action button for pending/overdue */}
            {(tenant.status === 'pending' || tenant.status === 'overdue') && onConfirmPayment && (
                <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <Button
                        onClick={() => onConfirmPayment(tenant.id, tenant.last_transaction_id)}
                        className={`
                            w-full mt-4
                            ${tenant.status === 'overdue'
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                                : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'
                            }
                        `}
                        variant="ghost"
                        size="sm"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Encaisser le loyer
                    </Button>
                </div>
            )}
        </div>
    );
}
