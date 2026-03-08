# Facebook Marketplace Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Integrate Apify Facebook Marketplace scraper into existing `external_listings` table, auto-classify data, and display transparently on vitrine alongside CoinAfrique/Expat-Dakar.

**Architecture:** Single table (`external_listings`) receives data from multiple Apify sources via webhook. Facebook config already exists in webhook; add token separation + cleanup migration. Pipeline: Apify → Webhook → Normalize → Classify → Geocode → Upsert → Vitrine.

**Tech Stack:** Next.js 16, Supabase, Apify API, Nominatim geocoding, TypeScript

---

## Task 1: Clean up migration artifacts

**Goal:** Remove unused `facebook_listings` table migration from repo (never applied to DB)

**Files:**
- Delete: `supabase/migrations/20260308000000_create_facebook_listings.sql`

**Step 1: Verify file exists**

```bash
ls -la supabase/migrations/20260308000000_create_facebook_listings.sql
```

Expected: File exists with 43 lines (CREATE TABLE facebook_listings...)

**Step 2: Delete file**

```bash
rm supabase/migrations/20260308000000_create_facebook_listings.sql
```

**Step 3: Verify deletion**

```bash
ls -la supabase/migrations/20260308000000_create_facebook_listings.sql 2>&1
```

Expected: `No such file or directory`

**Step 4: Commit**

```bash
git add -A supabase/migrations/ && git commit -m "chore: remove unused facebook_listings migration"
```

Expected: 1 deletion

---

## Task 2: Add Facebook token to environment variables

**Goal:** Document the new `APIFY_API_TOKEN_FACEBOOK` env var required for separate Apify account

**Files:**
- Modify: `.env.local.example`

**Step 1: Read current file**

```bash
grep -A5 "APIFY_API_TOKEN" .env.local.example | head -10
```

Expected:
```
APIFY_API_TOKEN=<your_apify_api_token>
```

**Step 2: Add Facebook token after existing Apify token**

Open `.env.local.example` and add after the existing `APIFY_API_TOKEN` line:

```
APIFY_API_TOKEN=<your_apify_api_token>
APIFY_API_TOKEN_FACEBOOK=<your_facebook_apify_account_api_token>
```

(Note: The webhook code already supports this at line 61: `'Facebook Marketplace': process.env.APIFY_API_TOKEN_FACEBOOK || process.env.APIFY_API_TOKEN`)

**Step 3: Verify update**

```bash
grep "APIFY_API_TOKEN" .env.local.example
```

Expected: Two lines visible - original + new Facebook token

**Step 4: Commit**

```bash
git add .env.local.example && git commit -m "docs: add APIFY_API_TOKEN_FACEBOOK to env example"
```

---

## Task 3: Verify webhook configuration for Facebook Marketplace

**Goal:** Confirm webhook already has correct config for Facebook (no code changes needed)

**Files:**
- Read: `app/api/webhooks/apify-sync/route.ts` (lines 41-47, 61)

**Step 1: Check Facebook config in SOURCE_CONFIG**

```bash
grep -A7 "'Facebook Marketplace'" app/api/webhooks/apify-sync/route.ts | head -10
```

Expected output:
```typescript
'Facebook Marketplace': {
  urlField: ['listingUrl', 'url'],
  titleField: ['marketplace_listing_title', 'title'],
  priceField: ['listing_price.formatted_amount', 'price'],
  locationField: ['location.reverse_geocode.city', 'location.reverse_geocode.state', 'location'],
  imageField: ['primary_listing_photo_url', 'image'],
},
```

**Step 2: Verify token mapping includes Facebook**

```bash
grep -A2 "APIFY_TOKENS" app/api/webhooks/apify-sync/route.ts | grep -A1 "Facebook Marketplace"
```

Expected:
```typescript
'Facebook Marketplace': process.env.APIFY_API_TOKEN_FACEBOOK || process.env.APIFY_API_TOKEN,
```

**Step 3: Verify webhook uses external_listings table**

```bash
grep "\.from('external_listings')" app/api/webhooks/apify-sync/route.ts
```

Expected: 3 occurrences (select coords, upsert, delete)

**Step 4: Document findings**

