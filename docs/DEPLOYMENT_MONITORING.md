# Deployment & Monitoring Checklist

> **Status** : Pre-deployment configuration | **Target** : Production (www.dousel.com)

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables ✅
**Verify in Vercel Dashboard** → Settings → Environment Variables

```bash
# SEO & Analytics
NEXT_PUBLIC_POSTHOG_KEY=xxxxx          # ✅ Already set
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com  # ✅ Already set
NEXT_PUBLIC_SITE_URL=https://www.dousel.com     # ✅ Verify

# Core (already configured)
NEXT_PUBLIC_SUPABASE_URL=xxxxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

### 2. Build Verification ✅
```bash
npm run build
# ✅ PASSED : 132 pages generated
# ✅ PASSED : TypeScript compilation clean
# ✅ PASSED : No errors/warnings
```

### 3. Database Migrations ✅
```
Supabase Migrations Applied:
✅ Districts table (20260307)
✅ SEO RPC functions
✅ Property indexes
```

---

## 🔍 Google Search Console Setup (BEFORE Indexing)

### Step 1: Add Property
```
1. Go to https://search.google.com/search-console
2. Click "+ Select a property"
3. Choose "URL prefix" method
4. Enter: https://www.dousel.com
5. Verify ownership (DNS/HTML file method - use existing)
```

### Step 2: Submit Sitemap
```
1. In Search Console left menu → Sitemaps
2. Click "Add/test sitemap"
3. Enter: https://www.dousel.com/sitemap.xml
4. Click "Submit"

✅ Status should show "Success" within 1-2 hours
```

### Step 3: Initial Settings
```
1. Settings → Target audience → Country = Senegal
2. Settings → Crawl stats → Monitor crawl demand
3. Coverage → Monitor "Valid", "Excluded", "Error" counts
```

### Step 4: Monitor First Week
| Day | Action | Expected |
|-----|--------|----------|
| **Day 0** | Submit sitemap | 1-2 errors (normal) |
| **Day 1** | Check crawl stats | 100+ URLs crawled |
| **Day 2** | Verify indexing | 50+ indexed |
| **Day 3** | Check mobile usability | All pages pass |
| **Day 7** | Review performance | 100+ impressions |

---

## 📊 Analytics Setup

### 1. Vercel Analytics ✅
```
Already integrated via:
- Web Vitals auto-tracking
- Performance monitoring
- Deploy analytics

No additional setup needed.
```

### 2. PostHog Analytics ✅
**Events being tracked automatically**:

```typescript
// Page views (all 4-tier routes)
seo_page_view:
  - city: "dakar"
  - district: "plateau"
  - type: "appartement"
  - url: "/immobilier/dakar/plateau/appartement"

// Property interactions
property_click:
  - property_id: "uuid-123"
  - source: "immobilier_dakar_plateau"
```

**Access PostHog Dashboard**:
```
1. Go to https://app.posthog.com
2. Project → Doussel Immo
3. Events → seo_page_view / property_click
4. Insights → Trends (daily/weekly)
```

### 3. Custom Google Analytics Events (Optional)
If you want Google Analytics integration in future, add to `.env.local`:
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX  # Your GA4 ID
```

---

## 🎯 Monitoring Strategy (First Month)

### Week 1: Indexing
**Goal**: Get 100+ pages indexed by Google

**Actions**:
- [ ] Submit sitemap daily for first 3 days
- [ ] Check GSC Coverage tab daily
- [ ] Request indexing for top 10 pages manually
- [ ] Monitor crawl stats

**Success metrics**:
- Indexed pages: 50+ (by Day 7)
- Crawl errors: <5%
- Mobile usability: 100% pass

### Week 2-4: Rankings & Traffic
**Goal**: Start seeing impressions in GSC

**Actions**:
- [ ] Monitor GSC Performance tab daily
- [ ] Check top queries and clicks
- [ ] Identify low CTR pages (>4 position) and optimize titles
- [ ] Monitor PostHog page views
- [ ] Check Core Web Vitals in Vercel

**Success metrics**:
- Impressions: 1,000-5,000
- Avg position: 5-8
- CTR: 1-2%
- Bounce rate: <60%

### Month 2-3: Optimization
**Goal**: Improve rankings for target keywords

**Actions**:
- [ ] Analyze top performing districts (analytics)
- [ ] Add internal links from high-traffic to low-traffic pages
- [ ] Monitor for "People also ask" snippets
- [ ] Optimize FAQs based on search trends
- [ ] Review price trends accuracy

---

## 📈 KPIs to Track

### Search Console (Daily)
```
Dashboard:
├─ Total clicks: Should grow 50-100/week initially
├─ Total impressions: Should grow 500-1000/week
├─ Average position: Target move from 7→4 over 3 months
├─ Average CTR: Target 3-5% (vs 1-2% before)
└─ Mobile usability: Should stay 100%

Coverage:
├─ Valid: Target 130+
├─ Excluded: Normal (mark as success)
└─ Errors: Should be <5
```

