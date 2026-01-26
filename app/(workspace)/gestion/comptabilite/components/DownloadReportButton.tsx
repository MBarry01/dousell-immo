'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react';
import { FinancialReportPDF } from './FinancialReportPDF';
import { PropertyProfitability } from '../expenses-actions';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/workspace/providers/theme-provider';

interface DownloadReportButtonProps {
    year: number;
    globalStats: {
        revenue: number;
        expenses: number;
        profit: number;
        margin: number;
    };
    properties: PropertyProfitability[];
}

export function DownloadReportButton({ year, globalStats, properties }: DownloadReportButtonProps) {
    const { isDark } = useTheme();

    return (
        <PDFDownloadLink
            document={
                <FinancialReportPDF
                    year={year}
                    globalStats={globalStats}
                    properties={properties}
                />
            }
            fileName={`rapport-fi-doussel-${year}.pdf`}
        >
            {({ blob, url, loading, error }) => (
                <Button
                    variant="outline"
                    size="sm"
                    className={`gap-2 ${isDark
                        ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900'}`}
                    disabled={loading}
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden md:inline">{loading ? 'Génération...' : 'Rapport PDF'}</span>
                </Button>
            )}
        </PDFDownloadLink>
    );
}
