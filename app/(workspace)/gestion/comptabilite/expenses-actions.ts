"use server";

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ExpenseCategory } from './expense-types';
import { getUserTeamContext } from "@/lib/team-context";
import { requireTeamPermission } from "@/lib/permissions";
import { checkFeatureAccess } from "@/lib/subscription/team-subscription";

// Re-export the type for convenience
export type { ExpenseCategory } from './expense-types';

export interface Expense {
    id: string;
    owner_id: string;
    property_id?: string | null;
    lease_id?: string | null;
    amount: number;
    expense_date: string;
    category: ExpenseCategory;
    description?: string | null;
    proof_url?: string | null;
    created_at: string;
    updated_at: string;
    // Joined data
    property_address?: string;
    tenant_name?: string;
}

export interface AddExpenseInput {
    property_id?: string;
    lease_id?: string;
    amount: number;
    expense_date: string;
    category: ExpenseCategory;
    description?: string;
    proof_url?: string;
}

// ==========================================
// ADD EXPENSE
// ==========================================
export async function addExpense(data: AddExpenseInput) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId, user } = context;
    await requireTeamPermission('expenses.create');

    const supabase = await createClient();

    const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
            owner_id: user.id,
            team_id: teamId,
            property_id: data.property_id || null,
            lease_id: data.lease_id || null,
            amount: data.amount,
            expense_date: data.expense_date,
            category: data.category,
            description: data.description || null,
            proof_url: data.proof_url || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding expense:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/gestion/comptabilite');
    return { success: true, expense };
}

// ==========================================
// GET EXPENSES BY MONTH
// ==========================================
export async function getExpensesByMonth(month: number, year: number) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé", expenses: [] };
    const { teamId } = context;
    const supabase = await createClient();

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: expenses, error } = await supabase
        .from('expenses')
        .select(`
            *,
            properties:property_id (address),
            leases:lease_id (tenant_name)
        `)
        .eq('team_id', teamId)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false });

    if (error) {
        console.error('Error fetching expenses:', error);
        return { success: false, error: error.message, expenses: [] };
    }

    // Format the expenses with joined data
    const formattedExpenses: Expense[] = (expenses || []).map((e: any) => ({
        ...e,
        property_address: e.properties?.address || null,
        tenant_name: e.leases?.tenant_name || null,
    }));

    return { success: true, expenses: formattedExpenses };
}

// ==========================================
// GET TOTAL EXPENSES BY YEAR
// ==========================================
export async function getExpensesByYear(year: number) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé", expenses: [] };
    const { teamId } = context;
    const supabase = await createClient();

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('team_id', teamId)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false });

    if (error) {
        console.error('Error fetching yearly expenses:', error);
        return { success: false, error: error.message, expenses: [] };
    }

    return { success: true, expenses: expenses || [] };
}

// ==========================================
// DELETE EXPENSE
// ==========================================
export async function deleteExpense(expenseId: string) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId } = context;
    await requireTeamPermission('expenses.delete');

    const supabase = await createClient();

    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('team_id', teamId);

    if (error) {
        console.error('Error deleting expense:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/gestion/comptabilite');
    return { success: true, message: 'Dépense supprimée' };
}

// ==========================================
// UPDATE EXPENSE
// ==========================================
export async function updateExpense(
    expenseId: string,
    data: Partial<AddExpenseInput>
) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId } = context;
    await requireTeamPermission('expenses.edit');

    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.expense_date !== undefined) updateData.expense_date = data.expense_date;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.proof_url !== undefined) updateData.proof_url = data.proof_url;
    if (data.property_id !== undefined) updateData.property_id = data.property_id || null;
    if (data.lease_id !== undefined) updateData.lease_id = data.lease_id || null;
    updateData.updated_at = new Date().toISOString();

    const { data: expense, error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expenseId)
        .eq('team_id', teamId)
        .select()
        .single();

    if (error) {
        console.error('Error updating expense:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/gestion/comptabilite');
    return { success: true, expense };
}

