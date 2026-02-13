'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    MapPin,
    Home,
    MoreVertical,
    Bed,
    Bath,
    Maximize
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { VerificationUploadForm } from '@/components/dashboard/verification-upload-form';
import { Timer } from 'lucide-react';
import { PropertyCardActions } from './property-card-actions';
import type { Property } from '@/types/property';

type PropertyWithStatus = Property & {
    validation_status: 'pending' | 'payment_pending' | 'approved' | 'rejected';
    validation_rejection_reason?: string | null;
    verification_status?: 'pending' | 'verified' | 'rejected';
    rejection_reason?: string | null;
    views_count?: number;
    category?: "vente" | "location";
    owner_id?: string;
    // Occupation status (to be computed from leases)
    occupation_status?: 'occupied' | 'vacant' | 'maintenance';
};

interface PropertyCardProps {
    property: PropertyWithStatus;
    viewMode: 'grid' | 'list';
    onRefresh?: () => void;
}

const statusConfig = {
    pending: {
        label: 'Validation en cours',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20',
        icon: Clock,
    },
    payment_pending: {
        label: 'Paiement en attente',
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20',
        icon: Clock,
    },
    approved: {
        label: 'En ligne',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20',
        icon: CheckCircle,
    },
    rejected: {
        label: 'Refusé',
        color: 'bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20',
        icon: XCircle,
    },
};

const occupationConfig = {
    occupied: {
        label: 'Occupé',
        color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
        dot: 'bg-green-500',
    },
    vacant: {
        label: 'Vacant',
        color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
        dot: 'bg-orange-500',
    },
    maintenance: {
        label: 'Travaux',
        color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        dot: 'bg-purple-500',
    },
};

export function PropertyCard({ property, viewMode, onRefresh }: PropertyCardProps) {
    const status = statusConfig[property.validation_status || 'pending'];
    const StatusIcon = status.icon;
    const occupation = property.occupation_status ? occupationConfig[property.occupation_status] : null;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(price);
    };

    // List view
    if (viewMode === 'list') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
            >
                {/* Image */}
                <div className="relative w-24 h-24 md:w-32 md:h-24 rounded-lg overflow-hidden shrink-0">
                    {property.images?.[0] ? (
                        <Image
                            src={property.images[0]}
                            alt={property.title}
                            fill
                            className="object-cover"
                            sizes="128px"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Home className="w-8 h-8 text-muted-foreground" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{property.title}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                            {occupation && (
                                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border ${occupation.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${occupation.dot}`} />
                                    {occupation.label}
                                </span>
                            )}
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${status.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {property.location?.city}
                        </span>
                        {property.validation_status === 'approved' && (
                            <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                {property.views_count || 0} vues
                            </span>
                        )}
                    </div>

                    <p className="text-lg font-bold text-[#0F172A] dark:text-amber-500">
                        {formatPrice(property.price)} FCFA
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        asChild
                    >
                        <Link href={`/biens/${property.id}`}>Voir</Link>
                    </Button>
                    <PropertyCardActions
                        propertyId={property.id}
                        validationStatus={property.validation_status || 'pending'}
                        status={property.status || 'disponible'}
                        category={property.category}
                        teamId={property.team_id}
                        propertyTitle={property.title}
                        propertyAddress={property.location?.address || property.location?.city}
                        propertyPrice={property.price}
                        ownerId={property.owner_id}
                    />
                </div>
            </motion.div>
        );
    }

    // Grid view (default)
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50"
        >
            {/* Image */}
            <div className="relative h-48 w-full overflow-hidden">
                {property.images?.[0] ? (
                    <Image
                        src={property.images[0]}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        quality={75}
                    />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Home className="w-12 h-12 text-muted-foreground" />
                    </div>
                )}

                {/* Occupation badge overlay */}
                {occupation && (
                    <div className="absolute top-3 left-3">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${occupation.color}`}>
                            <span className={`w-2 h-2 rounded-full ${occupation.dot}`} />
                            {occupation.label}
                        </span>
                    </div>
                )}

                {/* Actions overlay - Top Right */}
                <div className="absolute top-3 right-3 z-10">
                    <PropertyCardActions
                        propertyId={property.id}
                        validationStatus={property.validation_status || 'pending'}
                        status={property.status || 'disponible'}
                        category={property.category}
                        teamId={property.team_id}
                        propertyTitle={property.title}
                        propertyAddress={property.location?.address || property.location?.city}
                        propertyPrice={property.price}
                        ownerId={property.owner_id}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="flex-1 font-semibold text-foreground line-clamp-2">
                        {property.title}
                    </h3>
                    <div className="flex items-center gap-2">
                        {/* Verification Status */}
                        {property.verification_status === 'verified' ? (
                            <VerifiedBadge size="sm" />
                        ) : property.verification_status === 'pending' ? (
                            <div className="flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                                <Timer className="h-3 w-3" />
                                <span>Vérif.</span>
                            </div>
                        ) : (
                            (!property.verification_status || property.verification_status === 'rejected') &&
                            (property.validation_status === 'approved' || property.validation_status === 'pending') && (
                                <VerificationUploadForm propertyId={property.id} onSuccess={onRefresh} />
                            )
                        )}

                        {/* Validation Status */}
                        <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold border ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                        </span>


                    </div>
                </div>

                {/* Rejection feedback */}
                {property.validation_status === 'rejected' && property.rejection_reason && (
                    <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-300 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-red-300 mb-1">Refusé</p>
                                <p className="text-xs text-red-200/80">{property.rejection_reason}</p>
                            </div>
                        </div>
                    </div>
                )}

                <p className="mb-3 text-lg font-bold text-[#0F172A] dark:text-amber-500">
                    {formatPrice(property.price)} FCFA
                </p>

                <p className="mb-4 text-sm text-slate-600 dark:text-muted-foreground">
                    {property.location?.city}
                    {(property.location as { district?: string })?.district &&
                        `, ${(property.location as { district?: string }).district}`}
                </p>

                {property.validation_status === 'approved' && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{property.views_count || 0} vue{(property.views_count || 0) > 1 ? 's' : ''}</span>
                    </div>
                )}

                <Button
                    variant="secondary"
                    className="mt-4 w-full rounded-full bg-[#0F172A] text-white hover:bg-[#0F172A]/90 dark:!bg-accent/50 dark:!border dark:!border-border dark:!text-foreground dark:hover:!bg-accent"
                    asChild
                >
                    <Link href={`/biens/${property.id}`}>Voir l&apos;annonce</Link>
                </Button>
            </div>
        </motion.div>
    );
}
