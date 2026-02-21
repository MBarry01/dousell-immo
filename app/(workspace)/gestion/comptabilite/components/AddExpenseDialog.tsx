'use client';

import { useState } from 'react';
import { Plus, Receipt, Building2, Calendar, Tag, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { addExpense } from '../expenses-actions';
import { ExpenseCategory, EXPENSE_CATEGORY_LABELS } from '../expense-types';
import { toast } from 'sonner';
import { useTheme } from "@/components/theme-provider";

interface Property {
    id: string;
    address: string;
}

interface AddExpenseDialogProps {
    properties: Property[];
    onExpenseAdded?: () => void;
}

export function AddExpenseDialog({ properties, onExpenseAdded }: AddExpenseDialogProps) {
    const { isDark } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [propertyId, setPropertyId] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState<ExpenseCategory>('maintenance');
    const [description, setDescription] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Le montant doit être supérieur à 0');
            return;
        }

        setIsLoading(true);

        const result = await addExpense({
            lease_id: propertyId || undefined, // propertyId now holds lease ID
            amount: parseFloat(amount),
            expense_date: date,
            category,
            description: description || undefined,
        });

        setIsLoading(false);

        if (result.success) {
            toast.success('Dépense ajoutée !');
            setIsOpen(false);
            // Reset form
            setPropertyId('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setCategory('maintenance');
            setDescription('');
            onExpenseAdded?.();
        } else {
            toast.error(result.error || 'Erreur lors de l\'ajout');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                    className="hover:opacity-90 gap-2"
                    size="sm"
                >
                    <Plus className="w-4 h-4" style={{ color: '#ffffff' }} />
                    <span className="hidden md:inline">Dépense</span>
                </Button>
            </DialogTrigger>
            <DialogContent className={`sm:max-w-md ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'}`}>
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <Receipt className={`h-5 w-5 ${isDark ? 'text-brand' : 'text-primary'}`} />
                        Nouvelle Dépense
                    </DialogTitle>
                    <DialogDescription className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                        Ajoutez une dépense liée à vos biens ou à la gestion.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Amount */}
                    <div className="space-y-2">
                        <Label className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`} required>
                            <Tag className="w-4 h-4" /> Montant (FCFA)
                        </Label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Ex: 50000"
                            required
                            min="1"
                            className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'
                                }`}
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`} required>
                            <FileText className="w-4 h-4" /> Catégorie
                        </Label>
                        <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                            <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'}>
                                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <Label className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`} required>
                            <Calendar className="w-4 h-4" /> Date
                        </Label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'
                                }`}
                        />
                    </div>

                    {/* Lease (Optional) */}
                    <div className="space-y-2">
                        <label className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                            <Building2 className="w-4 h-4" /> Locataire associé (optionnel)
                        </label>
                        <Select value={propertyId || 'none'} onValueChange={(v) => setPropertyId(v === 'none' ? '' : v)}>
                            <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'}>
                                <SelectValue placeholder="Aucun (dépense générale)" />
                            </SelectTrigger>
                            <SelectContent className={`${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'} max-w-[calc(100vw-2rem)]`}>
                                <SelectItem value="none">
                                    Aucun (dépense générale)
                                </SelectItem>
                                {properties.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        <span className="truncate block max-w-full">{p.address}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Description (optionnel)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Réparation fuite d'eau salle de bain..."
                            rows={2}
                            className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'
                                }`}
                        />
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={isLoading || !amount}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                'Ajouter la dépense'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
