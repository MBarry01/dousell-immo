"use client";

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { renewLease, terminateLease } from '../actions';
import type { LeaseAlert } from '../actions';
import { useTheme } from '../../theme-provider';

interface DecisionModalProps {
    alert: LeaseAlert;
}

export function DecisionModal({ alert }: DecisionModalProps) {
    const { isDark } = useTheme();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);

    // États pour le renouvellement
    const [newEndDate, setNewEndDate] = useState('');
    const [newRentAmount, setNewRentAmount] = useState('');
    const [renewNotes, setRenewNotes] = useState('');

    // États pour la résiliation
    const [terminationReason, setTerminationReason] = useState<'reprise' | 'vente' | 'legitime'>('reprise');
    const [terminationNotes, setTerminationNotes] = useState('');

    // Calculer la date minimale pour le renouvellement (au moins la date d'échéance actuelle)
    const minEndDate = alert.end_date;

    // Gérer le renouvellement
    const handleRenew = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('leaseId', alert.id);
            if (newEndDate) formData.append('newEndDate', newEndDate);
            if (newRentAmount) formData.append('newRentAmount', newRentAmount);
            if (renewNotes) formData.append('notes', renewNotes);

            const result = await renewLease(formData);

            if (result.success) {
                toast.success(result.message || 'Bail renouvelé avec succès');
                setIsOpen(false);
            } else {
                toast.error(result.error || 'Erreur lors du renouvellement');
            }
        });
    };

    // Gérer la résiliation
    const handleTerminate = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('leaseId', alert.id);
            formData.append('noticeType', alert.alert_type);
            formData.append('terminationReason', terminationReason);
            if (terminationNotes) formData.append('notes', terminationNotes);

            const result = await terminateLease(formData);

            if (result.success) {
                toast.success(result.message || 'Préavis généré et envoyé avec succès');
                setIsOpen(false);
            } else {
                toast.error(result.error || 'Erreur lors de la génération du préavis');
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="border-[#F4C430] text-[#F4C430] hover:bg-[#F4C430]/10"
                    size="sm"
                >
                    ⚠️ Action Requise
                </Button>
            </DialogTrigger>

            <DialogContent className={`sm:max-w-[550px] ${isDark ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-gray-900 border-gray-200'}`}>
                <DialogHeader>
                    <DialogTitle className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Que voulez-vous faire pour ce bail ?
                    </DialogTitle>
                    <DialogDescription asChild>
                        <div className={`mt-2 space-y-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            <span className="block"><strong className={isDark ? 'text-white' : 'text-gray-900'}>Locataire:</strong> {alert.tenant_name}</span>
                            <span className="block"><strong className={isDark ? 'text-white' : 'text-gray-900'}>Bien:</strong> {alert.property_address}</span>
                            <span className="block"><strong className={isDark ? 'text-white' : 'text-gray-900'}>Loyer actuel:</strong> {new Intl.NumberFormat('fr-FR').format(alert.monthly_amount)} FCFA</span>
                            <span className="block"><strong className={isDark ? 'text-white' : 'text-gray-900'}>Échéance:</strong> {new Date(alert.end_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="renew" className="w-full mt-4">
                    <TabsList className={`grid w-full grid-cols-2 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                        <TabsTrigger
                            value="renew"
                            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                        >
                            ✅ Renouveler
                        </TabsTrigger>
                        <TabsTrigger
                            value="terminate"
                            className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
                        >
                            ❌ Donner Congé
                        </TabsTrigger>
                    </TabsList>

                    {/* OPTION A : RENOUVELER */}
                    <TabsContent value="renew" className="space-y-4 py-4">
                        <div className="bg-green-900/20 border border-green-900 p-3 rounded text-sm text-green-200">
                            ℹ️ Le bail sera automatiquement renouvelé. Vous pouvez ajuster la durée et le loyer.
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newEndDate">Nouvelle date de fin (Optionnel)</Label>
                            <Input
                                id="newEndDate"
                                type="date"
                                min={minEndDate}
                                value={newEndDate}
                                onChange={(e) => setNewEndDate(e.target.value)}
                                className={isDark ? 'bg-black border-slate-700' : 'bg-gray-50 border-gray-300'}
                            />
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                Par défaut: +1 an à partir de {new Date(alert.end_date).toLocaleDateString('fr-FR')}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newRentAmount">Nouveau montant du loyer (Optionnel)</Label>
                            <Input
                                id="newRentAmount"
                                type="number"
                                placeholder={alert.monthly_amount.toString()}
                                value={newRentAmount}
                                onChange={(e) => setNewRentAmount(e.target.value)}
                                className={isDark ? 'bg-black border-slate-700' : 'bg-gray-50 border-gray-300'}
                            />
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                Loyer actuel: {new Intl.NumberFormat('fr-FR').format(alert.monthly_amount)} FCFA
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="renewNotes">Notes (Optionnel)</Label>
                            <Textarea
                                id="renewNotes"
                                placeholder="Notes sur le renouvellement..."
                                value={renewNotes}
                                onChange={(e) => setRenewNotes(e.target.value)}
                                className={isDark ? 'bg-black border-slate-700' : 'bg-gray-50 border-gray-300'}
                                rows={3}
                            />
                        </div>

                        <Button
                            onClick={handleRenew}
                            disabled={isPending}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            {isPending ? 'Renouvellement en cours...' : 'Valider le renouvellement'}
                        </Button>
                        <p className={`text-xs text-center ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                            Un avenant au bail sera créé automatiquement
                        </p>
                    </TabsContent>

                    {/* OPTION B : DONNER CONGÉ */}
                    <TabsContent value="terminate" className="space-y-4 py-4">
                        <div className="bg-red-900/20 border border-red-900 p-3 rounded text-sm text-red-200">
                            ⚠️ <strong>Attention:</strong> Au Sénégal, le congé doit respecter un préavis de 6 mois pour reprise (Loi n° 2014-22).
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="terminationReason">Motif du congé (Obligatoire)</Label>
                            <Select value={terminationReason} onValueChange={(v: 'reprise' | 'vente' | 'legitime') => setTerminationReason(v)}>
                                <SelectTrigger className={isDark ? 'bg-black border-slate-700' : 'bg-gray-50 border-gray-300'}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className={isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}>
                                    <SelectItem value="reprise">
                                        Reprise pour habiter (Moi ou famille proche)
                                    </SelectItem>
                                    <SelectItem value="vente">
                                        Vente du logement
                                    </SelectItem>
                                    <SelectItem value="legitime">
                                        Motif légitime et sérieux (Impayés, dégradations...)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="terminationNotes">Détails du motif (Optionnel)</Label>
                            <Textarea
                                id="terminationNotes"
                                placeholder="Précisez le motif de la résiliation..."
                                value={terminationNotes}
                                onChange={(e) => setTerminationNotes(e.target.value)}
                                className={isDark ? 'bg-black border-slate-700' : 'bg-gray-50 border-gray-300'}
                                rows={3}
                            />
                        </div>

                        <div className={`p-3 rounded text-sm ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <p className="font-semibold mb-2">Ce qui va se passer:</p>
                            <ul className={`space-y-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                <li>✅ Un préavis PDF sera généré</li>
                                <li>✅ Le préavis sera envoyé par email au locataire</li>
                                <li>✅ Vous recevrez une copie (CC)</li>
                                <li>✅ Le bail sera marqué &quot;en cours de résiliation&quot;</li>
                            </ul>
                        </div>

                        <Button
                            onClick={handleTerminate}
                            disabled={isPending}
                            className="w-full bg-red-600 hover:bg-red-700"
                        >
                            {isPending ? 'Génération en cours...' : 'Générer et Envoyer le Préavis'}
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