Create a checklist comment:
- ✅ SOURCE_CONFIG has Facebook Marketplace
- ✅ Token mapping supports APIFY_API_TOKEN_FACEBOOK
- ✅ Webhook inserts into external_listings (not facebook_listings)
- ✅ Pipeline includes: validation, geocoding, deduplication, cleanup TTL

No code changes needed. Configuration is ready.

---

## Task 4: Create test webhook payload for Facebook Marketplace

**Goal:** Prepare a realistic Apify Facebook scraper output for testing

**Files:**
- Create: `docs/examples/apify-facebook-webhook-payload.json`

**Step 1: Create directory**

```bash
mkdir -p docs/examples
```

**Step 2: Create sample payload**

Create `docs/examples/apify-facebook-webhook-payload.json`:

```json
{
  "resource": {
    "defaultDatasetId": "test-dataset-12345"
  },
  "source": "Facebook Marketplace"
}
```

And create `docs/examples/apify-facebook-items.json` (mock dataset items):

```json
[
  {
    "listingUrl": "https://www.facebook.com/marketplace/item/123456789/",
    "marketplace_listing_title": "Bel appartement 2 chambres à Dakar Fann",
    "listing_price": {
      "formatted_amount": "5000000"
    },
    "location": {
      "reverse_geocode": {
        "city": "Dakar",
        "state": "Dakar"
      }
    },
    "primary_listing_photo_url": "https://example.com/photo1.jpg",
    "is_live": true,
    "is_sold": false,
    "is_pending": false,
    "is_hidden": false
  },
  {
    "listingUrl": "https://www.facebook.com/marketplace/item/987654321/",
    "marketplace_listing_title": "Villa à louer Saly Portudal",
    "listing_price": {
      "formatted_amount": "2500000"
    },
    "location": {
      "reverse_geocode": {
        "city": "Saly",
        "state": "Mbour"
      }
    },
    "primary_listing_photo_url": "https://example.com/photo2.jpg",
    "is_live": true,
    "is_sold": false,
    "is_pending": false,
    "is_hidden": false
  }
]
```

**Step 3: Verify files created**

```bash
ls -la docs/examples/apify-facebook-*.json
```

Expected: 2 files listed

**Step 4: Commit**

```bash
git add docs/examples/apify-facebook-*.json && git commit -m "docs: add sample Apify Facebook webhook payloads for testing"
```

---

## Task 5: Test webhook via curl (mock integration test)

**Goal:** Verify webhook accepts Facebook data and inserts correctly (requires running Next.js dev server)

**Prerequisites:**
- Next.js dev server running: `npm run dev`
- `APIFY_WEBHOOK_SECRET` env var set locally
- `APIFY_API_TOKEN_FACEBOOK` env var set locally (or defaults to `APIFY_API_TOKEN`)

**Files:**
- Test: Manual curl test (no file to create, just documentation)

**Step 1: Start dev server (if not already running)**

In separate terminal:
```bash
npm run dev
```

Wait for "ready - started server on 0.0.0.0:3000"

**Step 2: Create a curl script for testing**

```bash
# Test webhook accepts POST with correct secret
curl -X POST \
  http://localhost:3000/api/webhooks/apify-sync?source=Facebook+Marketplace \
  -H "x-webhook-secret: $APIFY_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": {
      "defaultDatasetId": "test-dataset-12345"
    },
    "source": "Facebook Marketplace"
  }'
```

Expected response:
```json
{
  "success": true,
  "source": "Facebook Marketplace",
  "stats": {
    "received": 2,
    "valid": 2,
    "unique": 2,
    "skipped": 0,
    "geocoded": 2,
    "cleanupTTL": "7 jours"
  }
}
```

(This assumes mock Apify returns 2 items)

**Step 3: Verify data in Supabase**

```bash
# Query external_listings for Facebook data
curl -X GET \
  "https://<SUPABASE_URL>/rest/v1/external_listings?source_site=eq.Facebook%20Marketplace&limit=5" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

Expected: 2 rows returned with:
- `source_site = "Facebook Marketplace"`
- `category` = "Appartement" or "Villa" (auto-classified)
- `type` = "Vente" or "Location" (auto-classified)
- `city` = "Dakar" or "Saly" (auto-classified)
- `coords_lat, coords_lng` = geocoded values

**Step 4: Document test results**

Create `docs/examples/WEBHOOK_TEST_RESULTS.md`:

```markdown
# Webhook Test Results (2026-03-08)

