'use client';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthSelectorProps {
    selectedMonth: number; // 1-12
    selectedYear: number;
    onMonthChange: (month: number, year: number) => void;
}

const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function MonthSelector({ selectedMonth, selectedYear, onMonthChange }: MonthSelectorProps) {
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

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg">
            {/* Bouton Mois précédent */}
            <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                className="h-8 w-8 p-0 hover:bg-slate-800"
                title="Mois précédent"
            >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
            </Button>

            {/* Affichage du mois et année */}
            <div className="flex items-center gap-2 px-2">
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
                className="h-8 w-8 p-0 hover:bg-slate-800"
                title="Mois suivant"
            >
                <ChevronRight className="w-4 h-4 text-slate-400" />
            </Button>
        </div>
    );
}
