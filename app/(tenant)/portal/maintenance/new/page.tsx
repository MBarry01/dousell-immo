import { MaintenanceForm } from '../components/MaintenanceForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Nouveau Signalement - Portail Locataire',
};

export default function NewMaintenanceRequestPage() {
    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Mobile Simplifié */}
            <header className="sticky top-0 z-10 bg-white border-b px-4 h-14 flex items-center gap-3">
                <Link href="/portal/maintenance" className="p-2 -ml-2 text-slate-600">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="font-semibold text-slate-900">Nouveau Signalement</h1>
            </header>

            <main className="p-4 max-w-md mx-auto">
                <div className="mb-6">
                    <p className="text-sm text-slate-500">
                        Merci de signaler le problème le plus précisément possible. Une photo est obligatoire pour un traitement rapide.
                    </p>
                </div>

                <MaintenanceForm />
            </main>
        </div>
    );
}