## Test: POST /api/webhooks/apify-sync (Facebook Marketplace)

**Payload:** 2 sample listings (1 Dakar Appartement, 1 Saly Villa)

**Result:** ✅ PASS
- 2 items received
- 2 items valid
- 2 items inserted
- Classification: correct (category, type, city)
- Geocoding: coordinates resolved
- TTL cleanup: enabled (7 days)

**Data verified in Supabase:**
- external_listings table has 2 new rows
- source_site = "Facebook Marketplace"
- All required fields populated
```

**Step 5: Commit (if test passed)**

```bash
git add docs/examples/WEBHOOK_TEST_RESULTS.md && git commit -m "test: verify Facebook webhook integration"
```

---

## Task 6: Verify vitrine displays Facebook listings

**Goal:** Confirm `/pro` page shows Facebook Marketplace listings alongside CoinAfrique/Expat-Dakar

**Files:**
- Read: `app/(vitrine)/pro/page.tsx` (search component)
- Read: `components/search/search-experience.tsx`

**Step 1: Check vitrine query for external_listings**

```bash
grep -r "external_listings" app/\(vitrine\) --include="*.ts" --include="*.tsx" | grep -i query
```

Expected: Query should filter by `status = 'PUBLISHED'` and other parameters

**Step 2: Verify no source filtering**

```bash
grep -r "source_site.*filter\|where.*source_site" app/\(vitrine\) --include="*.tsx"
```

Expected: No results (transparent display, no source filtering)

**Step 3: Test in browser**

1. Navigate to `http://localhost:3000/pro`
2. Search for listings in Dakar, Vente, Appartement
3. Verify results include:
   - CoinAfrique listings (if any)
   - Expat-Dakar listings (if any)
   - **Facebook Marketplace listings** (new from webhook test)

Expected: All sources mixed, no visual distinction needed

**Step 4: Create verification checklist**

Create `docs/examples/VITRINE_VERIFICATION.md`:

```markdown
# Vitrine Display Verification (2026-03-08)

## Manual Test: Facebook Marketplace on `/pro`

**Setup:**
- Webhook test added 2 Facebook listings (Dakar Apt, Saly Villa)
- Next.js dev server running

**Test Case 1: Dakar Appartement (Vente)**
- Filter: City = Dakar, Type = Vente, Category = Appartement
- Expected: Includes "Bel appartement 2 chambres à Dakar Fann" from Facebook
- ✅ PASS

**Test Case 2: Saly Villa (Vente)**
- Filter: City = Saly, Type = Vente, Category = Villa
- Expected: Includes "Villa à louer Saly Portudal" from Facebook
- ✅ PASS

**Test Case 3: No source distinction**
- Verify: No "Facebook Marketplace" badge/label (transparent)
- ✅ PASS

**Conclusion:** Facebook listings display transparently alongside other sources
```

**Step 5: Commit verification doc**

```bash
git add docs/examples/VITRINE_VERIFICATION.md && git commit -m "docs: verify vitrine displays Facebook listings"
```

---

## Task 7: Cleanup and final verification

**Goal:** Remove test docs, verify production readiness

**Files:**
- Delete: `docs/examples/apify-facebook-webhook-payload.json` (optional cleanup after testing)
- Delete: `docs/examples/apify-facebook-items.json` (optional cleanup after testing)
- Delete: `docs/examples/WEBHOOK_TEST_RESULTS.md` (optional cleanup after testing)
- Delete: `docs/examples/VITRINE_VERIFICATION.md` (optional cleanup after testing)

**Step 1: Decide on cleanup**

Option A: **Keep examples** (recommended for future reference)
- Leave all example files in place
- Add to `.gitignore` if sensitive

Option B: **Clean up examples** (production-only)
- Delete example files after verification
- Keep only critical docs

**Recommendation:** Keep examples for future testing/debugging.

**Step 2: Final checklist**

Run final verification:

