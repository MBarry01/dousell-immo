import { Page, BrowserContext } from '@playwright/test';

const SUPABASE_URL = 'https://blyanhulvwpdfpezlaji.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJseWFuaHVsdndwZGZwZXpsYWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTAxNzcsImV4cCI6MjA3OTEyNjE3N30.BipETw-82pyGH1ESn9b4I00A0_gWUmDE-xw_mEdlhNw';
const PROJECT_REF = 'blyanhulvwpdfpezlaji';
const CHUNK_SIZE = 3600;

/**
 * Login via Supabase REST API (bypasses captcha entirely).
 * Sets session cookies directly so SSR picks them up on the next navigation.
 */
export async function loginViaAPI(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  // 1. Get session tokens from Supabase auth REST API
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  });

  const session = await res.json();

  if (!session.access_token) {
    throw new Error(`E2E login failed for ${email}: ${JSON.stringify(session)}`);
  }

  // 2. Inject session cookies as @supabase/ssr expects
  await injectSupabaseSession(page.context(), session);

  // 3. Navigate to dashboard (SSR reads cookies on server-side render)
  await page.goto('/gestion', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
}

/**
 * Injects Supabase session into browser context cookies.
 * Mirrors the chunking logic from @supabase/ssr.
 */
async function injectSupabaseSession(
  context: BrowserContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: Record<string, any>,
): Promise<void> {
  const cookieName = `sb-${PROJECT_REF}-auth-token`;
  const sessionStr = JSON.stringify(session);

  // Split into chunks if session string is too large for a single cookie
  const numChunks = Math.ceil(sessionStr.length / CHUNK_SIZE);

  const cookies = Array.from({ length: numChunks }, (_, i) => ({
    name: numChunks === 1 ? cookieName : `${cookieName}.${i}`,
    value: sessionStr.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax' as const,
  }));

  await context.addCookies(cookies);
}

/**
 * Set localStorage activation-stage for sidebar badge testing.
 */
export async function setActivationStage(page: Page, stage: number): Promise<void> {
  await page.evaluate((s) => {
    localStorage.setItem('activation-stage', String(s));
    window.dispatchEvent(new CustomEvent('activation-stage-changed', { detail: s }));
  }, stage);
}
