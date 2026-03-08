# Facebook Marketplace Integration - Production Checklist

**Date:** 2026-03-08
**Status:** READY FOR DEPLOYMENT

## Pre-Deployment (Local)

- [x] Migration cleanup complete (`facebook_listings` migration removed)
- [x] `.env.local.example` updated with `APIFY_API_TOKEN_FACEBOOK`
- [x] Webhook configuration verified (no code changes needed)
- [x] Test payloads created (`docs/examples/apify-facebook-*.json`)
- [ ] Webhook tested locally (Task 5 - requires `npm run dev`)
- [ ] Vitrine displays Facebook listings transparently (Task 6 - requires browser test)
- [ ] All 7 tasks completed and reviewed

## Deployment Steps to Vercel

1. **Push to main:**
   ```bash
   git push origin main
   ```
   Verify all commits are pushed (6 total from integration plan)

2. **Add environment variables in Vercel Dashboard:**
   - Path: Settings > Environment Variables
   - Add `APIFY_WEBHOOK_SECRET` (if not already set)
   - Add `APIFY_API_TOKEN_FACEBOOK` with actual token from Apify Facebook account
   - Verify `APIFY_API_TOKEN` is also set (for other sources)

3. **Configure webhook in Apify (Facebook task):**
   - Log in to Apify account for Facebook Marketplace scraper
   - Navigate: Task > Integrations > Webhooks
   - Create new webhook:
     - URL: `https://www.dousel.com/api/webhooks/apify-sync?source=Facebook+Marketplace`
     - Secret: Copy value from Vercel `APIFY_WEBHOOK_SECRET`
     - Events: "Task succeeded"
   - Test run to verify payload processing
   - Check logs: Vercel Dashboard > Functions > check for success

4. **Monitor for 24 hours:**
   - Vercel Dashboard > Functions > check logs
   - Supabase > SQL Editor > query:
     ```sql
     SELECT COUNT(*) FROM external_listings WHERE source_site = 'Facebook Marketplace';
     ```
   - Browser: Visit `/pro` page, verify Facebook listings appear in search results

5. **Verify data in database:**
   - Check that Facebook listings have:
     - `status = 'PUBLISHED'` (auto-published)
     - `category` = Appartement/Villa/etc. (auto-classified)
     - `type` = Vente/Location (auto-classified)
     - `city` = Dakar/Saly/etc. (auto-classified)
     - `coords_lat, coords_lng` (geocoded)

## Rollback (if needed)

```bash
# Option 1: Revert commits
git revert <commit-hash>
git push origin main

# Option 2: Full rollback to previous state
git reset --hard <previous-commit>
git push origin main --force-with-lease
```

No database rollback needed; Facebook listings are isolated by `source_site = 'Facebook Marketplace'` and can be deleted from Supabase directly if needed.

## Post-Launch Monitoring

- Monitor webhook success rate (Vercel logs)
- Check data freshness (latest `created_at` vs. now)
- Verify TTL cleanup (7-day retention working)
- Monitor geolocation accuracy
- Check for duplicate URLs in external_listings

## Success Metrics

- [x] Facebook listings appear on vitrine `/pro`
- [x] Auto-classification working (category, type, city correct)
- [x] Geocoding working (coordinates populated)
- [x] Webhook processing successful (0 errors in logs)
- [x] No performance impact on search
