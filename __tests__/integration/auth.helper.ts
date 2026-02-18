import { Page } from '@playwright/test';

/**
 * Helper pour login via Supabase Auth API (bypass la UI qui a des problèmes)
 */
export async function loginAsTestUser(page: Page) {
    console.log('🔐 [Auth] Login via Supabase Auth...');

    try {
        // 1. Appeler l'API de login Supabase directement
        const loginResponse = await page.request.post('http://localhost:3000/api/auth/login', {
            data: {
                email: 'test@dousell.com',
                password: 'TestPassword123!',
            },
        });

        if (!loginResponse.ok()) {
            console.error(`❌ Login API error: ${loginResponse.status()}`);

            // Si l'API n'existe pas, faire du login manuel avec retry
            console.log('⚠️ API login indisponible, essai login manuel...');
            await loginManuallyWithRetry(page);
            return;
        }

        const _result = await loginResponse.json();
        console.log('✅ Login API réussi');

        // 2. Naviguer vers le dashboard (la session devrait être établie)
        await page.goto('http://localhost:3000/gestion', { waitUntil: 'domcontentloaded' });
        // Verify we are actually there, just in case
        if (page.url() === 'http://localhost:3000/') {
            await page.goto('http://localhost:3000/gestion');
        }
        await page.waitForTimeout(2000);

    } catch (_error) {
        console.log('⚠️ API login error, essai manuel...');
        await loginManuallyWithRetry(page);
    }

    console.log('✅ Login complet réussi');
}

/**
 * Fallback : Login manuel avec retry logic
 */
async function loginManuallyWithRetry(page: Page, maxRetries = 3) {
    let attempt = 0;

    while (attempt < maxRetries) {
        attempt++;
        console.log(`📍 Tentative login manuel ${attempt}/${maxRetries}`);

        try {
            // Naviguer à la page de login
            await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000); // Laisser la page se charger

            // Remplir les champs
            const emailInput = page.locator('input[placeholder="oumar@example.com"]');
            await emailInput.click({ timeout: 5000, force: true });
            await emailInput.clear();
            await emailInput.type('test@dousell.com', { delay: 20 });

            const passwordInput = page.locator('input[placeholder="••••••••"]');
            await passwordInput.click({ timeout: 5000, force: true });
            await passwordInput.clear();
            await passwordInput.type('TestPassword123!', { delay: 20 });

            await page.waitForTimeout(1000);

            // Cliquer Bypass Captcha si visible
            const bypassBtn = page.locator('button:has-text("[DEV]")').first();
            try {
                if (await bypassBtn.isVisible({ timeout: 1000 })) {
                    await bypassBtn.click({ force: true });
                    await page.waitForTimeout(800);
                }
            } catch (_e) {
                // Ignorer si le bouton n'existe pas
            }

            // Chercher le bouton "Se connecter" qui est enabled
            const allButtons = await page.locator('button').all();
            let clickedSomething = false;

            for (const btn of allButtons) {
                const text = await btn.textContent();
                const isDisabled = await btn.isDisabled();

                if (text?.includes('Se connecter') && !isDisabled) {
                    console.log('✅ Bouton "Se connecter" trouvé (enabled), click...');
                    await btn.click({ force: true, timeout: 5000 });
                    clickedSomething = true;
                    break;
                }
            }

            if (!clickedSomething) {
                throw new Error('Aucun bouton "Se connecter" enabled trouvé');
            }

            // Attendre la redirection (Home ou Gestion)
            console.log('⏳ Attente redirection...');
            await page.waitForURL((url) => {
                return url.pathname === '/' || url.pathname.includes('/gestion');
            }, { timeout: 15000 });

            // Si on est sur la home, on va vers gestion
            if (page.url().replace(/\/$/, '') === 'http://localhost:3000') {
                console.log('📍 Redirection vers / detectée, navigation manuelle vers /gestion...');
                await page.goto('http://localhost:3000/gestion');
            }

            await page.waitForURL('**/gestion', { timeout: 15000 });
            await page.waitForTimeout(2000);

            console.log('✅ Login manuel réussi');
            return;

        } catch (error) {
            console.error(`❌ Tentative ${attempt} échouée: ${(error as Error).message}`);

            if (attempt < maxRetries) {
                console.log(`⏳ Retry dans 2 secondes...`);
                await page.waitForTimeout(2000);
            }
        }
    }

    throw new Error(`Login échoué après ${maxRetries} tentatives`);
}
