"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2 } from "lucide-react";
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
import { createNewLease } from "../actions";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { GenerateContractModal } from '@/components/contracts/GenerateContractModal';
import { useTheme } from '../../theme-provider';
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
            <Button onClick={handleTriggerClick} className={`${isDark ? 'bg-[#F4C430] text-black hover:bg-[#F4C430]/90' : 'bg-slate-900 text-white hover:bg-slate-800'} rounded-lg h-9 px-2 sm:px-4 font-medium text-sm transition-all`}>
                <Plus className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Nouveau</span>
            </Button>
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
                            onClick={() => router.push('/gestion-locative/config')}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Compléter mon profil
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

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
