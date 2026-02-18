"use client";

import { LockKey } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useAccessRequestModal } from "@/components/modals/AccessRequestModal";
import type { TeamPermissionKey } from "@/lib/team-permissions";

interface PermissionDeniedStateProps {
    teamId: string;
    permission: TeamPermissionKey;
    permissionLabel: string;
    title?: string;
    description?: string;
}

export function PermissionDeniedState({
    teamId,
    permission,
    permissionLabel,
    title = "Accès restreint",
    description = "Vous n'avez pas la permission nécessaire pour accéder à cette page."
}: PermissionDeniedStateProps) {
    const { open, Modal } = useAccessRequestModal();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="p-4 rounded-full mb-6 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <LockKey size={48} weight="duotone" />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-white">
                {title}
            </h2>

            <p className="max-w-md mb-8 text-lg text-gray-600 dark:text-slate-400">
                {description}
            </p>

            <div className="flex flex-col items-center gap-4">
                <Button
                    size="lg"
                    onClick={() => open({
                        teamId,
                        permission,
                        permissionLabel,
                        permissionDescription: `Accès requis pour : ${title}`
                    })}
                >
                    Demander l'accès
                </Button>

                <p className="text-sm text-muted-foreground">
                    Une demande sera envoyée au propriétaire de l'équipe.
                </p>
            </div>

            <Modal />
        </div>
    );
}
