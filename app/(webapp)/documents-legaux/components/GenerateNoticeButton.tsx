"use client";

import { Button } from "@/components/ui/button";
import { generateNotice } from "../actions";
import { useTransition } from "react";
import { toast } from "sonner";

interface GenerateNoticeButtonProps {
    leaseId: string;
    noticeType: 'J-180' | 'J-90';
    status: 'pending' | 'sent';
}

export function GenerateNoticeButton({ leaseId, noticeType, status }: GenerateNoticeButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleGenerate = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('leaseId', leaseId);
            formData.append('noticeType', noticeType);

            const result = await generateNotice(formData);

            if (result.success) {
                toast.success(result.message || "Préavis généré avec succès");
            } else {
                toast.error(result.error || "Impossible de générer le préavis");
            }
        });
    };

    if (status === 'sent') {
        return (
            <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-white"
            >
                Voir détails
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={handleGenerate}
            disabled={isPending}
        >
            {isPending ? "Génération..." : "Générer Préavis"}
        </Button>
    );
}
