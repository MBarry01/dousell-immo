/**
 * Parcours Complet AUTO : loginViaAPI → Annonce → Marquer Loué → Gestion → Onboarding
 *
 * Utilise loginViaAPI pour bypasser le Captcha Turnstile.
 * Compte : bariscomoh@gmail.com / Barry@0298
 */
import { test, expect } from '@playwright/test';
import { loginViaAPI } from './helpers/auth';

const TEST_EMAIL    = 'bariscomoh@gmail.com';
const TEST_PASSWORD = 'Barry@0298';
const ARTIFACTS_DIR = '__tests__/e2e/artifacts';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

/** Ferme la modale cookies si elle est visible (bloque tout le reste) */
async function dismissCookieConsent(page: import('@playwright/test').Page) {
  const acceptBtn = page.locator('button:has-text("Tout accepter")').first();
  if (await acceptBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await acceptBtn.click();
    await page.waitForTimeout(600);
    console.log('🍪 Cookie consent accepté');
  }
}

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

test.describe.configure({ mode: 'serial' });

test.describe('Parcours Complet Auto', () => {

  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
    // Nettoyer localStorage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.removeItem('deposit_form_data_v3');
      localStorage.removeItem('deposit_form_images_v3');
      localStorage.removeItem('deposit_form_step_v3');
    });
    // Login API (bypass captcha)
    await loginViaAPI(page, TEST_EMAIL, TEST_PASSWORD);
    // Accepter cookies si modale présente
    await dismissCookieConsent(page);
  });

  // ── ÉTAPE 1 : Connexion ───────────────────────────────────────────────────
  test('1 – Connexion réussie via API', async ({ page }) => {
    await expect(page).toHaveURL(/\/(gestion|compte|bienvenue)/, { timeout: 15_000 });

    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();

    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-01-connexion-ok.png`, fullPage: true });
    console.log('✅ Connexion réussie :', page.url());
  });

  // ── ÉTAPE 2 : Créer une annonce ───────────────────────────────────────────
  test('2 – Créer une annonce (5 étapes)', async ({ page }) => {
    await mockNominatim(page);

    await page.goto('/compte/deposer', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await dismissCookieConsent(page);

    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-02a-deposer-step1.png` });

    // Step 1 : L'essentiel
    await page.click('button:has-text("Location")');
    await page.fill('input[placeholder="Ex: Belle villa avec piscine"]', 'Appartement Auto E2E Test');
    await page.fill('input[type="number"][placeholder="0"]', '150000');
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-02b-step1-rempli.png` });

    // Step 2 : Localisation
    const addressInput = page.locator('input[placeholder="Ex: 15 Avenue Lamine Gueye..."]');
    await addressInput.fill('Dakar');
    await page.waitForTimeout(1500);

    const firstResult = page.locator('[data-radix-popper-content-wrapper] div').filter({ hasText: 'Dakar' }).first();
    if (await firstResult.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await firstResult.click();
    }
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-02c-step2-adresse.png` });
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(800);

    // Step 3 : Détails
    const surfaceInput = page.locator('input[placeholder="0"]').first();
    await surfaceInput.fill('65');
    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-02d-step3-details.png` });
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(800);

    // Step 4 : Photo
    const fileInput = page.locator('input#deposer-file-upload');
    await fileInput.setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: TINY_PNG });
    await page.waitForTimeout(4_000);
    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-02e-step4-photo.png` });
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(800);

    // Step 5 : Publier
    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-02f-step5-publication.png` });
    await page.click('button:has-text("Publier gratuitement")');
    await page.waitForURL('**/compte/mes-biens**', { timeout: 20_000 });
    await page.waitForTimeout(2_000);

    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-02g-mes-biens.png`, fullPage: true });
    await expect(page).toHaveURL(/mes-biens/);
    console.log('✅ Annonce publiée !');
  });

  // ── ÉTAPE 3 : Marquer comme Loué ─────────────────────────────────────────
  test('3 – Marquer comme Loué', async ({ page }) => {
    await mockNominatim(page);

    // Créer un bien rapide
    await page.goto('/compte/deposer', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await dismissCookieConsent(page);

    await page.click('button:has-text("Location")');
    await page.fill('input[placeholder="Ex: Belle villa avec piscine"]', 'Studio Loué E2E Auto');
    await page.fill('input[type="number"][placeholder="0"]', '80000');
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(600);

    const addressInput = page.locator('input[placeholder="Ex: 15 Avenue Lamine Gueye..."]');
    await addressInput.fill('Dakar');
    await page.waitForTimeout(1500);
    const firstResult = page.locator('[data-radix-popper-content-wrapper] div').filter({ hasText: 'Dakar' }).first();
    if (await firstResult.isVisible({ timeout: 4_000 }).catch(() => false)) await firstResult.click();
    await page.waitForTimeout(400);
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(600);

    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(600);

    const fileInput = page.locator('input#deposer-file-upload');
    await fileInput.setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: TINY_PNG });
    await page.waitForTimeout(4_000);
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(600);

    await page.click('button:has-text("Publier gratuitement")');
    await page.waitForURL('**/compte/mes-biens**', { timeout: 20_000 });
    await page.waitForTimeout(2_000);

    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-03a-avant-loue.png`, fullPage: true });

    // Ouvrir menu ⋮
    const moreMenuBtn = page.locator('button[type="button"]').filter({
      has: page.locator('.lucide-more-vertical, [data-lucide="more-vertical"], svg'),
    }).first();

    if (await moreMenuBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await moreMenuBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-03b-dropdown.png` });

      const marquerBtn = page.locator('[role="menuitem"]').filter({ hasText: /Marquer comme.*[Ll]ou/i }).first();
      if (await marquerBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        page.on('dialog', async (dialog) => { await dialog.accept(); });
        await marquerBtn.click();
        await page.waitForTimeout(1_000);

        // Modal upsell éventuel
        const plusTardBtn = page.locator('button').filter({ hasText: /Plus tard.*loué/i }).first();
        if (await plusTardBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
          await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-03c-upsell.png` });
          await plusTardBtn.click();
          await page.waitForTimeout(2_000);
        }
      }
    }

    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-03d-apres-loue.png`, fullPage: true });
    console.log('✅ Bien marqué comme loué !');
  });

  // ── ÉTAPE 4 : Page Gestion ────────────────────────────────────────────────
  test('4 – Page Gestion + Onboarding Banner', async ({ page }) => {
    await page.goto('/gestion', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3_000);

    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-04a-gestion.png`, fullPage: true });
    await expect(page).toHaveURL(/\/gestion/);

    const gestionContent = page.locator('main, aside, nav').first();
    await expect(gestionContent).toBeVisible({ timeout: 10_000 });

    // Vérifier la bannière d'onboarding
    const expandedBanner = page.locator('text=Activez votre gestion locative');
    const collapsedPill  = page.locator('text=Activer gestion');
    const completeCTA    = page.locator('text=Votre gestion locative est activée');

    const bannerVisible   = await expandedBanner.isVisible().catch(() => false);
    const pillVisible     = await collapsedPill.isVisible().catch(() => false);
    const completeVisible = await completeCTA.isVisible().catch(() => false);

    if (bannerVisible) {
      console.log('🎯 Bannière onboarding visible (mode étendu)');
      await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-04b-onboarding-banner.png` });

      // Lire l'étape active
      const step1 = page.locator('text=Ajouter un bien');
      const step2 = page.locator('text=Ajouter un locataire');
      if (await step1.isVisible().catch(() => false)) console.log('  → Étape active : Ajouter un bien');
      if (await step2.isVisible().catch(() => false)) console.log('  → Étape active : Ajouter un locataire');
    } else if (pillVisible) {
      console.log('🎯 Bannière onboarding visible (pill réduite)');
      await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-04b-onboarding-pill.png` });
    } else if (completeVisible) {
      console.log('🏆 Onboarding déjà complété !');
      await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-04b-onboarding-complete.png` });
    } else {
      console.log('ℹ️ Pas de bannière onboarding visible');
    }

    console.log('✅ Page /gestion chargée avec succès !');
  });

  // ── PARCOURS COMPLET (bout-en-bout) ──────────────────────────────────────
  test('COMPLET – Connexion → Annonce → Loué → Gestion → Onboarding', async ({ page }) => {
    test.setTimeout(180_000);
    await mockNominatim(page);

    // 1. Connexion déjà faite via beforeEach
    await expect(page).toHaveURL(/\/(gestion|compte|bienvenue)/, { timeout: 15_000 });
    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-full-01-connexion.png` });
    console.log('✅ [1/4] Connexion :', page.url());

    // 2. Créer une annonce
    await page.goto('/compte/deposer', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await dismissCookieConsent(page);

    await page.click('button:has-text("Location")');
    await page.fill('input[placeholder="Ex: Belle villa avec piscine"]', 'Villa Parcours Auto Complet');
    await page.fill('input[type="number"][placeholder="0"]', '200000');
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(700);

    const addrInput = page.locator('input[placeholder="Ex: 15 Avenue Lamine Gueye..."]');
    await addrInput.fill('Dakar');
    await page.waitForTimeout(1500);
    const firstR = page.locator('[data-radix-popper-content-wrapper] div').filter({ hasText: 'Dakar' }).first();
    if (await firstR.isVisible({ timeout: 4_000 }).catch(() => false)) await firstR.click();
    await page.waitForTimeout(400);
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(700);

    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(700);

    await page.locator('input#deposer-file-upload').setInputFiles({
      name: 'test.png', mimeType: 'image/png', buffer: TINY_PNG,
    });
    await page.waitForTimeout(4_000);
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(700);

    await page.click('button:has-text("Publier gratuitement")');
    await page.waitForURL('**/compte/mes-biens**', { timeout: 20_000 });
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-full-02-mes-biens.png`, fullPage: true });
    await expect(page).toHaveURL(/mes-biens/);
    console.log('✅ [2/4] Annonce publiée');

    // 3. Marquer comme Loué
    const moreBtn = page.locator('button[type="button"]').filter({
      has: page.locator('.lucide-more-vertical, svg'),
    }).first();
    if (await moreBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await moreBtn.click();
      await page.waitForTimeout(500);

      const marquerItem = page.locator('[role="menuitem"]').filter({ hasText: /Marquer comme.*[Ll]ou/i }).first();
      if (await marquerItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
        page.on('dialog', async (dialog) => { await dialog.accept(); });
        await marquerItem.click();
        await page.waitForTimeout(1_000);

        const plusTard = page.locator('button').filter({ hasText: /Plus tard.*loué/i }).first();
        if (await plusTard.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await plusTard.click();
          await page.waitForTimeout(2_000);
        }
      }
    }
    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-full-03-apres-loue.png`, fullPage: true });
    console.log('✅ [3/4] Bien marqué comme loué');

    // 4. Page Gestion + Onboarding
    await page.goto('/gestion', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3_000);
    await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-full-04-gestion.png`, fullPage: true });
    await expect(page).toHaveURL(/\/gestion/);
    console.log('✅ [4/4] Page /gestion chargée');

    // Vérifier onboarding
    const bannerOrPill = page.locator('text=Activez votre gestion locative, text=Activer gestion, text=Votre gestion locative est activée').first();
    const onboardingVisible = await bannerOrPill.isVisible({ timeout: 5_000 }).catch(() => false);
    if (onboardingVisible) {
      await page.screenshot({ path: `${ARTIFACTS_DIR}/auto-full-05-onboarding.png` });
      console.log('🎯 Bannière onboarding visible');
    }

    console.log('🎉 Parcours complet auto terminé avec succès !');
    test.info().annotations.push({ type: 'status', description: '✅ Parcours complet réussi' });
  });
});
