'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getTenantDashboardData as getCachedDashboardData } from '@/services/tenantService.cached';

export interface TenantDashboardData {
    hasLease: boolean;
    lease?: any;
    isUpToDate?: boolean;
    tenantName?: string;
}

export async function getTenantDashboardData(): Promise<TenantDashboardData> {
    const supabase = await createClient();

    // 1. Qui est connecté ?
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/auth');
    }

    // 2. Récupérer les données avec cache
    return getCachedDashboardData(user.email!);
}
