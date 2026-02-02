import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './auth.helper';

test.describe('Real-Time Synchronization', () => {
    test('should update dashboard instantly when expense is created', async ({ page, context }) => {
        // 1. Login on first page (Main Dashboard)
        await loginAsTestUser(page);

        // 2. Récupérer le profit initial
        const initialProfit = await page
            .locator('text=Profit Net')
            .first()
            .textContent();
        console.log('Initial Profit:', initialProfit);

        // 3. Ouvrir la page "Interventions" sur un autre onglet (Secondary Page)
        // Context shares cookies, so it should be logged in.
        const interventionPage = await context.newPage();
        await interventionPage.goto('http://localhost:3000/gestion/interventions', { waitUntil: 'domcontentloaded' });

        // 4. Créer une dépense
        const createBtn = interventionPage.locator('button:has-text("➕ Créer Intervention")');
        // Ensure button exists (login check on second page)
        await expect(createBtn).toBeVisible({ timeout: 10000 });

        await createBtn.click();
        await interventionPage.waitForSelector('input[name="cost"]', { timeout: 5000 });
        await interventionPage.fill('input[name="cost"]', '25000');
        await interventionPage.fill('input[name="description"]', 'Test Real-Time Sync');
        await interventionPage.click('button:has-text("Créer")');

        // Attendre la propagation Realtime
        await page.waitForTimeout(2000);

        // 5. Revenir à la première page et vérifier que le profit est mis à jour
        // Note: 'page' is the Dashboard page. It should update automatically via Supabase Realtime.
        const updatedProfit = await page
            .locator('text=Profit Net')
            .first()
            .textContent();
        console.log('Updated Profit:', updatedProfit);

        // Le profit devrait avoir changé
        expect(updatedProfit).not.toEqual(initialProfit);
    });
});
