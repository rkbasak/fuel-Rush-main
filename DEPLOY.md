# 🚀 Fuel Rush — Deployment Guide

> Complete step-by-step guide to deploy Fuel Rush to production.

---

## Prerequisites

- Node.js 18+ (check with `node --version`)
- [Vercel CLI](https://vercel.com/cli) (`npm install -g vercel`)
- Git
- Accounts: Vercel, Supabase, Upstash, Google Cloud, Firebase (optional)

---

## Step 1: Set Up Supabase (Production Database)

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose your region (closest to Bangladesh: Singapore or Mumbai)
4. Set a strong database password — **save this**, you'll need it
5. Wait for the project to provision (~2 minutes)

### 1.2 Get Your Supabase Credentials

1. Go to **Settings → API**
2. Copy these values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code. It bypasses Row Level Security.

### 1.3 Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login
npx supabase login

# Link your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npx supabase db push
```

Or use the Supabase Dashboard → SQL Editor → paste contents of:
```bash
cat supabase/migrations/001_initial_schema.sql
cat supabase/migrations/002_community_engine.sql  # if exists
cat supabase/migrations/002_phase34_ai_rationing.sql  # if exists
cat supabase/migrations/003_notifications.sql  # if exists
```

### 1.4 Enable Row Level Security (RLS)

RLS is already configured in the migrations. Verify in Supabase Dashboard:
- Go to **Database → Schemas → public → Tables**
- Select each table → **Policies**
- Ensure RLS is enabled and policies are active

---

## Step 2: Set Up Upstash Redis

### 2.1 Create a Redis Database

1. Go to [upstash.com](https://upstash.com) and sign up
2. Click **Create Database**
3. Name: `fuel-rush-cache`
4. Region: **Singapore** (closest to Bangladesh)
5. Tier: **Free** (250MB, 10K commands/day — sufficient for beta)
6. Click **Create**

### 2.2 Get Your Redis Credentials

1. In your Upstash database → **REST API** tab
2. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## Step 3: Set Up Google Maps API

### 3.1 Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project: `fuel-rush`
3. Enable billing (required for API access)

### 3.2 Enable Required APIs

Go to **APIs & Services → Library** and enable:
- **Maps JavaScript API** — for the map component
- **Geocoding API** — for address lookup
- **Directions API** — for route planning

### 3.3 Get Your API Key

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → API Key**
3. Copy the key → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### 3.4 Restrict the API Key (Production)

1. Go to your API key → **Edit**
2. **Website restrictions**: Add your production domain (`https://fuelrush.app`) and any preview domains
3. **API restrictions**: Restrict to: Maps JavaScript API, Geocoding API, Directions API
4. Save

---

## Step 4: Set Up Google Gemini AI

### 4.1 Get a Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Go to **API Keys → Create API Key**
4. Copy the key → `GEMINI_API_KEY`

### 4.2 Test the Key

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

You should get a valid JSON response.

---

## Step 5: Set Up Firebase (Optional — Push Notifications)

### 5.1 Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name: `fuel-rush`
3. Disable Google Analytics (optional for beta)
4. Click **Create project**

### 5.2 Register an Android App

1. In Firebase console → **Project Settings → General**
2. Click **Add app → Android**
3. Package name: `com.fuelrush.bd`
4. Debug signing key: leave empty for now
5. Click **Register app**

### 5.3 Download Configuration

1. Download `google-services.json`
2. Place it at: `android/app/google-services.json`

### 5.4 Enable FCM

1. Go to **Messaging** in Firebase console
2. Click **Create your first campaign** (or skip for now)
3. Copy these from **Project Settings → General → Your apps**:
   - Web API Key → `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

### 5.5 Get Firebase Config

From **Project Settings → General → Your apps → Web app** (or Android):
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
```

---

## Step 6: Deploy to Vercel

### 6.1 Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
cd fuel-Rush
vercel

# Follow the prompts:
# - Set up and deploy? → Y
# - Which scope? → your personal/account
# - Link to existing project? → N
# - Project name? → fuel-rush
# - Directory? → ./
# - Override settings? → N

# Deploy to production
vercel --prod
```

### 6.2 Option B: GitHub Integration

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/fuel-Rush.git
   git push -u origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo: `YOUR_USERNAME/fuel-Rush`
4. Vercel auto-detects Next.js — confirm settings
5. Add environment variables (see below)
6. Click **Deploy**

### 6.3 Add Environment Variables on Vercel

In Vercel dashboard → your project → **Settings → Environment Variables**:

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production, Preview, Development |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `AIza...` | Production, Preview, Development |
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | Production, Preview, Development |
| `UPSTASH_REDIS_REST_TOKEN` | `...` | Production, Preview, Development |
| `GEMINI_API_KEY` | `AIza...` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `...` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `...firebaseapp.com` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `fuel-rush` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `...` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `...` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | `...` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://fuelrush.vercel.app` | Production, Preview, Development |

### 6.4 Custom Domain (Optional)

1. In Vercel → **Settings → Domains**
2. Add `fuelrush.app` (or your domain)
3. Add the TXT record to your DNS provider
4. Wait for verification (~5 minutes)
5. Update `NEXT_PUBLIC_APP_URL` to your domain

---

## Step 7: Post-Deployment Verification

### 7.1 Smoke Test Checklist

After deploying, verify each of these:

- [ ] **Home page loads** — Map renders without errors
- [ ] **Station markers appear** — At least some stations visible on map
- [ ] **Station list works** — `/main/stations` page loads
- [ ] **Report submission** — Can submit a fuel status report
- [ ] **Ration tracker** — `/main/ration` page loads
- [ ] **AI chat** — `/main/map` → 💬 button opens chat
- [ ] **Auth flow** — Login page renders

### 7.2 Check for Console Errors

1. Open browser DevTools → Console
2. Navigate through the app
3. Look for: `Error:`, `Failed to fetch`, `AxiosError`, CORS issues

### 7.3 Verify API Endpoints

```bash
# Check station endpoint
curl https://fuelrush.vercel.app/api/stations | jq '.data | length'

# Should return station count (or empty array if no data seeded)

# Check heartbeat
curl -X POST https://fuelrush.vercel.app/api/heartbeat | jq '.status'
```

### 7.4 Test Database Connection

In Supabase Dashboard → SQL Editor:
```sql
SELECT COUNT(*) FROM stations;
-- Should return 0 (or seeded count if you ran seed-data.ts)

SELECT COUNT(*) FROM reports;
-- Should return 0
```

---

## Step 8: Seed Initial Data (Beta Testing)

```bash
# Clone and install
gh repo clone adnanizaman-star/fuel-Rush
cd fuel-Rush
npm install

# Copy production env vars to .env.local
# (use your production Supabase credentials)

# Run the seeder
npx tsx scripts/seed-data.ts
```

This will create:
- 30 stations across Dhaka
- 10 test users
- Historical reports
- Sample ration logs

---

## Step 9: Android APK (Optional)

### 9.1 Build Web App

```bash
npm run build
```

### 9.2 Sync to Android

```bash
npx cap sync android
```

### 9.3 Build APK

```bash
cd android
./gradlew assembleRelease
# or ./gradlew assembleDebug for debug build
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`.

### 9.4 Sign APK (For Play Store)

See the [Android developer docs](https://developer.android.com/studio/publish/app-signing) for signing configuration.

---

## Troubleshooting

### "Cannot connect to Supabase"

- Check `NEXT_PUBLIC_SUPABASE_URL` is correct (includes `https://`)
- Verify RLS policies allow anonymous read access
- Check Supabase project status (may be paused if no activity)

### "Google Maps not loading"

- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is correct
- Check API key restrictions don't block your domain
- Ensure Maps JavaScript API is enabled in Google Cloud Console

### "Redis connection failed"

- Check `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Verify Upstash database is in **Singapore** region
- Check if free tier rate limit hit (wait 24h or upgrade)

### "Gemini API errors"

- Check `GEMINI_API_KEY` is valid and not expired
- Verify billing is enabled on Google Cloud (required for Gemini)
- Check quota: Gemini free tier = 15 req/min, 1.5M tokens/min

### "App crashes on station report"

- Check RLS policy on `stations` table allows UPDATE
- Verify `reports` INSERT policy is correct
- Check `SUPABASE_SERVICE_ROLE_KEY` is not being used in client code

---

## Production Checklist

Before going live:

- [ ] All environment variables set on Vercel
- [ ] Database migrations applied
- [ ] API key restrictions configured
- [ ] Custom domain configured (optional)
- [ ] Google Maps API key restricted to your domain
- [ ] Supabase RLS policies verified
- [ ] Firebase FCM working (if enabled)
- [ ] Initial data seeded
- [ ] Tested on mobile device
- [ ] Error monitoring set up (e.g., Sentry)
- [ ] Analytics configured (e.g., Vercel Analytics)

---

## Other Hosting Options

Looking for alternatives to Vercel? Here are your options:

| Platform | Notes |
|----------|-------|
| **BTpanel (VPS)** | Popular in Bangladesh/China. Deploy static `out/` folder via nginx. See [BTPANEL.md](./BTPANEL.md) for step-by-step guide. |
| **Self-hosted (Docker)** | Full control. See [SELF_HOST.md](./SELF_HOST.md). |

---

## Useful Links

| Resource | URL |
|----------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Supabase Dashboard | https://supabase.com/dashboard |
| Upstash Console | https://console.upstash.com |
| Google Cloud Console | https://console.cloud.google.com |
| Firebase Console | https://console.firebase.google.com |
| Gemini API Docs | https://ai.google.dev/docs |
| Fuel Rush Repo | https://github.com/adnanizaman-star/fuel-Rush |

---

_Deploying Fuel Rush? Questions? Open an issue at [github.com/adnanizaman-star/fuel-Rush/issues](https://github.com/adnanizaman-star/fuel-Rush/issues)_
