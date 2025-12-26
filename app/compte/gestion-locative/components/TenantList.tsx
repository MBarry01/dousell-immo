'use client';

import { useState } from 'react';
import { User, Phone, Calendar, Edit2, X, Check, Mail, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateLease } from '../actions';
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
}

interface TenantListProps {
    tenants?: Tenant[];
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

export function TenantList({ tenants = [] }: TenantListProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Tenant>>({});
    const [saving, setSaving] = useState(false);

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
            rentAmount: tenant.rentAmount
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
            monthly_amount: editData.rentAmount
        });
        setSaving(false);

        if (result.success) {
            toast.success('Locataire mis à jour!');
            setEditingId(null);
            setEditData({});
        } else {
            toast.error(result.error || 'Erreur lors de la mise à jour');
        }
    };

    return (
        <div className="space-y-3">
            {tenants.length > 0 ? (
                tenants.map((tenant) => (
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
                                </div>

                                <Input
                                    placeholder="Adresse du bien"
                                    value={editData.property || ''}
                                    onChange={(e) => setEditData({ ...editData, property: e.target.value })}
                                    className="bg-gray-800/50 border-gray-700 h-10"
                                />

                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={saving || !editData.email}
                                    className="w-full bg-green-600 hover:bg-green-700 h-10"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Enregistrer</>}
                                </Button>
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

                                {/* Ligne 3: Warning email + Bouton modifier */}
                                <div className="flex items-center justify-between pl-[52px]">
                                    {!tenant.email ? (
                                        <span className="text-xs text-red-400 flex items-center gap-1">
                                            <Mail className="w-3 h-3" /> Email manquant
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-600 truncate">{tenant.email}</span>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 h-7 px-2 text-xs"
                                        onClick={() => handleEdit(tenant)}
                                    >
                                        <Edit2 className="w-3 h-3 mr-1" /> Modifier
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))
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