// ==========================================
// GET EXPENSES SUMMARY
// ==========================================
export interface ExpensesSummary {
    totalExpenses: number;
    byCategory: { category: ExpenseCategory; label: string; total: number; count: number }[];
    byMonth: { month: string; total: number }[];
}

export async function getExpensesSummary(year: number): Promise<{
    success: boolean;
    error?: string;
    summary?: ExpensesSummary;
}> {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId } = context;
    const supabase = await createClient();

    const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('team_id', teamId)
        .gte('expense_date', `${year}-01-01`)
        .lte('expense_date', `${year}-12-31`);

    if (error) {
        console.error('Error fetching expenses summary:', error);
        return { success: false, error: error.message };
    }

    const { EXPENSE_CATEGORY_LABELS } = await import('./expense-types');

    // Calculate totals by category
    const categoryMap = new Map<ExpenseCategory, { total: number; count: number }>();
    let totalExpenses = 0;

    for (const expense of expenses || []) {
        totalExpenses += expense.amount;
        const cat = expense.category as ExpenseCategory;
        const existing = categoryMap.get(cat) || { total: 0, count: 0 };
        categoryMap.set(cat, {
            total: existing.total + expense.amount,
            count: existing.count + 1,
        });
    }

    const byCategory = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
            category,
            label: EXPENSE_CATEGORY_LABELS[category] || category,
            total: data.total,
            count: data.count,
        }))
        .sort((a, b) => b.total - a.total);

    // Calculate totals by month
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthTotals = new Array(12).fill(0);

    for (const expense of expenses || []) {
        const month = new Date(expense.expense_date).getMonth();
        monthTotals[month] += expense.amount;
    }

    const byMonth = monthTotals.map((total, index) => ({
        month: monthNames[index],
        total,
    }));

    return {
        success: true,
        summary: {
            totalExpenses,
            byCategory,
            byMonth,
        },
    };
}

// ==========================================
// GET PROFITABILITY BY PROPERTY
// ==========================================
export interface PropertyProfitability {
    propertyAddress: string;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
}

// ==========================================
// GET COMPTABILITE DATA (Team-Centric)
// ==========================================
export interface ComptabiliteData {
    leases: {
        id: string;
        monthly_amount: number;
        status: string;
        start_date: string;
        billing_day: number;
        tenant_name?: string;
    }[];
    transactions: {
        id: string;
        lease_id: string;
        amount_due: number;
        status: string;
        period_month: number;
        period_year: number;
        created_at: string;
        amount_paid: number;
    }[];
    properties: { id: string; address: string }[];
}

export async function getComptabiliteData(year: number): Promise<{
    success: boolean;
    error?: string;
    data?: ComptabiliteData;
    upgradeRequired?: boolean;
}> {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId } = context;

    // ✅ CHECK FEATURE: Accounting Module Access
    const access = await checkFeatureAccess(teamId, "view_advanced_reports");
    if (!access.allowed) {
        return { success: false, error: access.message, upgradeRequired: true };
    }

    const supabase = await createClient();

    // 1. Fetch all leases for the team
    const { data: leasesData, error: leasesError } = await supabase
        .from('leases')
        .select('id, monthly_amount, status, start_date, billing_day, tenant_name, property_address')
        .eq('team_id', teamId);

    if (leasesError) {
        console.error('Error fetching leases for comptabilite:', leasesError);
        return { success: false, error: leasesError.message };
    }

    const leases = (leasesData || []).map(l => ({
        id: l.id,
        monthly_amount: l.monthly_amount,
        status: l.status || 'active',
        start_date: l.start_date,
        billing_day: l.billing_day || 5,
        tenant_name: l.tenant_name
    }));

    // 2. Build properties list from leases (for expense form)
    const properties = (leasesData || [])
        .filter(l => l.status === 'active')
        .map(l => ({
            id: l.id,
            address: l.tenant_name || l.property_address || 'Locataire'
        }));

    // 3. Fetch transactions for the year
    const leaseIds = leases.map(l => l.id);

    if (leaseIds.length === 0) {
        return {
            success: true,
            data: { leases, transactions: [], properties }
        };
    }

    const { data: txsData, error: txsError } = await supabase
        .from('rental_transactions')
        .select('id, lease_id, amount_due, amount_paid, status, period_month, period_year, created_at')
        .eq('team_id', teamId)
        .eq('period_year', year);

    if (txsError) {
        console.error('Error fetching transactions for comptabilite:', txsError);
        return { success: false, error: txsError.message };
    }

    const transactions = (txsData || []).map(t => ({
        ...t,
        // Préserver amount_paid réel, fallback si absent
        amount_paid: t.amount_paid ?? ((t.status?.toLowerCase() === 'paid') ? t.amount_due : 0)
    }));

    return {
        success: true,
        data: { leases, transactions, properties }
    };
}

