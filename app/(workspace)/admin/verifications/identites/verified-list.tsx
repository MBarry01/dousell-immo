"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    BadgeCheck,
    User,
    Phone,
    Mail,
    Calendar,
    Shield,
    ShieldOff,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { revokeIdentityVerification } from "./actions";

type VerifiedUser = {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
    is_identity_verified: boolean;
    created_at: string;
    updated_at: string;
    properties_count?: number;
};

type Props = {
    initialUsers: VerifiedUser[];
};

export function VerifiedIdentitiesList({ initialUsers }: Props) {
    const [users, setUsers] = useState(initialUsers);
    const [selectedUser, setSelectedUser] = useState<VerifiedUser | null>(null);
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
    const [revokeReason, setRevokeReason] = useState("");
    const [processing, setProcessing] = useState(false);

    const handleRevoke = async () => {
        if (!selectedUser || !revokeReason.trim()) {
            toast.error("Veuillez indiquer une raison");
            return;
        }

        if (!confirm(`⚠️ ATTENTION: Révoquer la vérification de ${selectedUser.full_name} va également décertifier toutes ses annonces (${selectedUser.properties_count || 0}). Confirmer ?`)) {
            return;
        }

        setProcessing(true);
        try {
            const result = await revokeIdentityVerification(selectedUser.id, revokeReason);

            if (result.success) {
                toast.success("🔓 Vérification révoquée avec succès");
                setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
                setRevokeDialogOpen(false);
                setRevokeReason("");
                setSelectedUser(null);
            } else {
                toast.error(result.error || "Erreur lors de la révocation");
            }
        } catch (error) {
            toast.error("Une erreur est survenue");
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const openRevokeDialog = (user: VerifiedUser) => {
        setSelectedUser(user);
        setRevokeDialogOpen(true);
    };

    if (users.length === 0) {
        return (
            <Card className="border-border bg-card p-12 text-center">
                <ShieldOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                    Aucune identité vérifiée
                </h3>
                <p className="text-muted-foreground">
                    Les utilisateurs avec identité vérifiée apparaîtront ici
                </p>
            </Card>
        );
    }

    return (
        <>
            {/* En-tête */}
            <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                    {users.length} identité{users.length > 1 ? 's' : ''} vérifiée{users.length > 1 ? 's' : ''}
                </p>
            </div>

            {/* Tableau */}
            <Card className="border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-card">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Utilisateur
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Vérifié le
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Annonces
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-card transition-colors">
                                    {/* Utilisateur */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                                                <User className="h-5 w-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-white">
                                                        {user.full_name}
                                                    </p>
                                                    <BadgeCheck className="h-4 w-4 text-amber-400" />
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Membre depuis {format(new Date(user.created_at), "MMM yyyy", { locale: fr })}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {user.email && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Mail className="h-3 w-3" />
                                                    <span className="truncate max-w-[200px]">{user.email}</span>
                                                </div>
                                            )}
                                            {user.phone && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{user.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Date de vérification */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            <span>{format(new Date(user.updated_at), "dd/MM/yyyy", { locale: fr })}</span>
                                        </div>
                                    </td>

                                    {/* Annonces */}
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                                            {user.properties_count || 0} annonce{(user.properties_count || 0) > 1 ? 's' : ''}
                                        </Badge>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                                onClick={() => openRevokeDialog(user)}
                                                disabled={processing}
                                            >
                                                <ShieldOff className="h-3.5 w-3.5 mr-1.5" />
                                                Révoquer
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Dialog de révocation */}
            <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                <DialogContent className="bg-[#0b0f18] border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                            Révoquer la vérification d&apos;identité
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            ⚠️ Action critique pour {selectedUser?.full_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-sm text-red-400 font-semibold mb-2">
                                Cette action va :
                            </p>
                            <ul className="text-xs text-red-300 space-y-1 list-disc list-inside">
                                <li>Retirer le badge &quot;Vérifié&quot; du profil</li>
                                <li>Décertifier tous les documents d&apos;identité</li>
                                <li>Décertifier toutes les annonces ({selectedUser?.properties_count || 0})</li>
                            </ul>
                        </div>

                        <div>
                            <label className="text-sm text-foreground/80 font-medium mb-2 block">
                                Raison de la révocation
                            </label>
                            <Textarea
                                placeholder="Ex: Document expiré, informations incorrectes, fraude détectée..."
                                value={revokeReason}
                                onChange={(e) => setRevokeReason(e.target.value)}
                                className="bg-card border-border text-foreground min-h-[100px]"
                                rows={4}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRevokeDialogOpen(false);
                                setRevokeReason("");
                            }}
                            disabled={processing}
                        >
                            Annuler
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleRevoke}
                            disabled={processing || !revokeReason.trim()}
                        >
                            <ShieldOff className="w-4 h-4 mr-2" />
                            Confirmer la révocation
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

