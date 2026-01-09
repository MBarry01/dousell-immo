"use client";

import { Check, X } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface ComparisonFeature {
    name: string;
    basic: boolean | string;
    pro: boolean | string;
    enterprise: boolean | string;
}

interface ComparisonGroup {
    groupName: string;
    features: ComparisonFeature[];
}

const COMPARISON_DATA: ComparisonGroup[] = [
    {
        groupName: "Gestion Locative",
        features: [
            { name: "Suivi des loyers", basic: true, pro: true, enterprise: true },
            { name: "Relances automatiques", basic: false, pro: true, enterprise: true },
            { name: "Quittances numériques", basic: "Manuelles", pro: "Automatiques", enterprise: "Automatiques" },
            { name: "Révision des loyers", basic: false, pro: true, enterprise: true },
        ],
    },
    {
        groupName: "Juridique & Assurance",
        features: [
            { name: "Contrats de bail conformes", basic: false, pro: true, enterprise: true },
            { name: "Protection loyers impayés", basic: false, pro: "Option", enterprise: "Incluse" },
            { name: "Assistance juridique", basic: false, pro: true, enterprise: "Prioritaire" },
        ],
    },
    {
        groupName: "Support",
        features: [
            { name: "Support technique", basic: "Email", pro: "Chat & Email", enterprise: "Dédié 24/7" },
            { name: "Onboarding personnalisé", basic: false, pro: false, enterprise: true },
        ],
    },
];

export function ComparisonTable() {
    const renderCell = (value: boolean | string) => {
        if (typeof value === "boolean") {
            return value ? (
                <div className="flex justify-center"><Check className="w-5 h-5 text-emerald-500" /></div>
            ) : (
                <div className="flex justify-center"><X className="w-5 h-5 text-slate-300" /></div>
            );
        }
        return <span className="text-sm font-medium text-slate-700">{value}</span>;
    };

    return (
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-[40%] text-left pl-6 py-6 text-lg font-bold text-slate-900">Fonctionnalités</TableHead>
                        <TableHead className="w-[20%] text-center py-6 text-lg font-bold text-slate-900">Gratuit</TableHead>
                        <TableHead className="w-[20%] text-center py-6 text-lg font-bold text-amber-600">Pro</TableHead>
                        <TableHead className="w-[20%] text-center py-6 text-lg font-bold text-slate-900">Agence</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {COMPARISON_DATA.map((group) => (
                        <>
                            <TableRow key={group.groupName} className="bg-slate-50/50 hover:bg-slate-50/50">
                                <TableCell colSpan={4} className="font-bold text-slate-500 uppercase tracking-wider text-xs py-3 pl-6">
                                    {group.groupName}
                                </TableCell>
                            </TableRow>
                            {group.features.map((feature, idx) => (
                                <TableRow key={idx} className="hover:bg-amber-50/10 transition-colors">
                                    <TableCell className="font-medium text-slate-700 pl-6 border-r border-slate-100">
                                        {feature.name}
                                    </TableCell>
                                    <TableCell className="text-center border-r border-slate-100">
                                        {renderCell(feature.basic)}
                                    </TableCell>
                                    <TableCell className="text-center border-r border-slate-100 bg-amber-50/30">
                                        {renderCell(feature.pro)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {renderCell(feature.enterprise)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
