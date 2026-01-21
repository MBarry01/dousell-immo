"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Loader2, ChevronDown, Upload, User, FileSpreadsheet, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';
import { createNewLease } from "../actions";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { GenerateContractModal } from '@/components/contracts/GenerateContractModal';
import { useTheme } from '@/components/workspace/providers/theme-provider';
import { getPremiumBranding } from '../config/actions';
import confetti from 'canvas-confetti';

interface AddTenantButtonProps {
    ownerId: string;
    trigger?: React.ReactNode;
    profile?: any; // To allow flexibility with Supabase types
    initialData?: {
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
        amount?: number;
        day?: number;
        startDate?: string;
        endDate?: string;
    };
}

const FIRST_TENANT_KEY = 'dousell_first_tenant_created';

export function AddTenantButton({ ownerId, trigger, initialData, profile }: AddTenantButtonProps) {
    const [open, setOpen] = useState(false);
    const [bulkImportOpen, setBulkImportOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showProfileAlert, setShowProfileAlert] = useState(false);
    const { isDark } = useTheme();

    const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);

    // Contract Generation Flow State
    const [showContractPrompt, setShowContractPrompt] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);

    const [createdLease, setCreatedLease] = useState<{ id: string, name: string, amount: number, depositMonths: number } | null>(null);

    const router = useRouter();

    // Confetti celebration for first tenant creation - Golden luxury effect (Desktop optimized)
    const triggerConfetti = useCallback(() => {
        // Palette dorée luxe
        const goldColors = [
            '#F4C430', // Or Dousell (primary)
            '#FFD700', // Or pur
            '#DAA520', // Goldenrod
            '#B8860B', // Dark goldenrod
            '#FFC107', // Amber
            '#FFECB3', // Or clair / champagne
        ];

        // Détection desktop pour ajuster l'intensité
        const isDesktop = window.innerWidth >= 1024;
        const particleMultiplier = isDesktop ? 1.5 : 1;

        // Burst initial central - plus large sur desktop
        confetti({
            particleCount: Math.floor(120 * particleMultiplier),
            spread: isDesktop ? 100 : 70,
            origin: { y: 0.6, x: 0.5 },
            colors: goldColors,
            shapes: ['circle', 'square'],
            scalar: isDesktop ? 1.4 : 1.2,
            gravity: 0.8,
            ticks: 350,
            drift: 0,
        });

        // Bursts supplémentaires sur desktop (gauche et droite)
        if (isDesktop) {
            setTimeout(() => {
                confetti({
                    particleCount: 60,
                    spread: 60,
                    origin: { y: 0.7, x: 0.25 },
                    colors: goldColors,
                    shapes: ['circle'],
                    scalar: 1.2,
                    gravity: 0.9,
                });
                confetti({
                    particleCount: 60,
                    spread: 60,
                    origin: { y: 0.7, x: 0.75 },
                    colors: goldColors,
                    shapes: ['circle'],
                    scalar: 1.2,
                    gravity: 0.9,
                });
            }, 200);
        }

        // Canons latéraux dorés
        const duration = isDesktop ? 3000 : 2500;
        const end = Date.now() + duration;

        const frame = () => {
            // Canon gauche
            confetti({
                particleCount: isDesktop ? 3 : 2,
                angle: 60,
                spread: 50,
                origin: { x: 0, y: 0.65 },
                colors: goldColors,
                shapes: ['circle'],
                scalar: isDesktop ? 1.1 : 0.9,
                gravity: 1,
            });
            // Canon droit
            confetti({
                particleCount: isDesktop ? 3 : 2,
                angle: 120,
                spread: 50,
                origin: { x: 1, y: 0.65 },
                colors: goldColors,
                shapes: ['circle'],
                scalar: isDesktop ? 1.1 : 0.9,
                gravity: 1,
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };

        frame();

        // Burst final après 1.5s - Grand finale
        setTimeout(() => {
            confetti({
                particleCount: Math.floor(80 * particleMultiplier),
                spread: isDesktop ? 140 : 100,
                origin: { y: 0.5, x: 0.5 },
                colors: goldColors,
                shapes: ['circle'],
                scalar: isDesktop ? 1.8 : 1.5,
                gravity: 0.5,
                ticks: 250,
            });
        }, 1500);
    }, []);

    const handleTriggerClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Check if profile has minimal information (just company name is enough) via props (optimistic)
        const isProfileComplete = profile && (profile.full_name || profile.company_name);

        if (isProfileComplete) {
            setOpen(true);
            return;
        }

        // 2. If prop check fails, double check with server action (bypasses cache)
        const toastId = toast.loading("Vérification du profil...");
        try {
            const result = await getPremiumBranding();
            toast.dismiss(toastId);

            if (result.success && result.data) {
                const fresh = result.data;
                if (fresh.full_name || fresh.company_name) {
                    setOpen(true);
                    return;
                }
            }
        } catch (err) {
            console.error("Error checking profile", err);
            toast.dismiss(toastId);
        }

        setShowProfileAlert(true);
    };

    const renderTrigger = () => {
        if (trigger) {
            if (React.isValidElement(trigger)) {
                return React.cloneElement(trigger as React.ReactElement<any>, {
                    onClick: (e: React.MouseEvent) => {
                        const childProps = (trigger as React.ReactElement<any>).props;
                        if (childProps.onClick) childProps.onClick(e);
                        handleTriggerClick(e);
                    }
                });
            }
            return <span onClick={handleTriggerClick} className="cursor-pointer">{trigger}</span>;
        }

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className={`${isDark ? 'bg-[#F4C430] text-black hover:bg-[#F4C430]/90' : 'bg-slate-900 text-white hover:bg-slate-800'} rounded-lg h-9 px-2 sm:px-4 font-medium text-sm transition-all`}>
                        <Plus className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Ajouter</span>
                        <ChevronDown className="w-3 h-3 ml-1 sm:ml-2 opacity-70" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} min-w-[200px] p-1`}>
                    <DropdownMenuItem
                        onClick={handleTriggerClick}
                        className={`flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white' : 'text-gray-700 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100'}`}
                    >
                        <User className="w-4 h-4" />
                        <span>Ajouter un locataire</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setBulkImportOpen(true)}
                        className={`flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white' : 'text-gray-700 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100'}`}
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Ajouter en masse</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const tenantNameVal = formData.get('tenant_name') as string;
        const monthlyAmount = Number(formData.get('monthly_amount'));
        const depositMonths = Number(formData.get('deposit_months')) || 2;

        const data = {
            owner_id: ownerId,
            tenant_name: tenantNameVal,
            tenant_phone: formData.get('tenant_phone') as string,
            tenant_email: formData.get('tenant_email') as string,
            property_address: formData.get('property_address') as string,
            monthly_amount: monthlyAmount,
            billing_day: Number(formData.get('billing_day')) || 5,
            start_date: formData.get('start_date') as string,
            end_date: formData.get('end_date') as string || null,
            status: 'active' as const,
            deposit_months: depositMonths, // Pass this to action
        };

        const result = await createNewLease(data);
        setLoading(false);

        if (result.success && result.id) {
            const isFirstTenant = !localStorage.getItem(FIRST_TENANT_KEY);
            if (isFirstTenant) {
                localStorage.setItem(FIRST_TENANT_KEY, 'true');
                triggerConfetti();
            }
            toast.success('Locataire créé ! Place à la configuration...');

            // Open Wizard instead of closing
            setCreatedLease({
                id: result.id,
                name: tenantNameVal,
                amount: monthlyAmount,
                depositMonths: depositMonths
            });
            setOpen(false); // Close the form modal first

            // Small delay to ensure modal is closed before opening wizard
            setTimeout(() => {
                setShowOnboardingWizard(true); // Open the wizard
            }, 100);

            // Force hard refresh to bypass cache
            router.refresh();
        } else {
            const errorMsg = result.error || 'Erreur lors de la création';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    return (
        <>
            {renderTrigger()}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="z-[100] fixed top-[4%] left-[50%] translate-x-[-50%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%] w-[90vw] sm:w-full max-w-lg max-h-[92vh] overflow-y-auto overflow-x-hidden bg-slate-900 border-slate-800 text-white px-4 pt-4 pb-24 sm:p-6 outline-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-white">
                            {initialData ? "Exemple de Bail (Démo)" : "Nouveau Locataire"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {initialData ? "Ces données sont pré-remplies pour tester la création." : "Remplissez les informations pour créer un nouveau bail"}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        {/* Zone d'erreur critique */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-3">
                                <span className="text-red-500 mt-0.5">⚠️</span>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-red-500">Erreur Bloquante</h4>
                                    <p className="text-sm text-red-200/90">{error}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Nom complet <span className="text-red-400">*</span>
                                </label>
                                <Input
                                    name="tenant_name"
                                    placeholder="ex: Mamadou Diop"
                                    defaultValue={initialData?.name}
                                    required
                                    className="bg-slate-800 border-slate-700 text-white"
                                    whileFocus={{ scale: 1 }}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Téléphone</label>
                                <Input
                                    name="tenant_phone"
                                    placeholder="ex: +221 77..."
                                    defaultValue={initialData?.phone}
                                    className="bg-slate-800 border-slate-700 text-white"
                                    whileFocus={{ scale: 1 }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Email <span className="text-red-400">*</span>
                                <span className="text-xs text-slate-500 ml-2">(pour l&apos;envoi des quittances)</span>
                            </label>
                            <Input
                                name="tenant_email"
                                type="email"
                                placeholder="ex: locataire@email.com"
                                defaultValue={initialData?.email}
                                required
                                className="bg-slate-800 border-slate-700 text-white"
                                whileFocus={{ scale: 1 }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Adresse du bien <span className="text-red-400">*</span>
                            </label>
                            <Input
                                name="property_address"
                                placeholder="ex: Appartement F3, Almadies, Dakar"
                                defaultValue={initialData?.address}
                                required
                                className="bg-slate-800 border-slate-700 text-white"
                                whileFocus={{ scale: 1 }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Loyer (FCFA) <span className="text-red-400">*</span>
                                </label>
                                <Input
                                    name="monthly_amount"
                                    type="number"
                                    placeholder="500000"
                                    defaultValue={initialData?.amount}
                                    required
                                    className="bg-slate-800 border-slate-700 text-white font-mono"
                                    whileFocus={{ scale: 1 }}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Jour de paiement</label>
                                <Input
                                    name="billing_day"
                                    type="number"
                                    min="1"
                                    max="31"
                                    defaultValue={initialData?.day || 5}
                                    className="bg-slate-800 border-slate-700 text-white"
                                    whileFocus={{ scale: 1 }}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Début bail <span className="text-red-400">*</span>
                                </label>
                                <Input
                                    name="start_date"
                                    type="date"
                                    defaultValue={initialData?.startDate}
                                    required
                                    className="bg-slate-800 border-slate-700 text-white h-10 w-full px-3 block [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:p-1"
                                    whileFocus={{ scale: 1 }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Fin bail <span className="text-red-400">*</span>
                                <span className="text-xs text-slate-500 ml-2">(pour les alertes juridiques J-180 et J-90)</span>
                            </label>
                            <Input
                                name="end_date"
                                type="date"
                                defaultValue={initialData?.endDate}
                                required
                                className="bg-slate-800 border-slate-700 text-white h-10 w-full px-3 block [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:p-1"
                                whileFocus={{ scale: 1 }}
                            />
                        </div>

                        {/* Caution Field */}
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                            <label className="text-sm font-medium text-slate-300 flex justify-between">
                                <span>Mois de caution</span>
                                <span className="text-xs text-[#F4C430]">Recommandé: 2 mois</span>
                            </label>
                            <div className="flex gap-2 mt-2">
                                {[1, 2, 3].map((m) => (
                                    <label key={m} className="flex-1 cursor-pointer">
                                        <input type="radio" name="deposit_months" value={m} className="peer hidden" defaultChecked={m === 2} />
                                        <div className="h-9 flex items-center justify-center rounded-md border border-slate-600 bg-slate-800 text-slate-300 peer-checked:bg-[#F4C430] peer-checked:text-black peer-checked:border-[#F4C430] peer-checked:font-bold transition-all text-sm">
                                            {m} Mois
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-[#F4C430] dark:text-black dark:hover:bg-[#F4C430]/90 h-11 text-base font-semibold rounded-lg disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Création en cours...</span>
                                    </div>
                                ) : (
                                    "Confirmer & Créer le Bail"
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog >

            {/* PROMPT: Generate Contract? */}
            <Dialog open={showContractPrompt} onOpenChange={setShowContractPrompt}>
                <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Générer le contrat de bail ?</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Le locataire a été créé avec succès. Souhaitez-vous générer et personnaliser le contrat de bail maintenant ?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setShowContractPrompt(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            Non, plus tard
                        </Button>
                        <Button
                            onClick={() => {
                                setShowContractPrompt(false);
                                // Small delay to prevent body scroll locking issues between modals
                                setTimeout(() => setShowContractModal(true), 150);
                            }}
                            className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-[#F4C430] dark:text-black dark:hover:bg-[#F4C430]/90 transition-colors"
                        >
                            Oui, générer le contrat
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL: Generate Contract */}
            {
                createdLease && (
                    <GenerateContractModal
                        leaseId={createdLease.id}
                        tenantName={createdLease.name}
                        open={showContractModal}
                        onOpenChange={setShowContractModal}
                        onSuccess={() => {
                            // Contract generated successfully
                            setShowContractModal(false);
                        }}
                    />
                )
            }
            {/* ALERT: Profile Incomplete */}
            <Dialog open={showProfileAlert} onOpenChange={setShowProfileAlert}>
                <DialogContent className="sm:max-w-md bg-slate-900 border-red-900/50 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500">
                            <span>⚠️ Profil Incomplet</span>
                        </DialogTitle>
                        <DialogDescription className="text-slate-300 pt-2">
                            Pour créer des baux valides, vous devez d&apos;abord renseigner votre nom ou raison sociale dans la configuration.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setShowProfileAlert(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={() => router.push('/gestion/config')}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Compléter mon profil
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* BULK IMPORT DIALOG */}
            <BulkImportDialog
                open={bulkImportOpen}
                onOpenChange={setBulkImportOpen}
                ownerId={ownerId}
                onSuccess={() => {
                    setBulkImportOpen(false);
                    router.refresh();
                }}
            />

            {/* ONBOARDING WIZARD */}
            <TenantOnboardingWizard
                open={showOnboardingWizard}
                onOpenChange={setShowOnboardingWizard}
                leaseData={createdLease}
                profile={profile}
                onComplete={() => {
                    setShowOnboardingWizard(false);
                    // Force full page reload with cache bypass to show updated data
                    // Using location.href instead of reload() to ensure fresh fetch
                    window.location.href = window.location.pathname + '?t=' + Date.now();
                }}
            />
        </>
    );
}

// --- ONBOARDING WIZARD COMPONENT ---

import { Check, Mail, Wallet, FileText, ArrowRight, ShieldCheck } from "lucide-react";
import { confirmPayment, sendWelcomePack } from "../actions";

import { generateLeaseContract } from '@/lib/actions/contract-actions';

function TenantOnboardingWizard({ open, onOpenChange, leaseData, profile, onComplete }: any) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [contractGenerated, setContractGenerated] = useState(false);

    // State for Step 1 - Par défaut les deux sont cochés (cas d'usage standard)
    const [stats, setStats] = useState({ rentPaid: true, depositPaid: true });

    // IMPORTANT: Reset wizard state when dialog opens
    useEffect(() => {
        if (open) {
            console.log("[Wizard] Dialog opened - resetting states");
            setStep(1);
            setContractGenerated(false);
            // Par défaut les deux sont cochés (caution + premier loyer = cas standard)
            setStats({ rentPaid: true, depositPaid: true });
            setLoading(false);
        }
    }, [open]);

    if (!leaseData) return null;

    const totalDeposit = leaseData.amount * leaseData.depositMonths;
    const totalRent = leaseData.amount;
    const grandTotal = totalDeposit + totalRent;

    // Confirm payments using server action (properly invalidates cache)
    const handleConfirmPayments = async () => {
        // Vérifier qu'au moins une case est cochée
        if (!stats.depositPaid && !stats.rentPaid) {
            toast.error("Veuillez cocher au moins un paiement à valider");
            return;
        }

        setLoading(true);
        console.log("[Wizard] handleConfirmPayments called - depositPaid:", stats.depositPaid, "rentPaid:", stats.rentPaid);
        try {
            // Use the server action confirmPayment with silent=true to skip individual emails
            // (all documents will be sent together in the welcome pack)
            if (stats.depositPaid) {
                console.log("[Wizard] Confirming deposit payment for lease:", leaseData.id);
                const result = await confirmPayment(leaseData.id, undefined, 0, new Date().getFullYear(), true);
                console.log("[Wizard] Deposit confirmation result:", result);
                if (!result.success) {
                    toast.error(`Erreur caution: ${result.error}`);
                }
            }

            if (stats.rentPaid) {
                const currentMonth = new Date().getMonth() + 1;
                const currentYear = new Date().getFullYear();
                console.log("[Wizard] Confirming rent payment for lease:", leaseData.id, "month:", currentMonth, "year:", currentYear);
                const result = await confirmPayment(leaseData.id, undefined, currentMonth, currentYear, true);
                console.log("[Wizard] Rent confirmation result:", result);
                if (!result.success) {
                    toast.error(`Erreur loyer: ${result.error}`);
                }
            }

            // Forcer l'invalidation du cache via l'API pour s'assurer que les données sont fraîches
            try {
                await fetch('/api/clear-cache', { method: 'DELETE' });
                console.log("[Wizard] Cache cleared via API");
            } catch (cacheErr) {
                console.warn("[Wizard] Cache clear failed (non-blocking):", cacheErr);
            }

            console.log("[Wizard] Moving to step 2");
            setStep(2);
        } catch (e) {
            console.error("[Wizard] Error in handleConfirmPayments:", e);
            toast.error("Erreur lors de l'encaissement");
        } finally {
            setLoading(false);
        }
    };

    // Generate contract and then send pack
    const handleGenerateAndSendPack = async () => {
        setLoading(true);
        console.log("[Wizard] handleGenerateAndSendPack called - contractGenerated:", contractGenerated);
        try {
            // Step 1: Generate contract if not done
            if (!contractGenerated) {
                console.log("[Wizard] Generating contract for lease:", leaseData.id);
                toast.loading("Génération du contrat...", { id: 'contract' });
                const contractResult = await generateLeaseContract({ leaseId: leaseData.id });
                console.log("[Wizard] Contract generation result:", contractResult);
                if (contractResult.success) {
                    setContractGenerated(true);
                    toast.success("Contrat généré !", { id: 'contract' });
                    // Small delay to ensure DB is updated before sendWelcomePack fetches the lease
                    console.log("[Wizard] Waiting 500ms for DB to update...");
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    console.error("[Wizard] Contract generation failed:", contractResult.error);
                    toast.error(contractResult.error || "Erreur génération contrat", { id: 'contract' });
                    // Continue anyway - pack can be sent without contract
                }
            }

            // Step 2: Send welcome pack (with contract attached if available)
            console.log("[Wizard] Sending welcome pack for lease:", leaseData.id);
            toast.loading("Envoi du pack de bienvenue...", { id: 'pack' });
            const packResult = await sendWelcomePack(leaseData.id);
            console.log("[Wizard] Welcome pack result:", packResult);
            toast.success("Pack de bienvenue envoyé ! 🎉", { id: 'pack' });
            onComplete();
        } catch (e) {
            console.error("[Wizard] Error in handleGenerateAndSendPack:", e);
            toast.error("Erreur lors de l'envoi", { id: 'pack' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onComplete()}>
            <DialogContent className="sm:max-w-xl bg-slate-900 border-slate-800 text-white p-0 overflow-hidden mb-safe">
                <DialogTitle className="sr-only">Assistant de Démarrage Locataire</DialogTitle>
                <DialogDescription className="sr-only">
                    Finalisez l&apos;entrée de votre nouveau locataire en confirmant les paiements et en envoyant le pack de bienvenue.
                </DialogDescription>
                <div className="bg-[#F4C430] p-6 text-black">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6" />
                        Assistant de Démarrage
                    </h2>
                    <p className="opacity-90 text-sm mt-1">Finalisons l&apos;entrée de votre locataire {leaseData.name}</p>
                </div>

                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 p-4 rounded-lg flex items-center justify-between border border-slate-700">
                                <div>
                                    <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold">Total à encaisser</p>
                                    <p className="text-3xl font-bold text-[#F4C430]">{grandTotal.toLocaleString()} FCFA</p>
                                </div>
                                <Wallet className="w-10 h-10 text-slate-600" />
                            </div>

                            <div className="space-y-3">
                                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${stats.depositPaid ? 'border-[#F4C430] bg-[#F4C430]/10' : 'border-slate-700 hover:border-slate-600'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${stats.depositPaid ? 'border-[#F4C430] bg-[#F4C430]' : 'border-slate-500'}`}>
                                        {stats.depositPaid && <Check className="w-4 h-4 text-black" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={stats.depositPaid} onChange={(e) => setStats({ ...stats, depositPaid: e.target.checked })} />
                                    <div className="flex-1">
                                        <div className="font-semibold text-white">Caution ({leaseData.depositMonths} mois)</div>
                                        <div className="text-sm text-slate-400">Garantie locative</div>
                                    </div>
                                    <div className="font-mono font-bold text-lg">{totalDeposit.toLocaleString()}</div>
                                </label>

                                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${stats.rentPaid ? 'border-[#F4C430] bg-[#F4C430]/10' : 'border-slate-700 hover:border-slate-600'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${stats.rentPaid ? 'border-[#F4C430] bg-[#F4C430]' : 'border-slate-500'}`}>
                                        {stats.rentPaid && <Check className="w-4 h-4 text-black" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={stats.rentPaid} onChange={(e) => setStats({ ...stats, rentPaid: e.target.checked })} />
                                    <div className="flex-1">
                                        <div className="font-semibold text-white">Premier Loyer</div>
                                        <div className="text-sm text-slate-400">Mois en cours</div>
                                    </div>
                                    <div className="font-mono font-bold text-lg">{totalRent.toLocaleString()}</div>
                                </label>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Button onClick={handleConfirmPayments} disabled={loading} className="w-full bg-[#F4C430] text-black hover:bg-[#F4C430]/90 font-bold h-12 text-lg">
                                    {loading ? <Loader2 className="animate-spin" /> : "Valider les Encaissements"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={onComplete}
                                    disabled={loading}
                                    className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    Passer (encaisser plus tard)
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 text-center py-4">
                            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-10 h-10" />
                            </div>

                            <h3 className="text-2xl font-bold text-white">Paiements enregistrés !</h3>
                            <p className="text-slate-400 text-lg">Un seul email sera envoyé avec tous les documents.</p>

                            <div className="bg-slate-800 p-6 rounded-xl text-left space-y-4">
                                <h4 className="font-semibold text-white border-b border-slate-700 pb-2 mb-2">Le Pack de Bienvenue inclura :</h4>
                                <div className="flex items-center gap-3 text-slate-300">
                                    <FileText className="w-5 h-5 text-[#F4C430]" /> Contrat de Bail (PDF)
                                </div>
                                <div className="flex items-center gap-3 text-slate-300">
                                    <Mail className="w-5 h-5 text-[#F4C430]" /> Lien d&apos;accès à l&apos;Espace Locataire
                                </div>
                                <div className="flex items-center gap-3 text-slate-300">
                                    <FileText className="w-5 h-5 text-[#F4C430]" /> Récapitulatif du bail et des paiements
                                </div>
                            </div>

                            <div className="pt-2 space-y-3">
                                <Button onClick={handleGenerateAndSendPack} disabled={loading} className="w-full bg-[#F4C430] text-black hover:bg-[#F4C430]/90 font-bold h-12 text-lg">
                                    {loading ? <Loader2 className="animate-spin" /> : "Générer & Envoyer le Pack 🚀"}
                                </Button>
                                <Button variant="ghost" onClick={onComplete} className="w-full text-slate-500">
                                    Passer (envoyer manuellement plus tard)
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- BULK IMPORT DIALOG COMPONENT ---

interface BulkImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ownerId: string;
    onSuccess: () => void;
}

interface ParsedTenant {
    nom: string;
    email: string;
    telephone?: string;
    adresse: string;
    loyer: number;
    jour_paiement?: number;
    date_debut: string;
    date_fin?: string;
    mois_caution?: number;
    error?: string;
}

function BulkImportDialog({ open, onOpenChange, ownerId, onSuccess }: BulkImportDialogProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedTenant[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isDark } = useTheme();

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setParsedData([]);
            setFileName('');
            setErrors([]);
            setImportProgress(0);
        }
    }, [open]);

    const parseFile = async (file: File) => {
        setErrors([]);
        setFileName(file.name);

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet);

            if (jsonData.length === 0) {
                setErrors(['Le fichier est vide ou ne contient pas de données valides.']);
                return;
            }

            // Map and validate data
            const mapped: ParsedTenant[] = jsonData.map((row, index) => {
                const tenant: ParsedTenant = {
                    nom: String(row.nom || row.Nom || row.name || row.Name || '').trim(),
                    email: String(row.email || row.Email || row.EMAIL || '').trim(),
                    telephone: String(row.telephone || row.Telephone || row.phone || row.Phone || row.tel || '').trim() || undefined,
                    adresse: String(row.adresse || row.Adresse || row.address || row.Address || '').trim(),
                    loyer: Number(row.loyer || row.Loyer || row.rent || row.Rent || row.montant || 0),
                    jour_paiement: Number(row.jour_paiement || row.jour || row.day || 5) || 5,
                    date_debut: formatDate(row.date_debut || row.debut || row.start_date || row.start || ''),
                    date_fin: formatDate(row.date_fin || row.fin || row.end_date || row.end || ''),
                    mois_caution: Number(row.mois_caution || row.caution || row.deposit || 2) || 2,
                };

                // Validate required fields
                const missingFields: string[] = [];
                if (!tenant.nom) missingFields.push('nom');
                if (!tenant.email) missingFields.push('email');
                if (!tenant.adresse) missingFields.push('adresse');
                if (!tenant.loyer || tenant.loyer <= 0) missingFields.push('loyer');
                if (!tenant.date_debut) missingFields.push('date_debut');

                if (missingFields.length > 0) {
                    tenant.error = `Ligne ${index + 2}: champs manquants (${missingFields.join(', ')})`;
                }

                return tenant;
            });

            setParsedData(mapped);
        } catch (err) {
            console.error('Error parsing file:', err);
            setErrors(['Erreur lors de la lecture du fichier. Vérifiez le format.']);
        }
    };

    const formatDate = (value: any): string => {
        if (!value) return '';

        // If it's already a valid date string
        if (typeof value === 'string') {
            // Handle DD/MM/YYYY format
            const dmyMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            if (dmyMatch) {
                return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
            }
            // Handle YYYY-MM-DD format (already correct)
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return value;
            }
        }

        // If it's an Excel serial date number
        if (typeof value === 'number') {
            const date = new Date((value - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }

        return '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (['csv', 'xlsx', 'xls'].includes(ext || '')) {
                parseFile(file);
            } else {
                setErrors(['Format non supporté. Utilisez CSV, XLSX ou XLS.']);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) parseFile(file);
    };

    const handleImport = async () => {
        const validData = parsedData.filter(t => !t.error);
        if (validData.length === 0) {
            toast.error('Aucune donnée valide à importer');
            return;
        }

        setLoading(true);
        setImportProgress(0);
        let successCount = 0;
        const importErrors: string[] = [];

        for (let i = 0; i < validData.length; i++) {
            const tenant = validData[i];
            try {
                const result = await createNewLease({
                    owner_id: ownerId,
                    tenant_name: tenant.nom,
                    tenant_phone: tenant.telephone || '',
                    tenant_email: tenant.email,
                    property_address: tenant.adresse,
                    monthly_amount: tenant.loyer,
                    billing_day: tenant.jour_paiement || 5,
                    start_date: tenant.date_debut,
                    end_date: tenant.date_fin || null,
                    status: 'active' as const,
                    deposit_months: tenant.mois_caution || 2,
                });

                if (result.success) {
                    successCount++;
                } else {
                    importErrors.push(`${tenant.nom}: ${result.error}`);
                }
            } catch (err) {
                importErrors.push(`${tenant.nom}: Erreur inattendue`);
            }

            setImportProgress(Math.round(((i + 1) / validData.length) * 100));
        }

        setLoading(false);

        if (successCount > 0) {
            toast.success(`${successCount} locataire(s) importé(s) avec succès !`);
        }
        if (importErrors.length > 0) {
            setErrors(importErrors);
        } else {
            onSuccess();
        }
    };

    const validCount = parsedData.filter(t => !t.error).length;
    const errorCount = parsedData.filter(t => t.error).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`z-[100] sm:max-w-2xl ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'} max-h-[90vh] overflow-y-auto`}>
                <DialogHeader>
                    <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                        <FileSpreadsheet className="w-5 h-5 inline-block mr-2" />
                        Importer des locataires en masse
                    </DialogTitle>
                    <DialogDescription className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                        Glissez un fichier CSV ou Excel contenant vos locataires
                    </DialogDescription>
                </DialogHeader>

                {!fileName ? (
                    // Drop zone
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${isDragging
                            ? 'border-[#F4C430] bg-[#F4C430]/10'
                            : isDark
                                ? 'border-slate-700 hover:border-slate-600'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                    >
                        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                        <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Glissez votre fichier ici
                        </p>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            ou cliquez pour sélectionner
                        </p>
                        <p className={`text-xs mt-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                            Formats acceptés : CSV, XLSX, XLS
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                ) : (
                    // Preview
                    <div className="space-y-4">
                        <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="w-5 h-5 text-[#F4C430]" />
                                <span className="font-medium">{fileName}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setParsedData([]); setFileName(''); setErrors([]); }}
                                className={isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`p-3 rounded-lg ${isDark ? 'bg-green-900/30 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                                <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{validCount}</p>
                                <p className={`text-xs ${isDark ? 'text-green-300' : 'text-green-700'}`}>Lignes valides</p>
                            </div>
                            <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                                <p className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{errorCount}</p>
                                <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>Erreurs</p>
                            </div>
                        </div>

                        {/* Errors */}
                        {(errors.length > 0 || errorCount > 0) && (
                            <div className={`p-3 rounded-lg max-h-32 overflow-y-auto ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                                    <span className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>Erreurs détectées</span>
                                </div>
                                <ul className={`text-xs space-y-1 ${isDark ? 'text-red-200' : 'text-red-600'}`}>
                                    {parsedData.filter(t => t.error).map((t, i) => (
                                        <li key={i}>• {t.error}</li>
                                    ))}
                                    {errors.map((e, i) => (
                                        <li key={`err-${i}`}>• {e}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Preview Table */}
                        {validCount > 0 && (
                            <div className={`border rounded-lg overflow-hidden ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                <div className={`px-3 py-2 text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-50 text-gray-700'}`}>
                                    Aperçu ({Math.min(validCount, 5)} sur {validCount})
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className={isDark ? 'bg-slate-800/50' : 'bg-gray-50'}>
                                                <th className="px-3 py-2 text-left font-medium">Nom</th>
                                                <th className="px-3 py-2 text-left font-medium">Email</th>
                                                <th className="px-3 py-2 text-right font-medium">Loyer</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.filter(t => !t.error).slice(0, 5).map((t, i) => (
                                                <tr key={i} className={isDark ? 'border-t border-slate-700' : 'border-t border-gray-100'}>
                                                    <td className="px-3 py-2">{t.nom}</td>
                                                    <td className={`px-3 py-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.email}</td>
                                                    <td className="px-3 py-2 text-right font-mono">{t.loyer.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Progress bar */}
                        {loading && (
                            <div className="space-y-2">
                                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                    <div
                                        className="h-2 rounded-full bg-[#F4C430] transition-all duration-300"
                                        style={{ width: `${importProgress}%` }}
                                    />
                                </div>
                                <p className={`text-xs text-center ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    Import en cours... {importProgress}%
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                                className={isDark ? 'text-slate-400 hover:text-white' : ''}
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={validCount === 0 || loading}
                                className="bg-[#F4C430] text-black hover:bg-[#F4C430]/90"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                )}
                                Importer {validCount} locataire{validCount > 1 ? 's' : ''}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Help */}
                <div className={`p-3 rounded-lg mt-2 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                    <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Colonnes attendues :</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        <strong>Obligatoires :</strong> nom, email, adresse, loyer, date_debut<br />
                        <strong>Optionnelles :</strong> telephone, jour_paiement, date_fin, mois_caution
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
