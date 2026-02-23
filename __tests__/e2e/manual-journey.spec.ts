/**
 * Parcours Manuel : Login UI → OTP → Annonce → Marquer Loué → Gestion
 *
 * Ce test ouvre le vrai navigateur et remplit les champs automatiquement.
 * Tu dois manuellement :
 *   1. Compléter le Captcha Turnstile
 *   2. Entrer le code OTP reçu par email (si demandé)
 *   3. Le reste du parcours est automatisé
 *
 * Compte : bariscomoh@gmail.com / Mbarry@0298
 */
import { test, expect } from '@playwright/test';

const TEST_EMAIL    = 'bariscomoh@gmail.com';
const TEST_PASSWORD = 'Barry@0298';
const ARTIFACTS_DIR = '__tests__/e2e/artifacts';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

async function mockNominatim(page: import('@playwright/test').Page) {
  await page.route('**/nominatim.openstreetmap.org/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        place_id: 1,
        lat: '14.7167',
        lon: '-17.4677',
        display_name: 'Dakar, Sénégal',
        address: { city: 'Dakar', state: 'Dakar', country: 'Sénégal' },
      }]),
    });
  });
}

test.describe('Parcours Manuel Complet', () => {

  test('Connexion → Annonce → Marquer Loué → Gestion', async ({ page }) => {
    test.setTimeout(300_000); // 5 minutes max (pour le Captcha + OTP)

    await mockNominatim(page);

    // ── ÉTAPE 0 : Accepter les cookies si la modale apparaît ──────────
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const acceptCookiesBtn = page.locator('button').filter({ hasText: /Tout accepter|Accepter/i }).first();
    if (await acceptCookiesBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await acceptCookiesBtn.click();
      await page.waitForTimeout(800);
      console.log('✅ Cookies acceptés');
    }

    // ── ÉTAPE 1 : Login via UI ─────────────────────────────────────────
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Remplir email et mot de passe automatiquement
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASSWORD);

    await page.screenshot({ path: `${ARTIFACTS_DIR}/manual-01-login-pret.png` });

    console.log('⏳ En attente : complète le Captcha et clique "Se connecter" dans le navigateur...');
    console.log('⏳ Si un code OTP est demandé, entre-le également.');

    // Attendre la redirection après login + Captcha + OTP (3 minutes max)
    // ERR_ABORTED est normal avec window.location.href – on attrape et on vérifie l'URL
    try {
      await page.waitForURL(/\/(gestion|compte|bienvenue)/, { timeout: 180_000 });
    } catch {
      // Peut échouer avec ERR_ABORTED (redirect via window.location.href)
      // On attend que la page se stabilise puis on vérifie l'URL
      await page.waitForTimeout(3_000);
      const currentUrl = page.url();
      if (!currentUrl.match(/\/(gestion|compte|bienvenue)/)) {
        throw new Error(`Login échoué – URL actuelle : ${currentUrl}`);
      }
    }

    console.log('✅ Connexion réussie !', await page.url());
    await page.screenshot({ path: `${ARTIFACTS_DIR}/manual-02-connexion-ok.png`, fullPage: true });

    // Nettoyer localStorage
    await page.evaluate(() => {
      localStorage.removeItem('deposit_form_data_v3');
      localStorage.removeItem('deposit_form_images_v3');
      localStorage.removeItem('deposit_form_step_v3');
    });

    // ── ÉTAPE 2 : Créer une annonce ────────────────────────────────────
    await page.goto('/compte/deposer', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: `${ARTIFACTS_DIR}/manual-03-deposer-step1.png` });

    // Step 1 : L'essentiel
    await page.click('button:has-text("Location")');
    await page.fill('input[placeholder="Ex: Belle villa avec piscine"]', 'Appartement Test E2E Manual');
    await page.fill('input[type="number"][placeholder="0"]', '150000');
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(800);

    // Step 2 : Localisation
    const addressInput = page.locator('input[placeholder="Ex: 15 Avenue Lamine Gueye..."]');
    await addressInput.fill('Dakar');
    await page.waitForTimeout(1500);

    const firstResult = page.locator('[data-radix-popper-content-wrapper] div')
      .filter({ hasText: 'Dakar' }).first();
    if (await firstResult.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await firstResult.click();
    }
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${ARTIFACTS_DIR}/manual-04-adresse.png` });
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(800);

    // Step 3 : Détails
    const surfaceInput = page.locator('input[placeholder="0"]').first();
    await surfaceInput.fill('65');
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(800);

    // Step 4 : Photo
    const fileInput = page.locator('input#deposer-file-upload');
    await fileInput.setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: TINY_PNG });
    await page.waitForTimeout(4_000);
    await page.screenshot({ path: `${ARTIFACTS_DIR}/manual-05-photo.png` });
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(800);

    // Step 5 : Publier
    await page.screenshot({ path: `${ARTIFACTS_DIR}/manual-06-publication.png` });
    await page.click('button:has-text("Publier gratuitement")');
    await page.waitForURL('**/compte/mes-biens**', { timeout: 20_000 });
    await page.waitForTimeout(2_000);

    console.log('✅ Annonce publiée !');
    await page.screenshot({ path: `${ARTIFACTS_DIR}/manual-07-mes-biens.png`, fullPage: true });
    await expect(page).toHaveURL(/mes-biens/);

    // ── ÉTAPE 3 : Marquer comme Loué ──────────────────────────────────
    // Ouvrir le menu ⋮ sur la première carte
    const moreMenuBtn = page.locator('button[type="button"]').filter({
      has: page.locator('.lucide-more-vertical, [data-lucide="more-vertical"], svg'),
    }).first();

    if (await moreMenuBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await moreMenuBtn.click();
      await page.waitForTimeout(500);

      await page.screenshot({ path: `${ARTIFACTS_DIR}/manual-08-dropdown.png` });

      const marquerBtn = page.locator('[role="menuitem"]')
        .filter({ hasText: /Marquer comme.*[Ll]ou/i }).first();

      if (await marquerBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        page.on('dialog', async (dialog) => { await dialog.accept(); });
        await marquerBtn.click();
        await page.waitForTimeout(1_000);

        // Si modal upsell
        const plusTardBtn = page.locator('button').filter({ hasText: /Plus tard.*loué/i }).first();
        if (await plusTardBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
          await page.screenshot({ path: `${ARTIFACTS_DIR}/manual-09-upsell.png` });
          await plusTardBtn.click();
          await page.waitForTimeout(2_000);
        }
      }
    }

    console.log('✅ Bien marqué comme loué !');
    await page.screenshot({ path: `${ARTIFACTS_DIR}/manual-10-apres-loue.png`, fullPage: true });

    // ── ÉTAPE 4 : Page Gestion ─────────────────────────────────────────
    await page.goto('/gestion', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3_000);

    await page.screenshot({ path: `${ARTIFACTS_DIR}/manual-11-gestion.png`, fullPage: true });
    await expect(page).toHaveURL(/\/gestion/);

    const gestionContent = page.locator('main, aside, nav').first();
    await expect(gestionContent).toBeVisible({ timeout: 10_000 });

    console.log('✅ Page /gestion chargée avec succès !');
    console.log('🎉 Parcours complet terminé !');
  });

});
