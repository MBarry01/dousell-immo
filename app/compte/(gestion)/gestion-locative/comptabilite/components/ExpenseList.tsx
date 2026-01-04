'use client';

import { useState } from 'react';
import { Trash2, Building2, Calendar, Tag, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Expense, deleteExpense } from '../expenses-actions';
import { EXPENSE_CATEGORY_LABELS, ExpenseCategory } from '../expense-types';
import { toast } from 'sonner';

interface ExpenseListProps {
    expenses: Expense[];
    onExpenseDeleted?: () => void;
}

export function ExpenseList({ expenses, onExpenseDeleted }: ExpenseListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Supprimer cette dépense ?')) return;

        setDeletingId(id);
        const result = await deleteExpense(id);
        setDeletingId(null);

        if (result.success) {
            toast.success('Dépense supprimée');
            onExpenseDeleted?.();
        } else {
            toast.error(result.error || 'Erreur');
        }
    };

    const formatAmount = (amount: number) => amount.toLocaleString('fr-FR');
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getCategoryColor = (cat: ExpenseCategory) => {
        const colors: Record<ExpenseCategory, string> = {
            maintenance: 'bg-brand/10 text-brand border-brand/20',
            tax: 'bg-red-500/10 text-red-400 border-red-500/20',
            utility: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            insurance: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            management_fee: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
            other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        };
        return colors[cat] || colors.other;
    };

    if (expenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucune dépense ce mois</p>
                <p className="text-sm">Cliquez sur "Dépense" pour en ajouter une.</p>
            </div>
        );
    }

    // Calculate total
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="flex justify-between items-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <span className="text-slate-300 font-medium">Total Dépenses</span>
                <span className="text-red-400 font-bold text-xl">{formatAmount(totalExpenses)} FCFA</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium">Catégorie</th>
                            <th className="pb-3 font-medium">Description</th>
                            <th className="pb-3 font-medium">Bien</th>
                            <th className="pb-3 font-medium text-right">Montant</th>
                            <th className="pb-3 font-medium w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {expenses.map((expense) => (
                            <tr key={expense.id} className="group hover:bg-slate-800/30 transition-colors">
                                <td className="py-3 text-sm text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-600" />
                                        {formatDate(expense.expense_date)}
                                    </div>
                                </td>
                                <td className="py-3">
                                    <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(expense.category)}`}>
                                        {EXPENSE_CATEGORY_LABELS[expense.category]}
                                    </span>
                                </td>
                                <td className="py-3 text-sm text-slate-300 max-w-[200px] truncate">
                                    {expense.description || '-'}
                                </td>
                                <td className="py-3 text-sm text-slate-400">
                                    {expense.property_address ? (
                                        <div className="flex items-center gap-1">
                                            <Building2 className="w-3 h-3" />
                                            <span className="truncate max-w-[120px]">{expense.property_address}</span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-600">Général</span>
                                    )}
                                </td>
                                <td className="py-3 text-right">
                                    <span className="text-red-400 font-medium">{formatAmount(expense.amount)} FCFA</span>
                                </td>
                                <td className="py-3 text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(expense.id)}
                                        disabled={deletingId === expense.id}
                                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                                    >
                                        {deletingId === expense.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
