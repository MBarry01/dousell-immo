'use client';

import { ReceiptModal } from './ReceiptModal';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Calendar, Edit2, X, Check, Mail, MapPin, Loader2, CheckCircle, Eye, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateLease, confirmPayment, terminateLease, reactivateLease } from '../actions';
import { toast } from 'sonner';

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
    // DONNÉES DE PÉRIODE (depuis la DB, pas calculées!)
    period_month?: number;
    period_year?: number;
    period_start?: string | null;
    period_end?: string | null;
}

interface TenantListProps {
    tenants?: Tenant[];
    profile?: any;
    userEmail?: string;
    isViewingTerminated?: boolean;
}

const statusColors = {
    paid: 'bg-green-500/20 text-green-400 border-green-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    overdue: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const statusLabels = {
    paid: 'Payé',
    pending: 'En attente',
    overdue: 'Retard'
};

export function TenantList({ tenants = [], profile, userEmail, isViewingTerminated = false }: TenantListProps) {
    const router = useRouter();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Tenant>>({});
    const [saving, setSaving] = useState(false);

    // État pour la modale de quittance
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState<any>(null);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatAmount = (amount: number) => {
        return amount.toLocaleString('fr-FR');
    };

    const handleEdit = (tenant: Tenant) => {
        setEditingId(tenant.id);
        setEditData({
            name: tenant.name,
            phone: tenant.phone || '',
            email: tenant.email || '',
            property: tenant.property,
            rentAmount: tenant.rentAmount,
            dueDate: tenant.dueDate,
            startDate: tenant.startDate
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editData.email) {
            toast.error('L\'email est obligatoire');
            return;
        }

        setSaving(true);
        const result = await updateLease(editingId, {
            tenant_name: editData.name,
            tenant_phone: editData.phone,
            tenant_email: editData.email,
            property_address: editData.property,
            monthly_amount: editData.rentAmount,
            billing_day: editData.dueDate,
            start_date: editData.startDate
        });
        setSaving(false);

        if (result.success) {
            toast.success('Locataire mis à jour!');
            setEditingId(null);
            setEditData({});
            router.refresh(); // Rafraîchir pour afficher les nouvelles données
        } else {
            toast.error(result.error || 'Erreur lors de la mise à jour');
        }
    };

    const handleTerminateLease = async (leaseId: string, tenantName: string) => {
        // Confirmation avant résiliation
        const confirmed = window.confirm(
            `⚠️ Voulez-vous vraiment résilier le bail de ${tenantName} ?\n\n` +
            `Le locataire n'apparaîtra plus dans la liste active, mais l'historique des paiements sera conservé.`
        );

        if (!confirmed) return;

        setSaving(true);
        const result = await terminateLease(leaseId);
        setSaving(false);

        if (result.success) {
            toast.success(result.message || 'Bail résilié avec succès');
            router.refresh(); // Rafraîchir pour mettre à jour la liste
        } else {
            toast.error(result.error || 'Erreur lors de la résiliation');
        }
    };

    const handleReactivateLease = async (leaseId: string, tenantName: string) => {
        // Confirmation avant réactivation
        const confirmed = window.confirm(
            `✅ Voulez-vous réactiver le bail de ${tenantName} ?\n\n` +
            `Le locataire réapparaîtra dans la liste active et le Cron générera automatiquement les prochaines échéances.`
        );

        if (!confirmed) return;

        setSaving(true);
        const result = await reactivateLease(leaseId);
        setSaving(false);

        if (result.success) {
            toast.success(result.message || 'Bail réactivé avec succès');
            router.refresh(); // Rafraîchir pour mettre à jour la liste
        } else {
            toast.error(result.error || 'Erreur lors de la réactivation');
        }
    };

    const handleConfirmPayment = async (leaseId: string, transactionId?: string) => {
        // Trouver le locataire pour les données de la quittance
        const tenant = tenants.find(t => t.id === leaseId);

        if (!tenant) {
            toast.error('Locataire introuvable');
            return;
        }

        // Étape 1: Marquer comme payé dans la DB
        const result = await confirmPayment(leaseId, transactionId);

        if (!result.success) {
            toast.error(result.error || 'Erreur inconnue', {
                description: "Vous pouvez toujours générer la quittance manuellement via le bouton 'Voir quittance'.",
                duration: 7000,
            });
            return;
        }

        // Étape 2: Demander si on envoie la quittance
        const shouldSendReceipt = window.confirm(
            `Le loyer est marqué comme payé. Souhaitez-vous envoyer immédiatement la quittance par email à ${tenant.name} ?`
        );

        if (shouldSendReceipt) {
            // Vérifier si l'email existe
            if (!tenant.email) {
                toast.error('Email manquant pour ce locataire', {
                    description: "Modifiez le locataire pour ajouter son email.",
                    duration: 5000,
                });
                return;
            }

            // Vérifier si l'adresse du bien est renseignée
            if (!tenant.property || tenant.property === 'Adresse non renseignée') {
                toast.error('Adresse du bien manquante', {
                    description: "Veuillez modifier le locataire et ajouter l'adresse du bien avant d'envoyer la quittance.",
                    duration: 6000,
                });
                return;
            }

            // Préparer les données pour la quittance
            const landlordName = profile?.company_name || profile?.full_name || "Propriétaire";
            const landlordAddress = profile?.company_address || "Adresse non renseignée";

            // 🚨 CRITIQUE: Utiliser les données de la transaction (DB), PAS new Date()
            const periodMonth = tenant.period_month?.toString().padStart(2, '0') || '01';
            const periodYear = tenant.period_year || new Date().getFullYear();

            // Calculer les dates de début/fin si non présentes (fallback)
            const periodStartDate = tenant.period_start
                ? new Date(tenant.period_start)
                : new Date(periodYear, parseInt(periodMonth) - 1, 1);

            const periodEndDate = tenant.period_end
                ? new Date(tenant.period_end)
                : new Date(periodYear, parseInt(periodMonth), 0);

            const receiptData = {
                tenantName: tenant.name,
                tenantEmail: tenant.email,
                tenantPhone: tenant.phone || '',
                tenantAddress: tenant.property,
                amount: Number(tenant.rentAmount) || 0,
                // DONNÉES DYNAMIQUES depuis la DB (transaction)
                periodMonth: `${periodMonth}/${periodYear}`,
                periodStart: periodStartDate.toLocaleDateString('fr-FR'),
                periodEnd: periodEndDate.toLocaleDateString('fr-FR'),
                receiptNumber: `QUITT-${Date.now().toString().slice(-6)}`,
                ownerName: landlordName,
                ownerAddress: landlordAddress,
                ownerNinea: profile?.company_ninea || undefined,
                ownerLogo: profile?.logo_url || undefined,
                ownerSignature: profile?.signature_url || undefined,
                ownerEmail: profile?.company_email || undefined, // Email de config (priorité)
                ownerAccountEmail: userEmail || undefined, // Email du compte (fallback)
                propertyAddress: tenant.property,
            };

            // Envoyer la quittance
            toast.promise(
                fetch('/api/send-receipt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(receiptData),
                }).then(async (res) => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'envoi');
                    return data;
                }),
                {
                    loading: 'Envoi de la quittance par email...',
                    success: 'Quittance envoyée avec succès !',
                    error: (err) => `Erreur: ${err.message}`,
                }
            );
        } else {
            // Juste confirmer le paiement sans envoi
            toast.success(result.message || "Paiement enregistré avec succès !", {
                duration: 5000,
            });
        }

        // IMPORTANT: Rafraîchir la page pour afficher le nouveau statut "paid"
        // Cela recharge les données depuis le serveur et met à jour TOUS les locataires
        router.refresh();
    };

    // --- LOGIQUE QUITTANCE ---
    const handleViewReceipt = (tenant: Tenant) => {
        // Extraction sécurisée des infos avec fallback intelligent
        const landlordName = profile?.company_name || profile?.full_name || "Propriétaire (non configuré)";
        const landlordAddress = profile?.company_address || "Adresse (non configurée)";

        const safeProfile = {
            company_name: landlordName,
            company_address: landlordAddress,
            company_email: profile?.company_email || undefined,
            company_ninea: profile?.company_ninea || undefined,
            logo_url: profile?.logo_url || undefined,
            signature_url: profile?.signature_url || undefined
        };

        // Avertissement si le profil n'est pas complet
        if (!profile?.company_name && !profile?.full_name) {
            toast.warning("Info: Configurez votre profil pour personnaliser la quittance.", {
                duration: 5000,
            });
        }

        // 🚨 CRITIQUE: Utiliser les données de la transaction (DB), PAS new Date()
        const periodMonth = tenant.period_month?.toString().padStart(2, '0') || '01';
        const periodYear = tenant.period_year || new Date().getFullYear();

        setCurrentReceipt({
            tenant: {
                tenant_name: tenant.name,
                email: tenant.email,
                phone: tenant.phone,
                address: tenant.property
            },
            profile: safeProfile,
            userEmail: userEmail, // Email du compte pour fallback
            amount: tenant.rentAmount,
            // DONNÉES DYNAMIQUES depuis la DB (transaction)
            month: periodMonth,
            year: periodYear,
            property_address: tenant.property
        });
        setIsReceiptOpen(true);
    };

    return (
        <div className="space-y-3">
            {/* Modale Quittance */}
            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                data={currentReceipt}
            />
            {tenants.length > 0 ? (
                <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-600">
                {tenants.map((tenant) => (
                    <div
                        key={tenant.id}
                        className={`p-4 rounded-2xl border transition-all ${editingId === tenant.id
                            ? 'bg-blue-500/5 border-blue-500/30'
                            : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                            }`}
                    >
                        {editingId === tenant.id ? (
                            // ===== MODE ÉDITION =====
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                                        <Edit2 className="w-4 h-4" /> Modification
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEdit}
                                        className="text-gray-400 hover:text-white h-8 px-2"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Input
                                        placeholder="Nom complet"
                                        value={editData.name || ''}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        className="bg-gray-800/50 border-gray-700 h-10"
                                    />
                                    <Input
                                        type="email"
                                        placeholder="Email *"
                                        value={editData.email || ''}
                                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                        className={`bg-gray-800/50 border-gray-700 h-10 ${!editData.email ? 'border-red-500/50' : ''}`}
                                    />
                                    <Input
                                        placeholder="Téléphone"
                                        value={editData.phone || ''}
                                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                        className="bg-gray-800/50 border-gray-700 h-10"
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Loyer FCFA"
                                        value={editData.rentAmount || ''}
                                        onChange={(e) => setEditData({ ...editData, rentAmount: Number(e.target.value) })}
                                        className="bg-gray-800/50 border-gray-700 h-10"
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 whitespace-nowrap">Jour fact.</span>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={31}
                                            placeholder="Ex: 5"
                                            value={editData.dueDate || ''}
                                            onChange={(e) => setEditData({ ...editData, dueDate: Number(e.target.value) })}
                                            className="bg-gray-800/50 border-gray-700 h-10 w-20"
                                        />
                                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">Début bail</span>
                                        <Input
                                            type="date"
                                            value={editData.startDate || ''}
                                            onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                                            className="bg-gray-800/50 border-gray-700 h-10"
                                        />
                                    </div>
                                </div>

                                <Input
                                    placeholder="Adresse du bien loué *"
                                    value={editData.property || ''}
                                    onChange={(e) => setEditData({ ...editData, property: e.target.value })}
                                    className={`bg-gray-800/50 border-gray-700 h-10 ${!editData.property || editData.property === 'Adresse non renseignée' ? 'border-orange-500/50' : ''}`}
                                />

                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleSaveEdit}
                                        disabled={saving || !editData.email}
                                        className="flex-1 bg-green-600 hover:bg-green-700 h-10"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Enregistrer</>}
                                    </Button>
                                    {isViewingTerminated ? (
                                        <Button
                                            onClick={() => handleReactivateLease(tenant.id, tenant.name)}
                                            disabled={saving}
                                            variant="outline"
                                            className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300 h-10 px-4"
                                            title="Réactiver le bail"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => handleTerminateLease(tenant.id, tenant.name)}
                                            disabled={saving}
                                            variant="outline"
                                            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-10 px-4"
                                            title="Résilier le bail (conserve l'historique)"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // ===== MODE AFFICHAGE =====
                            <div className="space-y-3">
                                {/* Ligne 1: Avatar + Nom + Statut */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                        {getInitials(tenant.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white truncate text-sm">{tenant.name}</h3>
                                        <p className="text-xs text-gray-500 truncate">{tenant.property}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-medium border shrink-0 ${statusColors[tenant.status] || statusColors.pending}`}>
                                        {statusLabels[tenant.status] || 'En attente'}
                                    </span>
                                </div>

                                {/* Ligne 2: Infos + Montant */}
                                <div className="flex items-center justify-between text-xs text-gray-400 pl-[52px]">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        {tenant.phone && (
                                            <span className="flex items-center gap-1 shrink-0">
                                                <Phone className="w-3 h-3" /> {tenant.phone}
                                            </span>
                                        )}
                                        {tenant.dueDate && (
                                            <span className="flex items-center gap-1 shrink-0">
                                                <Calendar className="w-3 h-3" /> {tenant.dueDate} du mois
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-white font-bold text-base">{formatAmount(tenant.rentAmount)}</span>
                                        <span className="text-gray-500 ml-1">FCFA/mois</span>
                                    </div>
                                </div>

                                {/* Ligne 3: Warning email/adresse + Actions */}
                                <div className="flex items-center justify-between pl-[52px]">
                                    <div className="flex flex-col gap-1">
                                        {!tenant.email ? (
                                            <span className="text-xs text-red-400 flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> Email manquant
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-600 truncate">{tenant.email}</span>
                                        )}
                                        {(!tenant.property || tenant.property === 'Adresse non renseignée') && (
                                            <span className="text-xs text-orange-400 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> Adresse manquante
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-4">
                                        {/* Bouton "Marquer payé" pour pending ET overdue */}
                                        {(tenant.status === 'pending' || tenant.status === 'overdue') && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleConfirmPayment(tenant.id, tenant.last_transaction_id)}
                                                className={`${
                                                    tenant.status === 'overdue'
                                                        ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20'
                                                        : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'
                                                } text-white font-bold rounded-xl h-9 shadow-lg transition-all active:scale-95`}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                {tenant.status === 'overdue' ? 'Paiement reçu' : 'Marquer payé'}
                                            </Button>
                                        )}
                                        {/* Bouton "Voir quittance" uniquement pour paid */}
                                        {tenant.status === 'paid' && (
                                            <button
                                                onClick={() => handleViewReceipt(tenant)}
                                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs font-medium border border-blue-500/20"
                                            >
                                                <Eye className="w-3 h-3" /> Voir quittance
                                            </button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                                            onClick={() => handleEdit(tenant)}
                                        >
                                            Modifier
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))
                }
                </div>
            ) : (
                <div className="p-12 text-center border-2 border-dashed border-gray-800 rounded-2xl">
                    <User className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Aucun locataire enregistré</p>
                    <p className="text-xs text-gray-600 mt-1">Cliquez sur &quot;Nouveau Locataire&quot; pour commencer</p>
                </div>
            )}
        </div>
    );
}