export async function getProfitabilityByProperty(year: number): Promise<{
    success: boolean;
    error?: string;
    data?: PropertyProfitability[];
    debug?: any;
    upgradeRequired?: boolean;
}> {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId, user } = context;

    // ✅ CHECK FEATURE QUOTA (EXPORT)
    const access = await checkFeatureAccess(teamId, "export_data");
    if (!access.allowed) {
        return {
            success: false,
            error: access.message,
            upgradeRequired: access.upgradeRequired
        };
    }

    const supabase = await createClient();

    // Get all leases with their payments
    const { data: leases, error: leasesError } = await supabase
        .from('leases')
        .select('id, property_address, monthly_amount')
        .eq('team_id', teamId);

    if (leasesError) {
        console.error('Error fetching leases for profitability:', leasesError);
        return { success: false, error: leasesError.message };
    }

    // Get all expenses for the year
    const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('team_id', teamId)
        .gte('expense_date', `${year}-01-01`)
        .lte('expense_date', `${year}-12-31`);

    if (expensesError) {
        console.error('Error fetching expenses for profitability:', expensesError);
        return { success: false, error: expensesError.message };
    }

    // Get all payments for the year (rent collected)
    const { data: payments, error: paymentsError } = await supabase
        .from('rental_transactions')
        .select('lease_id, amount_due, amount_paid, status')
        .eq('status', 'paid')
        .eq('period_year', year)
        .eq('team_id', teamId);

    if (paymentsError) {
        console.error('Error fetching payments for profitability:', paymentsError);
        return { success: false, error: paymentsError.message };
    }

    // Build property map
    const propertyMap = new Map<string, { revenue: number; expenses: number }>();

    // Process leases and payments
    for (const lease of leases || []) {
        const address = lease.property_address || 'Adresse inconnue';
        if (!propertyMap.has(address)) {
            propertyMap.set(address, { revenue: 0, expenses: 0 });
        }

        // Sum payments for this lease — utiliser amount_paid réel (paiements partiels)
        const leasePayments = (payments || []).filter(p => p.lease_id === lease.id);
        const totalPayments = leasePayments.reduce(
            (sum, p) => sum + (p.amount_paid != null ? Number(p.amount_paid) : Number(p.amount_due) || 0),
            0
        );

        const prop = propertyMap.get(address)!;
        prop.revenue += totalPayments;
    }

    // Process expenses - either by lease or property_id
    for (const expense of expenses || []) {
        let address = 'Non attribué';

        if (expense.lease_id) {
            const lease = (leases || []).find(l => l.id === expense.lease_id);
            if (lease) {
                address = lease.property_address || 'Adresse inconnue';
            }
        }

        if (!propertyMap.has(address)) {
            propertyMap.set(address, { revenue: 0, expenses: 0 });
        }

        const prop = propertyMap.get(address)!;
        prop.expenses += expense.amount;
    }

    // Calculate profitability
    const data: PropertyProfitability[] = Array.from(propertyMap.entries())
        .map(([address, { revenue, expenses }]) => ({
            propertyAddress: address,
            totalRevenue: revenue,
            totalExpenses: expenses,
            netProfit: revenue - expenses,
            profitMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
        }))
        .sort((a, b) => b.netProfit - a.netProfit);

    return {
        success: true,
        data,
        debug: {
            leasesCount: leases?.length || 0,
            expensesCount: expenses?.length || 0,
            paymentsCount: payments?.length || 0,
            mapSize: propertyMap.size,
            ownerId: user.id
        }
    };
}

