'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ExpenseCategory } from './expense-types';

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Non authentifié' };
    }

    const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
            owner_id: user.id,
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

    revalidatePath('/gestion-locative/comptabilite');
    return { success: true, expense };
}

// ==========================================
// GET EXPENSES BY MONTH
// ==========================================
export async function getExpensesByMonth(month: number, year: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Non authentifié', expenses: [] };
    }

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: expenses, error } = await supabase
        .from('expenses')
        .select(`
            *,
            properties:property_id (address),
            leases:lease_id (tenant_name)
        `)
        .eq('owner_id', user.id)
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Non authentifié', expenses: [] };
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('owner_id', user.id)
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Non authentifié' };
    }

    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('owner_id', user.id);

    if (error) {
        console.error('Error deleting expense:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/gestion-locative/comptabilite');
    return { success: true, message: 'Dépense supprimée' };
}

