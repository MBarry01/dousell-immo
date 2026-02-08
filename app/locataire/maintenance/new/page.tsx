import { MaintenanceForm } from '../components/MaintenanceForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Nouveau Signalement - Portail Locataire',
};

export default function NewMaintenanceRequestPage() {
    return (
        <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link
                    href="/locataire/maintenance"
                    className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-zinc-900">Nouveau Signalement</h1>
                    <p className="text-sm text-zinc-500">Décrivez le problème rencontré</p>
                </div>
            </div>

            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                    <strong>Conseil :</strong> Une photo claire du problème permet un traitement plus rapide de votre demande.
                </p>
            </div>

            {/* Form */}
            <MaintenanceForm />
        </div>
    );
}
