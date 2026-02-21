import { MaintenanceForm } from '../components/MaintenanceForm';
import { ArrowLeft, Wrench } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Nouveau Signalement - Portail Locataire',
};

export default function NewMaintenanceRequestPage() {
    return (
        <div className="w-full max-w-lg mx-auto px-4 py-8 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/locataire/maintenance"
                    className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-[#0F172A] hover:text-[#0F172A] hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-black text-[#0F172A] tracking-tighter leading-tight">Nouveau Signalement</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-70">Réglez vos soucis en quelques clics</p>
                </div>
            </div>

            {/* Info */}
            <div className="bg-[#F4C430]/10 border border-[#F4C430]/20 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#F4C430]"></div>
                <div className="flex gap-4 items-start relative">
                    <div className="w-10 h-10 rounded-xl bg-[#F4C430] flex items-center justify-center text-[#0F172A] flex-shrink-0 shadow-lg shadow-[#F4C430]/20">
                        <Wrench className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-black text-[#0F172A]/80 leading-relaxed uppercase tracking-tight">
                        <strong className="text-[#0F172A]">Astuce :</strong> Une photo claire accélère le traitement de votre demande.
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                <MaintenanceForm />
            </div>
        </div>
    );
}
