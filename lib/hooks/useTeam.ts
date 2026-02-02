'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/use-auth';

interface TeamContext {
    team_id: string | null;
    user_id: string | null;
    user: any;
    loading: boolean;
}

/**
 * Hook pour récupérer l'ID de l'équipe de l'utilisateur actuel
 */
export function useTeam(): TeamContext {
    const { user, loading: authLoading } = useAuth();
    const supabase = createClient();

    const { data: teamMember, isLoading: teamLoading } = useQuery({
        queryKey: ['user-team', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

    return {
        team_id: teamMember?.team_id || null,
        user_id: user?.id || null,
        user,
        loading: authLoading || teamLoading,
    };
}
