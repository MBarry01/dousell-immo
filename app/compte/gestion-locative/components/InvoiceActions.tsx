"use client"
import { CheckCircle, FileText, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { confirmPayment } from "../actions";
import { useState } from 'react';

interface Transaction {
    id: string;
    status: 'pending' | 'paid' | 'overdue';
    notice_url?: string;
    receipt_url?: string;
}

export function InvoiceActions({ transaction }: { transaction: Transaction }) {
    const [loading, setLoading] = useState(false);

    const handleConfirmPayment = async () => {
        setLoading(true);
        await confirmPayment(transaction.id);
        setLoading(false);
    };

    return (
        <div className="flex items-center gap-2">
            {transaction.status === 'pending' || transaction.status === 'overdue' ? (
                <Button
                    size="sm"
                    onClick={handleConfirmPayment}
                    disabled={loading}
                    className="bg-green-600/20 text-green-500 border border-green-500/30 hover:bg-green-600 hover:text-white"
                >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {loading ? "..." : "Marquer payé"}
                </Button>
            ) : (
                <Button
                    size="sm"
                    variant="outline"
                    className="text-gray-400"
                    onClick={() => transaction.receipt_url && window.open(transaction.receipt_url, '_blank')}
                    disabled={!transaction.receipt_url}
                >
                    <FileText className="w-4 h-4 mr-2" /> Voir Quittance
                </Button>
            )}

            {transaction.notice_url && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-400"
                    onClick={() => window.open(transaction.notice_url, '_blank')}
                >
                    <Download className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
}
