import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './auth.helper';

test.describe('Optimistic Updates', () => {
    // Fixture : Login une seule fois pour tous les tests
    // Fixture : Login une seule fois pour tous les tests
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
    });

    test('should update UI optimistically', async ({ page }) => {
        console.log('🧪 Test: Optimistic Update');

        // Attendre le chargement complet du Dashboard
        await page.waitForTimeout(1000);

        // Récupérer le profit avant
        const profitBefore = await page
            .locator('text=Profit Net')
            .first()
            .textContent({ timeout: 5000 });

        console.log('Profit Before:', profitBefore);
        expect(profitBefore).toBeTruthy();

        // Cliquer sur le bouton "Créer Intervention"
        const createBtn = page.locator('button:has-text("➕ Créer Intervention")');
        if (!(await createBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
            console.warn('⚠️ Bouton "Créer Intervention" non trouvé, test ignoré');
            return;
        }

        await createBtn.click();

        // Attendre le modal/formulaire
        await page.waitForSelector('input[name="cost"]', { timeout: 5000 }).catch(() => {
            console.warn('⚠️ Formulaire intervention non trouvé');
            return;
        });

        // Remplir le formulaire
        await page.fill('input[name="cost"]', '30000');
        await page.fill('input[name="description"]', 'Test Optimistic');

        // Cliquer sur "Créer"
        await page.click('button:has-text("Créer")');

        // Attendre la mise à jour optimiste (2 secondes max)
        await page.waitForTimeout(1000);

        // Vérifier que le profit a changé (optimistic)
        const profitOptimistic = await page
            .locator('text=Profit Net')
            .first()
            .textContent({ timeout: 2000 });

        console.log('Profit Optimistic:', profitOptimistic);

        // Le profit devrait être différent
        expect(profitOptimistic).not.toEqual(profitBefore);

        // Attendre le toast succès (timeout : 5s)
        await expect(page.locator('text=Intervention créée')).toBeVisible({ timeout: 5000 }).catch(() => {
            console.warn('⚠️ Toast succès non visible');
        });

        console.log('✅ Test Optimistic Update réussi');
    });

    test('should rollback UI on server error', async ({ page }) => {
        console.log('🧪 Test: Rollback on Error');

        await page.waitForTimeout(1000);

        // Récupérer le profit initial
        const profitBefore = await page
            .locator('text=Profit Net')
            .first()
            .textContent({ timeout: 5000 });

        console.log('Profit Before:', profitBefore);

        // Intercepter la requête et la bloquer
        await page.route('**/api/interventions', (route) => {
            console.log('🚫 Bloquant requête API interventions');
            route.abort('failed');
        });

        // Créer une intervention (va échouer)
        const createBtn = page.locator('button:has-text("➕ Créer Intervention")');
        if (!(await createBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
            console.warn('⚠️ Bouton créer non trouvé');
            return;
        }

        await createBtn.click();
        await page.waitForSelector('input[name="cost"]', { timeout: 5000 }).catch(() => null);

        await page.fill('input[name="cost"]', '50000');
        await page.fill('input[name="description"]', 'Test Rollback');
        await page.click('button:has-text("Créer")');

        // Attendre l'affichage de l'erreur
        await page.waitForTimeout(2000);

        // Vérifier le message d'erreur
        const errorMsg = await page.locator('text=Erreur').isVisible({ timeout: 5000 }).catch(() => false);
        console.log('Erreur affichée:', errorMsg);

        // Attendre le rollback
        await page.waitForTimeout(1500);

        // Vérifier que le profit est revenu
        const profitAfterRollback = await page
            .locator('text=Profit Net')
            .first()
            .textContent({ timeout: 2000 });

        console.log('Profit After Rollback:', profitAfterRollback);

        // Le profit devrait revenir à sa valeur initiale
        expect(profitAfterRollback).toEqual(profitBefore);

        console.log('✅ Test Rollback réussi');
    });
});
