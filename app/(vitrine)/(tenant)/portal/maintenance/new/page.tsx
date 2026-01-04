import { MaintenanceForm } from '../components/MaintenanceForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Nouveau Signalement - Portail Locataire',
};

export default function NewMaintenanceRequestPage() {
    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 h-14 flex items-center gap-3">
                <Link href="/portal/maintenance" className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="font-semibold text-white">Nouveau Signalement</h1>
            </header>

            <main className="p-4 max-w-lg mx-auto">
                <div className="mb-6">
                    <p className="text-sm text-slate-400">
                        Décrivez le problème précisément. Une photo est obligatoire pour un traitement rapide.
                    </p>
                </div>

                <MaintenanceForm />
            </main>
        </div>
    );
}
