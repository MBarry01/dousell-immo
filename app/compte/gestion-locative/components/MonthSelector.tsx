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
        <div className="flex items-center justify-between gap-4 p-4 bg-gray-900/40 border border-gray-800 rounded-2xl">
            {/* Bouton Mois précédent */}
            <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                className="rounded-xl hover:bg-gray-800"
                title="Mois précédent"
            >
                <ChevronLeft className="w-5 h-5" />
            </Button>

            {/* Affichage du mois et année */}
            <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-5 h-5 text-[#F4C430]" />
                    <h3 className="text-lg font-bold text-white">
                        {MONTHS_FR[selectedMonth - 1]} {selectedYear}
                    </h3>
                </div>
                {!isCurrentMonth() && (
                    <button
                        onClick={handleToday}
                        className="text-xs text-gray-500 hover:text-[#F4C430] transition-colors mt-1"
                    >
                        Revenir au mois actuel
                    </button>
                )}
            </div>

            {/* Bouton Mois suivant */}
            <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                className="rounded-xl hover:bg-gray-800"
                title="Mois suivant"
            >
                <ChevronRight className="w-5 h-5" />
            </Button>
        </div>
    );
}
