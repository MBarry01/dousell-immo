import { ArrowRight, Building2, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface GestionLocativeWidgetProps {
    activeLeases?: number;
    pendingPayments?: number;
    maintenanceRequests?: number;
    financials?: {
        total: number;
        collected: number;
        percent: number;
    };
}

export function GestionLocativeWidget({
    activeLeases = 3,
    pendingPayments = 2,
    maintenanceRequests = 1,
    financials = { total: 0, collected: 0, percent: 0 }
}: GestionLocativeWidgetProps) {
    // Format current month (e.g., "Décembre")
    const currentMonthName = new Date().toLocaleString('fr-FR', { month: 'long' });
    const monthLabel = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

    return (
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card hover:bg-accent/50 transition-all duration-300 mb-8">

            {/* 1. HEADER : Titre + Badge Premium */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="space-y-0.5">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        Gestion Locative
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Automatisez vos revenus fonciers.
                    </p>
                </div>

                {/* Badge Premium Style "Linear" */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    <span className="text-[10px] font-medium text-yellow-600 dark:text-yellow-500 uppercase tracking-wider">Premium</span>
                </div>
            </div>

            {/* 2. BODY : Les Métriques (Grid) */}
            <div className="grid grid-cols-3 divide-x divide-border">

                {/* KPI 1 : Baux Actifs */}
                <Link href="/gestion" className="p-2 flex flex-col items-center justify-center text-center gap-2 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                        <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-xl font-mono font-bold text-foreground">{activeLeases}</span>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-1">Baux Actifs</p>
                    </div>
                </Link>

                {/* KPI 2 : En Attente (Dynamic Color) */}
                <Link href="/gestion" className="p-2 flex flex-col items-center justify-center text-center gap-2 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className={`p-2 rounded-lg ${pendingPayments > 0 ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {pendingPayments > 0 ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </div>
                    <div>
                        <span className={`text-xl font-mono font-bold ${pendingPayments > 0 ? 'text-foreground' : 'text-emerald-500'}`}>
                            {pendingPayments}
                        </span>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-1">
                            {pendingPayments === 0 ? 'Retard' : 'En attente'}
                        </p>
                    </div>
                </Link>

                {/* KPI 3 : Pannes (Rouge) */}
                <Link href="/gestion" className="p-2 flex flex-col items-center justify-center text-center gap-2 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-xl font-mono font-bold text-foreground">{maintenanceRequests}</span>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-1">Pannes</p>
                    </div>
                </Link>

            </div>

            {/* 3. FOOTER : Section Financière (Remplacement du simple lien) */}
            <Link href="/gestion" className="block border-t border-border bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground text-xs">Revenus de {monthLabel}</span>
                    <span className="text-foreground font-mono font-medium text-xs">
                        {financials.percent}% <span className="text-muted-foreground text-[10px]">encaissé</span>
                    </span>
                </div>

                {/* Barre de progression */}
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                        style={{ width: `${financials.percent}%` }}
                    />
                </div>

                <div className="flex justify-between mt-2 text-[10px] font-mono">
                    <div className="text-emerald-500 font-medium">
                        + {financials.collected.toLocaleString()} FCFA
                    </div>
                    <div className="text-muted-foreground">
                        Obj: {financials.total.toLocaleString()} FCFA
                    </div>
                </div>
            </Link>
        </div>
    );
}