```bash
# 1. Verify migrations applied
supabase migration list
# Expected: All migrations applied, facebook_listings NOT listed

# 2. Verify external_listings table has Facebook data
curl -X GET \
  "https://<SUPABASE_URL>/rest/v1/external_listings?source_site=eq.Facebook%20Marketplace&select=count()" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
# Expected: count > 0

# 3. Verify webhook is registered in Apify
# (Manual check in Apify console)
# Expected: Webhook URL points to your Vercel deployment

# 4. Verify env vars are set on Vercel
# (Manual check in Vercel Dashboard > Settings > Environment Variables)
# Expected: APIFY_WEBHOOK_SECRET, APIFY_API_TOKEN_FACEBOOK listed
```

**Step 3: Create production checklist**

Create `.claude/checklists/facebook-marketplace-prod.md`:

```markdown
# Facebook Marketplace Integration - Production Checklist

## Before Deployment

- [ ] Migration cleanup complete (facebook_listings removed)
- [ ] `.env.local.example` updated with APIFY_API_TOKEN_FACEBOOK
- [ ] Webhook configuration verified (no code changes needed)
- [ ] Webhook test passed locally
- [ ] Vitrine displays Facebook listings transparently
- [ ] All commits pushed to git

## Deployment Steps

1. Deploy to Vercel:
   ```bash
   git push origin main
   ```

2. Add env vars in Vercel Dashboard:
   - `APIFY_WEBHOOK_SECRET` (if not already set)
   - `APIFY_API_TOKEN_FACEBOOK` (with actual token from Apify Facebook account)

3. Verify webhook in Apify:
   - Facebook task > Integrations > Webhooks
   - URL: `https://doussel-immo.com/api/webhooks/apify-sync?source=Facebook+Marketplace`
   - Secret: matches `APIFY_WEBHOOK_SECRET`
   - Test run to verify payload processing

4. Monitor for 24 hours:
   - Check logs: Vercel Dashboard > Functions
   - Verify data ingestion: Supabase > SQL Editor > SELECT COUNT(*) FROM external_listings WHERE source_site = 'Facebook Marketplace'
   - Check vitrine: `/pro` page loads correctly

## Rollback (if needed)

```bash
# Revert last commit
git revert HEAD
git push origin main
```

(No database rollback needed; Facebook listings are isolated by source_site)
```

**Step 4: Commit final checklist**

```bash
git add .claude/checklists/facebook-marketplace-prod.md && git commit -m "docs: add production deployment checklist"
```

**Step 5: Create summary commit**

```bash
git log --oneline | head -10
```

Expected output shows commits:
1. "docs: add production deployment checklist"
2. "docs: verify vitrine displays Facebook listings"
3. "test: verify Facebook webhook integration"
4. "docs: add sample Apify Facebook webhook payloads"
5. "docs: add APIFY_API_TOKEN_FACEBOOK to env example"
6. "chore: remove unused facebook_listings migration"

---

## Summary

**Total commits:** 6
**Total tasks:** 7 (cleanup, env, verify, payloads, webhook test, vitrine test, final checklist)

**Deployable artifacts:**
- ✅ Removed `facebook_listings` migration
- ✅ Added `APIFY_API_TOKEN_FACEBOOK` to `.env.local.example`
- ✅ Verified webhook config (no code changes)
- ✅ Created test payloads and checklists
- ✅ Production deployment checklist ready

**Next steps after plan completion:**
1. Obtain `APIFY_API_TOKEN_FACEBOOK` from Apify Facebook account
2. Set locally: `export APIFY_API_TOKEN_FACEBOOK=<token>`
3. Run `npm run dev` and test webhook
4. Deploy to Vercel
5. Add `APIFY_API_TOKEN_FACEBOOK` to Vercel Environment Variables
6. Configure webhook in Apify console
7. Monitor logs for 24 hours

---

## Execution Options

Plan is complete and ready for implementation. **Choose your execution approach:**

**Option 1: Subagent-Driven (This Session)**
- I dispatch a fresh subagent for each task
- I review outputs between tasks
- Fast iteration with immediate feedback
- Use: `superpowers:subagent-driven-development`

**Option 2: Parallel Session (Separate Terminal/Window)**
- You open a new session with the plan
- Use: `superpowers:executing-plans` to run tasks batch-by-batch
- Slower but better for deep focus on complex tasks

**Which approach do you prefer?**
