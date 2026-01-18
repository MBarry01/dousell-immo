// Expense Category Types and Labels
// Moved to a separate file since 'use server' files can only export async functions

export type ExpenseCategory = 'maintenance' | 'tax' | 'utility' | 'insurance' | 'management_fee' | 'other';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    maintenance: 'Maintenance / Réparations',
    tax: 'Taxes & Impôts',
    utility: 'Charges (Eau, Électricité)',
    insurance: 'Assurance',
    management_fee: 'Frais de Gestion',
    other: 'Autre',
};
