'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { processLateReminders } from '@/app/actions/reminders';
import { toast } from 'sonner';

export function SendRemindersButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSendReminders = async () => {
        setIsLoading(true);
        try {
            const result = await processLateReminders();

            if (result.count > 0) {
                toast.success(`✅ ${result.count} relance(s) envoyée(s) avec succès`, {
                    description: result.message,
                    duration: 5000,
                });
            } else {
                toast.info('ℹ️ Aucune relance à envoyer', {
                    description: result.message,
                    duration: 4000,
                });
            }
        } catch (error) {
            toast.error('❌ Erreur lors de l\'envoi des relances', {
                description: error instanceof Error ? error.message : 'Une erreur est survenue',
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleSendReminders}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 h-9 px-3"
        >
            <Bell className="w-4 h-4 mr-2" />
            {isLoading ? 'Envoi...' : 'Relances J+5'}
        </Button>
    );
}
