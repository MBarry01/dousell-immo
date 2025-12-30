'use client';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthSelectorProps {
    selectedMonth: number; // 1-12
    selectedYear: number;
    onMonthChange: (month: number, year: number) => void;
    minDate?: string;
}

const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function MonthSelector({ selectedMonth, selectedYear, onMonthChange, minDate }: MonthSelectorProps) {
    const handlePrevious = () => {
        if (selectedMonth === 1) {
            onMonthChange(12, selectedYear - 1);
        } else {
            onMonthChange(selectedMonth - 1, selectedYear);
        }
    };

    const handleNext = () => {
        if (selectedMonth === 12) {
            onMonthChange(1, selectedYear + 1);
        } else {
            onMonthChange(selectedMonth + 1, selectedYear);
        }
    };

    const handleToday = () => {
        const today = new Date();
        onMonthChange(today.getMonth() + 1, today.getFullYear());
    };

    const isCurrentMonth = () => {
        const today = new Date();
        return selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear();
    };

    const isPastLimit = () => {
        if (!minDate) return false;
        const limit = new Date(minDate);
        // On compare l'année et le mois.
        // Si l'année affichée est < année limite, c'est bloqué.
        if (selectedYear < limit.getFullYear()) return true;
        // Si même année, on regarde le mois.
        if (selectedYear === limit.getFullYear() && selectedMonth <= limit.getMonth() + 1) return true;

        return false;
    };

    return (
        <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg w-full sm:w-auto">
            {/* Bouton Mois précédent */}
            <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={isPastLimit()}
                className={`h-8 w-8 p-0 hover:bg-slate-800 ${isPastLimit() ? 'opacity-30 cursor-not-allowed' : ''}`}
                title="Mois précédent"
            >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
            </Button>

            {/* Affichage du mois et année */}
            <div className="flex items-center justify-center gap-2 px-2 flex-1 sm:flex-none">
                <span className="text-sm font-medium text-white whitespace-nowrap">
                    {MONTHS_FR[selectedMonth - 1]} {selectedYear}
                </span>
                {!isCurrentMonth() && (
                    <button
                        onClick={handleToday}
                        className="text-xs text-slate-500 hover:text-[#F4C430] transition-colors"
                    >
                        Aujourd'hui
                    </button>
                )}
            </div>

            {/* Bouton Mois suivant */}
            <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={isCurrentMonth()}
                className={`h-8 w-8 p-0 hover:bg-slate-800 ${isCurrentMonth() ? 'opacity-30 cursor-not-allowed' : ''}`}
                title="Mois suivant"
            >
                <ChevronRight className="w-4 h-4 text-slate-400" />
            </Button>
        </div>
    );
}