### Analytics (Weekly)
```
Organic traffic:
├─ Sessions: Growth trajectory
├─ Users: New vs returning
├─ Bounce rate: Target <50%
├─ Avg session duration: Target >2 min
└─ Conversion rate: Leads from organic

Top pages:
├─ /immobilier
├─ /immobilier/dakar
├─ /immobilier/dakar/plateau
└─ /immobilier/dakar/plateau/appartement (expected)
```

### PostHog (Weekly)
```
Events:
├─ seo_page_view: Count by city/district/type
├─ property_click: Count by property
├─ Funnel: page_view → property_click conversion
└─ Retention: Return visits to same pages
```

---

## 🚨 Common Issues & Fixes

### Issue: Pages not indexing (Week 1)
**Symptoms**: Sitemap submitted but 0 indexed pages after 48h

**Fixes**:
1. Check robots.txt not blocking (✅ already checked)
2. Check meta robots not `noindex` (✅ already checked)
3. Check URL is accessible (no 404s)
4. Manual request indexing in GSC
5. Check server connectivity

### Issue: Low CTR despite good ranking (Week 2)
**Symptoms**: Position 3 but CTR <1%

**Fixes**:
1. Optimize title tag (add keyword at start)
2. Improve meta description (add CTA or stat)
3. Add schema markup (already done ✅)
4. Review OpenGraph image quality

### Issue: High bounce rate
**Symptoms**: Users land but leave immediately

**Fixes**:
1. Check page load speed (target <3s)
2. Ensure content matches search intent
3. Add "above the fold" CTAs
4. Improve mobile experience

---

## 🔗 Quick Links for Monitoring

| Tool | URL | Purpose |
|------|-----|---------|
| **Google Search Console** | https://search.google.com/search-console | Indexing, rankings, clicks |
| **Google Analytics** | https://analytics.google.com | Traffic, behavior, conversions |
| **Vercel Dashboard** | https://vercel.com/dashboard | Deployment, metrics, logs |
| **PostHog** | https://app.posthog.com | User events, funnels, cohorts |
| **Supabase** | https://app.supabase.com | Database, logs, monitoring |
| **Cloudinary** | https://cloudinary.com/console | Image optimization, usage |

---

## 📞 Deployment Day Checklist

**Before deploying to production** :

### Code & Build
- [ ] Build passes locally (`npm run build`)
- [ ] All tests pass (`npx playwright test`)
- [ ] Lint clean (`npm run lint`)
- [ ] Git status clean (`git status`)

### Environment
- [ ] All env vars in Vercel Dashboard
- [ ] Supabase migrations applied
- [ ] PostHog project ID correct
- [ ] Cloudinary token valid

### SEO & Content
- [ ] robots.txt correct (`allow /immobilier`)
- [ ] sitemap.xml generates (check locally)
- [ ] meta tags populated (check 1 page)
- [ ] JSON-LD schemas valid (check 1 page)
- [ ] District guides loaded (check 1 district)

### Monitoring
- [ ] Google Search Console property created
- [ ] Sitemap URL prepared for submission
- [ ] PostHog dashboard accessible
- [ ] Vercel analytics enabled
- [ ] Google Analytics (if using) configured

### DNS & Domain
- [ ] Domain points to Vercel (CNAME/A records)
- [ ] SSL certificate active
- [ ] Domain in NEXT_PUBLIC_SITE_URL

---

## ✅ Deployment Steps

```bash
# 1. Final push
git push origin master

# 2. Vercel auto-deploys (monitor in dashboard)
# 3. Wait for deployment complete (5-10 min)

# 4. Verify production
curl https://www.dousel.com/immobilier
# Should return 200 with full HTML

# 5. Check meta tags
curl https://www.dousel.com/immobilier/dakar | grep "og:title"

# 6. Submit sitemap to GSC
# (manual step in Google Search Console)
```

---

## 📊 Success Criteria

**Day 1** (Deployment):
- ✅ Site loads without errors
- ✅ All 4-tier routes return 200
- ✅ Meta tags present

**Week 1** (Indexing):
- ✅ Sitemap submitted
- ✅ 50+ pages indexed
- ✅ 0-1% crawl errors

**Month 1** (Traffic):
- ✅ 1,000+ impressions in GSC
- ✅ 50-100 clicks from organic
- ✅ Avg position < 8

**Month 3** (Growth):
- ✅ 10,000+ monthly impressions
- ✅ Position 2-4 for target keywords
- ✅ 500+ monthly organic clicks
- ✅ 20-30 leads from organic

---

**Ready to Deploy!** 🚀
